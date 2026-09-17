import { useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";

const ProviderDashboard = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  useEffect(() => {
    if (!user || user.role !== "provider") {
      alert("Access denied. You must be a service provider.");
      navigate("/membership"); // redirect to upgrade
    }
  }, [user, navigate]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-[#e6f2ef] to-[#f5f5f5] px-4">
      <div className="bg-white w-full max-w-xl rounded-2xl shadow-lg p-8 text-center transform transition-transform duration-300 hover:scale-105">
        <h1 className="text-4xl md:text-5xl font-bold text-[#1c2b21] mb-4">
          Welcome, {user.fullName || "Provider"} 🎉
        </h1>
        <p className="text-md md:text-lg text-gray-600 mb-6">
          Membership Status:{" "}
          <span className="text-[#D4AF37] font-semibold">
            {user.membership?.toUpperCase() || "N/A"}
          </span>
        </p>

        <div className="flex flex-col md:flex-row justify-center gap-4">
          <Link
            to="/provider/add-service"
            className="bg-[#D4AF37] hover:bg-[#c49c30] transition-colors text-[#1c2b21] px-6 py-3 rounded-xl font-semibold shadow-md hover:shadow-lg"
          >
            ➕ Add New Service
          </Link>
          <Link
            to="/provider/services"
            className="bg-[#1c2b21] hover:bg-[#0f1a14] transition-colors text-[#D4AF37] px-6 py-3 rounded-xl font-semibold shadow-md hover:shadow-lg"
          >
            📋 View My Services
          </Link>
        </div>

        <div className="mt-8 text-gray-500 text-sm md:text-base">
          Manage your services, track purchases, and keep your profile updated.
        </div>
      </div>
    </div>
  );
};

export default ProviderDashboard;
