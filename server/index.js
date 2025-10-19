// server/index.js
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
app.use(cors());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("join-room", (roomId, userId) => {
    socket.join(roomId);
    console.log(`${userId} joined room ${roomId}`);

    socket.to(roomId).emit("user-connected", userId);

    socket.on("signal", (data) => {
      socket.to(data.to).emit("signal", { from: userId, signal: data.signal });
    });

    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
      socket.to(roomId).emit("user-disconnected", userId);
    });
  });
});

server.listen(5000, () => console.log("Signaling server running on port 5000"));
