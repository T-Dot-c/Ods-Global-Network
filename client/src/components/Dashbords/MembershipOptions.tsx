import { useState } from "react";
import { useNavigate } from "react-router-dom";

interface MembershipOptionsProps {
  role: "user" | "provider";
}

const MembershipOptions = ({ role }: MembershipOptionsProps) => {
  const [selected, setSelected] = useState("");
  const navigate = useNavigate();

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
    <div className="bg-white rounded-xl shadow-md p-6">
      <h2 className="text-2xl font-bold text-[#1c2b21] mb-2">
        Membership Options
      </h2>
      <p className="text-gray-600 mb-6">
        {role === "user"
          ? "Upgrade your membership to unlock more features"
          : "Choose a membership plan for your service provider account"}
      </p>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Membership Plan
          </label>
          <select
            value={selected}
            onChange={(e) => setSelected(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:border-[#1c2b21] transition text-gray-700 font-medium"
          >
            <option value="">-- Choose Plan --</option>
            {membershipOptions[role].map((plan) => (
              <option
                key={plan.label}
                value={plan.label}
                disabled={!plan.active}
              >
                {plan.label} — {plan.price === 0 ? "Free" : `${plan.price} ETB`}
                {!plan.active && " (Coming Soon)"}
              </option>
            ))}
          </select>
        </div>

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

        <p className="text-center text-gray-400 text-sm">
          Your payment is secure and will be processed safely.
        </p>

        {/* Display current membership info */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-semibold text-gray-700 mb-2">Current Membership</h3>
          <p className="text-sm text-gray-600">
            {role === "user" ? "Standard Member" : "Basic Provider"} - Active
          </p>
        </div>
      </div>
    </div>
  );
};

export default MembershipOptions;

