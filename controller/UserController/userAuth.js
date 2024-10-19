const jwt = require("jsonwebtoken"); // For creating tokens
const { pool } = require("../../db");
const { sendEmail } = require("../../util/nodemailerService");
const { v4: uuidv4 } = require("uuid");

exports.userSignUp = async (req, res) => {
  let conection = await pool.getConnection();
  try {
    let firstName = req.body.firstName;
    let lastName = req.body.lastName;
    let email = req.body.email;
    let password = req.body.password;
    // First check if user exists
    let [isUserExists] = await conection.query(
      "SELECT * FROM users WHERE email=? AND password=?",
      [email, password]
    );
    console.log("isUserExists>>", isUserExists.length);
    if (isUserExists.length > 0) {
      console.log("Yes User exists");
      res.json({
        status: "userExists",
        message: "Account is already registered with this email.",
      });
      return;
    }
    let userid = uuidv4();
    let [rows] = await conection.query(
      "INSERT INTO users (id, firstName, lastName, email, password) VALUES (?,?,?,?,?)",
      [userid, firstName, lastName, email, password]
    );
    console.log("rows.affectedRows", rows.affectedRows);
    if (rows.affectedRows) {
      // send a confimation email.
      let message = sendEmail(email, userid, "USER");
      if (message === "email sent") {
        res.json({
          success: true,
          status: "confirmEmail",
          message: "Please confirm you email!",
        });
      } else if (message === "email sent failed") {
        res.json({
          success: false,
          message: "Email sent failed.",
        });
      }
    }
  } catch (error) {
    console.log(`error during sigin the data ${error}`);
    console.log(error);
  } finally {
    conection.release();
  }
};

exports.userSignIn = async (req, res) => {
  let conection = await pool.getConnection();
  try {
    let email = req.body.email;
    let password = req.body.password;
    // First check if user exists
    let [isUserExists] = await conection.query(
      "SELECT * FROM users WHERE email=? AND password=?",
      [email, password]
    );
    console.log("isUserExists>>", isUserExists.length);
    if (isUserExists.length > 0 && isUserExists[0].verified === 1) {
      console.log("Yes User exists");
      const token = jwt.sign(
        { userid: isUserExists[0].id },
        process.env.Jwt_Secret_User,
        {
          expiresIn: "12h",
        }
      );
      res.status(200).json({
        userDetails: { id: isUserExists[0].id, email: isUserExists[0].email },
        token,
        status: "userExists",
        message: "LoggedIn Successfully.",
      });
      return;
    }
    if (isUserExists.length > 0 && isUserExists[0].verified === 0) {
      res.status(401).json({
        status: "emailNotConfirmed",
        message: "Attempt Failed.",
      });
      return;
    }
    if (!isUserExists || isUserExists.length === 0) {
      res.json({ status: "unauthorized" });
      return;
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
  const userid = req.params.id;
  try {
    let [rows] = await conection.query(
      "UPDATE users SET verified=? WHERE id=?",
      [true, userid]
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

exports.sendEmail_for_forgotPassword = async (req, res) => {
  let email = req.params.email;
  let conection = await pool.getConnection();

  try {
    // find user id
    let [result] = await conection.query("SELECT id FROM users where email=?", [
      email,
    ]);
    let message = sendEmail(
      email,
      result[0].id,
      "USER",
      "ForgotPassword"
    );
    if (message === "email sent") {
      res.json({
        success: true,
        status: "confirmEmail",
        message: "Please confirm you email!",
      });
    } else if (message === "email sent failed") {
      res.json({
        success: false,
        message: "Email sent failed.",
      });
    }
  } catch (error) {
    console.log("error", error);
  } finally {
    conection.release();
  }
};

exports.reset_user_password = async (req, res) => {
  let conection = await pool.getConnection();
  const userid = req.params.userid;
  const password = req.params.password;
  try {
    let [rows] = await conection.query(
      "UPDATE users SET password=?, verified=? WHERE id=?",
      [password, true, userid]
    );
    res.json({ success: true });
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
