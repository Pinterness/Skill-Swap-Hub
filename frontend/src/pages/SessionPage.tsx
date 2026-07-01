import { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../hooks/useAuth";
import {
  CheckCircle,
  XCircle,
  PlayCircle,
  Clock,
  Calendar,
} from "lucide-react";

interface Session {
  _id: string;
  matchId: string;
  teacherId: { _id: string; username: string; avatar?: string };
  studentId: { _id: string; username: string; avatar?: string };
  status: "pending" | "ongoing" | "completed" | "cancelled";
  scheduledAt?: string;
  startedAt?: string;
  endedAt?: string;
  createdAt: string;
}

const API = "http://localhost:5000/api";

export default function SessionPage() {
  const { token, user } = useAuth();
  const headers = { Authorization: `Bearer ${token}` };

  const [tab, setTab] = useState<
    "pending" | "ongoing" | "completed" | "cancelled"
  >("pending");
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API}/session`, { headers });
      setSessions(res.data.sessions);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleStart = async (sessionId: string) => {
    try {
      await axios.put(`${API}/session/start/${sessionId}`, {}, { headers });
      setSuccess("Buổi học đã bắt đầu!");
      fetchSessions();
    } catch (err: any) {
      setError(err.response?.data?.message ?? "Lỗi hệ thống");
    }
  };

  const handleComplete = async (sessionId: string) => {
    try {
      await axios.put(`${API}/session/complete/${sessionId}`, {}, { headers });
      setSuccess("Buổi học đã hoàn thành!");
      fetchSessions();
    } catch (err: any) {
      setError(err.response?.data?.message ?? "Lỗi hệ thống");
    }
  };

  const handleCancel = async (sessionId: string) => {
    try {
      await axios.put(`${API}/session/cancel/${sessionId}`, {}, { headers });
      setSuccess("Đã hủy buổi học!");
      fetchSessions();
    } catch (err: any) {
      setError(err.response?.data?.message ?? "Lỗi hệ thống");
    }
  };

  const handleSchedule = async (sessionId: string, scheduledAt: string) => {
    try {
      await axios.put(
        `${API}/session/schedule/${sessionId}`,
        { scheduledAt },
        { headers },
      );
      setSuccess("Đã đặt lịch buổi học!");
      fetchSessions();
    } catch (err: any) {
      setError(err.response?.data?.message ?? "Lỗi hệ thống");
    }
  };

  const filtered = sessions.filter((s) => s.status === tab);
  const initials = (name: string) => name.slice(0, 2).toUpperCase();

  const statusConfig = {
    pending: {
      label: "Chờ bắt đầu",
      color: "text-yellow-500",
      bg: "bg-yellow-50 border-yellow-100",
    },
    ongoing: {
      label: "Đang học",
      color: "text-blue-500",
      bg: "bg-blue-50 border-blue-100",
    },
    completed: {
      label: "Đã hoàn thành",
      color: "text-green-500",
      bg: "bg-green-50 border-green-100",
    },
    cancelled: {
      label: "Đã hủy",
      color: "text-red-400",
      bg: "bg-red-50 border-red-100",
    },
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-secondary rounded-xl mb-6 w-fit">
        {(["pending", "ongoing", "completed", "cancelled"] as const).map(
          (t) => (
            <button
              key={t}
              onClick={() => {
                setTab(t);
                setSuccess("");
                setError("");
              }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                tab === t
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {statusConfig[t].label}
              {sessions.filter((s) => s.status === t).length > 0 && (
                <span className="ml-1.5 text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">
                  {sessions.filter((s) => s.status === t).length}
                </span>
              )}
            </button>
          ),
        )}
      </div>

      {/* Alerts */}
      {success && (
        <div className="mb-4 px-4 py-3 rounded-xl bg-green-500/10 border border-green-500/30 text-green-500 text-sm">
          {success}
        </div>
      )}
      {error && (
        <div className="mb-4 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="text-center py-20">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Đang tải...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-border rounded-2xl">
          <p className="text-sm text-muted-foreground">Không có buổi học nào</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {filtered.map((session) => {
            const isTeacher = session.teacherId._id === user?.id;
            const other = isTeacher ? session.studentId : session.teacherId;
            return (
              <div
                key={session._id}
                className="bg-card border border-border rounded-2xl p-5"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-xs font-medium text-blue-700">
                    {initials(other.username)}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{other.username}</p>
                    <p className="text-xs text-muted-foreground">
                      {isTeacher ? "Bạn là giáo viên" : "Bạn là học viên"}
                    </p>
                  </div>
                  <span
                    className={`text-[10px] px-2 py-1 rounded-full border ${statusConfig[session.status].bg} ${statusConfig[session.status].color}`}
                  >
                    {statusConfig[session.status].label}
                  </span>
                </div>

                <div className="space-y-1.5 mb-4">
                  {session.scheduledAt && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Calendar className="w-3.5 h-3.5" />
                      Lịch học:{" "}
                      {new Date(session.scheduledAt).toLocaleString("vi-VN")}
                    </div>
                  )}
                  {session.startedAt && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <PlayCircle className="w-3.5 h-3.5" />
                      Bắt đầu:{" "}
                      {new Date(session.startedAt).toLocaleString("vi-VN")}
                    </div>
                  )}
                  {session.endedAt && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <CheckCircle className="w-3.5 h-3.5" />
                      Kết thúc:{" "}
                      {new Date(session.endedAt).toLocaleString("vi-VN")}
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="w-3.5 h-3.5" />
                    Tạo lúc:{" "}
                    {new Date(session.createdAt).toLocaleDateString("vi-VN")}
                  </div>
                </div>

                {session.status === "pending" && !session.scheduledAt && (
                  <div className="flex gap-2 mb-3">
                    <input
                      type="datetime-local"
                      min={new Date().toISOString().slice(0, 16)}
                      className="flex-1 h-9 px-3 rounded-lg bg-secondary border border-border focus:border-primary outline-none text-sm text-foreground"
                      onChange={(e) => {
                        if (e.target.value)
                          handleSchedule(session._id, e.target.value);
                      }}
                    />
                  </div>
                )}

                <div className="flex gap-2">
                  {session.status === "pending" && (
                    <>
                      <button
                        onClick={() => handleStart(session._id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                      >
                        <PlayCircle className="w-3.5 h-3.5" /> Bắt đầu học
                      </button>
                      <button
                        onClick={() => handleCancel(session._id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-border rounded-lg hover:bg-secondary transition-colors text-muted-foreground"
                      >
                        <XCircle className="w-3.5 h-3.5" /> Hủy
                      </button>
                    </>
                  )}
                  {session.status === "ongoing" && (
                    <button
                      onClick={() => handleComplete(session._id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                    >
                      <CheckCircle className="w-3.5 h-3.5" /> Hoàn thành
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
