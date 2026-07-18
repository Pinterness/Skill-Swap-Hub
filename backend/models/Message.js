const mongoose = require("mongoose");

const MessageSchema = new mongoose.Schema(
  {
    matchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Match",
      required: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ["text", "image", "call_invite"],
      default: "text",
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Message", MessageSchema);
