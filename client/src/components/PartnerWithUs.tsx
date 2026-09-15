import { useState } from "react";
import axios from "axios";
import BASE_URL from "../api/api";

export default function PartnerWithUs() {
  const [tab, setTab] = useState<"Investor" | "Strategic Partner" | "Sponsorship">("Investor");

  const investmentOptions = ["Equity", "Debt", "Convertible Bonds"];
  const sectorOptions = [
    "Technology",
    "Healthcare",
    "Finance",
    "Manufacturing",
    "Real Estate",
    "Education",
    "Hospitality & Tourism",
    "Agriculture",
    "Media & Entertainment",
    "Construction"
  ];

  const [formData, setFormData] = useState({
    investmentType: "",
    sector: "",
    name: "",
    companyName: "",
    email: "",
    phone: "",
    officePhone: "",
    whatsapp: "",
    enquiry: "",
    motto: "",
    specialPackages: "",
    messages: "",
    coBrand: "",
    effectiveDate: "",
    expiryDate: "",
  });

  const [files, setFiles] = useState<Record<string, File | null>>({
    idOrPassport: null,
    license: null,
    tradeRegistration: null,
    businessProposal: null,
    businessPlan: null,
    logo: null,
    mouSigned: null,
    contractSigned: null,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, files: inputFiles } = e.target;
    setFiles(prev => ({ ...prev, [name]: inputFiles?.[0] || null }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = new FormData();
      data.append("tab", tab);

      Object.entries(formData).forEach(([key, value]) => {
        if (value) data.append(key, value);
      });

      Object.entries(files).forEach(([key, file]) => {
        if (file) data.append(key, file);
      });

      await axios.post(`${BASE_URL}/partner-request`, data);

      alert("🎉 Your form was submitted successfully!");

      // Reset form
      setFormData({
        investmentType: "",
        sector: "",
        name: "",
        companyName: "",
        email: "",
        phone: "",
        officePhone: "",
        whatsapp: "",
        enquiry: "",
        motto: "",
        specialPackages: "",
        messages: "",
        coBrand: "",
        effectiveDate: "",
        expiryDate: "",
      });

      setFiles({
        idOrPassport: null,
        license: null,
        tradeRegistration: null,
        businessProposal: null,
        businessPlan: null,
        logo: null,
        mouSigned: null,
        contractSigned: null,
      });

      setTab("Investor");
    } catch (err) {
      console.error("Submit error", err);
      alert("❌ Failed to submit. Please try again.");
    }
  };

  // File fields configuration
  const fileFields: Record<string, { label: string; accept: string }> = {
    idOrPassport: { label: "ID / Passport / Driving Licence", accept: "image/*,application/pdf,video/*,.doc,.docx" },
    license: { label: "License", accept: "image/*,application/pdf,video/*,.doc,.docx" },
    tradeRegistration: { label: "Trade Registration", accept: "image/*,application/pdf,video/*,.doc,.docx" },
    businessProposal: { label: "Business Proposal", accept: "application/pdf,.doc,.docx" },
    businessPlan: { label: "Business Plan", accept: "application/pdf,.doc,.docx" },
    logo: { label: "Logo", accept: "image/*" },
    mouSigned: { label: "MOU Signed", accept: "application/pdf,.doc,.docx" },
    contractSigned: { label: "Contract Signed", accept: "application/pdf,.doc,.docx" },
  };

  return (
    <div className="min-h-screen flex items-start sm:items-center justify-center bg-gray-50 px-4 sm:px-6 lg:px-8 py-10 sm:py-16 relative overflow-hidden">
      {/* Background Decorations */}
      <div className="absolute top-0 left-0 w-24 sm:w-40 h-24 sm:h-40 bg-[#0f285b] rounded-full opacity-30 animate-pulse z-0"></div>
      <div className="absolute bottom-0 right-0 w-40 sm:w-60 h-40 sm:h-60 bg-[#0f285b] rounded-full opacity-20 animate-spin-slow z-0"></div>

      <section className="z-10 w-full max-w-5xl bg-white shadow-2xl rounded-xl p-6 sm:p-10 space-y-6 relative">
        <div className="absolute -top-5 left-5 bg-[#be9b49] text-white text-xs px-3 py-1 rounded-full shadow-md">
          Partner With Us
        </div>

        <h2 className="text-2xl sm:text-3xl font-bold text-center text-[#0f285b] mb-6">
          Invest / Partner With Us
        </h2>

        {/* Tabs */}
        <div className="flex flex-wrap justify-center mb-6 gap-3">
          {["Investor", "Strategic Partner", "Sponsorship"].map(role => (
            <button
              key={role}
              onClick={() => setTab(role as any)}
              className={`px-4 py-2 rounded transition ${tab === role ? "bg-green text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"}`}
            >
              {role}
            </button>
          ))}
        </div>

        <form className="grid grid-cols-1 gap-4 sm:grid-cols-2" onSubmit={handleSubmit}>
          {/* Investor / Strategic Partner Fields */}
          {(tab === "Investor" || tab === "Strategic Partner") && (
            <>
              {/* Sector */}
              <div className="sm:col-span-2">
                <label className="block mb-1 text-sm font-medium">Sector</label>
                <select name="sector" value={formData.sector} onChange={handleChange} className="w-full border border-gray-300 p-2 rounded" required>
                  <option value="">-- Select Sector --</option>
                  {sectorOptions.map(option => (
                    <option key={option}>{option}</option>
                  ))}
                </select>
              </div>

              {/* Investment Type */}
              {tab === "Investor" && (
                <div className="sm:col-span-2">
                  <label className="block mb-1 text-sm font-medium">Investment Type</label>
                  <select name="investmentType" value={formData.investmentType} onChange={handleChange} className="w-full border border-gray-300 p-2 rounded">
                    <option value="">-- Select Investment Type --</option>
                    {investmentOptions.map(option => (
                      <option key={option}>{option}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Basic Inputs */}
              {["name", "companyName", "email", "phone", "whatsapp"].map(field => (
                <div key={field}>
                  <label className="block mb-1 text-sm font-medium capitalize">{field.replace(/([A-Z])/g, " $1")}</label>
                  <input
                    type="text"
                    name={field}
                    value={(formData as any)[field]}
                    onChange={handleChange}
                    className="w-full border border-gray-300 p-2 rounded"
                    required
                  />
                </div>
              ))}

              {/* File Inputs */}
              <div className="sm:col-span-2 mt-4">
                <label className="block mb-2 font-medium text-sm">Attachments</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {Object.entries(fileFields).map(([name, { label, accept }]) => {
                    if ((tab === "Investor" && ["idOrPassport","license","tradeRegistration"].includes(name)) ||
                        (tab === "Strategic Partner" && ["businessProposal","businessPlan","logo","mouSigned","contractSigned"].includes(name))) {
                      return (
                        <div key={name}>
                          <label className="block mb-1 text-xs font-medium text-gray-700">{label}</label>
                          <input
                            type="file"
                            name={name}
                            accept={accept}
                            onChange={handleFileChange}
                            className="w-full border border-gray-300 p-1 rounded text-sm"
                          />
                          {files[name] && <p className="text-xs mt-1">{files[name]!.name}</p>}
                        </div>
                      );
                    }
                    return null;
                  })}
                </div>
              </div>

              {/* Enquiry */}
              <div className="sm:col-span-2 mt-4">
                <label className="block mb-1 text-sm font-medium">Enquiries</label>
                <textarea rows={4} name="enquiry" value={formData.enquiry} onChange={handleChange} className="w-full border border-gray-300 p-2 rounded" placeholder="Type your message..."></textarea>
              </div>
            </>
          )}

          {/* Sponsorship Section */}
          {tab === "Sponsorship" && (
            <>
              {["name", "email", "phone", "officePhone", "whatsapp"].map(field => (
                <div key={field}>
                  <label className="block mb-1 text-sm font-medium capitalize">{field.replace(/([A-Z])/g, " $1")}</label>
                  <input type="text" name={field} value={(formData as any)[field]} onChange={handleChange} className="w-full border border-gray-300 p-2 rounded" required />
                </div>
              ))}

              {/* Logo */}
              <div>
                <label className="block mb-1 text-sm font-medium">Logo</label>
                <input type="file" name="logo" accept="image/*" onChange={handleFileChange} className="w-full border border-gray-300 p-2 rounded" />
                {files.logo && <p className="text-xs mt-1">{files.logo.name}</p>}
              </div>

              {/* Motto, Special Packages, Messages */}
              {["motto", "specialPackages", "messages"].map(field => (
                <div key={field} className="sm:col-span-2">
                  <label className="block mb-1 text-sm font-medium capitalize">{field.replace(/([A-Z])/g, " $1")}</label>
                  <textarea rows={3} name={field} value={(formData as any)[field]} onChange={handleChange} className="w-full border border-gray-300 p-2 rounded" />
                </div>
              ))}

              {/* Dates */}
              {["effectiveDate", "expiryDate"].map(field => (
                <div key={field}>
                  <label className="block mb-1 text-sm font-medium">{field === "effectiveDate" ? "Effective Date" : "Expiry Date"}</label>
                  <input type="date" name={field} value={(formData as any)[field]} onChange={handleChange} className="w-full border border-gray-300 p-2 rounded" />
                </div>
              ))}

              {/* MOU & Contract */}
              {["mouSigned","contractSigned"].map(field => (
                <div key={field}>
                  <label className="block mb-1 text-sm font-medium">{fileFields[field].label}</label>
                  <input type="file" name={field} accept={fileFields[field].accept} onChange={handleFileChange} className="w-full border border-gray-300 p-1 rounded text-sm" />
                  {files[field] && <p className="text-xs mt-1">{files[field]!.name}</p>}
                </div>
              ))}
            </>
          )}

          {/* Submit */}
          <div className="sm:col-span-2 text-center mt-6">
            <button type="submit" className="bg-[#0f285b] text-white px-6 py-3 rounded hover:bg-[#091838] transition w-full sm:w-auto">
              Submit
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
