import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Gift, Bell, TrendingUp, LogOut, Menu, Users, Globe, Heart, Home, RefreshCw, Calendar, DollarSign, CreditCard } from 'lucide-react';
import Navbar from '../Navbar';
import MembershipOptions from '../MembershipOptions';
import Footer from '../../Footer';
import BASE_URL from '../../../api/api';
import { useDiasporaStats, useDiasporaEvents, useDiasporaCauses } from '../../../hooks/useDiasporaStats';

type User = {
  _id: string;
  fullName: string;
  email?: string;
  role?: string;
};


const DiasporaDashboard = () => {
  const [searchParams] = useSearchParams();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Diaspora-specific data hooks
  const { stats, loading: statsLoading, refetch: refetchStats } = useDiasporaStats();
  const { events, loading: eventsLoading, error: eventsError } = useDiasporaEvents();
  const { causes, loading: causesLoading, error: causesError } = useDiasporaCauses();

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

  const [activeTab, setActiveTab] = useState<"overview" | "community" | "membership">("overview");

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
          <p className="text-[#1c2b21] text-lg">User not found. Please login again.</p>
        </div>
      </div>
    );
  }

  const menuItems = [
    { icon: TrendingUp, label: "Overview", tab: "overview" },
    { icon: Globe, label: "Community", tab: "community" },
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
          w-64 bg-gradient-to-b from-[#1c2b21] to-[#1c2b21]
          text-white transform transition-transform duration-300 ease-in-out
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
      >
        {/* User Profile Section */}
        <div className="p-6 border-b border-[#D4AF37]">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-[#D4AF37] rounded-full flex items-center justify-center text-xl font-bold text-[#1c2b21]">
              {user.fullName?.charAt(0).toUpperCase() || "D"}
            </div>
            <div>
              <h3 className="font-semibold text-lg">{user.fullName || "User"}</h3>
              <p className="text-[#D4AF37] text-sm">Ethiopian Diaspora</p>
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
                  ? "bg-[#D4AF37] text-[#1c2b21] shadow-lg"
                  : "text-white hover:bg-[#D4AF37] hover:text-[#1c2b21]"
                }
              `}
            >
              <Icon className={`${activeTab === tab ? "text-[#1c2b21]" : "text-[#D4AF37]"} w-5 h-5`} />
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
            className="w-full flex items-center space-x-3 px-4 py-3 bg-[#1c2b21] hover:bg-[#D4AF37] hover:text-[#1c2b21] rounded-lg transition-all text-white font-medium"
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
            <div className="bg-gradient-to-r from-[#1c2b21] to-[#1c2b21] rounded-2xl p-8 text-white shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <Globe className="w-8 h-8 text-[#D4AF37]" />
                  <div>
                    <h2 className="text-3xl font-bold mb-2">Welcome back, {user.fullName}!</h2>
                    <p className="text-[#D4AF37] text-lg">Connecting hearts across continents.</p>
                  </div>
                </div>
                <button
                  onClick={refetchStats}
                  disabled={statsLoading}
                  className="p-2 bg-[#D4AF37] text-[#1c2b21] rounded-lg hover:bg-opacity-80 transition-all disabled:opacity-50"
                >
                  <RefreshCw className={`w-5 h-5 ${statsLoading ? 'animate-spin' : ''}`} />
                </button>
              </div>
              <div className="flex items-center space-x-4 text-sm">
                <div className="flex items-center space-x-2">
                  <Heart className="w-4 h-4 text-[#D4AF37]" />
                  <span>Supporting Ethiopia</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Home className="w-4 h-4 text-[#D4AF37]" />
                  <span>Global Community</span>
                </div>
              </div>
            </div>

            {/* Diaspora Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white rounded-xl p-6 shadow-md border border-[#D4AF37]">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Gifts Sent</p>
                    <p className="text-2xl font-bold text-[#1c2b21]">{statsLoading ? '...' : stats.totalGiftsSent}</p>
                  </div>
                  <Gift className="w-8 h-8 text-[#D4AF37]" />
                </div>
              </div>
              
              <div className="bg-white rounded-xl p-6 shadow-md border border-[#D4AF37]">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Amount Sent</p>
                    <p className="text-2xl font-bold text-[#1c2b21]">${statsLoading ? '...' : stats.totalAmountSent}</p>
                  </div>
                  <DollarSign className="w-8 h-8 text-[#D4AF37]" />
                </div>
              </div>
              
              <div className="bg-white rounded-xl p-6 shadow-md border border-[#D4AF37]">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Connections</p>
                    <p className="text-2xl font-bold text-[#1c2b21]">{statsLoading ? '...' : stats.activeConnections}</p>
                  </div>
                  <Users className="w-8 h-8 text-[#D4AF37]" />
                </div>
              </div>
              
              <div className="bg-white rounded-xl p-6 shadow-md border border-[#D4AF37]">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Events</p>
                    <p className="text-2xl font-bold text-[#1c2b21]">{statsLoading ? '...' : stats.communityEvents}</p>
                  </div>
                  <Calendar className="w-8 h-8 text-[#D4AF37]" />
                </div>
              </div>
            </div>

            {/* Diaspora-Specific Quick Actions */}
            <div className="bg-white rounded-xl p-6 shadow-md border border-[#D4AF37]">
              <h3 className="text-xl font-bold text-[#1c2b21] mb-4">Diaspora Actions</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <button className="flex items-center space-x-3 p-4 border border-[#D4AF37] rounded-lg hover:bg-[#D4AF37] hover:text-[#1c2b21] transition-all">
                  <Gift className="w-6 h-6 text-[#D4AF37]" />
                  <span className="font-medium text-[#1c2b21]">Send Gift Home</span>
                </button>
                <button className="flex items-center space-x-3 p-4 border border-[#D4AF37] rounded-lg hover:bg-[#D4AF37] hover:text-[#1c2b21] transition-all">
                  <Bell className="w-6 h-6 text-[#D4AF37]" />
                  <span className="font-medium text-[#1c2b21]">Community Updates</span>
                </button>
                <button className="flex items-center space-x-3 p-4 border border-[#D4AF37] rounded-lg hover:bg-[#D4AF37] hover:text-[#1c2b21] transition-all">
                  <Globe className="w-6 h-6 text-[#D4AF37]" />
                  <span className="font-medium text-[#1c2b21]">Join Community</span>
                </button>
                <button className="flex items-center space-x-3 p-4 border border-[#D4AF37] rounded-lg hover:bg-[#D4AF37] hover:text-[#1c2b21] transition-all">
                  <Heart className="w-6 h-6 text-[#D4AF37]" />
                  <span className="font-medium text-[#1c2b21]">Support Causes</span>
                </button>
              </div>
            </div>
          </div>
        );

      case "community":
        return (
          <div className="space-y-6">
            <div className="bg-white rounded-xl p-6 shadow-md border border-[#D4AF37]">
              <h3 className="text-2xl font-bold text-[#1c2b21] mb-4">Ethiopian Diaspora Community</h3>
              <p className="text-gray-600 mb-6">
                Connect with fellow Ethiopians around the world and support causes back home.
              </p>
              
              {/* Community Events */}
              <div className="mb-8">
                <h4 className="text-xl font-semibold text-[#1c2b21] mb-4 flex items-center">
                  <Calendar className="w-5 h-5 mr-2 text-[#D4AF37]" />
                  Upcoming Events
                </h4>
                {eventsLoading ? (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#D4AF37] mx-auto"></div>
                    <p className="text-gray-600 mt-2">Loading events...</p>
                  </div>
                ) : eventsError ? (
                  <div className="text-center py-4 text-red-600">
                    <p>Error loading events: {eventsError}</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {events.map((event) => (
                      <div key={event.id} className="border border-[#D4AF37] rounded-lg p-4">
                        <h5 className="font-semibold text-[#1c2b21] mb-2">{event.title}</h5>
                        <p className="text-gray-600 text-sm mb-2">{event.description}</p>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-[#D4AF37] font-medium">{event.date}</span>
                          <span className="bg-[#D4AF37] text-[#1c2b21] px-2 py-1 rounded text-xs">{event.type}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Support Causes */}
              <div>
                <h4 className="text-xl font-semibold text-[#1c2b21] mb-4 flex items-center">
                  <Heart className="w-5 h-5 mr-2 text-[#D4AF37]" />
                  Support Causes
                </h4>
                {causesLoading ? (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#D4AF37] mx-auto"></div>
                    <p className="text-gray-600 mt-2">Loading causes...</p>
                  </div>
                ) : causesError ? (
                  <div className="text-center py-4 text-red-600">
                    <p>Error loading causes: {causesError}</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {causes.map((cause) => (
                      <div key={cause.id} className="border border-[#D4AF37] rounded-lg p-4">
                        <h5 className="font-semibold text-[#1c2b21] mb-2">{cause.title}</h5>
                        <p className="text-gray-600 text-sm mb-3">{cause.description}</p>
                        <div className="mb-3">
                          <div className="flex justify-between text-sm mb-1">
                            <span>Progress</span>
                            <span className="text-[#D4AF37] font-medium">{cause.progress}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-[#D4AF37] h-2 rounded-full" 
                              style={{ width: `${cause.progress}%` }}
                            ></div>
                          </div>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">${cause.currentAmount} / ${cause.targetAmount}</span>
                          <button className="bg-[#1c2b21] text-white px-3 py-1 rounded text-sm hover:bg-[#D4AF37] hover:text-[#1c2b21] transition-colors">
                            Support
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        );

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
            <h1 className="text-xl font-bold text-gray-900">Diaspora Dashboard</h1>
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

export default DiasporaDashboard;