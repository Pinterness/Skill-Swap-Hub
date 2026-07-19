import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom"; // 1. Thêm useNavigate
import api from "../lib/api";
import { useAuth } from "../hooks/useAuth";
import { Check, X, RotateCcw, Clock, UserCheck } from "lucide-react";

interface Match {
  _id: string;
  sender: {
    _id: string;
    username: string;
    avatar?: string;
    skillsOffered: string[];
    skillsWanted: string[];
  };
  receiver: {
    _id: string;
    username: string;
    avatar?: string;
    skillsOffered: string[];
    skillsWanted: string[];
  };
  status: "pending" | "accepted" | "rejected" | "cancelled";
  createdAt: string;
}


export default function MatchPage() {
  const { token } = useAuth();
  const navigate = useNavigate(); // 2. Khởi tạo navigate
  const [tab, setTab] = useState<"received" | "sent">("received");
  const [received, setReceived] = useState<Match[]>([]);
  const [sent, setSent] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);

  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    try {
      setLoading(true);
      const [recv, snt] = await Promise.all([
        api.get(`/match/received`, { headers }),
        api.get(`/match/sent`, { headers }),
      ]);
      setReceived(recv.data.matches);
      setSent(snt.data.matches);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (matchId: string) => {
    try {
      await api.put(`/match/accept/${matchId}`, {}, { headers });
      fetchAll();
    } catch (err) {
      console.error(err);
    }
  };

  const handleReject = async (matchId: string) => {
    try {
      await api.put(`/match/reject/${matchId}`, {}, { headers });
      fetchAll();
    } catch (err) {
      console.error(err);
    }
  };

  const handleCancel = async (matchId: string) => {
    try {
      await api.delete(`/match/cancel/${matchId}`, { headers });
      fetchAll();
    } catch (err) {
      console.error(err);
    }
  };

  const statusBadge = (status: string) => {
    const map: Record<string, { label: string; className: string }> = {
      pending: {
        label: "Chờ duyệt",
        className: "bg-yellow-50 text-yellow-700 border-yellow-100",
      },
      accepted: {
        label: "Đã chấp nhận",
        className: "bg-green-50 text-green-700 border-green-100",
      },
      rejected: {
        label: "Đã từ chối",
        className: "bg-red-50 text-red-700 border-red-100",
      },
      cancelled: {
        label: "Đã rút",
        className: "bg-gray-100 text-gray-500 border-gray-200",
      },
    };
    const s = map[status];
    return (
      <span
        className={`text-[10px] px-2 py-0.5 rounded-full border ${s.className}`}
      >
        {s.label}
      </span>
    );
  };

  const initials = (name: string) =>
    name ? name.slice(0, 2).toUpperCase() : "U";

  const list = tab === "received" ? received : sent;

  return (
    <div className="p-6 max-w-3xl mx-auto">
      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-secondary rounded-xl mb-6 w-fit">
        <button
          onClick={() => setTab("received")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            tab === "received"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <UserCheck className="w-4 h-4" />
          Đã nhận
          {received.filter((m) => m.status === "pending").length > 0 && (
            <span className="bg-primary text-white text-[10px] px-1.5 py-0.5 rounded-full">
              {received.filter((m) => m.status === "pending").length}
            </span>
          )}
        </button>
        <button
          onClick={() => setTab("sent")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            tab === "sent"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Clock className="w-4 h-4" />
          Đã gửi
        </button>
      </div>

      {/* List */}
      {loading ? (
        <div className="text-center py-20">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Đang tải...</p>
        </div>
      ) : list.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-border rounded-2xl">
          <p className="text-muted-foreground text-sm">
            {tab === "received"
              ? "Chưa có lời mời nào"
              : "Bạn chưa gửi lời mời nào"}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {list.map((match) => {
            const other = tab === "received" ? match.sender : match.receiver;
            return (
              <div
                key={match._id}
                className="bg-card border border-border rounded-2xl p-4 flex items-start gap-4 hover:border-primary/30 transition-colors"
              >
                {/* Avatar - Bấm vào để xem hồ sơ */}
                <div
                  onClick={() => navigate(`/dashboard/user/${other._id}`)}
                  className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-xs font-medium text-blue-700 shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
                >
                  {initials(other.username)}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {/* Tên User - Bấm vào để xem hồ sơ */}
                    <span
                      onClick={() => navigate(`/dashboard/user/${other._id}`)}
                      className="text-sm font-medium cursor-pointer hover:text-primary transition-colors"
                    >
                      {other.username}
                    </span>
                    {statusBadge(match.status)}
                    <span className="text-xs text-muted-foreground ml-auto">
                      {new Date(match.createdAt).toLocaleDateString("vi-VN")}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1 mb-3">
                    {other.skillsOffered?.map((s) => (
                      <span
                        key={`off-${s}`}
                        className="text-[10px] px-2 py-0.5 rounded-full bg-green-50 text-green-700 border border-green-100"
                      >
                        Dạy: {s}
                      </span>
                    ))}
                    {other.skillsWanted?.map((s) => (
                      <span
                        key={`want-${s}`}
                        className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100"
                      >
                        Học: {s}
                      </span>
                    ))}
                  </div>

                  {/* Actions */}
                  {tab === "received" && match.status === "pending" && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleAccept(match._id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                      >
                        <Check className="w-3.5 h-3.5" /> Chấp nhận
                      </button>
                      <button
                        onClick={() => handleReject(match._id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-border rounded-lg hover:bg-secondary transition-colors text-muted-foreground"
                      >
                        <X className="w-3.5 h-3.5" /> Từ chối
                      </button>
                    </div>
                  )}
                  {tab === "sent" && match.status === "pending" && (
                    <button
                      onClick={() => handleCancel(match._id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-border rounded-lg hover:bg-secondary transition-colors text-muted-foreground"
                    >
                      <RotateCcw className="w-3.5 h-3.5" /> Rút lời mời
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
