const express = require("express");
const router = express.Router();
const Tag = require("../models/Tag");
const verifyToken = require("../middleware/authMiddleware");

// CREATE TAG
router.post("/create", verifyToken, async (req, res) => {
  try {
    const { name, color } = req.body;

    if (!name) {
      return res.status(400).json({ message: "Tag name is required" });
    }

    const existingTag = await Tag.findOne({ name });
    if (existingTag) {
      return res.status(400).json({ message: "Tag already exists" });
    }

    const tag = new Tag({ name, color });
    await tag.save();

    res.status(201).json({
      message: "Tag created successfully",
      tag
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
