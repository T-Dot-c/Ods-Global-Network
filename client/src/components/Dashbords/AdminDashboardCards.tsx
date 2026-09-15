import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  Heart,
  Gift,
  Settings,
  Package,
  FileText,
  MessageSquare,
  Users,
  Briefcase,
} from "lucide-react";

export default function AdminDashboardCards() {
  const [userRole, setUserRole] = useState("");

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    setUserRole(user.role || "");
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
    <div>
      {visibleFeatures.length === 0 ? (
        <div className="bg-white rounded-xl shadow-md p-8 text-center">
          <p className="text-gray-600 text-lg">You don't have access to any admin tools.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
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
                    <Icon className={`h-6 w-6 text-[#0f285b]`} />
                  </div>
                  <h3 className="text-lg font-semibold text-[#0f285b] mb-2 group-hover:text-[#be9b49] transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-sm text-gray-600 leading-relaxed mb-4">{item.description}</p>
                  <div className="flex items-center text-[#be9b49] font-medium text-sm group-hover:translate-x-1 transition-transform">
                    Access <span className="ml-1">→</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
