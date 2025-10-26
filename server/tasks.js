// server/tasks.js
const express = require("express");
const router = express.Router();
const { v4: uuidv4 } = require("uuid");
const fs = require("fs");
const path = require("path");

const DATA_FILE = path.join(__dirname, "tasks.json");

// Load tasks safely
let tasks = [];
if (fs.existsSync(DATA_FILE)) {
  try {
    tasks = JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));
  } catch (err) {
    console.error("Failed to read tasks.json, initializing empty tasks");
    tasks = [];
  }
}

// Save tasks safely
const saveTasks = () => {
  const uniqueTasks = Array.from(new Map(tasks.map(t => [t.id, t])).values());
  tasks = uniqueTasks; // ensure no duplicates in memory
  fs.writeFileSync(DATA_FILE, JSON.stringify(tasks, null, 2));
};

// Get tasks
router.get("/", (req, res) => {
  const { email, role } = req.query;
  if (!email || !role) return res.status(400).json({ error: "Missing email or role" });

  let visibleTasks = tasks;
  if (role !== "manager") visibleTasks = tasks.filter(t => t.assignedTo === email);

  res.json(visibleTasks);
});

// Add task
router.post("/", (req, res) => {
  const { title, description, assignedTo, status } = req.body;
  if (!title) return res.status(400).json({ error: "Task title is required" });

  const newTask = {
    id: uuidv4(),
    title,
    description: description || "",
    assignedTo: assignedTo || "",
    status: status || "todo",
  };

  tasks.push(newTask);
  saveTasks();

  res.status(201).json(newTask);
});

// Update task
router.put("/:id", (req, res) => {
  const { id } = req.params;
  const task = tasks.find(t => t.id === id);
  if (!task) return res.status(404).json({ error: "Task not found" });

  Object.assign(task, req.body);
  saveTasks();
  res.json(task);
});

// Delete task
router.delete("/:id", (req, res) => {
  tasks = tasks.filter(t => t.id !== req.params.id);
  saveTasks();
  res.json({ message: "Task deleted" });
});

module.exports = router;
