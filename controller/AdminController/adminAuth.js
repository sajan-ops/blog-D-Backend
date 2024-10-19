const jwt = require("jsonwebtoken"); // For creating tokens
const { pool } = require("../../db");
const { sendEmail } = require("../../util/nodemailerService");

exports.adminsingin = async (req, res) => {
  let conection = await pool.getConnection();
  try {
    let email = req.body.email;
    let password = req.body.password;
    let [rows] = await conection.query(
      "SELECT * FROM admin where email=? AND password=?",
      [email, password]
    );
    console.log("rows.length", rows.length)
    if (rows.length === 0) {
      res.json({
        success: false,
        message:"Wrong Credentials!"
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
      // On email confirmation
      const token = jwt.sign(
        { adminId: rows[0].id },
        process.env.Jwt_Secret_Admin,
        {
          expiresIn: "12h",
        }
      );
      req.session.user = token;
      // console.log("req>>",  req.session.token)
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

exports.emailVerification = async (req, res) => {
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
