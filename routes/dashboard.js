const express = require("express");
const router = express.Router();
const Task = require("../models/Task");
const Project = require("../models/Project");
const auth = require("../middleware/authMiddleware");

router.get("/stats", auth, async (req, res) => {
  try {
    const projects = await Project.countDocuments({ createdBy: req.user.id });
    const tasks = await Task.countDocuments({ createdBy: req.user.id });
    const completed = await Task.countDocuments({ status: "Completed", createdBy: req.user.id });
    const inProgress = await Task.countDocuments({ status: "In-progress", createdBy: req.user.id });

    res.json({ projects, tasks, completed, inProgress });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
