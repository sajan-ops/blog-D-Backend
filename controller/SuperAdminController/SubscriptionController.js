const { v4: uuidv4 } = require("uuid");
const db = require("../../db");

// Get all subscription plans
const getAllPlans = async (req, res) => {
  try {
    const [plans] = await db.getAllPlans();

    return res.status(200).json({
      success: true,
      plans,
    });
  } catch (error) {
    console.error("Error fetching plans:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching subscription plans",
    });
  }
};

// Create new subscription plan
const createPlan = async (req, res) => {
  try {
    const { name, price } = req.body;

    // Validate input
    if (!name || !price) {
      return res.status(400).json({
        success: false,
        message: "Name and price are required",
      });
    }

    const plan = {
      id: uuidv4(),
      name,
      price,
    };

    await db.createPlan(plan);

    return res.status(201).json({
      success: true,
      message: "Plan created successfully",
      plan,
    });
  } catch (error) {
    console.error("Error creating plan:", error);
    return res.status(500).json({
      success: false,
      message: "Error creating subscription plan",
    });
  }
};

// Update subscription plan
const updatePlan = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, price } = req.body;

    // Validate input
    if (!name || !price) {
      return res.status(400).json({
        success: false,
        message: "Name and price are required",
      });
    }

    const plan = {
      id,
      name,
      price,
    };

    await db.updatePlan(plan);

    return res.status(200).json({
      success: true,
      message: "Plan updated successfully",
      plan,
    });
  } catch (error) {
    console.error("Error updating plan:", error);
    return res.status(500).json({
      success: false,
      message: "Error updating subscription plan",
    });
  }
};

// Delete subscription plan
const deletePlan = async (req, res) => {
  try {
    const { id } = req.params;

    await db.deletePlan(id);

    return res.status(200).json({
      success: true,
      message: "Plan deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting plan:", error);
    return res.status(500).json({
      success: false,
      message: "Error deleting subscription plan",
    });
  }
};

module.exports = {
  getAllPlans,
  createPlan,
  updatePlan,
  deletePlan,
};
