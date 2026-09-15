import { type FormEvent, useState } from "react";
import { createServiceRequest } from "../../api/serviceRequests";

type GiftRecipient = {
  name: string;
  email: string;
  phone: string;
  whatsapp: string;
  location: string;
};

const RequestServiceForm = () => {
  const localUser = (() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "{}");
    } catch {
      return {};
    }
  })();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    occasion: "",
    location: "",
    budget: "",
    preferred_date: "",
    requester_name: localUser?.fullName || "",
    requester_email: localUser?.email || "",
    requester_whatsapp: "",
    requester_phone: "",
    request_type: "service" as "service" | "gift",
    service_type: "",
  });
  const [giftRecipients, setGiftRecipients] = useState<GiftRecipient[]>([
    { name: "", email: "", phone: "", whatsapp: "", location: "" },
  ]);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage("");
    setError("");

    try {
      if (formData.request_type === "gift" && !giftRecipients.some((r) => r.name.trim())) {
        setError("Add at least one gift recipient with name.");
        setSubmitting(false);
        return;
      }

      await createServiceRequest({
        title: formData.title,
        description: formData.description,
        occasion: formData.occasion || undefined,
        location: formData.location,
        budget: formData.budget ? Number(formData.budget) : null,
        preferred_date: formData.preferred_date || undefined,
        requester_name: formData.requester_name,
        requester_email: formData.requester_email,
        requester_whatsapp: formData.requester_whatsapp || undefined,
        requester_phone: formData.requester_phone || undefined,
        request_type: formData.request_type,
        service_type: formData.service_type || undefined,
        gift_recipients:
          formData.request_type === "gift"
            ? giftRecipients
                .filter((r) => r.name.trim())
                .map((r) => ({
                  name: r.name.trim(),
                  email: r.email.trim() || undefined,
                  phone: r.phone.trim() || undefined,
                  whatsapp: r.whatsapp.trim() || undefined,
                  location: r.location.trim() || undefined,
                }))
            : undefined,
      });

      setMessage(
        "Request submitted successfully. Providers can now see it on their dashboard and accept it."
      );
      setFormData({
        title: "",
        description: "",
        occasion: "",
        location: "",
        budget: "",
        preferred_date: "",
        requester_name: localUser?.fullName || "",
        requester_email: localUser?.email || "",
        requester_whatsapp: "",
        requester_phone: "",
        request_type: "service",
        service_type: "",
      });
      setGiftRecipients([{ name: "", email: "", phone: "", whatsapp: "", location: "" }]);
    } catch (err: any) {
      setError(err?.response?.data?.msg || "Failed to submit request.");
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass =
    "w-full mt-1 p-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400";
  const labelClass = "block text-sm font-medium text-gray-700";

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4 py-12 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-40 h-40 bg-[#1c2b21] rounded-full opacity-40 animate-pulse z-0"></div>
      <div className="absolute bottom-0 right-0 w-60 h-60 bg-[#1c2b21] rounded-full opacity-30 animate-spin-slow z-0"></div>
      <div className="absolute -top-10 right-10 w-32 h-32 bg-[#D4AF37] rotate-45 rounded-lg opacity-50 z-0"></div>

      <section className="bg-white shadow-2xl rounded-xl p-6 sm:p-8 w-full max-w-3xl relative z-10">
        <div className="absolute -top-5 left-5 bg-[#D4AF37] text-white text-xs px-3 py-1 rounded-full shadow-md">
          Request a Service
        </div>

        <div className="flex justify-center mb-6">
          <img src="/wanaw gifting logo.jpeg" alt="ODS Global Network Logo" className="h-16 w-16 rounded-full object-cover" />
        </div>

        <div className="mb-6 text-center">
          <h1 className="text-3xl font-bold mb-4 text-center text-[#1c2b21]">Request a Service</h1>
          <p className="text-center text-gray-600 text-sm">
            Didn&apos;t find what you need? Send a custom request and providers can propose offers.
          </p>
        </div>

        <form onSubmit={onSubmit} className="space-y-6">
          <fieldset>
            <legend className="mb-3 text-lg font-semibold text-[#1c2b21]">Your contact details</legend>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className={labelClass} htmlFor="requester-name">Your name</label>
                <input
                  id="requester-name"
                  className={inputClass}
                  placeholder="Enter your full name"
                  required
                  value={formData.requester_name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, requester_name: e.target.value }))}
                />
              </div>
              <div>
                <label className={labelClass} htmlFor="requester-email">Email address</label>
                <input
                  id="requester-email"
                  type="email"
                  className={inputClass}
                  placeholder="you@example.com"
                  required
                  value={formData.requester_email}
                  onChange={(e) => setFormData((prev) => ({ ...prev, requester_email: e.target.value }))}
                />
              </div>
              <div>
                <label className={labelClass} htmlFor="requester-whatsapp">WhatsApp <span className="font-normal text-gray-400">(optional)</span></label>
                <input
                  id="requester-whatsapp"
                  className={inputClass}
                  placeholder="WhatsApp number"
                  value={formData.requester_whatsapp}
                  onChange={(e) => setFormData((prev) => ({ ...prev, requester_whatsapp: e.target.value }))}
                />
              </div>
              <div>
                <label className={labelClass} htmlFor="requester-phone">Phone <span className="font-normal text-gray-400">(optional)</span></label>
                <input
                  id="requester-phone"
                  className={inputClass}
                  placeholder="Phone number"
                  value={formData.requester_phone}
                  onChange={(e) => setFormData((prev) => ({ ...prev, requester_phone: e.target.value }))}
                />
              </div>
            </div>
          </fieldset>

          <fieldset className="border-t border-gray-200 pt-6">
            <legend className="mb-3 text-lg font-semibold text-[#1c2b21]">Request details</legend>
            <div className="space-y-4">
              <div>
                <label className={labelClass} htmlFor="request-title">Request title</label>
                <input
                  id="request-title"
                  className={inputClass}
                  placeholder="What service do you need?"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                />
              </div>
              <div>
                <label className={labelClass} htmlFor="request-description">Description</label>
                <textarea
                  id="request-description"
                  className={`${inputClass} min-h-28 resize-y`}
                  placeholder="Describe exactly what you need"
                  required
                  value={formData.description}
                  onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                />
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className={labelClass} htmlFor="request-type">Request type</label>
                  <select
                    id="request-type"
                    className={inputClass}
                    value={formData.request_type}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, request_type: e.target.value as "service" | "gift" }))
                    }
                  >
                    <option value="service">Service Request</option>
                    <option value="gift">Gift Request</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass} htmlFor="service-type">Service or gift type</label>
                  <input
                    id="service-type"
                    className={inputClass}
                    placeholder="e.g. Catering"
                    value={formData.service_type}
                    onChange={(e) => setFormData((prev) => ({ ...prev, service_type: e.target.value }))}
                  />
                </div>
                <div>
                  <label className={labelClass} htmlFor="request-occasion">Occasion <span className="font-normal text-gray-400">(optional)</span></label>
                  <input
                    id="request-occasion"
                    className={inputClass}
                    placeholder="e.g. Birthday"
                    value={formData.occasion}
                    onChange={(e) => setFormData((prev) => ({ ...prev, occasion: e.target.value }))}
                  />
                </div>
                <div>
                  <label className={labelClass} htmlFor="request-location">Location</label>
                  <input
                    id="request-location"
                    className={inputClass}
                    placeholder="Where is the service needed?"
                    required
                    value={formData.location}
                    onChange={(e) => setFormData((prev) => ({ ...prev, location: e.target.value }))}
                  />
                </div>
                <div>
                  <label className={labelClass} htmlFor="request-budget">Budget (ETB) <span className="font-normal text-gray-400">(optional)</span></label>
                  <input
                    id="request-budget"
                    type="number"
                    className={inputClass}
                    placeholder="Enter your budget"
                    min="0"
                    value={formData.budget}
                    onChange={(e) => setFormData((prev) => ({ ...prev, budget: e.target.value }))}
                  />
                </div>
                <div>
                  <label className={labelClass} htmlFor="preferred-date">Preferred date <span className="font-normal text-gray-400">(optional)</span></label>
                  <input
                    id="preferred-date"
                    type="date"
                    className={inputClass}
                    value={formData.preferred_date}
                    onChange={(e) => setFormData((prev) => ({ ...prev, preferred_date: e.target.value }))}
                  />
                </div>
              </div>
            </div>
          </fieldset>

          {formData.request_type === "gift" && (
            <fieldset className="rounded-xl border border-gray-200 bg-gray-50 p-4">
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <legend className="text-lg font-semibold text-[#1c2b21]">Gift recipients</legend>
                <button
                  type="button"
                  className="rounded-full bg-[#D4AF37] px-4 py-2 text-sm font-semibold text-[#1c2b21] transition hover:rounded-md"
                  onClick={() =>
                    setGiftRecipients((prev) => [...prev, { name: "", email: "", phone: "", whatsapp: "", location: "" }])
                  }
                >
                  + Add Recipient
                </button>
              </div>

              <div className="space-y-4">
                {giftRecipients.map((recipient, index) => (
                  <div key={index} className="grid grid-cols-1 gap-4 rounded-md border border-gray-200 bg-white p-4 sm:grid-cols-2">
                    <div>
                      <label className={labelClass}>Recipient name</label>
                      <input
                        className={inputClass}
                        placeholder="Full name"
                        value={recipient.name}
                        onChange={(e) =>
                          setGiftRecipients((prev) =>
                            prev.map((r, i) => (i === index ? { ...r, name: e.target.value } : r))
                          )
                        }
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Recipient email <span className="font-normal text-gray-400">(optional)</span></label>
                      <input
                        type="email"
                        className={inputClass}
                        placeholder="recipient@example.com"
                        value={recipient.email}
                        onChange={(e) =>
                          setGiftRecipients((prev) =>
                            prev.map((r, i) => (i === index ? { ...r, email: e.target.value } : r))
                          )
                        }
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Recipient phone <span className="font-normal text-gray-400">(optional)</span></label>
                      <input
                        className={inputClass}
                        placeholder="Phone number"
                        value={recipient.phone}
                        onChange={(e) =>
                          setGiftRecipients((prev) =>
                            prev.map((r, i) => (i === index ? { ...r, phone: e.target.value } : r))
                          )
                        }
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Recipient WhatsApp <span className="font-normal text-gray-400">(optional)</span></label>
                      <input
                        className={inputClass}
                        placeholder="WhatsApp number"
                        value={recipient.whatsapp}
                        onChange={(e) =>
                          setGiftRecipients((prev) =>
                            prev.map((r, i) => (i === index ? { ...r, whatsapp: e.target.value } : r))
                          )
                        }
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className={labelClass}>Recipient location <span className="font-normal text-gray-400">(optional)</span></label>
                      <input
                        className={inputClass}
                        placeholder="Delivery or service location"
                        value={recipient.location}
                        onChange={(e) =>
                          setGiftRecipients((prev) =>
                            prev.map((r, i) => (i === index ? { ...r, location: e.target.value } : r))
                          )
                        }
                      />
                    </div>
                  </div>
                ))}
              </div>
            </fieldset>
          )}

          {message && (
            <p role="status" className="text-sm text-green-700">
              {message}
            </p>
          )}
          {error && (
            <p role="alert" className="text-sm text-red-600">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-[#D4AF37] text-[#1c2b21] font-semibold py-2 rounded-full hover:rounded-md transition disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? "Submitting..." : "Submit Request"}
          </button>
        </form>
      </section>
    </div>
  );
};

export default RequestServiceForm;
