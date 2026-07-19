import { useState, useEffect } from "react";
import api from "../lib/api";
import { useAuth } from "../hooks/useAuth";
import {
  Save,
  Plus,
  X,
  Star,
  BookOpen,
  Users,
  Mail,
  Award,
  Edit3,
  User as UserIcon,
  CheckCircle,
  Shield,
} from "lucide-react";


export default function ProfilePage() {
  const { token, user } = useAuth();
  const headers = { Authorization: `Bearer ${token}` };

  // ĐÃ SỬA: Thêm tab "overview" và đặt làm mặc định
  const [tab, setTab] = useState<
    "overview" | "info" | "skills" | "certs" | "stats"
  >("overview");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  // Info
  const [username, setUsername] = useState(user?.username ?? "");
  const [avatar, setAvatar] = useState(user?.avatar ?? "");

  // Skills
  const [skillsOffered, setSkillsOffered] = useState<string[]>(
    user?.skillsOffered ?? [],
  );
  const [skillsWanted, setSkillsWanted] = useState<string[]>(
    user?.skillsWanted ?? [],
  );
  const [newOffered, setNewOffered] = useState("");
  const [newWanted, setNewWanted] = useState("");

  // Certificates
  const [certificates, setCertificates] = useState<any[]>(
    user?.certificates ?? [],
  );
  const [showCertForm, setShowCertForm] = useState(false);
  const [newCert, setNewCert] = useState({
    name: "",
    issuer: "",
    issueDate: "",
    expiryDate: "",
    credentialUrl: "",
  });

  // Stats
  const [liveStats, setLiveStats] = useState<any>(user?.stats || {});

  useEffect(() => {
    const fetchLatestStats = async () => {
      const userId = user?.id || user?._id;
      if (!userId) return;
      try {
        const res = await api.get(`/profile/${userId}`);
        const freshUser = res.data?.user;
        if (freshUser) {
          // Đồng bộ TOÀN BỘ dữ liệu mới nhất từ DB, không chỉ riêng stats
          setLiveStats(freshUser.stats || {});
          setSkillsOffered(freshUser.skillsOffered || []);
          setSkillsWanted(freshUser.skillsWanted || []);
          setCertificates(freshUser.certificates || []);
          setUsername(freshUser.username || "");
          setAvatar(freshUser.avatar || "");

          // Ghi lại đầy đủ vào localStorage để các trang khác cùng nhận đúng dữ liệu
          const updatedUser = {
            ...user,
            username: freshUser.username,
            avatar: freshUser.avatar,
            skillsOffered: freshUser.skillsOffered,
            skillsWanted: freshUser.skillsWanted,
            certificates: freshUser.certificates,
            stats: freshUser.stats,
          };
          localStorage.setItem("user", JSON.stringify(updatedUser));
        }
      } catch (err) {
        console.error("Lỗi cập nhật thành tích:", err);
      }
    };
    fetchLatestStats();
  }, [user?.id, user?._id]);

  const initials = (name: string) =>
    name ? name.slice(0, 2).toUpperCase() : "U";

  // ── Handlers ──────────────────────────────────────────

  const handleSaveInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    try {
      setLoading(true);
      await api.put(`/user/profile`, { username, avatar }, { headers });
      localStorage.setItem(
        "user",
        JSON.stringify({ ...user, username, avatar, stats: liveStats }),
      );
      setSuccess("Cập nhật thông tin thành công!");
    } catch (err: any) {
      setError(err.response?.data?.message ?? "Lỗi hệ thống");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSkills = async () => {
    setError("");
    setSuccess("");
    try {
      setLoading(true);
      await api.put(
        `/user/profile`,
        { skillsOffered, skillsWanted },
        { headers },
      );
      localStorage.setItem(
        "user",
        JSON.stringify({
          ...user,
          skillsOffered,
          skillsWanted,
          stats: liveStats,
        }),
      );
      setSuccess("Đã cập nhật kỹ năng thành công!");
    } catch (err: any) {
      setError(err.response?.data?.message ?? "Lỗi hệ thống");
    } finally {
      setLoading(false);
    }
  };

  const addSkill = (type: "offered" | "wanted") => {
    if (type === "offered" && newOffered.trim()) {
      setSkillsOffered((prev) => [...prev, newOffered.trim()]);
      setNewOffered("");
    }
    if (type === "wanted" && newWanted.trim()) {
      setSkillsWanted((prev) => [...prev, newWanted.trim()]);
      setNewWanted("");
    }
  };

  const removeSkill = (type: "offered" | "wanted", skill: string) => {
    if (type === "offered")
      setSkillsOffered((prev) => prev.filter((s) => s !== skill));
    if (type === "wanted")
      setSkillsWanted((prev) => prev.filter((s) => s !== skill));
  };

  const handleAddCert = async () => {
    if (!newCert.name.trim()) return;
    setError("");
    setSuccess("");
    try {
      setLoading(true);
      const res = await api.post(`/user/certificate`, newCert, {
        headers,
      });
      setCertificates(res.data.certificates);
      setNewCert({
        name: "",
        issuer: "",
        issueDate: "",
        expiryDate: "",
        credentialUrl: "",
      });
      setShowCertForm(false);
      setSuccess("Đã thêm bằng cấp!");
    } catch (err: any) {
      setError(err.response?.data?.message ?? "Lỗi hệ thống");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCert = async (certId: string) => {
    setError("");
    setSuccess("");
    try {
      const res = await api.delete(`/user/certificate/${certId}`, {
        headers,
      });
      setCertificates(res.data.certificates);
      setSuccess("Đã xóa bằng cấp!");
    } catch (err: any) {
      setError(err.response?.data?.message ?? "Lỗi hệ thống");
    }
  };

  const switchTab = (t: typeof tab) => {
    setTab(t);
    setSuccess("");
    setError("");
  };

  // ── Render ────────────────────────────────────────────

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      {/* ── HEADER MỚI (Có Banner & Avatar nổi) ── */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden mb-6 shadow-sm">
        {/* Banner Gradient */}
        <div className="h-32 md:h-40 bg-gradient-to-r from-blue-600 to-indigo-500 relative"></div>

        {/* Thông tin Avatar & Tên */}
        <div className="px-6 pb-6 relative">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 -mt-12 md:-mt-16">
            <div className="flex flex-col md:flex-row items-center md:items-end gap-4">
              <div className="w-24 h-24 md:w-32 md:h-32 rounded-full border-4 border-card bg-blue-100 flex items-center justify-center text-3xl font-bold text-blue-700 overflow-hidden shadow-md">
                {user?.avatar ? (
                  <img
                    src={user.avatar}
                    alt="avatar"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  initials(user?.username ?? "U")
                )}
              </div>
              <div className="text-center md:text-left pb-2">
                <h2 className="text-2xl font-bold text-foreground">
                  {user?.username}
                </h2>
                <p className="text-sm text-muted-foreground flex items-center justify-center md:justify-start gap-1.5 mt-1">
                  <Mail className="w-4 h-4" /> {user?.email}
                </p>
              </div>
            </div>

            <div className="flex justify-center pb-2">
              <button
                onClick={() => switchTab("info")}
                className="flex items-center gap-1.5 px-4 py-2 bg-secondary text-foreground text-sm font-medium rounded-xl hover:bg-secondary/80 transition-colors border border-border"
              >
                <Edit3 className="w-4 h-4" /> Chỉnh sửa hồ sơ
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── THANH TABS ── */}
      <div className="flex gap-1 p-1.5 bg-secondary rounded-xl mb-6 overflow-x-auto whitespace-nowrap">
        {(
          [
            {
              id: "overview",
              label: "Tổng quan",
              icon: <UserIcon className="w-4 h-4" />,
            },
            {
              id: "info",
              label: "Thông tin cá nhân",
              icon: <Edit3 className="w-4 h-4" />,
            },
            {
              id: "skills",
              label: "Kỹ năng",
              icon: <Shield className="w-4 h-4" />,
            },
            {
              id: "certs",
              label: "Bằng cấp",
              icon: <Award className="w-4 h-4" />,
            },
            {
              id: "stats",
              label: "Thành tích",
              icon: <Star className="w-4 h-4" />,
            },
          ] as const
        ).map((t) => (
          <button
            key={t.id}
            onClick={() => switchTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
              tab === t.id
                ? "bg-background text-foreground shadow-sm ring-1 ring-border"
                : "text-muted-foreground hover:text-foreground hover:bg-background/50"
            }`}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Alerts */}
      {success && (
        <div className="mb-6 px-4 py-3 rounded-xl bg-green-500/10 border border-green-500/30 text-green-600 text-sm flex items-center gap-2">
          <CheckCircle className="w-4 h-4" /> {success}
        </div>
      )}
      {error && (
        <div className="mb-6 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-500 text-sm">
          {error}
        </div>
      )}

      {/* ── MÀN HÌNH MỚI: TỔNG QUAN HỒ SƠ ── */}
      {tab === "overview" && (
        <div className="space-y-6">
          {/* Dashboard Mini */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-card border border-border rounded-2xl p-4 text-center">
              <div className="w-10 h-10 mx-auto rounded-full bg-blue-500/10 flex items-center justify-center mb-2">
                <BookOpen className="w-5 h-5 text-blue-500" />
              </div>
              <p className="text-2xl font-bold">
                {liveStats?.totalLearned ?? 0}
              </p>
              <p className="text-xs text-muted-foreground">Buổi đã học</p>
            </div>
            <div className="bg-card border border-border rounded-2xl p-4 text-center">
              <div className="w-10 h-10 mx-auto rounded-full bg-primary/10 flex items-center justify-center mb-2">
                <BookOpen className="w-5 h-5 text-primary" />
              </div>
              <p className="text-2xl font-bold">
                {liveStats?.totalTaught ?? 0}
              </p>
              <p className="text-xs text-muted-foreground">Buổi đã dạy</p>
            </div>
            <div className="bg-card border border-border rounded-2xl p-4 text-center">
              <div className="w-10 h-10 mx-auto rounded-full bg-yellow-500/10 flex items-center justify-center mb-2">
                <Star className="w-5 h-5 text-yellow-500" />
              </div>
              <p className="text-2xl font-bold">
                {liveStats?.averageRating ?? "—"}
              </p>
              <p className="text-xs text-muted-foreground">Đánh giá TB</p>
            </div>
            <div className="bg-card border border-border rounded-2xl p-4 text-center">
              <div className="w-10 h-10 mx-auto rounded-full bg-green-500/10 flex items-center justify-center mb-2">
                <Users className="w-5 h-5 text-green-500" />
              </div>
              <p className="text-2xl font-bold">{user?.friends?.length || 0}</p>
              <p className="text-xs text-muted-foreground">Bạn bè kết nối</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Box Kỹ năng */}
            <div className="bg-card border border-border rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <Shield className="w-4 h-4 text-primary" /> Kỹ năng
                </h3>
                <button
                  onClick={() => switchTab("skills")}
                  className="text-xs text-primary hover:underline"
                >
                  Chỉnh sửa
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-xs text-muted-foreground mb-2">
                    Có thể dạy ({skillsOffered.length})
                  </p>
                  {skillsOffered.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {skillsOffered.map((s) => (
                        <span
                          key={s}
                          className="px-2.5 py-1 bg-green-50 text-green-700 border border-green-100 rounded-full text-xs font-medium"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground italic">
                      Chưa cập nhật
                    </p>
                  )}
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-2">
                    Muốn học ({skillsWanted.length})
                  </p>
                  {skillsWanted.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {skillsWanted.map((s) => (
                        <span
                          key={s}
                          className="px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-100 rounded-full text-xs font-medium"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground italic">
                      Chưa cập nhật
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Box Bằng cấp */}
            <div className="bg-card border border-border rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <Award className="w-4 h-4 text-primary" /> Bằng cấp & Chứng
                  chỉ
                </h3>
                <button
                  onClick={() => switchTab("certs")}
                  className="text-xs text-primary hover:underline"
                >
                  Thêm mới
                </button>
              </div>

              {certificates.length > 0 ? (
                <div className="space-y-3">
                  {certificates.map((cert: any) => (
                    <div
                      key={cert._id}
                      className="flex gap-3 items-start p-3 bg-secondary/50 rounded-xl border border-border"
                    >
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <Award className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium leading-tight">
                          {cert.name}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {cert.issuer}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 border border-dashed border-border rounded-xl">
                  <Award className="w-8 h-8 text-muted-foreground/50 mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground mb-3">
                    Bạn chưa thêm bằng cấp nào
                  </p>
                  <button
                    onClick={() => switchTab("certs")}
                    className="text-xs px-3 py-1.5 bg-secondary hover:bg-secondary/80 rounded-lg transition-colors font-medium"
                  >
                    Thêm ngay
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Tab: Thông tin (Chỉnh sửa) ── */}
      {tab === "info" && (
        <div className="bg-card border border-border rounded-2xl p-6">
          <h3 className="text-base font-semibold mb-6">
            Chỉnh sửa Thông tin Cá nhân
          </h3>
          <form onSubmit={handleSaveInfo} className="space-y-4 max-w-md">
            <div>
              <label className="text-xs font-medium text-foreground mb-1.5 block">
                Tên hiển thị
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full h-11 px-4 rounded-xl bg-secondary border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none text-sm text-foreground"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-foreground mb-1.5 block">
                Link Avatar (URL)
              </label>
              <input
                type="text"
                value={avatar}
                placeholder="https://..."
                onChange={(e) => setAvatar(e.target.value)}
                className="w-full h-11 px-4 rounded-xl bg-secondary border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none text-sm text-foreground placeholder:text-muted-foreground"
              />
              {avatar && (
                <div className="mt-3 p-3 bg-secondary rounded-xl border border-border flex gap-4 items-center">
                  <p className="text-xs text-muted-foreground">
                    Bản xem trước:
                  </p>
                  <img
                    src={avatar}
                    alt="Preview"
                    className="w-10 h-10 rounded-full object-cover border border-border"
                  />
                </div>
              )}
            </div>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center justify-center gap-2 w-full md:w-auto px-6 py-2.5 bg-primary text-white text-sm font-medium rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-60 mt-2"
            >
              <Save className="w-4 h-4" />
              {loading ? "Đang lưu..." : "Lưu thay đổi"}
            </button>
          </form>
        </div>
      )}

      {/* ── Tab: Kỹ năng ── */}
      {tab === "skills" && (
        <div className="bg-card border border-border rounded-2xl p-6 space-y-8">
          <div>
            <h3 className="text-base font-semibold text-green-600 mb-4 flex items-center gap-2">
              <Shield className="w-4 h-4" /> Kỹ năng có thể dạy
            </h3>
            <div className="flex flex-wrap gap-2 mb-4">
              {skillsOffered.map((s) => (
                <span
                  key={s}
                  className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-full bg-green-50 text-green-700 border border-green-200"
                >
                  {s}
                  <button
                    onClick={() => removeSkill("offered", s)}
                    className="hover:bg-green-200 rounded-full p-0.5 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2 max-w-md">
              <input
                type="text"
                value={newOffered}
                placeholder="Nhập kỹ năng (VD: ReactJS, Tiếng Anh)..."
                onChange={(e) => setNewOffered(e.target.value)}
                onKeyDown={(e) =>
                  e.key === "Enter" && (e.preventDefault(), addSkill("offered"))
                }
                className="flex-1 h-11 px-4 rounded-xl bg-secondary border border-border focus:border-green-500 outline-none text-sm text-foreground placeholder:text-muted-foreground"
              />
              <button
                onClick={() => addSkill("offered")}
                className="w-11 h-11 rounded-xl bg-green-600 text-white flex items-center justify-center hover:bg-green-700 transition-colors shrink-0"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="h-px w-full bg-border"></div>

          <div>
            <h3 className="text-base font-semibold text-blue-600 mb-4 flex items-center gap-2">
              <BookOpen className="w-4 h-4" /> Kỹ năng muốn học
            </h3>
            <div className="flex flex-wrap gap-2 mb-4">
              {skillsWanted.map((s) => (
                <span
                  key={s}
                  className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200"
                >
                  {s}
                  <button
                    onClick={() => removeSkill("wanted", s)}
                    className="hover:bg-blue-200 rounded-full p-0.5 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2 max-w-md">
              <input
                type="text"
                value={newWanted}
                placeholder="Nhập kỹ năng bạn muốn học..."
                onChange={(e) => setNewWanted(e.target.value)}
                onKeyDown={(e) =>
                  e.key === "Enter" && (e.preventDefault(), addSkill("wanted"))
                }
                className="flex-1 h-11 px-4 rounded-xl bg-secondary border border-border focus:border-blue-500 outline-none text-sm text-foreground placeholder:text-muted-foreground"
              />
              <button
                onClick={() => addSkill("wanted")}
                className="w-11 h-11 rounded-xl bg-blue-600 text-white flex items-center justify-center hover:bg-blue-700 transition-colors shrink-0"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
          </div>

          <button
            onClick={handleSaveSkills}
            disabled={loading}
            className="flex items-center justify-center gap-2 w-full md:w-auto px-6 py-2.5 bg-primary text-white text-sm font-medium rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-60"
          >
            <Save className="w-4 h-4" />
            {loading ? "Đang lưu..." : "Lưu tất cả kỹ năng"}
          </button>
        </div>
      )}

      {/* ── Tab: Bằng cấp ── */}
      {tab === "certs" && (
        <div className="bg-card border border-border rounded-2xl p-6">
          <h3 className="text-base font-semibold mb-6 flex items-center gap-2">
            <Award className="w-5 h-5 text-primary" /> Quản lý Bằng cấp & Chứng
            chỉ
          </h3>

          <div className="space-y-4 mb-6">
            {certificates.length === 0 && !showCertForm && (
              <div className="text-center py-12 border-2 border-dashed border-border rounded-2xl">
                <Award className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm font-medium text-foreground mb-1">
                  Chưa có chứng chỉ nào
                </p>
                <p className="text-xs text-muted-foreground mb-4">
                  Thêm chứng chỉ giúp hồ sơ của bạn uy tín hơn
                </p>
                <button
                  onClick={() => setShowCertForm(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-medium rounded-xl hover:bg-primary/90 transition-colors"
                >
                  <Plus className="w-4 h-4" /> Thêm ngay
                </button>
              </div>
            )}

            {certificates.map((cert: any) => (
              <div
                key={cert._id}
                className="bg-secondary/50 border border-border rounded-xl p-5 flex items-start justify-between gap-4 group hover:bg-secondary transition-colors"
              >
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <Award className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-base font-semibold text-foreground">
                      {cert.name}
                    </p>
                    {cert.issuer && (
                      <p className="text-sm text-muted-foreground mt-0.5">
                        {cert.issuer}
                      </p>
                    )}
                    {cert.issueDate && (
                      <p className="text-xs text-muted-foreground mt-2">
                        Cấp:{" "}
                        {new Date(cert.issueDate).toLocaleDateString("vi-VN")}
                        {cert.expiryDate &&
                          ` — Hết hạn: ${new Date(cert.expiryDate).toLocaleDateString("vi-VN")}`}
                      </p>
                    )}
                    {cert.credentialUrl && (
                      <a
                        href={cert.credentialUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-block mt-2 text-xs font-medium text-primary hover:underline"
                      >
                        Mở liên kết chứng chỉ ↗
                      </a>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => handleDeleteCert(cert._id)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:bg-red-100 hover:text-red-600 transition-colors shrink-0"
                  title="Xóa chứng chỉ"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          {showCertForm && (
            <div className="bg-secondary/30 rounded-2xl p-5 md:p-6 border border-border">
              <h4 className="text-sm font-semibold mb-4">Thêm chứng chỉ mới</h4>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="md:col-span-2">
                  <label className="text-xs font-medium text-foreground mb-1.5 block">
                    Tên bằng cấp / chứng chỉ *
                  </label>
                  <input
                    type="text"
                    value={newCert.name}
                    onChange={(e) =>
                      setNewCert((p) => ({ ...p, name: e.target.value }))
                    }
                    className="w-full h-10 px-3 rounded-xl bg-background border border-border focus:border-primary outline-none text-sm text-foreground"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="text-xs font-medium text-foreground mb-1.5 block">
                    Tổ chức cấp (VD: Coursera, Google...)
                  </label>
                  <input
                    type="text"
                    value={newCert.issuer}
                    onChange={(e) =>
                      setNewCert((p) => ({ ...p, issuer: e.target.value }))
                    }
                    className="w-full h-10 px-3 rounded-xl bg-background border border-border focus:border-primary outline-none text-sm text-foreground"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-foreground mb-1.5 block">
                    Ngày cấp
                  </label>
                  <input
                    type="date"
                    value={newCert.issueDate}
                    onChange={(e) =>
                      setNewCert((p) => ({ ...p, issueDate: e.target.value }))
                    }
                    className="w-full h-10 px-3 rounded-xl bg-background border border-border focus:border-primary outline-none text-sm text-foreground"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-foreground mb-1.5 block">
                    Ngày hết hạn (để trống nếu không có)
                  </label>
                  <input
                    type="date"
                    value={newCert.expiryDate}
                    onChange={(e) =>
                      setNewCert((p) => ({ ...p, expiryDate: e.target.value }))
                    }
                    className="w-full h-10 px-3 rounded-xl bg-background border border-border focus:border-primary outline-none text-sm text-foreground"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="text-xs font-medium text-foreground mb-1.5 block">
                    Đường dẫn xác minh (URL)
                  </label>
                  <input
                    type="text"
                    placeholder="https://..."
                    value={newCert.credentialUrl}
                    onChange={(e) =>
                      setNewCert((p) => ({
                        ...p,
                        credentialUrl: e.target.value,
                      }))
                    }
                    className="w-full h-10 px-3 rounded-xl bg-background border border-border focus:border-primary outline-none text-sm text-foreground placeholder:text-muted-foreground"
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleAddCert}
                  disabled={loading || !newCert.name.trim()}
                  className="flex items-center gap-2 px-6 py-2 bg-primary text-white text-sm font-medium rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-60"
                >
                  <Save className="w-4 h-4" />{" "}
                  {loading ? "Đang lưu..." : "Lưu chứng chỉ"}
                </button>
                <button
                  onClick={() => setShowCertForm(false)}
                  className="px-6 py-2 border border-border text-sm font-medium rounded-xl hover:bg-background transition-colors text-foreground"
                >
                  Hủy
                </button>
              </div>
            </div>
          )}

          {!showCertForm && certificates.length > 0 && (
            <button
              onClick={() => setShowCertForm(true)}
              className="flex items-center justify-center gap-2 w-full py-3 border-2 border-dashed border-border text-sm font-medium rounded-xl hover:border-primary hover:text-primary transition-colors text-muted-foreground"
            >
              <Plus className="w-4 h-4" /> Thêm chứng chỉ khác
            </button>
          )}
        </div>
      )}

      {/* ── Tab: Thành tích Chi tiết ── */}
      {tab === "stats" && (
        <div className="bg-card border border-border rounded-2xl p-6">
          <h3 className="text-base font-semibold mb-6 flex items-center gap-2">
            <Star className="w-5 h-5 text-yellow-500" /> Chi tiết hoạt động
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-secondary rounded-2xl p-5 flex items-center gap-5 border border-transparent hover:border-border transition-colors">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
                <BookOpen className="w-7 h-7 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  Tổng buổi đã dạy
                </p>
                <p className="text-3xl font-bold text-foreground">
                  {liveStats?.totalTaught ?? 0}
                </p>
              </div>
            </div>
            <div className="bg-secondary rounded-2xl p-5 flex items-center gap-5 border border-transparent hover:border-border transition-colors">
              <div className="w-14 h-14 rounded-2xl bg-blue-500/10 flex items-center justify-center shrink-0">
                <BookOpen className="w-7 h-7 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  Tổng buổi đã học
                </p>
                <p className="text-3xl font-bold text-foreground">
                  {liveStats?.totalLearned ?? 0}
                </p>
              </div>
            </div>
            <div className="bg-secondary rounded-2xl p-5 flex items-center gap-5 border border-transparent hover:border-border transition-colors">
              <div className="w-14 h-14 rounded-2xl bg-yellow-500/10 flex items-center justify-center shrink-0">
                <Star className="w-7 h-7 text-yellow-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  Đánh giá trung bình
                </p>
                <p className="text-3xl font-bold text-foreground">
                  {liveStats?.averageRating ?? "—"}
                </p>
              </div>
            </div>
            <div className="bg-secondary rounded-2xl p-5 flex items-center gap-5 border border-transparent hover:border-border transition-colors">
              <div className="w-14 h-14 rounded-2xl bg-green-500/10 flex items-center justify-center shrink-0">
                <Users className="w-7 h-7 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  Tổng lượt đánh giá
                </p>
                <p className="text-3xl font-bold text-foreground">
                  {liveStats?.totalReviews ?? 0}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
