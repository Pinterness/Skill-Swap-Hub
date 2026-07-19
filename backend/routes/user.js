const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const multer = require("multer"); // Thêm thư viện multer
const path = require("path");
const fs = require("fs");
const User = require("../models/User");
const authMiddleware = require("../middlewares/authMiddleware");

// ─── CẤU HÌNH MULTER (XỬ LÝ UPLOAD ẢNH) ───
// Tạo thư mục "uploads" nếu chưa tồn tại
const uploadDir = "uploads/";
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir); // Nơi lưu file
  },
  filename: function (req, file, cb) {
    // Đổi tên file: ID User - Thời gian hiện tại - Đuôi file (.jpg, .png)
    cb(null, req.user.id + "-" + Date.now() + path.extname(file.originalname));
  },
});

const fileFilter = (req, file, cb) => {
  // Chỉ cho phép định dạng ảnh
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Chỉ hỗ trợ tải lên định dạng ảnh!"), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // Giới hạn file 5MB
});
// ───────────────────────────────────────────

// 1. UPLOAD ẢNH (Avatar & Cover Image)
router.put(
  "/upload-images",
  authMiddleware,
  upload.fields([
    { name: "avatar", maxCount: 1 },
    { name: "coverImage", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const updateData = {};
      // Tạo đường dẫn cơ sở (VD: http://localhost:5000/uploads/)
      const baseUrl = `${req.protocol}://${req.get("host")}/uploads/`;

      if (req.files && req.files["avatar"]) {
        updateData.avatar = baseUrl + req.files["avatar"][0].filename;
      }

      if (req.files && req.files["coverImage"]) {
        updateData.coverImage = baseUrl + req.files["coverImage"][0].filename;
      }

      if (Object.keys(updateData).length === 0) {
        return res
          .status(400)
          .json({ success: false, message: "Không tìm thấy ảnh tải lên" });
      }

      const updatedUser = await User.findByIdAndUpdate(
        req.user.id,
        { $set: updateData },
        { new: true },
      ).select("-password");

      res.json({
        success: true,
        message: "Cập nhật ảnh thành công",
        user: updatedUser,
      });
    } catch (error) {
      console.error("Lỗi upload ảnh:", error);
      res
        .status(500)
        .json({ success: false, message: "Lỗi hệ thống khi tải ảnh lên" });
    }
  },
);

// 2. Cập nhật thông tin cá nhân & Kỹ năng (Cần đăng nhập)
router.put("/profile", authMiddleware, async (req, res) => {
  try {
    const { username, skillsOffered, skillsWanted, avatar } = req.body;

    const updateData = {};
    if (username !== undefined) updateData.username = username;
    if (skillsOffered !== undefined) updateData.skillsOffered = skillsOffered;
    if (skillsWanted !== undefined) updateData.skillsWanted = skillsWanted;
    if (avatar !== undefined) updateData.avatar = avatar; // Vẫn giữ để hỗ trợ update qua link nếu cần

    const updatedUser = await User.findByIdAndUpdate(req.user.id, updateData, {
      new: true,
    }).select("-password");

    res.json({
      success: true,
      message: "Cập nhật hồ sơ thành công",
      user: updatedUser,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Lỗi hệ thống" });
  }
});

// 3. Thêm certificate
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

// 4. Xóa certificate
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

// 5. Lấy danh sách certificate của user bất kỳ (public)
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

// 6. Xóa tài khoản - yêu cầu xác nhận đúng mật khẩu để tránh xóa nhầm
router.delete("/account", authMiddleware, async (req, res) => {
  try {
    const { password } = req.body;
    if (!password) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng nhập mật khẩu để xác nhận xóa tài khoản",
      });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy người dùng" });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res
        .status(400)
        .json({ success: false, message: "Mật khẩu không đúng" });
    }

    await User.findByIdAndDelete(req.user.id);

    res.json({ success: true, message: "Đã xóa tài khoản thành công" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Lỗi hệ thống" });
  }
});

module.exports = router;
