const express = require("express");
const {
  blockUnAuthorizeAccess_Super_Admin,
} = require("../../../middleware/SuperAdminAuth");
const {
  createPlan,
  getAllPlans,
  updatePlan,
  deletePlan,
} = require("../../../controller/SuperAdminController/SubscriptionController");

const router = express.Router();

// Get all subscription plans
router.get("/allplans", blockUnAuthorizeAccess_Super_Admin, getAllPlans);

// Create new subscription plan
router.post("/create-plan", blockUnAuthorizeAccess_Super_Admin, createPlan);

// Update subscription plan
router.put("/updateplan/:id", blockUnAuthorizeAccess_Super_Admin, updatePlan);

// Delete subscription plan
router.delete(
  "/deleteplan/:id",
  blockUnAuthorizeAccess_Super_Admin,
  deletePlan
);

module.exports = router;
