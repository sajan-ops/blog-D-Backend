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
  console.log("seedDatabase starting...");
  let connection = await pool.getConnection();
  try {
    // 1. Create admin table
    await connection.query(
     `CREATE TABLE IF NOT EXISTS admin (
      id VARCHAR(255) PRIMARY KEY,
      email VARCHAR(255),
      password VARCHAR(255),
      verified BOOLEAN DEFAULT FALSE )`
    );
    // 2. Create posts table if not exists
    await connection.query(`
      CREATE TABLE IF NOT EXISTS posts (
        slug VARCHAR(255) PRIMARY KEY,
        id VARCHAR(255),
        title TEXT,
        filePath TEXT,
        content TEXT,
        date_created_in DATETIME,
        description TEXT,
        keywords TEXT,
        author TEXT,
        canonicalUrl TEXT,
        metaRobots TEXT,
        ogTitle TEXT,
        ogDescription TEXT,
        ogImage TEXT,
        twitterTitle TEXT,
        twitterDescription TEXT,
        twitterImage TEXT,
        structuredData TEXT,
        readTime VARCHAR(255)
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
