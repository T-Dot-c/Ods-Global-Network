import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Gift, TrendingUp, Package, DollarSign, Users, LogOut, Menu, Building2, RefreshCw, List, CreditCard, ShoppingCart, ClipboardList } from "lucide-react";
import Navbar from "../Navbar";
import AddServiceForm from "../../Services/AddServiceForm";
import GiftListForProvider from "./GiftListForProvider";
import ProviderServicesList from "./ProviderServicesList";
import PurchaseListForProvider from "./PurchaseListForProvider";
import MembershipOptions from "../MembershipOptions";
import Footer from "../../Footer";
import { useProviderStats } from "../../../hooks/useProviderStats";
import BASE_URL from "../../../api/api";

interface AvailabilityReplyFormProps { 
  providerName?: string; 
  defaultTo?: string; 
  defaultServiceTitle?: string; 
  defaultCheckIn?: string; 
  defaultCheckOut?: string; 
}

interface AvailabilityRequest {
  id: string;
  serviceTitle: string;
  servicePrice?: number;
  senderName?: string;
  senderEmail?: string;
  checkInDate?: string;
  checkOutDate?: string;
  guests?: number;
  roomPref?: string;
}

// Helper function to calculate nights
const calculateNights = (checkIn?: string, checkOut?: string): number => {
  if (!checkIn || !checkOut) return 0;
  const inDate = new Date(checkIn);
  const outDate = new Date(checkOut);
  const diffTime = Math.abs(outDate.getTime() - inDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays > 0 ? diffDays : 1; // Minimum 1 night
};

const AvailabilityReplyForm = ({ providerName, defaultTo = "", defaultServiceTitle = "", defaultCheckIn = "", defaultCheckOut = "" }: AvailabilityReplyFormProps) => {
  const [to, setTo] = useState<string>(defaultTo);
  const [subject] = useState<string>("Room Availability Response");
  const [message, setMessage] = useState<string>("");
  const [serviceTitle, setServiceTitle] = useState<string>(defaultServiceTitle);
  const [checkInDate, setCheckInDate] = useState<string>(defaultCheckIn);
  const [checkOutDate, setCheckOutDate] = useState<string>(defaultCheckOut);

  const nights = (() => {
    if (!checkInDate || !checkOutDate) return undefined;
    const inD = new Date(checkInDate);
    const outD = new Date(checkOutDate);
    const diff = Math.ceil((outD.getTime() - inD.getTime()) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : 1;
  })();

  const [sending, setSending] = useState<boolean>(false);

  const handleSend = async () => {
    if (!to) {
      alert("Recipient email is required");
      return;
    }
    setSending(true);
    try {
      const res = await fetch(`${BASE_URL}/notifications/provider-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to, subject, message, providerName, serviceTitle, checkInDate, checkOutDate, nights }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.msg || "Failed to send email");
      }
      alert("Email sent successfully.");
      setTo("");
      setMessage("");
      setServiceTitle("");
      setCheckInDate("");
      setCheckOutDate("");
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : "Failed to send email";
      alert(errorMessage);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-3">
      <input
        type="email"
        placeholder="Guest email"
        value={to}
        onChange={(e) => setTo(e.target.value)}
        className="w-full border border-gray-300 rounded p-3"
      />
      <input
        type="text"
        placeholder="Service title (optional)"
        value={serviceTitle}
        onChange={(e) => setServiceTitle(e.target.value)}
        className="w-full border border-gray-300 rounded p-3"
      />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div>
          <label className="block text-sm mb-1">Check-in</label>
          <input type="date" value={checkInDate} onChange={(e) => setCheckInDate(e.target.value)} className="w-full border border-gray-300 rounded p-3" />
        </div>
        <div>
          <label className="block text-sm mb-1">Check-out</label>
          <input type="date" value={checkOutDate} onChange={(e) => setCheckOutDate(e.target.value)} className="w-full border border-gray-300 rounded p-3" />
        </div>
        <div>
          <label className="block text-sm mb-1">Nights</label>
          <input type="number" readOnly value={nights || ""} className="w-full border border-gray-300 rounded p-3 bg-gray-100" />
        </div>
      </div>
      <textarea
        placeholder="Write your availability response..."
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        className="w-full border border-gray-300 rounded p-3 h-40"
      />
      <button 
        onClick={handleSend} 
        disabled={sending} 
        className="bg-gold text-green px-5 py-2 rounded font-semibold disabled:opacity-50"
      >
        {sending ? "Sending..." : "Send Email"}
      </button>
    </div>
  );
};

interface UserData {
  id: string;
  role: string;
  fullName: string;
  email?: string;
}

const ProviderDashboard = () => {
  const navigate = useNavigate();
  const storedUser = localStorage.getItem("user");
  const user = storedUser ? JSON.parse(storedUser) as UserData : null;
  
  const [activeTab, setActiveTab] = useState<"overview" | "add" | "confirm" | "availability" | "services" | "membership" | "purchases">("overview");
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  const [requests, setRequests] = useState<AvailabilityRequest[]>([]);
  const [loadingRequests, setLoadingRequests] = useState<boolean>(false);
  
  const { stats, recentOrders, loading, error, refetch } = useProviderStats();

  useEffect(() => {
    if (activeTab === "availability" && user?.id) {
      const fetchRequests = async () => {
        setLoadingRequests(true);
        try {
          const res = await fetch(`${BASE_URL}/support/availability/provider/${user.id}`);
          const data = await res.json();
          setRequests(Array.isArray(data) ? data : []);
        } catch (e) {
          setRequests([]);
        } finally {
          setLoadingRequests(false);
        }
      };
      fetchRequests();
    }
  }, [activeTab, user?.id]);

  if (!user || (user.role !== "provider" && user.role !== "super_admin")) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-6 font-sans">
        <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md w-full text-center border border-gray-100 space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#0F285B] flex items-center justify-center mx-auto">
            <Building2 className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-[#0F285B]">Healthcare Provider Portal</h3>
          <p className="text-gray-500 text-xs">
            {user 
              ? `You are currently logged in as "${user.role}". Please switch to a Provider account to view this operations center.`
              : "Please sign in with Provider credentials to access this dashboard."}
          </p>
          <div className="bg-slate-50 p-3 rounded-xl border border-gray-200 text-left text-xs font-mono space-y-1">
            <div className="flex justify-between">
              <span className="text-gray-400">Email:</span>
              <strong className="text-[#0F285B]">provider@ods.global</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Password:</span>
              <strong className="text-[#0F285B]">Provider@2026!</strong>
            </div>
          </div>
          <button
            onClick={() => navigate("/login")}
            className="w-full py-3 bg-[#0F285B] hover:bg-[#091838] text-[#EDC45B] font-bold rounded-xl text-xs transition shadow-md"
          >
            Go to Provider Sign In ➜
          </button>
        </div>
      </div>
    );
  }

  const menuItems: Array<{
    icon: typeof TrendingUp;
    label: string;
    tab?: "overview" | "add" | "confirm" | "availability" | "services" | "membership" | "purchases";
    path?: string;
  }> = [
    { icon: TrendingUp, label: "Overview", tab: "overview" },
    { icon: List, label: "My Services", tab: "services" },
    { icon: Plus, label: "Add Service", tab: "add" },
    { icon: ShoppingCart, label: "My Purchases", tab: "purchases" },
    { icon: ClipboardList, label: "Browse Service Requests", path: "/provider/requests" },
    { icon: Gift, label: "Confirm Deliveries", tab: "confirm" },
    { icon: Package, label: "Check Room Availability", tab: "availability" },
    { icon: CreditCard, label: "Membership", tab: "membership" },
  ];

  const Sidebar = () => (
    <>
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-50
          w-64 bg-green text-white transform transition-transform duration-300 ease-in-out
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
      >
        <div className="p-6 border-b border-gray-600">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gold rounded-full flex items-center justify-center text-xl font-bold text-green">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">{user.fullName || "Provider"}</h3>
              <p className="text-gray-300 text-sm">Service Provider</p>
            </div>
          </div>
        </div>

        <nav className="p-4 space-y-2">
          {menuItems.map(({ icon: Icon, label, tab, path }) => {
            const isActive = tab ? activeTab === tab : false;
            return (
              <button
                key={path || tab}
                onClick={() => {
                  if (path) {
                    navigate(path);
                    return;
                  }
                  if (tab) {
                    setActiveTab(tab);
                  }
                  setSidebarOpen(false);
                }}
                className={`
                  w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all
                  ${isActive
                    ? "bg-gold text-green shadow-lg"
                    : "text-gray-200 hover:bg-gray-700 hover:text-white"
                  }
                `}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{label}</span>
              </button>
            );
          })}
        </nav>

        <div className="absolute bottom-6 left-0 right-0 px-4">
          <button
            onClick={() => {
              localStorage.clear();
              window.location.href = "/login";
            }}
            className="w-full flex items-center space-x-3 px-4 py-3 bg-red-600 hover:bg-red-700 rounded-lg transition-all text-white font-medium"
          >
            <LogOut className="w-5 h-5" />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );

  const renderContent = () => {
    if (activeTab === "availability") {
      return (
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-2xl font-bold mb-4">Respond to Room Availability</h2>
          <p className="text-sm text-gray-600 mb-4">Review guest requests and send an email reply.</p>
          {loadingRequests ? (
            <p>Loading requests...</p>
          ) : requests.length === 0 ? (
            <p className="text-gray-600">No availability requests yet.</p>
          ) : (
            <div className="space-y-4">
              {requests.map((r) => {
                const nights = calculateNights(r.checkInDate, r.checkOutDate);
                const totalAmount = r.servicePrice && nights > 0 ? r.servicePrice * nights : null;
                
                return (
                <div key={r.id} className="border rounded p-4">
                  <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="font-semibold text-lg">{r.serviceTitle}</p>
                        <p className="text-sm text-gray-600 mt-1">Guest: {r.senderName || "—"} ({r.senderEmail || "—"})</p>
                      <p className="text-sm text-gray-600">Dates: {r.checkInDate} → {r.checkOutDate} {r.guests ? `• Guests: ${r.guests}` : ""}</p>
                      {r.roomPref && <p className="text-sm text-gray-600">Preference: {r.roomPref}</p>}
                        
                        {/* Nights and Total Amount Calculation */}
                        <div className="mt-3 p-3 bg-green/10 rounded-lg border border-green/20">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-sm font-medium text-gray-700">Number of Nights:</span>
                            <span className="text-sm font-bold text-green">{nights} {nights === 1 ? 'night' : 'nights'}</span>
                          </div>
                          {r.servicePrice && (
                            <>
                              <div className="flex justify-between items-center mb-2">
                                <span className="text-sm text-gray-600">Price per Night:</span>
                                <span className="text-sm font-medium text-gray-800">ETB {r.servicePrice.toLocaleString()}</span>
                              </div>
                              {totalAmount && (
                                <div className="flex justify-between items-center pt-2 border-t border-green/20">
                                  <span className="text-base font-bold text-[#1c2b21]">Total Amount:</span>
                                  <span className="text-lg font-bold text-green">ETB {totalAmount.toLocaleString()}</span>
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                  </div>
                  <div className="mt-3">
                    <AvailabilityReplyForm
                      providerName={user.fullName}
                      key={`reply-${r.id}`}
                      defaultTo={r.senderEmail}
                      defaultServiceTitle={r.serviceTitle}
                      defaultCheckIn={r.checkInDate?.slice(0,10)}
                      defaultCheckOut={r.checkOutDate?.slice(0,10)}
                    />
                  </div>
                </div>
                );
              })}
            </div>
          )}
        </div>
      );
    }
    if (activeTab === "add") {
      return (
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-2xl font-bold mb-4">Add New Service</h2>
          <AddServiceForm />
        </div>
      );
    }

    if (activeTab === "confirm") {
      return (
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-2xl font-bold mb-4">Confirm Gift Delivery</h2>
          <GiftListForProvider />
        </div>
      );
    }

    if (activeTab === "services") {
      return (
        <div className="bg-white rounded-xl shadow-md p-6">
          <ProviderServicesList />
        </div>
      );
    }

    if (activeTab === "membership") {
      return <MembershipOptions role="provider" />;
    }

    if (activeTab === "purchases") {
      return (
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-2xl font-bold mb-4 text-[#1c2b21]">My Purchases</h2>
          <p className="text-gray-600 mb-6">Manage and update the status of service purchases for your services.</p>
          <PurchaseListForProvider />
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div className="bg-green rounded-2xl p-8 text-white shadow-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 mb-2">
              <Building2 className="w-8 h-8 text-gold" />
              <div>
                <h2 className="text-3xl font-bold">Welcome, {user.fullName}!</h2>
                <p className="text-gray-200 text-lg">Manage your services and deliveries.</p>
              </div>
            </div>
            <button
              onClick={refetch}
              disabled={loading}
              className="flex items-center space-x-2 px-4 py-2 bg-gold text-green rounded-lg hover:bg-yellow-500 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-600">Error loading stats: {error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Total Services</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {loading ? '...' : (stats?.totalServices ?? 0)}
                </p>
              </div>
              <div className="bg-green p-3 rounded-lg">
                <Package className="w-8 h-8 text-gold" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Pending Orders</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {loading ? '...' : (stats?.pendingOrders ?? 0)}
                </p>
              </div>
              <div className="bg-orange-100 p-3 rounded-lg">
                <Gift className="w-8 h-8 text-orange-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Total Revenue</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {loading ? '...' : `$${(stats?.totalRevenue ?? 0).toLocaleString()}`}
                </p>
              </div>
              <div className="bg-green p-3 rounded-lg">
                <DollarSign className="w-8 h-8 text-gold" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Active Customers</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {loading ? '...' : (stats?.activeCustomers ?? 0)}
                </p>
              </div>
              <div className="bg-green p-3 rounded-lg">
                <Users className="w-8 h-8 text-gold" />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={() => setActiveTab("add")}
              className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:border-green hover:bg-green hover:text-white transition-all"
            >
              <Plus className="w-6 h-6 text-green" />
              <span className="font-medium text-gray-900 hover:text-white">Add New Service</span>
            </button>
            <button
              onClick={() => navigate("/provider/requests")}
              className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:border-green hover:bg-green hover:text-white transition-all"
            >
              <ClipboardList className="w-6 h-6 text-green" />
              <span className="font-medium text-gray-900">Browse Service Requests</span>
            </button>
            <button
              onClick={() => setActiveTab("confirm")}
              className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:border-gold hover:bg-gold hover:text-green transition-all"
            >
              <Gift className="w-6 h-6 text-gold" />
              <span className="font-medium text-gray-900 hover:text-green">Confirm Deliveries</span>
            </button>
            <button
              onClick={() => setActiveTab("availability")}
              className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:border-gray-300 hover:bg-gray-50 transition-all"
            >
              <Package className="w-6 h-6 text-green" />
              <span className="font-medium text-gray-900">Check Room Availability</span>
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Recent Orders</h3>
          {loading ? (
            <p className="text-gray-600">Loading recent orders...</p>
          ) : recentOrders.length === 0 ? (
            <p className="text-gray-600">No recent orders to display.</p>
          ) : (
            <div className="space-y-4">
              {recentOrders.map((order) => (
                <div key={order.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-semibold text-gray-900">{order.recipientName}</h4>
                      <p className="text-sm text-gray-600">{order.serviceName}</p>
                      <p className="text-sm text-gray-500">{order.message}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-green">${order.amount}</p>
                      <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                        order.status === 'delivered' 
                          ? 'bg-green-100 text-green-800' 
                          : order.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {order.status}
                      </span>
                    </div>
                  </div>
                  <div className="mt-2 text-xs text-gray-500">
                    From: {order.senderName} • {new Date(order.createdAt).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="min-h-screen bg-gray-50 flex">
        <Sidebar />

        <div className="flex-1 flex flex-col lg:ml-0">
          <div className="lg:hidden bg-white border-b border-gray-200 p-4 flex items-center justify-between">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-lg hover:bg-gray-100"
            >
              <Menu className="w-6 h-6" />
            </button>
            <h1 className="text-xl font-bold text-gray-900">Provider Dashboard</h1>
            <div className="w-10" />
          </div>

          <Navbar />

          <main className="flex-1 p-6">
            <div className="max-w-7xl mx-auto">{renderContent()}</div>
          </main>

          <Footer />
        </div>
      </div>
    </>
  );
};

export default ProviderDashboard;






