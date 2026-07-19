import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  ReactNode,
} from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { socket } from "../lib/socket";
import { useAuth } from "../hooks/useAuth";
import { Video, PhoneOff, Users } from "lucide-react";
import JitsiMeeting from "../components/JitsiMeeting";
import { API_URL } from "../lib/config";

interface ToastItem {
  id: string;
  senderName: string;
  content: string;
  conversationKey: string;
}

interface ChatNotificationContextValue {
  unreadCounts: Record<string, number>;
  notificationCount: number;
  matchCount: number;
  notificationsEnabled: boolean;
  toggleNotifications: () => void;
  markAsRead: (conversationKey: string) => void;
  setActiveConversationId: (conversationKey: string | null) => void;
  setActiveCallRoom: (roomName: string | null) => void;
  setNotificationCount: (count: number) => void;
  setMatchCount: (count: number) => void;
}

const ChatNotificationContext =
  createContext<ChatNotificationContextValue | null>(null);

export function useChatNotifications() {
  const ctx = useContext(ChatNotificationContext);
  if (!ctx) {
    throw new Error(
      "useChatNotifications phải được dùng bên trong ChatNotificationProvider",
    );
  }
  return ctx;
}

// Deploy config: API base URL comes from VITE_API_URL.
const API = API_URL;

function ToastCard({
  toast,
  onClick,
}: {
  toast: ToastItem;
  onClick: () => void;
}) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setShow(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const initials = (name: string) => name.slice(0, 2).toUpperCase();

  return (
    <div
      onClick={onClick}
      className={`bg-card border border-border rounded-2xl shadow-xl p-3 flex items-start gap-3 cursor-pointer hover:border-primary/40 transition-all duration-300 w-80 ${
        show ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
      }`}
    >
      <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-xs font-semibold text-blue-700 shrink-0">
        {initials(toast.senderName)}
      </div>
      <div className="min-w-0">
        <p className="text-sm font-medium truncate">{toast.senderName}</p>
        <p className="text-xs text-muted-foreground truncate">
          {toast.content}
        </p>
      </div>
    </div>
  );
}

export function ChatNotificationProvider({
  children,
}: {
  children: ReactNode;
}) {
  const { user, token } = useAuth();
  const userId = user?.id || (user as any)?._id;
  const navigate = useNavigate();

  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const [notificationCount, setNotificationCount] = useState(0);
  const [matchCount, setMatchCount] = useState(0);

  // ── Bật/tắt thông báo (popup toast) - lưu vào localStorage để giữ nguyên qua các lần mở app ──
  const [notificationsEnabled, setNotificationsEnabledState] = useState(
    () => localStorage.getItem("notificationsEnabled") !== "false",
  );
  const notifEnabledRef = useRef(notificationsEnabled);
  useEffect(() => {
    notifEnabledRef.current = notificationsEnabled;
    localStorage.setItem("notificationsEnabled", String(notificationsEnabled));
  }, [notificationsEnabled]);
  const toggleNotifications = () => {
    setNotificationsEnabledState((prev) => !prev);
  };

  const activeConversationRef = useRef<string | null>(null);

  const [activeCallRoom, setActiveCallRoom] = useState<string | null>(null);
  const [incomingCall, setIncomingCall] = useState<{
    roomName: string;
    callerName: string;
    matchId: string;
    callerId: string;
  } | null>(null);
  const [groupInvite, setGroupInvite] = useState<{
    groupId: string;
    title: string;
    teacherName: string;
  } | null>(null);

  const setActiveConversationId = (conversationKey: string | null) => {
    activeConversationRef.current = conversationKey;
    if (conversationKey) markAsRead(conversationKey);
  };

  const markAsRead = (conversationKey: string) => {
    setUnreadCounts((prev) => {
      if (!prev[conversationKey]) return prev;
      const next = { ...prev };
      delete next[conversationKey];
      return next;
    });
  };

  useEffect(() => {
    if (userId) socket.emit("identify", userId);
  }, [userId]);

  // Lấy số lượng thông báo/lời mời thật lúc mới load trang hoặc đăng nhập
  useEffect(() => {
    if (!token) return;

    const fetchCounts = async () => {
      try {
        const notifRes = await axios.get(`${API}/notification`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const notifications = notifRes.data?.notifications || [];
        const unreadNotif = notifications.filter((n: any) => !n.isRead).length;
        setNotificationCount(unreadNotif);
      } catch (err) {
        console.error("Lỗi lấy số thông báo:", err);
      }

      try {
        const matchRes = await axios.get(`${API}/match/received`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const matches = matchRes.data?.matches || [];
        const pendingCount = matches.filter(
          (m: any) => m.status === "pending",
        ).length;
        setMatchCount(pendingCount);
      } catch (err) {
        console.error("Lỗi lấy số lời mời:", err);
      }
    };

    fetchCounts();
  }, [token]);

  useEffect(() => {
    const pushToast = (item: ToastItem) => {
      // Tôn trọng cài đặt bật/tắt thông báo - vẫn tăng số chưa đọc,
      // chỉ ẩn popup toast khi người dùng đã tắt
      if (!notifEnabledRef.current) return;
      setToasts((prev) => [...prev, item]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== item.id));
      }, 4500);
    };

    const handleNewMessage = (msg: any) => {
      if (!msg?.matchId) return;
      const isMine = msg.sender?._id === userId;
      if (isMine) return;

      const key = msg.matchId;
      if (activeConversationRef.current !== key) {
        setUnreadCounts((prev) => ({ ...prev, [key]: (prev[key] || 0) + 1 }));
        pushToast({
          id: msg._id,
          senderName: msg.sender?.username || "Người dùng",
          content: msg.content,
          conversationKey: key,
        });
      }
    };

    const handleNewGroupMessage = (msg: any) => {
      if (!msg?.groupId) return;
      const isMine = msg.sender?._id === userId;
      if (isMine) return;

      const key = `group_${msg.groupId}`;
      if (activeConversationRef.current !== key) {
        setUnreadCounts((prev) => ({ ...prev, [key]: (prev[key] || 0) + 1 }));
        pushToast({
          id: msg._id,
          senderName: `${msg.sender?.username || "Người dùng"} (nhóm)`,
          content: msg.content,
          conversationKey: key,
        });
      }
    };

    const handleIncomingCall = (data: any) => setIncomingCall(data);
    const handleCallCancelled = () => setIncomingCall(null);
    const handleGroupInvite = (data: any) => {
      setGroupInvite(data);
      setNotificationCount((prev) => prev + 1);
    };

    // Bắn từ backend mỗi khi có Notification mới được tạo (xem routes/match.js, routes/group.js)
    const handleNewNotification = () =>
      setNotificationCount((prev) => prev + 1);
    const handleNewMatchRequest = () => setMatchCount((prev) => prev + 1);

    socket.on("new_message", handleNewMessage);
    socket.on("new_group_message", handleNewGroupMessage);
    socket.on("incoming_call", handleIncomingCall);
    socket.on("call_cancelled", handleCallCancelled);
    socket.on("group_invite", handleGroupInvite);
    socket.on("new_notification", handleNewNotification);
    socket.on("new_match_request", handleNewMatchRequest);

    return () => {
      socket.off("new_message", handleNewMessage);
      socket.off("new_group_message", handleNewGroupMessage);
      socket.off("incoming_call", handleIncomingCall);
      socket.off("call_cancelled", handleCallCancelled);
      socket.off("group_invite", handleGroupInvite);
      socket.off("new_notification", handleNewNotification);
      socket.off("new_match_request", handleNewMatchRequest);
    };
  }, [userId]);

  const handleToastClick = (toast: ToastItem) => {
    setToasts((prev) => prev.filter((t) => t.id !== toast.id));
    navigate("/dashboard/chat");
  };

  const acceptIncomingCall = () => {
    if (!incomingCall) return;
    setActiveCallRoom(incomingCall.roomName);
    setIncomingCall(null);
  };

  const declineIncomingCall = () => {
    if (!incomingCall) return;
    socket.emit("call_cancel", {
      matchId: incomingCall.matchId,
      callerId: incomingCall.callerId,
    });
    setIncomingCall(null);
  };

  const respondGroupInvite = async (accept: boolean) => {
    if (!groupInvite) return;
    try {
      await axios.put(
        `${API}/group/${groupInvite.groupId}/respond`,
        { accept },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setGroupInvite(null);
      if (accept) {
        navigate("/dashboard/chat");
      }
    } catch (err) {
      console.error(err);
      setGroupInvite(null);
    }
  };

  return (
    <ChatNotificationContext.Provider
      value={{
        unreadCounts,
        notificationCount,
        matchCount,
        notificationsEnabled,
        toggleNotifications,
        markAsRead,
        setActiveConversationId,
        setActiveCallRoom,
        setNotificationCount,
        setMatchCount,
      }}
    >
      {children}

      <div className="fixed bottom-5 right-5 z-[100] flex flex-col gap-2 pointer-events-none">
        {toasts.map((t) => (
          <div key={t.id} className="pointer-events-auto">
            <ToastCard toast={t} onClick={() => handleToastClick(t)} />
          </div>
        ))}
      </div>

      {incomingCall && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-sm text-center shadow-2xl">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4 animate-pulse">
              <Video className="w-7 h-7 text-primary" />
            </div>
            <h3 className="text-base font-semibold mb-1">
              {incomingCall.callerName} đang gọi video...
            </h3>
            <p className="text-xs text-muted-foreground mb-6">
              Cuộc gọi qua Jitsi Meet
            </p>
            <div className="flex gap-3">
              <button
                onClick={declineIncomingCall}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 border border-border text-sm font-medium rounded-xl hover:bg-secondary transition-colors"
              >
                <PhoneOff className="w-4 h-4" /> Từ chối
              </button>
              <button
                onClick={acceptIncomingCall}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-primary text-white text-sm font-medium rounded-xl hover:bg-primary/90 transition-colors"
              >
                <Video className="w-4 h-4" /> Tham gia
              </button>
            </div>
          </div>
        </div>
      )}

      {groupInvite && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-sm text-center shadow-2xl">
            <div className="w-16 h-16 rounded-full bg-purple-500/10 flex items-center justify-center mx-auto mb-4">
              <Users className="w-7 h-7 text-purple-500" />
            </div>
            <h3 className="text-base font-semibold mb-1">
              {groupInvite.teacherName} mời bạn vào buổi học nhóm
            </h3>
            <p className="text-xs text-muted-foreground mb-6">
              "{groupInvite.title}"
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => respondGroupInvite(false)}
                className="flex-1 py-2.5 border border-border text-sm font-medium rounded-xl hover:bg-secondary transition-colors"
              >
                Từ chối
              </button>
              <button
                onClick={() => respondGroupInvite(true)}
                className="flex-1 py-2.5 bg-primary text-white text-sm font-medium rounded-xl hover:bg-primary/90 transition-colors"
              >
                Tham gia
              </button>
            </div>
          </div>
        </div>
      )}

      {activeCallRoom && (
        <div className="fixed inset-0 z-[300]">
          <JitsiMeeting
            roomName={activeCallRoom}
            displayName={user?.username || "Người dùng"}
            onClose={() => setActiveCallRoom(null)}
          />
        </div>
      )}
    </ChatNotificationContext.Provider>
  );
}
