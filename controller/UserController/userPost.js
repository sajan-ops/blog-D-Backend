const { pool } = require("../../db");
const { v4: uuidv4 } = require("uuid");
const { getCurrentDate } = require("../../util/getCurrentDate");

exports.getAllposts = async (req, res) => {
  let { filterType, filter, page, searchTerm } = req.query;
  page = Number(page);
  let pageNumber;
  let postType = req.params.type;
  let connection = await pool.getConnection();
  let limit = 6;
  let offset = 0;
  if (isNaN(page)) {
    page = 0;
  }
  offset = 0 + page * limit;
  page = page + 1;
  pageNumber = page;
  try {
    if (searchTerm && searchTerm !== "undefined" && searchTerm !== "") {
      console.log({ searchTerm });

      let sql = `
      SELECT * FROM posts 
      WHERE (
        MATCH(title) AGAINST(? IN BOOLEAN MODE) 
        OR title LIKE CONCAT('%', ?, '%')
      )
      AND deleted = ? 
      ORDER BY 
        CASE 
          WHEN title LIKE CONCAT(?, '%') THEN 1  /* Exact start match */
          WHEN title LIKE CONCAT('%', ?, '%') THEN 2  /* Contains match */
          ELSE 3
        END,
        id DESC 
      LIMIT ? OFFSET ?
    `;

      // Update query parameters to match new placeholders
      let queryParams = [
        searchTerm, // for MATCH AGAINST
        searchTerm, // for LIKE
        false, // for deleted
        searchTerm, // for CASE exact start
        searchTerm, // for CASE contains
        limit,
        offset,
      ];
      let [rows] = await connection.query(sql, queryParams);
      res.status(200).json({
        success: true,
        rows,
        pageNumber,
        message: "Data fetched successfully",
      });
      return;
    }
    // Handle the case when filter is not provided or is "all"
    if (filter === "null" || filter === "") {
      let sql =
        "SELECT * FROM posts WHERE deleted = ? ORDER BY id DESC LIMIT ? OFFSET ?";
      let queryParams = [false, limit, offset];
      let [rows] = await connection.query(sql, queryParams);
      res.status(200).json({
        success: true,
        rows,
        pageNumber,
        message: "Data fetched successfully",
      });
      return;
    }
    // Build the base query with WHERE clause
    let sql = "SELECT * FROM posts WHERE deleted = ?";
    let queryParams = [false];

    // Add conditions based on provided filters
    if (postType) {
      sql += " AND status = ?";
      queryParams.push(postType);
    }
    if (filterType === "category") {
      sql += " AND category = ?";
      queryParams.push(filter);
    }
    if (filterType === "status") {
      sql += " AND status = ?";
      queryParams.push(filter);
    }
    if (filterType === "date") {
      sql += " AND date_created_in = ?";
      queryParams.push(filter);
    }
    if (filterType === "author") {
      sql += " AND author = ?";
      queryParams.push(filter);
    }

    // Add ORDER BY, LIMIT and OFFSET at the end
    sql += " ORDER BY id DESC LIMIT ? OFFSET ?";
    queryParams.push(limit, offset);

    let [rows] = await connection.query(sql, queryParams);
    const sql2 = "SELECT * FROM categories";
    let [categories] = await connection.query(sql2, []);

    res.status(200).json({
      success: true,
      rows,
      categories,
      pageNumber,
      message: "Data fetched successfully",
    });
  } catch (error) {
    console.error("Error in getting posts: ", error);
    res
      .status(500)
      .json({ message: "Error in getting posts", error: error.message });
  } finally {
    connection.release();
  }
};

exports.getRelatedposts = async (req, res) => {
  let category = req.params.category;
  let connection = await pool.getConnection();
  try {
    let sql = "SELECT * FROM posts WHERE deleted=? AND category=? limit 3";
    let queryParamssecon = [false, category];
    let [rows] = await connection.query(sql, queryParamssecon);
    res.status(200).json({
      success: true,
      rows,
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

exports.postComment = async (req, res) => {
  let connection = await pool.getConnection();
  const userid = req.userid;
  let slug = req.params.slug;
  let commentid = uuidv4();
  let comment = req.body.newComment;
  let date = getCurrentDate();
  try {
    const sql =
      "INSERT INTO comments (id, comment ,postid ,userid, date_created_in) values (?,?,?,?,?)";
    let [rows] = await connection.query(sql, [
      commentid,
      comment,
      slug,
      userid,
      date,
    ]);
    res
      .status(200)
      .json({ success: true, post: rows[0], message: "Data Got successfully" });
  } catch (error) {
    console.error("Error In single getting Posts: ", error);
    res
      .status(500)
      .json({ message: "Error In single getting Posts", error: error.message });
  } finally {
    connection.release(); // Release the connection back to the pool
  }
};

exports.getComments = async (req, res) => {
  // also get the user data.
  let connection = await pool.getConnection();
  let slug = req.params.slug;

  try {
    const sql = "select * from comments where postid=?";
    let [comments] = await connection.query(sql, [slug]);
    let commentsWithUsers = [];
    for (let i = 0; i < comments.length; i++) {
      const commentid = comments[i].id;
      const approve = comments[i].approve;
      const userid = comments[i].userid;
      const comment = comments[i].comment;
      const date = comments[i].date_created_in;
      const sql2 = "select * from users where id=?";
      let [users] = await connection.query(sql2, [userid]);
      let username = users[0].firstName;
      commentsWithUsers.push({ commentid, approve, username, comment, date });
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

exports.likePost = async (req, res) => {
  let socketio = req.app.get("socketInstance");
  const connection = await pool.getConnection();
  const postid = req.body.postId;
  const userid = req.userid;
  // Validate input
  if (!postid || !userid) {
    return res.status(400).json({ message: "postid and userid are required" });
  }
  try {
    // Insert like into the likes table if liked is true
    await connection.query(
      `INSERT INTO likes (id, postid, userid) VALUES (UUID(), ?, ?)`,
      [postid, userid]
    );
    socketio.broadcast.emit("postLiked", { success: true });
    res.status(201).json({ success: true, message: "Like added successfully" });
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      // Remove like from the likes table if liked is false
      await connection.query(
        `DELETE FROM likes WHERE postid = ? AND userid = ?`,
        [postid, userid]
      );
      socketio.broadcast.emit("postLiked", { success: true });
      res.json({ message: "Like already exists" });
    } else {
      console.error(error);
      res.status(500).json({ message: "An error occurred" });
    }
  } finally {
    connection.release(); // Release the connection back to the pool
  }
};

exports.likesCount = async (req, res) => {
  let connection = await pool.getConnection();
  const postid = req.params.postId;
  // Validate input
  if (!postid) {
    return res.status(400).json({ message: "postid is required" });
  }
  try {
    // If no user is logged in, get the total likes count for the post
    let [ShowallLikes] = await connection.query(
      `SELECT COUNT(*) as postLikes FROM likes WHERE postid=?`,
      [postid]
    );
    res.status(200).json({
      success: true,
      data: {
        postlikes: ShowallLikes[0],
      },
      message: "Total post likes count",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "An error occurred", success: false });
  } finally {
    connection.release(); // Release the connection back to the pool
  }
};
