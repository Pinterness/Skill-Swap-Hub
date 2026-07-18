import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../hooks/useAuth";
import {
  BookOpen,
  Star,
  Users,
  X,
  Send,
  Compass,
  FolderKanban,
  MoreHorizontal,
  Trash2,
  EyeOff,
  Eye,
  PlusCircle,
} from "lucide-react";

const API = "http://localhost:5000/api";

interface Post {
  _id: string;
  title: string;
  description: string;
  type?: "learning" | "teaching";
  skill?: { name: string; field: string; level: string };
  author: { _id: string; username: string; avatar?: string };
  createdAt: string;
  status?: string; // Thêm status để biết bài đang đóng hay mở
}

export default function DashboardPage() {
  const { user, token } = useAuth();
  const navigate = useNavigate();

  // States dữ liệu
  const [discoverPosts, setDiscoverPosts] = useState<Post[]>([]);
  const [myPosts, setMyPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  // States UI & Tab
  const [activeTab, setActiveTab] = useState<"discover" | "my-posts">(
    "discover",
  );
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // States Filter (Chỉ cho tab Discover)
  const [query, setQuery] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterField, setFilterField] = useState("");
  const [filterLevel, setFilterLevel] = useState("");

  // States Modal gửi lời mời
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

  // Xử lý đóng menu 3 chấm khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch dữ liệu khi khởi chạy hoặc chuyển tab
  useEffect(() => {
    fetchLiveStats();
  }, [user?.id]);

  useEffect(() => {
    if (activeTab === "discover") {
      fetchDiscoverPosts();
    } else {
      fetchMyPosts();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

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
      console.error("Lỗi lấy thống kê:", error);
    }
  };

  // Lấy bài đăng của người khác (Khám phá)
  const fetchDiscoverPosts = async (params = {}) => {
    try {
      setLoading(true);
      const res = await axios.get(`${API}/post`, { params });
      // Lọc bỏ bài của chính user hiện tại cho đỡ rác
      const filtered = res.data.posts.filter(
        (p: Post) => p.author._id !== user?.id && p.author._id !== user?._id,
      );
      setDiscoverPosts(filtered);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Lấy TOÀN BỘ bài đăng của chính mình (cả active & closed)
  const fetchMyPosts = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API}/post/my-posts`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMyPosts(res.data.posts);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchDiscoverPosts({
      skill: query,
      type: filterType,
      field: filterField,
      level: filterLevel,
    });
  };

  const handleSendMatch = async () => {
    if (!matchMessage.trim() || !selectedPost)
      return alert("Vui lòng nhập lời nhắn");
    setSending(true);
    try {
      await axios.post(
        `${API}/match/send`,
        {
          receiverId: selectedPost.author._id,
          postId: selectedPost._id,
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

  // --- HÀNH ĐỘNG CHO TAB "BÀI CỦA TÔI" ---
  const handleDeletePost = async (e: React.MouseEvent, postId: string) => {
    e.stopPropagation();
    setOpenMenuId(null);
    if (
      !window.confirm(
        "Bạn chắc chắn muốn xóa bài đăng này? Hành động không thể hoàn tác.",
      )
    )
      return;
    try {
      await axios.delete(`${API}/post/${postId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMyPosts(myPosts.filter((p) => p._id !== postId));
      alert("Đã xóa bài đăng");
    } catch (error) {
      alert("Lỗi khi xóa bài");
    }
  };

  const handleToggleStatus = async (e: React.MouseEvent, post: Post) => {
    e.stopPropagation();
    setOpenMenuId(null);
    try {
      await axios.put(
        `${API}/post/${post._id}/close`,
        {},
        { headers: { Authorization: `Bearer ${token}` } },
      );
      // Refresh lại danh sách bài của tôi để cập nhật trạng thái mới nhất
      fetchMyPosts();
      alert(
        `Đã ${post.status === "active" ? "ẩn" : "mở lại"} bài đăng thành công!`,
      );
    } catch (error) {
      alert("Lỗi hệ thống");
    }
  };

  const initials = (name: string) =>
    name ? name.slice(0, 2).toUpperCase() : "U";

  // Dữ liệu hiển thị dựa trên Tab
  const displayedPosts = activeTab === "discover" ? discoverPosts : myPosts;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header & Metric cards */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground mb-1">
          Xin chào, {user?.username}
        </h1>
        <p className="text-muted-foreground text-sm mb-6">
          Hôm nay bạn muốn trao đổi và học hỏi thêm kỹ năng gì?
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                <BookOpen className="w-5 h-5" />
              </div>
              <span className="text-sm font-medium text-muted-foreground">
                Buổi dạy
              </span>
            </div>
            <p className="text-2xl font-bold">{liveData.taught}</p>
          </div>
          <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-yellow-50 text-yellow-600 rounded-lg">
                <Star className="w-5 h-5" />
              </div>
              <span className="text-sm font-medium text-muted-foreground">
                Đánh giá TB
              </span>
            </div>
            <p className="text-2xl font-bold">{liveData.rating || "—"}</p>
          </div>
          <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-green-50 text-green-600 rounded-lg">
                <Users className="w-5 h-5" />
              </div>
              <span className="text-sm font-medium text-muted-foreground">
                Kết nối
              </span>
            </div>
            <p className="text-2xl font-bold">{liveData.friends}</p>
          </div>
        </div>
      </div>

      {/* TABS NAVIGATION */}
      <div className="flex border-b border-border mb-6">
        <button
          onClick={() => setActiveTab("discover")}
          className={`flex items-center gap-2 px-6 py-3 font-medium text-sm transition-colors relative ${
            activeTab === "discover"
              ? "text-primary"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Compass className="w-4 h-4" /> Khám phá
          {activeTab === "discover" && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t-full" />
          )}
        </button>
        <button
          onClick={() => setActiveTab("my-posts")}
          className={`flex items-center gap-2 px-6 py-3 font-medium text-sm transition-colors relative ${
            activeTab === "my-posts"
              ? "text-primary"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <FolderKanban className="w-4 h-4" /> Bài của tôi
          {activeTab === "my-posts" && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t-full" />
          )}
        </button>
      </div>

      {/* Thanh công cụ tìm kiếm - Chỉ hiện ở tab Khám phá */}
      {activeTab === "discover" && (
        <div className="mb-8 space-y-4">
          <form onSubmit={handleSearch} className="flex gap-2">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Tìm kiếm kỹ năng bạn muốn học hoặc dạy..."
              className="flex-1 h-11 px-4 rounded-xl bg-card border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none text-sm shadow-sm"
            />
            <button
              type="submit"
              className="px-6 h-11 bg-primary text-white text-sm font-medium rounded-xl hover:bg-primary/90 transition-colors shadow-sm"
            >
              Tìm kiếm
            </button>
            {query && (
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  fetchDiscoverPosts({
                    type: filterType,
                    field: filterField,
                    level: filterLevel,
                  });
                }}
                className="px-4 h-11 border border-border text-sm font-medium rounded-xl hover:bg-secondary transition-colors"
              >
                Xóa
              </button>
            )}
          </form>

          <div className="flex gap-2 flex-wrap">
            <div className="flex gap-1 p-1 bg-card border border-border rounded-xl shadow-sm">
              {[
                { v: "", l: "Tất cả" },
                { v: "learning", l: "🎓 Tìm người dạy" },
                { v: "teaching", l: "📚 Mở lớp dạy" },
              ].map((opt) => (
                <button
                  key={opt.v}
                  onClick={() => {
                    setFilterType(opt.v);
                    fetchDiscoverPosts({
                      skill: query,
                      type: opt.v,
                      field: filterField,
                      level: filterLevel,
                    });
                  }}
                  className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    filterType === opt.v
                      ? "bg-primary/10 text-primary"
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
                fetchDiscoverPosts({
                  skill: query,
                  type: filterType,
                  field: e.target.value,
                  level: filterLevel,
                });
              }}
              className="h-9 px-3 rounded-xl bg-card border border-border text-xs text-foreground outline-none focus:border-primary shadow-sm"
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
                fetchDiscoverPosts({
                  skill: query,
                  type: filterType,
                  field: filterField,
                  level: e.target.value,
                });
              }}
              className="h-9 px-3 rounded-xl bg-card border border-border text-xs text-foreground outline-none focus:border-primary shadow-sm"
            >
              <option value="">Tất cả cấp độ</option>
              {LEVELS.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Nút đăng bài mới nhanh cho Tab My Posts */}
      {activeTab === "my-posts" && (
        <div className="flex justify-end mb-4">
          <button
            onClick={() => navigate("/dashboard/post/create")}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 font-medium transition-colors text-sm"
          >
            <PlusCircle className="w-4 h-4" /> Đăng bài mới
          </button>
        </div>
      )}

      {/* DANH SÁCH BÀI ĐĂNG */}
      {loading ? (
        <div className="text-center py-20">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-muted-foreground font-medium">
            Đang tải dữ liệu...
          </p>
        </div>
      ) : displayedPosts.length === 0 ? (
        <div className="text-center py-20 border-2 border-dashed border-border rounded-2xl bg-secondary/20">
          <FolderKanban className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">
            Chưa có bài đăng nào
          </h3>
          <p className="text-muted-foreground text-sm mb-6 max-w-sm mx-auto">
            {activeTab === "discover"
              ? "Hiện tại chưa có ai đăng bài trong mục này. Hãy thử thay đổi bộ lọc tìm kiếm nhé."
              : "Bạn chưa tạo bài đăng nào. Hãy chia sẻ kỹ năng của bạn để kết nối với mọi người ngay thôi!"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {displayedPosts.map((post) => (
            <div
              key={post._id}
              onClick={() => navigate(`/dashboard/post/${post._id}`)}
              className={`relative bg-card border rounded-2xl p-5 hover:shadow-md transition-all cursor-pointer group flex flex-col h-full ${
                post.type === "learning"
                  ? "border-blue-100"
                  : "border-green-100"
              } ${post.status === "closed" ? "opacity-60 grayscale hover:grayscale-0" : ""}`}
            >
              {/* Header của thẻ */}
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                  {initials(post.author?.username)}
                </div>
                <div className="flex-1">
                  <h4
                    className="text-sm font-semibold hover:text-primary transition-colors line-clamp-1"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/dashboard/user/${post.author._id}`);
                    }}
                  >
                    {post.author?.username || "Ẩn danh"}
                  </h4>
                  <div className="flex items-center gap-2">
                    <p className="text-[11px] text-muted-foreground">
                      {new Date(post.createdAt).toLocaleDateString("vi-VN")}
                    </p>
                    {/* Badge trạng thái bài đăng */}
                    {activeTab === "my-posts" && (
                      <span
                        className={`text-[9px] px-1.5 py-0.5 rounded uppercase font-bold tracking-wide ${
                          post.status === "active"
                            ? "bg-green-100 text-green-600"
                            : "bg-gray-200 text-gray-500"
                        }`}
                      >
                        {post.status === "active" ? "Đang hiện" : "Đang ẩn"}
                      </span>
                    )}
                  </div>
                </div>

                {/* Nút 3 chấm thao tác nhanh (Chỉ có ở Bài của tôi) */}
                {activeTab === "my-posts" && (
                  <div
                    className="relative"
                    ref={openMenuId === post._id ? menuRef : null}
                  >
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenMenuId(
                          openMenuId === post._id ? null : post._id,
                        );
                      }}
                      className="p-1.5 rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
                    >
                      <MoreHorizontal className="w-5 h-5" />
                    </button>

                    {openMenuId === post._id && (
                      <div className="absolute right-0 top-full mt-1 w-40 bg-card border border-border shadow-xl rounded-xl py-1 z-20 animate-in fade-in zoom-in-95">
                        <button
                          onClick={(e) => handleToggleStatus(e, post)}
                          className="w-full flex items-center gap-2 px-4 py-2 text-sm text-foreground hover:bg-secondary transition-colors"
                        >
                          {post.status === "active" ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                          {post.status === "active"
                            ? "Ẩn bài đăng"
                            : "Mở lại bài"}
                        </button>
                        <button
                          onClick={(e) => handleDeletePost(e, post._id)}
                          className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-500 hover:bg-red-50 hover:text-red-600 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" /> Xóa bài
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <h3 className="text-base font-bold mb-2 group-hover:text-primary transition-colors line-clamp-1">
                {post.title}
              </h3>
              <p className="text-sm text-muted-foreground mb-4 line-clamp-2 flex-1">
                {post.description}
              </p>

              <div className="flex flex-wrap gap-2 mb-4">
                <span
                  className={`text-[11px] px-2.5 py-1 rounded-md font-semibold ${
                    post.type === "learning"
                      ? "bg-blue-50 text-blue-700"
                      : "bg-green-50 text-green-700"
                  }`}
                >
                  {post.type === "learning" ? "🎓 Tìm học" : "📚 Nhận dạy"}
                </span>
                <span className="text-[11px] px-2.5 py-1 rounded-md bg-secondary text-muted-foreground font-medium">
                  {post.skill?.field} • {post.skill?.level}
                </span>
              </div>

              {/* Nút gửi lời mời (Chỉ hiện ở Tab Khám phá) */}
              {activeTab === "discover" && (
                <div className="pt-4 border-t border-border/50 mt-auto">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedPost(post);
                    }}
                    className="w-full py-2.5 bg-primary/10 text-primary text-sm font-semibold rounded-xl hover:bg-primary hover:text-white transition-all flex items-center justify-center gap-2"
                  >
                    <Send className="w-4 h-4" /> Gửi lời mời kết nối
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal gửi lời mời */}
      {selectedPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/60 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-md shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">Gửi lời mời kết nối</h3>
              <button
                onClick={() => setSelectedPost(null)}
                className="p-1 rounded-full hover:bg-secondary"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Gửi một lời nhắn tới{" "}
              <strong>{selectedPost.author.username}</strong> về bài đăng{" "}
              <span className="font-medium text-foreground">
                "{selectedPost.title}"
              </span>
              .
            </p>
            <textarea
              value={matchMessage}
              onChange={(e) => setMatchMessage(e.target.value)}
              placeholder="VD: Chào bạn, mình rất muốn học kỹ năng này..."
              rows={4}
              className="w-full px-4 py-3 rounded-xl bg-secondary/50 border border-border focus:border-primary outline-none text-sm mb-4 resize-none"
              autoFocus
            />
            <div className="flex gap-3">
              <button
                onClick={handleSendMatch}
                disabled={sending}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-primary text-white text-sm font-medium rounded-xl hover:bg-primary/90 disabled:opacity-60 transition-all"
              >
                {sending ? "Đang gửi..." : "Xác nhận gửi"}
              </button>
              <button
                onClick={() => setSelectedPost(null)}
                className="px-6 py-2.5 border border-border text-sm font-medium rounded-xl hover:bg-secondary text-muted-foreground transition-colors"
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
