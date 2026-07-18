import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  ReactNode,
} from "react";
import { useNavigate } from "react-router-dom";
import { socket } from "../lib/socket";
import { useAuth } from "../hooks/useAuth";

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
  const { user } = useAuth();
  const userId = user?.id || (user as any)?._id;
  const navigate = useNavigate();

  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const activeConversationRef = useRef<string | null>(null);

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

    socket.on("new_message", handleNewMessage);
    socket.on("new_group_message", handleNewGroupMessage);

    return () => {
      socket.off("new_message", handleNewMessage);
      socket.off("new_group_message", handleNewGroupMessage);
    };
  }, [userId]);

  const handleToastClick = (toast: ToastItem) => {
    setToasts((prev) => prev.filter((t) => t.id !== toast.id));
    navigate("/dashboard/chat");
  };

  return (
    <ChatNotificationContext.Provider
      value={{ unreadCounts, markAsRead, setActiveConversationId }}
    >
      {children}

      {/* Toast góc màn hình, giống Messenger */}
      <div className="fixed bottom-5 right-5 z-[100] flex flex-col gap-2">
        {toasts.map((t) => (
          <ToastCard key={t.id} toast={t} onClick={() => handleToastClick(t)} />
        ))}
      </div>
    </ChatNotificationContext.Provider>
  );
}
