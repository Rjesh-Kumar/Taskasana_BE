const express = require("express");
const User = require("../models/User");
const router = express.Router();
const Team = require("../models/Team");
const verifyToken = require("../middleware/authMiddleware");

router.get("/test", (req, res) => res.send("TEAM ROUTER WORKS"));

/* ================= GET ALL REGISTERED USERS (FOR DROPDOWN) ================= */
router.get("/users/all", verifyToken, async (req, res) => {
  try {
    const users = await User.find().select("name email");
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/* ================= GET ALL TEAMS OF LOGGED-IN USER ================= */
router.get("/", verifyToken, async (req, res) => {
  try {
    const teams = await Team.find({ members: req.user.id })
      .populate("owner", "name email")
      .populate("members", "name email");

    res.json(teams);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/* ================= GET SINGLE TEAM DETAILS ================= */
router.get("/:id", verifyToken, async (req, res) => {
  try {
    const team = await Team.findById(req.params.id)
      .populate("owner", "name email")
      .populate("members", "name email");

    if (!team) return res.status(404).json({ message: "Team not found" });

    res.json(team);
  } catch (error) {
    res.status(400).json({ message: "Invalid team ID" });
  }
});

/* ================= CREATE TEAM ================= */
router.post("/create", verifyToken, async (req, res) => {
  try {
    const { name } = req.body;

    if (!name) return res.status(400).json({ message: "Team name is required" });

    const team = new Team({
      name,
      owner: req.user.id,
      members: [req.user.id],
    });

    await team.save();
    res.status(201).json({ message: "Team created successfully", team });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/* ================= ADD MEMBER (UPDATED) ================= */
router.post("/add-member", verifyToken, async (req, res) => {
  try {
    const { teamId, userId } = req.body;

    if (!teamId || !userId) {
      return res.status(400).json({ message: "Team ID and User ID are required" });
    }

    const team = await Team.findById(teamId);
    if (!team) return res.status(404).json({ message: "Team not found" });

    // Only owner can add members
    if (team.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: "Only owner can add members" });
    }

    // 🔍 Find user by ID
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Already member?
    if (team.members.includes(user._id)) {
      return res.status(400).json({ message: "User already in team" });
    }

    team.members.push(user._id);
    await team.save();

    res.json({ message: "Member added successfully", team });

  } catch (error) {
    console.error("ADD MEMBER ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
});

/* ================= DELETE TEAM ================= */
router.delete("/:id", verifyToken, async (req, res) => {
  try {
    const team = await Team.findById(req.params.id);
    if (!team) return res.status(404).json({ message: "Team not found" });

    if (team.owner.toString() !== req.user.id)
      return res.status(403).json({ message: "Only owner can delete team" });

    await team.deleteOne();
    res.json({ message: "Team deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
