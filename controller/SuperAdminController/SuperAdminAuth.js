const jwt = require("jsonwebtoken"); // For creating tokens
const { pool } = require("../../db");
const { sendEmail } = require("../../util/nodemailerService");

exports.super_adminsingin = async (req, res) => {
  // first it will find admin in the database
  // if first time admin is not verified it will
  // send the email verification and then it will
  // and the second time it will not send any
  // email verification if admin is verified.
  let conection = await pool.getConnection();
  try {
    let email = req.body.email;
    let password = req.body.password;
    let role = req.body.role;
    let [rows] = await conection.query(
      "SELECT * FROM admin where email=? AND password=? AND role=?",
      [email, password, role]
    );
    if (rows.length === 0) {
      res.json({
        success: false,
        message: "Wrong Credentials!",
      });
      return;
    } else if (
      rows[0].email === email &&
      rows[0].password === password &&
      rows[0].verified === 0
    ) {
      // send a confimation email.
      let message = sendEmail(email, rows[0].id, "ADMIN");
      if (message === "email sent") {
        res.json({
          success: true,
          message: "confirmEmail",
        });
      } else if (message === "email sent failed") {
        res.json({
          success: false,
          message: "Email sent failed.",
        });
      }
    } else if (
      rows[0].email === email &&
      rows[0].password === password &&
      rows[0].verified === 1
    ) {
      // if email is confirmed
      const token = jwt.sign(
        { adminId: rows[0].id },
        process.env.Jwt_Secret_Super_Admin,
        {
          expiresIn: "12h",
        }
      );

      res.json({
        success: true,
        email,
        token,
        message: "successLogin",
      });
      console.log("rows.length", rows.length);
    }
  } catch (error) {
    console.log(`error during sigin the data ${error}`);
    console.log(error);
  } finally {
    conection.release();
  }
};

exports.super_emailVerification = async (req, res) => {
  let conection = await pool.getConnection();
  const adminId = req.params.id;
  console.log("adminId", adminId);
  try {
    let [rows] = await conection.query(
      "UPDATE admin SET verified=? WHERE id=?",
      [true, adminId]
    );

    res.send("Your Email has been confirmed! Please Go Login.");
  } catch (error) {
    console.log(error);
    res.json({
      success: false,
      message: "Email not confirmed",
    });
  } finally {
    conection.release();
  }
};
