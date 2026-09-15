import { useEffect, useState } from "react";
import axios from "axios";
import BASE_URL from "../../../api/api";

type Purchase = {
  id: string;
  itemType: "service" | "gift";
  item?: { id: string; title?: string; category?: string; location?: string; price?: number; discount?: number };
  provider?: { id: string; name?: string; email?: string };
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

const AdminPurchaseList = () => {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const userStr = localStorage.getItem("user");
  const token = localStorage.getItem("token") || (userStr ? JSON.parse(userStr).token : null);

  useEffect(() => {
    const fetchPurchases = async () => {
      if (!token) {
        setError("Authentication required");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const params = new URLSearchParams();
        if (statusFilter !== "all") params.append("status", statusFilter);

        // Ensure BASE_URL doesn't have trailing slash and endpoint is properly formatted
        const base = BASE_URL.endsWith('/') ? BASE_URL.slice(0, -1) : BASE_URL;
        // BASE_URL already includes /api, so just append the endpoint
        const endpoint = '/purchase/all';
        const queryString = params.toString() ? `?${params.toString()}` : '';
        const url = `${base}${endpoint}${queryString}`;
        console.log("🔍 Admin Purchase List - BASE_URL:", BASE_URL);
        console.log("🔍 Admin Purchase List - Fetching from:", url);
        console.log("🔍 Admin Purchase List - Token:", token ? "Present" : "Missing");

        const response = await axios.get(
          url,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        console.log("✅ Purchases response:", response.data);
        
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
            discount: p.item?.discount || 0,
          },
          provider: {
            id: p.provider?.id || '',
            name: p.provider?.name || 'Unknown Provider',
            email: p.provider?.email || '',
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
  }, [token, statusFilter]);

  const getStatusBadge = (status: string) => {
    const statusColors: { [key: string]: string } = {
      pending: "bg-yellow-100 text-yellow-800",
      completed: "bg-green-100 text-green-800",
      cancelled: "bg-red-100 text-red-800",
    };
    return statusColors[status] || "bg-gray-100 text-gray-800";
  };

  const filteredPurchases = purchases.filter((p) => {
    if (!p) return false;
    const matchesSearch =
      p.item?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.buyerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.buyerEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.provider?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
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
        <p className="text-red-600">Error: {error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-[#0f285b]">All Purchases</h2>
        <div className="text-sm text-gray-600">
          Total: <span className="font-semibold">{filteredPurchases.length}</span> purchase{filteredPurchases.length !== 1 ? "s" : ""}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 items-center">
        <input
          type="text"
          placeholder="Search by service, buyer, provider..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#be9b49]"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#be9b49]"
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto bg-white rounded-lg shadow">
        <table className="min-w-full">
          <thead className="bg-[#0f285b] text-[#be9b49]">
            <tr>
              <th className="px-4 py-3 text-left">ID</th>
              <th className="px-4 py-3 text-left">Service</th>
              <th className="px-4 py-3 text-left">Buyer</th>
              <th className="px-4 py-3 text-left">Contact</th>
              <th className="px-4 py-3 text-left">Provider</th>
              <th className="px-4 py-3 text-left">Amount</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-left">Date</th>
            </tr>
          </thead>
          <tbody>
            {filteredPurchases.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                  No purchases found
                </td>
              </tr>
            ) : (
              filteredPurchases.map((purchase) => {
                const discount = purchase.item?.discount || 0;
                const displayedAmount = purchase.amount || 0;
                
                return (
                <tr key={purchase.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-600">#{purchase.id}</td>
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
                    <div>
                      <p className="font-medium">{purchase.provider?.name || "N/A"}</p>
                      <p className="text-sm text-gray-500">{purchase.provider?.email || ""}</p>
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
                    <p className="text-xs text-gray-500 mt-1">(Provider can update)</p>
                  </td>
                  <td className="px-4 py-3">
                    {purchase.purchaseDate ? new Date(purchase.purchaseDate).toLocaleDateString() : 'N/A'}
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
          filteredPurchases.map((purchase) => (
            <div key={purchase.id} className="border rounded-lg shadow p-4 bg-white">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <p className="text-xs text-gray-500">ID: #{purchase.id}</p>
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
              <div className="space-y-2">
                <div className="border-t pt-2">
                  <p className="text-sm">
                    <span className="font-medium">Buyer:</span> {purchase.buyerName}
                  </p>
                  <p className="text-xs text-gray-600">{purchase.buyerEmail}</p>
                </div>
                <div>
                  <p className="text-sm">
                    <span className="font-medium">Provider:</span> {purchase.provider?.name || "N/A"}
                  </p>
                  <p className="text-xs text-gray-600">{purchase.provider?.email || ""}</p>
                </div>
                <div>
                  <p className="text-sm">
                    <span className="font-medium">Contact:</span>
                  </p>
                  <p className="text-xs text-gray-600">{purchase.buyerEmail || 'N/A'}</p>
                  {purchase.buyerPhone && (
                    <p className="text-xs text-gray-600">{purchase.buyerPhone}</p>
                  )}
                </div>
                <p className="text-sm">
                  <span className="font-medium">Amount:</span>{" "}
                  {new Intl.NumberFormat("en-ET", { style: "currency", currency: "ETB" }).format(
                    Number(purchase.amount || 0)
                  )}
                  {purchase.item?.discount && purchase.item.discount > 0 && (
                    <span className="text-xs text-green-600 ml-2">({purchase.item.discount}% off)</span>
                  )}
                </p>
                <p className="text-sm">
                  <span className="font-medium">Date:</span>{" "}
                  {purchase.purchaseDate ? new Date(purchase.purchaseDate).toLocaleDateString() : 'N/A'}
                </p>
                <p className="text-xs text-gray-500">
                  Status can only be updated by provider
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AdminPurchaseList;

