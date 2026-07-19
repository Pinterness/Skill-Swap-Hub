const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Tạo thư mục uploads nếu chưa có
const uploadDir = "uploads/";
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/"); // Ảnh sẽ được lưu vào thư mục này
  },
  filename: function (req, file, cb) {
    // Đổi tên file để không bị trùng (Thêm timestamp)
    cb(null, req.user.id + "-" + Date.now() + path.extname(file.originalname));
  },
});

const fileFilter = (req, file, cb) => {
  // Chỉ chấp nhận file ảnh
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Chỉ hỗ trợ định dạng ảnh!"), false);
  }
};

const upload = multer({ storage: storage, fileFilter: fileFilter });

module.exports = upload;
