import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Gift, Bell, CreditCard, User, TrendingUp, LogOut, Menu, Users } from "lucide-react";
import Navbar from "../Navbar";
import GiftActivity from "./GiftActivity";
import Notifications from "./Notifications";
import PaymentSummary from "./PaymentSummary";
import Account from "./Account";
import Referrals from "./Referrals";
import OverviewStats from "./OverviewStats";
import MembershipOptions from "../MembershipOptions";
import Footer from "../../Footer";
import BASE_URL from "../../../api/api";

type User = {
  _id: string;
  fullName: string;
  email?: string;
  role?: string;
};

const IndividualDashboard = () => {
  const [searchParams] = useSearchParams();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Handle OAuth callback with token
  useEffect(() => {
    const token = searchParams.get("token");
    const userId = searchParams.get("userId");

    if (token && userId) {
      const userFromLocalStorage = localStorage.getItem("user");
      let userData = userFromLocalStorage ? JSON.parse(userFromLocalStorage) : {};
      
      userData.token = token;
      userData.id = userId;
      localStorage.setItem("user", JSON.stringify(userData));

      fetch(`${BASE_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => {
          const updatedUser = { ...data, token };
          localStorage.setItem("user", JSON.stringify(updatedUser));
          setUser(updatedUser);
          setLoading(false);
        })
        .catch(err => {
          console.error("Failed to fetch user data:", err);
          setLoading(false);
        });

      window.history.replaceState({}, document.title, window.location.pathname);
    } else {
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
      setLoading(false);
    }
  }, [searchParams]);

  const [activeTab, setActiveTab] = useState<"overview" | "gifts" | "notifications" | "payments" | "referrals" | "account" | "membership">("overview");

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f5f5f5]">
        <div className="text-center">
          <p className="text-[#0f285b] text-lg">User not found. Please login again.</p>
        </div>
      </div>
    );
  }

  const menuItems = [
    { icon: TrendingUp, label: "Overview", tab: "overview" },
    { icon: Gift, label: "My Gifts", tab: "gifts" },
    { icon: Bell, label: "Notifications", tab: "notifications" },
    { icon: CreditCard, label: "Payments", tab: "payments" },
    { icon: Users, label: "Referrals", tab: "referrals" },
    { icon: User, label: "Account", tab: "account" },
    { icon: CreditCard, label: "Membership", tab: "membership" },
  ];

  const Sidebar = () => (
    <>
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-50
          w-64 bg-gradient-to-b from-[#0f285b] to-[#0f285b]
          text-white transform transition-transform duration-300 ease-in-out
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
      >
        {/* User Profile Section */}
        <div className="p-6 border-b border-[#be9b49]">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-[#be9b49] rounded-full flex items-center justify-center text-xl font-bold text-[#0f285b]">
              {user.fullName?.charAt(0).toUpperCase() || "U"}
            </div>
            <div>
              <h3 className="font-semibold text-lg">{user.fullName || "User"}</h3>
              <p className="text-[#be9b49] text-sm">Individual Member</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-2">
          {menuItems.map(({ icon: Icon, label, tab }) => (
            <button
              key={tab}
              onClick={() => {
                setActiveTab(tab as any);
                setSidebarOpen(false);
              }}
              className={`
                w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all
                ${activeTab === tab
                  ? "bg-[#be9b49] text-[#0f285b] shadow-lg"
                  : "text-white hover:bg-[#be9b49] hover:text-[#0f285b]"
                }
              `}
            >
              <Icon className={`${activeTab === tab ? "text-[#0f285b]" : "text-[#be9b49]"} w-5 h-5`} />
              <span className="font-medium">{label}</span>
            </button>
          ))}
        </nav>

        {/* Logout Button */}
        <div className="absolute bottom-6 left-0 right-0 px-4">
          <button
            onClick={() => {
              localStorage.clear();
              window.location.href = "/login";
            }}
            className="w-full flex items-center space-x-3 px-4 py-3 bg-[#0f285b] hover:bg-[#be9b49] hover:text-[#0f285b] rounded-lg transition-all text-white font-medium"
          >
            <LogOut className="w-5 h-5" />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );

  const renderContent = () => {
    switch (activeTab) {
      case "overview":
        return (
          <div className="space-y-6">
            {/* Welcome Card */}
            <div className="bg-gradient-to-r from-[#0f285b] to-[#0f285b] rounded-2xl p-8 text-white shadow-xl">
              <h2 className="text-3xl font-bold mb-2">Welcome back, {user.fullName}!</h2>
              <p className="text-[#be9b49] text-lg">Here's what's happening with your gifts today.</p>
            </div>

            {/* Stats Grid */}
            <OverviewStats userId={user._id} />

            {/* Quick Actions */}
            <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:border-green-500 hover:bg-green-50 transition-all">
                  <Gift className="w-6 h-6 text-green-600" />
                  <span className="font-medium text-gray-900">Send a Gift</span>
                </button>
                <button className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all">
                  <Bell className="w-6 h-6 text-blue-600" />
                  <span className="font-medium text-gray-900">View Notifications</span>
                </button>
                <button className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-all">
                  <CreditCard className="w-6 h-6 text-purple-600" />
                  <span className="font-medium text-gray-900">Add Payment</span>
                </button>
              </div>
            </div>

            {/* Recent Activity */}
            <GiftActivity userId={user._id} />
          </div>
        );

      case "gifts":
        return <GiftActivity userId={user._id} />;
      case "notifications":
        return <Notifications userId={user._id} />;
      case "payments":
        return <PaymentSummary userId={user._id} />;
      case "referrals":
        return <Referrals userId={user._id} />;
      case "account":
        return <Account />;
      case "membership":
        return <MembershipOptions role="user" />;
      default:
        return null;
    }
  };

  return (
    <>
      <div className="min-h-screen bg-[#f5f5f5] flex">
        {/* Sidebar */}
        <Sidebar />

        {/* Main Content */}
        <div className="flex-1 flex flex-col lg:ml-0">
          {/* Mobile Header */}
          <div className="lg:hidden bg-white border-b border-gray-200 p-4 flex items-center justify-between">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-lg hover:bg-gray-100"
            >
              <Menu className="w-6 h-6" />
            </button>
            <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
            <div className="w-10" />
          </div>

          {/* Navbar */}
          <Navbar />

          {/* Main Content Area */}
          <main className="flex-1 p-6">
            <div className="max-w-7xl mx-auto">{renderContent()}</div>
          </main>

          {/* Footer */}
          <Footer />
        </div>
      </div>
    </>
  );
};

export default IndividualDashboard;











