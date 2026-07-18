const express = require("express");
const router = express.Router();
const User = require("../models/User");
const authMiddleware = require("../middlewares/authMiddleware");

// Cập nhật thông tin cá nhân & Kỹ năng (Cần đăng nhập)
router.put("/profile", authMiddleware, async (req, res) => {
  try {
    const { username, skillsOffered, skillsWanted, avatar } = req.body;

    // Chỉ cập nhật field nào thực sự được gửi lên, tránh ghi đè thành undefined
    const updateData = {};
    if (username !== undefined) updateData.username = username;
    if (skillsOffered !== undefined) updateData.skillsOffered = skillsOffered;
    if (skillsWanted !== undefined) updateData.skillsWanted = skillsWanted;
    if (avatar !== undefined) updateData.avatar = avatar;

    // Tìm và cập nhật user theo ID được lấy ra từ Token
    const updatedUser = await User.findByIdAndUpdate(req.user.id, updateData, {
      new: true,
    }).select("-password"); // Không trả về password

    res.json({
      success: true,
      message: "Cập nhật hồ sơ thành công",
      user: updatedUser,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Lỗi hệ thống" });
  }
});
// Thêm certificate
router.post("/certificate", authMiddleware, async (req, res) => {
  try {
    const { name, issuer, issueDate, expiryDate, credentialUrl } = req.body;
    if (!name)
      return res
        .status(400)
        .json({ success: false, message: "Tên bằng cấp là bắt buộc" });

    const user = await User.findByIdAndUpdate(
      req.user.id,
      {
        $push: {
          certificates: { name, issuer, issueDate, expiryDate, credentialUrl },
        },
      },
      { new: true },
    ).select("-password");

    res.json({
      success: true,
      message: "Đã thêm bằng cấp",
      certificates: user.certificates,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Lỗi hệ thống" });
  }
});

// Xóa certificate
router.delete("/certificate/:certId", authMiddleware, async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $pull: { certificates: { _id: req.params.certId } } },
      { new: true },
    ).select("-password");

    res.json({
      success: true,
      message: "Đã xóa bằng cấp",
      certificates: user.certificates,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Lỗi hệ thống" });
  }
});

// Lấy danh sách certificate của user bất kỳ (public)
router.get("/:userId/certificates", async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).select(
      "certificates username",
    );
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy user" });
    res.json({ success: true, certificates: user.certificates });
  } catch (error) {
    res.status(500).json({ success: false, message: "Lỗi hệ thống" });
  }
});

module.exports = router;
