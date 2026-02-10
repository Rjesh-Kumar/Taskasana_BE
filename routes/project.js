const express = require("express");
const router = express.Router();
const Project = require("../models/Project");
const Team = require("../models/Team");
const verifyToken = require("../middleware/authMiddleware");

/*
  CREATE PROJECT
  Only team members can create project
*/
// In projectRoutes.js - CREATE PROJECT
router.post("/create", verifyToken, async (req, res) => {
  try {
    const { name, description, teamId, status } = req.body;

    // 1️⃣ Required field check
    if (!name) {
      return res.status(400).json({ message: "Project name is required" });
    }

    // 2️⃣ TEAM IS NOW REQUIRED - Add this check!
    if (!teamId) {
      return res.status(400).json({ message: "Team is required for project" });
    }

    // 3️⃣ Verify user is a team member
    const team = await Team.findById(teamId);
    if (!team) {
      return res.status(404).json({ message: "Team not found" });
    }
    if (!team.members.includes(req.user.id)) {
      return res.status(403).json({ message: "You are not a member of this team" });
    }

    // 4️⃣ Status validation
    const allowedStatuses = ["To Do", "In-progress", "Completed", "Blocked"];
    const projectStatus = status && allowedStatuses.includes(status) ? status : "To Do";

    const project = new Project({
      name,
      description,
      status: projectStatus,
      team: teamId, // ← Now always has a value (no more null!)
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

// GET ALL PROJECTS accessible to logged-in user
// GET ALL PROJECTS accessible to logged-in user
router.get("/", verifyToken, async (req, res) => {
  try {
    // Get all teams where user is a member
    const userTeams = await Team.find({ members: req.user.id });
    const teamIds = userTeams.map(team => team._id);

    // Get projects that belong to teams where user is a member
    const projects = await Project.find({
      team: { $in: teamIds }
    })
    .populate("team", "_id name")
    .sort({ createdAt: -1 });

    res.json(projects);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET PROJECTS BY TEAM
// GET PROJECTS BY TEAM - UPDATED VERSION
router.get("/team/:teamId", verifyToken, async (req, res) => {
  try {
    const { teamId } = req.params;
    const userId = req.user.id;

    // Verify user is a member of this team
    const team = await Team.findById(teamId);
    if (!team) {
      return res.status(404).json({ message: "Team not found" });
    }
    if (!team.members.includes(userId)) {
      return res.status(403).json({ message: "You are not a member of this team" });
    }

    // Get projects for this team WHERE user is either:
    // 1. The creator (createdBy: userId) OR
    // 2. Project belongs to this team (already filtered by team: teamId)
    const projects = await Project.find({
      team: teamId
      // REMOVED: createdBy: userId - This was causing empty results
    })
      .populate("team", "_id name")
      .sort({ createdAt: -1 });

    res.json(projects);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET SINGLE PROJECT DETAILS
router.get("/:id", verifyToken, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate("team", "name _id");

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    // Check if user has access (creator or team member)
    if (project.createdBy.toString() !== req.user.id) {
      if (project.team) {
        const team = await Team.findById(project.team);
        if (!team || !team.members.includes(req.user.id)) {
          return res.status(403).json({ message: "Access denied" });
        }
      } else {
        return res.status(403).json({ message: "Access denied" });
      }
    }

    res.json(project);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// UPDATE PROJECT
router.patch("/:id", verifyToken, async (req, res) => {
  try {
    const { name, description, status } = req.body;
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    // Check permission
    if (project.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ message: "Only the creator can update this project" });
    }

    if (name) project.name = name;
    if (description !== undefined) project.description = description;
    if (status) project.status = status;

    await project.save();

    res.json({
      message: "Project updated successfully",
      project
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE PROJECT
router.delete("/:id", verifyToken, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: "Project not found" });

    // Check permission
    if (project.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ message: "Only the creator can delete this project" });
    }

    await project.deleteOne();
    res.json({ message: "Project deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;