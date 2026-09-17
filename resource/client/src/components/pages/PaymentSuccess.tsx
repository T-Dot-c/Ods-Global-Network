import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { CheckCircle } from "lucide-react";
import BASE_URL from "../../api/api";

const PaymentSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const plan = searchParams.get("plan");

  useEffect(() => {
    const token = localStorage.getItem("token") || undefined;

    const giftData = JSON.parse(localStorage.getItem("pendingGift") || "null");

    if (giftData) {
      fetch(`${BASE_URL}/gifts/send-email`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(giftData),
      })
        .then((res) => res.json())
        .then((data) => {
          console.log("Gift sent:", data);
        })
        .catch((err) => {
          console.error("Gift send failed:", err);
        });

      localStorage.removeItem("pendingGift");
    }

    if (plan && token) {
      fetch(`${BASE_URL}/membership/update`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ membership: plan }),
      })
        .then((res) => res.json())
        .then((data) => {
          localStorage.setItem("user", JSON.stringify(data.user));
          console.log("Membership updated:", data.user.membership);
        })
        .catch((err) => {
          console.error("Membership update failed:", err);
        });
    }

    localStorage.removeItem("cart");

    const timer = setTimeout(() => {
      if (plan) {
        navigate("/provider/add-service");
      } else {
        navigate("/services");
      }
    }, 6000);

    return () => clearTimeout(timer);
  }, [navigate, searchParams]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center p-4">
      <CheckCircle size={64} className="text-green-500 mb-4" />
      <h1 className="text-3xl font-bold text-[#1c2b21]">Payment Successful!</h1>
      <p className="mt-2 text-gray-600">Thank you for your payment 🎉</p>
      <p className="text-sm text-gray-500 mt-1">
        Redirecting you shortly...
      </p>
    </div>
  );
};

export default PaymentSuccess;

