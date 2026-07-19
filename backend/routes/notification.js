const express = require("express");
const router = express.Router();
const Notification = require("../models/Notification");
const auth = require("../middlewares/authMiddleware");

// Lấy danh sách 20 thông báo mới nhất của user
router.get("/", auth, async (req, res) => {
  try {
    const notifications = await Notification.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .limit(20);
    res.json({ success: true, notifications });
  } catch (error) {
    res.status(500).json({ success: false, message: "Lỗi hệ thống" });
  }
});

// Đánh dấu 1 thông báo là đã đọc
router.put("/read/:id", auth, async (req, res) => {
  try {
    await Notification.findByIdAndUpdate(req.params.id, { isRead: true });
    res.json({ success: true, message: "Đã đánh dấu đọc" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Lỗi hệ thống" });
  }
});

// Đánh dấu tất cả thông báo là đã đọc
router.put("/read-all", auth, async (req, res) => {
  try {
    await Notification.updateMany(
      { userId: req.user.id, isRead: false },
      { isRead: true },
    );
    res.json({ success: true, message: "Đã đọc tất cả" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Lỗi hệ thống" });
  }
});

module.exports = router;
