import { useEffect, useState } from "react";
import axios from "axios";
import BASE_URL from "../../../api/api";
import { Bell, Calendar, Gift, CheckCircle, Clock } from "lucide-react";

type Notification = {
  id: number;
  message: string;
  type: 'gift_received' | 'gift_delivered' | 'payment_confirmed' | 'general';
  isRead: boolean;
  createdAt: string;
  relatedData?: {
    giftCode?: string;
    purchaseId?: number;
    amount?: number;
  };
};

type NotificationsProps = {
  userId: string;
};

const Notifications = ({ userId }: NotificationsProps) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        setLoading(true);
        // Enhanced authentication handling (try multiple methods)
        const userStr = localStorage.getItem("user");
        const token = localStorage.getItem("token") || (userStr ? JSON.parse(userStr).token : null);
        
        if (!token) {
          setError("Please login to view notifications");
          return;
        }

        // For now, we'll create mock notifications based on purchases
        // In a real app, you'd have a dedicated notifications endpoint
        const response = await axios.get(`${BASE_URL}/api/services/purchase`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        const purchases = response.data;
        
        // Generate notifications from purchases
        const mockNotifications: Notification[] = [];
        
        purchases.forEach((purchase: any) => {
          // Payment confirmation notification
          mockNotifications.push({
            id: purchase.id * 1000 + 1,
            message: `Payment confirmed for ${purchase.service.title}`,
            type: 'payment_confirmed',
            isRead: false,
            createdAt: purchase.purchaseDate,
            relatedData: {
              purchaseId: purchase.id,
              amount: purchase.amount
            }
          });
          
          // Gift delivery notifications
          purchase.gifts?.forEach((gift: any, index: number) => {
            mockNotifications.push({
              id: purchase.id * 1000 + 2 + index,
              message: `Gift delivered to ${gift.recipient_name} for ${gift.occasion_name}`,
              type: gift.delivery_status === 'delivered' ? 'gift_delivered' : 'gift_received',
              isRead: false,
              createdAt: gift.created_at,
              relatedData: {
                giftCode: gift.gift_code
              }
            });
          });
        });
        
        // Sort by date (newest first)
        mockNotifications.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        
        setNotifications(mockNotifications);
      } catch (err) {
        console.error("Notification fetch error:", err);
        setError("Failed to load notifications");
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, [userId]);

  const markAsRead = (notificationId: number) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === notificationId ? { ...notif, isRead: true } : notif
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notif => ({ ...notif, isRead: true }))
    );
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'gift_received':
        return <Gift className="w-5 h-5 text-[#be9b49]" />;
      case 'gift_delivered':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'payment_confirmed':
        return <CheckCircle className="w-5 h-5 text-blue-600" />;
      default:
        return <Bell className="w-5 h-5 text-[#be9b49]" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'gift_received':
        return 'border-l-[#be9b49] bg-[#be9b49] bg-opacity-5';
      case 'gift_delivered':
        return 'border-l-green-500 bg-green-50';
      case 'payment_confirmed':
        return 'border-l-blue-500 bg-blue-50';
      default:
        return 'border-l-gray-400 bg-gray-50';
    }
  };

  if (loading) {
    return (
      <div className="p-6 bg-white rounded-xl shadow-md border border-gray-100">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#be9b49]"></div>
          <span className="ml-3 text-[#0f285b]">Loading notifications...</span>
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

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-[#0f285b] flex items-center">
            <Bell className="w-6 h-6 mr-3 text-[#be9b49]" />
            Notifications
            {unreadCount > 0 && (
              <span className="ml-2 bg-[#be9b49] text-[#0f285b] text-xs font-bold px-2 py-1 rounded-full">
                {unreadCount}
              </span>
            )}
          </h2>
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="text-sm text-[#be9b49] hover:text-[#0f285b] font-medium"
            >
              Mark all as read
            </button>
          )}
        </div>
        
        {notifications.length === 0 ? (
          <div className="text-center py-12">
            <Bell className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-[#0f285b] mb-2">No notifications</h3>
            <p className="text-gray-600">You'll receive notifications about your gifts and payments here.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`border-l-4 rounded-lg p-4 transition-all hover:shadow-md ${
                  notification.isRead ? 'opacity-60' : ''
                } ${getNotificationColor(notification.type)}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 flex-1">
                    <div className="mt-1">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1">
                      <p className={`font-medium ${notification.isRead ? 'text-gray-600' : 'text-[#0f285b]'}`}>
                        {notification.message}
                      </p>
                      <div className="flex items-center mt-2 text-sm text-gray-500">
                        <Calendar className="w-4 h-4 mr-1" />
                        <span>{new Date(notification.createdAt).toLocaleDateString()}</span>
                        <Clock className="w-4 h-4 ml-3 mr-1" />
                        <span>{new Date(notification.createdAt).toLocaleTimeString()}</span>
                      </div>
                      {notification.relatedData?.giftCode && (
                        <p className="text-xs text-gray-500 mt-1">
                          Gift Code: {notification.relatedData.giftCode}
                        </p>
                      )}
                    </div>
                  </div>
                  {!notification.isRead && (
                    <button
                      onClick={() => markAsRead(notification.id)}
                      className="text-xs text-[#be9b49] hover:text-[#0f285b] font-medium"
                    >
                      Mark as read
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Notifications;

