import { useEffect, useState } from "react";
import axios from "axios";
import BASE_URL from "../../../api/api";

// Interfaces matching backend response
interface Recipient {
  name?: string;
  email?: string;
  phone?: string;
  whatsapp?: string;
  telegram?: string;
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

interface GiftCode {
  _id: string;
  giftCode: string;
  giftId: string;
  title?: string;
  senderName?: string;
  occasion?: string;
  recipient?: Recipient;
  service?: Service;
  provider?: Provider;
  buyer?: Buyer;
  deliveryStatus?: string;
  serviceLocation?: string;
  codeCreatedAt?: string;
  createdAt?: string;
}

interface Filters {
  status: string;
  providerName: string;
  dateFrom: string;
  dateTo: string;
}

type CategoryTab = "all" | "Wellness" | "Medical" | "Home Based/Mobile Services" | "Hotel";

const AdminGiftCodes: React.FC = () => {
  const [codes, setCodes] = useState<GiftCode[]>([]);
  const [activeCategory, setActiveCategory] = useState<CategoryTab>("all");
  const [filters, setFilters] = useState<Filters>({
    status: "",
    providerName: "",
    dateFrom: "",
    dateTo: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Fetch gift codes from backend
  const fetchCodes = async () => {
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("Admin token not found. Please log in.");
        setLoading(false);
        return;
      }

      const { data } = await axios.get<GiftCode[]>(
        `${BASE_URL}/gifts/with-codes`,
        {
          params: filters,
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setCodes(data || []);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.msg || err.message);
      } else {
        setError("Unexpected error fetching gift codes.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCodes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle filter input changes
  const handleFilterChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  // Apply filters
  const applyFilters = () => {
    fetchCodes();
  };

  // Filter codes by category
  const getFilteredCodes = () => {
    if (activeCategory === "all") {
      return codes;
    }
    return codes.filter(
      (code) => code.service?.category === activeCategory
    );
  };

  const filteredCodes = getFilteredCodes();

  // Get category counts
  const getCategoryCount = (category: CategoryTab) => {
    if (category === "all") return codes.length;
    return codes.filter((code) => code.service?.category === category).length;
  };

  const categories: CategoryTab[] = [
    "all",
    "Wellness",
    "Medical",
    "Home Based/Mobile Services",
    "Hotel",
  ];

  const categoryLabels: Record<CategoryTab, string> = {
    all: "All Gifts",
    Wellness: "Wellness",
    Medical: "Medical",
    "Home Based/Mobile Services": "Home Based/Mobile",
    Hotel: "Hotel",
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-2xl md:text-3xl font-bold text-[#1c2b21] mb-6">
          🎁 Gift Codes Management
        </h2>

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
                      ? "bg-[#D4AF37] text-[#1c2b21] shadow-lg"
                      : "bg-white text-gray-700 hover:bg-gray-100"
                  }
                `}
              >
                {categoryLabels[category]} ({getCategoryCount(category)})
              </button>
            ))}
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-4 md:p-6 mb-6">
          <h3 className="text-lg font-semibold text-[#1c2b21] mb-4">Filters</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                name="status"
                value={filters.status}
                onChange={handleFilterChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D4AF37] focus:border-[#D4AF37]"
              >
                <option value="">All Status</option>
                <option value="pending">Pending</option>
                <option value="delivered">Delivered</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Provider Name
              </label>
              <input
                type="text"
                name="providerName"
                placeholder="Search provider..."
                value={filters.providerName}
                onChange={handleFilterChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D4AF37] focus:border-[#D4AF37]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date From
              </label>
              <input
                type="date"
                name="dateFrom"
                value={filters.dateFrom}
                onChange={handleFilterChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D4AF37] focus:border-[#D4AF37]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date To
              </label>
              <input
                type="date"
                name="dateTo"
                value={filters.dateTo}
                onChange={handleFilterChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D4AF37] focus:border-[#D4AF37]"
              />
            </div>
          </div>
          <button
            onClick={applyFilters}
            className="mt-4 px-6 py-2 bg-[#1c2b21] text-white rounded-lg hover:bg-[#2d3d32] transition-colors font-medium"
          >
            Apply Filters
          </button>
        </div>

        {/* Loading / Error / Table */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#D4AF37]"></div>
            <p className="mt-4 text-gray-600">Loading gift codes...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-600">{error}</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            {/* Desktop Table */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-[#1c2b21] text-white">
                    <th className="px-4 py-3 text-left font-semibold">Gift Code</th>
                    <th className="px-4 py-3 text-left font-semibold">Recipient</th>
                    <th className="px-4 py-3 text-left font-semibold">Service</th>
                    <th className="px-4 py-3 text-left font-semibold">Occasion</th>
                    <th className="px-4 py-3 text-left font-semibold">Provider</th>
                    <th className="px-4 py-3 text-left font-semibold">Status</th>
                    <th className="px-4 py-3 text-left font-semibold">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCodes.length > 0 ? (
                    filteredCodes.map((code) => (
                      <tr
                        key={code._id}
                        className="border-b border-gray-200 hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-4 py-3 font-mono font-semibold text-[#D4AF37]">
                          {code.giftCode || "N/A"}
                        </td>
                        <td className="px-4 py-3">
                          <div>
                            <div className="font-medium">{code.recipient?.name || "N/A"}</div>
                            <div className="text-sm text-gray-500">
                              {code.recipient?.email || code.recipient?.phone || ""}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div>
                            <div className="font-medium">{code.service?.title || "N/A"}</div>
                            <div className="text-xs text-gray-500">
                              {code.service?.category || ""}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {code.occasion || "Not specified"}
                        </td>
                        <td className="px-4 py-3">
                          {code.provider?.fullName || "N/A"}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              code.deliveryStatus === "delivered"
                                ? "bg-green-100 text-green-800"
                                : "bg-yellow-100 text-yellow-800"
                            }`}
                          >
                            {code.deliveryStatus || "pending"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {code.codeCreatedAt || code.createdAt
                            ? new Date(code.codeCreatedAt || code.createdAt || "").toLocaleString()
                            : "N/A"}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="px-4 py-12 text-center text-gray-500">
                        No gift codes found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="lg:hidden p-4 space-y-4">
              {filteredCodes.length > 0 ? (
                filteredCodes.map((code) => (
                  <div
                    key={code._id}
                    className="bg-gray-50 rounded-lg p-4 border border-gray-200"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <div className="font-mono font-semibold text-[#D4AF37] text-lg">
                          {code.giftCode || "N/A"}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {code.codeCreatedAt || code.createdAt
                            ? new Date(code.codeCreatedAt || code.createdAt || "").toLocaleString()
                            : "N/A"}
                        </div>
                      </div>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          code.deliveryStatus === "delivered"
                            ? "bg-green-100 text-green-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {code.deliveryStatus || "pending"}
                      </span>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="font-medium text-gray-700">Recipient: </span>
                        <span className="text-gray-900">
                          {code.recipient?.name || "N/A"}
                        </span>
                        {(code.recipient?.email || code.recipient?.phone) && (
                          <div className="text-xs text-gray-500 ml-4">
                            {code.recipient?.email || code.recipient?.phone}
                          </div>
                        )}
                      </div>

                      <div>
                        <span className="font-medium text-gray-700">Service: </span>
                        <span className="text-gray-900">
                          {code.service?.title || "N/A"}
                        </span>
                        {code.service?.category && (
                          <div className="text-xs text-gray-500 ml-4">
                            {code.service.category}
                          </div>
                        )}
                      </div>

                      <div>
                        <span className="font-medium text-gray-700">Occasion: </span>
                        <span className="text-gray-900">
                          {code.occasion || "Not specified"}
                        </span>
                      </div>

                      <div>
                        <span className="font-medium text-gray-700">Provider: </span>
                        <span className="text-gray-900">
                          {code.provider?.fullName || "N/A"}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 text-gray-500">
                  No gift codes found.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminGiftCodes;
