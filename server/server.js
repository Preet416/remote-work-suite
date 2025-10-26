// server/server.js
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const path = require("path");

const taskRoutes = require("./tasks");

const app = express();
app.use(cors());
app.use(express.json()); // Important for req.body

// Tasks API
app.use("/api/tasks", taskRoutes);

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*", methods: ["GET", "POST"] } });

// Rooms state
const rooms = {}; // { roomId: { approved: Set(socketId), waiting: Set(socketId) } }

io.on("connection", (socket) => {
  console.log("New connection:", socket.id);

  socket.on("join-room-request", ({ roomId, userInfo }) => {
    if (!rooms[roomId]) {
      rooms[roomId] = { approved: new Set(), waiting: new Set() };
      rooms[roomId].approved.add(socket.id);
      socket.emit("host-approved");
      socket.userInfo = userInfo || { name: "Host", email: "host@local" };
      console.log(`Room ${roomId} created by ${socket.id} (${socket.userInfo.name})`);
    } else {
      rooms[roomId].waiting.add(socket.id);
      socket.userInfo = userInfo || { name: "Guest", email: "guest@local" };
      const hosts = Array.from(rooms[roomId].approved);
      hosts.forEach((hostId) => {
        io.to(hostId).emit("waiting-user", { socketId: socket.id, userInfo: socket.userInfo });
      });
      console.log(`${socket.userInfo.name} (${socket.id}) is waiting to join room ${roomId}`);
    }
  });

  socket.on("approve-user", ({ roomId, socketIdToApprove }) => {
    if (!rooms[roomId]) return;
    if (!rooms[roomId].waiting.has(socketIdToApprove)) return;

    rooms[roomId].waiting.delete(socketIdToApprove);
    rooms[roomId].approved.add(socketIdToApprove);

    io.to(socketIdToApprove).emit("approved-to-join", { roomId });

    rooms[roomId].approved.forEach((userId) => {
      if (userId !== socketIdToApprove) {
        io.to(userId).emit("new-user-approved", { socketId: socketIdToApprove, userInfo: null });
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
      if (rooms[roomId].approved.size === 0 && rooms[roomId].waiting.size === 0) {
        delete rooms[roomId];
        console.log(`Room ${roomId} deleted (empty)`);
      }
    });
  });
});

// Serve frontend
const frontendPath = path.join(__dirname, "../client/dist");
app.use(express.static(frontendPath));
app.get(/.*/, (req, res) => {
  res.sendFile(path.join(frontendPath, "index.html"));
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
