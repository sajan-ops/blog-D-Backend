// const mongoose = require("mongoose")
// mongoose
//   .connect(process.env.mongoDBStr)
//   .then(() => console.log("Database connected"))
//   .catch((err) => console.log(`DB connection failed ${err}`));

const mysql = require("mysql2/promise");

// Create a pool of connections
const pool = mysql.createPool({
  host: process.env.HOST,
  user: process.env.USER,
  password: process.env.PASS,
  database: process.env.DB,
  waitForConnections: true,
  connectionLimit: 10, // Adjust as needed
  queueLimit: 0,
});

// seed database
const seedDatabase = async () => {
  let connection = await pool.getConnection();
  try {
    // 1. Create admin table
    await connection.query(
      `CREATE TABLE IF NOT EXISTS admin (
      id VARCHAR(255) PRIMARY KEY,
      email VARCHAR(100),
      role TEXT,
      password VARCHAR(100),
      verified BOOLEAN DEFAULT FALSE 
     )`
    );
    // 2.gallery table
    await connection.query(
      `CREATE TABLE IF NOT EXISTS gallery (
        id VARCHAR(255) PRIMARY KEY,
        filePath VARCHAR(255),
        usedInArticle BOOLEAN DEFAULT FALSE,
        adminID VARCHAR(255),
        FOREIGN KEY (adminID) REFERENCES admin(id) ON DELETE CASCADE
       )`
    );
    // 3. Users table
    await connection.query(
      `CREATE TABLE IF NOT EXISTS users (
       id VARCHAR(255) PRIMARY KEY,
       firstName VARCHAR(255),
       lastName VARCHAR(255),
       email VARCHAR(255),
       password VARCHAR(255),
       verified BOOLEAN DEFAULT FALSE )`
    );

    // 3. author table
    await connection.query(
      `CREATE TABLE IF NOT EXISTS authors (
       id VARCHAR(255) PRIMARY KEY,
       name VARCHAR(255),
       lastName VARCHAR(255)
      )`
    );

    await connection.query(
      `CREATE TABLE IF NOT EXISTS comments (
       id VARCHAR(255) PRIMARY KEY,
       comment TEXT,
       postid VARCHAR(255),
       userid VARCHAR(255),
       approve BOOLEAN DEFAULT FALSE,
       date_created_in DATETIME,
       FOREIGN KEY (postid) REFERENCES posts(slug) ON DELETE CASCADE,
       FOREIGN KEY (userid) REFERENCES users(id) ON DELETE CASCADE
      )`
    );

    await connection.query(
      `CREATE TABLE IF NOT EXISTS subscriptions (
       id VARCHAR(90) PRIMARY KEY,
       price INT,
       plan TEXT,
       status TEXT,
       startDate DATETIME,
       endDate DATETIME, 
       userid VARCHAR(255),
       FOREIGN KEY (userid) REFERENCES users(id) ON DELETE CASCADE
      )`
    );

    await connection.query(
      `CREATE TABLE IF NOT EXISTS likes (
       id VARCHAR(255) PRIMARY KEY,
       postid VARCHAR(255),
       userid VARCHAR(255),
       created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
       UNIQUE KEY uniquekeygroup (postid, userid),
       FOREIGN KEY (postid) REFERENCES posts(slug) ON DELETE CASCADE,
       FOREIGN KEY (userid) REFERENCES users(id) ON DELETE CASCADE
      )`
    );

    // 3. Users table
    await connection.query(
      `CREATE TABLE IF NOT EXISTS categories (
         id VARCHAR(255) PRIMARY KEY,
         name VARCHAR(255)
          )`
    );

    await connection.query(`
          CREATE TABLE IF NOT EXISTS subscriptions (
          id INT AUTO_INCREMENT PRIMARY KEY,
          endpoint TEXT NOT NULL,
          expirationTime TIMESTAMP NULL,
          p256dh VARCHAR(255) NOT NULL,
          auth VARCHAR(255) NOT NULL
          );
         `);
    // 2. Create posts table if not exists
    await connection.query(`
      CREATE TABLE IF NOT EXISTS posts (
        slug VARCHAR(255) PRIMARY KEY,
        id VARCHAR(255),
        title TEXT,
        filePath JSON,
        content TEXT,
        date_created_in DATETIME,
        description TEXT,
        keywords TEXT,
        author TEXT,
        status TEXT,
        publish_time TEXT,
        category TEXT,
        likes INT DEFAULT 0,
        deleted BOOLEAN DEFAULT FALSE,
        readTime VARCHAR(255),
        FULLTEXT(title)
      );
    `);

    console.log("seed my database");
  } catch (err) {
    console.error("Error connecting:", err);
  } finally {
    connection.release();
  }
};

seedDatabase();

module.exports = { pool };
