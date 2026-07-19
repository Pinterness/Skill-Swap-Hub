import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ArrowLeftRight } from "lucide-react";

const PAIRS: [string, string][] = [
  ["ReactJS", "Tiếng Anh"],
  ["Figma", "IELTS Speaking"],
  ["Node.js", "Marketing"],
  ["Piano", "Excel"],
];

export default function SwapCards() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setIndex((prev) => (prev + 1) % PAIRS.length);
    }, 3000);
    return () => clearInterval(id);
  }, []);

  const [teach, learn] = PAIRS[index];

  return (
    <div className="hidden lg:flex flex-col gap-3 absolute right-[4%] top-1/2 -translate-y-1/2 w-56 z-10">
      <AnimatePresence mode="wait">
        <motion.div
          key={`teach-${index}`}
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -30 }}
          transition={{ duration: 0.4 }}
          className="bg-primary/10 border border-primary/30 rounded-2xl p-4 backdrop-blur-sm shadow-lg"
        >
          <p className="text-xs text-primary font-['DM_Mono'] mb-1 tracking-wide">
            DẠY
          </p>
          <p className="font-semibold">{teach}</p>
        </motion.div>
      </AnimatePresence>

      <div className="flex justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
        >
          <ArrowLeftRight className="w-5 h-5 text-muted-foreground" />
        </motion.div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={`learn-${index}`}
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 30 }}
          transition={{ duration: 0.4 }}
          className="bg-accent/10 border border-accent/30 rounded-2xl p-4 backdrop-blur-sm shadow-lg"
        >
          <p className="text-xs text-accent font-['DM_Mono'] mb-1 tracking-wide">
            HỌC
          </p>
          <p className="font-semibold">{learn}</p>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
