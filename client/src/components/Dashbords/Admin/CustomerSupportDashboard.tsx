import { Link } from "react-router-dom";
import {
  MessageSquare,
  Users,
  ShoppingCart,
  Building2,
  Globe,
  Heart,
  Gift,
  Headphones,
  CheckCircle,
} from "lucide-react";
import LogoutButton from "../LogoutButton";

export default function CustomerSupportDashboard() {
  const features = [
    {
      title: "Support Requests",
      description: "View and manage support tickets and inquiries.",
      route: "/admin/support-requests",
      icon: MessageSquare,
      color: "from-red-500 to-red-600",
      bgColor: "bg-red-50",
    },
    {
      title: "Applicants List",
      description: "Review and manage job applicants.",
      route: "/admin/applicant-list",
      icon: Users,
      color: "from-blue-500 to-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "Gift List & Confirm",
      description: "Review and confirm gift purchases.",
      route: "/admin/gift-list-confirm",
      icon: Gift,
      color: "from-yellow-500 to-amber-600",
      bgColor: "bg-yellow-50",
    },
    {
      title: "User Management",
      description: "View and manage registered users.",
      route: "/admin/user-lists",
      icon: Users,
      color: "from-gray-500 to-gray-600",
      bgColor: "bg-gray-50",
    },
    {
      title: "Community Members",
      description: "View and manage community memberships.",
      route: "/admin/community-list",
      icon: Building2,
      color: "from-cyan-500 to-cyan-600",
      bgColor: "bg-cyan-50",
    },
    {
      title: "Diaspora List",
      description: "Review diaspora member registrations.",
      route: "/admin/diaspora-list",
      icon: Globe,
      color: "from-rose-500 to-rose-600",
      bgColor: "bg-rose-50",
    },
    {
      title: "Kidney Patient List",
      description: "Review kidney patient registrations.",
      route: "/admin/patient-list",
      icon: Heart,
      color: "from-emerald-500 to-emerald-600",
      bgColor: "bg-emerald-50",
    },
    {
      title: "Purchase List",
      description: "View and manage all service purchases.",
      route: "/admin/purchase-list",
      icon: ShoppingCart,
      color: "from-blue-500 to-blue-600",
      bgColor: "bg-blue-50",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-[#fff9eb]">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#1c2b21] to-[#2d3f32] text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-start justify-between gap-4 mb-2">
            <div className="flex items-center gap-4">
            <div className="bg-[#D4AF37] p-3 rounded-xl">
              <Headphones className="h-8 w-8 text-[#1c2b21]" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Customer Support Dashboard</h1>
              <p className="text-gray-300 mt-1">Support tickets, users, and community management</p>
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
          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-red-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Open Tickets</p>
                <p className="text-2xl font-bold text-[#1c2b21] mt-1">—</p>
              </div>
              <MessageSquare className="h-10 w-10 text-red-500" />
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-[#D4AF37]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Resolved Today</p>
                <p className="text-2xl font-bold text-[#1c2b21] mt-1">—</p>
              </div>
              <CheckCircle className="h-10 w-10 text-[#D4AF37]" />
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Active Users</p>
                <p className="text-2xl font-bold text-[#1c2b21] mt-1">—</p>
              </div>
              <Users className="h-10 w-10 text-blue-500" />
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Satisfaction</p>
                <p className="text-2xl font-bold text-[#1c2b21] mt-1">—</p>
              </div>
              <CheckCircle className="h-10 w-10 text-green-500" />
            </div>
          </div>
        </div>

        {/* Features Grid */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-[#1c2b21] mb-4">Support Tools</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((item, index) => {
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
        </div>
      </div>
    </div>
  );
}
