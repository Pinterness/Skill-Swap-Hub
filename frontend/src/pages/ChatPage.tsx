import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useAuth } from "../hooks/useAuth";
import { Send, MessageSquare } from "lucide-react";

interface Match {
  _id: string;
  sender: { _id: string; username: string; avatar?: string };
  receiver: { _id: string; username: string; avatar?: string };
  status: string;
}

interface Message {
  _id: string;
  sender: { _id: string; username: string; avatar?: string };
  content: string;
  type: string;
  createdAt: string;
}

const API = "http://localhost:5000/api";

export default function ChatPage() {
  const { token, user } = useAuth();
  const [matches, setMatches] = useState<Match[]>([]);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    fetchMatches();
  }, []);

  useEffect(() => {
    if (selectedMatch) fetchMessages(selectedMatch._id);
  }, [selectedMatch]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const fetchMatches = async () => {
    try {
      const [recv, sent] = await Promise.all([
        axios.get(`${API}/match/received`, { headers }),
        axios.get(`${API}/match/sent`, { headers }),
      ]);
      console.log("Dữ liệu Match Received:", recv.data.matches[0]);
      const accepted = [...recv.data.matches, ...sent.data.matches].filter(
        (m) => m.status === "accepted",
      );

      const seen = new Set<string>();
      const unique = accepted.filter((match) => {
        const otherId =
          match.sender._id === user?.id ? match.receiver._id : match.sender._id;
        if (seen.has(otherId)) return false;
        seen.add(otherId);
        return true;
      });

      setMatches(unique);
      if (unique.length > 0) setSelectedMatch(unique[0]);
    } catch (err) {
      console.error(err);
    }
  };
  const fetchMessages = async (matchId: string) => {
    try {
      setLoading(true);
      const res = await axios.get(`${API}/message/${matchId}`, { headers });
      console.log("Dữ liệu tin nhắn nhận được:", res.data);
      setMessages(res.data.messages || []); // Bọc mảng an toàn
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || !selectedMatch) return;
    try {
      const res = await axios.post(
        `${API}/message/${selectedMatch._id}`,
        { content },
        { headers },
      );
      setMessages((prev) => [...prev, res.data.message]);
      setContent("");
    } catch (err) {
      console.error(err);
    }
  };

  // FIX 1: Bảo vệ hàm getOther tránh trường hợp null/undefined
  const getOther = (match: Match) => {
    if (!match || !match.sender || !match.receiver) return null;
    return match.sender._id === user?.id ? match.receiver : match.sender;
  };

  // FIX 2: Bảo vệ hàm cắt tên tránh trường hợp name bị rỗng
  const initials = (name?: string) => {
    if (!name) return "U"; // Trả về chữ U (User) mặc định nếu không có tên
    return name.slice(0, 2).toUpperCase();
  };

  const formatTime = (date: string) =>
    new Date(date).toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
    <div className="flex h-full">
      {/* Danh sách chat */}
      <div className="w-64 min-w-64 border-r border-border flex flex-col">
        <div className="p-4 border-b border-border">
          <h2 className="text-sm font-medium">Tin nhắn</h2>
        </div>
        <div className="flex-1 overflow-y-auto">
          {matches.length === 0 ? (
            <div className="p-4 text-center text-xs text-muted-foreground">
              Chưa có cuộc trò chuyện nào
            </div>
          ) : (
            matches.map((match) => {
              const other = getOther(match);
              const isSelected = selectedMatch?._id === match._id;

              // Nếu dữ liệu người kia bị lỗi, bỏ qua không hiển thị để tránh sập
              if (!other) return null;

              return (
                <button
                  key={match._id}
                  onClick={() => setSelectedMatch(match)}
                  className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-secondary transition-colors text-left ${
                    isSelected ? "bg-secondary border-r-2 border-primary" : ""
                  }`}
                >
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-xs font-medium text-blue-700 shrink-0">
                    {initials(other.username)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">
                      {other.username || "Người dùng ẩn"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Nhấn để xem tin nhắn
                    </p>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Khu vực chat */}
      {selectedMatch && getOther(selectedMatch) ? (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="px-5 py-3 border-b border-border flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-xs font-medium text-blue-700">
              {initials(getOther(selectedMatch)?.username)}
            </div>
            <span className="text-sm font-medium">
              {getOther(selectedMatch)?.username || "Người dùng ẩn"}
            </span>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-3">
            {loading ? (
              <div className="text-center py-10">
                <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center py-10 text-xs text-muted-foreground">
                Chưa có tin nhắn nào. Hãy bắt đầu cuộc trò chuyện!
              </div>
            ) : (
              messages.map((msg) => {
                // FIX 3: Thêm dấu ? để bảo vệ msg.sender
                const isMine =
                  msg.sender._id === user?.id || msg.sender._id === user?._id;

                return (
                  <div
                    key={msg._id}
                    className={`flex items-end gap-2 ${isMine ? "flex-row-reverse" : "flex-row"}`}
                  >
                    {!isMine && (
                      <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-[10px] font-medium text-blue-700 shrink-0">
                        {initials(msg.sender?.username)}
                      </div>
                    )}
                    <div
                      className={`max-w-[65%] px-3 py-2 rounded-2xl text-sm ${
                        isMine
                          ? "bg-primary text-white rounded-br-sm"
                          : "bg-secondary text-foreground rounded-bl-sm"
                      }`}
                    >
                      {msg.content}
                      <p
                        className={`text-[10px] mt-1 ${isMine ? "text-white/60" : "text-muted-foreground"}`}
                      >
                        {formatTime(msg.createdAt)}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <form
            onSubmit={sendMessage}
            className="px-5 py-3 border-t border-border flex items-center gap-3"
          >
            <input
              type="text"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Nhập tin nhắn..."
              className="flex-1 h-10 px-4 rounded-full bg-secondary border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none text-sm text-foreground placeholder:text-muted-foreground"
            />
            <button
              type="submit"
              disabled={!content.trim()}
              className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground gap-3">
          <MessageSquare className="w-10 h-10 opacity-30" />
          <p className="text-sm">Chọn một cuộc trò chuyện để bắt đầu</p>
        </div>
      )}
    </div>
  );
}
