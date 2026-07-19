import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../lib/api";
import { useAuth } from "../hooks/useAuth";
import { Send } from "lucide-react";


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

export default function CreatePostPage() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const headers = { Authorization: `Bearer ${token}` };

  const [type, setType] = useState<"teaching" | "learning">("learning");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [skillName, setSkillName] = useState("");
  const [skillField, setSkillField] = useState("");
  const [skillLevel, setSkillLevel] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !title.trim() ||
      !description.trim() ||
      !skillName.trim() ||
      !skillField ||
      !skillLevel
    ) {
      setError("Vui lòng điền đầy đủ tất cả thông tin");
      return;
    }
    setError("");
    try {
      setLoading(true);
      await api.post(
        `/post`,
        {
          type,
          title,
          description,
          skill: { name: skillName, field: skillField, level: skillLevel },
        },
        { headers },
      );
      navigate("/dashboard");
    } catch (err: any) {
      setError(err.response?.data?.message ?? "Lỗi hệ thống");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h2 className="text-lg font-semibold mb-6">Tạo bài đăng mới</h2>

      {error && (
        <div className="mb-4 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Type */}
        <div>
          <label className="text-xs text-muted-foreground mb-2 block">
            Bạn muốn
          </label>
          <div className="flex gap-2">
            {(["learning", "teaching"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setType(t)}
                className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition-colors ${
                  type === t
                    ? t === "learning"
                      ? "bg-blue-500 text-white border-blue-500"
                      : "bg-green-500 text-white border-green-500"
                    : "bg-secondary border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                {t === "learning"
                  ? "🎓 Tìm người dạy"
                  : "📚 Muốn dạy người khác"}
              </button>
            ))}
          </div>
        </div>

        {/* Skill name */}
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">
            Kỹ năng *
          </label>
          <input
            type="text"
            value={skillName}
            onChange={(e) => setSkillName(e.target.value)}
            placeholder="VD: ReactJS, Tiếng Anh giao tiếp, Photoshop..."
            className="w-full h-11 px-4 rounded-xl bg-secondary border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none text-sm text-foreground placeholder:text-muted-foreground"
          />
        </div>

        {/* Field + Level */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">
              Lĩnh vực *
            </label>
            <select
              value={skillField}
              onChange={(e) => setSkillField(e.target.value)}
              className="w-full h-11 px-3 rounded-xl bg-secondary border border-border focus:border-primary outline-none text-sm text-foreground"
            >
              <option value="">Chọn lĩnh vực</option>
              {FIELDS.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">
              Cấp độ *
            </label>
            <select
              value={skillLevel}
              onChange={(e) => setSkillLevel(e.target.value)}
              className="w-full h-11 px-3 rounded-xl bg-secondary border border-border focus:border-primary outline-none text-sm text-foreground"
            >
              <option value="">Chọn cấp độ</option>
              {LEVELS.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Title */}
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">
            Tiêu đề *
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={
              type === "learning"
                ? "VD: Cần người hướng dẫn ReactJS từ cơ bản"
                : "VD: Dạy Tiếng Anh giao tiếp cho người mất gốc"
            }
            className="w-full h-11 px-4 rounded-xl bg-secondary border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none text-sm text-foreground placeholder:text-muted-foreground"
          />
        </div>

        {/* Description */}
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">
            Mô tả *
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={
              type === "learning"
                ? "Mô tả trình độ hiện tại, mục tiêu muốn đạt được..."
                : "Mô tả kinh nghiệm, phương pháp dạy, có thể dạy những gì..."
            }
            rows={4}
            className="w-full px-4 py-3 rounded-xl bg-secondary border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none text-sm text-foreground placeholder:text-muted-foreground resize-none"
          />
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white text-sm font-medium rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-60"
          >
            <Send className="w-4 h-4" />
            {loading ? "Đang đăng..." : "Đăng bài"}
          </button>
          <button
            type="button"
            onClick={() => navigate("/dashboard")}
            className="px-6 py-2.5 border border-border text-sm rounded-xl hover:bg-secondary transition-colors text-muted-foreground"
          >
            Hủy
          </button>
        </div>
      </form>
    </div>
  );
}
