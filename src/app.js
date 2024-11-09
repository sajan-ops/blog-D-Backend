require("dotenv").config();
const express = require("express");
const cors = require("cors");
const adminRouter = require("../routes/Admin/Auth/index");
const adminPostRouter = require("../routes/Admin/Posts/index");
const superAdminRouter = require("../routes/SuperAdmin/Auth/index");
const superAdminUserHandlerRouter = require("../routes/SuperAdmin/UserHandlerRotues/index");
const subscriptions = require("../routes/SuperAdmin/SubscriptionHandleRoutes/index");

const userPostRouter = require("../routes/User/Posts/index");
const userRouter = require("../routes/User/Auth/index");
const path = require("path");
const http = require("http"); // Change to https
const socketIo = require("socket.io");
const morgan = require("morgan");
const { pool } = require("../db");

const app = express();
app.use(express.json());
app.use(morgan("dev"));

const server = http.createServer(app); // Create an HTTPS server with Express
const io = socketIo(server, {
  cors: {
    origin: "*", // Replace with your frontend URLs
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type", "Authorization"],
  },
});

// app level settings
app.use(
  cors({
    origin: "*", // Your next app URL
    credentials: true, // This is required to allow cookies and headers
  })
);

require("../db");
app.use(express.json({ limit: "500mb" }));
app.use(express.urlencoded({ limit: "500mb", extended: true }));
const Port = process.env.PORT || 1000;

// Define searchconsole at the top level
app.use("/admin", adminRouter);
app.use("/admin/post", adminPostRouter);
app.use("/admin", adminRouter);
app.use("/admin-super", superAdminRouter); // auth
app.use("/admin-super/userHandler", superAdminUserHandlerRouter); // apiUsersRoutes
app.use("/admin-super/subscriptions", subscriptions); // apiUsersRoutes
app.use("/user", userRouter);
app.use("/user/post", userPostRouter);

app.use("/images", express.static(path.join("public/images/")));

app.post("/subscribe", async (req, res) => {
  const { endpoint, expirationTime, keys } = req.body;
  console.log("subscribe API call");
  let connection = await pool.getConnection();
  // SQL query to insert subscription data
  const query = `INSERT INTO subscriptions (endpoint, expirationTime, p256dh, auth)
                 VALUES (?, ?, ?, ?)`;
  // Run the query
  connection.query(
    query,
    [endpoint, expirationTime, keys.p256dh, keys.auth],
    (error, results) => {
      if (error) {
        console.error("Error saving subscription:", error);
        res.status(500).json({ error: "Failed to save subscription" });
      } else {
        res
          .status(201)
          .json({ success: true, subscriptionId: results.insertId });
      }
    }
  );
  connection.release();
});

app.get("/", (req, res) => {
  res.json({ message: "Welcome to the tamam game backend" });
});

io.on("connection", (socket) => {
  console.log("User is connected");
  app.set("socketInstance", socket);
});

server.listen(Port, () => {
  console.log(`Server is listening at port ${Port}`);
});
