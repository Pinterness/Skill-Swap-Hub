import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { Star, BookOpen } from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../lib/api";

interface FeaturedUser {
  _id: string;
  username: string;
  avatar?: string;
  skillsOffered: string[];
  stats: {
    averageRating: number;
    totalTaught: number;
    totalReviews: number;
  };
}

export default function FeaturedUsers() {
  const [users, setUsers] = useState<FeaturedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        const res = await api.get("/api/user/featured");
        setUsers(res.data?.users || []);
      } catch (err) {
        console.error("Lỗi lấy người dùng tiêu biểu:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchFeatured();
  }, []);

  const initials = (name: string) => name.slice(0, 2).toUpperCase();

  // Nếu chưa có ai đủ điều kiện (chưa có đánh giá thật nào) thì ẩn hẳn section,
  // tránh hiện 1 khối trống gây khó hiểu cho khách ghé thăm lần đầu
  if (!loading && users.length === 0) return null;

  return (
    <section
      id="cong-dong"
      className="relative z-10 max-w-7xl mx-auto px-6 py-24"
    >
      <div className="text-center mb-14">
        <span className="text-sm font-['DM_Mono'] text-accent tracking-wide uppercase">
          Cộng đồng
        </span>
        <h2 className="text-3xl md:text-4xl font-bold font-['Outfit'] mt-2">
          Người dùng tiêu biểu
        </h2>
        <p className="text-muted-foreground mt-3 max-w-xl mx-auto">
          Những thành viên được cộng đồng đánh giá cao nhất, đã cùng đồng hành
          qua nhiều buổi học thật.
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {users.map((u, i) => (
            <motion.div
              key={u._id}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              onClick={() => navigate(`/dashboard/user/${u._id}`)}
              className="group bg-card border border-border rounded-2xl p-6 cursor-pointer hover:border-primary/40 hover:-translate-y-1 transition-all"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-semibold overflow-hidden shrink-0">
                  {u.avatar ? (
                    <img
                      src={u.avatar}
                      alt={u.username}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    initials(u.username)
                  )}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold truncate group-hover:text-primary transition-colors">
                    {u.username}
                  </p>
                  <div className="flex items-center gap-1 text-sm text-yellow-500">
                    <Star className="w-3.5 h-3.5 fill-yellow-500" />
                    <span>{u.stats?.averageRating || 0}</span>
                    <span className="text-muted-foreground">
                      ({u.stats?.totalReviews || 0} đánh giá)
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5 mb-4">
                {(u.skillsOffered || []).slice(0, 3).map((s) => (
                  <span
                    key={s}
                    className="text-xs px-2.5 py-1 rounded-full bg-secondary text-secondary-foreground border border-border"
                  >
                    {s}
                  </span>
                ))}
              </div>

              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <BookOpen className="w-3.5 h-3.5" />
                {u.stats?.totalTaught || 0} buổi đã dạy
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </section>
  );
}
