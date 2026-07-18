const express = require("express");
const router = express.Router();
const Match = require("../models/Match");
const Session = require("../models/Session");
const Notification = require("../models/Notification");
const User = require("../models/User");
const auth = require("../middlewares/authMiddleware");

// 1. GỬI LỜI MỜI KẾT NỐI (Đã có postId)
router.post("/send", auth, async (req, res) => {
  try {
    const { receiverId, message, postId } = req.body;
    const senderId = req.user.id;

    if (senderId === receiverId) {
      return res.status(400).json({
        success: false,
        message: "Không thể gửi lời mời cho chính mình",
      });
    }

    // Kiểm tra trùng lặp THEO CẶP NGƯỜI DÙNG, không phân biệt ai gửi ai nhận,
    // và không phân biệt theo postId - để đảm bảo 2 người chỉ có DUY NHẤT 1
    // "kết nối" (match) với nhau, tránh tách rời lịch sử chat thành nhiều luồng.
    const existing = await Match.findOne({
      $or: [
        { sender: senderId, receiver: receiverId },
        { sender: receiverId, receiver: senderId },
      ],
      status: { $in: ["pending", "accepted"] },
    });

    if (existing) {
      if (existing.status === "accepted") {
        return res.status(400).json({
          success: false,
          message: "Bạn đã kết nối với người này rồi",
        });
      }
      return res.status(400).json({
        success: false,
        message: "Đã có lời mời kết nối đang chờ xử lý giữa 2 người",
      });
    }

    const match = await Match.create({
      sender: senderId,
      receiver: receiverId,
      postId: postId || null,
      message,
    });

    await Notification.create({
      userId: receiverId,
      type: "match_request",
      content: "Bạn có một lời mời kết nối mới",
      refId: match._id,
    });

    res.status(201).json({ success: true, message: "Đã gửi lời mời", match });
  } catch (error) {
    res.status(500).json({ success: false, message: "Lỗi hệ thống" });
  }
});

// 2. LẤY DANH SÁCH ĐÃ GỬI
router.get("/sent", auth, async (req, res) => {
  try {
    const matches = await Match.find({ sender: req.user.id })
      .populate("receiver", "username avatar skillsOffered skillsWanted")
      .populate("sender", "username avatar")
      .sort({ createdAt: -1 });
    res.json({ success: true, matches });
  } catch (error) {
    res.status(500).json({ success: false, message: "Lỗi hệ thống" });
  }
});

// 3. LẤY DANH SÁCH ĐÃ NHẬN
router.get("/received", auth, async (req, res) => {
  try {
    const matches = await Match.find({ receiver: req.user.id })
      .populate("sender", "username avatar skillsOffered skillsWanted")
      .populate("receiver", "username avatar")
      .sort({ createdAt: -1 });
    res.json({ success: true, matches });
  } catch (error) {
    res.status(500).json({ success: false, message: "Lỗi hệ thống" });
  }
});

// 4. CHẤP NHẬN LỜI MỜI
router.put("/accept/:matchId", auth, async (req, res) => {
  try {
    const match = await Match.findById(req.params.matchId);
    if (!match)
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy lời mời" });

    if (match.receiver.toString() !== req.user.id) {
      return res
        .status(403)
        .json({ success: false, message: "Không có quyền" });
    }

    match.status = "accepted";
    await match.save();

    if (match.postId) {
      const Post = require("../models/Post");
      const targetPost = await Post.findById(match.postId);

      if (targetPost && targetPost.type === "learning") {
        targetPost.status = "closed";
        await targetPost.save();
      }
    }

    const session = await Session.create({
      matchId: match._id,
      teacherId: match.sender,
      studentId: match.receiver,
    });

    await User.findByIdAndUpdate(match.sender, {
      $addToSet: { friends: match.receiver },
    });
    await User.findByIdAndUpdate(match.receiver, {
      $addToSet: { friends: match.sender },
    });

    await Notification.create({
      userId: match.sender,
      type: "match_accepted",
      content: "Lời mời kết nối của bạn đã được chấp nhận",
      refId: match._id,
    });

    res.json({ success: true, message: "Đã chấp nhận", match, session });
  } catch (error) {
    res.status(500).json({ success: false, message: "Lỗi hệ thống" });
  }
});

// 5. TỪ CHỐI LỜI MỜI
router.put("/reject/:matchId", auth, async (req, res) => {
  try {
    const match = await Match.findById(req.params.matchId);
    if (!match)
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy lời mời" });
    if (match.receiver.toString() !== req.user.id) {
      return res
        .status(403)
        .json({ success: false, message: "Không có quyền" });
    }

    match.status = "rejected";
    await match.save();

    res.json({ success: true, message: "Đã từ chối lời mời" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Lỗi hệ thống" });
  }
});

// Rút lời mời
router.delete("/cancel/:matchId", auth, async (req, res) => {
  try {
    const match = await Match.findById(req.params.matchId);
    if (!match)
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy lời mời" });
    if (match.sender.toString() !== req.user.id) {
      return res
        .status(403)
        .json({ success: false, message: "Không có quyền" });
    }
    if (match.status !== "pending") {
      return res
        .status(400)
        .json({ success: false, message: "Chỉ rút được lời mời đang chờ" });
    }

    match.status = "cancelled";
    await match.save();

    res.json({ success: true, message: "Đã rút lời mời" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Lỗi hệ thống" });
  }
});

module.exports = router;
