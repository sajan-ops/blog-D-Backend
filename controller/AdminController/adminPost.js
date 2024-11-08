const { pool } = require("../../db");
const { v4: uuidv4 } = require("uuid");
const fs = require("fs");
const { slugify } = require("../../util/slugify");
const { getCurrentDate } = require("../../util/getCurrentDate");
const path = require("path");
const { google } = require("googleapis");
const { BetaAnalyticsDataClient } = require("@google-analytics/data");
const webPush = require("web-push");

// Replace with your VAPID keys
const publicKey =
  "BPEcNC79FcWy3D2ytLEIIOcGrtLAgPYevQ9KwtGPPwnDlP9Z6mxL2yd2nFS6BH65svBxWfLlD0OjWwOoh7HYkPM";
const privateKey = "gX5dc7ZKHavMsvNAYQH9zmPUe41lqQ6oCq6TmRX5jHg";
webPush.setVapidDetails(
  "mailto:waqaskhanbughlani1124@gmail.com",
  publicKey,
  privateKey
);

exports.uploadPostMedia = async (req, res) => {
  let connection = await pool.getConnection();
  const adminId = req.adminId;
  try {
    // Check if files were uploaded
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: "No files uploaded." });
    }
    let fileRecords = req.files;
    // Execute insert query
    for (let i = 0; i < fileRecords.length; i++) {
      let galleryid = uuidv4();
      const filename = fileRecords[i].filename;
      const sql = "INSERT INTO gallery (id, filePath, adminID) VALUES (?,?,?)";
      let [rows] = await connection.query(sql, [galleryid, filename, adminId]);
    }
    const sql = "select * from gallery where adminId=?";
    let [rows] = await connection.query(sql, [adminId]);
    // Update with the first gallery ID or adjust as needed

    // Success response
    res.status(200).json({ message: "Files uploaded successfully" });
  } catch (error) {
    console.error("Error uploading files: ", error);
    res
      .status(500)
      .json({ message: "Error uploading files", error: error.message });
  } finally {
    connection.release(); // Release the connection back to the pool
  }
};

exports.getGallery = async (req, res) => {
  let connection = await pool.getConnection();
  const adminId = req.adminId;
  try {
    const sql = "select * from gallery where adminId=?";
    let [rows] = await connection.query(sql, [adminId]);
    res.status(200).json({ message: "Files uploaded successfully", rows });
  } catch (error) {
    console.error("Error uploading files: ", error);
    res
      .status(500)
      .json({ message: "Error uploading files", error: error.message });
  } finally {
    connection.release(); // Release the connection back to the pool
  }
};

exports.deleteSingleMedia = async (req, res) => {
  let connection = await pool.getConnection();
  const fileID = req.params.fileId;
  let filePath = req.params.filePath;
  const usedInArticle = req.params.usedInArticle;
  console.log("usedInArticle", usedInArticle);
  try {
    const sql = "DELETE from gallery where id=?";
    await connection.query(sql, [fileID]);
    filePath = path.resolve(
      __dirname,
      "..",
      "..",
      "public",
      "images",
      filePath
    );
    if (Number(usedInArticle) === 0) {
      fs.unlink(filePath, (err) => {
        if (err) {
          console.error(`Error deleting file: ${err.message}`);
          return;
        }
        console.log("File deleted successfully");
      });
    }
    res.status(200).json({ message: "File Deleted successfully" });
  } catch (error) {
    console.error("Error uploading files: ", error);
    res
      .status(500)
      .json({ message: "Error uploading files", error: error.message });
  } finally {
    connection.release(); // Release the connection back to the pool
  }
};

exports.createPost = async (req, res) => {
  let connection = await pool.getConnection();
  const {
    title,
    description,
    filePath,
    content,
    keywords,
    author,
    ReadTime,
    fileIds,
    postType,
    scheduleDate,
    category,
  } = req.body;
  const filePathJson = JSON.stringify(filePath);
  let slug = slugify(title);
  let id = uuidv4();
  let date_created_in = getCurrentDate();
  let status;
  if (postType === "instant") {
    status = "instant";
  } else if (postType === "draft") {
    status = "draft";
  } else if (postType === "schedule") {
    status = "schedule";
  }
  try {
    let sql;
    if (status === "schedule") {
      sql =
        "INSERT INTO posts (slug, id, title, filePath, content, date_created_in, description, keywords, author, readTime, status, publish_time ,category )VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ? ,?, ?, ?)";
      await connection.query(sql, [
        slug,
        id,
        title,
        filePathJson,
        content,
        date_created_in,
        description,
        keywords,
        author,
        ReadTime,
        status,
        scheduleDate,
        category,
      ]);
    } else {
      sql =
        "INSERT INTO posts (slug, id, title, filePath, content, date_created_in, description, keywords, author, readTime, status, category )VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ? ,?, ?)";
      await connection.query(sql, [
        slug,
        id,
        title,
        filePathJson,
        content,
        date_created_in,
        description,
        keywords,
        author,
        ReadTime,
        status,
        category,
      ]);
    }
    // author insert
    let authorId = uuidv4();
    let sql2 = "INSERT INTO authors (id, name )VALUES (?, ?)";
    await connection.query(sql2, [authorId, author]);
    // gallery updated
    for (let i = 0; i < fileIds.length; i++) {
      const fileId = fileIds[i];
      await connection.query("update gallery set usedInArticle=? where id=?", [
        true,
        fileId,
      ]);
    }
    if (status === "instant") {
      await pushNotifications(connection, title, description);
    }
    res.status(200).json({ message: "Post uploaded successfully." });
  } catch (error) {
    console.error("Error uploading Post: ", error);
    res
      .status(500)
      .json({ message: "Error uploading Post", error: error.message });
  } finally {
    connection.release(); // Release the connection back to the pool
  }
};

exports.getAllposts = async (req, res) => {
  let { filterType, filter } = req.query;
  let postType = req.params.type;
  let connection = await pool.getConnection();
  try {
    // Base SQL query
    let sql = "SELECT * FROM posts WHERE deleted=?";
    let queryParams = [false];
    console.log("filter", filter);
    if (
      filter === "null" ||
      filter === undefined ||
      typeof filter === undefined ||
      typeof filter === "undefined" ||
      filter === null ||
      filter === "all" ||
      filter === ""
    ) {
      let sqlsecond = "SELECT * FROM posts WHERE deleted=?";
      let queryParamssecon = [false];
      let [rows] = await connection.query(sqlsecond, queryParamssecon);
      res.status(200).json({
        success: true,
        rows,
        message: "Data fetched successfully",
      });
      return;
    }
    // Add conditions based on provided filters
    if (postType) {
      sql += " AND status=?";
      queryParams.push(postType);
    }
    if (filterType === "category") {
      sql += " AND category=?";
      queryParams.push(filter);
    }
    if (filterType === "status") {
      sql += " AND status=?";
      queryParams.push(filter);
    }
    if (filterType === "date") {
      sql += " AND date_created_in=?";
      queryParams.push(filter);
    }
    if (filterType === "author") {
      sql += " AND author=?";
      queryParams.push(filter);
    }
    let [rows] = await connection.query(sql, queryParams);
    const sql2 = "SELECT * FROM categories";
    let [categories] = await connection.query(sql2, []);

    res.status(200).json({
      success: true,
      rows,
      categories,
      message: "Data fetched successfully",
    });
  } catch (error) {
    console.error("Error in getting posts: ", error);
    res
      .status(500)
      .json({ message: "Error in getting posts", error: error.message });
  } finally {
    connection.release(); // Release the connection back to the pool
  }
};

exports.getAlldeletedPosts = async (req, res) => {
  let connection = await pool.getConnection();
  try {
    const sql = "select * from posts where deleted=?";
    let [rows] = await connection.query(sql, [true]);

    res
      .status(200)
      .json({ success: true, rows, message: "Data Got successfully" });
  } catch (error) {
    console.error("Error In getring Posts: ", error.sqlMessage);
    res
      .status(500)
      .json({ message: "Error In getring Posts", error: error.message });
  } finally {
    connection.release(); // Release the connection back to the pool
  }
};

exports.getSinglePost = async (req, res) => {
  let connection = await pool.getConnection();
  let slug = req.params.slug;
  try {
    const sql = "select * from posts where slug=?";
    let [rows] = await connection.query(sql, [slug]);
    res
      .status(200)
      .json({ success: true, post: rows[0], message: "Data Got successfully" });
  } catch (error) {
    console.error("Error In single getting Posts: ", error.sqlMessage);
    res
      .status(500)
      .json({ message: "Error In single getting Posts", error: error.message });
  } finally {
    connection.release(); // Release the connection back to the pool
  }
};

// soft delete
exports.deletPost = async (req, res) => {
  let connection = await pool.getConnection();
  let slug = req.params.slug;
  try {
    const sql = "update posts set deleted=? where slug=?";
    let [rows] = await connection.query(sql, [true, slug]);
    res
      .status(200)
      .json({ success: true, message: "Data deleted successfully" });
  } catch (error) {
    console.error("Error In delete a Post: ", error);
    res
      .status(500)
      .json({ message: "Error In delete a Post", error: error.message });
  } finally {
    connection.release(); // Release the connection back to the pool
  }
};

exports.recoverPost = async (req, res) => {
  let connection = await pool.getConnection();
  let slug = req.params.slug;
  try {
    const sql = "update posts set deleted=? where slug=?";
    let [rows] = await connection.query(sql, [false, slug]);
    res
      .status(200)
      .json({ success: true, message: "Data deleted successfully" });
  } catch (error) {
    console.error("Error In delete a Post: ", error);
    res
      .status(500)
      .json({ message: "Error In delete a Post", error: error.message });
  } finally {
    connection.release(); // Release the connection back to the pool
  }
};
// deletPostPermenent
exports.deletPostPermenent = async (req, res) => {
  let connection = await pool.getConnection();
  let slug = req.params.slug;
  try {
    const sql = "delete from posts where slug=?";
    let [rows] = await connection.query(sql, [slug]);
    res
      .status(200)
      .json({ success: true, message: "Data deleted successfully" });
  } catch (error) {
    console.error("Error In delete a Post: ", error);
    res
      .status(500)
      .json({ message: "Error In delete a Post", error: error.message });
  } finally {
    connection.release(); // Release the connection back to the pool
  }
};

exports.updatePost = async (req, res) => {
  let connection = await pool.getConnection();
  let slug = req.params.slug;
  const {
    description,
    filePath,
    content,
    keywords,
    author,
    ReadTime,
    fileIds,
  } = req.body;

  const filePathJson = filePath ? JSON.stringify(filePath) : null; // Ensure it's not null
  let date_created_in = getCurrentDate(); // Using date_created_in for the update

  try {
    // Update the post
    const sql = `
      UPDATE posts 
      SET filePath = ?, content = ?, date_created_in = ?, 
          description = ?, keywords = ?, author = ?, readTime = ? 
      WHERE slug = ?`;

    await connection.query(sql, [
      filePathJson,
      content,
      date_created_in,
      description,
      keywords,
      author,
      ReadTime,
      slug,
    ]);

    // Update the gallery for the files
    for (let i = 0; i < fileIds.length; i++) {
      const fileId = fileIds[i];
      await connection.query(
        "UPDATE gallery SET usedInArticle = ? WHERE id = ?",
        [true, fileId]
      );
    }

    res.status(200).json({ message: "Post updated successfully" });
  } catch (error) {
    console.error("Error updating Post: ", error);
    res
      .status(500)
      .json({ message: "Error updating Post", error: error.message });
  } finally {
    connection.release(); // Release the connection back to the pool
  }
};

exports.updatePostStatus = async (req, res) => {
  let slug = req.params.slug;
  let connection = await pool.getConnection();
  try {
    // Update the post
    const sql = `
      UPDATE posts 
      SET status=? 
      WHERE slug = ?`;
    await connection.query(sql, ["instant", slug]);
    res.status(200).json({ message: "Post updated successfully" });
  } catch (error) {
    console.error("Error updating Post: ", error);
    res
      .status(500)
      .json({ message: "Error updating Post", error: error.message });
  } finally {
    connection.release(); // Release the connection back to the pool
  }
};

exports.makeStatusPublish = async (req, res) => {
  let slug = req.params.slug;
  let connection = await pool.getConnection();
  try {
    // Update the post
    const sql = `
      UPDATE posts 
      SET status=? 
      WHERE slug = ?`;
    await connection.query(sql, ["instant", slug]);
    res.status(200).json({ message: "Status updated", success: true });
  } catch (error) {
    console.error("Error updating Post: ", error);
    res
      .status(500)
      .json({ message: "Error updating Post", error: error.message });
  } finally {
    connection.release(); // Release the connection back to the pool
  }
};

exports.addCategory = async (req, res) => {
  let categoryName = req.body.name;
  let connection = await pool.getConnection();
  let id = uuidv4();

  try {
    const sql = `INSERT into categories (id,name) values (?,?)`;
    await connection.query(sql, [id, categoryName]);
    res.status(200).json({ message: "Status updated", success: true });
  } catch (error) {
    console.error("Error updating Post: ", error);
    res
      .status(500)
      .json({ message: "Error updating Post", error: error.message });
  } finally {
    connection.release(); // Release the connection back to the pool
  }
};

exports.fetchAllCategories = async (req, res) => {
  let connection = await pool.getConnection();
  try {
    const sql = `select * from categories`;
    let [rows] = await connection.query(sql);
    res
      .status(200)
      .json({ message: "Status updated", success: true, data: rows });
  } catch (error) {
    console.error("Error updating Post: ", error);
    res
      .status(500)
      .json({ message: "Error updating Post", error: error.message });
  } finally {
    connection.release(); // Release the connection back to the pool
  }
};

exports.deleteSingleCateogry = async (req, res) => {
  let catId = req.params.id;
  let connection = await pool.getConnection();
  try {
    const sql = `DELETE FROM categories WHERE id=?`;
    await connection.query(sql, [catId]);
    res.status(200).json({ message: "Status updated", success: true });
  } catch (error) {
    console.error("Error updating Post: ", error);
    res
      .status(500)
      .json({ message: "Error updating Post", error: error.message });
  } finally {
    connection.release(); // Release the connection back to the pool
  }
};

exports.getCatsAuthorsAndDates = async (req, res) => {
  let connection = await pool.getConnection();
  try {
    const sql = `select * from categories`;
    let [categories] = await connection.query(sql);
    const sql2 = `select status from posts`;
    let [status] = await connection.query(sql2);
    const sql42 = `select date_created_in from posts`;
    let [dates] = await connection.query(sql42);
    const sql3 = `select name from authors`;
    let [authors] = await connection.query(sql3);
    res.status(200).json({
      message: "Status updated",
      success: true,
      categories,
      status,
      authors,
      dates,
    });
  } catch (error) {
    console.error("Error updating Post: ", error);
    res
      .status(500)
      .json({ message: "Error updating Post", error: error.message });
  } finally {
    connection.release(); // Release the connection back to the pool
  }
};

exports.getComments = async (req, res) => {
  // also get the user data.
  let connection = await pool.getConnection();
  try {
    const sql = "select * from comments;";
    let [comments] = await connection.query(sql, []);
    let commentsWithUsers = [];
    for (let i = 0; i < comments.length; i++) {
      const commentid = comments[i].id;
      const approve = comments[i].approve;
      const postid = comments[i].postid;
      const userid = comments[i].userid;
      const comment = comments[i].comment;
      const date = comments[i].date_created_in;
      const sql2 = "select * from users where id=?";
      let [users] = await connection.query(sql2, [userid]);
      const sql3 = "select * from posts where slug=?";
      let [blogs] = await connection.query(sql3, [postid]);
      let username = users[0].firstName;
      let blogTitle = blogs[0].title;
      let slug = blogs[0].slug;
      commentsWithUsers.push({
        commentid,
        approve,
        blogTitle,
        blogslug: slug,
        username,
        comment,
        date,
      });
    }
    res.status(200).json({
      success: true,
      commentsWithUsers,
      message: "Data Got successfully",
    });
  } catch (error) {
    console.error("Error In getting commentsAll: ", error);
    res
      .status(500)
      .json({ message: "Error In getting commentsAll", error: error.message });
  } finally {
    connection.release(); // Release the connection back to the pool
  }
};

exports.approveComment = async (req, res) => {
  let clommetid = req.params.id;
  let connection = await pool.getConnection();
  try {
    const sql = `update comments set approve=? where id=?`;
    await connection.query(sql, [true, clommetid]);
    res.status(200).json({ message: "Status updated", success: true });
  } catch (error) {
    console.error("Error updating comments approval: ", error);
    res.status(500).json({
      message: "Error updating comments approval",
      error: error.message,
    });
  } finally {
    connection.release(); // Release the connection back to the pool
  }
};

exports.disapproveComment = async (req, res) => {
  let clommetid = req.params.id;
  let connection = await pool.getConnection();
  try {
    const sql = `update comments set approve=? where id=?`;
    await connection.query(sql, [false, clommetid]);
    res.status(200).json({ message: "Status updated", success: true });
  } catch (error) {
    console.error("Error updating comments disapproval: ", error);
    res.status(500).json({
      message: "Error updating comments disapproval",
      error: error.message,
    });
  } finally {
    connection.release(); // Release the connection back to the pool
  }
};

exports.deleteComment = async (req, res) => {
  let clommetid = req.params.id;
  let connection = await pool.getConnection();
  try {
    const sql = `delete from comments where id=?`;
    await connection.query(sql, [clommetid]);
    res.status(200).json({ message: "Status updated", success: true });
  } catch (error) {
    console.error("Error delete comments : ", error);
    res
      .status(500)
      .json({ message: "Error delete comments ", error: error.message });
  } finally {
    connection.release(); // Release the connection back to the pool
  }
};

exports.googleStats = async (req, res) => {
  // Configure authentication
  const auth = new google.auth.GoogleAuth({
    keyFile: path.resolve(__dirname, "../../cred/google.json"),
    scopes: ["https://www.googleapis.com/auth/webmasters.readonly"],
  });

  const { filter } = req.query; // Expecting a filter like '1month', '3months', '1week', 'today', 'latest'

  let startDate;
  let endDate = new Date().toISOString().split("T")[0]; // Default to today
  // Set the start date based on the filter
  switch (filter) {
    case "3m":
      startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0];
      break;
    case "2m":
      startDate = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0];
      break;
    case "1m":
      startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0];
      break;
    case "1w":
      startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0];
      break;

    default:
      // Default to the last 28 days if no filter is provided
      startDate = new Date(Date.now() - 28 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0];
  }

  try {
    // Get authenticated client
    const authClient = await auth.getClient();
    // Create searchconsole instance with auth
    const searchConsoleAPI = google.searchconsole({
      version: "v1",
      auth: authClient,
    });

    const siteUrl = "sc-domain:drawsketch.co";

    // Make API request with proper auth
    const response = await searchConsoleAPI.searchanalytics.query({
      siteUrl: siteUrl,
      requestBody: {
        startDate,
        endDate,
        dimensions: ["date", "page", "query", "country", "device"], // Add more dimensions as needed
        type: "web",
        rowLimit: 400, // Increase if necessary
      },
    });

    // Check if data is available
    if (!response.data.rows || response.data.rows.length === 0) {
      return res.status(404).json({
        message: "No data found for the specified date range.",
      });
    }

    const formattedData = response.data.rows.map((row) => ({
      date: row.keys[0], // Date of the data point
      page: row.keys[1], // Page URL
      query: row.keys[2], // Search query
      country: row.keys[3], // Country code
      device: row.keys[4], // Device type
      clicks: row.clicks, // Number of clicks
      impressions: row.impressions, // Number of impressions
      ctr: ((row.clicks / row.impressions) * 100).toFixed(2), // Click-through rate
      averagePosition: row.averagePosition || 0, // Average position (default to 0 if not available)
    }));

    res.json(formattedData);
  } catch (error) {
    console.error("Detailed error:", {
      message: error.message,
      status: error.status,
      details: error?.errors,
      stack: error.stack,
    });

    res.status(500).json({
      error: "Failed to fetch Search Console data",
      details: error.message,
      availableSites: error.sites?.data,
    });
  }
};

exports.googleAnalytics = async (req, res) => {
  const { dateRange } = req.body;
  // Convert dateRange to startDate
  let startDate = dateRange;
  let endDate = "today";

  // Handle special cases
  switch (dateRange) {
    case "today":
      startDate = "yesterday";
      endDate = "today";
      break;
    case "yesterday":
      startDate = "yesterday";
      endDate = "yesterday";
      break;
    case "yearToDate":
      startDate = `${new Date().getFullYear()}-01-01`;
      break;
    // Default case will use the dateRange directly (e.g., "7daysAgo", "30daysAgo")
  }
  try {
    const analyticsDataClient = new BetaAnalyticsDataClient({
      keyFile: path.resolve("cred/google.json"),
    });

    // console.log("dates>>", { startDate, endDate });
    // Get daily metrics
    const [dailyResponse] = await analyticsDataClient.runReport({
      property: `properties/464860211`,
      dateRanges: [
        {
          startDate,
          endDate,
        },
      ],
      dimensions: [
        {
          name: "date",
        },
        {
          name: "sessionSource",
        },
        {
          name: "sessionMedium",
        },
      ],
      metrics: [
        {
          name: "sessions",
        },
        {
          name: "engagedSessions",
        },
        {
          name: "bounceRate",
        },
      ],
      orderBys: [
        {
          dimension: {
            orderType: "ALPHANUMERIC",
            dimensionName: "date",
          },
        },
      ],
    });

    // Get source breakdown
    const [sourceResponse] = await analyticsDataClient.runReport({
      property: `properties/464860211`,
      dateRanges: [
        {
          startDate,
          endDate,
        },
      ],
      dimensions: [
        {
          name: "sessionSource",
        },
        {
          name: "sessionMedium",
        },
      ],
      metrics: [
        {
          name: "sessions",
        },
        {
          name: "bounceRate",
        },
        {
          name: "engagedSessions",
        },
      ],
    });

    if (dailyResponse?.rows?.length) {
      // Process daily metrics
      const dailyData = {};

      dailyResponse.rows.forEach((row) => {
        const date = row.dimensionValues[0].value;
        const source = row.dimensionValues[1].value;
        const medium = row.dimensionValues[2].value;

        if (!dailyData[date]) {
          dailyData[date] = {
            date,
            sessions: 0,
            engagedSessions: 0,
            bounceRate: 0,
            sources: {},
          };
        }

        dailyData[date].sessions += parseInt(row.metricValues[0].value);
        dailyData[date].engagedSessions += parseInt(row.metricValues[1].value);
        dailyData[date].bounceRate = (
          parseFloat(row.metricValues[2].value) * 100
        ).toFixed(2);

        // Track sources
        dailyData[date].sources[`${source}/${medium}`] = parseInt(
          row.metricValues[0].value
        );
      });

      // Convert to array and sort by date
      const formattedData = Object.values(dailyData).sort(
        (a, b) => new Date(a.date) - new Date(b.date)
      );
      console.log("formattedData", formattedData);
      // Process source breakdown
      const trafficSources = {
        organic: 0,
        social: 0,
        referral: 0,
        direct: 0,
      };
      // console.log("sourceResponse>>", sourceResponse);
      sourceResponse.rows.forEach((row) => {
        const source = row.dimensionValues[0].value.toLowerCase();
        const medium = row.dimensionValues[1].value.toLowerCase();
        const sessions = parseInt(row.metricValues[0].value);
        if (medium === "organic") {
          trafficSources.organic += sessions;
        } else if (
          medium === "social" ||
          source.includes("facebook") ||
          source.includes("instagram")
        ) {
          trafficSources.social += sessions;
        } else if (medium === "referral") {
          trafficSources.referral += sessions;
        } else if (source === "(direct)" && medium === "(none)") {
          trafficSources.direct += sessions;
        }
      });

      res.json({
        success: true,
        data: formattedData,
        trafficSources,
      });
    } else {
      res.json({
        success: false,
        message: "No data found for the specified metrics.",
      });
    }
  } catch (error) {
    console.error("Error accessing Google Analytics:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

const pushNotifications = async (connection, title, description) => {
  console.log("Function called with title:", title, "description:", description);

  const notificationPayload = JSON.stringify({
    title,
    body: description,
  });
  console.log("notificationPayload:", notificationPayload);

  try {
    const [results] = await connection.query("SELECT * FROM subscriptions");
    console.log("Found subscriptions:", results.length);

    if (results.length === 0) {
      console.log("No subscriptions found in database!");
      return;
    }

    const notificationPromises = results.map(async (subscription) => {
      console.log("Processing subscription:", subscription);

      const pushSubscription = {
        endpoint: subscription.endpoint,
        expirationTime: subscription.expirationTime,
        keys: {
          p256dh: subscription.p256dh,
          auth: subscription.auth,
        },
      };

      try {
        console.log("Attempting to send notification to:", pushSubscription);
        await webPush.sendNotification(pushSubscription, notificationPayload);
        console.log("Successfully sent notification to:", subscription.endpoint);
      } catch (err) {
        console.error("Error sending notification:", {
          error: err.message,
          statusCode: err.statusCode,
          endpoint: subscription.endpoint,
        });

        // If subscription is expired or invalid, remove it
        if (err.statusCode === 404 || err.statusCode === 410) {
          await removeInvalidSubscription(connection, subscription.endpoint);
        }
      }
    });

    await Promise.all(notificationPromises);
    console.log("All notifications processed!");
  } catch (err) {
    console.error("Database or general error:", err);
  }
};

// Function to remove invalid subscriptions from the database
const removeInvalidSubscription = async (connection, endpoint) => {
  await connection.query("DELETE FROM subscriptions WHERE endpoint = ?", [endpoint]);
  console.log(`Removed invalid subscription: ${endpoint}`);
};

