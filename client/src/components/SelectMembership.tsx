import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

const SelectMembership = () => {
  const [selected, setSelected] = useState("");
  const navigate = useNavigate();
  const location = useLocation();

  // Get role from URL query parameter
  const params = new URLSearchParams(location.search);
  const roleParam = params.get("role");
  const role: "user" | "provider" = roleParam === "provider" ? "provider" : "user";

  const token = localStorage.getItem("token");

  useEffect(() => {
    if (!token) {
      alert("You must be logged in to access this page.");
      navigate("/login");
    }
  }, [token, navigate]);

  // Membership options (set free for active ones, disable others)
  const membershipOptions: Record<string, { label: string; price: number; active: boolean }[]> = {
    user: [
      { label: "Standard", price: 0, active: true },
      { label: "Gold", price: 500, active: false },
      { label: "Premium", price: 1000, active: false },
    ],
    provider: [
      { label: "Basic", price: 0, active: true },
      { label: "Premium", price: 800, active: false },
    ],
  };

  const handleProceed = () => {
    if (!selected) {
      alert("Please select a membership plan.");
      return;
    }

    const chosenPlan = membershipOptions[role].find((p) => p.label === selected);
    if (!chosenPlan) return;

    navigate(`/payment-options`, {
      state: { selectedPlan: selected, role, price: chosenPlan.price },
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8 relative overflow-hidden">
        {/* Brand Accent */}
        <div className="absolute -top-16 -left-16 w-40 h-40 bg-gradient-to-br from-[#D4AF37] to-[#1c2b21] rounded-full opacity-20 animate-spin-slow"></div>
        <div className="absolute -bottom-16 -right-16 w-60 h-60 bg-gradient-to-tr from-[#D4AF37] to-[#1c2b21] rounded-full opacity-20 animate-pulse"></div>

        <h2 className="text-2xl font-bold text-[#1c2b21] mb-6 text-center">
          Select Membership Plan
        </h2>
        <p className="text-center text-gray-600 mb-6">
          {role === "user"
            ? "User Membership Options"
            : "Service Provider Membership Options"}
        </p>

        <select
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:border-[#1c2b21] transition mb-6 text-gray-700 font-medium"
        >
          <option value="">-- Choose Plan --</option>
          {membershipOptions[role].map((plan) => (
            <option
              key={plan.label}
              value={plan.label}
              disabled={!plan.active}
            >
              {plan.label} — {plan.price === 0 ? "Free" : `${plan.price} ETB`}
            </option>
          ))}
        </select>

        <button
          onClick={handleProceed}
          disabled={!selected}
          className={`w-full font-semibold py-3 rounded-xl shadow-lg transform transition-all
            ${selected
              ? "bg-gradient-to-r from-[#1c2b21] to-[#3c4f3b] text-[#D4AF37] hover:shadow-2xl hover:scale-105"
              : "bg-gray-300 text-gray-500 cursor-not-allowed"}
          `}
        >
          Proceed to Payment
        </button>

        <p className="text-center text-gray-400 mt-4 text-sm">
          Your payment is secure and will be processed safely.
        </p>
      </div>
    </div>
  );
};

export default SelectMembership;


