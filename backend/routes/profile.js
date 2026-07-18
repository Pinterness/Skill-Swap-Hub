const express = require("express");
const router = express.Router();
const User = require("../models/User");
const Post = require("../models/Post");
const Review = require("../models/Review");

// Xem hồ sơ public của user bất kỳ
router.get("/:userId", async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).select(
      "-password -friends",
    );
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy người dùng" });

    const posts = await Post.find({
      author: req.params.userId,
      status: "active",
      isHidden: { $ne: true },
    }).sort({ createdAt: -1 });

    const reviews = await Review.find({ reviewee: req.params.userId })
      .populate("reviewer", "username avatar")
      .sort({ createdAt: -1 });

    res.json({ success: true, user, posts, reviews });
  } catch (error) {
    res.status(500).json({ success: false, message: "Lỗi hệ thống" });
  }
});

module.exports = router;
