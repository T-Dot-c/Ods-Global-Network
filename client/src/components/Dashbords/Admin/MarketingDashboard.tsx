import { Link } from "react-router-dom";
import {
  Gift,
  FileText,
  Briefcase,
  Users,
  Mail,
  TrendingUp,
  Megaphone,
} from "lucide-react";
import LogoutButton from "../LogoutButton";

export default function MarketingDashboard() {
  const features = [
    {
      title: "Add Gift",
      description: "Add and manage gift options for promotions.",
      route: "/admin/add-gift",
      icon: Gift,
      color: "from-yellow-500 to-amber-600",
      bgColor: "bg-yellow-50",
    },
    {
      title: "Create Blog Post",
      description: "Write and publish engaging blog articles.",
      route: "/admin/blog-create",
      icon: FileText,
      color: "from-indigo-500 to-indigo-600",
      bgColor: "bg-indigo-50",
    },
    {
      title: "View Blog Posts",
      description: "Manage published blog content and analytics.",
      route: "/admin/blog-list",
      icon: FileText,
      color: "from-purple-500 to-purple-600",
      bgColor: "bg-purple-50",
    },
    {
      title: "Job Posting",
      description: "Post job opportunities and manage listings.",
      route: "/admin/job-posting",
      icon: Briefcase,
      color: "from-blue-500 to-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "Applicant List",
      description: "Review and manage job applicants.",
      route: "/admin/applicant-list",
      icon: Users,
      color: "from-green-500 to-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: "Subscribers List",
      description: "View newsletter subscribers and engagement.",
      route: "/admin/subscrpition-list",
      icon: Mail,
      color: "from-pink-500 to-pink-600",
      bgColor: "bg-pink-50",
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
              <Megaphone className="h-8 w-8 text-[#1c2b21]" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Marketing Dashboard</h1>
              <p className="text-gray-300 mt-1">Content, campaigns, and audience engagement</p>
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
                <p className="text-sm text-gray-600 font-medium">Blog Posts</p>
                <p className="text-2xl font-bold text-[#1c2b21] mt-1">—</p>
              </div>
              <FileText className="h-10 w-10 text-[#D4AF37]" />
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Subscribers</p>
                <p className="text-2xl font-bold text-[#1c2b21] mt-1">—</p>
              </div>
              <Mail className="h-10 w-10 text-blue-500" />
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Active Jobs</p>
                <p className="text-2xl font-bold text-[#1c2b21] mt-1">—</p>
              </div>
              <Briefcase className="h-10 w-10 text-green-500" />
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-purple-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Engagement</p>
                <p className="text-2xl font-bold text-[#1c2b21] mt-1">—</p>
              </div>
              <TrendingUp className="h-10 w-10 text-purple-500" />
            </div>
          </div>
        </div>

        {/* Features Grid */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-[#1c2b21] mb-4">Marketing Tools</h2>
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
