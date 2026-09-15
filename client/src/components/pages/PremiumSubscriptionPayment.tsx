import { useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import BASE_URL from "../../api/api";

type SubscriptionPlan =
  | "individual-monthly"
  | "individual-yearly"
  | "corporate-monthly"
  | "corporate-yearly";

interface PaymentData {
  membershipId: number;
  fullName: string;
  email: string;
  phone: string;
  subscriptionPlan: SubscriptionPlan;
  subscriptionPrice: string;
  subscriptionCadence: "month" | "year";
  certificateNumber?: string;
}

const PLAN_TITLES: Record<SubscriptionPlan, string> = {
  "individual-monthly": "Individual Monthly",
  "individual-yearly": "Individual Yearly",
  "corporate-monthly": "Corporate Monthly",
  "corporate-yearly": "Corporate Yearly",
};

export default function PremiumSubscriptionPayment() {
  const location = useLocation();
  const navigate = useNavigate();
  const [paymentData, setPaymentData] = useState<PaymentData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const state = location.state as PaymentData;
    if (!state || !state.membershipId) {
      setError("Invalid payment data. Please submit your subscription form again.");
      return;
    }
    setPaymentData(state);
  }, [location.state]);

  const handlePayment = async () => {
    if (!paymentData) return;

    setLoading(true);
    setError(null);

    try {
      const nameParts = paymentData.fullName.trim().split(" ");
      const first_name = nameParts[0] || "Premium";
      const last_name = nameParts.slice(1).join(" ") || "Member";

      const response = await fetch(`${BASE_URL}/payment/premium-subscription`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: paymentData.subscriptionPrice,
          email: paymentData.email,
          phone_number: paymentData.phone,
          first_name,
          last_name,
          premiumMembershipId: paymentData.membershipId,
          subscriptionPlan: paymentData.subscriptionPlan,
          subscriptionPrice: paymentData.subscriptionPrice,
          subscriptionCadence: paymentData.subscriptionCadence,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to initialize payment");
      }

      if (result.checkout_url) {
        window.location.href = result.checkout_url;
      } else {
        throw new Error("No checkout URL received");
      }
    } catch (err) {
      console.error("Payment initialization error:", err);
      setError(
        err instanceof Error ? err.message : "Failed to initialize payment. Please try again."
      );
      setLoading(false);
    }
  };

  if (error && !paymentData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white via-gray-50 to-[#fff9eb] flex items-center justify-center px-4">
        <div className="bg-white rounded-3xl border border-[#1c2b21]/10 p-8 shadow-xl max-w-md w-full text-center">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-[#1c2b21] mb-4">Payment Error</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => navigate("/premium-community")}
            className="bg-[#D4AF37] text-[#1c2b21] font-semibold px-6 py-3 rounded-full hover:bg-[#c79c2d] transition"
          >
            Return to Subscription Form
          </button>
        </div>
      </div>
    );
  }

  if (!paymentData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white via-gray-50 to-[#fff9eb] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#D4AF37] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading payment details...</p>
        </div>
      </div>
    );
  }

  const planTitle = PLAN_TITLES[paymentData.subscriptionPlan];
  const price = parseFloat(paymentData.subscriptionPrice);
  const invoiceNumber = `INV-${paymentData.membershipId}-${Date.now()}`;
  const invoiceDate = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-gray-50 to-[#fff9eb] px-4 py-12">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <img
            src="/wanaw gifting logo.jpeg"
            alt="ODS Global Network Logo"
            className="h-20 w-20 rounded-full object-cover shadow-lg mx-auto mb-4"
          />
          <h1 className="text-3xl font-bold text-[#1c2b21]">ODS Global Network Premium Subscription</h1>
          <p className="text-gray-600 mt-2">Complete your payment to activate your membership</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Invoice Section */}
          <div className="bg-white rounded-3xl border border-[#1c2b21]/10 p-8 shadow-xl">
            <h2 className="text-2xl font-bold text-[#1c2b21] mb-6">Invoice</h2>

            <div className="space-y-4 mb-6">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Invoice Number:</span>
                <span className="font-semibold text-[#1c2b21]">{invoiceNumber}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Date:</span>
                <span className="font-semibold text-[#1c2b21]">{invoiceDate}</span>
              </div>
              {paymentData.certificateNumber && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Certificate #:</span>
                  <span className="font-semibold text-[#D4AF37]">
                    {paymentData.certificateNumber}
                  </span>
                </div>
              )}
            </div>

            <div className="border-t border-gray-200 pt-4 mb-6">
              <h3 className="font-semibold text-[#1c2b21] mb-3">Bill To:</h3>
              <p className="text-sm text-gray-700">{paymentData.fullName}</p>
              <p className="text-sm text-gray-700">{paymentData.email}</p>
              {paymentData.phone && (
                <p className="text-sm text-gray-700">{paymentData.phone}</p>
              )}
            </div>

            <div className="border-t border-gray-200 pt-4">
              <h3 className="font-semibold text-[#1c2b21] mb-3">Subscription Details:</h3>
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Plan:</span>
                  <span className="font-semibold text-[#1c2b21]">{planTitle}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Billing Cycle:</span>
                  <span className="font-semibold text-[#1c2b21]">
                    {paymentData.subscriptionCadence === "month" ? "Monthly" : "Yearly"}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Amount:</span>
                  <span className="font-semibold text-[#D4AF37] text-lg">
                    {price.toLocaleString()} ETB
                  </span>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-4 mt-6">
              <div className="flex justify-between items-center">
                <span className="text-xl font-bold text-[#1c2b21]">Total:</span>
                <span className="text-2xl font-bold text-[#D4AF37]">
                  {price.toLocaleString()} ETB
                </span>
              </div>
            </div>
          </div>

          {/* Payment Section */}
          <div className="bg-[#1c2b21] rounded-3xl border border-[#1c2b21]/10 p-8 shadow-xl text-white">
            <h2 className="text-2xl font-bold text-[#D4AF37] mb-6">Payment Summary</h2>

            <div className="space-y-4 mb-6">
              <div className="bg-white/10 rounded-lg p-4">
                <p className="text-sm text-gray-300 mb-2">Subscription Plan</p>
                <p className="text-lg font-semibold">{planTitle}</p>
              </div>
              <div className="bg-white/10 rounded-lg p-4">
                <p className="text-sm text-gray-300 mb-2">Billing Period</p>
                <p className="text-lg font-semibold">
                  {paymentData.subscriptionCadence === "month" ? "Monthly" : "Yearly"}
                </p>
              </div>
              <div className="bg-white/10 rounded-lg p-4">
                <p className="text-sm text-gray-300 mb-2">Total Amount</p>
                <p className="text-3xl font-bold text-[#D4AF37]">
                  {price.toLocaleString()} ETB
                </p>
              </div>
            </div>

            {error && (
              <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 mb-6">
                <p className="text-red-200 text-sm">{error}</p>
              </div>
            )}

            <button
              onClick={handlePayment}
              disabled={loading}
              className="w-full bg-[#D4AF37] text-[#1c2b21] font-semibold py-4 rounded-full hover:bg-[#c79c2d] transition disabled:cursor-not-allowed disabled:opacity-75 text-lg"
            >
              {loading ? "Processing..." : "Proceed to Payment"}
            </button>

            <p className="text-xs text-gray-400 text-center mt-4">
              You will be redirected to our secure payment gateway
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-gray-600">
          <p>© {new Date().getFullYear()} ODS Global Network Health and Wellness. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}


