import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../hooks/useAuth";
import { ArrowLeft, Trash2, Send, X, AlertCircle, Clock } from "lucide-react";

const API = "http://localhost:5000/api";

export default function PostDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const [post, setPost] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // States cho Modal gửi lời mời
  const [showMatchModal, setShowMatchModal] = useState(false);
  const [matchMessage, setMatchMessage] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`${API}/post/${id}`);
        setPost(res.data.post);
      } catch (error) {
        console.error("Lỗi lấy bài viết:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchPost();
  }, [id]);

  const handleDelete = async () => {
    if (
      !window.confirm(
        "Bạn có chắc chắn muốn xóa bài đăng này? Hành động này không thể hoàn tác.",
      )
    )
      return;
    try {
      await axios.delete(`${API}/post/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert("Xóa thành công!");
      navigate("/dashboard", { replace: true });
    } catch (error) {
      alert("Lỗi khi xóa bài");
    }
  };

  const handleSendMatch = async () => {
    if (!matchMessage.trim())
      return alert(
        "Vui lòng nhập lời nhắn để đối phương hiểu rõ nhu cầu của bạn",
      );
    setSending(true);
    try {
      await axios.post(
        `${API}/match/send`,
        {
          receiverId: post.author._id,
          postId: post._id,
          message: matchMessage,
        },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      alert(
        "Đã gửi lời mời kết nối thành công! Vui lòng chờ đối phương phản hồi.",
      );
      setShowMatchModal(false);
      setMatchMessage("");
    } catch (err: any) {
      alert(err.response?.data?.message || "Lỗi hệ thống");
    } finally {
      setSending(false);
    }
  };

  const initials = (name: string) =>
    name ? name.slice(0, 2).toUpperCase() : "U";

  // UX: Hiệu ứng tải trang (Skeleton Loader) giống Facebook/X
  if (loading) {
    return (
      <div className="p-6 max-w-3xl mx-auto animate-pulse">
        <div className="h-6 w-24 bg-secondary rounded mb-6"></div>
        <div className="bg-card border border-border rounded-2xl p-6">
          <div className="flex gap-4 items-center mb-6">
            <div className="w-12 h-12 bg-secondary rounded-full"></div>
            <div className="space-y-2 flex-1">
              <div className="h-4 w-1/3 bg-secondary rounded"></div>
              <div className="h-3 w-1/4 bg-secondary rounded"></div>
            </div>
          </div>
          <div className="h-8 w-3/4 bg-secondary rounded mb-4"></div>
          <div className="space-y-2 mb-6">
            <div className="h-4 w-full bg-secondary rounded"></div>
            <div className="h-4 w-full bg-secondary rounded"></div>
            <div className="h-4 w-2/3 bg-secondary rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  // UX: Trạng thái không tìm thấy thân thiện
  if (!post) {
    return (
      <div className="p-6 max-w-3xl mx-auto flex flex-col items-center justify-center min-h-[50vh] text-center">
        <AlertCircle className="w-16 h-16 text-muted-foreground/50 mb-4" />
        <h2 className="text-xl font-semibold mb-2">Bài đăng không tồn tại</h2>
        <p className="text-muted-foreground mb-6">
          Có thể bài đăng đã bị xóa hoặc người tạo đã đóng kết nối.
        </p>
        <button
          onClick={() => navigate("/dashboard", { replace: true })}
          className="px-6 py-2 bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors font-medium"
        >
          Trở về trang chủ
        </button>
      </div>
    );
  }

  const isOwner = user?.id === post.author._id || user?._id === post.author._id;

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors w-fit"
      >
        <ArrowLeft className="w-4 h-4" /> Trở lại
      </button>

      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
        {/* Header: Thông tin người dùng */}
        <div className="p-6 border-b border-border bg-secondary/30 flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div
              className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center text-sm font-bold text-green-700 cursor-pointer shadow-sm"
              onClick={() => navigate(`/dashboard/user/${post.author._id}`)}
            >
              {initials(post.author.username)}
            </div>
            <div>
              <h3
                onClick={() => navigate(`/dashboard/user/${post.author._id}`)}
                className="font-semibold text-foreground hover:text-primary cursor-pointer transition-colors"
              >
                {post.author.username}
              </h3>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                <Clock className="w-3.5 h-3.5" />
                {new Date(post.createdAt).toLocaleString("vi-VN", {
                  hour: "2-digit",
                  minute: "2-digit",
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                })}
              </div>
            </div>
          </div>
          {isOwner && (
            <button
              onClick={handleDelete}
              className="flex items-center gap-2 px-3 py-1.5 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-colors text-sm font-medium"
              title="Xóa bài viết"
            >
              <Trash2 className="w-4 h-4" /> Xóa
            </button>
          )}
        </div>

        {/* Body: Nội dung bài viết */}
        <div className="p-6">
          <h1 className="text-2xl font-bold mb-4 text-foreground leading-tight">
            {post.title}
          </h1>

          <div className="flex flex-wrap gap-2 mb-6">
            <span
              className={`text-xs px-3 py-1 rounded-full border font-medium flex items-center gap-1 ${
                post.type === "learning"
                  ? "bg-blue-50 text-blue-700 border-blue-100"
                  : "bg-green-50 text-green-700 border-green-100"
              }`}
            >
              {post.type === "learning"
                ? "🎓 Đang tìm người dạy"
                : "📚 Đang mở lớp dạy"}
            </span>
            <span className="text-xs px-3 py-1 rounded-full bg-secondary border border-border text-muted-foreground">
              {post.skill?.field}
            </span>
            <span className="text-xs px-3 py-1 rounded-full bg-secondary border border-border text-muted-foreground">
              {post.skill?.level}
            </span>
            <span className="text-xs px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 font-medium">
              {post.skill?.name}
            </span>
          </div>

          <p className="text-foreground/90 whitespace-pre-wrap leading-relaxed text-[15px]">
            {post.description}
          </p>
        </div>

        {/* Footer: Hành động (Chỉ hiện nếu không phải chủ bài đăng) */}
        {!isOwner && (
          <div className="p-4 border-t border-border bg-secondary/20">
            <button
              onClick={() => setShowMatchModal(true)}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors font-medium shadow-sm hover:shadow"
            >
              <Send className="w-4 h-4" /> Kết nối ngay
            </button>
          </div>
        )}
      </div>

      {/* Modal gửi lời mời (Giữ nguyên hoặc bo góc mềm mại hơn) */}
      {showMatchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/60 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-md shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">Gửi lời mời kết nối</h3>
              <button
                onClick={() => setShowMatchModal(false)}
                className="p-1 rounded-full hover:bg-secondary transition-colors"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Gửi một lời nhắn thân thiện tới{" "}
              <strong>{post.author.username}</strong> để tăng tỉ lệ được đồng ý
              nhé.
            </p>
            <textarea
              value={matchMessage}
              onChange={(e) => setMatchMessage(e.target.value)}
              placeholder="VD: Chào bạn, mình rất ấn tượng với kỹ năng của bạn và muốn xin học..."
              rows={4}
              className="w-full px-4 py-3 rounded-xl bg-secondary/50 border border-border focus:border-primary outline-none text-sm mb-4 resize-none transition-colors"
              autoFocus
            />
            <div className="flex gap-3">
              <button
                onClick={handleSendMatch}
                disabled={sending || !matchMessage.trim()}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-primary text-white text-sm font-medium rounded-xl hover:bg-primary/90 disabled:opacity-50 transition-all"
              >
                {sending ? "Đang gửi..." : "Gửi lời mời"}
              </button>
              <button
                onClick={() => setShowMatchModal(false)}
                className="px-6 py-2.5 border border-border text-sm font-medium rounded-xl hover:bg-secondary text-muted-foreground transition-colors"
              >
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
