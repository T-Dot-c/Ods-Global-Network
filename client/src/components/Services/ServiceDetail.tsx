// client/src/components/Services/ServiceDetail.tsx
import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import BASE_URL from "../../api/api";
import { ArrowLeft, ShoppingCart, Gift, Star, Loader2 } from "lucide-react";

interface Service {
  id: number;
  title: string;
  description?: string;
  category: string;
  subcategory?: string;
  price: number;
  discount?: number;
  discountedPrice?: number;
  location?: string;
  duration?: string;
  imageUrl?: string;
  providerName?: string;
  providerId?: number;
  rating?: number;
  reviewCount?: number;
}

interface ServiceReview {
  id: number;
  reviewerId: number;
  reviewerName?: string;
  rating: number;
  comment?: string | null;
  createdAt: string;
  updatedAt?: string;
}

const ServiceDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [service, setService] = useState<Service | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reviews, setReviews] = useState<ServiceReview[]>([]);
  const [averageRating, setAverageRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);
  const [userRating, setUserRating] = useState(0);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [userComment, setUserComment] = useState("");
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewError, setReviewError] = useState("");
  const [reviewSuccess, setReviewSuccess] = useState("");

  // Safely get user from localStorage
  const getCurrentUser = () => {
    try {
      const userStr = localStorage.getItem("user");
      if (!userStr) return null;
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  };

  const currentUser = getCurrentUser();

  // Build image URL safely
  const getImageUrl = (imageUrl?: string): string => {
    if (!imageUrl || imageUrl.trim() === '') {
      return "/placeholder.png";
    }
    
    // If already a full URL, normalize it
    if (imageUrl.startsWith('http')) {
      // Fix URLs that have /api/uploads/ instead of /uploads/
      if (imageUrl.includes('/api/uploads/')) {
        imageUrl = imageUrl.replace('/api/uploads/', '/uploads/');
      }
      // Normalize wanaw.et to www.odsglobal.net
      if (imageUrl.includes('odsglobal.net') && !imageUrl.includes('www.odsglobal.net')) {
        imageUrl = imageUrl.replace(/https?:\/\/(?:www\.)?wanaw\.et/g, 'https://www.odsglobal.net');
      }
      return imageUrl;
    }
    
    // For relative paths, construct the full URL
    let serverBase: string;
    if (BASE_URL.startsWith('http')) {
      // Production: BASE_URL is full URL like "https://www.odsglobal.net/api"
      serverBase = BASE_URL.replace('/api', '').replace(/\/$/, '');
    } else {
      // Development: BASE_URL is "/api", use localhost server directly
      serverBase = 'http://localhost:5000';
    }
    
    const imagePath = imageUrl.startsWith('/') ? imageUrl : `/${imageUrl}`;
    return `${serverBase}${imagePath}`;
  };

  // Fetch service data with proper error handling
  const fetchService = useCallback(async () => {
    if (!id || isNaN(parseInt(id))) {
      setError("Invalid service ID");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");
      
      console.log("🔍 Fetching service with ID:", id);
      console.log("🔍 API URL:", `${BASE_URL}/services/${id}`);
      
      const response = await axios.get(`${BASE_URL}/services/${id}`, {
        timeout: 15000,
        validateStatus: () => true, // Don't throw on any status
      });
      
        console.log("📥 Response status:", response.status);
        console.log("📥 Response data:", response.data);
        console.log("📥 Response data type:", typeof response.data);
        if (response.data && typeof response.data === 'object') {
          console.log("📥 Response data keys:", Object.keys(response.data));
          console.log("📥 Response data.msg:", response.data.msg);
          console.log("📥 Response data.error:", response.data.error);
        }

      // Check if response is valid
      if (response.status >= 200 && response.status < 300) {
        const data = response.data;
        
        // Validate response data structure
        if (!data || typeof data !== 'object') {
          console.error("❌ Invalid response format:", data);
          setError("Invalid response format from server");
          setService(null);
          return;
        }

        console.log("✅ Valid response received, building service object");

        // Build service object with safe defaults
        const serviceData: Service = {
          id: data.id || parseInt(id),
          title: String(data.title || "Untitled Service"),
          description: data.description ? String(data.description) : undefined,
          category: String(data.category || "Unknown"),
          subcategory: data.subcategory ? String(data.subcategory) : undefined,
          price: parseFloat(String(data.price)) || 0,
          discount: data.discount !== undefined && data.discount !== null ? parseFloat(String(data.discount)) : undefined,
          discountedPrice: data.discountedPrice !== undefined && data.discountedPrice !== null ? parseFloat(String(data.discountedPrice)) : undefined,
          location: data.location ? String(data.location) : undefined,
          duration: data.duration ? String(data.duration) : undefined,
          imageUrl: data.imageUrl ? String(data.imageUrl) : undefined,
          providerName: data.providerName ? String(data.providerName) : undefined,
          providerId: data.providerId || data.providerUserId || undefined,
          rating: data.rating !== undefined && data.rating !== null ? parseFloat(String(data.rating)) : 0,
          reviewCount: data.reviewCount !== undefined && data.reviewCount !== null ? parseInt(String(data.reviewCount)) : 0,
        };

        console.log("✅ Service data built:", serviceData);
        setService(serviceData);
        setError("");
      } else {
        // Handle error responses
        console.error("❌ Error response status:", response.status);
        console.error("❌ Error response data:", response.data);
        
        let errorMessage = "Failed to load service details";
        
        if (response.status === 404) {
          errorMessage = "Service not found";
        } else if (response.status === 500) {
          // Try to extract error message safely
          const errorData = response.data;
          console.log("📥 Full error data:", JSON.stringify(errorData, null, 2));
          
          if (errorData && typeof errorData === 'object') {
            // Prioritize specific error messages
            if (errorData.sqlError) {
              errorMessage = `Database error: ${errorData.sqlError}`;
            } else if (errorData.error) {
              errorMessage = `Server error: ${errorData.error}`;
            } else if (errorData.msg) {
              errorMessage = errorData.msg;
            } else {
              errorMessage = "Server error. Please try again later.";
            }
          } else if (typeof errorData === 'string') {
            // If error is a string, use it but limit length
            errorMessage = errorData.substring(0, 200);
          } else {
            errorMessage = "Server error. Please try again later.";
          }
        } else if (response.status === 400) {
          const errorData = response.data;
          if (errorData && typeof errorData === 'object') {
            errorMessage = errorData.msg || errorData.error || "Invalid request";
          } else {
            errorMessage = "Invalid request";
          }
        } else {
          errorMessage = `Error ${response.status}: Failed to load service`;
          const errorData = response.data;
          if (errorData && typeof errorData === 'object') {
            errorMessage = errorData.msg || errorData.error || errorMessage;
          }
        }
        
        console.error("❌ Setting error:", errorMessage);
        setError(errorMessage);
        setService(null);
      }
    } catch (err: any) {
      console.error("❌ Exception caught:", err);
      console.error("❌ Error message:", err.message);
      console.error("❌ Error response:", err.response);
      console.error("❌ Error request:", err.request);
      
      let errorMessage = "Failed to load service details";
      
      if (err.response) {
        // Server responded with error
        const status = err.response.status;
        const data = err.response.data;
        
        console.error("❌ Server error status:", status);
        console.error("❌ Server error data:", data);
        
        if (status === 404) {
          errorMessage = "Service not found";
        } else if (status === 500) {
          if (data && typeof data === 'object') {
            errorMessage = data.msg || data.error || "Server error. Please try again later.";
          } else {
            errorMessage = "Server error. Please try again later.";
          }
        } else if (status === 400) {
          if (data && typeof data === 'object') {
            errorMessage = data.msg || data.error || "Invalid request";
          } else {
            errorMessage = "Invalid request";
          }
        } else {
          errorMessage = `Error ${status}: Failed to load service`;
        }
      } else if (err.request) {
        // Request was made but no response received
        console.error("❌ No response received");
        errorMessage = "Network error. Please check your connection and make sure the server is running.";
      } else {
        // Something else happened
        console.error("❌ Request setup error:", err.message);
        errorMessage = err.message || "An unexpected error occurred";
      }
      
      console.error("❌ Final error message:", errorMessage);
      setError(errorMessage);
      setService(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      fetchService();
    }
  }, [id, fetchService]);

  const fetchReviews = useCallback(async () => {
    if (!id) return;

    try {
      setReviewError("");
      const response = await axios.get(`${BASE_URL}/services/${id}/reviews`, {
        timeout: 10000,
        validateStatus: () => true,
      });

      if (response.status >= 200 && response.status < 300 && response.data) {
        const {
          averageRating: avg = 0,
          totalReviews: total = 0,
          reviews: reviewList = [],
        } = response.data;

        setAverageRating(typeof avg === "number" ? avg : 0);
        setTotalReviews(typeof total === "number" ? total : 0);
        setReviews(Array.isArray(reviewList) ? reviewList : []);

        if (currentUser && Array.isArray(reviewList)) {
          const existing = reviewList.find(
            (review: ServiceReview) => review.reviewerId === currentUser.id
          );

          if (existing) {
            setUserRating(existing.rating);
            setUserComment(existing.comment || "");
          }
        }
      } else if (response.status >= 400 && response.data?.msg) {
        setReviewError(response.data.msg);
      } else {
        setReviewError("Unable to load reviews at this time.");
      }
    } catch (err) {
      console.error("❌ Failed to fetch reviews", err);
      setReviewError("Unable to load reviews at this time.");
    }
  }, [id, currentUser]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const handleRatingSelect = (value: number) => {
    setUserRating(value);
  };

  const handleSubmitReview = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setReviewError("");
    setReviewSuccess("");

    if (!service) return;

    const token = currentUser?.token || localStorage.getItem("token");

    if (!token || !currentUser) {
      setReviewError("Please log in to leave a review.");
      return;
    }

    if (!userRating) {
      setReviewError("Select a rating before submitting.");
      return;
    }

    try {
      setReviewSubmitting(true);
      const response = await axios.post(
        `${BASE_URL}/services/${service.id}/reviews`,
        {
          rating: userRating,
          comment: userComment.trim(),
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          timeout: 10000,
        }
      );

      if (response.status >= 200 && response.status < 300 && response.data?.success) {
        setReviewSuccess(response.data.msg || "Review submitted successfully.");
        setAverageRating(response.data.averageRating ?? userRating);
        setTotalReviews(response.data.totalReviews ?? totalReviews);

        if (response.data.review) {
          setReviews(prev => {
            const existingIndex = prev.findIndex(r => r.id === response.data.review.id);
            if (existingIndex >= 0) {
              const updated = [...prev];
              updated[existingIndex] = response.data.review;
              return updated;
            }
            return [response.data.review, ...prev];
          });
        } else {
          await fetchReviews();
        }
      } else if (response.data?.msg) {
        setReviewError(response.data.msg);
      } else {
        setReviewError("Failed to submit review. Please try again later.");
      }
    } catch (err: any) {
      console.error("❌ Failed to submit review", err);
      const status = err?.response?.status;
      const message =
        err?.response?.data?.msg ||
        err?.response?.data?.error ||
        err?.message;

      if (status === 401) {
        setReviewError("Please log in to leave a review.");
      } else if (status === 400 && message) {
        setReviewError(message);
      } else {
        setReviewError(message || "Failed to submit review. Please try again later.");
      }
    } finally {
      setReviewSubmitting(false);
    }
  };

  const handleAddToCart = () => {
    if (!service) return;
    navigate("/cart", {
      state: {
        cart: [service],
        total: service.discountedPrice || 
               (service.discount && service.discount > 0 
                 ? service.price * (1 - service.discount / 100) 
                 : service.price)
      }
    });
  };

  const handleSendGift = () => {
    if (!service) return;
    navigate("/send-gift", {
      state: { service }
    });
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-lg text-gray-500 mb-2">Loading service details...</div>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#be9b49] mx-auto"></div>
        </div>
      </div>
    );
  }

  // Error state with no service data
  if (!service && error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-8 px-4">
        <div className="text-center max-w-md mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold text-red-600 mb-4">Error Loading Service</h2>
            <p className="text-gray-700 mb-2">{error}</p>
            <p className="text-sm text-gray-500 mb-6">
              Please check the browser console (F12) for more details.
            </p>
          <div className="flex gap-4 justify-center">
            <button
              onClick={() => fetchService()}
              className="px-6 py-3 bg-[#0f285b] text-white font-bold rounded-lg hover:bg-[#111] transition"
            >
              Retry
            </button>
            <button
              onClick={() => navigate("/services")}
              className="px-6 py-3 bg-[#be9b49] text-[#0f285b] font-bold rounded-lg hover:bg-[#b8962f] transition"
            >
              Back to Services
            </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // No service found
  if (!service) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-600 mb-4 text-lg">Service not found</p>
              <button
                onClick={() => navigate("/services")}
                className="px-6 py-3 bg-[#be9b49] text-[#0f285b] font-bold rounded-lg hover:bg-[#b8962f] transition"
              >
                Back to Services
              </button>
        </div>
      </div>
    );
  }

  const effectivePrice = service.discountedPrice || 
    (service.discount && service.discount > 0 
      ? service.price * (1 - service.discount / 100) 
      : service.price);

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Error banner if there's a non-critical error */}
        {error && service && (
          <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-yellow-800 text-sm">
              ⚠️ {error}
            </p>
          </div>
        )}
        
        {/* Back Button */}
        <button
          onClick={() => navigate("/services")}
          className="mb-6 flex items-center gap-2 text-gray-600 hover:text-[#0f285b] transition"
        >
          <ArrowLeft size={20} />
          <span>Back to Services</span>
        </button>

        {/* Service Details Card */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-8">
          <div className="grid md:grid-cols-2 gap-6 p-6">
            {/* Image */}
            <div>
              {service.imageUrl ? (
                <img
                  src={getImageUrl(service.imageUrl)}
                  alt={service.title}
                  className="w-full h-80 object-cover rounded-xl"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.onerror = null; // Prevent infinite loop
                    target.src = "/placeholder.png";
                  }}
                  loading="lazy"
                />
              ) : (
                <div className="w-full h-80 bg-gray-200 rounded-xl flex items-center justify-center">
                  <p className="text-gray-500">No image available</p>
                </div>
              )}
            </div>

            {/* Service Info */}
            <div className="space-y-4">
              <div>
                <h1 className="text-3xl font-bold text-[#0f285b] mb-2">{service.title}</h1>
                <div className="flex items-center gap-4 mb-3">
                  <span className="px-3 py-1 bg-[#0f285b] text-white rounded-full text-sm">
                    {service.category}
                  </span>
                  {service.subcategory && (
                    <span className="px-3 py-1 bg-gray-200 text-gray-700 rounded-full text-sm">
                      {service.subcategory}
                    </span>
                  )}
                </div>
              </div>

              {/* Price */}
              <div>
                {service.discount && service.discount > 0 ? (
                  <div>
                    <p className="text-lg text-gray-500 line-through mb-1">
                      ETB {service.price.toLocaleString()}
                    </p>
                    <div className="flex items-center gap-3">
                      <p className="text-3xl font-bold text-[#be9b49]">
                        ETB {effectivePrice.toLocaleString()}
                      </p>
                      <span className="px-3 py-1 bg-red-500 text-white rounded-full text-sm font-semibold">
                        {service.discount}% OFF
                      </span>
                    </div>
                  </div>
                ) : (
                  <p className="text-3xl font-bold text-[#be9b49]">
                    ETB {service.price.toLocaleString()}
                  </p>
                )}
              </div>

              {/* Service Details */}
              <div className="space-y-2 pt-4 border-t">
                {service.location && (
                  <p className="text-gray-600">
                    <span className="font-semibold">📍 Location:</span> {service.location}
                  </p>
                )}
                {service.duration && (
                  <p className="text-gray-600">
                    <span className="font-semibold">⏱️ Duration:</span> {service.duration}
                  </p>
                )}
                {service.providerName && (
                  <p className="text-gray-600">
                    <span className="font-semibold">👤 Provider:</span> {service.providerName}
                  </p>
                )}
              </div>

              {/* Description */}
              {service.description && (
                <div className="pt-4 border-t">
                  <p className="text-gray-700 leading-relaxed">{service.description}</p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-4 pt-4">
                <button
                  onClick={handleAddToCart}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-[#0f285b] text-white font-semibold rounded-lg hover:bg-[#111] transition"
                >
                  <ShoppingCart size={20} />
                  Add to Cart
                </button>
                <button
                  onClick={handleSendGift}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-[#be9b49] text-[#0f285b] font-semibold rounded-lg hover:bg-[#b8962f] transition"
                >
                  <Gift size={20} />
                  Send as Gift
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        <div className="bg-white rounded-2xl shadow-lg p-6 space-y-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-[#0f285b]">Reviews & Ratings</h2>
              <p className="text-sm text-gray-500">See what others think about this service.</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-3xl font-bold text-[#be9b49]">
                {averageRating ? averageRating.toFixed(1) : "0.0"}
              </div>
              <div className="text-sm text-gray-500">
                {totalReviews === 1 ? "1 review" : `${totalReviews} reviews`}
              </div>
            </div>
          </div>

          {reviewError && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
              {reviewError}
            </div>
          )}

          {reviewSuccess && (
            <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-2 text-sm text-green-700">
              {reviewSuccess}
            </div>
          )}

          <div className="border-t pt-6">
            {currentUser ? (
              <form onSubmit={handleSubmitReview} className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Your rating</p>
                  <div className="flex items-center gap-2">
                    {Array.from({ length: 5 }).map((_, index) => {
                      const starValue = index + 1;
                      const isActive = (hoverRating ?? userRating) >= starValue;
                      return (
                        <button
                          key={starValue}
                          type="button"
                          onMouseEnter={() => setHoverRating(starValue)}
                          onMouseLeave={() => setHoverRating(null)}
                          onClick={() => handleRatingSelect(starValue)}
                          className="transition-transform hover:scale-110"
                          aria-label={`Rate ${starValue} star${starValue > 1 ? "s" : ""}`}
                        >
                          <Star
                            className={isActive ? "text-[#be9b49]" : "text-gray-300"}
                            fill={isActive ? "currentColor" : "none"}
                            size={28}
                          />
                        </button>
                      );
                    })}
                    <span className="text-sm text-gray-500">
                      {userRating ? `${userRating} / 5` : "Choose a rating"}
                    </span>
                  </div>
                </div>

                <div>
                  <label htmlFor="review-comment" className="text-sm font-medium text-gray-700">
                    Share your experience (optional)
                  </label>
                  <textarea
                    id="review-comment"
                    rows={4}
                    value={userComment}
                    onChange={event => setUserComment(event.target.value)}
                    placeholder="What did you like or dislike about this service?"
                    className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm transition focus:border-[#be9b49] focus:outline-none focus:ring-2 focus:ring-[#be9b49]/40"
                  />
                </div>

                <button
                  type="submit"
                  disabled={reviewSubmitting}
                  className={`flex items-center justify-center gap-2 rounded-lg px-5 py-3 text-sm font-semibold text-white transition ${
                    reviewSubmitting ? "bg-gray-400" : "bg-[#0f285b] hover:bg-[#111]"
                  }`}
                >
                  {reviewSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  {userRating ? "Update review" : "Submit review"}
                </button>
              </form>
            ) : (
              <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">
                Please log in to leave a review.
              </div>
            )}
          </div>

          <div className="border-t pt-6 space-y-4">
            {reviews.length === 0 ? (
              <p className="text-sm text-gray-500">No reviews yet. Be the first to share your thoughts!</p>
            ) : (
              reviews.map(review => {
                const reviewDate = new Date(review.createdAt);
                return (
                  <div key={review.id} className="rounded-xl border border-gray-200 p-4 shadow-sm">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm font-semibold text-[#0f285b]">
                          {review.reviewerName || "Anonymous"}
                        </p>
                        <p className="text-xs text-gray-500">
                          {reviewDate.toLocaleDateString(undefined, {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: 5 }).map((_, starIndex) => {
                          const starValue = starIndex + 1;
                          const isFilled = review.rating >= starValue;
                          return (
                            <Star
                              key={`${review.id}-star-${starValue}`}
                              size={18}
                              className={isFilled ? "text-[#be9b49]" : "text-gray-300"}
                              fill={isFilled ? "currentColor" : "none"}
                            />
                          );
                        })}
                      </div>
                    </div>
                    {review.comment && (
                      <p className="mt-3 text-sm text-gray-600 leading-relaxed">{review.comment}</p>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServiceDetail;

