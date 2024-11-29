const express = require("express");
const router = express.Router();
const {
  getAllposts,
  getSinglePost,
  postComment,
  getComments,
  getRelatedposts,
  getCatsAuthorsAndDates,
  likePost,
  likesCount,
} = require("../../../controller/UserController/userPost");
const { blockUnAuthorizeAccess_User } = require("../../../middleware/UserAuth");
const { likePostLimiter } = require("../../../util/likesRateLimiter");

router.get("/getAllposts/:type", getAllposts);
router.get("/getRelatedposts/:category", getRelatedposts);
router.get("/getSinglePost/:slug", getSinglePost);
router.post("/postComment/:slug", blockUnAuthorizeAccess_User, postComment);
router.get("/getComments/:slug", getComments);
router.get("/getCatsAuthorsAndDates", getCatsAuthorsAndDates);
router.get("/likesCount/:postId", likesCount);
router.post(
  "/likePost",
  likePostLimiter,
  blockUnAuthorizeAccess_User,
  likePost
);

module.exports = router;
