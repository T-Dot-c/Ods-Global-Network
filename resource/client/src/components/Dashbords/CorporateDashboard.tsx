import { useState, useEffect } from "react";
import { Building2, TrendingUp, Users, DollarSign, Package, BarChart3, Settings, Bell, Plus, LogOut, Menu } from "lucide-react";
import Navbar from "./Navbar";
import Footer from "../Footer";

type User = {
  _id: string;
  fullName: string;
  email?: string;
  role?: string;
  companyName?: string;
};

const CorporateDashboard = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "employees" | "services" | "analytics" | "settings">("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-amber-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-orange-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-amber-50">
        <div className="text-center">
          <p className="text-red-600 text-lg">User not found. Please login again.</p>
        </div>
      </div>
    );
  }

  const menuItems = [
    { icon: TrendingUp, label: "Overview", tab: "overview" },
    { icon: Users, label: "Employees", tab: "employees" },
    { icon: Package, label: "Services", tab: "services" },
    { icon: BarChart3, label: "Analytics", tab: "analytics" },
    { icon: Settings, label: "Settings", tab: "settings" },
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
          w-64 bg-gradient-to-b from-orange-900 to-amber-900
          text-white transform transition-transform duration-300 ease-in-out
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
      >
        <div className="p-6 border-b border-orange-700">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-orange-600 rounded-full flex items-center justify-center text-xl font-bold">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">{user.companyName || "Corporate"}</h3>
              <p className="text-orange-300 text-sm">Corporate Account</p>
            </div>
          </div>
        </div>

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
                  ? "bg-orange-700 text-white shadow-lg"
                  : "text-orange-100 hover:bg-orange-800 hover:text-white"
                }
              `}
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium">{label}</span>
            </button>
          ))}
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
    switch (activeTab) {
      case "overview":
        return (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-orange-600 to-amber-600 rounded-2xl p-8 text-white shadow-xl">
              <div className="flex items-center space-x-3 mb-2">
                <Building2 className="w-8 h-8" />
                <h2 className="text-3xl font-bold">Welcome, {user.companyName || user.fullName}!</h2>
              </div>
              <p className="text-orange-100 text-lg">Manage your corporate account and services.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100 hover:shadow-lg transition-shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-medium">Total Employees</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">248</p>
                  </div>
                  <div className="bg-blue-100 p-3 rounded-lg">
                    <Users className="w-8 h-8 text-blue-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100 hover:shadow-lg transition-shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-medium">Active Services</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">36</p>
                  </div>
                  <div className="bg-orange-100 p-3 rounded-lg">
                    <Package className="w-8 h-8 text-orange-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100 hover:shadow-lg transition-shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-medium">Monthly Revenue</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">$45K</p>
                  </div>
                  <div className="bg-green-100 p-3 rounded-lg">
                    <DollarSign className="w-8 h-8 text-green-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100 hover:shadow-lg transition-shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-medium">Pending Orders</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">12</p>
                  </div>
                  <div className="bg-purple-100 p-3 rounded-lg">
                    <Bell className="w-8 h-8 text-purple-600" />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Corporate Quick Actions</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:border-orange-500 hover:bg-orange-50 transition-all">
                  <Users className="w-6 h-6 text-orange-600" />
                  <span className="font-medium text-gray-900">Manage Employees</span>
                </button>
                <button className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:border-amber-500 hover:bg-amber-50 transition-all">
                  <Plus className="w-6 h-6 text-amber-600" />
                  <span className="font-medium text-gray-900">Add Services</span>
                </button>
                <button className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:border-orange-500 hover:bg-orange-50 transition-all">
                  <BarChart3 className="w-6 h-6 text-orange-600" />
                  <span className="font-medium text-gray-900">View Analytics</span>
                </button>
              </div>
            </div>
          </div>
        );

      case "employees":
        return (
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-2xl font-bold mb-4">Employee Management</h2>
            <p className="text-gray-600">Employee management features coming soon.</p>
          </div>
        );

      case "services":
        return (
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-2xl font-bold mb-4">Corporate Services</h2>
            <p className="text-gray-600">Service management features coming soon.</p>
          </div>
        );

      case "analytics":
        return (
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-2xl font-bold mb-4">Analytics & Reports</h2>
            <p className="text-gray-600">Analytics dashboard coming soon.</p>
          </div>
        );

      case "settings":
        return (
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-2xl font-bold mb-4">Settings</h2>
            <p className="text-gray-600">Account settings coming soon.</p>
          </div>
        );

      default:
        return null;
    }
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
            <h1 className="text-xl font-bold text-gray-900">Corporate Dashboard</h1>
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

export default CorporateDashboard;
