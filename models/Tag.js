const mongoose = require("mongoose");

const tagSchema = new mongoose.Schema({
  name: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    unique: true,
    ref: "Tag"
  },

  color: {
    type: String
  }
});

module.exports = mongoose.model("Tag", tagSchema);
