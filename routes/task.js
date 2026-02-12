const express = require("express");
const router = express.Router();
const Task = require("../models/Task");
const Project = require("../models/Project");
const Team = require("../models/Team");
const verifyToken = require("../middleware/authMiddleware");

/*
  CREATE TASK
*/
router.post("/create", verifyToken, async (req, res) => {
  try {
    const {
      name,
      description,
      projectId,
      teamId,
      owners = [],
      tags = [],
      timeToComplete,
      dueDate,
      status = "To Do",       
      priority = "Medium"     
    } = req.body;

    if (!name || !projectId || !teamId || !timeToComplete || !dueDate) {
      return res.status(400).json({ message: "Required fields missing" });
    }

    const team = await Team.findById(teamId);
    if (!team) return res.status(404).json({ message: "Team not found" });

    if (!team.members.includes(req.user.id)) {
      return res.status(403).json({ message: "You are not a team member" });
    }

    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ message: "Project not found" });
    if (!project.team || project.team.toString() !== teamId) {
      return res.status(400).json({ message: "Project does not belong to this team" });
    }

    for (let ownerId of owners) {
      if (!team.members.includes(ownerId)) {
        return res.status(400).json({ message: "One or more owners are not team members" });
      }
    }

    const task = new Task({
      name,
      description,
      project: projectId,
      team: teamId,
      owners,
      tags,
      timeToComplete,
      dueDate,
      status,      
      priority,   
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


/* GET TASKS BY PROJECT */
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


/* GET SINGLE TASK DETAILS */
router.get("/:taskId", verifyToken, async (req, res) => {
  try {
    const task = await Task.findById(req.params.taskId)
      .populate("project", "name")
      .populate("team", "name")
      .populate("owners", "name")
      .populate("tags", "name");

    if (!task) return res.status(404).json({ message: "Task not found" });

    res.json({ task });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET TEAM BY ID WITH MEMBERS
router.get("/:id", verifyToken, async (req, res) => {
  const team = await Team.findById(req.params.id).populate("members", "name email");
  res.json(team);
});

/* GET ALL TASKS OF LOGGED-IN USER */
router.get("/", verifyToken, async (req, res) => {
  try {
    const tasks = await Task.find({
      $or: [{ createdBy: req.user.id }, { owners: req.user.id }]
    })
      .populate("project", "name")
      .populate("team", "name")
      .populate("owners", "name");

    res.json(tasks);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


/* UPDATE TASK (STATUS, PRIORITY, TAGS) */
router.patch("/update/:taskId", verifyToken, async (req, res) => {
  try {
    const { taskId } = req.params;
    const { tags, status, priority } = req.body; // ✅ priority added

    const task = await Task.findById(taskId);
    if (!task) return res.status(404).json({ message: "Task not found" });

    if (
      task.createdBy.toString() !== req.user.id &&
      !task.owners.includes(req.user.id)
    ) {
      return res.status(403).json({ message: "Not allowed to update this task" });
    }

    if (tags) task.tags = tags;
    if (status) task.status = status;
    if (priority) task.priority = priority;   // ✅ NEW

    await task.save();

    res.json({
      message: "Task updated successfully",
      task
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


/* DELETE TASK */
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
