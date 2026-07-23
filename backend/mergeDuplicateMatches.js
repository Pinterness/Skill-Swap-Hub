// Script dọn dẹp match trùng lặp
//   node mergeDuplicateMatches.js

require("dotenv").config();
const mongoose = require("mongoose");
const Match = require("./models/Match");
const Message = require("./models/Message");

async function run() {
  mongoose.set("strictQuery", false);
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("✅ Đã kết nối MongoDB");

  // Chỉ xét các match còn "sống" (pending/accepted) - match đã rejected/cancelled không cần gộp
  const matches = await Match.find({
    status: { $in: ["pending", "accepted"] },
  }).sort({ createdAt: 1 });

  // Nhóm các match theo CẶP người dùng (không phân biệt ai gửi ai nhận)
  const groups = new Map();

  for (const m of matches) {
    const ids = [m.sender.toString(), m.receiver.toString()].sort();
    const key = ids.join("_");
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(m);
  }

  let mergedCount = 0;

  for (const [key, group] of groups) {
    if (group.length <= 1) continue; // Không trùng, bỏ qua

    // Ưu tiên giữ lại match đã "accepted"; nếu không có thì giữ match tạo sớm nhất
    const primary = group.find((m) => m.status === "accepted") || group[0];
    const duplicates = group.filter(
      (m) => m._id.toString() !== primary._id.toString(),
    );

    console.log(
      `\n🔎 Cặp ${key}: tìm thấy ${group.length} match, giữ lại ${primary._id} (status: ${primary.status})`,
    );

    for (const dup of duplicates) {
      const moved = await Message.updateMany(
        { matchId: dup._id },
        { $set: { matchId: primary._id } },
      );
      console.log(
        `   🔀 Gộp match ${dup._id} → ${primary._id} | đã chuyển ${moved.modifiedCount} tin nhắn`,
      );

      await Match.findByIdAndDelete(dup._id);
      mergedCount++;
    }
  }

  console.log(`\n✅ Hoàn tất. Đã gộp/xóa ${mergedCount} match trùng lặp.`);
  await mongoose.disconnect();
  process.exit(0);
}

run().catch((err) => {
  console.error("❌ Lỗi khi gộp match:", err);
  process.exit(1);
});
