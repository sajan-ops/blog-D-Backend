const { pool } = require("../../db");
const { v4: uuidv4 } = require("uuid");
const fs = require("fs");
const { slugify } = require("../../util/slugify");
const { getCurrentDate } = require("../../util/getCurrentDate");
const path = require("path");

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
    res.status(200).json({ message: "File Deleted successfully" });
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
