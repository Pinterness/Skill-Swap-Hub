import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../lib/api";
import { useAuth } from "../hooks/useAuth";
import Avatar from "../components/Avatar";
import { ArrowLeft, Send, Star, BookOpen, Award, X } from "lucide-react";


export default function PublicProfilePage() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { token, user: currentUser } = useAuth();
  const headers = { Authorization: `Bearer ${token}` };

  const [profile, setProfile] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [showMatchModal, setShowMatchModal] = useState(false);
  const [matchMessage, setMatchMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [matchSuccess, setMatchSuccess] = useState("");
  const [matchError, setMatchError] = useState("");

  useEffect(() => {
    fetchProfile();
  }, [userId]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/api/profile/${userId}`);
      setProfile(res.data.user);
      setPosts(res.data.posts || []);
      setReviews(res.data.reviews || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMatch = async () => {
    setSending(true);
    setMatchError("");
    try {
      await api.post(
        `/api/match/send`,
        {
          receiverId: userId,
          postId: null,
          message: matchMessage,
        },
        { headers },
      );
      setMatchSuccess("Đã gửi lời mời kết nối!");
      setShowMatchModal(false);
      setMatchMessage("");
    } catch (err: any) {
      setMatchError(err.response?.data?.message ?? "Lỗi hệ thống");
    } finally {
      setSending(false);
    }
  };

  if (loading)
    return (
      <div className="flex items-center justify-center h-full py-20">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );

  if (!profile)
    return (
      <div className="p-6 text-center text-muted-foreground">
        Không tìm thấy người dùng
      </div>
    );

  return (
    <div className="p-6 max-w-3xl mx-auto">
      {/* Back */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Quay lại
      </button>

      {/* Header */}
      <div className="bg-card border border-border rounded-2xl p-6 mb-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <Avatar
              avatar={profile.avatar}
              username={profile.username}
              className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center text-xl font-semibold text-blue-700"
            />
            <div>
              <h2 className="text-lg font-semibold">{profile.username}</h2>
              <div className="flex items-center gap-3 mt-1">
                {/* ĐÃ SỬA: Biến điểm sao thành nút bấm chuyển sang trang ReviewPage */}
                <span
                  onClick={() => navigate(`/dashboard/reviews/${userId}`)}
                  className="flex items-center gap-1 text-xs text-yellow-500 cursor-pointer hover:text-yellow-600 transition-colors"
                  title="Xem chi tiết tất cả đánh giá"
                >
                  <Star className="w-3.5 h-3.5 fill-yellow-500" />
                  {profile.stats?.averageRating || "—"} (
                  {profile.stats?.totalReviews || 0})
                </span>
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <BookOpen className="w-3.5 h-3.5" />
                  {profile.stats?.totalTaught ?? 0} buổi dạy
                </span>
              </div>
            </div>
          </div>

          {/* Nút gửi lời mời — ẩn nếu xem profile bản thân */}
          {currentUser?.id !== userId && (
            <button
              onClick={() => setShowMatchModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-medium rounded-xl hover:bg-primary/90 transition-colors"
            >
              <Send className="w-4 h-4" /> Gửi lời mời
            </button>
          )}
        </div>

        {matchSuccess && (
          <div className="mt-4 px-4 py-3 rounded-xl bg-green-500/10 border border-green-500/30 text-green-500 text-sm">
            {matchSuccess}
          </div>
        )}

        {/* Skills */}
        <div className="mt-5 flex flex-wrap gap-4">
          {profile.skillsOffered?.length > 0 && (
            <div>
              <p className="text-xs text-muted-foreground mb-2">Có thể dạy</p>
              <div className="flex flex-wrap gap-1.5">
                {profile.skillsOffered.map((s: string) => (
                  <span
                    key={s}
                    className="text-xs px-2.5 py-1 rounded-full bg-green-50 text-green-700 border border-green-100"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}
          {profile.skillsWanted?.length > 0 && (
            <div>
              <p className="text-xs text-muted-foreground mb-2">Muốn học</p>
              <div className="flex flex-wrap gap-1.5">
                {profile.skillsWanted.map((s: string) => (
                  <span
                    key={s}
                    className="text-xs px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-100"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Certificates */}
        {profile.certificates?.length > 0 && (
          <div className="mt-5">
            <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
              <Award className="w-3.5 h-3.5" /> Bằng cấp / Chứng chỉ
            </p>
            <div className="flex flex-col gap-2">
              {profile.certificates.map((cert: any) => (
                <div
                  key={cert._id}
                  className="text-xs bg-secondary rounded-lg px-3 py-2"
                >
                  <span className="font-medium">{cert.name}</span>
                  {cert.issuer && (
                    <span className="text-muted-foreground">
                      {" "}
                      — {cert.issuer}
                    </span>
                  )}
                  {cert.credentialUrl && (
                    <a
                      href={cert.credentialUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="ml-2 text-primary hover:underline"
                    >
                      Xem →
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Bài đăng */}
      {posts && posts.length > 0 && (
        <div className="mb-5">
          <h3 className="text-sm font-medium mb-3">
            Bài đăng của {profile.username}
          </h3>
          <div className="flex flex-col gap-3">
            {posts.map((post) => (
              <div
                key={post._id}
                className="bg-card border border-border rounded-xl p-4 cursor-pointer hover:border-primary/40 transition-colors"
                onClick={() => navigate(`/dashboard/post/${post._id}`)}
              >
                <h4 className="text-sm font-medium mb-1 group-hover:text-primary transition-colors">
                  {post.title}
                </h4>
                <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
                  {post.description}
                </p>

                <div className="flex flex-wrap gap-1.5">
                  {post.type && (
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${
                        post.type === "learning"
                          ? "bg-blue-50 text-blue-700 border-blue-100"
                          : "bg-green-50 text-green-700 border-green-100"
                      }`}
                    >
                      {post.type === "learning" ? "🎓 Tìm học" : "📚 Dạy"}
                    </span>
                  )}
                  {post.skill?.field && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary border border-border text-muted-foreground">
                      {post.skill.field}
                    </span>
                  )}
                  {post.skill?.level && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary border border-border text-muted-foreground">
                      {post.skill.level}
                    </span>
                  )}
                  {post.skill?.name && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 font-medium">
                      {post.skill.name}
                    </span>
                  )}
                  {post.skillsRequired?.map((s: string) => (
                    <span
                      key={`req-${s}`}
                      className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100"
                    >
                      {s}
                    </span>
                  ))}
                  {post.skillsOffered?.map((s: string) => (
                    <span
                      key={`off-${s}`}
                      className="text-[10px] px-2 py-0.5 rounded-full bg-green-50 text-green-700 border border-green-100"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Đánh giá */}
      {reviews.length > 0 && (
        <div>
          {/* ĐÃ SỬA: Thêm nút Xem tất cả */}
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium">
              Đánh giá ({profile.stats?.totalReviews || reviews.length})
            </h3>
            <button
              onClick={() => navigate(`/dashboard/reviews/${userId}`)}
              className="text-xs font-medium text-primary hover:underline"
            >
              Xem tất cả →
            </button>
          </div>

          <div className="flex flex-col gap-3">
            {reviews.map((review) => (
              <div
                key={review._id}
                className="bg-card border border-border rounded-xl p-4"
              >
                <div className="flex items-center gap-2 mb-2">
                  <Avatar
                    avatar={review.reviewer.avatar}
                    username={review.reviewer.username}
                    className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-[10px] font-medium text-blue-700"
                  />
                  <span className="text-xs font-medium">
                    {review.reviewer.username}
                  </span>
                  <div className="flex gap-0.5 ml-auto">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`w-3 h-3 ${i < review.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-200"}`}
                      />
                    ))}
                  </div>
                </div>
                {review.comment && (
                  <p className="text-xs text-muted-foreground">
                    {review.comment}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

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
              Gửi lời mời đến <strong>{profile.username}</strong> kèm lời nhắn
              để họ hiểu bạn muốn trao đổi gì.
            </p>
            <textarea
              value={matchMessage}
              onChange={(e) => setMatchMessage(e.target.value)}
              placeholder="VD: Mình muốn học ReactJS và có thể dạy lại Tiếng Anh giao tiếp cho bạn..."
              rows={4}
              className="w-full px-4 py-3 rounded-xl bg-secondary border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none text-sm text-foreground placeholder:text-muted-foreground resize-none mb-4"
            />
            {matchError && (
              <div className="mb-3 px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                {matchError}
              </div>
            )}
            <div className="flex gap-3">
              <button
                onClick={handleSendMatch}
                disabled={sending}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-primary text-white text-sm font-medium rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-60"
              >
                <Send className="w-4 h-4" />
                {sending ? "Đang gửi..." : "Gửi lời mời"}
              </button>
              <button
                onClick={() => setShowMatchModal(false)}
                className="px-4 py-2.5 border border-border text-sm rounded-xl hover:bg-secondary transition-colors text-muted-foreground"
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
