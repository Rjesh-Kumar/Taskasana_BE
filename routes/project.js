const express = require("express");
const router = express.Router();
const Project = require("../models/Project");
const Team = require("../models/Team");
const verifyToken = require("../middleware/authMiddleware");

/*
  CREATE PROJECT
  Only team members can create project
*/
router.post("/create", verifyToken, async (req, res) => {
  try {
    const { name, description, teamId, status } = req.body;

    // 1️⃣ Required field check
    if (!name) {
      return res.status(400).json({ message: "Project name is required" });
    }

    // 2️⃣ Status validation
    const allowedStatuses = ["To Do", "In-progress", "Completed", "Blocked"];
    const projectStatus = status && allowedStatuses.includes(status) ? status : "To Do"; 
    // default to "To Do" if not provided or invalid

    const project = new Project({
      name,
      description,
      status: projectStatus, // ✅ save status
      team: teamId || null,
      owner: req.user.id,
      createdBy: req.user.id
    });

    await project.save();

    res.status(201).json({
      message: "Project created successfully",
      project
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET ALL PROJECTS of logged-in user
router.get("/", verifyToken, async (req, res) => {
  try {
    const projects = await Project.find({
      createdBy: req.user.id
    });

    res.json(projects);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


// GET SINGLE PROJECT DETAILS
router.get("/:id", verifyToken, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate("team", "name");

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    res.json(project);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE PROJECT
router.delete("/:id", verifyToken, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: "Project not found" });

    await project.deleteOne();
    res.json({ message: "Project deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


// helper function
async function getUserTeamIds(userId) {
  const teams = await Team.find({ members: userId });
  return teams.map(team => team._id);
}


module.exports = router;
