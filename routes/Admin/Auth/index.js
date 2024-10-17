const express = require("express");
const router = express.Router();
const upload = require("../../../middleware/Imageupload");
const { adminsingin, emailVerification } = require("../../../controller/userLogics");
// routes for admin account
router.post("/signin", adminsingin);
// Email verification for admin
router.get("/verify/email/:id", emailVerification);

// router.post(
//   "/admin/postarticle",
//   upload.fields([
//     { name: "categoryImage", maxCount: 200 },
//     { name: "questionFiles", maxCount: 200 },
//     { name: "answerDocument", maxCount: 200 },
//   ]),
//   postQuestion
// );

module.exports = router;
