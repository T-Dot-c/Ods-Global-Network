import React, { useState } from "react";
import { 
  User, 
  Mail, 
  Phone, 
  Globe, 
  ShieldCheck, 
  Gift, 
  Calendar, 
  Clock, 
  Bell, 
  Lock, 
  Save, 
  CheckCircle2, 
  Award,
  QrCode
} from "lucide-react";

export default function CustomerProfileManagement() {
  const [activeTab, setActiveTab] = useState<"profile" | "membership" | "activity" | "security">("profile");
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Customer Profile State
  const [user, setUser] = useState({
    fullName: "Almaz Kebede",
    email: "almaz.kebede@example.com",
    phone: "+251 91 192 8374",
    city: "Addis Ababa",
    preferredLanguage: "English",
    preferredCurrency: "ETB",
    membershipTier: "Gold Member",
    membershipId: "MEM-ODS-829104",
    memberSince: "January 2026",
    referralCode: "74920193",
    referralBonusEarned: "1,500 ETB",
    twoFactorEnabled: false
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const giftActivity = [
    { id: "GFT-8101", title: "Executive Health Checkup Gift Voucher", recipient: "Solomon K. (Father)", amount: "4,500 ETB", date: "Sep 10, 2026", status: "Delivered & Redeemed" },
    { id: "GFT-8102", title: "Luxury Spa & Wellness Day Package", recipient: "Rahel M. (Sister)", amount: "2,800 ETB", date: "Aug 28, 2026", status: "Active / Unredeemed" }
  ];

  const appointmentHistory = [
    { id: "APT-301", provider: "St. Gabriel Specialized Hospital", service: "Full Metabolic Blood Panel", date: "Aug 15, 2026", status: "Completed" },
    { id: "APT-302", provider: "Blue Nile Diagnostic Center", service: "Abdominal Ultrasound", date: "Jul 22, 2026", status: "Completed" }
  ];

  return (
    <div className="max-w-5xl mx-auto my-8 p-6 md:p-8 bg-white rounded-2xl shadow-xl border border-gray-100 font-sans">
      {/* Top Banner with Digital Membership Card Preview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6 bg-gradient-to-br from-[#0f285b] via-[#143575] to-[#0a1b3d] rounded-2xl text-white shadow-xl mb-8">
        <div className="md:col-span-2 space-y-2">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#edc45b] text-[#0f285b]">
              {user.membershipTier}
            </span>
            <span className="text-xs text-blue-200">Member since {user.memberSince}</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight">{user.fullName}</h1>
          <p className="text-xs text-blue-200">
            Email: <strong className="text-white">{user.email}</strong> • Phone: <strong className="text-white">{user.phone}</strong>
          </p>

          <div className="pt-2 flex items-center gap-4 text-xs">
            <span className="text-[#edc45b] font-bold">Referral Code: <strong className="font-mono">{user.referralCode}</strong></span>
            <span className="text-emerald-300">Earned Credits: <strong>{user.referralBonusEarned}</strong></span>
          </div>
        </div>

        {/* Digital Gold Card */}
        <div className="p-4 bg-gradient-to-tr from-[#be9b49] via-[#edc45b] to-[#f5e189] rounded-xl text-[#0f285b] shadow-md flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider">ODS Global Net</span>
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div className="my-2 text-center">
            <p className="text-[10px] uppercase font-bold text-[#8d7338]">Digital Membership ID</p>
            <p className="font-mono font-black text-sm tracking-wider">{user.membershipId}</p>
          </div>
          <div className="flex items-center justify-between text-[9px] font-bold">
            <span>{user.fullName}</span>
            <span className="uppercase">{user.membershipTier}</span>
          </div>
        </div>
      </div>

      {savedSuccess && (
        <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-2 text-sm font-medium">
          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          <span>Profile changes successfully updated.</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-6 gap-2 overflow-x-auto">
        {[
          { id: "profile", label: "Personal Profile", icon: User },
          { id: "activity", label: "Gifts & Appointments", icon: Calendar },
          { id: "membership", label: "Membership Benefits", icon: Award },
          { id: "security", label: "Security & Passwords", icon: Lock },
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

      {/* TAB: PERSONAL PROFILE */}
      {activeTab === "profile" && (
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Full Legal Name</label>
              <input
                type="text"
                value={user.fullName}
                onChange={(e) => setUser({ ...user, fullName: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#0f285b] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Email Address</label>
              <input
                type="email"
                value={user.email}
                disabled
                className="w-full p-3 bg-gray-100 border border-gray-300 rounded-lg text-sm text-gray-500 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Phone Number</label>
              <input
                type="text"
                value={user.phone}
                onChange={(e) => setUser({ ...user, phone: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#0f285b] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Residential City</label>
              <input
                type="text"
                value={user.city}
                onChange={(e) => setUser({ ...user, city: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#0f285b] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Preferred Language</label>
              <select
                value={user.preferredLanguage}
                onChange={(e) => setUser({ ...user, preferredLanguage: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#0f285b] focus:outline-none"
              >
                <option value="English">English</option>
                <option value="Amharic">Amharic (አማርኛ)</option>
                <option value="Oromo">Oromo (Afaan Oromoo)</option>
                <option value="Tigrinya">Tigrinya (ትግርኛ)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Display Currency</label>
              <select
                value={user.preferredCurrency}
                onChange={(e) => setUser({ ...user, preferredCurrency: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#0f285b] focus:outline-none"
              >
                <option value="ETB">ETB - Ethiopian Birr</option>
                <option value="USD">USD - US Dollar</option>
                <option value="EUR">EUR - Euro</option>
                <option value="GBP">GBP - British Pound</option>
              </select>
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <button
              type="submit"
              className="px-6 py-2.5 bg-[#0f285b] hover:bg-[#091838] text-[#edc45b] font-bold text-sm rounded-lg flex items-center gap-2 shadow transition"
            >
              <Save className="w-4 h-4" /> Save Profile Details
            </button>
          </div>
        </form>
      )}

      {/* TAB: ACTIVITY */}
      {activeTab === "activity" && (
        <div className="space-y-6">
          <div>
            <h3 className="font-bold text-sm text-[#0f285b] mb-2 flex items-center gap-2">
              <Gift className="w-4 h-4 text-[#edc45b]" /> Sent & Received Gift Cards
            </h3>
            <div className="divide-y divide-gray-100 border border-gray-200 rounded-xl overflow-hidden">
              {giftActivity.map((g) => (
                <div key={g.id} className="p-4 flex items-center justify-between hover:bg-gray-50/50">
                  <div>
                    <h4 className="font-bold text-sm text-gray-900">{g.title}</h4>
                    <p className="text-xs text-gray-500">Recipient: {g.recipient} • {g.date}</p>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-sm text-[#0f285b] block">{g.amount}</span>
                    <span className="text-[11px] text-green-700 font-semibold">{g.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="font-bold text-sm text-[#0f285b] mb-2 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#edc45b]" /> Completed Service Appointments
            </h3>
            <div className="divide-y divide-gray-100 border border-gray-200 rounded-xl overflow-hidden">
              {appointmentHistory.map((a) => (
                <div key={a.id} className="p-4 flex items-center justify-between hover:bg-gray-50/50">
                  <div>
                    <h4 className="font-bold text-sm text-gray-900">{a.service}</h4>
                    <p className="text-xs text-gray-500">Provider: {a.provider} • {a.date}</p>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-green-100 text-green-800">
                    {a.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB: MEMBERSHIP BENEFITS */}
      {activeTab === "membership" && (
        <div className="space-y-4">
          <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl">
            <h3 className="font-bold text-sm text-[#0f285b]">Your Gold Membership Privileges</h3>
            <ul className="mt-2 space-y-1.5 text-xs text-gray-700">
              <li>✓ <strong>10% Discount</strong> across all verified partner hospitals & wellness clinics</li>
              <li>✓ <strong>Priority Booking Queue</strong> for specialist diagnostic appointments</li>
              <li>✓ <strong>Complimentary Annual Teleconsultation</strong> with medical wellness experts</li>
              <li>✓ <strong>Zero Convenience Fees</strong> on all digital gift card purchases & transfers</li>
            </ul>
          </div>
        </div>
      )}

      {/* TAB: SECURITY */}
      {activeTab === "security" && (
        <div className="space-y-4 max-w-md">
          <h3 className="font-bold text-sm text-[#0f285b]">Password & Security Credentials</h3>
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Current Password</label>
            <input
              type="password"
              placeholder="••••••••"
              className="w-full p-2.5 border border-gray-300 rounded-lg text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">New Password</label>
            <input
              type="password"
              placeholder="Min. 8 characters"
              className="w-full p-2.5 border border-gray-300 rounded-lg text-sm"
            />
          </div>
          <button
            type="button"
            className="px-4 py-2 bg-[#0f285b] text-[#edc45b] font-bold text-xs rounded-lg transition"
          >
            Update Password
          </button>
        </div>
      )}
    </div>
  );
}
