import { useState, type FormEvent } from "react";
import BASE_URL from "../api/api";

const healthcareSpecializations = [
  "Medical Doctor",
  "Nurse",
  "Health Officer",
  "Pharmacist",
  "Health Coach",
  "Beauty Consultants"
];

const freshGraduateSpecializations = [
  "IT",
  "Marketing",
  "Digital Marketing",
  "Finance Analyst",
  "Business Analyst",
  "Graphic Designer",
  "Full Stack Web Developer",
  "Sales",
];

type MemberType = "healthcare and wellness" | "freshGraduate";

interface FormData {
  name: string;
  email: string;
  phone: string;
  whatsapp: string;
  location: string;
  specialization: string;
  linkedin: string;
  internshipPeriod: string;
  cv: File | null;
  credentials: File | null;
}

export default function WanawCommunityMembership() {
  const [memberType, setMemberType] = useState<MemberType>("healthcare and wellness");
  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    phone: "",
    whatsapp: "",
    location: "",
    specialization: "",
    internshipPeriod: "",
    linkedin: "",
    cv: null,
    credentials: null,
  });

  const MAX_FILE_SIZE = 100 * 1024 * 1024;

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const target = e.target;
    if (target instanceof HTMLInputElement && target.type === "file") {
      const file = target.files?.[0];
      if (file) {
        if (file.size > MAX_FILE_SIZE) {
          alert("File size must not exceed 100MB.");
          target.value = "";
          return;
        }
        setFormData((prev) => ({
          ...prev,
          [target.name]: file,
        }));
      }
    } else {
      setFormData((prev) => ({
        ...prev,
        [target.name]: target.value,
      }));
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const form = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        if (value) form.append(key, value);
      });
      form.append("memberType", memberType);

      const res = await fetch(`${BASE_URL}/community`, {
        method: "POST",
        body: form,
      });

      const result = await res.json();

      if (res.ok) {
        const certificateMessage = result?.certificateNumber
          ? ` Your community certificate number is ${result.certificateNumber}.`
          : "";
        alert(`🎉 Membership submitted successfully!${certificateMessage}`);
        console.log("✅ Response:", result);
      } else {
        alert(`❌ Submission failed: ${result.message}`);
        console.error("❌ Server error:", result);
      }
    } catch (err) {
      console.error("❌ Submission error:", err);
      alert("❌ Something went wrong while submitting.");
    }
  };

  const specializations =
    memberType === "healthcare and wellness"
      ? healthcareSpecializations
      : freshGraduateSpecializations;

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4 py-10">
      <div className="bg-white shadow-2xl rounded-2xl p-8 w-full max-w-xl">
        <div className="flex justify-center mb-6">
          <img
            src="/wanaw gifting logo.jpeg"
            alt="ODS Global Network Logo"
            className="h-16 w-16 rounded-full object-cover"
          />
        </div>

        <h2 className="text-2xl font-bold text-center text-[#1c2b21] mb-1">
          Professionals Community
        </h2>
        <p className="text-center text-gray-600 text-sm mb-6">
          Join us by filling the form below
        </p>

        {/* Member Type Selector */}
        <div className="flex justify-center gap-6 mb-6">
          <label className="inline-flex items-center space-x-2">
            <input
              type="radio"
              value="healthcare"
              checked={memberType === "healthcare and wellness"}
              onChange={() => setMemberType("healthcare and wellness")}
              className="form-radio text-[#D4AF37]"
            />
            <span>healthcare and wellness</span>
          </label>
          <label className="inline-flex items-center space-x-2">
            <input
              type="radio"
              value="freshGraduate"
              checked={memberType === "freshGraduate"}
              onChange={() => setMemberType("freshGraduate")}
              className="form-radio text-[#D4AF37]"
            />
            <span>Fresh Graduate</span>
          </label>
        </div>

        {/* FORM */}
        <form onSubmit={handleSubmit} className="grid gap-4">
          <input
            name="name"
            placeholder="Full Name"
            value={formData.name}
            onChange={handleChange}
            required
            className="p-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-green-400"
          />
          <input
            name="email"
            type="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleChange}
            required
            className="p-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-green-400"
          />
          <input
            name="phone"
            placeholder="Phone"
            value={formData.phone}
            onChange={handleChange}
            required
            className="p-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-green-400"
          />
          <input
            name="whatsapp"
            placeholder="WhatsApp (Optional)"
            value={formData.whatsapp}
            onChange={handleChange}
            className="p-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-green-400"
          />
          <input
            name="linkedin"
            type="url"
            placeholder="LinkedIn Profile (Optional)"
            value={formData.linkedin}
            onChange={handleChange}
            className="p-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-green-400"
          />
          <input
            name="location"
            placeholder="Current Location"
            value={formData.location}
            onChange={handleChange}
            className="p-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-green-400"
          />

          {/* Specialization Dropdown */}
          <select
            name="specialization"
            value={formData.specialization}
            onChange={handleChange}
            required
            className="p-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-green-400"
          >
            <option value="">-- Select Specialization --</option>
            {specializations.map((spec) => (
              <option key={spec} value={spec}>
                {spec}
              </option>
            ))}
          </select>

          {/* Internship period — shown only for fresh graduates */}
          {memberType === "freshGraduate" && (
            <input
              name="internshipPeriod"
              placeholder="Internship Period (e.g. June–August 2025)"
              value={formData.internshipPeriod}
              onChange={handleChange}
              required
              className="p-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-green-400"
            />
          )}

          {/* File uploads */}
          <div>
            <label className="block text-sm mb-1">Upload CV *</label>
            <input
              name="cv"
              type="file"
              required
              accept=".pdf,.doc,.docx"
              onChange={handleChange}
              className="w-full text-sm"
            />
          </div>
          <div>
            <label className="block text-sm mb-1">Upload Credentials *</label>
            <input
              name="credentials"
              type="file"
              required
              accept=".pdf,.doc,.docx"
              onChange={handleChange}
              className="w-full text-sm"
            />
          </div>

          <button
            type="submit"
            className="mt-2 bg-[#D4AF37] text-[#1c2b21] font-semibold py-2 rounded-full hover:rounded-xl transition"
          >
            Submit
          </button>
        </form>

        <p className="text-center text-xs text-gray-400 mt-6">
          Ⓒ All rights reserved by ODS Global Network
        </p>
      </div>
    </div>
  );
}

