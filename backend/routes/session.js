const express = require("express");
const router = express.Router();
const Session = require("../models/Session");
const User = require("../models/User");
const Notification = require("../models/Notification");
const auth = require("../middlewares/authMiddleware");

// Lấy danh sách session của user
router.get("/", auth, async (req, res) => {
  try {
    const sessions = await Session.find({
      $or: [{ teacherId: req.user.id }, { studentId: req.user.id }],
    })
      .populate("teacherId", "username avatar")
      .populate("studentId", "username avatar")
      .populate("matchId")
      .sort({ createdAt: -1 });

    res.json({ success: true, sessions });
  } catch (error) {
    res.status(500).json({ success: false, message: "Lỗi hệ thống" });
  }
});

// Lấy chi tiết 1 session
router.get("/:sessionId", auth, async (req, res) => {
  try {
    const session = await Session.findById(req.params.sessionId)
      .populate("teacherId", "username avatar skillsOffered")
      .populate("studentId", "username avatar skillsWanted")
      .populate("matchId");

    if (!session)
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy buổi học" });

    const isParticipant = [
      session.teacherId._id.toString(),
      session.studentId._id.toString(),
    ].includes(req.user.id);
    if (!isParticipant)
      return res
        .status(403)
        .json({ success: false, message: "Không có quyền" });

    res.json({ success: true, session });
  } catch (error) {
    res.status(500).json({ success: false, message: "Lỗi hệ thống" });
  }
});

// Đặt lịch buổi học
router.put("/schedule/:sessionId", auth, async (req, res) => {
  try {
    const { scheduledAt } = req.body;
    const session = await Session.findById(req.params.sessionId);
    if (!session)
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy buổi học" });

    const isParticipant = [
      session.teacherId.toString(),
      session.studentId.toString(),
    ].includes(req.user.id);
    if (!isParticipant)
      return res
        .status(403)
        .json({ success: false, message: "Không có quyền" });
    if (new Date(scheduledAt) <= new Date()) {
      return res.status(400).json({
        success: false,
        message: "Thời gian học phải là trong tương lai",
      });
    }

    session.scheduledAt = new Date(scheduledAt);
    await session.save();

    // Thông báo cho người còn lại
    const otherId =
      session.teacherId.toString() === req.user.id
        ? session.studentId
        : session.teacherId;
    await Notification.create({
      userId: otherId,
      type: "session_reminder",
      content: `Buổi học đã được lên lịch vào ${new Date(scheduledAt).toLocaleString("vi-VN")}`,
      refId: session._id,
    });

    res.json({ success: true, message: "Đã đặt lịch", session });
  } catch (error) {
    res.status(500).json({ success: false, message: "Lỗi hệ thống" });
  }
});

// Bắt đầu buổi học
router.put("/start/:sessionId", auth, async (req, res) => {
  try {
    const session = await Session.findById(req.params.sessionId);
    if (!session)
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy buổi học" });
    if (session.status !== "pending")
      return res
        .status(400)
        .json({ success: false, message: "Buổi học không ở trạng thái chờ" });

    session.status = "ongoing";
    session.startedAt = new Date();
    await session.save();

    res.json({ success: true, message: "Buổi học đã bắt đầu", session });
  } catch (error) {
    res.status(500).json({ success: false, message: "Lỗi hệ thống" });
  }
});

// Hoàn thành buổi học
router.put("/complete/:sessionId", auth, async (req, res) => {
  try {
    const session = await Session.findById(req.params.sessionId);
    if (!session)
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy buổi học" });
    if (session.status !== "ongoing")
      return res
        .status(400)
        .json({ success: false, message: "Buổi học chưa bắt đầu" });

    session.status = "completed";
    session.endedAt = new Date();
    await session.save();

    // Cập nhật stats
    await User.findByIdAndUpdate(session.teacherId, {
      $inc: { "stats.totalTaught": 1 },
    });
    await User.findByIdAndUpdate(session.studentId, {
      $inc: { "stats.totalLearned": 1 },
    });
    const Post = require("../models/Post");
    const match = await require("../models/Match").findById(session.matchId);
    if (match) {
      await Post.updateMany(
        {
          author: { $in: [session.teacherId, session.studentId] },
          status: "active",
        },
        { status: "closed" },
      );
    }

    res.json({ success: true, message: "Buổi học đã hoàn thành", session });
  } catch (error) {
    res.status(500).json({ success: false, message: "Lỗi hệ thống" });
  }
});

// Hủy buổi học
router.put("/cancel/:sessionId", auth, async (req, res) => {
  try {
    const session = await Session.findById(req.params.sessionId);
    if (!session)
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy buổi học" });
    if (session.status === "completed")
      return res.status(400).json({
        success: false,
        message: "Không thể hủy buổi học đã hoàn thành",
      });

    session.status = "cancelled";
    await session.save();

    // Thông báo cho người còn lại
    const otherId =
      session.teacherId.toString() === req.user.id
        ? session.studentId
        : session.teacherId;
    await Notification.create({
      userId: otherId,
      type: "session_reminder",
      content: "Buổi học đã bị hủy",
      refId: session._id,
    });

    res.json({ success: true, message: "Đã hủy buổi học", session });
  } catch (error) {
    res.status(500).json({ success: false, message: "Lỗi hệ thống" });
  }
});

module.exports = router;
