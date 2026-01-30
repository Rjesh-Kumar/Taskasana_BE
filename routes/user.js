// routes/user.js
const express = require("express");
const router = express.Router();
const User = require("../models/User");
const Team = require("../models/Team");
const verifyToken = require("../middleware/authMiddleware");

// GET ALL USERS + owner info
router.get("/", verifyToken, async (req, res) => {
  try {
    const users = await User.find().select("name email isAdmin");

    // Check which users are owners of any team
    const teams = await Team.find().select("owner");
    const ownerIds = teams.map(t => t.owner.toString());

    const usersWithOwnerFlag = users.map(u => ({
      ...u.toObject(),
      isOwner: ownerIds.includes(u._id.toString())
    }));

    res.json(usersWithOwnerFlag);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
