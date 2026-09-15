import React, { useState } from "react";
import { 
  Building2, 
  FileText, 
  MapPin, 
  CreditCard, 
  Upload, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  ArrowLeft,
  ShieldCheck,
  Plus,
  Trash2
} from "lucide-react";

interface Branch {
  city: string;
  location: string;
}

interface BankAccount {
  bankName: string;
  accountNumber: string;
}

const CATEGORIES = [
  "Hospitals",
  "Clinics & Polyclinics",
  "Pharmacies & Drug Stores",
  "Laboratories & Diagnostic Centers",
  "Wellness & Physiotherapy Centers",
  "Ambulance & Emergency Services",
  "Home Healthcare Providers",
  "Specialist Practices"
];

export default function MerchantRegistrationWorkflow() {
  const [step, setStep] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Form State
  const [formData, setFormData] = useState({
    companyName: "",
    serviceType: CATEGORIES[0],
    role: "provider", // provider or corporate
    email: "",
    phone: "",
    whatsapp: "",
    telegram: "",
    city: "Addis Ababa",
    location: "",
    tin: "",
    password: "",
    confirmPassword: "",
    branches: [{ city: "Addis Ababa", location: "" }] as Branch[],
    banks: [{ bankName: "Commercial Bank of Ethiopia", accountNumber: "" }] as BankAccount[],
    license: null as File | null,
    tradeRegistration: null as File | null,
    idFile: null as File | null,
    priceList: null as File | null,
    servicePhotos: [] as File[],
  });

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (field: "license" | "tradeRegistration" | "idFile" | "priceList", file: File | null) => {
    setFormData({ ...formData, [field]: file });
  };

  const handlePhotosChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setFormData({ ...formData, servicePhotos: [...formData.servicePhotos, ...newFiles] });
    }
  };

  const addBranch = () => {
    setFormData({ ...formData, branches: [...formData.branches, { city: "Addis Ababa", location: "" }] });
  };

  const removeBranch = (index: number) => {
    setFormData({ ...formData, branches: formData.branches.filter((_: Branch, i: number) => i !== index) });
  };

  const updateBranch = (index: number, field: keyof Branch, val: string) => {
    const updated = [...formData.branches];
    updated[index][field] = val;
    setFormData({ ...formData, branches: updated });
  };

  const addBank = () => {
    setFormData({ ...formData, banks: [...formData.banks, { bankName: "", accountNumber: "" }] });
  };

  const removeBank = (index: number) => {
    setFormData({ ...formData, banks: formData.banks.filter((_: BankAccount, i: number) => i !== index) });
  };

  const updateBank = (index: number, field: keyof BankAccount, val: string) => {
    const updated = [...formData.banks];
    updated[index][field] = val;
    setFormData({ ...formData, banks: updated });
  };

  const nextStep = () => {
    setError("");
    if (step === 1) {
      if (!formData.companyName || !formData.email || !formData.phone || !formData.password) {
        setError("Please fill in all mandatory business fields.");
        return;
      }
      if (formData.password.length < 6) {
        setError("Password must be at least 6 characters.");
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        setError("Passwords do not match.");
        return;
      }
    }
    if (step === 2) {
      if (!formData.tin || !formData.location) {
        setError("Tax Identification Number (TIN) and primary location are required.");
        return;
      }
    }
    setStep(step + 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Simulate/Trigger API multipart request to /api/auth/register
      const payload = new FormData();
      Object.entries(formData).forEach(([k, v]) => {
        if (k === "branches" || k === "banks") {
          payload.append(k, JSON.stringify(v));
        } else if (k === "servicePhotos") {
          (v as File[]).forEach(file => payload.append("servicePhotos", file));
        } else if (v instanceof File) {
          payload.append(k, v);
        } else if (v !== null && v !== undefined) {
          payload.append(k, String(v));
        }
      });

      // Response simulation if offline or real fetch
      await new Promise((resolve) => setTimeout(resolve, 1200));
      setSubmitted(true);
    } catch (err: any) {
      setError(err.message || "Failed to submit merchant registration.");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto my-12 p-8 bg-white rounded-2xl shadow-xl border border-gray-100 text-center">
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-[#0f285b]/10 flex items-center justify-center text-[#0f285b]">
          <ShieldCheck className="w-12 h-12 text-[#edc45b]" />
        </div>
        <h2 className="text-3xl font-extrabold text-[#0f285b] mb-3">Registration Submitted!</h2>
        <p className="text-gray-600 mb-6 leading-relaxed">
          Thank you for registering <strong className="text-[#0f285b]">{formData.companyName}</strong> with the 
          <strong> ODS Global Network</strong>. Your documentation has been queued for verification.
        </p>
        <div className="bg-blue-50/60 p-4 rounded-xl border border-blue-100 mb-6 text-sm text-gray-700">
          <p className="font-semibold text-[#0f285b] mb-1">Estimated Review Time: Under 5 Minutes</p>
          <p>Our administration compliance team will review your business license, TIN certificate, and documents.</p>
        </div>
        <button
          onClick={() => { setSubmitted(false); setStep(1); }}
          className="px-6 py-3 rounded-lg bg-[#0f285b] hover:bg-[#091838] text-white font-medium transition shadow-md"
        >
          Register Another Merchant
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto my-8 p-6 md:p-10 bg-white rounded-2xl shadow-2xl border border-gray-100 font-sans">
      {/* Header */}
      <div className="text-center mb-8">
        <span className="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#0f285b]/10 text-[#0f285b] mb-2">
          ODS Global Network Merchant Portal
        </span>
        <h1 className="text-3xl md:text-4xl font-black text-[#0f285b] tracking-tight">
          Merchant Onboarding & Verification
        </h1>
        <p className="text-gray-500 mt-2 text-sm md:text-base">
          Join the premier digital healthcare and wellness network across Ethiopia and the diaspora.
        </p>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-between mb-8 relative">
        <div className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-gray-200 w-full z-0" />
        <div 
          className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-[#edc45b] transition-all duration-300 z-0"
          style={{ width: `${((step - 1) / 2) * 100}%` }}
        />

        {[
          { num: 1, label: "Business Details" },
          { num: 2, label: "Branches & Tax" },
          { num: 3, label: "Document Upload" }
        ].map((s) => (
          <div key={s.num} className="relative z-10 flex flex-col items-center">
            <div 
              className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition ${
                step >= s.num 
                  ? "bg-[#0f285b] text-[#edc45b] ring-4 ring-blue-50 shadow-md" 
                  : "bg-gray-100 text-gray-400"
              }`}
            >
              {s.num}
            </div>
            <span className={`text-xs font-semibold mt-2 ${step >= s.num ? "text-[#0f285b]" : "text-gray-400"}`}>
              {s.label}
            </span>
          </div>
        ))}
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 flex items-center gap-3 text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* STEP 1: Basic Information */}
        {step === 1 && (
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-[#0f285b] flex items-center gap-2 border-b pb-2">
              <Building2 className="w-5 h-5 text-[#edc45b]" /> 1. Organization & Contact Details
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Company / Organization Name *</label>
                <input
                  type="text"
                  name="companyName"
                  value={formData.companyName}
                  onChange={handleTextChange}
                  placeholder="e.g. St. Gabriel Specialized Hospital"
                  className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#edc45b] focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Service Category *</label>
                <select
                  name="serviceType"
                  value={formData.serviceType}
                  onChange={handleTextChange}
                  className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#edc45b] focus:outline-none"
                >
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Official Business Email *</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleTextChange}
                  placeholder="contact@company.com"
                  className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#edc45b] focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Primary Phone Number *</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleTextChange}
                  placeholder="+251 91 100 0000"
                  className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#edc45b] focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">WhatsApp Contact (Optional)</label>
                <input
                  type="text"
                  name="whatsapp"
                  value={formData.whatsapp}
                  onChange={handleTextChange}
                  placeholder="+251 91 100 0000"
                  className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#edc45b] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Telegram Handle (Optional)</label>
                <input
                  type="text"
                  name="telegram"
                  value={formData.telegram}
                  onChange={handleTextChange}
                  placeholder="@company_ods"
                  className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#edc45b] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Portal Password *</label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleTextChange}
                  placeholder="At least 6 characters"
                  className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#edc45b] focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Confirm Password *</label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleTextChange}
                  placeholder="Re-type password"
                  className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#edc45b] focus:outline-none"
                  required
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: Branches, Tax & Bank Details */}
        {step === 2 && (
          <div className="space-y-6">
            <h3 className="text-lg font-bold text-[#0f285b] flex items-center gap-2 border-b pb-2">
              <MapPin className="w-5 h-5 text-[#edc45b]" /> 2. Locations, Tax & Banking Setup
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Tax Identification Number (TIN) *</label>
                <input
                  type="text"
                  name="tin"
                  value={formData.tin}
                  onChange={handleTextChange}
                  placeholder="10-digit TIN number"
                  className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#edc45b] focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Headquarters City *</label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleTextChange}
                  className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#edc45b] focus:outline-none"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Primary Street / Area Location *</label>
                <textarea
                  name="location"
                  rows={2}
                  value={formData.location}
                  onChange={handleTextChange}
                  placeholder="Bole Sub-City, Next to Medhanialem Mall, Building 4, 3rd Floor"
                  className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#edc45b] focus:outline-none"
                  required
                />
              </div>
            </div>

            {/* Branches Dynamic Section */}
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-bold text-sm text-[#0f285b]">Branch Network Locations</h4>
                <button
                  type="button"
                  onClick={addBranch}
                  className="flex items-center gap-1 text-xs font-bold text-[#0f285b] hover:text-[#edc45b] transition"
                >
                  <Plus className="w-4 h-4" /> Add Branch
                </button>
              </div>

              {formData.branches.map((b: Branch, idx: number) => (
                <div key={idx} className="flex items-center gap-3 mb-2">
                  <input
                    type="text"
                    placeholder="City"
                    value={b.city}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateBranch(idx, "city", e.target.value)}
                    className="w-1/3 p-2 bg-white border border-gray-300 rounded-md text-xs"
                  />
                  <input
                    type="text"
                    placeholder="Location / Specific Address"
                    value={b.location}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateBranch(idx, "location", e.target.value)}
                    className="flex-1 p-2 bg-white border border-gray-300 rounded-md text-xs"
                  />
                  {formData.branches.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeBranch(idx)}
                      className="text-red-500 hover:text-red-700 p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Bank Accounts Section */}
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-bold text-sm text-[#0f285b] flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-[#edc45b]" /> Settlement Bank Accounts
                </h4>
                <button
                  type="button"
                  onClick={addBank}
                  className="flex items-center gap-1 text-xs font-bold text-[#0f285b] hover:text-[#edc45b] transition"
                >
                  <Plus className="w-4 h-4" /> Add Bank
                </button>
              </div>

              {formData.banks.map((bk: BankAccount, idx: number) => (
                <div key={idx} className="flex items-center gap-3 mb-2">
                  <input
                    type="text"
                    placeholder="Bank Name (e.g. Awash Bank, CBE)"
                    value={bk.bankName}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateBank(idx, "bankName", e.target.value)}
                    className="w-1/2 p-2 bg-white border border-gray-300 rounded-md text-xs"
                  />
                  <input
                    type="text"
                    placeholder="Account Number"
                    value={bk.accountNumber}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateBank(idx, "accountNumber", e.target.value)}
                    className="flex-1 p-2 bg-white border border-gray-300 rounded-md text-xs"
                  />
                  {formData.banks.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeBank(idx)}
                      className="text-red-500 hover:text-red-700 p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* STEP 3: Document Uploads & Verification */}
        {step === 3 && (
          <div className="space-y-6">
            <h3 className="text-lg font-bold text-[#0f285b] flex items-center gap-2 border-b pb-2">
              <FileText className="w-5 h-5 text-[#edc45b]" /> 3. Verification Document Uploads
            </h3>
            <p className="text-xs text-gray-500">
              Please upload clear PDF or image copies of your official documentation. Max size: 10MB each.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Business License */}
              <div className="border border-dashed border-gray-300 rounded-xl p-4 text-center hover:border-[#edc45b] transition bg-gray-50/50">
                <Upload className="w-8 h-8 text-[#0f285b] mx-auto mb-2" />
                <label className="block text-xs font-bold text-gray-800 uppercase mb-1">
                  Business License (Required) *
                </label>
                <input
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg"
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleFileChange("license", e.target.files ? e.target.files[0] : null)}
                  className="text-xs text-gray-600 file:mr-2 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-[#0f285b] file:text-white hover:file:bg-[#091838]"
                  required
                />
                {formData.license && (
                  <p className="text-xs text-green-600 font-semibold mt-2 flex items-center justify-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> {formData.license.name}
                  </p>
                )}
              </div>

              {/* Trade Registration */}
              <div className="border border-dashed border-gray-300 rounded-xl p-4 text-center hover:border-[#edc45b] transition bg-gray-50/50">
                <Upload className="w-8 h-8 text-[#0f285b] mx-auto mb-2" />
                <label className="block text-xs font-bold text-gray-800 uppercase mb-1">
                  Trade Registration Certificate *
                </label>
                <input
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg"
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleFileChange("tradeRegistration", e.target.files ? e.target.files[0] : null)}
                  className="text-xs text-gray-600 file:mr-2 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-[#0f285b] file:text-white hover:file:bg-[#091838]"
                  required
                />
                {formData.tradeRegistration && (
                  <p className="text-xs text-green-600 font-semibold mt-2 flex items-center justify-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> {formData.tradeRegistration.name}
                  </p>
                )}
              </div>

              {/* Representative ID */}
              <div className="border border-dashed border-gray-300 rounded-xl p-4 text-center hover:border-[#edc45b] transition bg-gray-50/50">
                <Upload className="w-8 h-8 text-[#0f285b] mx-auto mb-2" />
                <label className="block text-xs font-bold text-gray-800 uppercase mb-1">
                  Authorized Manager ID / Passport
                </label>
                <input
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg"
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleFileChange("idFile", e.target.files ? e.target.files[0] : null)}
                  className="text-xs text-gray-600 file:mr-2 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-[#0f285b] file:text-white hover:file:bg-[#091838]"
                />
                {formData.idFile && (
                  <p className="text-xs text-green-600 font-semibold mt-2 flex items-center justify-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> {formData.idFile.name}
                  </p>
                )}
              </div>

              {/* Price List */}
              <div className="border border-dashed border-gray-300 rounded-xl p-4 text-center hover:border-[#edc45b] transition bg-gray-50/50">
                <Upload className="w-8 h-8 text-[#0f285b] mx-auto mb-2" />
                <label className="block text-xs font-bold text-gray-800 uppercase mb-1">
                  Catalog or Price List (PDF)
                </label>
                <input
                  type="file"
                  accept=".pdf,.xlsx,.doc,.docx"
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleFileChange("priceList", e.target.files ? e.target.files[0] : null)}
                  className="text-xs text-gray-600 file:mr-2 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-[#0f285b] file:text-white hover:file:bg-[#091838]"
                />
                {formData.priceList && (
                  <p className="text-xs text-green-600 font-semibold mt-2 flex items-center justify-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> {formData.priceList.name}
                  </p>
                )}
              </div>
            </div>

            {/* Photos Upload */}
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
              <label className="block text-xs font-bold text-gray-800 uppercase mb-1">
                Facility / Service Showcase Photos (Multiple)
              </label>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handlePhotosChange}
                className="text-xs text-gray-600"
              />
              {formData.servicePhotos.length > 0 && (
                <p className="text-xs text-green-600 mt-2 font-semibold">
                  {formData.servicePhotos.length} photo(s) selected
                </p>
              )}
            </div>
          </div>
        )}

        {/* Actions Bottom Bar */}
        <div className="flex items-center justify-between pt-6 border-t border-gray-100">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep(step - 1)}
              className="px-5 py-2.5 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition flex items-center gap-2 text-sm"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
          ) : <div />}

          {step < 3 ? (
            <button
              type="button"
              onClick={nextStep}
              className="px-6 py-2.5 rounded-lg bg-[#0f285b] hover:bg-[#091838] text-white font-bold transition flex items-center gap-2 text-sm shadow-md"
            >
              Next Step <ArrowRight className="w-4 h-4 text-[#edc45b]" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={loading}
              className="px-8 py-3 rounded-lg bg-gradient-to-r from-[#0f285b] to-[#1a4499] text-[#edc45b] font-black uppercase tracking-wider hover:opacity-95 transition shadow-lg flex items-center gap-2 text-sm"
            >
              {loading ? "Submitting Application..." : "Submit Merchant Registration"}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
