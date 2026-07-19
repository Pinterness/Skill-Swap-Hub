import { useState, useRef, useEffect } from "react";
import api from "../lib/api";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useChatNotifications } from "../context/ChatNotificationContext";
import SettingsModal from "../components/SettingsModal";
import {
  LayoutGrid,
  Users,
  Calendar,
  MessageSquare,
  User,
  Star,
  Sparkles,
  Bell,
  Plus,
  Settings,
  Shield,
  FileText,
} from "lucide-react";

// ĐÃ SỬA: khớp đúng với server.js (app.use("/api/notification", ...) - SỐ ÍT)

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, token } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const {
    unreadCounts,
    notificationCount,
    matchCount,
    setNotificationCount,
    notificationsEnabled,
    toggleNotifications,
  } = useChatNotifications();
  const totalUnread = Object.values(unreadCounts).reduce(
    (sum, count) => sum + count,
    0,
  );

  const [showNotifications, setShowNotifications] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  const [notifications, setNotifications] = useState<any[]>([]);
  const [loadingNotifs, setLoadingNotifs] = useState(false);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        notifRef.current &&
        !notifRef.current.contains(event.target as Node)
      ) {
        setShowNotifications(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoadingNotifs(true);
      const res = await api.get("/api/notification", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data.success) {
        setNotifications(res.data.notifications);
        const unread = res.data.notifications.filter(
          (n: any) => !n.isRead,
        ).length;
        setNotificationCount(unread);
      }
    } catch (error) {
      console.error("Lỗi lấy thông báo:", error);
    } finally {
      setLoadingNotifs(false);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await api.put(
        "/api/notification/read-all",
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setNotificationCount(0);
    } catch (error) {
      console.error("Lỗi đánh dấu đã đọc:", error);
    }
  };

  const navItems = [
    { key: "feed", label: "Khám phá", icon: LayoutGrid, path: "/dashboard" },
    {
      key: "match",
      label: "Lời mời",
      icon: Users,
      path: "/dashboard/match",
      badge: matchCount,
    },
    {
      key: "session",
      label: "Buổi học",
      icon: Calendar,
      path: "/dashboard/session",
    },
    {
      key: "chat",
      label: "Tin nhắn",
      icon: MessageSquare,
      path: "/dashboard/chat",
    },
    { key: "profile", label: "Hồ sơ", icon: User, path: "/dashboard/profile" },
    { key: "review", label: "Đánh giá", icon: Star, path: "/dashboard/review" },
  ];

  const initials = user?.username
    ? user.username.slice(0, 2).toUpperCase()
    : "U";
  const pageTitle =
    location.pathname === "/dashboard/admin"
      ? "Admin"
      : (navItems.find((n) => n.path === location.pathname)?.label ??
        "SkillSwap");

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      {/* ── SIDEBAR ── */}
      <aside className="w-56 min-w-56 bg-secondary border-r border-border flex flex-col z-10">
        <div className="flex items-center gap-2 px-4 py-4 border-b border-border">
          <div className="w-7 h-7 rounded-lg bg-[#ff4a40] flex items-center justify-center shadow-sm">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-sm tracking-wide">SkillSwap</span>
        </div>

        <nav className="flex-1 p-2 space-y-0.5">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground px-2 py-2">
            Menu
          </p>
          {navItems
            .slice(0, 4)
            .map(({ key, label, icon: Icon, path, badge }) => {
              const active = location.pathname === path;
              const displayBadge = key === "chat" ? totalUnread : badge;
              return (
                <Link
                  key={path}
                  to={path}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-colors ${active ? "bg-background text-[#ff4a40] font-medium border border-border shadow-sm" : "text-muted-foreground hover:bg-background hover:text-foreground"}`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4" />
                    {label}
                  </div>
                  {displayBadge !== undefined && displayBadge > 0 && (
                    <span className="flex items-center justify-center min-w-[20px] h-[20px] text-[10px] font-bold bg-[#ff4a40] text-white px-1.5 rounded-full shadow-sm">
                      {displayBadge > 99 ? "99+" : displayBadge}
                    </span>
                  )}
                </Link>
              );
            })}

          <p className="text-[10px] uppercase tracking-widest text-muted-foreground px-2 py-2 pt-4">
            Cá nhân
          </p>
          {navItems.slice(4).map(({ label, icon: Icon, path }) => {
            const active = location.pathname === path;
            return (
              <Link
                key={path}
                to={path}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm transition-colors ${active ? "bg-background text-[#ff4a40] font-medium border border-border shadow-sm" : "text-muted-foreground hover:bg-background hover:text-foreground"}`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </Link>
            );
          })}
          {user?.role === "admin" && (
            <Link
              to="/dashboard/admin"
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm transition-colors mt-4 ${location.pathname === "/dashboard/admin" ? "bg-background text-[#ff4a40] font-medium border border-border shadow-sm" : "text-muted-foreground hover:bg-background hover:text-foreground"}`}
            >
              <Shield className="w-4 h-4" />
              Admin
            </Link>
          )}
        </nav>

        <div className="p-3 border-t border-border flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-xs font-bold text-blue-700 shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold truncate text-foreground">
              {user?.username}
            </p>
            <p className="text-[10px] text-muted-foreground truncate">
              {user?.role === "admin" ? "Quản trị viên" : "Thành viên"}
            </p>
          </div>
          {/* ĐÃ THAY: nút đăng xuất -> bánh răng cài đặt (đăng xuất giờ nằm trong popup Cài đặt) */}
          <button
            onClick={() => setShowSettings(true)}
            className="p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground rounded-md transition-colors"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* ── MAIN CONTENT ── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-14 border-b border-border flex items-center justify-between px-5 bg-background relative z-20">
          <h1 className="text-sm font-semibold text-foreground tracking-wide">
            {pageTitle}
          </h1>
          <div className="flex items-center gap-4">
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => {
                  const willShow = !showNotifications;
                  setShowNotifications(willShow);
                  if (willShow) {
                    fetchNotifications();
                  }
                }}
                className={`relative w-9 h-9 rounded-xl border flex items-center justify-center transition-colors active:scale-95 ${showNotifications ? "border-[#ff4a40] text-[#ff4a40] bg-[#ff4a40]/10" : "border-border text-muted-foreground hover:text-foreground hover:bg-secondary"}`}
              >
                <Bell className="w-4 h-4" />
                {notificationCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 flex items-center justify-center min-w-[20px] h-[20px] px-1 text-[10px] font-bold text-white bg-[#ff4a40] rounded-full border-2 border-background shadow-sm animate-in zoom-in duration-300">
                    {notificationCount > 99 ? "99+" : notificationCount}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-3 w-80 bg-card border border-border shadow-2xl rounded-2xl overflow-hidden animate-in fade-in zoom-in-95 origin-top-right duration-200">
                  <div className="px-4 py-3 border-b border-border flex items-center justify-between bg-secondary/30">
                    <h3 className="text-sm font-bold">Thông báo</h3>
                    <button
                      onClick={handleMarkAllAsRead}
                      className="text-[11px] text-[#ff4a40] hover:underline font-medium"
                    >
                      Đánh dấu đã đọc
                    </button>
                  </div>

                  <div className="max-h-[350px] overflow-y-auto">
                    {loadingNotifs ? (
                      <div className="p-6 text-center text-sm text-muted-foreground animate-pulse">
                        Đang tải thông báo...
                      </div>
                    ) : notifications.length === 0 ? (
                      <div className="p-6 text-center text-sm text-muted-foreground">
                        Bạn không có thông báo nào.
                      </div>
                    ) : (
                      notifications.map((notif) => (
                        <div
                          key={notif._id}
                          className={`flex items-start gap-3 p-4 border-b border-border/50 hover:bg-secondary/50 cursor-pointer transition-colors ${!notif.isRead ? "bg-[#ff4a40]/5" : ""}`}
                        >
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                              notif.type.includes("session")
                                ? "bg-orange-500/10 text-orange-500"
                                : notif.type.includes("message")
                                  ? "bg-blue-500/10 text-blue-500"
                                  : notif.type.includes("match") ||
                                      notif.type.includes("group")
                                    ? "bg-green-500/10 text-green-500"
                                    : "bg-gray-500/10 text-gray-500"
                            }`}
                          >
                            {notif.type.includes("session") ? (
                              <Calendar className="w-4 h-4" />
                            ) : notif.type.includes("message") ? (
                              <MessageSquare className="w-4 h-4" />
                            ) : notif.type.includes("match") ||
                              notif.type.includes("group") ? (
                              <Users className="w-4 h-4" />
                            ) : (
                              <FileText className="w-4 h-4" />
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-foreground leading-tight">
                              {notif.content}
                            </p>
                            <p className="text-[11px] text-muted-foreground mt-1">
                              {new Date(notif.createdAt).toLocaleString(
                                "vi-VN",
                              )}
                            </p>
                          </div>

                          {!notif.isRead && (
                            <div className="w-2 h-2 rounded-full bg-[#ff4a40] shrink-0 mt-1.5" />
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={() => navigate("/dashboard/post/create")}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold bg-[#ff4a40] text-white rounded-xl hover:bg-[#e03e35] transition-all shadow-sm shadow-[#ff4a40]/20 active:scale-95"
            >
              <Plus className="w-4 h-4" />
              Đăng bài
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>

      {showSettings && (
        <SettingsModal
          onClose={() => setShowSettings(false)}
          notificationsEnabled={notificationsEnabled}
          onToggleNotifications={toggleNotifications}
        />
      )}
    </div>
  );
}
