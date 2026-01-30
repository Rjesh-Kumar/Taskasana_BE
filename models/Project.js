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
    ref: "Team",
    required: true
  },

   status: {
    type: String,
    enum: ["To Do", "In-progress", "Completed", "Blocked"],
    default: "To Do"
  },

  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  
}, { timestamps: true });

module.exports = mongoose.model("Project", projectSchema);
