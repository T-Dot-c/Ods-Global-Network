import { useEffect, useState } from "react";
import axios from "axios";
import BASE_URL from "../../../api/api";

type Recipient = {
  name?: string;
  email?: string;
  phone?: string;
  whatsapp?: string;
  telegram?: string;
  photo?: string | null;
};

type Gift = {
  giftCode: string;
  recipient: Recipient;
  deliveryStatus?: string;
  occasion?: string;
};

type Purchase = {
  id: string;
  itemType: "Service" | "gift";
  item?: { id: string; title?: string; category?: string; location?: string; price?: number };
  provider?: { id: string; fullName?: string; email?: string; phone?: string };
  buyerName: string;
  buyerEmail: string;
  amount: number;
  purchaseDate: string;
  deliveryDate?: string;
  recipients: Recipient[];
  gifts: Gift[];
};

const GiftListForProvider = () => {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [messages, setMessages] = useState<{ [key: string]: string }>({});

  // Enhanced authentication handling (try multiple methods)
  const userStr = localStorage.getItem("user");
  const providerId = localStorage.getItem("providerId") || (userStr ? JSON.parse(userStr).id : null);
  const token = localStorage.getItem("token") || (userStr ? JSON.parse(userStr).token : null);

  useEffect(() => {
    const fetchPurchases = async () => {
      console.log("🔐 Provider authentication debug:", {
        userStr: userStr ? "exists" : "null",
        providerId: providerId ? "exists" : "null",
        token: token ? "exists" : "null",
        localStorage: {
          user: localStorage.getItem("user") ? "exists" : "null",
          token: localStorage.getItem("token") ? "exists" : "null",
          providerId: localStorage.getItem("providerId") ? "exists" : "null"
        }
      });

      if (!providerId || !token) {
        setError("Provider not logged in. Please log in again.");
        setLoading(false);
        return;
      }

      try {
        console.log("🎁 Fetching purchases for provider:", providerId);
        const res = await axios.get(`${BASE_URL}/purchase/provider/${providerId}/purchases`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log("🎁 API Response:", res.data);
        setPurchases(res.data || []);
      } catch (err: any) {
        console.error("❌ Failed to fetch purchases:", err);
        console.error("❌ Error details:", {
          status: err.response?.status,
          statusText: err.response?.statusText,
          data: err.response?.data,
          message: err.message
        });
        
        if (err.response?.status === 401) {
          setError("Authentication failed. Please log in again.");
        } else if (err.response?.status === 404) {
          setError("Provider not found. Please check your account.");
        } else {
          setError(`Failed to fetch purchases: ${err.response?.data?.msg || err.message}`);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchPurchases();
  }, [providerId, token]);

  const filteredPurchases = purchases.filter((p) => {
    const term = searchTerm.toLowerCase();
    return (
      (p.item?.title?.toLowerCase().includes(term) ?? false) ||
      p.buyerName.toLowerCase().includes(term) ||
      p.buyerEmail.toLowerCase().includes(term) ||
      p.recipients.some((r) => r.name?.toLowerCase().includes(term) ?? false) ||
      p.gifts.some((g) => g.giftCode?.toLowerCase().includes(term) ?? false)
    );
  });

  const handleStatusChange = async (giftCode: string, newStatus: string) => {
    try {
      console.log("🔄 Updating gift status:", { giftCode, newStatus });
      
      // Show loading message
      setMessages((prev) => ({ ...prev, [giftCode]: "⏳ Updating status..." }));
      
      const response = await axios.post(
        `${BASE_URL}/purchase/gift/update-status`,
        { giftCode, newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      console.log("✅ Status update response:", response.data);

      // Update local state
      setPurchases((prev) =>
        prev.map((p) => ({
          ...p,
          gifts: p.gifts.map((g) =>
            g.giftCode === giftCode ? { ...g, deliveryStatus: newStatus.toLowerCase() } : g
          ),
        }))
      );

      // Show success message with notification info
      const statusEmoji = newStatus === "delivered" ? "🎉" : newStatus === "canceled" ? "❌" : "⏳";
      setMessages((prev) => ({ 
        ...prev, 
        [giftCode]: `${statusEmoji} Status updated to ${newStatus} & recipient notified!` 
      }));

      // Clear message after 5 seconds
      setTimeout(() => {
        setMessages((prev) => {
          const newMessages = { ...prev };
          delete newMessages[giftCode];
          return newMessages;
        });
      }, 5000);

    } catch (err: any) {
      console.error("❌ Status update failed:", err);
      
      let errorMessage = "❌ Update failed";
      if (err.response?.status === 404) {
        errorMessage = "❌ Gift not found";
      } else if (err.response?.status === 400) {
        errorMessage = `❌ ${err.response.data?.msg || "Invalid request"}`;
      } else if (err.response?.status === 401) {
        errorMessage = "❌ Authentication failed";
      }
      
      setMessages((prev) => ({ ...prev, [giftCode]: errorMessage }));
      
      // Clear error message after 5 seconds
      setTimeout(() => {
        setMessages((prev) => {
          const newMessages = { ...prev };
          delete newMessages[giftCode];
          return newMessages;
        });
      }, 5000);
    }
  };

  if (loading) return <p className="text-center py-6 text-gray-500">Loading...</p>;
  if (error) return <p className="text-red-600 text-center">{error}</p>;

  return (
    <div className="px-2 sm:px-4 md:px-6 lg:px-8 py-6 max-w-7xl mx-auto">
      <h1 className="text-2xl md:text-3xl font-bold mb-6 text-center text-[#1c2b21]">
        Purchased Services & Gifts
      </h1>

      <input
        type="text"
        placeholder="Search purchases, gifts, or recipients..."
        className="w-full mb-6 p-2 md:p-3 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#D4AF37] text-sm md:text-base"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />

      <div className="overflow-x-auto">
        <table className="min-w-full border border-gray-200 shadow-md rounded-lg bg-white text-sm md:text-base">
          <thead className="bg-[#D4AF37] text-[#1c2b21] text-left text-xs sm:text-sm">
            <tr>
              <th className="px-2 md:px-4 py-2">Service</th>
              <th className="px-2 md:px-4 py-2">Buyer</th>
              <th className="px-2 md:px-4 py-2">Email</th>
              <th className="px-2 md:px-4 py-2">Recipient</th>
              <th className="px-2 md:px-4 py-2">Recipient Email</th>
              <th className="px-2 md:px-4 py-2">Phone</th>
              <th className="px-2 md:px-4 py-2">Gift Code</th>
              <th className="px-2 md:px-4 py-2">Status</th>
            </tr>
          </thead>

          <tbody>
            {filteredPurchases.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-6 text-gray-500">
                  No purchased services found.
                </td>
              </tr>
            ) : (
              filteredPurchases.map((p) => (
                <tr
                  key={p.id}
                  className="border-t hover:bg-gray-50 transition-colors duration-200"
                >
                  <td className="px-2 md:px-4 py-2">{p.item?.title || "Untitled"}</td>
                  <td className="px-2 md:px-4 py-2">{p.buyerName}</td>
                  <td className="px-2 md:px-4 py-2">{p.buyerEmail}</td>

                  <td className="px-2 md:px-4 py-2">
                    {p.recipients.map((r, idx) => (
                      <p key={idx} className="mb-1 truncate">{r.name || "N/A"}</p>
                    ))}
                  </td>

                  <td className="px-2 md:px-4 py-2">
                    {p.recipients.map((r, idx) => (
                      <p key={idx} className="mb-1 truncate">{r.email || "N/A"}</p>
                    ))}
                  </td>

                  <td className="px-2 md:px-4 py-2">
                    {p.recipients.map((r, idx) => (
                      <p key={idx} className="mb-1 truncate">{r.phone || "N/A"}</p>
                    ))}
                  </td>

                  <td className="px-2 md:px-4 py-2">
                    {p.gifts.map((g) => (
                      <p key={g.giftCode} className="mb-1 truncate">{g.giftCode || "N/A"}</p>
                    ))}
                  </td>

                  <td className="px-2 md:px-4 py-2">
                    {p.gifts.map((g) => (
                      <select
                        key={g.giftCode}
                        value={(g.deliveryStatus || "pending").toLowerCase()}
                        onChange={(e) => handleStatusChange(g.giftCode, e.target.value)}
                        className="border rounded px-1 text-xs md:text-sm w-full mb-1 focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
                      >
                        <option value="pending">Pending</option>
                        <option value="delivered">Delivered</option>
                        <option value="canceled">Canceled</option>
                      </select>
                    ))}
                    {p.gifts.map((g) =>
                      messages[g.giftCode] ? (
                        <p key={g.giftCode + "-msg"} className="text-xs text-gray-600 mt-1 truncate">
                          {messages[g.giftCode]}
                        </p>
                      ) : null
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* MOBILE: Block Layout for Small Screens */}
      <div className="md:hidden mt-6 space-y-4">
        {filteredPurchases.map((p) => (
          <div
            key={p.id}
            className="border rounded-lg shadow p-4 bg-white"
          >
            <p className="font-semibold">{p.item?.title || "Untitled"}</p>
            <p>Buyer: {p.buyerName}</p>
            <p>Email: {p.buyerEmail}</p>
            <div>
              <p className="font-semibold mt-2">Recipients:</p>
              {p.recipients.map((r, idx) => (
                <p key={idx} className="truncate">{r.name} ({r.email}) - {r.phone}</p>
              ))}
            </div>
            <div>
              <p className="font-semibold mt-2">Gifts:</p>
              {p.gifts.map((g) => (
                <div key={g.giftCode} className="flex items-center justify-between mt-1">
                  <p className="truncate">{g.giftCode}</p>
                  <select
                    value={(g.deliveryStatus || "pending").toLowerCase()}
                    onChange={(e) => handleStatusChange(g.giftCode, e.target.value)}
                    className="border rounded px-1 text-xs w-24 focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
                  >
                    <option value="pending">Pending</option>
                    <option value="delivered">Delivered</option>
                    <option value="canceled">Canceled</option>
                  </select>
                  {messages[g.giftCode] && (
                    <p className="text-xs text-gray-600 truncate ml-2">{messages[g.giftCode]}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default GiftListForProvider;














