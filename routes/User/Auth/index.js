const express = require("express");
const router = express.Router();
const {
  userSignUp,
  emailVerification,
  userSignIn,
  sendEmail_for_forgotPassword,
  reset_user_password,
} = require("../../../controller/UserController/userAuth");

router.post("/signup", userSignUp);
router.post("/signin", userSignIn);
router.get("/verify/email/:id", emailVerification);
router.post("/forgotpassword/:email", sendEmail_for_forgotPassword); 
router.put("/reset-password/:userid/:password", reset_user_password);

module.exports = router;
