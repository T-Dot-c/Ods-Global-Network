import { Link } from "react-router-dom";
import {
  Settings,
  Gift,
  Users,
  Package,
  FileText,
  MessageSquare,
  Briefcase,
  Heart,
  Shield,
  TrendingUp,
} from "lucide-react";
import { useEffect, useState } from "react";
import BASE_URL from "../../../api/api";
import LogoutButton from "../LogoutButton";

interface DashboardStats {
  activeUsers: number;
  totalServices: number;
  pendingReviews: number;
  totalRevenue: number;
}

export default function AdminDashboard() {
  const [userRole, setUserRole] = useState("");
  const [stats, setStats] = useState<DashboardStats>({
    activeUsers: 0,
    totalServices: 0,
    pendingReviews: 0,
    totalRevenue: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    setUserRole(user.role || "");
  }, []);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem("token") || JSON.parse(localStorage.getItem("user") || "{}").token;
        if (!token) {
          setLoading(false);
          return;
        }

        const response = await fetch(`${BASE_URL}/admin/dashboard-stats`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (response.ok) {
          const data = await response.json();
          setStats(data);
        } else {
          console.error("Failed to fetch stats");
        }
      } catch (error) {
        console.error("Error fetching dashboard stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const features = [
    {
      title: "Add Program",
      description: "Create and manage new health & wellness programs.",
      route: "/admin/add-program",
      icon: Heart,
      color: "from-pink-500 to-pink-600",
      bgColor: "bg-pink-50",
      roles: ["super_admin", "marketing_admin"],
    },
    {
      title: "Add Gift",
      description: "Add gift options and customize corporate gifting.",
      route: "/admin/add-gift",
      icon: Gift,
      color: "from-yellow-500 to-amber-600",
      bgColor: "bg-yellow-50",
      roles: ["super_admin", "marketing_admin"],
    },
    {
      title: "Manage Membership",
      description: "Update membership plans, perks, and pricing.",
      route: "/admin/manage-membership",
      icon: Settings,
      color: "from-purple-500 to-purple-600",
      bgColor: "bg-purple-50",
      roles: ["super_admin", "marketing_admin"],
    },
    {
      title: "Manage Services",
      description: "Approve, reject, or delete services.",
      route: "/admin/manage-services",
      icon: Package,
      color: "from-blue-500 to-blue-600",
      bgColor: "bg-blue-50",
      roles: ["super_admin"],
    },
    {
      title: "Add Service",
      description: "Manually add a new service as admin.",
      route: "/admin/add-service",
      icon: Package,
      color: "from-teal-500 to-teal-600",
      bgColor: "bg-teal-50",
      roles: ["super_admin"],
    },
    {
      title: "Create Blog Post",
      description: "Write and publish blog articles.",
      route: "/admin/blog-create",
      icon: FileText,
      color: "from-indigo-500 to-indigo-600",
      bgColor: "bg-indigo-50",
      roles: ["super_admin", "marketing_admin"],
    },
    {
      title: "View Blog Posts",
      description: "Manage and view all published content.",
      route: "/admin/blog-list",
      icon: FileText,
      color: "from-orange-500 to-orange-600",
      bgColor: "bg-orange-50",
      roles: ["super_admin", "marketing_admin"],
    },
    {
      title: "Support Requests",
      description: "View and respond to support inquiries.",
      route: "/admin/support-requests",
      icon: MessageSquare,
      color: "from-red-500 to-red-600",
      bgColor: "bg-red-50",
      roles: ["super_admin", "customer_support_admin"],
    },
    {
      title: "User Lists",
      description: "View and manage registered users.",
      route: "/admin/user-lists",
      icon: Users,
      color: "from-gray-500 to-gray-600",
      bgColor: "bg-gray-50",
      roles: ["super_admin"],
    },
    {
      title: "Membership Lists",
      description: "View and manage community members.",
      route: "/admin/community-list",
      icon: Users,
      color: "from-cyan-500 to-cyan-600",
      bgColor: "bg-cyan-50",
      roles: ["super_admin"],
    },
    {
      title: "Job Posting",
      description: "Post job opportunities.",
      route: "/admin/job-posting",
      icon: Briefcase,
      color: "from-violet-500 to-violet-600",
      bgColor: "bg-violet-50",
      roles: ["super_admin", "marketing_admin"],
    },
    {
      title: "Applicant List",
      description: "Review job applicants.",
      route: "/admin/applicant-list",
      icon: Users,
      color: "from-lime-500 to-lime-600",
      bgColor: "bg-lime-50",
      roles: ["super_admin", "customer_support_admin"],
    },
    {
      title: "Gift List & Confirm",
      description: "Review and confirm gift purchases.",
      route: "/admin/gift-list-confirm",
      icon: Gift,
      color: "from-amber-500 to-amber-600",
      bgColor: "bg-amber-50",
      roles: ["super_admin", "customer_support_admin"],
    },
  ];

  const visibleFeatures = features.filter((feature) =>
    feature.roles.includes(userRole)
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-[#fff9eb]">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#1c2b21] to-[#2d3f32] text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-start justify-between gap-4 mb-2">
            <div className="flex items-center gap-4">
            <div className="bg-[#D4AF37] p-3 rounded-xl">
              <Shield className="h-8 w-8 text-[#1c2b21]" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Admin Dashboard</h1>
              <p className="text-gray-300 mt-1">Platform management and oversight</p>
            </div>
            </div>
            <LogoutButton className="bg-red-500 hover:bg-red-600" />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-[#D4AF37]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Total Services</p>
                <p className="text-2xl font-bold text-[#1c2b21] mt-1">
                  {loading ? "..." : stats.totalServices.toLocaleString()}
                </p>
              </div>
              <Package className="h-10 w-10 text-[#D4AF37]" />
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Active Users</p>
                <p className="text-2xl font-bold text-[#1c2b21] mt-1">
                  {loading ? "..." : stats.activeUsers.toLocaleString()}
                </p>
              </div>
              <Users className="h-10 w-10 text-blue-500" />
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Pending Reviews</p>
                <p className="text-2xl font-bold text-[#1c2b21] mt-1">
                  {loading ? "..." : stats.pendingReviews.toLocaleString()}
                </p>
              </div>
              <MessageSquare className="h-10 w-10 text-green-500" />
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-purple-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Total Revenue</p>
                <p className="text-2xl font-bold text-[#1c2b21] mt-1">
                  {loading ? "..." : `ETB ${stats.totalRevenue.toLocaleString()}`}
                </p>
              </div>
              <TrendingUp className="h-10 w-10 text-purple-500" />
            </div>
          </div>
        </div>

        {/* Features Grid */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-[#1c2b21] mb-4">Management Tools</h2>
          {visibleFeatures.length === 0 ? (
            <div className="bg-white rounded-xl shadow-md p-8 text-center">
              <p className="text-gray-600 text-lg">You don't have access to any admin tools.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {visibleFeatures.map((item, index) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={index}
                    to={item.route}
                    className="group relative bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100"
                  >
                    <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${item.color}`}></div>
                    <div className="p-6">
                      <div className={`inline-flex p-3 rounded-lg ${item.bgColor} mb-4 group-hover:scale-110 transition-transform`}>
                        <Icon className={`h-6 w-6 text-[#1c2b21]`} />
                      </div>
                      <h3 className="text-lg font-semibold text-[#1c2b21] mb-2 group-hover:text-[#D4AF37] transition-colors">
                        {item.title}
                      </h3>
                      <p className="text-sm text-gray-600 leading-relaxed">{item.description}</p>
                      <div className="mt-4 flex items-center text-[#D4AF37] font-medium text-sm group-hover:translate-x-1 transition-transform">
                        Access <span className="ml-1">→</span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
