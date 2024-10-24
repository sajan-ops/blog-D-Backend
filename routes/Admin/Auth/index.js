const express = require("express");
const router = express.Router();
const upload = require("../../../middleware/Imageupload");
const {
  adminsingin,
  emailVerification,
} = require("../../../controller/AdminController/adminAuth");
// routes for admin account
router.post("/signin", adminsingin);
// Email verification for admin
router.get("/verify/email/:id", emailVerification);
// upload many files with one field.


module.exports = router;
