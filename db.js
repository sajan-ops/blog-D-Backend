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
      id VARCHAR(100) PRIMARY KEY,
      email VARCHAR(100),
      role TEXT,
      password VARCHAR(100),
      verified BOOLEAN DEFAULT FALSE 
     )`
    );
    // 2.gallery table
    await connection.query(
      `CREATE TABLE IF NOT EXISTS gallery (
        id VARCHAR(100) PRIMARY KEY,
        filePath VARCHAR(100),
        usedInArticle BOOLEAN DEFAULT FALSE,
        adminID VARCHAR(100),
        FOREIGN KEY (adminID) REFERENCES admin(id) ON DELETE CASCADE
       )`
    );
    // 3. Users table
    await connection.query(
      `CREATE TABLE IF NOT EXISTS users (
       id VARCHAR(100) PRIMARY KEY,
       firstName VARCHAR(100),
       lastName VARCHAR(100),
       email VARCHAR(100),
       password VARCHAR(100),
       verified BOOLEAN DEFAULT FALSE )`
    );
    // 2. Create posts table if not exists
    await connection.query(`
  CREATE TABLE IF NOT EXISTS posts (
    slug VARCHAR(100) PRIMARY KEY,
    id VARCHAR(100),
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
    readTime VARCHAR(100),
    FULLTEXT(title)
  );
`);
    // 3. author table
    await connection.query(
      `CREATE TABLE IF NOT EXISTS authors (
       id VARCHAR(100) PRIMARY KEY,
       name VARCHAR(100),
       lastName VARCHAR(100)
      )`
    );

    await connection.query(
      `CREATE TABLE IF NOT EXISTS comments (
       id VARCHAR(100) PRIMARY KEY,
       comment TEXT,
       postid VARCHAR(100),
       userid VARCHAR(100),
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
       userid VARCHAR(100),
       FOREIGN KEY (userid) REFERENCES users(id) ON DELETE CASCADE
      )`
    );

    await connection.query(
      `CREATE TABLE IF NOT EXISTS likes (
       id VARCHAR(100) PRIMARY KEY,
       postid VARCHAR(100),
       userid VARCHAR(100),
       created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
       UNIQUE KEY uniquekeygroup (postid, userid),
       FOREIGN KEY (postid) REFERENCES posts(slug) ON DELETE CASCADE,
       FOREIGN KEY (userid) REFERENCES users(id) ON DELETE CASCADE
      )`
    );

    // 3. Users table
    await connection.query(
      `CREATE TABLE IF NOT EXISTS categories (
         id VARCHAR(100) PRIMARY KEY,
         name VARCHAR(100)
          )`
    );

    await connection.query(`
          CREATE TABLE IF NOT EXISTS subscriptions (
          id INT AUTO_INCREMENT PRIMARY KEY,
          endpoint TEXT NOT NULL,
          expirationTime TIMESTAMP NULL,
          p256dh VARCHAR(100) NOT NULL,
          auth VARCHAR(100) NOT NULL
          );
         `);

    // 4. Create subscription_plans table if not exists

    await connection.query(`
  CREATE TABLE IF NOT EXISTS subscription_plans (
    id VARCHAR(100) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  )
`);

    console.log("seed my database");
  } catch (err) {
    console.error("Error connecting:", err);
  } finally {
    connection.release();
  }
};

// Subscription Plan CRUD Operations
const subscriptionPlanQueries = {
  createPlan: async (plan) => {
    const connection = await pool.getConnection();
    try {
      const query = `
        INSERT INTO subscription_plans (id, name, price) 
        VALUES (?, ?, ?)
      `;
      return await connection.query(query, [plan.id, plan.name, plan.price]);
    } finally {
      connection.release();
    }
  },

  getAllPlans: async () => {
    const connection = await pool.getConnection();
    try {
      const query = `
        SELECT * FROM subscription_plans 
        WHERE status = 'active'
        ORDER BY created_at DESC
      `;
      return await connection.query(query);
    } finally {
      connection.release();
    }
  },

  updatePlan: async (plan) => {
    const connection = await pool.getConnection();
    try {
      const query = `
        UPDATE subscription_plans 
        SET name = ?, price = ?
        WHERE id = ?
      `;
      return await connection.query(query, [plan.name, plan.price, plan.id]);
    } finally {
      connection.release();
    }
  },

  deletePlan: async (id) => {
    const connection = await pool.getConnection();
    try {
      const query = `
        UPDATE subscription_plans 
        SET status = 'inactive'
        WHERE id = ?
      `;
      return await connection.query(query, [id]);
    } finally {
      connection.release();
    }
  },
};

seedDatabase();

module.exports = {
  pool,
  ...subscriptionPlanQueries,
};
