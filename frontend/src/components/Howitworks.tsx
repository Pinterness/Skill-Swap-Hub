import { motion } from "motion/react";

const STEPS = [
  {
    number: "01",
    title: "Đăng kỹ năng bạn có",
    description:
      "Chia sẻ điều bạn giỏi và điều bạn đang muốn học. Một dòng mô tả đơn giản là đủ để bắt đầu.",
  },
  {
    number: "02",
    title: "Kết nối đúng người",
    description:
      "Duyệt qua cộng đồng, gửi lời mời tới người có kỹ năng bạn cần và ngược lại.",
  },
  {
    number: "03",
    title: "Dạy và học cùng lúc",
    description:
      "Trò chuyện, gọi video, mở buổi học nhóm - mỗi người vừa là giáo viên, vừa là học viên.",
  },
];

export default function HowItWorks() {
  return (
    <section
      id="ve-chung-toi"
      className="relative z-10 max-w-6xl mx-auto px-6 py-24"
    >
      <div className="text-center mb-16">
        <span className="text-sm font-['DM_Mono'] text-primary tracking-wide uppercase">
          Về chúng tôi
        </span>
        <h2 className="text-3xl md:text-4xl font-bold font-['Outfit'] mt-2">
          Cách SkillSwap hoạt động
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
        {STEPS.map((step, i) => (
          <motion.div
            key={step.number}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: i * 0.15 }}
          >
            <span
              className={`text-6xl font-bold font-['Outfit'] ${
                i % 2 === 0 ? "text-primary/20" : "text-accent/20"
              }`}
            >
              {step.number}
            </span>
            <h3 className="text-lg font-semibold mt-2 mb-2">{step.title}</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              {step.description}
            </p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
