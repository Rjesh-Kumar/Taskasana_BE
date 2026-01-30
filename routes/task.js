const express = require("express");
const router = express.Router();
const Task = require("../models/Task");
const Project = require("../models/Project");
const Team = require("../models/Team");
const verifyToken = require("../middleware/authMiddleware");

/*
  CREATE TASK
  Only team members can create tasks in a project
*/
router.post("/create", verifyToken, async (req, res) => {
  try {
    const {
      name,
      description,
      projectId,
      teamId,
      owners,        // array of user IDs
      tags,          // array of strings
      timeToComplete,
      dueDate
    } = req.body;

    // Basic validation
    if (!name || !projectId || !teamId || !owners || !timeToComplete || !dueDate) {
      return res.status(400).json({ message: "Required fields missing" });
    }

    // Check if team exists
    const team = await Team.findById(teamId);
    if (!team) return res.status(404).json({ message: "Team not found" });

    // Check if logged-in user is a team member
    if (!team.members.includes(req.user.id)) {
      return res.status(403).json({ message: "You are not a team member" });
    }

    // Check if project exists and belongs to this team
    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ message: "Project not found" });
    if (project.team.toString() !== teamId) {
      return res.status(400).json({ message: "Project does not belong to this team" });
    }

    // Optional: validate owners are part of team
    for (let ownerId of owners) {
      if (!team.members.includes(ownerId)) {
        return res.status(400).json({ message: "One or more owners are not team members" });
      }
    }

    // Create task
    const task = new Task({
      name,
      description,
      project: projectId,
      team: teamId,
      owners,
      tags,
      timeToComplete,
      dueDate,
      createdBy: req.user.id
    });

    await task.save();

    res.status(201).json({
      message: "Task created successfully",
      task
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET ALL TASKS of logged-in user
router.get("/", verifyToken, async (req, res) => {
  try {
    const tasks = await Task.find({
      $or: [
        { createdBy: req.user.id },
        { owners: req.user.id }
      ]
    })
      .populate("project", "name")
      .populate("team", "name")
      .populate("owners", "name");

    res.json(tasks);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET SINGLE TASK DETAILS
router.get("/:taskId", verifyToken, async (req, res) => {
  try {
    const task = await Task.findById(req.params.taskId)
      .populate("project", "name")
      .populate("team", "name")
      .populate("owners", "name");

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    res.json({ task });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


// GET TASKS BY PROJECT
router.get("/project/:projectId", verifyToken, async (req, res) => {
  try {
    const tasks = await Task.find({ project: req.params.projectId })
      .populate("owners", "name")
      .populate("project", "name")
      .populate("team", "name");

    res.json(tasks);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


// UPDATE TASK TAGS
router.patch("/update/:taskId", verifyToken, async (req, res) => {
  try {
    const { taskId } = req.params;
    const { tags, status } = req.body;

    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    // Only creator or owner can update
    if (
      task.createdBy.toString() !== req.user.id &&
      !task.owners.includes(req.user.id)
    ) {
      return res.status(403).json({ message: "Not allowed to update this task" });
    }

    if (tags) task.tags = tags;
    if (status) task.status = status;

    await task.save();

    res.json({
      message: "Task updated successfully",
      task
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete("/:id", verifyToken, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: "Task not found" });

    await task.deleteOne();
    res.json({ message: "Task deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


module.exports = router;
