// models/User.js
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },

  // NEW FIELD
  isAdmin: { type: Boolean, default: false }, // overall admin (optional)
  // team owner is dynamic, checked in team collection
});

module.exports = mongoose.model("User", userSchema);
