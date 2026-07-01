import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
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
  LogOut,
  Shield,
} from "lucide-react";

const navItems = [
  { key: "feed", label: "Khám phá", icon: LayoutGrid, path: "/dashboard" },
  {
    key: "match",
    label: "Lời mời",
    icon: Users,
    path: "/dashboard/match",
    badge: 0,
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
    badge: 0,
  },
  { key: "profile", label: "Hồ sơ", icon: User, path: "/dashboard/profile" },
  { key: "review", label: "Đánh giá", icon: Star, path: "/dashboard/review" },
];

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

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
      {/* Sidebar */}
      <aside className="w-56 min-w-56 bg-secondary border-r border-border flex flex-col">
        {/* Logo */}
        <div className="flex items-center gap-2 px-4 py-4 border-b border-border">
          <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-sm tracking-wide">SkillSwap</span>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-2 space-y-0.5">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground px-2 py-2">
            Menu
          </p>
          {navItems.slice(0, 4).map(({ label, icon: Icon, path, badge }) => {
            const active = location.pathname === path;
            return (
              <Link
                key={path}
                to={path}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
                  active
                    ? "bg-background text-primary font-medium border border-border"
                    : "text-muted-foreground hover:bg-background hover:text-foreground"
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
                {badge !== undefined && badge > 0 && (
                  <span className="ml-auto text-[10px] bg-primary text-white px-1.5 py-0.5 rounded-full">
                    {badge}
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
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
                  active
                    ? "bg-background text-primary font-medium border border-border"
                    : "text-muted-foreground hover:bg-background hover:text-foreground"
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </Link>
            );
          })}

          {user?.role === "admin" && (
            <>
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground px-2 py-2 pt-4">
                Quản trị
              </p>
              <Link
                to="/dashboard/admin"
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
                  location.pathname === "/dashboard/admin"
                    ? "bg-background text-primary font-medium border border-border"
                    : "text-muted-foreground hover:bg-background hover:text-foreground"
                }`}
              >
                <Shield className="w-4 h-4" />
                Admin
              </Link>
            </>
          )}
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-border flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-xs font-medium text-blue-700">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium truncate">{user?.username}</p>
            <p className="text-[10px] text-muted-foreground">
              {user?.role === "admin" ? "Quản trị viên" : "Thành viên"}
            </p>
          </div>
          <button
            onClick={logout}
            className="text-muted-foreground hover:text-red-400 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <header className="h-14 border-b border-border flex items-center justify-between px-5">
          <h1 className="text-sm font-medium">{pageTitle}</h1>
          <div className="flex items-center gap-2">
            <button className="w-8 h-8 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:bg-secondary transition-colors">
              <Bell className="w-4 h-4" />
            </button>
            <button
              onClick={() => navigate("/dashboard/post/create")}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Đăng bài
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
