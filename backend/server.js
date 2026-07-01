require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/user");
const postRoutes = require("./routes/post");
const matchRoutes = require("./routes/match");
const messageRoutes = require("./routes/message");
const notificationRoutes = require("./routes/notification");
const reviewRoutes = require("./routes/review");
const sessionRoutes = require("./routes/session");
const adminRoutes = require("./routes/admin");
const profileRoutes = require("./routes/profile");
const cron = require("node-cron");
const app = express();

cron.schedule("0 0 * * *", async () => {
  try {
    console.log("🤖 Chạy ngầm: Đang quét dọn lời mời quá hạn...");

    // Tính mốc thời gian cách đây 7 ngày
    const clearDate = new Date();
    clearDate.setDate(clearDate.getDate() - 7);

    // Tìm tất cả lời mời 'pending' tạo trước mốc 7 ngày và chuyển thành 'cancelled' (hoặc xóa hẳn bằng deleteMany)
    const result = await Match.updateMany(
      {
        status: "pending",
        createdAt: { $lt: clearDate },
      },
      { status: "cancelled" }, // Hoặc dùng Match.deleteMany nếu muốn xóa sạch khỏi DB
    );

    console.log(
      `✅ Đã tự động dọn dẹp xong ${result.modifiedCount} lời mời quá hạn.`,
    );
  } catch (error) {
    console.error("❌ Lỗi khi chạy ngầm dọn dẹp:", error);
  }
});

app.use(cors());
app.use(express.json());

//routes
app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/post", postRoutes);
app.use("/api/match", matchRoutes);
app.use("/api/message", messageRoutes);
app.use("/api/notification", notificationRoutes);
app.use("/api/review", reviewRoutes);
app.use("/api/session", sessionRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/profile", profileRoutes);

// Hàm kết nối Database
const connectDB = async () => {
  try {
    console.log("Đang thử kết nối đến MongoDB Atlas...");
    mongoose.set("strictQuery", false);
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ TUYỆT VỜI! Đã kết nối MongoDB thành công!");
  } catch (error) {
    console.error("❌ THẤT BẠI: Không thể kết nối Database!");
    console.error(error.message);
    process.exit(1);
  }
};

// Khởi động server
const startServer = async () => {
  await connectDB();
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`🚀 Server đang chạy tại port ${PORT}`);
  });
};

startServer();
