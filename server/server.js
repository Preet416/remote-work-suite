// server.js
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*", methods: ["GET","POST"] } });

// Rooms: { roomId: { approved: Set<socketId>, waiting: Set<socketId> } }
const rooms = {};

io.on("connection", (socket) => {
  console.log("New connection:", socket.id);

  socket.on("join-room-request", ({ roomId, username }) => {
    if (!rooms[roomId]) {
      rooms[roomId] = { approved: new Set(), waiting: new Set() };
      // First user is host
      rooms[roomId].approved.add(socket.id);
      socket.emit("host-approved"); // notify client it's host
    } else {
      rooms[roomId].waiting.add(socket.id);
      // Notify host(s) someone wants to join
      const hosts = Array.from(rooms[roomId].approved);
      hosts.forEach((hostId) => {
        io.to(hostId).emit("waiting-user", { socketId: socket.id, username });
      });
    }
  });

  socket.on("approve-user", ({ roomId, socketIdToApprove }) => {
    if (!rooms[roomId] || !rooms[roomId].waiting.has(socketIdToApprove)) return;

    rooms[roomId].waiting.delete(socketIdToApprove);
    rooms[roomId].approved.add(socketIdToApprove);

    // Notify approved user
    io.to(socketIdToApprove).emit("approved-to-join", { roomId });

    // Notify existing approved users
    rooms[roomId].approved.forEach((userId) => {
      if (userId !== socketIdToApprove) {
        io.to(userId).emit("new-user-approved", { socketId: socketIdToApprove });
      }
    });
  });

  socket.on("signal", ({ to, from, signal }) => {
    io.to(to).emit("signal", { from, signal });
  });

  socket.on("disconnect", () => {
    Object.keys(rooms).forEach((roomId) => {
      rooms[roomId].approved.delete(socket.id);
      rooms[roomId].waiting.delete(socket.id);
      io.to(roomId).emit("user-disconnected", socket.id);
    });
  });
});

server.listen(5000, () => console.log("Server running on port 5000"));
