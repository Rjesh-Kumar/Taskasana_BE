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
    const { name, description, teamId } = req.body;

    if (!name || !teamId) {
      return res.status(400).json({ message: "Name and teamId are required" });
    }

    const team = await Team.findById(teamId);

    if (!team) {
      return res.status(404).json({ message: "Team not found" });
    }

    // Check if logged-in user is part of team
    if (!team.members.includes(req.user.id)) {
      return res.status(403).json({ message: "You are not a team member" });
    }

    const project = new Project({
      name,
      description,
      team: teamId,
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
      $or: [
        { createdBy: req.user.id },
        { team: { $in: await getUserTeamIds(req.user.id) } }
      ]
    }).populate("team", "name");

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
