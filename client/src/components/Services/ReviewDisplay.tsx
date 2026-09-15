// client/src/components/Services/ReviewDisplay.tsx
import { useEffect, useState } from "react";
import axios from "axios";
import BASE_URL from "../../api/api";
import { Star, Trash2, Edit } from "lucide-react";

interface Review {
  id: number;
  serviceId: number;
  userId?: number;
  userName: string;
  userEmail?: string;
  rating: number;
  comment?: string;
  createdAt: string;
  updatedAt?: string;
}

interface ReviewDisplayProps {
  serviceId: number;
  currentUserId?: number;
  currentUserEmail?: string;
  onReviewUpdate?: () => void;
}

const ReviewDisplay = ({ serviceId, currentUserId, currentUserEmail, onReviewUpdate }: ReviewDisplayProps) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editComment, setEditComment] = useState("");
  const [editRating, setEditRating] = useState(5);

  // Safely get token
  const getToken = (): string | undefined => {
    try {
      return localStorage.getItem("token") || undefined;
    } catch {
      return undefined;
    }
  };

  const token = getToken();

  // Fetch reviews with proper error handling
  const fetchReviews = async () => {
    if (!serviceId || isNaN(parseInt(String(serviceId))) || serviceId <= 0) {
      setError("Invalid service ID");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await axios.get(`${BASE_URL}/reviews/service/${serviceId}`, {
        timeout: 15000,
        validateStatus: () => true, // Don't throw on any status
      });

      if (response.status >= 200 && response.status < 300) {
        const data = response.data;
        
        // Validate and sanitize review data
        if (Array.isArray(data)) {
          const sanitizedReviews: Review[] = data.map((review: any) => ({
            id: parseInt(String(review.id)) || 0,
            serviceId: parseInt(String(review.serviceId)) || serviceId,
            userId: review.userId ? parseInt(String(review.userId)) : undefined,
            userName: String(review.userName || review.reviewerName || "Anonymous"),
            userEmail: review.userEmail || review.reviewerEmail || undefined,
            rating: Math.min(Math.max(parseInt(String(review.rating)) || 0, 1), 5),
            comment: review.comment ? String(review.comment) : undefined,
            createdAt: String(review.createdAt || review.created_at || ""),
            updatedAt: review.updatedAt || review.updated_at || undefined,
          })).filter((review: Review) => review.id > 0); // Filter out invalid reviews

          setReviews(sanitizedReviews);
        } else {
          setReviews([]);
        }
      } else {
        setError("Failed to load reviews");
        setReviews([]);
      }
    } catch (err: any) {
      console.error("Error fetching reviews:", err);
      setError("Failed to load reviews");
      setReviews([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [serviceId]);

  const handleDelete = async (reviewId: number) => {
    if (!token) {
      alert("Please login to delete reviews");
      return;
    }

    if (!window.confirm("Are you sure you want to delete this review?")) {
      return;
    }

    try {
      const response = await axios.delete(`${BASE_URL}/reviews/${reviewId}`, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 15000,
        validateStatus: () => true,
      });

      if (response.status >= 200 && response.status < 300) {
        fetchReviews();
        onReviewUpdate?.();
      } else {
        const errorMsg = response.data?.msg || response.data?.error || "Failed to delete review";
        alert(errorMsg);
      }
    } catch (err: any) {
      console.error("Error deleting review:", err);
      alert("Failed to delete review. Please try again.");
    }
  };

  const handleEditStart = (review: Review) => {
    setEditingId(review.id);
    setEditComment(review.comment || "");
    setEditRating(review.rating);
  };

  const handleEditCancel = () => {
    setEditingId(null);
    setEditComment("");
    setEditRating(5);
  };

  const handleEditSave = async (reviewId: number) => {
    if (!token) {
      alert("Please login to edit reviews");
      return;
    }

    // Validate rating
    if (editRating < 1 || editRating > 5) {
      alert("Rating must be between 1 and 5");
      return;
    }

    try {
      const response = await axios.put(
        `${BASE_URL}/reviews/${reviewId}`,
        { 
          rating: parseInt(String(editRating)),
          comment: editComment.trim() || null 
        },
        { 
          headers: { Authorization: `Bearer ${token}` },
          timeout: 15000,
          validateStatus: () => true,
        }
      );

      if (response.status >= 200 && response.status < 300) {
        setEditingId(null);
        fetchReviews();
        onReviewUpdate?.();
      } else {
        const errorMsg = response.data?.msg || response.data?.error || "Failed to update review";
        alert(errorMsg);
      }
    } catch (err: any) {
      console.error("Error updating review:", err);
      alert("Failed to update review. Please try again.");
    }
  };

  const canEditReview = (review: Review): boolean => {
    if (!token) return false;
    return review.userId === currentUserId || 
           (!review.userId && review.userEmail === currentUserEmail);
  };

  const StarRating = ({ rating, size = 16, interactive = false, onRatingChange }: {
    rating: number;
    size?: number;
    interactive?: boolean;
    onRatingChange?: (rating: number) => void;
  }) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={size}
            className={interactive ? "cursor-pointer transition-transform hover:scale-110" : ""}
            fill={star <= fullStars ? "#D4AF37" : star === fullStars + 1 && hasHalfStar ? "#D4AF37" : "none"}
            stroke={star <= fullStars || (star === fullStars + 1 && hasHalfStar) ? "#D4AF37" : "#d1d5db"}
            color={star <= fullStars || (star === fullStars + 1 && hasHalfStar) ? "#D4AF37" : "#d1d5db"}
            onClick={() => interactive && onRatingChange?.(star)}
          />
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="bg-white border rounded-lg p-6 shadow-md">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#D4AF37] mx-auto mb-2"></div>
          <p className="text-gray-500">Loading reviews...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white border rounded-lg p-6 shadow-md">
        <div className="text-center py-8">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={fetchReviews}
            className="px-4 py-2 bg-[#D4AF37] text-[#1c2b21] rounded-lg font-semibold hover:bg-[#b8962f] transition"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <div className="bg-white border rounded-lg p-6 shadow-md">
        <div className="text-center py-8">
          <p className="text-gray-500">No reviews yet. Be the first to review!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border rounded-lg p-6 shadow-md">
      <h3 className="text-xl font-bold text-[#1c2b21] mb-6">
        Reviews ({reviews.length})
      </h3>
      
      <div className="space-y-4">
        {reviews.map((review) => {
          const isEditing = editingId === review.id;
          const canEdit = canEditReview(review);

          return (
            <div
              key={review.id}
              className="border rounded-lg p-4 shadow-sm hover:shadow-md transition"
            >
              {isEditing ? (
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium mb-1">Rating</label>
                    <StarRating
                      rating={editRating}
                      interactive={true}
                      onRatingChange={setEditRating}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Comment</label>
                    <textarea
                      value={editComment}
                      onChange={(e) => setEditComment(e.target.value)}
                      className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                      rows={3}
                      maxLength={1000}
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEditSave(review.id)}
                      className="px-4 py-2 bg-[#D4AF37] text-[#1c2b21] rounded-lg font-semibold hover:bg-[#b8962f] transition"
                    >
                      Save
                    </button>
                    <button
                      onClick={handleEditCancel}
                      className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg font-semibold hover:bg-gray-300 transition"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <p className="font-semibold text-[#1c2b21]">{review.userName}</p>
                        <StarRating rating={review.rating} size={18} />
                      </div>
                      {review.comment && (
                        <p className="text-gray-700 mt-2">{review.comment}</p>
                      )}
                      <p className="text-xs text-gray-500 mt-2">
                        {review.createdAt ? new Date(review.createdAt).toLocaleDateString() : "Date unknown"}
                      </p>
                    </div>
                    
                    {canEdit && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEditStart(review)}
                          className="p-1 text-gray-600 hover:text-[#D4AF37] transition"
                          title="Edit review"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(review.id)}
                          className="p-1 text-gray-600 hover:text-red-600 transition"
                          title="Delete review"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ReviewDisplay;







































