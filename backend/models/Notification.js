const mongoose = require("mongoose");

const NotificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: {
      type: String,
      enum: [
        "match_request",
        "match_accepted",
        "match_rejected",
        "new_message",
        "session_reminder",
        "review_received",
        "group_invite",
      ],
      required: true,
    },
    content: { type: String, required: true },
    refId: { type: mongoose.Schema.Types.ObjectId },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Notification", NotificationSchema);
