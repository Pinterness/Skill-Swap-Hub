import { useState } from "react";
import api from "../lib/api";
import { useNavigate } from "react-router-dom";
import {
  X,
  KeyRound,
  Moon,
  Sun,
  Bell,
  BellOff,
  Trash2,
  LogOut,
  Settings2,
  ShieldAlert,
  Fingerprint,
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { useTheme } from "../context/ThemeContext";


interface SettingsModalProps {
  onClose: () => void;
  notificationsEnabled?: boolean;
  onToggleNotifications?: () => void;
}

export default function SettingsModal({
  onClose,
  notificationsEnabled: notifPropValue,
  onToggleNotifications,
}: SettingsModalProps) {
  const { token, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const [tab, setTab] = useState<"general" | "password" | "danger">("general");

  // Xử lý thông báo
  const [localNotifEnabled, setLocalNotifEnabled] = useState(
    () => localStorage.getItem("notificationsEnabled") !== "false",
  );
  const notificationsEnabled = notifPropValue ?? localNotifEnabled;

  const handleToggleNotifications = () => {
    if (onToggleNotifications) {
      onToggleNotifications();
    } else {
      const next = !localNotifEnabled;
      setLocalNotifEnabled(next);
      localStorage.setItem("notificationsEnabled", String(next));
    }
  };

  // Đổi mật khẩu
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError("");
    setPasswordSuccess("");

    if (newPassword !== confirmPassword) {
      setPasswordError("Mật khẩu mới nhập lại không khớp");
      return;
    }

    try {
      setPasswordLoading(true);
      await api.put(
        `/api/auth/change-password`,
        { oldPassword, newPassword },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setPasswordSuccess("Đổi mật khẩu thành công!");
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      setPasswordError(err.response?.data?.message || "Lỗi hệ thống");
    } finally {
      setPasswordLoading(false);
    }
  };

  // Xóa tài khoản
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const handleDeleteAccount = async () => {
    setDeleteError("");
    if (deleteConfirmText !== "XOA TAI KHOAN") {
      setDeleteError('Vui lòng gõ đúng "XOA TAI KHOAN" để xác nhận');
      return;
    }
    if (!deletePassword) {
      setDeleteError("Vui lòng nhập mật khẩu");
      return;
    }

    try {
      setDeleteLoading(true);
      await api.delete(`/api/user/account`, {
        headers: { Authorization: `Bearer ${token}` },
        data: { password: deletePassword },
      });
      logout();
      navigate("/");
    } catch (err: any) {
      setDeleteError(err.response?.data?.message || "Lỗi hệ thống");
    } finally {
      setDeleteLoading(false);
    }
  };

  // Cấu hình Tabs
  const tabs = [
    { id: "general", label: "Chung", icon: Settings2 },
    { id: "password", label: "Mật khẩu", icon: Fingerprint },
    { id: "danger", label: "Nguy hiểm", icon: ShieldAlert },
  ] as const;

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-background/80 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-card border border-border rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-300 ease-out">
        {/* ── Header ── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-secondary/30">
          <h3 className="text-lg font-bold">Cài đặt</h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors active:scale-90"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ── Tabs Navigation ── */}
        <div className="px-5 pt-4">
          <div className="flex gap-1 p-1.5 bg-secondary/50 rounded-xl">
            {tabs.map((t) => {
              const Icon = t.icon;
              const isActive = tab === t.id;
              const isDanger = t.id === "danger";

              return (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold transition-all duration-300 ${
                    isActive
                      ? `bg-background shadow-sm ${isDanger ? "text-red-500" : "text-foreground"}`
                      : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {t.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Tab Content ── */}
        <div className="p-6 overflow-y-auto">
          {/* 
            Sử dụng key={tab} để ép React render lại div này mỗi khi chuyển tab, 
            từ đó kích hoạt lại hiệu ứng animate-in trượt và mờ mượt mà 
          */}
          <div
            key={tab}
            className="animate-in fade-in slide-in-from-right-4 duration-300 ease-out space-y-5"
          >
            {/* ── Tab: Chung ── */}
            {tab === "general" && (
              <>
                <div className="space-y-3">
                  {/* Tùy chọn Giao diện */}
                  <div className="group flex items-center justify-between p-4 bg-secondary/30 border border-border/50 hover:border-border rounded-xl transition-all duration-300">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shadow-sm">
                        {theme === "dark" ? (
                          <Moon className="w-5 h-5 text-primary" />
                        ) : (
                          <Sun className="w-5 h-5 text-primary" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-semibold">
                          Giao diện hệ thống
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {theme === "dark"
                            ? "Đang bật chế độ tối"
                            : "Đang bật chế độ sáng"}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={toggleTheme}
                      className={`relative w-12 h-6 rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background shrink-0 ${
                        theme === "dark"
                          ? "bg-primary"
                          : "bg-muted-foreground/30"
                      }`}
                    >
                      <span
                        className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-300 ${
                          theme === "dark" ? "translate-x-6" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>

                  {/* Tùy chọn Thông báo */}
                  <div className="group flex items-center justify-between p-4 bg-secondary/30 border border-border/50 hover:border-border rounded-xl transition-all duration-300">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shadow-sm">
                        {notificationsEnabled ? (
                          <Bell className="w-5 h-5 text-primary" />
                        ) : (
                          <BellOff className="w-5 h-5 text-muted-foreground" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-semibold">Thông báo nổi</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {notificationsEnabled
                            ? "Hiển thị popup khi có sự kiện mới"
                            : "Đã tắt popup tin nhắn/lời mời"}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={handleToggleNotifications}
                      className={`relative w-12 h-6 rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background shrink-0 ${
                        notificationsEnabled
                          ? "bg-primary"
                          : "bg-muted-foreground/30"
                      }`}
                    >
                      <span
                        className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-300 ${
                          notificationsEnabled
                            ? "translate-x-6"
                            : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    onClick={logout}
                    className="w-full flex items-center justify-center gap-2 py-3 border border-border text-sm font-semibold rounded-xl text-muted-foreground hover:bg-secondary hover:text-foreground transition-all duration-200 active:scale-[0.98]"
                  >
                    <LogOut className="w-4 h-4" /> Đăng xuất khỏi thiết bị này
                  </button>
                </div>
              </>
            )}

            {/* ── Tab: Mật khẩu ── */}
            {tab === "password" && (
              <form onSubmit={handleChangePassword} className="space-y-4">
                <div className="space-y-4 bg-secondary/30 p-4 border border-border/50 rounded-xl">
                  <div>
                    <label className="text-xs font-semibold mb-1.5 block text-muted-foreground">
                      Mật khẩu hiện tại
                    </label>
                    <input
                      type="password"
                      value={oldPassword}
                      onChange={(e) => setOldPassword(e.target.value)}
                      required
                      placeholder="Nhập mật khẩu cũ..."
                      className="w-full h-11 px-4 rounded-xl bg-background border border-border outline-none text-sm transition-all duration-300 focus:border-primary focus:ring-4 focus:ring-primary/10"
                    />
                  </div>
                  <div className="h-px bg-border/50 w-full" />
                  <div>
                    <label className="text-xs font-semibold mb-1.5 block text-muted-foreground">
                      Mật khẩu mới
                    </label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      minLength={6}
                      placeholder="Tối thiểu 6 ký tự..."
                      className="w-full h-11 px-4 rounded-xl bg-background border border-border outline-none text-sm transition-all duration-300 focus:border-primary focus:ring-4 focus:ring-primary/10"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold mb-1.5 block text-muted-foreground">
                      Xác nhận mật khẩu mới
                    </label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      placeholder="Nhập lại mật khẩu mới..."
                      className="w-full h-11 px-4 rounded-xl bg-background border border-border outline-none text-sm transition-all duration-300 focus:border-primary focus:ring-4 focus:ring-primary/10"
                    />
                  </div>
                </div>

                {passwordError && (
                  <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
                    <p className="text-xs font-medium text-red-500 text-center">
                      {passwordError}
                    </p>
                  </div>
                )}
                {passwordSuccess && (
                  <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-xl">
                    <p className="text-xs font-medium text-green-600 text-center">
                      {passwordSuccess}
                    </p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={passwordLoading}
                  className="flex items-center justify-center gap-2 w-full py-3 bg-primary text-white text-sm font-bold rounded-xl hover:bg-primary/90 transition-all duration-200 active:scale-[0.98] shadow-sm shadow-primary/20 disabled:opacity-60 disabled:active:scale-100"
                >
                  <KeyRound className="w-4 h-4" />
                  {passwordLoading ? "Đang cập nhật..." : "Lưu mật khẩu mới"}
                </button>
              </form>
            )}

            {/* ── Tab: Nguy hiểm ── */}
            {tab === "danger" && (
              <div className="space-y-4">
                <div className="p-5 border border-red-500/30 bg-red-500/5 rounded-xl space-y-4 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none" />

                  <div>
                    <h4 className="text-base font-bold text-red-500 flex items-center gap-2">
                      <ShieldAlert className="w-5 h-5" /> Xóa tài khoản vĩnh
                      viễn
                    </h4>
                    <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                      Hành động này{" "}
                      <strong className="text-foreground">
                        không thể hoàn tác
                      </strong>
                      . Toàn bộ dữ liệu, lịch sử kết nối và hồ sơ của bạn sẽ bị
                      xóa sạch khỏi hệ thống SkillSwap.
                    </p>
                  </div>

                  <div className="space-y-3 pt-2">
                    <div>
                      <label className="text-xs font-semibold mb-1.5 block text-muted-foreground">
                        Gõ{" "}
                        <span className="font-bold text-red-500">
                          XOA TAI KHOAN
                        </span>{" "}
                        để xác nhận
                      </label>
                      <input
                        type="text"
                        value={deleteConfirmText}
                        onChange={(e) => setDeleteConfirmText(e.target.value)}
                        placeholder="XOA TAI KHOAN"
                        className="w-full h-11 px-4 rounded-xl bg-background border border-red-500/30 outline-none text-sm transition-all duration-300 focus:border-red-500 focus:ring-4 focus:ring-red-500/10 placeholder:text-red-500/30"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold mb-1.5 block text-muted-foreground">
                        Mật khẩu xác nhận
                      </label>
                      <input
                        type="password"
                        value={deletePassword}
                        onChange={(e) => setDeletePassword(e.target.value)}
                        placeholder="Nhập mật khẩu của bạn..."
                        className="w-full h-11 px-4 rounded-xl bg-background border border-red-500/30 outline-none text-sm transition-all duration-300 focus:border-red-500 focus:ring-4 focus:ring-red-500/10"
                      />
                    </div>
                  </div>

                  {deleteError && (
                    <p className="text-xs font-medium text-red-500 bg-red-500/10 p-2.5 rounded-lg text-center">
                      {deleteError}
                    </p>
                  )}

                  <button
                    onClick={handleDeleteAccount}
                    disabled={deleteLoading}
                    className="w-full flex items-center justify-center gap-2 py-3 bg-red-500 text-white text-sm font-bold rounded-xl hover:bg-red-600 transition-all duration-200 active:scale-[0.98] shadow-sm shadow-red-500/20 disabled:opacity-60 disabled:active:scale-100"
                  >
                    <Trash2 className="w-4 h-4" />
                    {deleteLoading
                      ? "Đang xóa dữ liệu..."
                      : "Xác nhận xóa tài khoản"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
