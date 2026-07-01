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

// routes/post.js
router.get("/", async (req, res) => {
  try {
    // Tạo một object filter và luôn bắt buộc bài viết phải có status là "active"
    const filter = { status: "active" };

    // Nếu có các tham số tìm kiếm từ Frontend gửi lên thì ghép thêm vào
    if (req.query.type) filter.type = req.query.type;
    if (req.query.field) filter["skill.field"] = req.query.field;
    if (req.query.level) filter["skill.level"] = req.query.level;
    if (req.query.skill) {
      filter["skill.name"] = { $regex: req.query.skill, $options: "i" };
    }

    const posts = await Post.find(filter)
      .populate("author", "username avatar")
      .sort({ createdAt: -1 });

    res.json({ success: true, posts });
  } catch (error) {
    res.status(500).json({ success: false, message: "Lỗi lấy bài viết" });
  }
});

// 3. Tạo bài đăng mới (Dành cho CreatePostPage)
router.post("/", authMiddleware, async (req, res) => {
  try {
    const { type, title, description, skill } = req.body;

    // Validation: Chặn nếu thiếu dữ liệu quan trọng
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

    // Kiểm tra quyền: Chỉ chủ bài viết mới được đóng/mở
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

    // Kiểm tra quyền: Chỉ chủ bài viết mới được xóa
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
