const express = require("express");
const { super_adminsingin, super_emailVerification } = require("../../../controller/SuperAdminController/SuperAdminAuth");
const router = express.Router();
 
// routes for admin account
router.post("/signin", super_adminsingin);
// Email verification for admin
router.get("/verify/email/:id", super_emailVerification);
// upload many files with one field.


module.exports = router;
