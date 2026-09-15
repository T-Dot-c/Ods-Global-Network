import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { FaUserTie } from "react-icons/fa";
import Navbar from "./Navbar";
import AdminDashboardCards from "./AdminDashboardCards";
import LogoutButton from "./LogoutButton";

type UserType = {
  fullName?: string;
  role?: string;
};

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<UserType | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) {
      navigate("/login");
    } else {
      const userData = JSON.parse(storedUser);
      setUser(userData);
      
      // Redirect to dedicated dashboards
      if (userData.role === "super_admin") {
        navigate("/admin-dashboard");
        return;
      }
      if (userData.role === "marketing_admin") {
        navigate("/marketing-dashboard");
        return;
      }
      if (userData.role === "customer_support_admin") {
        navigate("/support-dashboard");
        return;
      }
      if (userData.role === "corporate") {
        navigate("/corporate-dashboard");
        return;
      }
      if (userData.role === "diaspora") {
        navigate("/diaspora-dashboard");
        return;
      }
      if (userData.role === "individual") {
        navigate("/individual-dashboard");
        return;
      }
      if (userData.role === "provider") {
        navigate("/provider-dashboard");
        return;
      }
    }
  }, [navigate]);

  if (!user) return null;

  return (
    <>
      <Navbar />
      <div className="bg-[#f5f5f5] min-h-screen py-12 px-6 md:px-16">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Welcome Card */}
          <div className="bg-white p-6 md:p-10 rounded-xl shadow text-center">
            <div className="flex justify-end mb-3">
              <LogoutButton />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-[#0f285b] mb-2">
              Welcome, {user.fullName || "User"} 🎉
            </h1>
            <p className="text-gray-600">
              {user.role === "admin"
                ? "Manage your platform and services as an Admin."
                : user.role === "provider"
                ? "Manage your offerings and track your performance."
                : "Enjoy access to personalized wellness and health services."}
            </p>
          </div>

          {/* Admin View */}
          {user.role === "admin" && (
            <div className="bg-white p-6 md:p-10 rounded-xl shadow">
              <h2 className="text-2xl font-semibold mb-4 text-[#0f285b]">
                Admin Dashboard
              </h2>
              <p className="text-gray-600 mb-6">
                You can manage programs, gifts, memberships, and more.
              </p>
              <AdminDashboardCards />
            </div>
          )}

          {/* Non-admin Dashboard Sections */}
          {user.role !== "admin" && (
            <div className="grid md:grid-cols-2 gap-6">
              {/* Membership Info */}
              <div className="bg-gradient-to-br from-white to-gray-50 p-6 md:p-8 rounded-2xl shadow-lg border border-gray-100">
                <div className="flex items-center gap-4 mb-4">
                  <FaUserTie className="text-3xl text-[#0f285b]" />
                  <h3 className="text-xl font-bold text-[#0f285b]">
                    Your Membership
                  </h3>
                </div>
                <p className="text-gray-600 mb-6 leading-relaxed">
                  Choose the membership plan that fits you best — whether it's
                  Basic for essential access, Enterprise for team collaboration,
                  or Premium for full-featured wellness benefits.
                </p>
                <Link
                  to="/membership"
                  className="inline-block bg-[#be9b49] text-[#0f285b] font-semibold py-2 px-6 rounded-lg hover:rounded-full transition"
                >
                  View Membership
                </Link>
              </div>

              {/* Provider Panel */}
              {user.role === "provider" && (
                <div className="bg-gradient-to-br from-white to-gray-50 p-6 md:p-8 rounded-2xl shadow-lg border border-gray-100">
                  <h2 className="text-2xl font-bold mb-3 text-[#0f285b] flex items-center gap-2">
                    ⚙️ Service Provider Panel
                  </h2>
                  <p className="text-gray-600 mb-4 leading-relaxed">
                    Manage your services and interact with your audience.
                  </p>
                  <ul className="list-disc pl-5 text-gray-700 space-y-1 mb-6 text-sm md:text-base">
                    <li>Update or remove your services</li>
                    <li>Track bookings from users</li>
                    <li>Monitor analytics and performance</li>
                    <li>Create time-limited offers</li>
                  </ul>
                  <button
                    onClick={() => navigate("/provider/add-service")}
                    className="bg-[#be9b49] text-[#0f285b] font-semibold py-2 px-6 rounded-lg hover:rounded-full transition"
                  >
                    ➕ Add New Service
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Specific Role Additions */}
          {user.role === "individual" && (
            <div className="bg-white p-6 rounded-xl shadow">
              <h2 className="text-xl font-bold text-[#0f285b] mb-2">
                🌿 Wellness Access
              </h2>
              <p className="text-gray-600">
                As an individual user, you can explore wellness programs,
                purchase gifts, and subscribe to services tailored to you.
              </p>
            </div>
          )}

          {user.role === "corporate" && (
            <div className="bg-white p-6 rounded-xl shadow">
              <h2 className="text-xl font-bold text-[#0f285b] mb-2">
                🏢 Corporate Portal
              </h2>
              <p className="text-gray-600">
                Manage your team’s wellness packages, track usage, and set
                company benefits.
              </p>
            </div>
          )}

          {user.role === "diaspora" && (
            <div className="bg-white p-6 rounded-xl shadow">
              <h2 className="text-xl font-bold text-[#0f285b] mb-2">
                🌍 Diaspora Member Area
              </h2>
              <p className="text-gray-600">
                Send wellness gifts, support loved ones back home, and manage
                cross-border services.
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Dashboard;
