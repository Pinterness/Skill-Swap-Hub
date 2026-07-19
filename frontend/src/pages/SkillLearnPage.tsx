import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { ArrowLeft, BookOpen, Lightbulb, Target, Users } from "lucide-react";

// Dữ liệu mẫu (Dummy data). Sau này bạn có thể chuyển cái này vào MongoDB và gọi API.
const skillDatabase: Record<string, any> = {
  reactjs: {
    name: "ReactJS",
    category: "Lập trình",
    description:
      "Thư viện JavaScript phổ biến nhất để xây dựng giao diện người dùng (UI).",
    theories: [
      {
        title: "1. Component là gì?",
        content:
          "React chia UI thành các phần nhỏ độc lập, có thể tái sử dụng gọi là Component. Có hai loại chính: Class Component (cũ) và Functional Component (hiện đại).",
      },
      {
        title: "2. State và Props",
        content:
          "Props là dữ liệu truyền từ component cha xuống con (chỉ đọc). State là bộ nhớ nội bộ của component, khi state thay đổi, component sẽ tự động render lại.",
      },
      {
        title: "3. React Hooks",
        content:
          "Các hàm đặc biệt như useState, useEffect giúp sử dụng state và các tính năng khác của React trong Functional Component mà không cần viết Class.",
      },
    ],
    tips: "Hãy nắm vững JavaScript ES6 (Arrow function, Destructuring, Map, Filter) trước khi học sâu vào React.",
  },
  "ui-ux-design": {
    name: "UI/UX Design",
    category: "Thiết kế",
    description:
      "Nghệ thuật thiết kế trải nghiệm người dùng (UX) và giao diện người dùng (UI) sao cho sản phẩm dễ sử dụng và đẹp mắt.",
    theories: [
      {
        title: "1. Khác biệt giữa UI và UX",
        content:
          "UX (User Experience) là cảm giác, trải nghiệm tổng thể của người dùng. UI (User Interface) là những gì người dùng nhìn thấy và tương tác (màu sắc, nút bấm).",
      },
      {
        title: "2. Wireframe và Prototype",
        content:
          "Wireframe là bản phác thảo đen trắng về cấu trúc trang. Prototype là bản mẫu có thể tương tác được để test luồng người dùng trước khi code.",
      },
    ],
    tips: "Luôn đặt mình vào vị trí của người dùng. Đừng thiết kế cho bản thân, hãy thiết kế cho khách hàng.",
  },
};

export default function SkillLearnPage() {
  const { skillId } = useParams<{ skillId: string }>();
  const navigate = useNavigate();

  // Chuyển URL param (vd: "ui-ux-design") thành key để tìm trong database
  const normalizedSkillId = skillId?.toLowerCase().replace(/\s+/g, "-") || "";
  const skillData = skillDatabase[normalizedSkillId];

  if (!skillData) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground">
        <h2 className="text-2xl font-bold mb-4">
          Chưa có dữ liệu cho kỹ năng này
        </h2>
        <button
          onClick={() => navigate("/")}
          className="px-6 py-2 bg-primary text-primary-foreground rounded-full hover:bg-primary/90"
        >
          Về trang chủ
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground font-['DM_Sans'] py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Nút quay lại */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors mb-8"
        >
          <ArrowLeft className="w-5 h-5" /> Quay lại
        </button>

        {/* Header Kỹ năng */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary text-secondary-foreground text-sm font-medium mb-4">
            <Target className="w-4 h-4" /> {skillData.category}
          </div>
          <h1 className="text-4xl md:text-5xl font-bold font-['Outfit'] mb-4">
            {skillData.name}
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed">
            {skillData.description}
          </p>
        </motion.div>

        {/* Nội dung Lý thuyết */}
        <div className="space-y-8 mb-12">
          <h2 className="text-2xl font-bold flex items-center gap-2 border-b border-border pb-4">
            <BookOpen className="w-6 h-6 text-primary" /> Lý thuyết trọng tâm
          </h2>

          {skillData.theories.map((theory: any, index: number) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="p-6 rounded-2xl bg-card border border-border shadow-sm hover:shadow-md transition-shadow"
            >
              <h3 className="text-xl font-bold mb-3">{theory.title}</h3>
              <p className="text-muted-foreground leading-relaxed">
                {theory.content}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Tips & CTA */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="p-6 rounded-2xl bg-accent/10 border border-accent/20">
            <h3 className="text-lg font-bold flex items-center gap-2 text-accent-foreground mb-3">
              <Lightbulb className="w-5 h-5" /> Mẹo học tập
            </h3>
            <p className="text-sm leading-relaxed">{skillData.tips}</p>
          </div>

          <div className="p-6 rounded-2xl bg-primary/10 border border-primary/20 flex flex-col justify-center items-start">
            <h3 className="text-lg font-bold flex items-center gap-2 text-primary mb-3">
              <Users className="w-5 h-5" /> Sẵn sàng thực hành?
            </h3>
            <p className="text-sm leading-relaxed mb-4">
              Tìm ngay người hướng dẫn hoặc partner để trao đổi kỹ năng{" "}
              {skillData.name} trên cộng đồng.
            </p>
            <button className="px-5 py-2.5 bg-primary text-primary-foreground rounded-full text-sm font-medium hover:bg-primary/90 transition-all shadow-md">
              Tìm cộng sự ngay
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
