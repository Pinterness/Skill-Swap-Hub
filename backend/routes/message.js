const express = require("express");
const router = express.Router();
const Message = require("../models/Message");
const Match = require("../models/Match");
const auth = require("../middlewares/authMiddleware");

// Lấy lịch sử chat (chỉ bạn bè mới chat được)
router.get("/:matchId", auth, async (req, res) => {
  try {
    console.log("Dữ liệu nhận được từ FE:", req.body);
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

    const messages = await Message.find({ matchId: req.params.matchId })
      .populate("sender", "username avatar")
      .sort({ createdAt: 1 });

    res.json({ success: true, messages });
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
    res.status(201).json({ success: true, message: populated });
  } catch (error) {
    res.status(500).json({ success: false, message: "Lỗi hệ thống" });
  }
});

module.exports = router;
