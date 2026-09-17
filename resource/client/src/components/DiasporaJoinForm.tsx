import { useMemo, useState, type ChangeEvent, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import BASE_URL from "../api/api";

type DiasporaPlanKey = "monthly" | "yearly";

const DIASPORA_PLANS: Record<
  DiasporaPlanKey,
  { title: string; price: number; cadence: "month" | "year"; description: string }
> = {
  monthly: {
    title: "Monthly",
    price: 10,
    cadence: "month",
    description: "Stay connected with Ethiopia with a flexible monthly membership.",
  },
  yearly: {
    title: "Annual",
    price: 100,
    cadence: "year",
    description: "Best value for dedicated members who want year-round engagement.",
  },
};

const DiasporaJoinForm: React.FC = () => {
  const navigate = useNavigate();

  const [selectedPlanKey, setSelectedPlanKey] = useState<DiasporaPlanKey>("monthly");

  const selectedPlan = useMemo(
    () => DIASPORA_PLANS[selectedPlanKey],
    [selectedPlanKey]
  );

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    whatsapp: "",
    telegram: "",
    country: "",
    profession: "",
    message: "",
  });

  // Optional: file upload is UI-only for now; not yet sent to backend
  const [, setPassportFile] = useState<File | null>(null);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      // Include selected plan metadata for backend if needed
      const payload = {
        ...formData,
        plan: selectedPlanKey,
        price: selectedPlan.price,
        cadence: selectedPlan.cadence,
      };

      const res = await fetch(`${BASE_URL}/diaspora-members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const dataText = await res.text();
      let data: any = null;
      if (dataText) {
        try {
          data = JSON.parse(dataText);
        } catch {
          data = null;
        }
      }

      if (!res.ok) {
        const message =
          (data && (data.error || data.message)) || dataText || "Submission failed";
        throw new Error(message);
      }

      setSuccess("Thanks for joining the Diaspora Premium Community!");

      // Build a cart item for the diaspora premium subscription
      const cartItem = {
        id: data?.id || `diaspora-premium-${selectedPlanKey}`,
        title: `Diaspora Premium Community - ${selectedPlan.title} Subscription`,
        category: "Diaspora Premium Community",
        price: selectedPlan.price,
        description: selectedPlan.description,
      };

      // Navigate to payment options with invoice-style summary
      navigate("/payment-options", {
        state: {
          cart: [cartItem],
          total: selectedPlan.price,
          fullName: formData.name.trim(),
          email: formData.email.trim(),
          currency: "USD",
          invoiceType: "diaspora_premium_subscription",
          subscriptionPlan: selectedPlanKey,
          subscriptionPrice: selectedPlan.price,
          subscriptionCadence: selectedPlan.cadence,
        },
      });
    } catch (err: any) {
      console.error(err);
      setError(
        err instanceof Error ? err.message : "Submission failed. Please try again."
      );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-gray-50 to-[#fff9eb] px-4 py-12">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 lg:flex-row">
        {/* Left: Subscription choices */}
        <div className="relative rounded-3xl border border-[#1c2b21]/10 bg-white/80 p-8 shadow-xl backdrop-blur-sm lg:w-7/12">
          <div className="absolute -top-5 left-5 bg-[#D4AF37] text-white text-xs px-3 py-1 rounded-full shadow-md">
            Diaspora Premium Community
          </div>

          <div className="flex items-center gap-4 mb-4 mt-2">
            <img
              src="/wanaw gifting logo.jpeg"
              alt="Wanaw Logo"
              className="h-14 w-14 rounded-full object-cover shadow-lg"
            />
            <div>
              <h1 className="text-2xl font-bold text-[#1c2b21]">
                Diaspora Premium Community
              </h1>
              
            </div>
          </div>

          <div className="mt-4 rounded-2xl border border-[#1c2b21]/10 bg-white p-5 shadow-inner">
            <h2 className="text-lg font-semibold text-[#1c2b21]">
              Choose Your Subscription
            </h2>
            <p className="mt-1 text-sm text-gray-600">
              Select Monthly or Annual membership. You’ll be taken to a payment summary
              with an invoice-style receipt.
            </p>

            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              {(
                Object.entries(DIASPORA_PLANS) as [DiasporaPlanKey, (typeof DIASPORA_PLANS)[DiasporaPlanKey]][]
              ).map(([planKey, planDetails]) => {
                const isSelected = selectedPlanKey === planKey;
                return (
                  <button
                    key={planKey}
                    type="button"
                    onClick={() => setSelectedPlanKey(planKey)}
                    className={`rounded-2xl border px-4 py-5 text-left transition-all ${
                      isSelected
                        ? "border-[#D4AF37] bg-[#fff9eb] shadow-lg shadow-[#D4AF37]/30"
                        : "border-[#1c2b21]/10 bg-white hover:border-[#D4AF37] hover:shadow"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-[#1c2b21]">
                        {planDetails.title}
                      </span>
                      {isSelected && (
                        <span className="rounded-full bg-[#D4AF37] px-3 py-1 text-xs font-bold text-[#1c2b21]">
                          Selected
                        </span>
                      )}
                    </div>
                    <p className="mt-2 text-2xl font-bold text-[#D4AF37]">
                      {planDetails.price}{" "}
                      <span className="text-xs font-medium text-gray-600">
                        USD / {planDetails.cadence}
                      </span>
                    </p>
                    <p className="mt-3 text-xs text-gray-600 leading-relaxed">
                      {planDetails.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-4 text-xs text-gray-500">
            After submitting your details, you’ll be redirected to the payment options
            page to complete your subscription.
          </div>
        </div>

        {/* Right: Intake form */}
        <div className="rounded-3xl border border-[#1c2b21]/10 bg-white p-8 shadow-xl lg:w-5/12">
          <h2 className="text-lg font-semibold text-[#1c2b21] mb-1">
            Member Details
          </h2>
          <p className="text-xs text-gray-600 mb-4">
            Tell us a bit about yourself so we can personalize your diaspora experience.
          </p>

          {error && <p className="text-red-600 mb-3 text-xs text-center">{error}</p>}
          {success && <p className="text-green-600 mb-3 text-xs text-center">{success}</p>}

          <div className="mb-4 rounded-xl border border-[#D4AF37]/30 bg-[#fff9eb] p-3 text-xs">
            <p className="font-semibold text-[#1c2b21]">Selected Plan</p>
            <p className="mt-1 text-[#1c2b21]">
              {selectedPlan.title} — {selectedPlan.price} USD / {selectedPlan.cadence}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="grid gap-3 text-sm">
            <input
              name="name"
              placeholder="Full Name"
              onChange={handleChange}
              value={formData.name}
              required
              className="p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-400"
            />
            <input
              name="email"
              type="email"
              placeholder="Email"
              onChange={handleChange}
              value={formData.email}
              required
              className="p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-400"
            />
            <input
              name="phone"
              placeholder="Phone (optional)"
              onChange={handleChange}
              value={formData.phone}
              className="p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-400"
            />
            <input
              name="whatsapp"
              placeholder="WhatsApp (optional)"
              onChange={handleChange}
              value={formData.whatsapp}
              className="p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-400"
            />
            <input
              name="telegram"
              placeholder="Telegram (optional)"
              onChange={handleChange}
              value={formData.telegram}
              className="p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-400"
            />
            <input
              name="country"
              placeholder="Country of Residence"
              onChange={handleChange}
              value={formData.country}
              required
              className="p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-400"
            />
            <input
              name="profession"
              placeholder="Profession / Expertise (optional)"
              onChange={handleChange}
              value={formData.profession}
              className="p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-400"
            />
            <textarea
              name="message"
              placeholder="Why do you want to join? (optional)"
              onChange={handleChange}
              value={formData.message}
              className="p-2 border border-gray-300 rounded-md resize-none h-20 focus:ring-2 focus:ring-green-400"
            />

            <div className="border border-dashed border-gray-300 rounded-md p-3 text-xs">
              <label className="block mb-1 font-medium text-[#1c2b21]">
                Attach Passport / Yellow Card{" "}
                <span className="text-gray-500 text-[10px]">(optional)</span>
              </label>
              <input
                type="file"
                accept="image/*,.pdf"
                onChange={(e) => {
                  const file = e.target.files?.[0] || null;
                  setPassportFile(file);
                }}
                className="block w-full text-xs text-gray-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-[#D4AF37]/90 file:text-[#1c2b21] hover:file:bg-[#c79c2d]"
              />
              <p className="mt-1 text-[10px] text-gray-500">
                You can upload a passport or yellow card now or share it later during
                onboarding.
              </p>
            </div>

            <button
              type="submit"
              className="mt-1 bg-[#1c2b21] text-white font-semibold py-2 rounded-full hover:bg-[#151e18] transition"
            >
              Continue to Payment
            </button>
          </form>

          <p className="text-center text-[10px] text-gray-400 mt-4">
            Ⓒ All rights reserved by ODS Global Network
          </p>
        </div>
      </div>
    </div>
  );
};

export default DiasporaJoinForm;
