import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../hooks/useAuth";
import { ArrowLeft, Trash2, Send, X } from "lucide-react";

const API = "http://localhost:5000/api";

export default function PostDetailPage() {
  const { id } = useParams(); // Lấy ID bài viết từ URL
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
    if (!window.confirm("Bạn có chắc chắn muốn xóa bài đăng này?")) return;
    try {
      await axios.delete(`${API}/post/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert("Xóa thành công!");
      navigate("/dashboard");
    } catch (error) {
      alert("Lỗi khi xóa bài");
    }
  };

  const handleSendMatch = async () => {
    if (!matchMessage.trim()) return alert("Vui lòng nhập lời nhắn");
    setSending(true);
    try {
      await axios.post(
        `${API}/match/send`,
        {
          receiverId: post.author._id,
          postId: post._id, // TRUYỀN ID BÀI VIẾT LÊN BACKEND ĐỂ TỰ ĐỘNG ĐÓNG BÀI
          message: matchMessage,
        },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      alert("Đã gửi lời mời kết nối thành công!");
      setShowMatchModal(false);
      setMatchMessage("");
    } catch (err: any) {
      alert(err.response?.data?.message || "Lỗi hệ thống");
    } finally {
      setSending(false);
    }
  };

  if (loading)
    return (
      <div className="p-8 text-center text-muted-foreground">Đang tải...</div>
    );
  if (!post)
    return (
      <div className="p-8 text-center text-red-400">
        Không tìm thấy bài đăng
      </div>
    );

  const isOwner = user?.id === post.author._id || user?._id === post.author._id;

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Quay lại
      </button>

      <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-2xl font-bold mb-2">{post.title}</h1>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              {/* Bấm vào tên để sang Profile */}
              <span>
                Đăng bởi:{" "}
                <strong
                  onClick={() => navigate(`/dashboard/user/${post.author._id}`)}
                  className="text-foreground cursor-pointer hover:text-primary transition-colors"
                >
                  {post.author.username}
                </strong>
              </span>
              <span>•</span>
              <span>
                {new Date(post.createdAt).toLocaleDateString("vi-VN")}
              </span>
            </div>
          </div>

          {isOwner ? (
            <button
              onClick={handleDelete}
              className="flex items-center gap-2 px-4 py-2 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-colors text-sm font-medium"
            >
              <Trash2 className="w-4 h-4" /> Xóa bài
            </button>
          ) : (
            <button
              onClick={() => setShowMatchModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium"
            >
              <Send className="w-4 h-4" /> Gửi lời mời
            </button>
          )}
        </div>

        <div className="mb-6">
          <h3 className="text-sm font-medium text-muted-foreground mb-2 uppercase tracking-wide">
            Mô tả chi tiết
          </h3>
          <p className="text-foreground whitespace-pre-wrap leading-relaxed">
            {post.description}
          </p>
        </div>

        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-2 uppercase tracking-wide">
            Kỹ năng
          </h3>
          <div className="flex flex-wrap gap-2">
            <span
              className={`text-xs px-3 py-1 rounded-full border font-medium ${
                post.type === "learning"
                  ? "bg-blue-50 text-blue-700 border-blue-100"
                  : "bg-green-50 text-green-700 border-green-100"
              }`}
            >
              {post.type === "learning" ? "🎓 Tìm học" : "📚 Dạy"}
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
        </div>
      </div>

      {/* Modal gửi lời mời */}
      {showMatchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold">Gửi lời mời kết nối</h3>
              <button onClick={() => setShowMatchModal(false)}>
                <X className="w-5 h-5 text-muted-foreground hover:text-foreground" />
              </button>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Gửi lời mời đến <strong>{post.author.username}</strong> về bài
              đăng này.
            </p>
            <textarea
              value={matchMessage}
              onChange={(e) => setMatchMessage(e.target.value)}
              placeholder="VD: Mình rất muốn học kỹ năng này của bạn..."
              rows={4}
              className="w-full px-4 py-3 rounded-xl bg-secondary border border-border outline-none text-sm mb-4"
            />
            <div className="flex gap-3">
              <button
                onClick={handleSendMatch}
                disabled={sending}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-primary text-white text-sm font-medium rounded-xl hover:bg-primary/90 disabled:opacity-60"
              >
                {sending ? "Đang gửi..." : "Gửi lời mời"}
              </button>
              <button
                onClick={() => setShowMatchModal(false)}
                className="px-4 py-2.5 border border-border text-sm rounded-xl hover:bg-secondary text-muted-foreground"
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
