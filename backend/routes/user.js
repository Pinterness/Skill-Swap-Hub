const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const multer = require("multer"); // Thêm thư viện multer
const path = require("path");
const fs = require("fs");
const { v2: cloudinary } = require("cloudinary");
const User = require("../models/User");
const Session = require("../models/Session");
const Review = require("../models/Review");
const Match = require("../models/Match");
const authMiddleware = require("../middlewares/authMiddleware");
const { getUploadBaseUrl } = require("../utils/uploadUrl");

const cloudinaryConfigured = Boolean(
  process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET,
);

if (cloudinaryConfigured) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
}

async function getPersistentUploadUrl(file, baseUrl) {
  if (!cloudinaryConfigured) return baseUrl + file.filename;

  try {
    const result = await cloudinary.uploader.upload(file.path, {
      folder: "skillswap-hub/profiles",
      resource_type: "image",
    });
    return result.secure_url;
  } finally {
    // File trên Render chỉ là bản tạm trong lúc đẩy lên Cloudinary.
    fs.unlink(file.path, () => {});
  }
}

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
  const allowedMimeTypes = [
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
  ];
  // Chỉ cho phép định dạng ảnh
  if (allowedMimeTypes.includes(file.mimetype)) {
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

router.get("/featured", async (req, res) => {
  try {
    const users = await User.find({ status: "active" })
      .select("username avatar skillsOffered stats")
      .sort({ "stats.averageRating": -1, "stats.totalTaught": -1 })
      .limit(6);

    res.json({ success: true, users });
  } catch (error) {
    res.status(500).json({ success: false, message: "Lỗi hệ thống" });
  }
});

// Thống kê cộng đồng hiển thị ở trang Khám phá (không phải số liệu cá nhân).
router.get("/platform-stats", authMiddleware, async (req, res) => {
  try {
    const [completedSessions, acceptedMatches, ratingSummary] = await Promise.all([
      Session.countDocuments({ status: "completed" }),
      Match.countDocuments({ status: "accepted" }),
      Review.aggregate([
        { $group: { _id: null, averageRating: { $avg: "$rating" }, totalReviews: { $sum: 1 } } },
      ]),
    ]);

    const rating = ratingSummary[0];
    res.json({
      success: true,
      stats: {
        completedSessions,
        acceptedMatches,
        averageRating: rating ? Number(rating.averageRating.toFixed(1)) : null,
        totalReviews: rating?.totalReviews || 0,
      },
    });
  } catch (error) {
    console.error("Lỗi lấy thống kê nền tảng:", error);
    res.status(500).json({ success: false, message: "Không thể lấy thống kê nền tảng" });
  }
});

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
      // Khi đã cấu hình Cloudinary, ảnh được lưu vĩnh viễn ngoài Render.
      // Nếu thiếu biến môi trường Cloudinary, giữ tương thích với lưu trữ cục bộ cũ.
      const baseUrl = getUploadBaseUrl(req);

      if (req.files && req.files["avatar"]) {
        updateData.avatar = await getPersistentUploadUrl(
          req.files["avatar"][0],
          baseUrl,
        );
      }

      if (req.files && req.files["coverImage"]) {
        updateData.coverImage = await getPersistentUploadUrl(
          req.files["coverImage"][0],
          baseUrl,
        );
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
    const { username, skillsOffered, skillsWanted, avatar, profileBanner } = req.body;

    const updateData = {};
    if (username !== undefined) updateData.username = username;
    if (skillsOffered !== undefined) updateData.skillsOffered = skillsOffered;
    if (skillsWanted !== undefined) updateData.skillsWanted = skillsWanted;
    if (avatar !== undefined) updateData.avatar = avatar; // Vẫn giữ để hỗ trợ update qua link nếu cần
    if (profileBanner !== undefined) updateData.profileBanner = profileBanner;

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
