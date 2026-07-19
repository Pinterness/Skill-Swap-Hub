import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Mail, Lock, User, ArrowRight, X, Loader2 } from "lucide-react";
import api from "../../lib/api";

interface AuthFormProps {
  onClose?: () => void;
  defaultTab?: "login" | "register";
  onSuccess?: () => void;
}

export default function AuthForm({
  onClose,
  defaultTab = "login",
  onSuccess,
}: AuthFormProps) {
  const [isLogin, setIsLogin] = useState(defaultTab === "login");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isLogin) {
        // Gọi API đăng nhập
        // Deploy config: auth endpoint uses VITE_API_URL.
        const res = await api.post(`/api/auth/login`, {
          email,
          password,
        });
        localStorage.setItem("token", res.data.token);
        localStorage.setItem("user", JSON.stringify(res.data.user));
        alert("Đăng nhập thành công!");

        onSuccess?.(); // <-- CHỈ THÊM DÒNG NÀY ĐỂ CHUYỂN TRANG
        onClose?.();
      } else {
        // Gọi API đăng ký
        const res = await api.post(
          // Deploy config: auth endpoint uses VITE_API_URL.
          `/api/auth/register`,
          { username, email, password },
        );
        localStorage.setItem("token", res.data.token);
        localStorage.setItem("user", JSON.stringify(res.data.user));
        alert("Đăng ký thành công!");

        onSuccess?.(); // <-- CHỈ THÊM DÒNG NÀY ĐỂ CHUYỂN TRANG
        onClose?.();
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Lỗi hệ thống, thử lại sau");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto relative z-10">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card border border-border rounded-3xl p-8 shadow-2xl relative overflow-hidden"
      >
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-muted-foreground hover:text-primary transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold font-['Outfit'] text-foreground mb-2">
            {isLogin ? "Chào mừng trở lại" : "Tạo tài khoản mới"}
          </h2>
          <p className="text-muted-foreground text-sm">
            {isLogin
              ? "Đăng nhập để tiếp tục trao đổi kỹ năng"
              : "Tham gia cộng đồng SkillSwap Hub ngay hôm nay"}
          </p>
        </div>

        {/* Tabs */}
        <div className="flex p-1 bg-background rounded-xl mb-8 relative">
          <div
            className={`absolute inset-y-1 w-[calc(50%-4px)] bg-secondary rounded-lg transition-all duration-300 ease-out shadow-sm ${isLogin ? "left-1" : "left-[calc(50%+2px)]"}`}
          />
          <button
            type="button"
            onClick={() => {
              setIsLogin(true);
              setError("");
            }}
            className={`flex-1 py-2 text-sm font-medium z-10 transition-colors cursor-pointer ${isLogin ? "text-foreground" : "text-muted-foreground hover:text-foreground"}`}
          >
            Đăng nhập
          </button>
          <button
            type="button"
            onClick={() => {
              setIsLogin(false);
              setError("");
            }}
            className={`flex-1 py-2 text-sm font-medium z-10 transition-colors cursor-pointer ${!isLogin ? "text-foreground" : "text-muted-foreground hover:text-foreground"}`}
          >
            Đăng ký
          </button>
        </div>

        {/* Hiển thị lỗi */}
        {error && (
          <div className="mb-4 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <AnimatePresence mode="popLayout">
            {!isLogin && (
              <motion.div
                initial={{ opacity: 0, height: 0, translateY: -10 }}
                animate={{ opacity: 1, height: "auto", translateY: 0 }}
                exit={{ opacity: 0, height: 0, translateY: -10 }}
                transition={{ duration: 0.2 }}
                className="relative"
              >
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                  <User className="w-5 h-5" />
                </div>
                <input
                  type="text"
                  placeholder="Tên hiển thị (Username)"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full h-12 pl-12 pr-4 bg-background border border-border rounded-xl focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-foreground text-sm"
                  required={!isLogin}
                />
              </motion.div>
            )}
          </AnimatePresence>

          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
              <Mail className="w-5 h-5" />
            </div>
            <input
              type="email"
              placeholder="Địa chỉ Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full h-12 pl-12 pr-4 bg-background border border-border rounded-xl focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-foreground text-sm"
              required
            />
          </div>

          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
              <Lock className="w-5 h-5" />
            </div>
            <input
              type="password"
              placeholder="Mật khẩu"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full h-12 pl-12 pr-4 bg-background border border-border rounded-xl focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-foreground text-sm"
              required
            />
          </div>

          {isLogin && (
            <div className="text-right">
              <a
                href="#"
                className="text-xs text-primary hover:underline font-medium"
              >
                Quên mật khẩu?
              </a>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full h-12 mt-6 bg-primary text-primary-foreground font-medium rounded-xl hover:bg-primary/90 transition-all shadow-[0_0_20px_rgba(255,107,74,0.15)] hover:shadow-[0_0_30px_rgba(255,107,74,0.3)] hover:-translate-y-0.5 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                {isLogin ? "Đăng nhập vào hệ thống" : "Tạo tài khoản"}
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
