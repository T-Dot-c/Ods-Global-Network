import { useEffect, useState } from "react";
import axios from "axios";
import BASE_URL from "../../../api/api";
import { Gift, Package, Bell, DollarSign } from "lucide-react";

type OverviewStatsProps = {
  userId: string;
};

type StatsData = {
  totalGifts: number;
  activeGifts: number;
  notifications: number;
  totalSpent: number;
};

const OverviewStats = ({ userId }: OverviewStatsProps) => {
  const [stats, setStats] = useState<StatsData>({
    totalGifts: 0,
    activeGifts: 0,
    notifications: 0,
    totalSpent: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        // Enhanced authentication handling (try multiple methods)
        const userStr = localStorage.getItem("user");
        const token = localStorage.getItem("token") || (userStr ? JSON.parse(userStr).token : null);
        
        if (!token) {
          setLoading(false);
          return;
        }

        // Fetch purchases data
        const purchasesResponse = await axios.get(`${BASE_URL}/api/services/purchase`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        const purchases = purchasesResponse.data;
        
        // Calculate stats from purchases
        let totalGifts = 0;
        let activeGifts = 0;
        let totalSpent = 0;
        
        purchases.forEach((purchase: any) => {
          totalSpent += purchase.amount || 0;
          if (purchase.gifts && purchase.gifts.length > 0) {
            totalGifts += purchase.gifts.length;
            // Count active gifts (not delivered)
            activeGifts += purchase.gifts.filter((gift: any) => 
              gift.delivery_status !== 'delivered'
            ).length;
          }
        });

        // Generate notifications count from purchases
        let notifications = 0;
        purchases.forEach((purchase: any) => {
          // Payment confirmation notification
          notifications += 1;
          // Gift notifications
          if (purchase.gifts && purchase.gifts.length > 0) {
            notifications += purchase.gifts.length;
          }
        });

        setStats({
          totalGifts,
          activeGifts,
          notifications,
          totalSpent
        });
      } catch (err) {
        console.error("Stats fetch error:", err);
        // Keep default values on error
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [userId]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white rounded-xl p-6 shadow-md border border-gray-100">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-8 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100 hover:shadow-lg transition-shadow">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-600 text-sm font-medium">Total Gifts</p>
            <p className="text-3xl font-bold text-[#0f285b] mt-2">{stats.totalGifts}</p>
          </div>
          <div className="bg-[#be9b49] bg-opacity-10 p-3 rounded-lg">
            <Gift className="w-8 h-8 text-[#be9b49]" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100 hover:shadow-lg transition-shadow">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-600 text-sm font-medium">Active Now</p>
            <p className="text-3xl font-bold text-[#0f285b] mt-2">{stats.activeGifts}</p>
          </div>
          <div className="bg-green-100 p-3 rounded-lg">
            <Package className="w-8 h-8 text-green-600" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100 hover:shadow-lg transition-shadow">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-600 text-sm font-medium">Notifications</p>
            <p className="text-3xl font-bold text-[#0f285b] mt-2">{stats.notifications}</p>
          </div>
          <div className="bg-[#be9b49] bg-opacity-10 p-3 rounded-lg">
            <Bell className="w-8 h-8 text-[#be9b49]" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100 hover:shadow-lg transition-shadow">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-600 text-sm font-medium">Total Spent</p>
            <p className="text-3xl font-bold text-[#0f285b] mt-2">ETB {stats.totalSpent.toLocaleString()}</p>
          </div>
          <div className="bg-[#be9b49] bg-opacity-10 p-3 rounded-lg">
            <DollarSign className="w-8 h-8 text-[#be9b49]" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default OverviewStats;
