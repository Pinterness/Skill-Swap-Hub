import { useRef, useState } from "react";
import { motion } from "motion/react";

interface ChipConfig {
  label: string;
  top: string;
  left: string;
  color: "primary" | "accent";
  floatDuration: number;
  floatDelay: number;
}

const CHIPS: ChipConfig[] = [
  {
    label: "ReactJS",
    top: "10%",
    left: "6%",
    color: "primary",
    floatDuration: 4.5,
    floatDelay: 0,
  },
  {
    label: "Tiếng Anh",
    top: "18%",
    left: "84%",
    color: "accent",
    floatDuration: 5.2,
    floatDelay: 0.3,
  },
  {
    label: "Figma",
    top: "70%",
    left: "5%",
    color: "accent",
    floatDuration: 4.8,
    floatDelay: 0.6,
  },
  {
    label: "Node.js",
    top: "80%",
    left: "86%",
    color: "primary",
    floatDuration: 5.5,
    floatDelay: 0.2,
  },
  {
    label: "IELTS",
    top: "6%",
    left: "42%",
    color: "primary",
    floatDuration: 4.2,
    floatDelay: 0.5,
  },
  {
    label: "Guitar",
    top: "48%",
    left: "92%",
    color: "primary",
    floatDuration: 5.3,
    floatDelay: 0.7,
  },
  {
    label: "Marketing",
    top: "42%",
    left: "2%",
    color: "accent",
    floatDuration: 4.6,
    floatDelay: 0.4,
  },
];

const REPEL_RADIUS = 130; // Bán kính (px) mà thẻ bắt đầu "né" khi chuột tới gần
const MAX_PUSH = 55; // Khoảng cách tối đa (px) thẻ bị đẩy đi

export default function FloatingSkillChips() {
  const chipRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [offsets, setOffsets] = useState<{ x: number; y: number }[]>(
    CHIPS.map(() => ({ x: 0, y: 0 })),
  );

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const mouseX = e.clientX;
    const mouseY = e.clientY;

    const nextOffsets = chipRefs.current.map((el) => {
      if (!el) return { x: 0, y: 0 };
      const rect = el.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const dx = centerX - mouseX;
      const dy = centerY - mouseY;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < REPEL_RADIUS && distance > 0) {
        const strength = (1 - distance / REPEL_RADIUS) * MAX_PUSH;
        return { x: (dx / distance) * strength, y: (dy / distance) * strength };
      }
      return { x: 0, y: 0 };
    });

    setOffsets(nextOffsets);
  };

  const handleMouseLeave = () => {
    setOffsets(CHIPS.map(() => ({ x: 0, y: 0 })));
  };

  return (
    <div
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="absolute inset-0 z-0 hidden md:block"
    >
      {/* Idle floating - CSS animation riêng, tách khỏi transform của framer-motion để không xung đột */}
      <style>{`
        @keyframes chipFloat {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-12px); }
        }
      `}</style>

      {CHIPS.map((chip, i) => (
        <div
          key={chip.label}
          className="absolute pointer-events-auto"
          style={{
            top: chip.top,
            left: chip.left,
            animation: `chipFloat ${chip.floatDuration}s ease-in-out ${chip.floatDelay}s infinite`,
          }}
        >
          <motion.div
            ref={(el) => {
              chipRefs.current[i] = el;
            }}
            animate={{ x: offsets[i]?.x ?? 0, y: offsets[i]?.y ?? 0 }}
            transition={{ type: "spring", stiffness: 150, damping: 15 }}
          >
            <span
              className={`inline-block px-4 py-2 rounded-full text-sm font-['DM_Mono'] border backdrop-blur-sm select-none whitespace-nowrap ${
                chip.color === "primary"
                  ? "bg-primary/10 border-primary/30 text-primary"
                  : "bg-accent/10 border-accent/30 text-accent"
              }`}
            >
              {chip.label}
            </span>
          </motion.div>
        </div>
      ))}
    </div>
  );
}
