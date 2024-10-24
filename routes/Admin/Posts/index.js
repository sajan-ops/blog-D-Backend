const express = require("express");
const router = express.Router();
const upload = require("../../../middleware/Imageupload");
const { blockUnAuthorizeAccess_Admin } = require("../../../middleware/Auth");
const {
  uploadPostMedia,
  deleteSingleMedia,
  getGallery,
  createPost,
  getAllposts,
  getSinglePost,
  deletPost,
  updatePost,
  updatePostStatus,
  makeStatusPublish,
  deletPostPermenent,
  getAlldeletedPosts,
  recoverPost,
  addCategory,
  fetchAllCategories,
  deleteSingleCateogry,
  getCatsAuthorsAndDates,
} = require("../../../controller/AdminController/adminPost");

router.post(
  "/upload",
  blockUnAuthorizeAccess_Admin,
  upload.array("files"),
  uploadPostMedia
);

router.get("/getGallery", blockUnAuthorizeAccess_Admin, getGallery);

router.delete(
  "/deleteSingleMedia/:fileId/:filePath/:usedInArticle",
  blockUnAuthorizeAccess_Admin,
  deleteSingleMedia
);

router.post("/create-post", blockUnAuthorizeAccess_Admin, createPost);

router.get("/getAllposts/:type", blockUnAuthorizeAccess_Admin, getAllposts);

router.get(
  "/getAlldeletedPosts",
  blockUnAuthorizeAccess_Admin,
  getAlldeletedPosts
);

router.get("/getSinglePost/:slug", blockUnAuthorizeAccess_Admin, getSinglePost);

router.delete("/delete-post/:slug", blockUnAuthorizeAccess_Admin, deletPost);

router.put("/recover-post/:slug", blockUnAuthorizeAccess_Admin, recoverPost);

router.delete(
  "/delete-post-permenent/:slug",
  blockUnAuthorizeAccess_Admin,
  deletPostPermenent
);

router.put("/updatePost/:slug", blockUnAuthorizeAccess_Admin, updatePost);

router.put(
  "/updatePostStatus/:slug",
  blockUnAuthorizeAccess_Admin,
  updatePostStatus
);

router.put(
  "/makeStatusPublish/:slug",
  blockUnAuthorizeAccess_Admin,
  makeStatusPublish
);

// manage categories
router.post("/addCategory", blockUnAuthorizeAccess_Admin, addCategory);

router.get(
  "/fetchAllCategories",
  blockUnAuthorizeAccess_Admin,
  fetchAllCategories
);

router.get(
  "/getCatsAuthorsAndDates",
  blockUnAuthorizeAccess_Admin,
  getCatsAuthorsAndDates
);

router.delete(
  "/deleteSingleCateogry/:id",
  blockUnAuthorizeAccess_Admin,
  deleteSingleCateogry
);

module.exports = router;
