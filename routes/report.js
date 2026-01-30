const express = require("express");
const router = express.Router();
const Task = require("../models/Task");
const Team = require("../models/Team");
const User = require("../models/User");
const verifyToken = require("../middleware/authMiddleware");

router.get("/overview", verifyToken, async (req, res) => {
  try {
    const lastWeek = new Date();
    lastWeek.setDate(lastWeek.getDate() - 7);

    // 1️⃣ Tasks completed last week
    const completedLastWeek = await Task.countDocuments({
      status: "Completed",
      updatedAt: { $gte: lastWeek }
    });

    // 2️⃣ Pending tasks
    const pendingTasks = await Task.countDocuments({
      status: { $ne: "Completed" }
    });

    // 3️⃣ Tasks closed by team (with team names)
    const closedByTeamRaw = await Task.aggregate([
      { $match: { status: "Completed" } },
      { $group: { _id: "$team", count: { $sum: 1 } } }
    ]);

    const closedByTeam = await Promise.all(
      closedByTeamRaw.map(async (t) => {
        const team = await Team.findById(t._id);
        return {
          teamName: team?.name || "Unknown",
          count: t.count
        };
      })
    );

    // 4️⃣ Tasks closed by owner (with user names)
    const closedByOwnerRaw = await Task.aggregate([
      { $match: { status: "Completed" } },
      { $unwind: "$owners" },
      { $group: { _id: "$owners", count: { $sum: 1 } } }
    ]);

    const closedByOwner = await Promise.all(
      closedByOwnerRaw.map(async (o) => {
        const user = await User.findById(o._id);
        return {
          ownerName: user?.name || "Unknown",
          count: o.count
        };
      })
    );

    res.json({
      completedLastWeek,
      pendingTasks,
      closedByTeam,
      closedByOwner
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
