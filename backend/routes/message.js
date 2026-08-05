const express = require("express");
const router = express.Router();
const Message = require("../models/Message");
const Match = require("../models/Match");
const auth = require("../middlewares/authMiddleware");

// Lấy lịch sử chat (chỉ bạn bè mới chat được)
router.get("/:matchId", auth, async (req, res) => {
  try {
    const match = await Match.findById(req.params.matchId);
    if (!match || match.status !== "accepted") {
      return res
        .status(403)
        .json({ success: false, message: "Không có quyền chat" });
    }

    const isParticipant = [
      match.sender.toString(),
      match.receiver.toString(),
    ].includes(req.user.id);
    if (!isParticipant) {
      return res
        .status(403)
        .json({ success: false, message: "Không có quyền xem tin nhắn này" });
    }

    const limit = Math.min(Math.max(Number(req.query.limit) || 50, 1), 100);
    const filter = { matchId: req.params.matchId };
    if (req.query.before && !Number.isNaN(new Date(req.query.before).getTime())) {
      filter.createdAt = { $lt: new Date(req.query.before) };
    }
    const newestFirst = await Message.find(filter)
      .populate("sender", "username avatar")
      .sort({ createdAt: -1 })
      .limit(limit + 1);
    const hasMore = newestFirst.length > limit;
    const messages = newestFirst.slice(0, limit).reverse();

    res.json({
      success: true,
      messages,
      hasMore,
      nextBefore: hasMore && messages.length ? messages[0].createdAt : null,
    });
  } catch (error) {
    console.log("Lỗi chi tiết tại server:", error);
    res.status(500).json({ success: false, message: "Lỗi hệ thống" });
  }
});

// Gửi tin nhắn
router.post("/:matchId", auth, async (req, res) => {
  try {
    const match = await Match.findById(req.params.matchId);
    if (!match || match.status !== "accepted") {
      return res
        .status(403)
        .json({ success: false, message: "Không có quyền chat" });
    }

    const isParticipant = [
      match.sender.toString(),
      match.receiver.toString(),
    ].includes(req.user.id);
    if (!isParticipant) {
      return res
        .status(403)
        .json({ success: false, message: "Không có quyền" });
    }

    const message = await Message.create({
      matchId: req.params.matchId,
      sender: req.user.id,
      content: req.body.content,
      type: req.body.type || "text",
    });

    const populated = await message.populate("sender", "username avatar");

    // Bắn tới PHÒNG CÁ NHÂN (theo userId) của cả 2 người trong cuộc trò chuyện,
    // thay vì phòng theo matchId - đảm bảo người nhận LUÔN thấy tin nhắn real-time
    // dù họ đang không mở đúng cuộc trò chuyện này (cần thiết cho toast + badge)
    const io = req.app.get("io");
    if (io) {
      io.to(match.sender.toString()).emit("new_message", populated);
      io.to(match.receiver.toString()).emit("new_message", populated);
    }

    res.status(201).json({ success: true, message: populated });
  } catch (error) {
    res.status(500).json({ success: false, message: "Lỗi hệ thống" });
  }
});

module.exports = router;
