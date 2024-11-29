const { pool } = require("../../db");

exports.getAllusers = async (req, res) => {
  let connection = await pool.getConnection();
  try {
    // Base SQL query
    let sql = "SELECT * FROM users;";
    let [rows] = await connection.query(sql);
    res.status(200).json({
      success: true,
      users: rows,
      message: "Data fetched successfully",
    });
  } catch (error) {
    console.error("Error in getting users: ", error);
    res
      .status(500)
      .json({ message: "Error in getting users", error: error.message });
  } finally {
    connection.release(); // Release the connection back to the pool
  }
};

exports.addNewUser = async (req, res) => {
  let connection;
  try {
    // Destructure the user data from the request body
    const { firstName, lastName, email, password } = req.body;

    // Check if all fields are provided
    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({
        success: false,
        message:
          "All fields (firstName, lastName, email, password) are required.",
      });
    }

    // Get a connection from the pool
    connection = await pool.getConnection();

    // Insert new user into the users table
    const sql =
      "INSERT INTO users (id, firstName, lastName, email, password) VALUES (UUID(), ?, ?, ?, ?);";
    const [result] = await connection.query(sql, [
      firstName,
      lastName,
      email,
      password,
    ]);

    res.status(201).json({
      success: true,
      message: "User added successfully",
      userId: result.insertId,
    });
  } catch (error) {
    console.error("Error in adding user: ", error);
    res.status(500).json({
      success: false,
      message: "Error in adding user",
      error: error.message,
    });
  } finally {
    if (connection) connection.release(); // Release the connection back to the pool
  }
};

exports.deleteAuser = async (req, res) => {
  let connection;
  try {
    // Destructure the user ID from the request body or query parameters
    const { id } = req.params;

    // Check if the user ID is provided
    if (!id) {
      return res.status(400).json({
        success: false,
        message: "User ID is required.",
      });
    }

    // Get a connection from the pool
    connection = await pool.getConnection();

    // Delete the user from the users table by ID
    const sql = "DELETE FROM users WHERE id = ?;";
    const [result] = await connection.query(sql, [id]);

    // Check if any rows were affected (i.e., if a user was actually deleted)
    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    res.status(200).json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    console.error("Error in deleting user: ", error);
    res.status(500).json({
      success: false,
      message: "Error in deleting user",
      error: error.message,
    });
  } finally {
    if (connection) connection.release(); // Release the connection back to the pool
  }
};

exports.addNewSubscriber = async (req, res) => {
  let connection;
  try {
    // Destructure the subscription details from the request body
    const { id, packageName, price } = req.body;

    // Check if all required details are provided
    if (!id || !packageName || !price) {
      return res.status(400).json({
        success: false,
        message: "Subscription ID, package name, and price are required.",
      });
    }

    // Get current date as the start date
    const startDate = new Date(); // Current date and time
    // Get the end date, which is one month later
    const endDate = new Date(startDate);
    endDate.setMonth(startDate.getMonth() + 1); // Add one month to current date

    // Format the dates as MySQL DATETIME format (e.g., 'YYYY-MM-DD HH:mm:ss')
    const startDateFormatted = startDate
      .toISOString()
      .slice(0, 19)
      .replace("T", " ");
    const endDateFormatted = endDate
      .toISOString()
      .slice(0, 19)
      .replace("T", " ");

    // Get a connection from the pool
    connection = await pool.getConnection();
    // Insert a new record into the subscription table
    const sql = `
      INSERT INTO subscriptions (id, plan, price, startDate, endDate, userid)
      VALUES (?, ?, ?, ?, ?, ?);
    `;
    // Assuming you have a userId (you could pass it in the body or extract it from the session/token)
    const userId = id; // Replace with the actual user ID

    const [result] = await connection.query(sql, [
      id,
      packageName,
      price,
      startDateFormatted,
      endDateFormatted,
      userId,
    ]);

    // Check if the insertion was successful
    if (result.affectedRows === 0) {
      return res.status(500).json({
        success: false,
        message: "Failed to add subscription.",
      });
    }

    res.status(200).json({
      success: true,
      message: "Subscription added successfully",
    });
  } catch (error) {
    console.error("Error in adding subscription: ", error);
    res.status(500).json({
      success: false,
      message: "Error in adding subscription",
      error: error.message,
    });
  } finally {
    if (connection) connection.release(); // Release the connection back to the pool
  }
};

exports.getAllSubscribers = async (req, res) => {
  let connection;
  try {
    // Get a connection from the pool
    connection = await pool.getConnection();

    // Query to get all subscribers with their subscription details
    const sql = `
      SELECT subscriptions.id AS subscriptionId, subscriptions.plan, subscriptions.price, 
             subscriptions.startDate, subscriptions.endDate, users.id AS userId, 
             users.firstName, users.lastName, users.email
      FROM subscriptions
      JOIN users ON subscriptions.userid = users.id;
    `;

    const [rows] = await connection.query(sql);
    // console.log("rows", rows);
    // Check if any subscriptions were found
    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No subscribers found.",
      });
    }

    res.status(200).json({
      success: true,
      subscribers: rows,
    });
  } catch (error) {
    console.error("Error in retrieving subscribers: ", error);
    res.status(500).json({
      success: false,
      message: "Error in retrieving subscribers",
      error: error.message,
    });
  } finally {
    if (connection) connection.release(); // Release the connection back to the pool
  }
};
