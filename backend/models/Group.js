const mongoose = require("mongoose");

const GroupSchema = new mongoose.Schema(
  {
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: { type: String, default: "Buổi học nhóm" },
    roomName: { type: String, required: true, unique: true },
    members: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        status: {
          type: String,
          enum: ["pending", "accepted", "declined"],
          default: "pending",
        },
      },
    ],
    status: {
      type: String,
      enum: ["pending", "active", "closed"],
      default: "pending",
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Group", GroupSchema);
