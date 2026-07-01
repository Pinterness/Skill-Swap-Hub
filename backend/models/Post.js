const mongoose = require("mongoose");

const PostSchema = new mongoose.Schema(
  {
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: {
      type: String,
      enum: ["teaching", "learning"],
      required: true,
    },
    title: { type: String, required: true },
    description: { type: String, required: true },
    skill: {
      name: { type: String, required: true },
      field: {
        type: String,
        enum: [
          "Công nghệ",
          "Ngôn ngữ",
          "Thiết kế",
          "Marketing",
          "Kinh doanh",
          "Âm nhạc",
          "Thể thao",
          "Khác",
        ],
        required: true,
      },
      level: {
        type: String,
        enum: ["Cơ bản", "Trung cấp", "Nâng cao"],
        required: true,
      },
    },
    status: { type: String, enum: ["active", "closed"], default: "active" },
    isHidden: { type: Boolean, default: false },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Post", PostSchema);
