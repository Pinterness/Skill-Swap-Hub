import React, { useEffect, useState } from "react";
import { motion } from "motion/react";
import { Search, Sparkles, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import PostGrid from "../components/feed/PostGrid";
import AuthForm from "../components/auth/AuthForm";
import { Post } from "../types";

// LƯU Ý QUAN TRỌNG: Hãy kiểm tra lại tên file thực tế của bạn trong thư mục components
// và đảm bảo các đường dẫn import dưới đây khớp 100% (chữ hoa/chữ thường) nhé!
import FloatingSkillChips from "../components/FloatingSkillChips";
import SwapCards from "../components/Swapcards";
import HowItWorks from "../components/Howitworks";
import FeaturedUsers from "../components/Featuredusers";
import Footer from "../components/Footer";
import { useLanguage } from "../context/LanguageContext";
import LanguageSwitcher from "../components/LanguageSwitcher";
import api from "../lib/api";

export default function LandingPage() {
  const [query, setQuery] = useState("");
  const [showAuth, setShowAuth] = useState(false);
  const [authTab, setAuthTab] = useState<"login" | "register">("login");
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [posts, setPosts] = useState<Post[]>([]);
  const [postsLoading, setPostsLoading] = useState(true);
  const [postsError, setPostsError] = useState("");

  const fetchPosts = async (search = "") => {
    try {
      setPostsLoading(true);
      setPostsError("");
      const res = await api.get("/api/post", { params: { limit: 6, ...(search.trim() ? { skill: search.trim() } : {}) } });
      const landingPosts: Post[] = (res.data?.posts || []).map((post: any) => ({
        _id: post._id,
        title: post.title,
        description: post.description,
        skillsOffered: post.type === "teaching" ? [post.skill?.name].filter(Boolean) : [],
        skillsRequired: post.type === "learning" ? [post.skill?.name].filter(Boolean) : [],
        author: post.author,
        createdAt: post.createdAt,
      }));
      setPosts(landingPosts);
    } catch (error) {
      console.error("Không thể tải bài đăng trang chủ:", error);
      setPostsError("Không thể tải bài đăng lúc này. Vui lòng thử lại sau.");
    } finally {
      setPostsLoading(false);
    }
  };

  useEffect(() => { fetchPosts(); }, []);

  // Hàm xử lý tìm kiếm khi nhấn Enter hoặc bấm nút Tìm
  const handleSearch = (e?: React.FormEvent) => {
    e?.preventDefault();
    fetchPosts(query);
    document.getElementById("kham-pha")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleAuthSuccess = () => {
    setShowAuth(false);
    navigate("/dashboard");
  };

  return (
    <div className="relative min-h-screen bg-background overflow-hidden selection:bg-primary/30 text-foreground font-['DM_Sans']">
      {/* Hiệu ứng ánh sáng nền */}
      <div className="absolute top-[-10%] left-[-10%] w-[40vw] h-[40vw] rounded-full bg-accent/20 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40vw] h-[40vw] rounded-full bg-primary/20 blur-[120px] pointer-events-none" />

      {/* ── NAVBAR ── */}
      <div className="sticky top-0 z-50 w-full bg-background/80 backdrop-blur-md border-b border-border/40">
        <nav className="flex items-center justify-between px-6 py-4 max-w-7xl mx-auto">
          <div
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => window.scrollTo(0, 0)}
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold font-['Outfit'] tracking-wide">
              SkillSwap
            </span>
          </div>

          <div className="hidden md:flex gap-8 font-medium text-muted-foreground">
            <a
              href="#kham-pha"
              className="hover:text-primary transition-colors"
            >
              {t("discover")}
            </a>
            <a
              href="#cong-dong"
              className="hover:text-primary transition-colors"
            >
              {t("community")}
            </a>
            <a
              href="#ve-chung-toi"
              className="hover:text-primary transition-colors"
            >
              {t("about")}
            </a>
          </div>

          <div className="flex items-center gap-2 md:gap-4">
            <LanguageSwitcher />
            <button
              onClick={() => {
                setAuthTab("login");
                setShowAuth(true);
              }}
              className="px-5 py-2.5 text-sm font-medium text-foreground hover:text-primary transition-colors cursor-pointer"
            >
              {t("login")}
            </button>
            <button
              onClick={() => {
                setAuthTab("register");
                setShowAuth(true);
              }}
              className="px-5 py-2.5 text-sm font-medium bg-primary text-primary-foreground rounded-full hover:bg-primary/90 transition-all shadow-[0_0_20px_rgba(255,107,74,0.2)] hover:shadow-[0_0_30px_rgba(255,107,74,0.4)] hover:-translate-y-0.5 cursor-pointer"
            >
              {t("joinFree")}
            </button>
          </div>
        </nav>
      </div>

      {/* ── HERO SECTION ── */}
      {/* Đã sửa py-12 thành pt-28 pb-12 để phần chữ lùi xuống, không bị Navbar che */}
      <main className="relative z-10 flex items-center min-h-[calc(100vh-100px)] pt-28 pb-12 px-4">
        <FloatingSkillChips />

        <div className="relative z-10 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Cột Trái */}
          <div className="flex flex-col items-center lg:items-start text-center lg:text-left">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary border border-border mb-8 shadow-sm"
            >
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span className="text-sm text-secondary-foreground tracking-tight font-['DM_Mono']">
                Cộng đồng 10.000+ thành viên
              </span>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
            >
              <h1 className="text-5xl md:text-6xl xl:text-7xl font-extrabold font-['Outfit'] leading-[1.1] mb-6">
                Trao đổi kỹ năng <br />
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">
                  Kết nối tri thức
                </span>
              </h1>
            </motion.div>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2, ease: "easeOut" }}
              className="text-lg md:text-xl text-muted-foreground mb-10 max-w-xl leading-relaxed"
            >
              Nền tảng chia sẻ kỹ năng thực tế. Bạn có chuyên môn, người khác
              đang cần. Hãy kết nối, học hỏi chéo và cùng nhau phát triển không
              giới hạn.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3, ease: "easeOut" }}
              className="w-full max-w-xl relative flex items-center group"
            >
              {/* Thẻ form giúp nhận diện phím Enter khi người dùng gõ xong */}
              <form
                onSubmit={handleSearch}
                className="relative flex items-center group w-full"
              >
                <div className="absolute left-5 text-muted-foreground group-focus-within:text-primary transition-colors">
                  <Search className="w-6 h-6" />
                </div>
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Kỹ năng bạn muốn học? (VD: ReactJS)"
                  className="w-full h-16 pl-14 pr-36 rounded-full bg-card border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-foreground text-base placeholder:text-muted-foreground/50 shadow-xl"
                />
                <button
                  type="submit"
                  className="absolute right-2 top-2 bottom-2 px-6 bg-primary text-primary-foreground font-medium rounded-full hover:bg-primary/90 transition-all flex items-center gap-2 shadow-md hover:shadow-lg cursor-pointer"
                >
                  Tìm
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="mt-10 flex flex-wrap justify-center lg:justify-start items-center gap-3"
            >
              <span className="text-sm text-muted-foreground mr-2 font-['DM_Mono']">
                Nổi bật:
              </span>
              {/* Đổi span thành button và gắn sự kiện chuyển hướng onClick */}
              {["UI/UX Design", "Giao tiếp tiếng Anh", "Node.js", "Figma"].map(
                (skill) => {
                  return (
                    <button
                      key={skill}
                      onClick={() => { setQuery(skill); fetchPosts(skill); document.getElementById("kham-pha")?.scrollIntoView({ behavior: "smooth", block: "start" }); }}
                      className="px-4 py-1.5 rounded-full text-sm font-['DM_Mono'] bg-secondary/40 border border-border hover:border-primary/50 hover:text-primary transition-colors cursor-pointer text-muted-foreground"
                    >
                      {skill}
                    </button>
                  );
                },
              )}
            </motion.div>
          </div>

          {/* Cột Phải */}
          <div className="hidden lg:block relative w-full">
            <SwapCards />
          </div>
        </div>
      </main>

      {/* ── BÀI ĐĂNG GẦN ĐÂY ── */}
      <section id="kham-pha" className="relative z-10 py-16 px-4 max-w-7xl mx-auto border-t border-border/50 scroll-mt-20">
        <div className="text-center md:text-left mb-10">
          <h2 className="text-3xl font-bold text-foreground">
            {query ? `Kết quả cho “${query}”` : "Bài đăng kỹ năng mới nhất"}
          </h2>
          <p className="text-muted-foreground mt-2">
            Nội dung công khai để bạn đọc và tìm người phù hợp trước khi tham gia.
          </p>
        </div>
        {postsError ? (
          <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-6 text-center text-sm text-muted-foreground"><p>{postsError}</p><button onClick={() => fetchPosts(query)} className="mt-3 text-primary font-medium hover:underline">Thử lại</button></div>
        ) : <PostGrid posts={posts} isLoading={postsLoading} showHeader={false} />}
      </section>

      {/* ── CÁC SECTION KHÁC ── */}
      <div className="relative z-10">
        <HowItWorks />
        <FeaturedUsers />
      </div>

      {/* ── FOOTER ── */}
      <div className="relative z-10">
        <Footer />
      </div>

      {/* ── AUTH MODAL ── */}
      {showAuth && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <AuthForm
            onClose={() => setShowAuth(false)}
            defaultTab={authTab}
            onSuccess={handleAuthSuccess}
          />
        </div>
      )}
    </div>
  );
}
