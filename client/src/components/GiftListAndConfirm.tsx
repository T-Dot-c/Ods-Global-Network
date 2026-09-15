import { useEffect, useState } from "react";
import axios from "axios";
import BASE_URL from "../api/api";

interface Recipient {
  name?: string;
  email?: string;
  phone?: string;
  whatsapp?: string;
  telegram?: string;
  photo?: string | null;
}

interface Service {
  title?: string;
  category?: string;
}

interface Provider {
  fullName?: string;
  email?: string;
}

interface Buyer {
  name?: string;
  email?: string;
}

interface GiftWithCode {
  _id: string;
  recipient?: Recipient;
  service?: Service;
  occasion?: string;
  giftCode?: string;
  deliveryStatus?: "pending" | "delivered" | "canceled" | "cancelled";
  senderName?: string;
  provider?: Provider;
  buyer?: Buyer;
  serviceLocation?: string;
}

type CategoryTab = "Wellness" | "Medical" | "Home Based/Mobile Services" | "Hotel";

const GiftListAndConfirm: React.FC = () => {
  const [gifts, setGifts] = useState<GiftWithCode[]>([]);
  const [activeCategory, setActiveCategory] = useState<CategoryTab>("Wellness");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchGifts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const userStr = localStorage.getItem("user");
      const token = userStr ? JSON.parse(userStr).token : localStorage.getItem("token");
      
      if (!token) {
        setError("Authentication required. Please log in to view gifts.");
        setLoading(false);
        return;
      }
      
      const config = {
        headers: { Authorization: `Bearer ${token}` }
      };
      
      const res = await axios.get(`${BASE_URL}/gifts/with-codes`, config);
      const fetchedGifts = res.data || [];
      
      // Map the backend response to our interface
      const mappedGifts: GiftWithCode[] = fetchedGifts.map((gift: any) => ({
        _id: gift.giftId || gift._id || `gift-${Math.random()}`,
        service: {
          title: gift.service?.title || gift.service_title || "N/A",
          category: gift.service?.category || gift.service_category || "N/A",
        },
        senderName: gift.senderName || gift.sender_name || gift.buyer?.name || "Unknown",
        provider: {
          fullName: gift.provider?.fullName || gift.provider_name || "N/A",
          email: gift.provider?.email || gift.provider_email || "",
        },
        buyer: {
          name: gift.buyer?.name || gift.buyerName || "N/A",
          email: gift.buyer?.email || gift.buyerEmail || "",
        },
        occasion: gift.occasion || gift.occasion_name || "Not specified",
        giftCode: gift.giftCode || gift.gift_code || "N/A",
        deliveryStatus: gift.deliveryStatus || gift.delivery_status || "pending",
        serviceLocation: gift.serviceLocation || gift.service_location || "",
        recipient: {
          name: gift.recipient?.name || gift.recipient_name || "N/A",
          email: gift.recipient?.email || gift.recipient_email || "",
          phone: gift.recipient?.phone || gift.recipient_phone || "",
          whatsapp: gift.recipient?.whatsapp || gift.recipient_whatsapp || "",
          telegram: gift.recipient?.telegram || gift.recipient_telegram || "",
          photo: gift.recipient?.photo || gift.recipient_photo || null,
        },
      }));
      
      setGifts(mappedGifts);
    } catch (err: any) {
      console.error("❌ Failed to load gifts:", err);
      
      if (err.response?.status === 401) {
        setError("Authentication required. Please log in to view gifts.");
      } else if (err.response?.status === 403) {
        setError("Access denied. You don't have permission to view gifts.");
      } else if (err.response?.status >= 500) {
        setError("Server error. Please try again later.");
      } else {
        setError(`Failed to load gifts: ${err.message || 'Unknown error'}`);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGifts();
  }, []);

  // Filter gifts by category and search term
  const getFilteredGifts = () => {
    let filtered = gifts.filter((gift) => {
      const category = gift.service?.category || "";
      // Normalize category names
      const normalizedCategory = category.toLowerCase();
      const activeCategoryLower = activeCategory.toLowerCase();
      
      // Map variations of category names
      if (activeCategory === "Home Based/Mobile Services") {
        if (!normalizedCategory.includes("home") && !normalizedCategory.includes("mobile")) {
          return false;
        }
      } else if (!normalizedCategory.includes(activeCategoryLower)) {
        return false;
      }
      
      // Apply search filter
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        return (
          (gift.service?.title || "").toLowerCase().includes(term) ||
          (gift.recipient?.name || "").toLowerCase().includes(term) ||
          (gift.recipient?.email || "").toLowerCase().includes(term) ||
          (gift.recipient?.phone || "").toLowerCase().includes(term) ||
          (gift.buyer?.name || "").toLowerCase().includes(term) ||
          (gift.buyer?.email || "").toLowerCase().includes(term) ||
          (gift.provider?.fullName || "").toLowerCase().includes(term) ||
          (gift.provider?.email || "").toLowerCase().includes(term) ||
          (gift.occasion || "").toLowerCase().includes(term) ||
          (gift.giftCode || "").toLowerCase().includes(term)
        );
      }
      
      return true;
    });
    
    return filtered;
  };

  const filteredGifts = getFilteredGifts();

  // Get category counts
  const getCategoryCount = (category: CategoryTab) => {
    return gifts.filter((gift) => {
      const giftCategory = (gift.service?.category || "").toLowerCase();
      if (category === "Home Based/Mobile Services") {
        return giftCategory.includes("home") || giftCategory.includes("mobile");
      }
      return giftCategory.includes(category.toLowerCase());
    }).length;
  };

  const categories: CategoryTab[] = [
    "Wellness",
    "Medical",
    "Home Based/Mobile Services",
    "Hotel",
  ];

  const categoryLabels: Record<CategoryTab, string> = {
    Wellness: "Wellness",
    Medical: "Medical",
    "Home Based/Mobile Services": "Home Based/Mobile",
    Hotel: "Hotel",
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#be9b49] mb-4"></div>
          <p className="text-gray-600">Loading gifts...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => {
              setError(null);
              fetchGifts();
            }}
            className="bg-[#0f285b] hover:bg-[#2d3d32] text-white px-6 py-2 rounded-lg transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl md:text-3xl font-bold mb-6 text-[#0f285b]">
          🎁 Gift List & Confirm
        </h1>

        {/* Category Tabs */}
        <div className="mb-6 overflow-x-auto">
          <div className="flex space-x-2 md:space-x-4 pb-2 min-w-max">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                className={`
                  px-4 py-2 md:px-6 md:py-3 rounded-lg font-medium whitespace-nowrap transition-all
                  ${
                    activeCategory === category
                      ? "bg-[#be9b49] text-[#0f285b] shadow-lg"
                      : "bg-white text-gray-700 hover:bg-gray-100"
                  }
                `}
              >
                {categoryLabels[category]} ({getCategoryCount(category)})
              </button>
            ))}
          </div>
        </div>

        {/* Search Input */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="Search by gift, buyer, provider, recipient, occasion or code..."
            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#be9b49] focus:border-[#be9b49] shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Category Folder Content */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-4 md:p-6 border-b border-gray-200 bg-[#0f285b] text-white">
            <h2 className="text-xl md:text-2xl font-bold">
              {categoryLabels[activeCategory]} Gifts
            </h2>
            <p className="text-sm text-gray-300 mt-1">
              {filteredGifts.length} gift{filteredGifts.length !== 1 ? "s" : ""} found
            </p>
          </div>

          {filteredGifts.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-gray-500">No gifts found in this category.</p>
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-100 text-left">
                      <th className="px-4 py-3 font-semibold text-gray-700 border-b">Gift Code</th>
                      <th className="px-4 py-3 font-semibold text-gray-700 border-b">Service Title</th>
                      <th className="px-4 py-3 font-semibold text-gray-700 border-b">Occasion</th>
                      <th className="px-4 py-3 font-semibold text-gray-700 border-b">Buyer</th>
                      <th className="px-4 py-3 font-semibold text-gray-700 border-b">Buyer Email</th>
                      <th className="px-4 py-3 font-semibold text-gray-700 border-b">Provider/Company</th>
                      <th className="px-4 py-3 font-semibold text-gray-700 border-b">Provider Email</th>
                      <th className="px-4 py-3 font-semibold text-gray-700 border-b">Recipient</th>
                      <th className="px-4 py-3 font-semibold text-gray-700 border-b">Recipient Email</th>
                      <th className="px-4 py-3 font-semibold text-gray-700 border-b">Recipient Phone</th>
                      <th className="px-4 py-3 font-semibold text-gray-700 border-b">Location</th>
                      <th className="px-4 py-3 font-semibold text-gray-700 border-b">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredGifts.map((gift, index) => (
                      <tr
                        key={`${gift._id}-${index}`}
                        className={`${
                          index % 2 === 0 ? "bg-white" : "bg-gray-50"
                        } hover:bg-[#be9b49]/10 transition-colors`}
                      >
                        <td className="px-4 py-3 border-b font-mono font-semibold text-[#be9b49]">
                          {gift.giftCode || "N/A"}
                        </td>
                        <td className="px-4 py-3 border-b">
                          {gift.service?.title || "N/A"}
                        </td>
                        <td className="px-4 py-3 border-b">
                          {gift.occasion || "Not specified"}
                        </td>
                        <td className="px-4 py-3 border-b">
                          {gift.buyer?.name || "N/A"}
                        </td>
                        <td className="px-4 py-3 border-b text-sm">
                          {gift.buyer?.email || "—"}
                        </td>
                        <td className="px-4 py-3 border-b font-medium">
                          {gift.provider?.fullName || "N/A"}
                        </td>
                        <td className="px-4 py-3 border-b text-sm">
                          {gift.provider?.email || "—"}
                        </td>
                        <td className="px-4 py-3 border-b">
                          {gift.recipient?.name || "N/A"}
                        </td>
                        <td className="px-4 py-3 border-b text-sm">
                          {gift.recipient?.email || "—"}
                        </td>
                        <td className="px-4 py-3 border-b text-sm">
                          {gift.recipient?.phone || "—"}
                        </td>
                        <td className="px-4 py-3 border-b text-sm">
                          {gift.serviceLocation || "—"}
                        </td>
                        <td className="px-4 py-3 border-b">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              gift.deliveryStatus === "delivered"
                                ? "bg-green-100 text-green-800"
                                : (gift.deliveryStatus === "canceled" || gift.deliveryStatus === "cancelled")
                                ? "bg-red-100 text-red-800"
                                : "bg-yellow-100 text-yellow-800"
                            }`}
                          >
                            {gift.deliveryStatus || "pending"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Tablet/Mobile Card View */}
              <div className="lg:hidden p-4 space-y-4">
                {filteredGifts.map((gift, index) => (
                  <div
                    key={`${gift._id}-${index}`}
                    className="bg-gray-50 rounded-lg p-4 border border-gray-200 shadow-sm"
                  >
                    {/* Header */}
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <div className="font-mono font-semibold text-[#be9b49] text-lg mb-1">
                          {gift.giftCode || "N/A"}
                        </div>
                        <div className="font-medium text-gray-900">
                          {gift.service?.title || "N/A"}
                        </div>
                      </div>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          gift.deliveryStatus === "delivered"
                            ? "bg-green-100 text-green-800"
                            : (gift.deliveryStatus === "canceled" || gift.deliveryStatus === "cancelled")
                            ? "bg-red-100 text-red-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {gift.deliveryStatus || "pending"}
                      </span>
                    </div>

                    {/* Details Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-gray-600 font-medium">Occasion: </span>
                        <span className="text-gray-900">{gift.occasion || "Not specified"}</span>
                      </div>
                      
                      <div>
                        <span className="text-gray-600 font-medium">Location: </span>
                        <span className="text-gray-900">{gift.serviceLocation || "—"}</span>
                      </div>

                      <div>
                        <span className="text-gray-600 font-medium">Buyer: </span>
                        <div className="text-gray-900">{gift.buyer?.name || "N/A"}</div>
                        {gift.buyer?.email && (
                          <div className="text-xs text-gray-500">{gift.buyer.email}</div>
                        )}
                      </div>

                      <div>
                        <span className="text-gray-600 font-medium">Provider/Company: </span>
                        <div className="text-gray-900 font-medium">{gift.provider?.fullName || "N/A"}</div>
                        {gift.provider?.email && (
                          <div className="text-xs text-gray-500">{gift.provider.email}</div>
                        )}
                      </div>

                      <div>
                        <span className="text-gray-600 font-medium">Recipient: </span>
                        <div className="text-gray-900">{gift.recipient?.name || "N/A"}</div>
                        {gift.recipient?.email && (
                          <div className="text-xs text-gray-500">{gift.recipient.email}</div>
                        )}
                        {gift.recipient?.phone && (
                          <div className="text-xs text-gray-500">{gift.recipient.phone}</div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default GiftListAndConfirm;
