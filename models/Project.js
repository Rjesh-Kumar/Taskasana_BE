const mongoose = require("mongoose");

const projectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },

  description: {
    type: String
  },

  team: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Team"
  },

   status: {
    type: String,
    enum: ["To Do", "In-progress", "Completed", "Blocked"],
    default: "To Do"
  },
  
  owner: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  
}, { timestamps: true });

module.exports = mongoose.model("Project", projectSchema);
