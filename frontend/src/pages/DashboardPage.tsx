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
  status?: string;
}

export default function DashboardPage() {
  const { user, token } = useAuth();
  const navigate = useNavigate();

  const [discoverPosts, setDiscoverPosts] = useState<Post[]>([]);
  const [myPosts, setMyPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] = useState<"discover" | "my-posts">(
    "discover",
  );
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const [query, setQuery] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterField, setFilterField] = useState("");
  const [filterLevel, setFilterLevel] = useState("");

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
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    fetchLiveStats();
  }, [user?.id]);

  useEffect(() => {
    if (activeTab === "discover") {
      fetchDiscoverPosts();
    } else {
      fetchMyPosts();
    }
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

  const fetchDiscoverPosts = async (params = {}) => {
    try {
      setLoading(true);
      const res = await axios.get(`${API}/post`, { params });

      setDiscoverPosts(res.data.posts);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

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
      fetchMyPosts();
    } catch (error) {
      alert("Lỗi hệ thống");
    }
  };

  const initials = (name: string) =>
    name ? name.slice(0, 2).toUpperCase() : "U";

  const displayedPosts = activeTab === "discover" ? discoverPosts : myPosts;

  return (
    <div className="p-6 max-w-5xl mx-auto animate-in fade-in duration-500">
      {/* Header & Metric cards */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2 tracking-tight">
          Xin chào, {user?.username}
        </h1>
        <p className="text-muted-foreground text-sm mb-6">
          Hôm nay bạn muốn trao đổi và học hỏi thêm kỹ năng gì?
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div className="bg-card border border-border/50 rounded-2xl p-5 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 ease-out">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2.5 bg-blue-500/10 text-blue-500 rounded-xl">
                <BookOpen className="w-5 h-5" />
              </div>
              <span className="text-sm font-medium text-muted-foreground">
                Buổi dạy
              </span>
            </div>
            <p className="text-3xl font-bold">{liveData.taught}</p>
          </div>
          <div className="bg-card border border-border/50 rounded-2xl p-5 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 ease-out">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2.5 bg-yellow-500/10 text-yellow-500 rounded-xl">
                <Star className="w-5 h-5" />
              </div>
              <span className="text-sm font-medium text-muted-foreground">
                Đánh giá TB
              </span>
            </div>
            <p className="text-3xl font-bold">{liveData.rating || "—"}</p>
          </div>
          <div className="bg-card border border-border/50 rounded-2xl p-5 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 ease-out">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2.5 bg-green-500/10 text-green-500 rounded-xl">
                <Users className="w-5 h-5" />
              </div>
              <span className="text-sm font-medium text-muted-foreground">
                Kết nối
              </span>
            </div>
            <p className="text-3xl font-bold">{liveData.friends}</p>
          </div>
        </div>
      </div>

      {/* TABS NAVIGATION (Hiệu ứng trượt mượt mà) */}
      <div className="flex border-b border-border/50 mb-6 relative">
        <button
          onClick={() => setActiveTab("discover")}
          className={`flex items-center gap-2 px-6 py-3.5 font-medium text-sm transition-all duration-300 relative ${
            activeTab === "discover"
              ? "text-[#ff4a40]"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Compass className="w-4 h-4" /> Khám phá
          {activeTab === "discover" && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#ff4a40] rounded-t-full animate-in slide-in-from-left-2 duration-300" />
          )}
        </button>
        <button
          onClick={() => setActiveTab("my-posts")}
          className={`flex items-center gap-2 px-6 py-3.5 font-medium text-sm transition-all duration-300 relative ${
            activeTab === "my-posts"
              ? "text-[#ff4a40]"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <FolderKanban className="w-4 h-4" /> Bài của tôi
          {activeTab === "my-posts" && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#ff4a40] rounded-t-full animate-in slide-in-from-right-2 duration-300" />
          )}
        </button>
      </div>

      {/* VÙNG NỘI DUNG CHÍNH (Có hiệu ứng mờ dần khi chuyển Tab) */}
      <div
        key={activeTab}
        className="animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out"
      >
        {/* Thanh công cụ tìm kiếm */}
        {activeTab === "discover" && (
          <div className="mb-8 space-y-4">
            <form onSubmit={handleSearch} className="flex gap-2">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Tìm kiếm kỹ năng bạn muốn học hoặc dạy..."
                className="flex-1 h-12 px-5 rounded-xl bg-card border border-border/50 focus:border-[#ff4a40] focus:ring-1 focus:ring-[#ff4a40] outline-none text-sm shadow-sm transition-all duration-300"
              />
              <button
                type="submit"
                className="px-7 h-12 bg-[#ff4a40] text-white text-sm font-medium rounded-xl hover:bg-[#e03e35] active:scale-95 transition-all duration-200 shadow-sm shadow-[#ff4a40]/20"
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
                  className="px-5 h-12 border border-border/50 text-sm font-medium rounded-xl hover:bg-secondary active:scale-95 transition-all duration-200"
                >
                  Xóa
                </button>
              )}
            </form>

            <div className="flex gap-2 flex-wrap">
              <div className="flex gap-1 p-1 bg-card border border-border/50 rounded-xl shadow-sm">
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
                    className={`px-4 py-2 rounded-lg text-xs font-medium transition-all duration-300 active:scale-95 ${
                      filterType === opt.v
                        ? "bg-[#ff4a40]/10 text-[#ff4a40]"
                        : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
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
                className="h-10 px-3 rounded-xl bg-card border border-border/50 text-xs text-foreground outline-none focus:border-[#ff4a40] shadow-sm transition-colors cursor-pointer"
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
                className="h-10 px-3 rounded-xl bg-card border border-border/50 text-xs text-foreground outline-none focus:border-[#ff4a40] shadow-sm transition-colors cursor-pointer"
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
          <div className="flex justify-end mb-6">
            <button
              onClick={() => navigate("post/create")}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#ff4a40] text-white rounded-xl hover:bg-[#e03e35] active:scale-95 shadow-sm shadow-[#ff4a40]/20 font-medium transition-all duration-200 text-sm"
            >
              <PlusCircle className="w-4 h-4" /> Đăng bài mới
            </button>
          </div>
        )}

        {/* DANH SÁCH BÀI ĐĂNG */}
        {loading ? (
          <div className="text-center py-24">
            <div className="w-8 h-8 border-4 border-[#ff4a40]/30 border-t-[#ff4a40] rounded-full animate-spin mx-auto mb-4" />
            <p className="text-sm text-muted-foreground font-medium animate-pulse">
              Đang tải dữ liệu...
            </p>
          </div>
        ) : displayedPosts.length === 0 ? (
          <div className="text-center py-24 border-2 border-dashed border-border/50 rounded-3xl bg-secondary/10">
            <div className="w-16 h-16 bg-secondary/50 rounded-full flex items-center justify-center mx-auto mb-4 animate-in zoom-in-50 duration-500">
              <FolderKanban className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Chưa có bài đăng nào
            </h3>
            <p className="text-muted-foreground text-sm mb-6 max-w-sm mx-auto leading-relaxed">
              {activeTab === "discover"
                ? "Hiện tại chưa có ai đăng bài trong mục này. Hãy thử thay đổi bộ lọc tìm kiếm nhé."
                : "Bạn chưa tạo bài đăng nào. Hãy chia sẻ kỹ năng của bạn để kết nối với mọi người ngay thôi!"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {displayedPosts.map((post, index) => (
              <div
                key={post._id}
                onClick={() => navigate(`/dashboard/post/${post._id}`)}
                // Hiệu ứng delay nhẹ cho từng thẻ bài khi xuất hiện
                style={{ animationDelay: `${index * 50}ms` }}
                className={`relative bg-card border border-border/50 rounded-2xl p-6 transition-all duration-300 ease-out hover:-translate-y-1.5 hover:shadow-xl cursor-pointer group flex flex-col h-full animate-in fade-in zoom-in-95 fill-mode-both ${
                  post.status === "closed"
                    ? "opacity-50 hover:opacity-100 grayscale hover:grayscale-0"
                    : "hover:border-[#ff4a40]/30"
                }`}
              >
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-sm font-bold text-foreground">
                    {initials(post.author?.username)}
                  </div>
                  <div className="flex-1">
                    <h4
                      className="text-sm font-bold hover:text-[#ff4a40] transition-colors line-clamp-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/dashboard/user/${post.author._id}`);
                      }}
                    >
                      {post.author?.username || "Ẩn danh"}
                    </h4>
                    <div className="flex items-center gap-2 mt-0.5">
                      <p className="text-[11px] text-muted-foreground font-medium">
                        {new Date(post.createdAt).toLocaleDateString("vi-VN")}
                      </p>
                      {activeTab === "my-posts" && (
                        <span
                          className={`text-[9px] px-1.5 py-0.5 rounded uppercase font-bold tracking-wide ${
                            post.status === "active"
                              ? "bg-green-500/10 text-green-500"
                              : "bg-gray-500/10 text-gray-500"
                          }`}
                        >
                          {post.status === "active" ? "Đang hiện" : "Đang ẩn"}
                        </span>
                      )}
                    </div>
                  </div>

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
                        className="p-2 rounded-xl text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors active:scale-90"
                      >
                        <MoreHorizontal className="w-5 h-5" />
                      </button>

                      {openMenuId === post._id && (
                        <div className="absolute right-0 top-full mt-2 w-44 bg-card border border-border/50 shadow-2xl rounded-xl py-1.5 z-20 animate-in fade-in zoom-in-95 origin-top-right duration-200">
                          <button
                            onClick={(e) => handleToggleStatus(e, post)}
                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-foreground hover:bg-secondary transition-colors"
                          >
                            {post.status === "active" ? (
                              <EyeOff className="w-4 h-4 text-muted-foreground" />
                            ) : (
                              <Eye className="w-4 h-4 text-muted-foreground" />
                            )}
                            {post.status === "active"
                              ? "Ẩn bài đăng"
                              : "Mở lại bài"}
                          </button>
                          <div className="h-px bg-border/50 my-1 mx-2"></div>
                          <button
                            onClick={(e) => handleDeletePost(e, post._id)}
                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-red-500 hover:bg-red-500/10 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" /> Xóa bài
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <h3 className="text-lg font-bold mb-2 group-hover:text-[#ff4a40] transition-colors line-clamp-1 leading-tight">
                  {post.title}
                </h3>
                <p className="text-sm text-muted-foreground mb-5 line-clamp-2 flex-1 leading-relaxed">
                  {post.description}
                </p>

                <div className="flex flex-wrap gap-2 mb-4">
                  <span
                    className={`text-[11px] px-3 py-1.5 rounded-lg font-bold ${
                      post.type === "learning"
                        ? "bg-blue-500/10 text-blue-500"
                        : "bg-green-500/10 text-green-500"
                    }`}
                  >
                    {post.type === "learning" ? "🎓 Tìm học" : "📚 Nhận dạy"}
                  </span>
                  <span className="text-[11px] px-3 py-1.5 rounded-lg bg-secondary text-muted-foreground font-semibold">
                    {post.skill?.field} • {post.skill?.level}
                  </span>
                </div>

                {activeTab === "discover" &&
                  post.author._id !== user?.id &&
                  post.author._id !== (user as any)?._id && (
                    <div className="pt-5 border-t border-border/50 mt-auto">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedPost(post);
                        }}
                        className="w-full py-3 bg-secondary hover:bg-[#ff4a40] text-foreground hover:text-white text-sm font-semibold rounded-xl transition-all duration-300 flex items-center justify-center gap-2 active:scale-95"
                      >
                        <Send className="w-4 h-4" /> Gửi lời mời kết nối
                      </button>
                    </div>
                  )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal gửi lời mời (Hiệu ứng Zoom mượt mà) */}
      {selectedPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-card border border-border/50 rounded-3xl p-7 w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-300 ease-out">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-xl font-bold">Gửi lời mời kết nối</h3>
              <button
                onClick={() => setSelectedPost(null)}
                className="p-2 rounded-full hover:bg-secondary transition-colors active:scale-90"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>
            <p className="text-sm text-muted-foreground mb-5 leading-relaxed">
              Gửi một lời nhắn tới{" "}
              <strong>{selectedPost.author.username}</strong> về bài đăng{" "}
              <span className="font-semibold text-foreground">
                "{selectedPost.title}"
              </span>
              .
            </p>
            <textarea
              value={matchMessage}
              onChange={(e) => setMatchMessage(e.target.value)}
              placeholder="VD: Chào bạn, mình rất muốn học kỹ năng này..."
              rows={4}
              className="w-full px-5 py-4 rounded-2xl bg-secondary/50 border border-border/50 focus:border-[#ff4a40] focus:ring-1 focus:ring-[#ff4a40] outline-none text-sm mb-6 resize-none transition-all duration-300"
              autoFocus
            />
            <div className="flex gap-3">
              <button
                onClick={handleSendMatch}
                disabled={sending}
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-[#ff4a40] text-white text-sm font-semibold rounded-xl hover:bg-[#e03e35] disabled:opacity-60 transition-all active:scale-95 shadow-md shadow-[#ff4a40]/20"
              >
                {sending ? "Đang gửi..." : "Xác nhận gửi"}
              </button>
              <button
                onClick={() => setSelectedPost(null)}
                className="px-7 py-3 border border-border/50 text-sm font-semibold rounded-xl hover:bg-secondary text-foreground transition-all active:scale-95"
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
