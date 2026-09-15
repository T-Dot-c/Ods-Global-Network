import { useState } from "react";
import { useNavigate } from "react-router-dom";
import BASE_URL from "../api/api";

const SupportCommunityForm = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    whatsapp: "",
    telegram: "",
    region: "",
    userType: "individual",
    roles: {
      gifter: false,
      influencer: false,
      digitalCreator: false,
      brandAmbassador: false,
      serviceProvider: false,
      volunteer: false,
    },
    gifterLevel: "individual", // Only for Gifters
    message: "",
  });

  // Handle text input change
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Handle role checkbox change
  const handleRoleChange = (role: keyof typeof formData.roles) => {
    setFormData((prev) => ({
      ...prev,
      roles: { ...prev.roles, [role]: !prev.roles[role] },
    }));
  };

 // Submit form
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  if (!formData.name || !formData.email) {
    alert("Please enter your name and email.");
    return;
  }

  if (!Object.values(formData.roles).some(Boolean)) {
    alert("Please select at least one role.");
    return;
  }

  try {
    const token = localStorage.getItem("token");

    const rolesArray = Object.keys(formData.roles).filter(
      (r) => formData.roles[r as keyof typeof formData.roles]
    );

    const payload = {
      ...formData,
      roles: rolesArray,
    };

    const res = await fetch(`${BASE_URL}/support-community`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: token ? `Bearer ${token}` : "",
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) throw new Error("Failed to submit form");

    // Store roles, gifter level, AND name locally
    localStorage.setItem("userRoles", JSON.stringify(formData.roles));
    localStorage.setItem("gifterLevel", formData.gifterLevel);
    localStorage.setItem("userName", formData.name); // <-- Add this line

    alert("Thank you for joining the Support Community!");
    navigate("/community/hemodialysis");
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
          Join Support Community
        </div>

        {/* Title */}
        <h2 className="text-2xl sm:text-3xl font-bold text-center text-[#1c2b21]">
          ODS Global Network Lewegenachen Hiwot
        </h2>
        <p className="text-center font-bold text-gold mb-4 text-base sm:text-lg">
          "ዋናው ለወገናችን ሂወት"
        </p>

        {/* Basic Info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <input
            name="name"
            placeholder="Full Name"
            value={formData.name}
            onChange={handleChange}
            className="p-2 border rounded border-gray-300 w-full"
            required
          />
          <input
            type="email"
            name="email"
            placeholder="Email Address"
            value={formData.email}
            onChange={handleChange}
            className="p-2 border rounded border-gray-300 w-full"
            required
          />
          <input
            type="tel"
            name="phone"
            placeholder="Phone Number"
            value={formData.phone}
            onChange={handleChange}
            className="p-2 border rounded border-gray-300 w-full"
          />
          <input
            name="whatsapp"
            placeholder="WhatsApp"
            value={formData.whatsapp}
            onChange={handleChange}
            className="p-2 border rounded border-gray-300 w-full"
          />
          <input
            name="telegram"
            placeholder="Telegram"
            value={formData.telegram}
            onChange={handleChange}
            className="p-2 border rounded border-gray-300 w-full"
          />
          <input
            name="region"
            placeholder="City / Region"
            value={formData.region}
            onChange={handleChange}
            className="p-2 border rounded border-gray-300 w-full"
          />
        </div>

        {/* Roles */}
        <div className="space-y-3">
          {[
            { key: "gifter", label: "A. Gifters — Send Gift for preferable Hemodialysis Patients Treatments" },
            { key: "influencer", label: "B. Influencers — Promote your preferable Hemodialysis Patient" },
            { key: "digitalCreator", label: "C. Digital Creators — Share Content to Support Hemodialysis Patients" },
            { key: "brandAmbassador", label: "D. Brand Ambassadors — Promote ODS Global Network Support Community Program" },
            { key: "serviceProvider", label: "E. Service Providers — Provide Health Service" },
            { key: "volunteer", label: "F. Volunteers — Support Community Program" },
          ].map((role) => (
            <div key={role.key} className="border p-4 rounded">
              <label className="flex items-start sm:items-center gap-2 mb-2 font-semibold text-[#1c2b21] text-sm sm:text-base">
                <input
                  type="checkbox"
                  checked={formData.roles[role.key as keyof typeof formData.roles]}
                  onChange={() => handleRoleChange(role.key as keyof typeof formData.roles)}
                  className="mt-1 sm:mt-0"
                />
                {role.label}
              </label>

              {/* Extra field only for Gifters */}
              {role.key === "gifter" && formData.roles.gifter && (
                <select
                  name="gifterLevel"
                  value={formData.gifterLevel}
                  onChange={handleChange}
                  className="p-2 border rounded border-gray-300 w-full sm:w-auto"
                >
                  <option value="individual">Individual</option>
                  <option value="corporate">Corporate</option>
                </select>
              )}
            </div>
          ))}
        </div>

        {/* Message */}
        <textarea
          name="message"
          placeholder="Message (optional)"
          value={formData.message}
          onChange={handleChange}
          className="w-full p-2 border rounded border-gray-300 min-h-[80px]"
        />

        {/* Submit Button */}
        <button
          type="submit"
          className="w-full py-2 bg-[#1c2b21] text-white font-bold rounded hover:bg-[#0f1a14] transition"
        >
          Submit
        </button>
      </form>
    </div>
  );
};

export default SupportCommunityForm;
