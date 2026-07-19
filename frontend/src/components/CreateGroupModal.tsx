import { useState } from "react";
import api from "../lib/api";
import { X, Users } from "lucide-react";


interface SimpleUser {
  _id: string;
  username: string;
  avatar?: string;
}

interface CreateGroupModalProps {
  students: SimpleUser[]; // danh sách người đã match "accepted" với mình
  token: string | null;
  onClose: () => void;
  onCreated: () => void;
}

export default function CreateGroupModal({
  students,
  token,
  onClose,
  onCreated,
}: CreateGroupModalProps) {
  const [title, setTitle] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const toggle = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const handleCreate = async () => {
    if (selectedIds.length === 0) {
      setError("Vui lòng chọn ít nhất 1 học viên");
      return;
    }
    setError("");
    try {
      setLoading(true);
      await api.post(
        `/api/group`,
        { studentIds: selectedIds, title: title.trim() || undefined },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      onCreated();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || "Lỗi hệ thống");
    } finally {
      setLoading(false);
    }
  };

  const initials = (name?: string) =>
    name ? name.slice(0, 2).toUpperCase() : "U";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
      <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold flex items-center gap-2">
            <Users className="w-4 h-4 text-primary" /> Tạo buổi học nhóm
          </h3>
          <button onClick={onClose}>
            <X className="w-5 h-5 text-muted-foreground hover:text-foreground" />
          </button>
        </div>

        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Tên buổi học (VD: Ôn tập Ngữ pháp A1)"
          className="w-full h-10 px-3 rounded-lg bg-secondary border border-border outline-none text-sm mb-4"
        />

        <p className="text-xs text-muted-foreground mb-2">
          Chọn học viên đã kết nối với bạn ({selectedIds.length} đã chọn)
        </p>

        <div className="max-h-64 overflow-y-auto space-y-1.5 mb-4">
          {students.length === 0 ? (
            <p className="text-xs text-muted-foreground italic py-4 text-center">
              Bạn chưa có kết nối nào để gộp nhóm
            </p>
          ) : (
            students.map((s) => (
              <label
                key={s._id}
                className={`flex items-center gap-3 px-3 py-2 rounded-xl border cursor-pointer transition-colors ${
                  selectedIds.includes(s._id)
                    ? "border-primary bg-primary/5"
                    : "border-border hover:bg-secondary"
                }`}
              >
                <input
                  type="checkbox"
                  checked={selectedIds.includes(s._id)}
                  onChange={() => toggle(s._id)}
                  className="accent-primary"
                />
                <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-[10px] font-medium text-blue-700">
                  {initials(s.username)}
                </div>
                <span className="text-sm">{s.username}</span>
              </label>
            ))
          )}
        </div>

        {error && <p className="text-xs text-red-500 mb-3">{error}</p>}

        <div className="flex gap-3">
          <button
            onClick={handleCreate}
            disabled={loading}
            className="flex-1 py-2.5 bg-primary text-white text-sm font-medium rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-60"
          >
            {loading ? "Đang tạo..." : "Gửi lời mời & Tạo nhóm"}
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2.5 border border-border text-sm rounded-xl hover:bg-secondary text-muted-foreground"
          >
            Hủy
          </button>
        </div>
      </div>
    </div>
  );
}
