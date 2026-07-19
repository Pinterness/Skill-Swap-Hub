require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
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
const groupRoutes = require("./routes/group");
const Match = require("./models/Match");
const cron = require("node-cron");
const path = require("path");

const app = express();
const allowedOrigins = ["http://localhost:5173", process.env.CLIENT_URL].filter(
  Boolean,
);

// Deploy config: allow Vercel frontend origin and local Vite during development.
const corsOptions = {
  origin(origin, callback) {
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
};

const server = http.createServer(app);
const io = new Server(server, {
  // Deploy config: socket.io uses the same origin allowlist as Express CORS.
  cors: {
    origin: allowedOrigins,
    credentials: true,
  },
});

app.set("io", io);

io.on("connection", (socket) => {
  console.log("🔌 Client kết nối socket:", socket.id);

  // Client "định danh" bằng userId ngay sau khi kết nối/đăng nhập.
  // Đây là cơ chế DUY NHẤT để nhận thông báo/tin nhắn real-time -
  // mọi sự kiện cá nhân (tin nhắn, lời mời nhóm, cuộc gọi) đều gửi
  // tới "phòng" mang tên chính userId này, nên luôn nhận được
  // dù đang ở trang nào, không cần "join" theo từng cuộc trò chuyện.
  socket.on("identify", (userId) => {
    if (userId) {
      socket.join(userId);
      socket.data.userId = userId;
      console.log("✅ User đã identify:", userId);
    }
  });

  // ── Signaling gọi video 1-1 ──
  // receiverId: id người được gọi, để server biết bắn tới đúng phòng cá nhân nào
  socket.on("call_invite", ({ matchId, roomName, callerName, receiverId }) => {
    if (!receiverId) return;
    socket.to(receiverId).emit("incoming_call", {
      roomName,
      callerName,
      matchId,
      callerId: socket.data.userId,
    });
  });

  socket.on("call_cancel", ({ matchId, callerId }) => {
    if (!callerId) return;
    socket.to(callerId).emit("call_cancelled", { matchId });
  });

  socket.on("disconnect", () => {
    console.log("❌ Client ngắt kết nối socket:", socket.id);
  });
});

cron.schedule("0 0 * * *", async () => {
  try {
    console.log("🤖 Chạy ngầm: Đang quét dọn lời mời quá hạn...");

    const clearDate = new Date();
    clearDate.setDate(clearDate.getDate() - 7);

    const result = await Match.updateMany(
      {
        status: "pending",
        createdAt: { $lt: clearDate },
      },
      { status: "cancelled" },
    );

    console.log(
      `✅ Đã tự động dọn dẹp xong ${result.modifiedCount} lời mời quá hạn.`,
    );
  } catch (error) {
    console.error("❌ Lỗi khi chạy ngầm dọn dẹp:", error);
  }
});

app.use(cors(corsOptions));
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
app.use("/api/group", groupRoutes);
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

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

const startServer = async () => {
  await connectDB();
  const PORT = process.env.PORT || 5000;
  server.listen(PORT, () => {
    console.log(`🚀 Server đang chạy tại port ${PORT}`);
  });
};

startServer();
