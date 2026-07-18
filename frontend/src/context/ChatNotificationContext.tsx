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

interface ToastItem {
  id: string;
  senderName: string;
  content: string;
  conversationKey: string; // matchId hoặc "group_<groupId>"
}

interface ChatNotificationContextValue {
  unreadCounts: Record<string, number>;
  markAsRead: (conversationKey: string) => void;
  setActiveConversationId: (conversationKey: string | null) => void;
  setActiveCallRoom: (roomName: string | null) => void; // Cung cấp hàm này để ChatPage có thể gọi Jitsi
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

const API = "http://localhost:5000/api";

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
  const activeConversationRef = useRef<string | null>(null);

  // ── TRẠNG THÁI CUỘC GỌI & NHÓM ──
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

  // Định danh với socket server ngay khi biết userId (đăng nhập)
  // Ghi chú: Có thể xoá đoạn socket.emit("identify") bên MainLayout đi để tránh gọi 2 lần, để nguyên ở đây là chuẩn nhất.
  useEffect(() => {
    if (userId) socket.emit("identify", userId);
  }, [userId]);

  useEffect(() => {
    const pushToast = (item: ToastItem) => {
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
      const isViewingThis = activeConversationRef.current === key;

      if (!isViewingThis) {
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
      const isViewingThis = activeConversationRef.current === key;

      if (!isViewingThis) {
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
    const handleGroupInvite = (data: any) => setGroupInvite(data);

    socket.on("new_message", handleNewMessage);
    socket.on("new_group_message", handleNewGroupMessage);
    socket.on("incoming_call", handleIncomingCall);
    socket.on("call_cancelled", handleCallCancelled);
    socket.on("group_invite", handleGroupInvite);

    return () => {
      socket.off("new_message", handleNewMessage);
      socket.off("new_group_message", handleNewGroupMessage);
      socket.off("incoming_call", handleIncomingCall);
      socket.off("call_cancelled", handleCallCancelled);
      socket.off("group_invite", handleGroupInvite);
    };
  }, [userId]);

  const handleToastClick = (toast: ToastItem) => {
    setToasts((prev) => prev.filter((t) => t.id !== toast.id));
    navigate("/dashboard/chat");
  };

  // ── XỬ LÝ SỰ KIỆN CUỘC GỌI & NHÓM ──
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
        markAsRead,
        setActiveConversationId,
        setActiveCallRoom,
      }}
    >
      {children}

      {/* ── Toast góc màn hình ── */}
      <div className="fixed bottom-5 right-5 z-[100] flex flex-col gap-2 pointer-events-none">
        {toasts.map((t) => (
          <div key={t.id} className="pointer-events-auto">
            <ToastCard toast={t} onClick={() => handleToastClick(t)} />
          </div>
        ))}
      </div>

      {/* ── Popup báo có cuộc gọi 1-1 đến ── */}
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

      {/* ── Popup lời mời vào nhóm học ── */}
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

      {/* ── Cửa sổ cuộc gọi video Jitsi (Hiện ở mọi nơi) ── */}
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
