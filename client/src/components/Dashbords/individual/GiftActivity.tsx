import { useEffect, useState } from "react";
import axios from "axios";
import BASE_URL from "../../../api/api";
import { Gift, Calendar, User } from "lucide-react";

type Purchase = {
  id: number;
  itemType: string;
  service: {
    id: number;
    title: string;
    category: string;
    location: string;
  };
  provider: {
    id: number;
    fullName: string;
    email: string;
  };
  buyerName: string;
  buyerEmail: string;
  amount: number;
  deliveryDate: string;
  purchaseDate: string;
  gifts: Array<{
    id: number;
    gift_code: string;
    recipient_name: string;
    occasion_name: string;
    delivery_status: string;
    created_at: string;
    service_title: string;
    service_category: string;
    price: number;
  }>;
};

type GiftActivityProps = {
  userId: string;
};

const GiftActivity = ({ userId }: GiftActivityProps) => {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPurchases = async () => {
      try {
        setLoading(true);
        // Enhanced authentication handling (try multiple methods)
        const userStr = localStorage.getItem("user");
        const token = localStorage.getItem("token") || (userStr ? JSON.parse(userStr).token : null);
        
        if (!token) {
          setError("Please login to view your gift history");
          return;
        }

        const response = await axios.get(`${BASE_URL}/api/services/purchase`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        setPurchases(response.data);
      } catch (err) {
        console.error("Purchase fetch error:", err);
        setError("Failed to load purchase history");
      } finally {
        setLoading(false);
      }
    };

    fetchPurchases();
  }, [userId]);

  if (loading) {
    return (
      <div className="p-6 bg-white rounded-xl shadow-md border border-gray-100">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#D4AF37]"></div>
          <span className="ml-3 text-[#1c2b21]">Loading your gift history...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-white rounded-xl shadow-md border border-gray-100">
        <div className="text-center py-8">
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
        <h2 className="text-2xl font-bold text-[#1c2b21] mb-6 flex items-center">
          <Gift className="w-6 h-6 mr-3 text-[#D4AF37]" />
          My Gift History
        </h2>
        
        {purchases.length === 0 ? (
          <div className="text-center py-12">
            <Gift className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-[#1c2b21] mb-2">No gifts yet</h3>
            <p className="text-gray-600">Start exploring our services to send your first gift!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {purchases.map((purchase) => (
              <div key={purchase.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-semibold text-[#1c2b21] text-lg">{purchase.service.title}</h3>
                    <p className="text-gray-600 text-sm">{purchase.service.category}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-[#D4AF37] text-lg">ETB {purchase.amount}</p>
                    <p className="text-gray-500 text-sm">{new Date(purchase.purchaseDate).toLocaleDateString()}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center text-sm text-gray-600">
                    <User className="w-4 h-4 mr-2" />
                    <span>Provider: {purchase.provider.fullName}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Calendar className="w-4 h-4 mr-2" />
                    <span>Delivery: {new Date(purchase.deliveryDate).toLocaleDateString()}</span>
                  </div>
                </div>

                {purchase.gifts.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <h4 className="font-medium text-[#1c2b21] mb-2">Gift Recipients:</h4>
                    <div className="space-y-2">
                      {purchase.gifts.map((gift) => (
                        <div key={gift.id} className="bg-[#f5f5f5] rounded-lg p-3">
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="font-medium text-[#1c2b21]">{gift.recipient_name}</p>
                              <p className="text-sm text-gray-600">{gift.occasion_name}</p>
                            </div>
                            <div className="text-right">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                gift.delivery_status === 'delivered' 
                                  ? 'bg-green-100 text-green-800' 
                                  : gift.delivery_status === 'pending'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-gray-100 text-gray-800'
                              }`}>
                                {gift.delivery_status}
                              </span>
                              <p className="text-xs text-gray-500 mt-1">Code: {gift.gift_code}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default GiftActivity;


