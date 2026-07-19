const express = require("express");
const router = express.Router();
const Post = require("../models/Post");
const authMiddleware = require("../middlewares/authMiddleware");

// 1. Lấy danh sách bài đăng có lọc (Dành cho Dashboard Khám phá)
router.get("/", async (req, res) => {
  try {
    const { skill, field, level, type, page = 1, limit = 10 } = req.query;

    // Lọc bài đăng active và không bị admin ẩn
    let query = { status: "active", isHidden: { $ne: true } };

    if (type) query.type = type;
    if (field) query["skill.field"] = field;
    if (level) query["skill.level"] = level;
    if (skill) query["skill.name"] = { $regex: skill, $options: "i" };

    const posts = await Post.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .populate("author", "username avatar stats");

    const total = await Post.countDocuments(query);

    res.json({
      success: true,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      posts,
    });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Lỗi lấy danh sách bài đăng" });
  }
});

// Lấy toàn bộ bài đăng của chính mình (để quản lý cả bài đã đóng)
router.get("/my-posts", authMiddleware, async (req, res) => {
  try {
    const posts = await Post.find({ author: req.user.id }).sort({
      createdAt: -1,
    });
    res.json({ success: true, posts });
  } catch (error) {
    res.status(500).json({ success: false, message: "Lỗi lấy bài của bạn" });
  }
});

// 2. LẤY CHI TIẾT MỘT BÀI ĐĂNG (API BẠN ĐANG THIẾU)
router.get("/:postId", async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId).populate(
      "author",
      "username avatar stats",
    );

    if (!post) {
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy bài đăng" });
    }

    res.json({ success: true, post });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Lỗi lấy chi tiết bài viết" });
  }
});

// 3. Tạo bài đăng mới
router.post("/", authMiddleware, async (req, res) => {
  try {
    const { type, title, description, skill } = req.body;

    if (
      !type ||
      !title ||
      !description ||
      !skill?.name ||
      !skill?.field ||
      !skill?.level
    ) {
      return res
        .status(400)
        .json({ success: false, message: "Vui lòng điền đầy đủ thông tin" });
    }

    const newPost = new Post({
      author: req.user.id,
      type,
      title,
      description,
      skill,
    });

    await newPost.save();
    res.status(201).json({ success: true, post: newPost });
  } catch (error) {
    res.status(500).json({ success: false, message: "Lỗi khi tạo bài đăng" });
  }
});

// 4. Đóng/mở bài đăng của chính mình
router.put("/:postId/close", authMiddleware, async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    if (!post) {
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy bài đăng" });
    }

    if (post.author.toString() !== req.user.id) {
      return res
        .status(403)
        .json({ success: false, message: "Không có quyền" });
    }

    post.status = post.status === "active" ? "closed" : "active";
    await post.save();

    res.json({
      success: true,
      message: `Bài đăng đã được ${post.status === "closed" ? "đóng" : "mở lại"}`,
      post,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Lỗi hệ thống" });
  }
});

// 5. Xóa bài đăng của chính mình
router.delete("/:postId", authMiddleware, async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    if (!post) {
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy bài đăng" });
    }

    if (post.author.toString() !== req.user.id) {
      return res
        .status(403)
        .json({ success: false, message: "Không có quyền" });
    }

    await post.deleteOne();
    res.json({ success: true, message: "Đã xóa bài đăng" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Lỗi hệ thống" });
  }
});

module.exports = router;
