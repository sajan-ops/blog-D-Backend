require("dotenv").config();
const express = require("express");
const cors = require("cors");
const adminRouter = require("../routes/Admin/Auth/index");
const userRouter = require("../routes/User/Auth/index");
const path = require("path");
const http = require("http");
const socketIo = require("socket.io");
const morgan = require("morgan");
const session = require("express-session");

const app = express();
app.use(
  session({
    secret: "your-secret-key",
    resave: false,
    saveUninitialized: false,
    cookie: { secure: process.env.NODE_ENV === 'production' }
  })
);
app.use(morgan("dev"));
const server = http.createServer(app); // Create an HTTP server with Express
const io = socketIo(server, {
  cors: {
    origin: "*", // Replace with your frontend URLs
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type", "Authorization"],
  },
}); // Integrate Socket.IO with the HTTP server
// Session setup
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

app.use("/admin", adminRouter);
app.use("/user", userRouter);
app.use("/images", express.static(path.join("public/images/")));

app.get("/", (req, res) => {
  res.json({ message: "welcome to the tamam game backend" });
});

let socketMap = new Map();

io.on("connection", (socket) => {
  socket.on("saveConnUserId", ({ userId }) => {
    socketMap.set(userId, socket.id);
  });
  socket.on("answer", (data) => {
    let userId = data.userId;
    let socketid = socketMap.get(userId);
    socket
      .to(socketid)
      .emit("answered", { teamName: data.teamName, answer: data.answer });
  });
});

server.listen(Port, () => {
  console.log(`Server is listening at port ${Port}`);
});
