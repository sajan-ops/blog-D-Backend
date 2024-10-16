require("dotenv").config();
const express = require("express");
const cors = require("cors");
const router = require("../routes");
const path = require("path");
const http = require("http");
const socketIo = require("socket.io");
const { User } = require("../Model/userSchema");

const app = express();
const server = http.createServer(app); // Create an HTTP server with Express
const io = socketIo(server, {
  cors: {
    origin: "*", // Replace with your frontend URLs
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type", "Authorization"],
  },
}); // Integrate Socket.IO with the HTTP server

app.use(cors());
require("../db");
app.use(express.json({ limit: "500mb" }));
app.use(express.urlencoded({ limit: "500mb", extended: true }));

const Port = process.env.PORT || 1000;

app.use("/", router);
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
