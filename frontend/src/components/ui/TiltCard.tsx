import React, { MouseEvent, useRef } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'motion/react';
import { User, BookOpen, Clock } from 'lucide-react';
import { Post } from '../../types'; // Điều chỉnh đường dẫn tùy cấu trúc của bạn

interface TiltCardProps {
  post: Post;
}

export default function TiltCard({ post }: TiltCardProps) {
  const ref = useRef<HTMLDivElement>(null);

  // Khởi tạo các giá trị chuyển động cho hiệu ứng 3D
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  // Làm mượt chuyển động (Spring)
  const mouseXSpring = useSpring(x, { stiffness: 300, damping: 30 });
  const mouseYSpring = useSpring(y, { stiffness: 300, damping: 30 });

  // Map vị trí chuột sang góc xoay (từ -10 độ đến 10 độ)
  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["10deg", "-10deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-10deg", "10deg"]);

  // Hàm xử lý khi chuột di chuyển trên thẻ
  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    
    // Tính toán vị trí chuột tương đối so với tâm của thẻ
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;
    
    x.set(xPct);
    y.set(yPct);
  };

  // Reset góc xoay khi chuột rời đi
  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
      className="relative w-full h-full p-6 rounded-2xl bg-card border border-border shadow-lg hover:border-primary/50 transition-colors cursor-pointer group"
    >
      {/* Nội dung bị đẩy nổi lên trên hiệu ứng 3D một chút */}
      <div style={{ transform: "translateZ(30px)" }}>
        
        {/* Header: Avatar và Tên người dùng */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center overflow-hidden border border-border group-hover:border-primary/30 transition-colors">
            {post.author.avatar ? (
              <img src={post.author.avatar} alt="avatar" className="w-full h-full object-cover" />
            ) : (
              <User className="w-5 h-5 text-muted-foreground" />
            )}
          </div>
          <div>
            <h3 className="font-['Outfit'] font-semibold text-foreground text-lg leading-tight">
              {post.title}
            </h3>
            <p className="text-sm text-muted-foreground font-medium">
              bởi {post.author.username}
            </p>
          </div>
        </div>

        <p className="text-muted-foreground text-sm line-clamp-2 mb-5">
          {post.description}
        </p>

        {/* Khu vực Nhãn Kỹ năng */}
        <div className="space-y-3">
          <div>
            <span className="text-xs text-muted-foreground font-['DM_Mono'] flex items-center gap-1.5 mb-1.5">
              <BookOpen className="w-3.5 h-3.5 text-primary" /> Có thể dạy:
            </span>
            <div className="flex flex-wrap gap-2">
              {post.skillsOffered.map((skill, idx) => (
                <span key={idx} className="px-2.5 py-1 rounded-md text-xs font-['DM_Mono'] bg-primary/10 text-primary border border-primary/20">
                  {skill}
                </span>
              ))}
            </div>
          </div>

          <div>
            <span className="text-xs text-muted-foreground font-['DM_Mono'] flex items-center gap-1.5 mb-1.5">
              <Clock className="w-3.5 h-3.5 text-accent" /> Muốn học:
            </span>
            <div className="flex flex-wrap gap-2">
              {post.skillsRequired.map((skill, idx) => (
                <span key={idx} className="px-2.5 py-1 rounded-md text-xs font-['DM_Mono'] bg-accent/10 text-accent border border-accent/20">
                  {skill}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}