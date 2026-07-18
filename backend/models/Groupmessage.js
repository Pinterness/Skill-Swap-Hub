const mongoose = require("mongoose");

const GroupMessageSchema = new mongoose.Schema(
  {
    groupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Group",
      required: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    content: { type: String, required: true },
    type: { type: String, enum: ["text", "system"], default: "text" },
  },
  { timestamps: true },
);

module.exports = mongoose.model("GroupMessage", GroupMessageSchema);
