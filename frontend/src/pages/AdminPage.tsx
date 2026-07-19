import { useState, useEffect, useMemo } from "react";
import api from "../lib/api";
import { useAuth } from "../hooks/useAuth";
import {
  Users,
  FileText,
  BarChart2,
  ShieldOff,
  Shield,
  EyeOff,
  Eye,
  Search,
  AlertCircle,
} from "lucide-react";


interface User {
  _id: string;
  username: string;
  email: string;
  role: string;
  status: "active" | "blocked";
  createdAt: string;
  stats: { totalTaught: number; totalLearned: number; averageRating: number };
}

interface Post {
  _id: string;
  title: string;
  description?: string;
  author: { _id: string; username: string; email: string };
  status: string;
  isHidden: boolean;
  createdAt: string;
}

interface Stats {
  totalUsers: number;
  blockedUsers: number;
  totalPosts: number;
  hiddenPosts: number;
  totalSessions: number;
  completedSessions: number;
}

export default function AdminPage() {
  const { token } = useAuth();
  const headers = { Authorization: `Bearer ${token}` };

  const [tab, setTab] = useState<"stats" | "users" | "posts">("stats");
  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);

  // States mới cho tìm kiếm và xử lý
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    setSearchQuery(""); // Reset tìm kiếm khi đổi tab
    setSuccess("");
    setError("");

    if (tab === "stats") fetchStats();
    if (tab === "users") fetchUsers();
    if (tab === "posts") fetchPosts();
  }, [tab]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/admin/stats`, { headers });
      setStats(res.data.stats);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/admin/users`, { headers });
      setUsers(res.data.users);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/admin/posts`, { headers });
      setPosts(res.data.posts);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleBlockUser = async (user: User) => {
    const action = user.status === "active" ? "khóa" : "mở khóa";
    if (
      !window.confirm(
        `Bạn có chắc chắn muốn ${action} tài khoản ${user.username}?`,
      )
    )
      return;

    try {
      const res = await api.put(
        `/admin/users/${user._id}/block`,
        {},
        { headers },
      );
      setSuccess(res.data.message);
      fetchUsers();
      fetchStats();
    } catch (err: any) {
      setError(err.response?.data?.message ?? "Lỗi hệ thống");
    }
  };

  const handleHidePost = async (post: Post) => {
    const action = post.isHidden ? "hiển thị lại" : "ẩn";
    if (
      !window.confirm(
        `Bạn có chắc chắn muốn ${action} bài đăng "${post.title}"?`,
      )
    )
      return;

    try {
      const res = await api.put(
        `/admin/posts/${post._id}/hide`,
        {},
        { headers },
      );
      setSuccess(res.data.message);
      fetchPosts();
      fetchStats();
    } catch (err: any) {
      setError(err.response?.data?.message ?? "Lỗi hệ thống");
    }
  };

  // Lọc dữ liệu hiển thị dựa trên ô tìm kiếm
  const filteredUsers = useMemo(() => {
    return users.filter(
      (u) =>
        u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [users, searchQuery]);

  const filteredPosts = useMemo(() => {
    return posts.filter(
      (p) =>
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.author.username.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [posts, searchQuery]);

  const initials = (name: string) =>
    name ? name.slice(0, 2).toUpperCase() : "U";

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-primary/10 text-primary rounded-xl">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-foreground">Admin Panel</h2>
            <p className="text-sm text-muted-foreground">
              Quản trị toàn hệ thống Skill Swap
            </p>
          </div>
        </div>
      </div>

      {/* Controls: Tabs & Search */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div className="flex gap-1 p-1 bg-secondary rounded-xl w-fit">
          {(["stats", "users", "posts"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                tab === t
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t === "stats" ? (
                <>
                  <BarChart2 className="w-4 h-4" /> Thống kê
                </>
              ) : t === "users" ? (
                <>
                  <Users className="w-4 h-4" /> Người dùng
                </>
              ) : (
                <>
                  <FileText className="w-4 h-4" /> Bài đăng
                </>
              )}
            </button>
          ))}
        </div>

        {tab !== "stats" && (
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder={
                tab === "users"
                  ? "Tìm theo tên hoặc email..."
                  : "Tìm theo tiêu đề hoặc người đăng..."
              }
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-card border border-border rounded-xl text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
            />
          </div>
        )}
      </div>

      {/* Alerts */}
      {success && (
        <div className="mb-6 px-4 py-3 rounded-xl bg-green-500/10 border border-green-500/20 text-green-600 text-sm flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          {success}
        </div>
      )}
      {error && (
        <div className="mb-6 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-20">
          <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-muted-foreground font-medium">
            Đang đồng bộ dữ liệu...
          </p>
        </div>
      ) : (
        <div className="animate-in fade-in duration-300">
          {/* ── Tab: Thống kê ── */}
          {tab === "stats" && stats && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {[
                {
                  label: "Tổng người dùng",
                  value: stats.totalUsers,
                  color: "text-blue-500",
                  bg: "bg-blue-500/10",
                },
                {
                  label: "Tài khoản bị khóa",
                  value: stats.blockedUsers,
                  color: "text-red-500",
                  bg: "bg-red-500/10",
                },
                {
                  label: "Tổng bài đăng",
                  value: stats.totalPosts,
                  color: "text-green-500",
                  bg: "bg-green-500/10",
                },
                {
                  label: "Bài đăng bị ẩn",
                  value: stats.hiddenPosts,
                  color: "text-amber-500",
                  bg: "bg-amber-500/10",
                },
                {
                  label: "Tổng buổi học (Sessions)",
                  value: stats.totalSessions,
                  color: "text-purple-500",
                  bg: "bg-purple-500/10",
                },
                {
                  label: "Buổi học hoàn thành",
                  value: stats.completedSessions,
                  color: "text-primary",
                  bg: "bg-primary/10",
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className="bg-card border border-border/50 rounded-2xl p-6 hover:shadow-md transition-shadow"
                >
                  <p className="text-sm font-medium text-muted-foreground mb-3">
                    {item.label}
                  </p>
                  <p className={`text-4xl font-bold ${item.color}`}>
                    {item.value.toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* ── Tab: Người dùng ── */}
          {tab === "users" && (
            <div className="flex flex-col gap-3">
              {filteredUsers.length === 0 ? (
                <div className="text-center py-20 border-2 border-dashed border-border rounded-2xl text-sm text-muted-foreground bg-secondary/30">
                  Không tìm thấy người dùng nào phù hợp.
                </div>
              ) : (
                filteredUsers.map((u) => (
                  <div
                    key={u._id}
                    className="bg-card border border-border/80 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center gap-4 hover:border-border transition-colors"
                  >
                    <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center text-sm font-bold text-foreground shrink-0">
                      {initials(u.username)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <span className="text-base font-semibold truncate">
                          {u.username}
                        </span>
                        <span
                          className={`text-[10px] px-2.5 py-0.5 rounded-full uppercase font-bold tracking-wider ${
                            u.status === "active"
                              ? "bg-green-500/10 text-green-600"
                              : "bg-red-500/10 text-red-500"
                          }`}
                        >
                          {u.status === "active" ? "Hoạt động" : "Bị khóa"}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {u.email}
                      </p>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs font-medium text-muted-foreground bg-secondary/50 p-2 rounded-lg w-fit">
                        <span>
                          Dạy:{" "}
                          <strong className="text-foreground">
                            {u.stats?.totalTaught ?? 0}
                          </strong>
                        </span>
                        <span>
                          Học:{" "}
                          <strong className="text-foreground">
                            {u.stats?.totalLearned ?? 0}
                          </strong>
                        </span>
                        <span>
                          Đánh giá:{" "}
                          <strong className="text-yellow-500">
                            {u.stats?.averageRating ?? "Chưa có"}
                          </strong>
                        </span>
                      </div>
                    </div>
                    <div className="flex sm:flex-col items-center sm:items-end justify-between gap-3 shrink-0 mt-2 sm:mt-0 pt-3 sm:pt-0 border-t sm:border-0 border-border">
                      <span className="text-xs text-muted-foreground font-medium">
                        Tham gia:{" "}
                        {new Date(u.createdAt).toLocaleDateString("vi-VN")}
                      </span>
                      <button
                        onClick={() => handleBlockUser(u)}
                        className={`flex items-center justify-center w-full sm:w-auto gap-2 px-4 py-2 text-sm font-semibold rounded-xl transition-all ${
                          u.status === "active"
                            ? "bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white"
                            : "bg-green-500/10 text-green-600 hover:bg-green-500 hover:text-white"
                        }`}
                      >
                        {u.status === "active" ? (
                          <>
                            <ShieldOff className="w-4 h-4" /> Khóa tài khoản
                          </>
                        ) : (
                          <>
                            <Shield className="w-4 h-4" /> Mở khóa
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* ── Tab: Bài đăng ── */}
          {tab === "posts" && (
            <div className="flex flex-col gap-3">
              {filteredPosts.length === 0 ? (
                <div className="text-center py-20 border-2 border-dashed border-border rounded-2xl text-sm text-muted-foreground bg-secondary/30">
                  Không tìm thấy bài đăng nào phù hợp.
                </div>
              ) : (
                filteredPosts.map((post) => (
                  <div
                    key={post._id}
                    className={`bg-card border rounded-2xl p-5 flex flex-col sm:flex-row sm:items-start gap-4 transition-all ${post.isHidden ? "opacity-60 grayscale hover:grayscale-0 border-border" : "border-border/80 hover:border-border"}`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-base font-bold truncate text-foreground">
                          {post.title}
                        </span>
                        {post.isHidden && (
                          <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-gray-500/10 text-gray-500 uppercase font-bold tracking-wider shrink-0">
                            Đang ẩn
                          </span>
                        )}
                      </div>
                      {post.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                          {post.description}
                        </p>
                      )}
                      <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                        <div className="w-5 h-5 rounded-full bg-secondary flex items-center justify-center text-[8px] text-foreground">
                          {initials(post.author?.username)}
                        </div>
                        <span className="text-foreground">
                          {post.author?.username}
                        </span>
                        <span>•</span>
                        <span>
                          {new Date(post.createdAt).toLocaleDateString("vi-VN")}
                        </span>
                      </div>
                    </div>
                    <div className="shrink-0 mt-3 sm:mt-0">
                      <button
                        onClick={() => handleHidePost(post)}
                        className="flex items-center justify-center w-full sm:w-auto gap-2 px-4 py-2 text-sm font-semibold bg-secondary hover:bg-muted text-foreground rounded-xl transition-colors"
                      >
                        {post.isHidden ? (
                          <>
                            <Eye className="w-4 h-4" /> Hiển thị lại
                          </>
                        ) : (
                          <>
                            <EyeOff className="w-4 h-4" /> Ẩn bài viết
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
