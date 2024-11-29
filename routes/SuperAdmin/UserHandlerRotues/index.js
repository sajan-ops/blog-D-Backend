const express = require("express");
const {
  blockUnAuthorizeAccess_Super_Admin,
} = require("../../../middleware/SuperAdminAuth");
const {
  getAllusers,
  addNewUser,
  deleteAuser,
  addNewSubscriber,
  getAllSubscribers,
} = require("../../../controller/SuperAdminController/SuperAdminMain");
const router = express.Router();

router.get("/getUsers", blockUnAuthorizeAccess_Super_Admin, getAllusers);
router.post("/addNewUser", blockUnAuthorizeAccess_Super_Admin, addNewUser);
router.delete(
  "/deleteAuser/:id",
  blockUnAuthorizeAccess_Super_Admin,
  deleteAuser
);
router.post(
  "/addNewSubscriber",
  blockUnAuthorizeAccess_Super_Admin,
  addNewSubscriber
);
router.get(
  "/getAllSubscribers",
  blockUnAuthorizeAccess_Super_Admin,
  getAllSubscribers
);

module.exports = router;
