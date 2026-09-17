import { useState } from "react";
import { useNavigate } from "react-router-dom";
import BASE_URL from "../api/api";

const DiplomaticCommunityForm = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    alternativePhone: "",
    whatsapp: "",
    telegram: "",
    institution: "",
    institutionName: "",
    suggestion: "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.email) {
      alert("Please enter your name and email.");
      return;
    }

    try {
      const res = await fetch(`${BASE_URL}/diplomatic-community`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const result = await res.json();

      if (res.ok) {
        alert("Thank you for joining the Africa Union, Embassy & Diplomatic Community!");
        // Reset form
        setFormData({
          name: "",
          email: "",
          phone: "",
          alternativePhone: "",
          whatsapp: "",
          telegram: "",
          institution: "",
          institutionName: "",
          suggestion: "",
        });
        navigate("/community");
      } else {
        alert(`Submission failed: ${result.message || "Please try again."}`);
      }
    } catch (err) {
      console.error(err);
      alert("Something went wrong. Please try again.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Decorative Backgrounds */}
      <div className="absolute top-0 left-0 w-24 sm:w-40 h-24 sm:h-40 bg-[#1c2b21] rounded-full opacity-40 animate-pulse z-0"></div>
      <div className="absolute bottom-0 right-0 w-40 sm:w-60 h-40 sm:h-60 bg-[#1c2b21] rounded-full opacity-30 animate-spin-slow z-0"></div>
      <div className="absolute top-10 left-10 w-24 sm:w-40 h-24 sm:h-40 bg-[#1c2b21] rounded-full opacity-40 animate-pulse z-0"></div>
      <div className="absolute -top-10 right-10 w-20 sm:w-32 h-20 sm:h-32 bg-[#D4AF37] rotate-45 rounded-lg opacity-50 z-0"></div>

      <form
        onSubmit={handleSubmit}
        className="z-10 w-full max-w-3xl bg-white shadow-2xl rounded-xl p-6 sm:p-8 space-y-6 relative"
      >
        {/* Badge */}
        <div className="absolute -top-5 left-5 bg-[#D4AF37] text-white text-xs px-3 py-1 rounded-full shadow-md">
          Join Diplomatic Community
        </div>

        {/* Title */}
        <div className="flex justify-center mb-6">
          <img
            src="/wanaw gifting logo.jpeg"
            alt="Wanaw Logo"
            className="h-16 w-16 rounded-full object-cover"
          />
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold text-center text-[#1c2b21]">
          Africa Union, Embassy & Diplomatic Community
        </h2>
        <p className="text-center text-gray-600 text-sm mb-6">
          Join us by filling the form below
        </p>

        {/* Name */}
        <div>
          <label className="block text-sm font-semibold text-[#1c2b21] mb-2">
            Name <span className="text-red-500">*</span>
          </label>
          <input
            name="name"
            placeholder="Full Name"
            value={formData.name}
            onChange={handleChange}
            className="p-3 border rounded border-gray-300 w-full focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
            required
          />
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-semibold text-[#1c2b21] mb-2">
            Email <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            name="email"
            placeholder="Email Address"
            value={formData.email}
            onChange={handleChange}
            className="p-3 border rounded border-gray-300 w-full focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
            required
          />
        </div>

        {/* Phone */}
        <div>
          <label className="block text-sm font-semibold text-[#1c2b21] mb-2">
            Phone
          </label>
          <input
            type="tel"
            name="phone"
            placeholder="Phone Number"
            value={formData.phone}
            onChange={handleChange}
            className="p-3 border rounded border-gray-300 w-full focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
          />
        </div>

        {/* Alternative Phone */}
        <div>
          <label className="block text-sm font-semibold text-[#1c2b21] mb-2">
            Alternative Phone
          </label>
          <input
            type="tel"
            name="alternativePhone"
            placeholder="Alternative Phone Number"
            value={formData.alternativePhone}
            onChange={handleChange}
            className="p-3 border rounded border-gray-300 w-full focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
          />
        </div>

        {/* WhatsApp */}
        <div>
          <label className="block text-sm font-semibold text-[#1c2b21] mb-2">
            WhatsApp
          </label>
          <input
            type="tel"
            name="whatsapp"
            placeholder="WhatsApp Number"
            value={formData.whatsapp}
            onChange={handleChange}
            className="p-3 border rounded border-gray-300 w-full focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
          />
        </div>

        {/* Telegram */}
        <div>
          <label className="block text-sm font-semibold text-[#1c2b21] mb-2">
            Telegram
          </label>
          <input
            name="telegram"
            placeholder="Telegram Username"
            value={formData.telegram}
            onChange={handleChange}
            className="p-3 border rounded border-gray-300 w-full focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
          />
        </div>

        {/* Institution Dropdown */}
        <div>
          <label className="block text-sm font-semibold text-[#1c2b21] mb-2">
            Institution
          </label>
          <select
            name="institution"
            value={formData.institution}
            onChange={handleChange}
            className="p-3 border rounded border-gray-300 w-full focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
          >
            <option value="">Select Institution</option>
            <option value="Africa Union">Africa Union</option>
            <option value="Embassy">Embassy</option>
            <option value="Other International Institution">Other International Institution</option>
          </select>
        </div>

        {/* Institution Name */}
        <div>
          <label className="block text-sm font-semibold text-[#1c2b21] mb-2">
            Institution Name
          </label>
          <input
            name="institutionName"
            placeholder="Institution Name"
            value={formData.institutionName}
            onChange={handleChange}
            className="p-3 border rounded border-gray-300 w-full focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
          />
        </div>

        {/* Suggestion Box */}
        <div>
          <label className="block text-sm font-semibold text-[#1c2b21] mb-2">
            Suggestion Box
          </label>
          <textarea
            name="suggestion"
            placeholder="Your suggestions or comments..."
            value={formData.suggestion}
            onChange={handleChange}
            className="w-full p-3 border rounded border-gray-300 min-h-[120px] focus:outline-none focus:ring-2 focus:ring-[#D4AF37] resize-y"
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          className="w-full py-3 bg-[#1c2b21] text-white font-bold rounded hover:bg-[#0f1a14] transition-colors shadow-lg"
        >
          Submit
        </button>
      </form>
    </div>
  );
};

export default DiplomaticCommunityForm;



