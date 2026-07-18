import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../hooks/useAuth";
import { ArrowRight, BookOpen, Star, Users, X, Send } from "lucide-react";

const API = "http://localhost:5000/api";

interface Post {
  _id: string;
  title: string;
  description: string;
  skillsRequired: string[];
  skillsOffered: string[];
  type?: "learning" | "teaching";
  skill?: {
    name: string;
    field: string;
    level: string;
  };
  author: { _id: string; username: string; avatar?: string };
  createdAt: string;
}

export default function DashboardPage() {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterField, setFilterField] = useState("");
  const [filterLevel, setFilterLevel] = useState("");

  // States cho Modal gửi lời mời nhanh ngay trên trang chủ
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [matchMessage, setMatchMessage] = useState("");
  const [sending, setSending] = useState(false);

  const FIELDS = [
    "Công nghệ",
    "Ngôn ngữ",
    "Thiết kế",
    "Marketing",
    "Kinh doanh",
    "Âm nhạc",
    "Thể thao",
    "Khác",
  ];
  const LEVELS = ["Cơ bản", "Trung cấp", "Nâng cao"];

  const [liveData, setLiveData] = useState({
    taught: user?.stats?.totalTaught || 0,
    rating: user?.stats?.averageRating || 0,
    friends: user?.friends?.length || 0,
  });

  useEffect(() => {
    fetchPosts();
    fetchLiveStats();
  }, []);

  const fetchLiveStats = async () => {
    if (!user?.id) return;
    try {
      const res = await axios.get(`${API}/profile/${user.id}`);
      if (res.data?.user) {
        setLiveData({
          taught: res.data.user.stats?.totalTaught || 0,
          rating: res.data.user.stats?.averageRating || 0,
          friends: res.data.user.friends?.length || 0,
        });
      }
    } catch (error) {
      console.error("Lỗi lấy thống kê realtime:", error);
    }
  };

  const fetchPosts = async (params = {}) => {
    try {
      setLoading(true);
      const res = await axios.get(`${API}/post`, { params });
      setPosts(res.data.posts);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchPosts({
      skill: query,
      type: filterType,
      field: filterField,
      level: filterLevel,
    });
  };

  // Hàm xử lý gửi lời mời
  const handleSendMatch = async () => {
    if (!matchMessage.trim() || !selectedPost)
      return alert("Vui lòng nhập lời nhắn");
    setSending(true);
    try {
      await axios.post(
        `${API}/match/send`,
        {
          receiverId: selectedPost.author._id,
          postId: selectedPost._id, // Truyền postId để Backend biết tự động đóng bài
          message: matchMessage,
        },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      alert("Đã gửi lời mời kết nối thành công!");
      setSelectedPost(null);
      setMatchMessage("");
    } catch (err: any) {
      alert(err.response?.data?.message || "Lỗi hệ thống");
    } finally {
      setSending(false);
    }
  };

  const initials = (name: string) =>
    name ? name.slice(0, 2).toUpperCase() : "U";

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Metric cards */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-secondary rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <BookOpen className="w-4 h-4 text-primary" />
            <span className="text-xs text-muted-foreground">Buổi dạy</span>
          </div>
          {/* ĐÃ SỬA: Sử dụng liveData */}
          <p className="text-2xl font-semibold">{liveData.taught}</p>
        </div>
        <div className="bg-secondary rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Star className="w-4 h-4 text-yellow-400" />
            <span className="text-xs text-muted-foreground">Đánh giá TB</span>
          </div>
          {/* ĐÃ SỬA: Sử dụng liveData */}
          <p className="text-2xl font-semibold">{liveData.rating || "—"}</p>
        </div>
        <div className="bg-secondary rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-4 h-4 text-blue-400" />
            <span className="text-xs text-muted-foreground">Kết nối</span>
          </div>
          {/* ĐÃ SỬA: Sử dụng liveData */}
          <p className="text-2xl font-semibold">{liveData.friends}</p>
        </div>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="flex gap-2 mb-6">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Tìm kiếm kỹ năng..."
          className="flex-1 h-10 px-4 rounded-lg bg-secondary border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none text-sm text-foreground placeholder:text-muted-foreground"
        />
        <button
          type="submit"
          className="px-4 h-10 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors cursor-pointer"
        >
          Tìm
        </button>
        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              fetchPosts({
                type: filterType,
                field: filterField,
                level: filterLevel,
              });
            }}
            className="px-4 h-10 border border-border text-sm rounded-lg hover:bg-secondary transition-colors cursor-pointer"
          >
            Xóa
          </button>
        )}
      </form>

      {/* Filter bar */}
      <div className="flex gap-2 mb-6 flex-wrap">
        <div className="flex gap-1 p-1 bg-secondary rounded-xl">
          {[
            { v: "", l: "Tất cả" },
            { v: "learning", l: "🎓 học" },
            { v: "teaching", l: "📚 dạy" },
          ].map((opt) => (
            <button
              key={opt.v}
              onClick={() => {
                setFilterType(opt.v);
                fetchPosts({
                  skill: query,
                  type: opt.v,
                  field: filterField,
                  level: filterLevel,
                });
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                filterType === opt.v
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {opt.l}
            </button>
          ))}
        </div>

        <select
          value={filterField}
          onChange={(e) => {
            setFilterField(e.target.value);
            fetchPosts({
              skill: query,
              type: filterType,
              field: e.target.value,
              level: filterLevel,
            });
          }}
          className="h-9 px-3 rounded-xl bg-secondary border border-border text-xs text-foreground outline-none focus:border-primary cursor-pointer"
        >
          <option value="">Tất cả lĩnh vực</option>
          {FIELDS.map((f) => (
            <option key={f} value={f}>
              {f}
            </option>
          ))}
        </select>

        <select
          value={filterLevel}
          onChange={(e) => {
            setFilterLevel(e.target.value);
            fetchPosts({
              skill: query,
              type: filterType,
              field: filterField,
              level: e.target.value,
            });
          }}
          className="h-9 px-3 rounded-xl bg-secondary border border-border text-xs text-foreground outline-none focus:border-primary cursor-pointer"
        >
          <option value="">Tất cả cấp độ</option>
          {LEVELS.map((l) => (
            <option key={l} value={l}>
              {l}
            </option>
          ))}
        </select>
      </div>

      <h2 className="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wide">
        Bài đăng mới nhất
      </h2>

      {loading ? (
        <div className="text-center py-20">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Đang tải...</p>
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-border rounded-2xl">
          <p className="text-muted-foreground text-sm">Chưa có bài đăng nào</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {posts.map((post) => (
            <div
              key={post._id}
              onClick={() => navigate(`/dashboard/post/${post._id}`)} // Bấm vào thẻ -> Xem chi tiết bài
              className="bg-card border border-border rounded-2xl p-4 hover:border-primary/40 transition-colors cursor-pointer group flex flex-col h-full"
            >
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-full bg-green-100 flex items-center justify-center text-[10px] font-medium text-green-700">
                  {initials(post.author?.username)}
                </div>
                <span
                  className="text-xs font-medium cursor-pointer hover:text-primary transition-colors"
                  onClick={(e) => {
                    e.stopPropagation(); // Ngăn mở chi tiết bài
                    navigate(`/dashboard/user/${post.author._id}`); // Bấm vào tên -> Xem Profile
                  }}
                >
                  {post.author?.username || "Ẩn danh"}
                </span>
                <span className="text-xs text-muted-foreground ml-auto">
                  {new Date(post.createdAt).toLocaleDateString("vi-VN")}
                </span>
              </div>
              <h3 className="text-sm font-medium mb-1 group-hover:text-primary transition-colors">
                {post.title}
              </h3>
              <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
                {post.description}
              </p>

              <div className="flex flex-wrap gap-1.5 mb-auto">
                {post.type && (
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${
                      post.type === "learning"
                        ? "bg-blue-50 text-blue-700 border-blue-100"
                        : "bg-green-50 text-green-700 border-green-100"
                    }`}
                  >
                    {post.type === "learning" ? "🎓 Tìm học" : "📚 Dạy"}
                  </span>
                )}

                {post.skill?.field && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary border border-border text-muted-foreground">
                    {post.skill.field}
                  </span>
                )}

                {post.skill?.level && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary border border-border text-muted-foreground">
                    {post.skill.level}
                  </span>
                )}

                {post.skill?.name && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 font-medium">
                    {post.skill.name}
                  </span>
                )}
              </div>

              {/* NÚT GỬI LỜI MỜI */}
              {user?.id !== post.author._id && ( // Ẩn nút gửi lời mời nếu tự xem bài của mình
                <div className="pt-4 mt-3 border-t border-border">
                  <button
                    onClick={(e) => {
                      e.stopPropagation(); // Ngăn mở chi tiết bài
                      setSelectedPost(post); // Mở Modal gửi lời mời
                    }}
                    className="flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary/80 transition-colors w-fit"
                  >
                    <Send className="w-3.5 h-3.5" /> Gửi lời mời
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal gửi lời mời trực tiếp trên trang chủ */}
      {selectedPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold">Gửi lời mời kết nối</h3>
              <button onClick={() => setSelectedPost(null)}>
                <X className="w-5 h-5 text-muted-foreground hover:text-foreground" />
              </button>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Gửi lời mời đến <strong>{selectedPost.author.username}</strong> về
              bài đăng:{" "}
              <span className="font-medium">"{selectedPost.title}"</span>.
            </p>
            <textarea
              value={matchMessage}
              onChange={(e) => setMatchMessage(e.target.value)}
              placeholder="VD: Mình rất muốn học kỹ năng này của bạn..."
              rows={4}
              className="w-full px-4 py-3 rounded-xl bg-secondary border border-border outline-none text-sm mb-4"
            />
            <div className="flex gap-3">
              <button
                onClick={handleSendMatch}
                disabled={sending}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-primary text-white text-sm font-medium rounded-xl hover:bg-primary/90 disabled:opacity-60"
              >
                {sending ? "Đang gửi..." : "Xác nhận gửi"}
              </button>
              <button
                onClick={() => setSelectedPost(null)}
                className="px-4 py-2.5 border border-border text-sm rounded-xl hover:bg-secondary text-muted-foreground"
              >
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
