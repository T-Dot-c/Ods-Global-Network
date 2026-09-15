// client/src/components/Services/ReviewForm.tsx
import { useState } from "react";
import axios from "axios";
import BASE_URL from "../../api/api";
import { Star } from "lucide-react";

interface ReviewFormProps {
  serviceId: number;
  onSubmitSuccess?: () => void;
  userEmail?: string;
}

const ReviewForm = ({ serviceId, onSubmitSuccess, userEmail }: ReviewFormProps) => {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Safely get token and user
  const getToken = (): string | undefined => {
    try {
      return localStorage.getItem("token") || undefined;
    } catch {
      return undefined;
    }
  };

  const getCurrentUser = () => {
    try {
      const userStr = localStorage.getItem("user");
      if (!userStr) return null;
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  };

  const token = getToken();
  const currentUser = getCurrentUser();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    // Validation
    if (rating < 1 || rating > 5) {
      setError("Please select a rating between 1 and 5 stars");
      return;
    }

    // Ensure serviceId is valid
    const numericServiceId = typeof serviceId === 'string' ? parseInt(serviceId, 10) : serviceId;
    if (isNaN(numericServiceId) || numericServiceId <= 0) {
      setError("Invalid service ID");
      return;
    }

    setSubmitting(true);

    try {
      // Build headers
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };

      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      // Prepare request body
      const requestBody = {
        serviceId: numericServiceId,
        rating: parseInt(String(rating)),
        comment: comment.trim() || null,
        userEmail: userEmail || currentUser?.email || null,
      };

      // Make the request
      const response = await axios.post(
        `${BASE_URL}/reviews`,
        requestBody,
        { 
          headers,
          timeout: 15000,
          validateStatus: () => true, // Don't throw on any status
        }
      );

      // Check response status
      if (response.status >= 200 && response.status < 300) {
        // Success
        setSuccess(true);
        setRating(5);
        setComment("");
        setError("");

        // Call success callback
        if (onSubmitSuccess) {
          setTimeout(() => {
            onSubmitSuccess();
          }, 500);
        } else {
          setTimeout(() => {
            setSuccess(false);
          }, 3000);
        }
      } else {
        // Handle error response
        let errorMessage = "Failed to submit review. Please try again.";
        
        if (response.status === 400) {
          const data = response.data;
          if (data && typeof data === 'object') {
            errorMessage = data.msg || data.error || errorMessage;
          } else if (typeof data === 'string') {
            errorMessage = data.substring(0, 200);
          }
        } else if (response.status === 401) {
          errorMessage = "Authentication required. Please log in and try again.";
        } else if (response.status === 404) {
          errorMessage = "Service not found.";
        } else if (response.status === 500) {
          errorMessage = "Server error. Please try again later.";
        }

        setError(errorMessage);
      }
    } catch (err: any) {
      console.error("Error submitting review:", err);
      
      let errorMessage = "Failed to submit review. Please try again.";
      
      if (err.response) {
        // Server responded with error
        const status = err.response.status;
        const data = err.response.data;
        
        if (status === 400) {
          if (data && typeof data === 'object') {
            errorMessage = data.msg || data.error || errorMessage;
          }
        } else if (status === 401) {
          errorMessage = "Authentication required. Please log in and try again.";
        } else if (status === 404) {
          errorMessage = "Service not found.";
        } else if (status === 500) {
          errorMessage = "Server error. Please try again later.";
        }
      } else if (err.request) {
        // Request made but no response
        errorMessage = "Cannot connect to server. Please check your connection.";
      } else if (err.message) {
        if (err.message.includes("timeout")) {
          errorMessage = "Request timed out. Please try again.";
        } else if (err.message.includes("Network Error")) {
          errorMessage = "Network error. Please check your internet connection.";
        }
      }
      
      setError(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const StarRating = ({ rating, onRatingChange }: {
    rating: number;
    onRatingChange: (rating: number) => void;
  }) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={28}
            className="cursor-pointer transition-transform hover:scale-110"
            fill={star <= rating ? "#D4AF37" : "none"}
            stroke={star <= rating ? "#D4AF37" : "#d1d5db"}
            color={star <= rating ? "#D4AF37" : "#d1d5db"}
            onClick={() => onRatingChange(star)}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="bg-white border rounded-lg p-6 shadow-md">
      <h3 className="text-xl font-bold text-[#1c2b21] mb-4">Write a Review</h3>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Your Rating</label>
          <StarRating rating={rating} onRatingChange={setRating} />
          <p className="text-xs text-gray-500 mt-1">
            {rating === 1 && "Poor"}
            {rating === 2 && "Fair"}
            {rating === 3 && "Good"}
            {rating === 4 && "Very Good"}
            {rating === 5 && "Excellent"}
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Your Review (Optional)</label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Share your experience with this service..."
            className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
            rows={4}
            maxLength={1000}
          />
          <p className="text-xs text-gray-500 mt-1">{comment.length}/1000 characters</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <p className="text-sm text-green-600">
              ✓ Review submitted successfully! It will be visible once approved.
            </p>
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full px-6 py-3 bg-[#D4AF37] text-[#1c2b21] font-bold rounded-lg hover:bg-[#b8962f] transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? "Submitting..." : "Submit Review"}
        </button>
      </form>
    </div>
  );
};

export default ReviewForm;







































