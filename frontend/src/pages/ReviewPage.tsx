import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../lib/api";
import { Star, ArrowLeft, MessageSquare } from "lucide-react";
// 1. IMPORT THÊM useAuth
import { useAuth } from "../hooks/useAuth";


interface Review {
  _id: string;
  reviewer: {
    _id: string;
    username: string;
    avatar?: string;
  };
  rating: number;
  comment: string;
  createdAt: string;
}

interface UserStats {
  username: string;
  averageRating: number;
  totalReviews: number;
}

export default function ReviewPage() {
  const { userId } = useParams();
  const navigate = useNavigate();
  // 2. LẤY THÔNG TIN NGƯỜI DÙNG HIỆN TẠI
  const { user: currentUser } = useAuth();

  const [reviews, setReviews] = useState<Review[]>([]);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState<number>(0);

  // 3. XÁC ĐỊNH ID MỤC TIÊU (Có param thì xem người khác, không có thì xem chính mình)
  const targetId = userId || currentUser?.id || currentUser?._id;

  useEffect(() => {
    if (targetId) {
      fetchReviewsAndProfile();
    }
  }, [targetId]);

  const fetchReviewsAndProfile = async () => {
    try {
      setLoading(true);
      // SỬ DỤNG targetId THAY VÌ userId
      const reviewRes = await api.get(`/review/user/${targetId}`);
      const reviewData = reviewRes.data?.reviews || [];
      setReviews(reviewData);

      const profileRes = await api.get(`/profile/${targetId}`);
      if (profileRes.data?.user) {
        setUserStats({
          username: profileRes.data.user.username || "Người dùng",
          averageRating: profileRes.data.user.stats?.averageRating || 0,
          totalReviews: profileRes.data.user.stats?.totalReviews || 0,
        });
      }
    } catch (error) {
      console.error("Lỗi tải dữ liệu đánh giá:", error);
    } finally {
      setLoading(false);
    }
  };

  const totalCount = reviews.length || 0;
  const starDistribution = [0, 0, 0, 0, 0, 0];

  if (reviews && reviews.length > 0) {
    reviews.forEach((r) => {
      if (r && r.rating >= 1 && r.rating <= 5) {
        starDistribution[r.rating]++;
      }
    });
  }

  const filteredReviews =
    selectedFilter === 0
      ? reviews
      : reviews.filter((r) => r.rating === selectedFilter);

  const initials = (name?: string) =>
    name ? name.slice(0, 2).toUpperCase() : "U";

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mb-2" />
        <p className="text-sm text-muted-foreground">Đang tải thống kê...</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Quay lại
      </button>

      <h1 className="text-xl font-bold mb-6">
        Đánh giá về{" "}
        <span className="text-primary">
          {userStats?.username || "Thành viên này"}
        </span>
      </h1>

      {/* Thống kê Tổng quan */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-card border border-border rounded-2xl p-6 mb-8 shadow-sm">
        <div className="flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-border pb-6 md:pb-0">
          <p className="text-5xl font-extrabold text-foreground mb-2">
            {userStats?.averageRating || "0"}
          </p>
          <div className="flex gap-0.5 mb-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={`w-5 h-5 ${
                  i < Math.round(userStats?.averageRating || 0)
                    ? "fill-yellow-400 text-yellow-400"
                    : "text-gray-200"
                }`}
              />
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            Tổng số {userStats?.totalReviews || 0} lượt đánh giá
          </p>
        </div>

        {/* Biểu đồ phân phối */}
        <div className="col-span-2 flex flex-col gap-2 justify-center">
          {[5, 4, 3, 2, 1].map((star) => {
            const count = starDistribution[star];
            const percentage = totalCount > 0 ? (count / totalCount) * 100 : 0;

            return (
              <div key={star} className="flex items-center gap-3 text-sm">
                <button
                  onClick={() =>
                    setSelectedFilter(selectedFilter === star ? 0 : star)
                  }
                  className={`flex items-center gap-1 w-12 hover:text-primary transition-colors text-left font-medium ${selectedFilter === star ? "text-primary font-bold" : ""}`}
                >
                  {star}{" "}
                  <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400 inline" />
                </button>
                <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${selectedFilter === star ? "bg-primary" : "bg-yellow-400"}`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <span className="w-8 text-right text-xs text-muted-foreground">
                  {count}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Nút Lọc Nhanh */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        <button
          onClick={() => setSelectedFilter(0)}
          className={`px-4 py-1.5 rounded-xl text-xs font-medium border transition-all cursor-pointer whitespace-nowrap ${
            selectedFilter === 0
              ? "bg-primary text-white border-primary shadow-sm"
              : "bg-card border-border text-muted-foreground hover:text-foreground"
          }`}
        >
          Tất cả ({totalCount})
        </button>
        {[5, 4, 3, 2, 1].map((star) => (
          <button
            key={star}
            onClick={() => setSelectedFilter(star)}
            className={`px-4 py-1.5 rounded-xl text-xs font-medium border transition-all cursor-pointer whitespace-nowrap flex items-center gap-1 ${
              selectedFilter === star
                ? "bg-primary text-white border-primary shadow-sm"
                : "bg-card border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            {star} Sao ({starDistribution[star]})
          </button>
        ))}
      </div>

      {/* Danh sách bình luận */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
          <MessageSquare className="w-4 h-4" />
          <span>Danh sách bình luận ({filteredReviews.length})</span>
        </div>

        {filteredReviews.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-border rounded-2xl bg-card">
            <p className="text-sm text-muted-foreground">
              Không có đánh giá nào khớp với bộ lọc này.
            </p>
          </div>
        ) : (
          filteredReviews.map((review) => (
            <div
              key={review._id}
              className="bg-card border border-border rounded-2xl p-5 shadow-sm hover:border-primary/20 transition-colors"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-xs font-semibold text-blue-700">
                  {initials(review.reviewer?.username)}
                </div>
                <div>
                  <h4 className="text-sm font-semibold">
                    {review.reviewer?.username || "Người dùng ẩn danh"}
                  </h4>
                  <p className="text-[10px] text-muted-foreground">
                    {new Date(review.createdAt).toLocaleDateString("vi-VN")}
                  </p>
                </div>

                <div className="flex gap-0.5 ml-auto bg-secondary px-2 py-1 rounded-lg border border-border">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`w-3 h-3 ${
                        i < (review.rating || 0)
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-gray-200"
                      }`}
                    />
                  ))}
                </div>
              </div>

              {review.comment ? (
                <p className="text-sm text-foreground leading-relaxed pl-11 whitespace-pre-wrap">
                  {review.comment}
                </p>
              ) : (
                <p className="text-xs text-muted-foreground italic pl-11">
                  Người dùng không để lại lời nhắn.
                </p>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
