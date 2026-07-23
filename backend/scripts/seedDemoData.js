require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const User = require("../models/User");
const Post = require("../models/Post");
const Match = require("../models/Match");
const Message = require("../models/Message");
const Group = require("../models/Group");
const GroupMessage = require("../models/Groupmessage");
const Session = require("../models/Session");

const DEMO_PASSWORD = "Demo123!";

const demoUsers = [
  {
    username: "Linh Design",
    email: "linh.design.demo@skillswap.test",
    avatar: "https://i.pravatar.cc/150?u=skillswap-linh",
    skillsOffered: ["Figma", "UI/UX Design"],
    skillsWanted: ["Tiếng Anh", "React"],
    stats: { totalTaught: 12, totalLearned: 8, averageRating: 4.9, totalReviews: 15 },
  },
  {
    username: "Minh React",
    email: "minh.react.demo@skillswap.test",
    avatar: "https://i.pravatar.cc/150?u=skillswap-minh",
    skillsOffered: ["React", "Node.js"],
    skillsWanted: ["Thiết kế UI", "Tiếng Nhật"],
    stats: { totalTaught: 9, totalLearned: 6, averageRating: 4.8, totalReviews: 10 },
  },
  {
    username: "An English",
    email: "an.english.demo@skillswap.test",
    avatar: "https://i.pravatar.cc/150?u=skillswap-an",
    skillsOffered: ["Tiếng Anh giao tiếp", "IELTS"],
    skillsWanted: ["Python", "Figma"],
    stats: { totalTaught: 18, totalLearned: 4, averageRating: 5, totalReviews: 22 },
  },
  {
    username: "Khoa Guitar",
    email: "khoa.guitar.demo@skillswap.test",
    avatar: "https://i.pravatar.cc/150?u=skillswap-khoa",
    skillsOffered: ["Guitar cơ bản", "Ukulele"],
    skillsWanted: ["Marketing", "Tiếng Anh"],
    stats: { totalTaught: 7, totalLearned: 11, averageRating: 4.7, totalReviews: 9 },
  },
];

async function upsertMessage(matchId, sender, content, minutesAgo) {
  const createdAt = new Date(Date.now() - minutesAgo * 60 * 1000);
  await Message.updateOne(
    { matchId, sender, content },
    { $setOnInsert: { matchId, sender, content, type: "text", createdAt } },
    { upsert: true },
  );
}

async function seed() {
  if (!process.env.MONGODB_URI) {
    throw new Error("Thiếu MONGODB_URI trong backend/.env");
  }

  await mongoose.connect(process.env.MONGODB_URI);
  const password = await bcrypt.hash(DEMO_PASSWORD, 10);
  const users = {};

  for (const item of demoUsers) {
    const user = await User.findOneAndUpdate(
      { email: item.email },
      {
        $set: {
          ...item,
          password,
          isVerified: true,
          status: "active",
          role: "user",
          verificationOtp: null,
          verificationOtpExpires: null,
        },
      },
      { returnDocument: "after", upsert: true, setDefaultsOnInsert: true },
    );
    users[item.email] = user;
  }

  const postsToSeed = [
    {
      author: users["linh.design.demo@skillswap.test"]._id,
      type: "teaching",
      title: "Dạy Figma cho người mới bắt đầu",
      description: "Cùng làm một landing page hoàn chỉnh, từ wireframe tới prototype.",
      skill: { name: "Figma", field: "Thiết kế", level: "Cơ bản" },
    },
    {
      author: users["minh.react.demo@skillswap.test"]._id,
      type: "teaching",
      title: "Trao đổi React và Node.js",
      description: "Mình có thể hỗ trợ component, state và xây API Express cơ bản.",
      skill: { name: "React", field: "Công nghệ", level: "Trung cấp" },
    },
    {
      author: users["an.english.demo@skillswap.test"]._id,
      type: "teaching",
      title: "Luyện nói tiếng Anh mỗi tuần",
      description: "Buổi học thân thiện, tập trung phản xạ giao tiếp hằng ngày.",
      skill: { name: "Tiếng Anh giao tiếp", field: "Ngôn ngữ", level: "Cơ bản" },
    },
    {
      author: users["khoa.guitar.demo@skillswap.test"]._id,
      type: "learning",
      title: "Muốn học marketing cho người mới",
      description: "Mình muốn tìm bạn cùng học content và quảng cáo cơ bản.",
      skill: { name: "Marketing", field: "Marketing", level: "Cơ bản" },
    },
  ];

  const posts = [];
  for (const item of postsToSeed) {
    posts.push(
      await Post.findOneAndUpdate(
        { author: item.author, title: item.title },
        { $set: { ...item, status: "active", isHidden: false } },
        { returnDocument: "after", upsert: true, setDefaultsOnInsert: true },
      ),
    );
  }

  const linh = users["linh.design.demo@skillswap.test"];
  const minh = users["minh.react.demo@skillswap.test"];
  const an = users["an.english.demo@skillswap.test"];
  const khoa = users["khoa.guitar.demo@skillswap.test"];

  const matchLinhMinh = await Match.findOneAndUpdate(
    { sender: minh._id, receiver: linh._id, postId: posts[0]._id },
    { $set: { sender: minh._id, receiver: linh._id, postId: posts[0]._id, status: "accepted", message: "Mình muốn học Figma và có thể hỗ trợ React nhé!" } },
    { returnDocument: "after", upsert: true, setDefaultsOnInsert: true },
  );
  const matchAnKhoa = await Match.findOneAndUpdate(
    { sender: khoa._id, receiver: an._id, postId: posts[2]._id },
    { $set: { sender: khoa._id, receiver: an._id, postId: posts[2]._id, status: "accepted", message: "Mình muốn luyện giao tiếp tiếng Anh cùng bạn." } },
    { returnDocument: "after", upsert: true, setDefaultsOnInsert: true },
  );

  await upsertMessage(matchLinhMinh._id, minh._id, "Chào Linh, cuối tuần này mình học Figma được không?", 45);
  await upsertMessage(matchLinhMinh._id, linh._id, "Được chứ, mình rảnh sáng thứ Bảy.", 40);
  await upsertMessage(matchLinhMinh._id, minh._id, "Tuyệt! Mình sẽ chuẩn bị sẵn project React để trao đổi lại nhé.", 35);
  await upsertMessage(matchAnKhoa._id, khoa._id, "Mình muốn bắt đầu từ các tình huống giao tiếp hằng ngày.", 28);
  await upsertMessage(matchAnKhoa._id, an._id, "Hay quá, chúng ta bắt đầu với chủ đề giới thiệu bản thân nhé.", 24);

  const group = await Group.findOneAndUpdate(
    { roomName: "demo-english-speaking-club" },
    {
      $set: {
        teacher: an._id,
        title: "English Speaking Club - Demo",
        roomName: "demo-english-speaking-club",
        members: [
          { user: minh._id, status: "accepted" },
          { user: khoa._id, status: "accepted" },
        ],
        status: "active",
      },
    },
    { returnDocument: "after", upsert: true, setDefaultsOnInsert: true },
  );

  await GroupMessage.updateOne(
    { groupId: group._id, sender: an._id, content: "Chào mọi người, 20:00 tối nay chúng ta luyện nói nhé!" },
    { $setOnInsert: { groupId: group._id, sender: an._id, content: "Chào mọi người, 20:00 tối nay chúng ta luyện nói nhé!", type: "text" } },
    { upsert: true },
  );

  await Session.findOneAndUpdate(
    { matchId: matchLinhMinh._id, teacherId: linh._id, studentId: minh._id },
    {
      $set: {
        matchId: matchLinhMinh._id,
        teacherId: linh._id,
        studentId: minh._id,
        status: "ongoing",
        scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    },
    { returnDocument: "after", upsert: true, setDefaultsOnInsert: true },
  );

  console.log("Đã thêm/cập nhật dữ liệu demo:");
  console.log("- 4 người dùng, 4 bài đăng, 2 cuộc trò chuyện, 1 nhóm và 1 buổi học.");
  console.log(`- Tất cả tài khoản demo dùng mật khẩu: ${DEMO_PASSWORD}`);
  console.log("- Chạy lại script sẽ không tạo bản ghi trùng lặp.");
}

seed()
  .catch((error) => {
    console.error("Không thể seed dữ liệu demo:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
