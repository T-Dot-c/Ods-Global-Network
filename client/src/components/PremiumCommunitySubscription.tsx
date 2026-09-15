import { useMemo, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import BASE_URL from "../api/api";

type SubscriptionPlan =
  | "individual-monthly"
  | "individual-yearly"
  | "corporate-monthly"
  | "corporate-yearly";

interface FormState {
  fullName: string;
  email: string;
  phone: string;
  organization: string;
  role: string;
  notes: string;
  isRenewal: "yes" | "no";
  currentCertificate?: string;
}

const SUBSCRIPTION_PLANS: Record<
  SubscriptionPlan,
  { title: string; price: number; cadence: "month" | "year"; description: string }
> = {
  "individual-monthly": {
    title: "Individual Monthly",
    price: 100,
    cadence: "month",
    description: "Holistic wellness playbook, accountability circles & partner perks.",
  },
  "individual-yearly": {
    title: "Individual Yearly",
    price: 1000,
    cadence: "year",
    description: "All monthly benefits plus 2 complimentary wellness retreat passes.",
  },
  "corporate-monthly": {
    title: "Corporate Monthly",
    price: 300,
    cadence: "month",
    description: "Employee wellness activation, HR wellness toolkits & analytics.",
  },
  "corporate-yearly": {
    title: "Corporate Yearly",
    price: 2500,
    cadence: "year",
    description: "All monthly benefits plus bespoke wellness strategy co-design.",
  },
};

export default function PremiumCommunitySubscription() {
  const navigate = useNavigate();
  const [subscriptionPlan, setSubscriptionPlan] =
    useState<SubscriptionPlan>("individual-monthly");
  const [formState, setFormState] = useState<FormState>({
    fullName: "",
    email: "",
    phone: "",
    organization: "",
    role: "",
    notes: "",
    isRenewal: "no",
    currentCertificate: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedPlan = useMemo(
    () => SUBSCRIPTION_PLANS[subscriptionPlan],
    [subscriptionPlan]
  );

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormState((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload = {
        fullName: formState.fullName.trim(),
        email: formState.email.trim(),
        phone: formState.phone.trim(),
        organization: formState.organization || undefined,
        role: formState.role || undefined,
        notes: formState.notes || undefined,
        isRenewal: formState.isRenewal,
        currentCertificate:
          formState.isRenewal === "yes" && formState.currentCertificate
            ? formState.currentCertificate.trim()
            : undefined,
        subscriptionPlan,
        subscriptionPrice: String(selectedPlan.price),
        subscriptionCadence: selectedPlan.cadence,
      };

      const res = await fetch(`${BASE_URL}/premium-community`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const responseText = await res.text();
      let result: Record<string, unknown> | null = null;
      if (responseText) {
        try {
          result = JSON.parse(responseText);
        } catch (parseError) {
          console.warn("⚠️ Failed to parse premium response as JSON:", parseError, responseText);
        }
      }

      if (res.ok) {
        const certificateNumber =
          typeof result?.certificateNumber === "string"
            ? result.certificateNumber
            : undefined;
        const membershipId = typeof result?.membershipId === "number" ? result.membershipId : null;

        // Create a cart item for the subscription
        const subscriptionCartItem = {
          id: membershipId || `premium-${subscriptionPlan}`,
          title: `${selectedPlan.title} - Premium Community Subscription`,
          category: "Premium Membership",
          price: selectedPlan.price,
          description: selectedPlan.description,
        };

        // Navigate to payment options with subscription data
        navigate("/payment-options", {
          state: {
            cart: [subscriptionCartItem],
            total: selectedPlan.price,
            fullName: formState.fullName.trim(),
            email: formState.email.trim(),
            phone: formState.phone.trim(),
            // Include subscription metadata for reference
            membershipId,
            subscriptionPlan,
            subscriptionPrice: String(selectedPlan.price),
            subscriptionCadence: selectedPlan.cadence,
            certificateNumber,
            invoiceType: "premium_subscription",
          },
        });
      } else {
        const serverMessage =
          (result && typeof result.message === "string" && result.message) ||
          (result && typeof result.error === "string" && result.error) ||
          responseText ||
          res.statusText ||
          "Please try again.";
        alert(`❌ Submission failed: ${serverMessage}`);
        console.error(
          "❌ Premium subscription error:",
          { status: res.status, statusText: res.statusText, body: responseText, parsed: result }
        );
      }
    } catch (err) {
      console.error("❌ Submission error:", err);
      const message =
        err instanceof Error
          ? err.message
          : typeof err === "string"
            ? err
            : "Unexpected error occurred.";
      alert(`❌ Something went wrong while submitting: ${message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-gray-50 to-[#fff9eb] px-4 py-12">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 lg:flex-row">
        <div className="rounded-3xl border border-[#0f285b]/10 bg-white/80 p-8 shadow-xl backdrop-blur-sm lg:w-7/12">
          <div className="flex items-center gap-4">
            <img
              src="/brand/ods-logo-mark-gold.png"
              alt="ODS Global Network Logo"
              className="h-16 w-16 rounded-full object-cover shadow-lg"
            />
            <div>
              <h1 className="text-3xl font-bold text-[#0f285b]">
                ODS Global Network Premium Community
              </h1>
              <p className="text-sm text-gray-600">
                Curated wellness circles, corporate innovation hubs, and exclusive access to
                the ODS Global Network concierge network.
              </p>
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-[#0f285b]/10 bg-white p-5 shadow-inner">
            <h2 className="text-lg font-semibold text-[#0f285b]">
              Choose Your Subscription
            </h2>
            <p className="mt-1 text-sm text-gray-600">
              Pick the plan that aligns with your goals. You can upgrade or adjust your
              membership anytime with our community concierge.
            </p>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              {Object.entries(SUBSCRIPTION_PLANS).map(([planKey, planDetails]) => {
                const plan = planKey as SubscriptionPlan;
                const isSelected = subscriptionPlan === plan;
                return (
                  <button
                    key={plan}
                    type="button"
                    onClick={() => setSubscriptionPlan(plan)}
                    className={`rounded-2xl border px-4 py-5 text-left transition-all ${
                      isSelected
                        ? "border-[#be9b49] bg-[#fff9eb] shadow-lg shadow-[#be9b49]/30"
                        : "border-[#0f285b]/10 bg-white hover:border-[#be9b49] hover:shadow"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-[#0f285b]">
                        {planDetails.title}
                      </span>
                      {isSelected && (
                        <span className="rounded-full bg-[#be9b49] px-3 py-1 text-xs font-bold text-[#0f285b]">
                          Selected
                        </span>
                      )}
                    </div>
                    <p className="mt-2 text-2xl font-bold text-[#be9b49]">
                      {planDetails.price}{" "}
                      <span className="text-xs font-medium text-gray-600">
                        ETB / {planDetails.cadence}
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
        </div>

        <div className="rounded-3xl border border-[#0f285b]/10 bg-[#0f285b] p-8 text-white shadow-xl lg:w-5/12">
          <h2 className="text-lg font-semibold uppercase tracking-wide text-[#be9b49]">
            Premium Concierge Intake
          </h2>
          <p className="mt-2 text-sm text-gray-200">
            Share a few details and our concierge will design your onboarding pathway,
            including curated programs, wellness data dashboards, and in-person experiences.
          </p>

          <div className="mt-6 rounded-2xl border border-[#be9b49]/40 bg-white/10 p-4">
            <h3 className="text-sm font-semibold text-[#be9b49] uppercase tracking-wide">
              Selected Plan Snapshot
            </h3>
            <p className="mt-3 text-2xl font-bold">
              {selectedPlan.price} ETB / {selectedPlan.cadence}
            </p>
            <p className="mt-1 text-xs text-gray-200">{selectedPlan.description}</p>
          </div>

          <form onSubmit={handleSubmit} className="mt-6 grid gap-4">
            <input
              name="fullName"
              placeholder="Full Name"
              value={formState.fullName}
              onChange={handleChange}
              required
              className="rounded-md border border-transparent bg-white/10 px-3 py-2 text-sm text-white placeholder:text-gray-300 focus:border-[#be9b49] focus:outline-none focus:ring-2 focus:ring-[#be9b49]"
            />
            <input
              name="email"
              type="email"
              placeholder="Email"
              value={formState.email}
              onChange={handleChange}
              required
              className="rounded-md border border-transparent bg-white/10 px-3 py-2 text-sm text-white placeholder:text-gray-300 focus:border-[#be9b49] focus:outline-none focus:ring-2 focus:ring-[#be9b49]"
            />
            <input
              name="phone"
              placeholder="Phone"
              value={formState.phone}
              onChange={handleChange}
              required
              className="rounded-md border border-transparent bg-white/10 px-3 py-2 text-sm text-white placeholder:text-gray-300 focus:border-[#be9b49] focus:outline-none focus:ring-2 focus:ring-[#be9b49]"
            />
            <input
              name="organization"
              placeholder="Organization / Company (Optional)"
              value={formState.organization}
              onChange={handleChange}
              className="rounded-md border border-transparent bg-white/10 px-3 py-2 text-sm text-white placeholder:text-gray-300 focus:border-[#be9b49] focus:outline-none focus:ring-2 focus:ring-[#be9b49]"
            />
            <input
              name="role"
              placeholder="Role / Title (Optional)"
              value={formState.role}
              onChange={handleChange}
              className="rounded-md border border-transparent bg-white/10 px-3 py-2 text-sm text-white placeholder:text-gray-300 focus:border-[#be9b49] focus:outline-none focus:ring-2 focus:ring-[#be9b49]"
            />
            <div className="grid gap-3 rounded-xl border border-white/20 bg-white/5 p-3 text-sm">
              <label className="font-semibold text-[#be9b49] uppercase tracking-wide">
                Renewal Status
              </label>
              <select
                name="isRenewal"
                value={formState.isRenewal}
                onChange={handleChange}
                className="rounded-md border border-transparent bg-white/10 px-3 py-2 text-sm text-white focus:border-[#be9b49] focus:outline-none focus:ring-2 focus:ring-[#be9b49]"
              >
                <option value="no">New Membership</option>
                <option value="yes">Renew Existing Membership</option>
              </select>
              {formState.isRenewal === "yes" && (
                <input
                  name="currentCertificate"
                  placeholder="Current Certificate Number (4 digits)"
                  value={formState.currentCertificate}
                  onChange={handleChange}
                  required
                  className="rounded-md border border-transparent bg-white/10 px-3 py-2 text-sm text-white placeholder:text-gray-300 focus:border-[#be9b49] focus:outline-none focus:ring-2 focus:ring-[#be9b49]"
                />
              )}
            </div>
            <textarea
              name="notes"
              placeholder="Share your wellness goals or concierge requests"
              value={formState.notes}
              onChange={handleChange}
              rows={4}
              className="rounded-md border border-transparent bg-white/10 px-3 py-2 text-sm text-white placeholder:text-gray-300 focus:border-[#be9b49] focus:outline-none focus:ring-2 focus:ring-[#be9b49]"
            />

            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-2 flex items-center justify-center rounded-full bg-[#be9b49] px-5 py-2 text-sm font-semibold text-[#0f285b] transition hover:bg-[#9e7c30] disabled:cursor-not-allowed disabled:opacity-75"
            >
              {isSubmitting ? "Submitting..." : "Submit Premium Request"}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-gray-300">
            Ⓒ All rights reserved by ODS Global Network
          </p>
        </div>
      </div>
    </div>
  );
}



