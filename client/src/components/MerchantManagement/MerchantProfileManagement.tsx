import React, { useState } from "react";
import { 
  Building2, 
  MapPin, 
  Phone, 
  Mail, 
  CreditCard, 
  ShieldCheck, 
  Clock, 
  AlertTriangle, 
  FileCheck2, 
  Upload, 
  Save, 
  CheckCircle2 
} from "lucide-react";

interface BranchItem {
  city: string;
  location: string;
}

interface BankItem {
  bankName: string;
  accountNumber: string;
}

interface DocumentItem {
  id: string;
  title: string;
  status: string;
  issueDate?: string;
  expiryDate?: string;
  note?: string;
  fileUrl: string;
}

interface MerchantProfile {
  companyName: string;
  serviceType: string;
  email: string;
  phone: string;
  whatsapp: string;
  telegram: string;
  city: string;
  location: string;
  tin: string;
  membership: string;
  verificationStatus: string;
  verificationDate: string;
  bio: string;
  workingHours: string;
  branches: BranchItem[];
  banks: BankItem[];
  documents: DocumentItem[];
}

export default function MerchantProfileManagement() {
  const [activeTab, setActiveTab] = useState<"general" | "branches" | "documents" | "banking">("general");
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Merchant Profile State
  const [profile, setProfile] = useState<MerchantProfile>({
    companyName: "St. Gabriel Specialized Healthcare & Wellness",
    serviceType: "Hospitals",
    email: "director@stgabriel.et",
    phone: "+251 91 123 4567",
    whatsapp: "+251 91 123 4567",
    telegram: "@stgabriel_health",
    city: "Addis Ababa",
    location: "22 Mazoria, across from Lex Plaza, Addis Ababa",
    tin: "0048192041",
    membership: "Premium Provider",
    verificationStatus: "Verified", // "Verified" | "Pending" | "Action Required"
    verificationDate: "2026-08-10",
    bio: "Leading tertiary healthcare center providing specialized diagnostics, inpatient wellness, and hemodialysis support in partnership with ODS Global Network.",
    workingHours: "Monday - Sunday (24/7 Emergency, 8:00 AM - 7:00 PM Outpatient)",
    branches: [
      { city: "Addis Ababa", location: "Main Campus - 22 Mazoria" },
      { city: "Addis Ababa", location: "Bole Branch - Cameroon St." }
    ],
    banks: [
      { bankName: "Commercial Bank of Ethiopia", accountNumber: "1000293849201" },
      { bankName: "Awash International Bank", accountNumber: "0132049281900" }
    ],
    documents: [
      { id: "license", title: "Business License", status: "Verified", issueDate: "2026-01-15", expiryDate: "2027-01-15", fileUrl: "#" },
      { id: "trade", title: "Trade Registration", status: "Verified", issueDate: "2025-06-20", expiryDate: "Permanent", fileUrl: "#" },
      { id: "tin", title: "TIN Registration Certificate", status: "Verified", issueDate: "2024-11-05", expiryDate: "N/A", fileUrl: "#" },
      { id: "pricelist", title: "2026 Service Price List", status: "Action Required", note: "Please update with revised laboratory fees", fileUrl: "#" }
    ]
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="max-w-5xl mx-auto my-8 p-6 md:p-8 bg-white rounded-2xl shadow-xl border border-gray-100 font-sans">
      {/* Top Banner with ODS Brand Styling */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 bg-gradient-to-r from-[#0f285b] to-[#163a82] rounded-xl text-white mb-8 shadow-md">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black">{profile.companyName}</h1>
            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-[#edc45b] text-[#0f285b] flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> {profile.verificationStatus}
            </span>
          </div>
          <p className="text-blue-200 text-sm mt-1">
            Category: {profile.serviceType} • Membership: {profile.membership}
          </p>
        </div>

        <div className="text-right">
          <p className="text-xs text-blue-200">ODS Merchant ID</p>
          <p className="font-mono font-bold text-lg text-[#edc45b]">ODS-MER-09214</p>
        </div>
      </div>

      {savedSuccess && (
        <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-2 text-sm font-medium">
          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          <span>Profile changes successfully saved and synchronized.</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-6 gap-2 overflow-x-auto">
        {[
          { id: "general", label: "General Information", icon: Building2 },
          { id: "branches", label: "Branch Network", icon: MapPin },
          { id: "documents", label: "Documents & Compliance", icon: FileCheck2 },
          { id: "banking", label: "Settlement Banking", icon: CreditCard },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 font-bold text-sm transition whitespace-nowrap ${
                isActive 
                  ? "border-[#0f285b] text-[#0f285b]" 
                  : "border-transparent text-gray-500 hover:text-gray-800"
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? "text-[#edc45b]" : "text-gray-400"}`} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* TAB CONTENT */}
      <form onSubmit={handleSave}>
        {activeTab === "general" && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Company Name</label>
                <input
                  type="text"
                  value={profile.companyName}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setProfile({ ...profile, companyName: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#0f285b] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Service Classification</label>
                <input
                  type="text"
                  value={profile.serviceType}
                  disabled
                  className="w-full p-3 bg-gray-100 border border-gray-300 rounded-lg text-sm text-gray-500 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Official Email</label>
                <input
                  type="email"
                  value={profile.email}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setProfile({ ...profile, email: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#0f285b] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Primary Phone</label>
                <input
                  type="text"
                  value={profile.phone}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setProfile({ ...profile, phone: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#0f285b] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">WhatsApp Number</label>
                <input
                  type="text"
                  value={profile.whatsapp}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setProfile({ ...profile, whatsapp: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#0f285b] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Telegram Handle</label>
                <input
                  type="text"
                  value={profile.telegram}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setProfile({ ...profile, telegram: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#0f285b] focus:outline-none"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Operating Hours</label>
                <input
                  type="text"
                  value={profile.workingHours}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setProfile({ ...profile, workingHours: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#0f285b] focus:outline-none"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Business Bio / Description</label>
                <textarea
                  rows={3}
                  value={profile.bio}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setProfile({ ...profile, bio: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#0f285b] focus:outline-none"
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === "branches" && (
          <div className="space-y-4">
            <h3 className="font-bold text-sm text-[#0f285b]">Physical Service Delivery Branches</h3>
            {profile.branches.map((b: BranchItem, idx: number) => (
              <div key={idx} className="p-4 bg-gray-50 border border-gray-200 rounded-xl flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-sm text-[#0f285b]">{b.location}</h4>
                  <p className="text-xs text-gray-500">{b.city}</p>
                </div>
                <span className="text-xs font-semibold px-2 py-1 bg-green-100 text-green-800 rounded">
                  Operational
                </span>
              </div>
            ))}
          </div>
        )}

        {activeTab === "documents" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b pb-2">
              <div>
                <h3 className="font-bold text-sm text-[#0f285b]">Verification & Compliance Documents</h3>
                <p className="text-xs text-gray-500">Legal business verification reviewed by ODS Global Net.</p>
              </div>
            </div>

            <div className="divide-y divide-gray-100 border border-gray-200 rounded-xl overflow-hidden">
              {profile.documents.map((doc: DocumentItem) => (
                <div key={doc.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:bg-gray-50/50 transition">
                  <div>
                    <h4 className="font-bold text-sm text-gray-900">{doc.title}</h4>
                    <p className="text-xs text-gray-500">
                      Issue: {doc.issueDate} • Expiry: {doc.expiryDate}
                    </p>
                    {doc.note && (
                      <p className="text-xs text-amber-700 font-medium mt-1 flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5" /> {doc.note}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                      doc.status === "Verified" 
                        ? "bg-green-100 text-green-800" 
                        : "bg-amber-100 text-amber-800"
                    }`}>
                      {doc.status}
                    </span>
                    <button
                      type="button"
                      className="px-3 py-1.5 border border-gray-300 hover:border-[#0f285b] text-xs font-bold rounded-lg text-[#0f285b] flex items-center gap-1.5 transition"
                    >
                      <Upload className="w-3.5 h-3.5" /> Re-Upload
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "banking" && (
          <div className="space-y-4">
            <h3 className="font-bold text-sm text-[#0f285b]">Settlement Bank Accounts</h3>
            <p className="text-xs text-gray-500">Payments from gift cards and direct service bookings are settled to these accounts.</p>

            {profile.banks.map((b: BankItem, idx: number) => (
              <div key={idx} className="p-4 bg-gray-50 border border-gray-200 rounded-xl flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-sm text-[#0f285b]">{b.bankName}</h4>
                  <p className="font-mono text-xs text-gray-600 mt-1">A/C: {b.accountNumber}</p>
                </div>
                <span className="text-xs font-semibold px-2 py-1 bg-blue-100 text-[#0f285b] rounded">
                  Primary Settlement
                </span>
              </div>
            ))}
          </div>
        )}

        <div className="pt-6 border-t border-gray-100 flex justify-end">
          <button
            type="submit"
            className="px-6 py-2.5 bg-[#0f285b] hover:bg-[#091838] text-[#edc45b] font-bold text-sm rounded-lg flex items-center gap-2 shadow transition"
          >
            <Save className="w-4 h-4" /> Save Profile Changes
          </button>
        </div>
      </form>
    </div>
  );
}
