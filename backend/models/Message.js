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

// Giữ truy vấn lịch sử của một cuộc trò chuyện nhanh khi dữ liệu tăng lớn.
MessageSchema.index({ matchId: 1, createdAt: -1 });

module.exports = mongoose.model("Message", MessageSchema);
