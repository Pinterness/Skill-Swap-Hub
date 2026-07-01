import React from 'react';
import TiltCard from '../ui/TiltCard'; 
import { Post } from '../../types';

interface PostGridProps {
  posts: Post[];
  isLoading?: boolean;
}

export default function PostGrid({ posts, isLoading = false }: PostGridProps) {
  
  // Trạng thái chờ dữ liệu (Khi chưa có API)
  if (isLoading) {
    return (
      <div className="w-full max-w-6xl mx-auto py-12 px-4 text-center">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin mx-auto mb-4"></div>
        <p className="text-muted-foreground font-['DM_Mono'] text-sm">Đang tải dữ liệu...</p>
      </div>
    );
  }

  // Trạng thái không có bài đăng nào
  if (!posts || posts.length === 0) {
    return (
      <div className="w-full max-w-6xl mx-auto py-20 px-4 text-center border border-dashed border-border rounded-2xl bg-secondary/20">
        <h3 className="text-xl font-['Outfit'] font-semibold text-foreground mb-2">Chưa có bài đăng nào</h3>
        <p className="text-muted-foreground text-sm">Hãy là người đầu tiên tạo yêu cầu trao đổi kỹ năng nhé!</p>
      </div>
    );
  }

  // Trạng thái có dữ liệu
  return (
    <section className="w-full max-w-7xl mx-auto py-16 px-4" id="kham-pha">
      <div className="mb-10 text-left">
        <h2 className="text-3xl font-bold font-['Outfit'] text-foreground mb-2">
          Khám phá Cơ hội Trao đổi
        </h2>
        <p className="text-muted-foreground">
          Tìm người phù hợp để cùng nhau nâng cấp kỹ năng.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" style={{ perspective: "1000px" }}>
        {posts.map((post) => (
          <TiltCard key={post._id} post={post} />
        ))}
      </div>
    </section>
  );
}