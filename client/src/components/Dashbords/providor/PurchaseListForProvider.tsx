import { useEffect, useState } from "react";
import axios from "axios";
import BASE_URL from "../../../api/api";

type Purchase = {
  id: string | number;
  itemType: "service" | "gift";
  item?: { id: string; title?: string; category?: string; location?: string; price?: number; discount?: number };
  provider?: { id: string };
  buyerName: string;
  buyerEmail: string;
  buyerPhone?: string;
  amount: number;
  status: "pending" | "completed" | "cancelled";
  purchaseDate: string;
  deliveryDate?: string;
  recipients: Array<{
    name?: string;
    email?: string;
    phone?: string;
  }>;
  gifts: Array<{
    giftCode: string;
    deliveryStatus?: string;
  }>;
};

const PurchaseListForProvider = () => {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [messages, setMessages] = useState<{ [key: string]: string }>({});

  const userStr = localStorage.getItem("user");
  let providerId: string | null = null;
  let token: string | null = null;
  
  try {
    if (userStr) {
      const user = JSON.parse(userStr);
      providerId = localStorage.getItem("providerId") || user.id?.toString() || null;
      token = localStorage.getItem("token") || user.token || null;
    } else {
      providerId = localStorage.getItem("providerId");
      token = localStorage.getItem("token");
    }
  } catch (err) {
    console.error("❌ Error parsing user data:", err);
  }

  useEffect(() => {
    const fetchPurchases = async () => {
      console.log("🔍 PurchaseListForProvider: Starting fetch");
      console.log("🔍 Provider ID:", providerId);
      console.log("🔍 Token:", token ? "Present" : "Missing");
      
      if (!providerId || !token) {
        console.warn("⚠️ Missing providerId or token");
        setError("Authentication required");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        // Ensure BASE_URL doesn't have trailing slash and add /api if needed
        const base = BASE_URL.endsWith('/') ? BASE_URL.slice(0, -1) : BASE_URL;
        const apiPrefix = base.includes('/api') ? '' : '/api';
        const url = `${base}${apiPrefix}/purchase/provider/${providerId}/purchases`;
        console.log("🔍 Fetching from:", url);
        
        const response = await axios.get(
          url,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        
        console.log("✅ Purchases fetched:", response.data?.length || 0);
        console.log("✅ Response data:", response.data);
        
        // Ensure response.data is an array and sanitize the data
        let purchasesData = Array.isArray(response.data) ? response.data : [];
        
        // Sanitize purchases data to ensure all required fields exist
        purchasesData = purchasesData.map((p: any) => ({
          id: p.id || 'unknown',
          itemType: p.itemType || 'service',
          item: {
            id: p.item?.id || '',
            title: p.item?.title || 'Untitled Service',
            category: p.item?.category || 'N/A',
            location: p.item?.location || 'N/A',
            price: p.item?.price || 0,
          },
          provider: {
            id: p.provider?.id || '',
          },
          buyerName: p.buyerName || 'Unknown Buyer',
          buyerEmail: p.buyerEmail || 'noemail@wanaw.et',
          buyerPhone: p.buyerPhone || '',
          amount: p.amount || p.total_amount || 0,
          status: p.status || 'pending',
          purchaseDate: p.purchaseDate || p.created_at || new Date().toISOString(),
          deliveryDate: p.deliveryDate || null,
          recipients: Array.isArray(p.recipients) ? p.recipients : [],
          gifts: Array.isArray(p.gifts) ? p.gifts : [],
        }));
        
        setPurchases(purchasesData);
        setError(null);
      } catch (err: any) {
        console.error("❌ Error fetching purchases:", err);
        console.error("❌ Error response:", err.response?.data);
        console.error("❌ Error status:", err.response?.status);
        const errorMsg = err.response?.data?.msg || err.response?.data?.error || err.message || "Failed to fetch purchases";
        setError(errorMsg);
      } finally {
        setLoading(false);
      }
    };

    fetchPurchases();
  }, [providerId, token]);

  const handleStatusChange = async (purchaseId: string | number, newStatus: string) => {
    try {
      setMessages((prev) => ({ ...prev, [purchaseId]: "⏳ Updating status..." }));

      const base = BASE_URL.endsWith('/') ? BASE_URL.slice(0, -1) : BASE_URL;
      const apiPrefix = base.includes('/api') ? '' : '/api';
      await axios.put(
        `${base}${apiPrefix}/purchase/${purchaseId}/status`,
        { newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setPurchases((prev) =>
        prev.map((p) =>
          p.id === purchaseId ? { ...p, status: newStatus.toLowerCase() as any } : p
        )
      );

      const statusEmoji = newStatus === "completed" ? "✅" : newStatus === "cancelled" ? "❌" : "⏳";
      setMessages((prev) => ({
        ...prev,
        [purchaseId]: `${statusEmoji} Status updated to ${newStatus} & buyer notified!`,
      }));

      setTimeout(() => {
        setMessages((prev) => {
          const newMessages = { ...prev };
          delete newMessages[purchaseId];
          return newMessages;
        });
      }, 5000);
    } catch (err: any) {
      console.error("Status update failed:", err);
      setMessages((prev) => ({
        ...prev,
        [purchaseId]: `❌ Error: ${err.response?.data?.msg || "Failed to update status"}`,
      }));
    }
  };

  const getStatusBadge = (status: string) => {
    const statusColors: { [key: string]: string } = {
      pending: "bg-[#FAF0D7] text-[#8D7338] border border-[#BE9B49]/30",
      completed: "bg-emerald-50 text-emerald-700 border border-emerald-200",
      cancelled: "bg-red-50 text-red-700 border border-red-200",
    };
    return statusColors[status] || "bg-slate-50 text-slate-700 border border-slate-200";
  };

  const filteredPurchases = purchases.filter((p) => {
    if (!p) return false;
    const matchesSearch =
      p.item?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.buyerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.buyerEmail?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="text-lg">Loading purchases...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-600 font-semibold mb-2">Error: {error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-2 px-4 py-2 text-[#0F285B] rounded-lg hover:brightness-105 transition font-semibold shadow-sm"
          style={{ background: "linear-gradient(135deg, #F5E189 0%, #EDC45B 25%, #BE9B49 50%, #BB9F54 75%, #8D7338 100%)" }}
        >
          Retry
        </button>
      </div>
    );
  }

  // Add safety check for purchases
  if (!Array.isArray(purchases)) {
    console.error("⚠️ Purchases is not an array:", purchases);
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-yellow-600">Invalid data format. Please refresh the page.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <input
          type="text"
          placeholder="Search by service, buyer name, or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 w-full border border-[#E8E8E8] rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#EDC45B] focus:ring-1 focus:ring-[#EDC45B]/30 bg-white transition-all placeholder-gray-400"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-full sm:w-auto border border-[#E8E8E8] rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#EDC45B] focus:ring-1 focus:ring-[#EDC45B]/30 bg-white transition-all text-gray-700 font-medium"
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto border border-[#E8E8E8] rounded-2xl">
        <table className="min-w-full bg-white">
          <thead className="bg-[#0F285B] text-[#EDC45B]">
            <tr>
              <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider">Service</th>
              <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider">Buyer</th>
              <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider">Contact</th>
              <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider">Amount</th>
              <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider">Status</th>
              <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider">Date</th>
              <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredPurchases.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                  No purchases found
                </td>
              </tr>
            ) : (
              filteredPurchases.map((purchase) => {
                // Use the amount from backend - it's already the discounted price from database
                // The backend ensures total_amount from purchases table (which is the real stored purchase amount)
                const displayedAmount = purchase.amount || 0;
                const discount = purchase.item?.discount || 0;
                
                return (
                  <tr key={String(purchase.id)} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-semibold">{purchase.item?.title || "N/A"}</p>
                      <p className="text-sm text-gray-500">{purchase.item?.category}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium">{purchase.buyerName}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div>
                      <p className="text-sm text-gray-600">{purchase.buyerEmail || 'N/A'}</p>
                      {purchase.buyerPhone && (
                        <p className="text-sm text-gray-600">{purchase.buyerPhone}</p>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {new Intl.NumberFormat("en-ET", { style: "currency", currency: "ETB" }).format(
                      Number(displayedAmount)
                    )}
                    {discount > 0 && (
                      <p className="text-xs text-green-600 mt-1">Discounted ({discount}% off)</p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusBadge(
                        purchase.status
                      )}`}
                    >
                      {purchase.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {purchase.purchaseDate ? new Date(purchase.purchaseDate).toLocaleDateString() : 'N/A'}
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={purchase.status}
                      onChange={(e) => handleStatusChange(String(purchase.id), e.target.value)}
                      className="border border-[#E8E8E8] rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-[#EDC45B]"
                      disabled={purchase.status === "cancelled"}
                    >
                      <option value="pending">Pending</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                    {messages[purchase.id] && (
                      <p className="text-xs text-gray-600 mt-1">{messages[purchase.id]}</p>
                    )}
                  </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-4">
        {filteredPurchases.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No purchases found</div>
        ) : (
          filteredPurchases.map((purchase) => {
                // Use the amount from backend - it's already the discounted price from database
                const displayedAmount = purchase.amount || 0;
                const discount = purchase.item?.discount || 0;
                
                return (
            <div key={String(purchase.id)} className="border rounded-lg shadow p-4 bg-white">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <p className="font-semibold text-lg">{purchase.item?.title || "N/A"}</p>
                  <p className="text-sm text-gray-500">{purchase.item?.category}</p>
                </div>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusBadge(
                    purchase.status
                  )}`}
                >
                  {purchase.status.toUpperCase()}
                </span>
              </div>
              <div className="space-y-2 mb-3">
                <p>
                  <span className="font-medium">Buyer:</span> {purchase.buyerName}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Email:</span> {purchase.buyerEmail || 'N/A'}
                </p>
                {purchase.buyerPhone && (
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Phone:</span> {purchase.buyerPhone}
                  </p>
                )}
                <p>
                  <span className="font-medium">Amount:</span>{" "}
                  {new Intl.NumberFormat("en-ET", { style: "currency", currency: "ETB" }).format(
                    Number(displayedAmount)
                  )}
                  {discount > 0 && (
                    <span className="text-xs text-green-600 ml-2">({discount}% off)</span>
                  )}
                </p>
                <p>
                  <span className="font-medium">Date:</span>{" "}
                  {purchase.purchaseDate ? new Date(purchase.purchaseDate).toLocaleDateString() : 'N/A'}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Update Status:</label>
                  <select
                  value={purchase.status}
                  onChange={(e) => handleStatusChange(String(purchase.id), e.target.value)}
                  className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#be9b49]"
                  disabled={purchase.status === "cancelled"}
                >
                  <option value="pending">Pending</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
                {messages[purchase.id] && (
                  <p className="text-xs text-gray-600 mt-1">{messages[purchase.id]}</p>
                )}
              </div>
            </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default PurchaseListForProvider;

