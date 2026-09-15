import React, { useState } from "react";
import { 
  User, 
  Mail, 
  Phone, 
  Lock, 
  Globe, 
  ShieldCheck, 
  Gift, 
  CheckCircle2, 
  AlertCircle,
  Eye,
  EyeOff
} from "lucide-react";

export default function CustomerRegistration() {
  const [customerType, setCustomerType] = useState<"individual" | "diaspora">("individual");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    countryOfResidence: "Ethiopia",
    preferredCurrency: "ETB",
    password: "",
    confirmPassword: "",
    membershipTier: "Standard Member",
    referralCode: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const getPasswordStrength = () => {
    if (!form.password) return 0;
    let score = 0;
    if (form.password.length >= 8) score++;
    if (/[A-Z]/.test(form.password)) score++;
    if (/[0-9]/.test(form.password)) score++;
    if (/[^A-Za-z0-9]/.test(form.password)) score++;
    return score;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!form.fullName || !form.email || !form.password) {
      setError("Please fill out all required fields.");
      return;
    }

    if (form.password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      // Simulate/trigger registration API call
      await new Promise(res => setTimeout(res, 1000));
      setSubmitted(true);
    } catch (err: any) {
      setError(err.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="max-w-lg mx-auto my-12 p-8 bg-white rounded-2xl shadow-xl border border-gray-100 text-center font-sans">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#0f285b]/10 flex items-center justify-center">
          <CheckCircle2 className="w-10 h-10 text-[#edc45b]" />
        </div>
        <h2 className="text-2xl font-black text-[#0f285b] mb-2">Welcome to ODS Global Network!</h2>
        <p className="text-gray-600 text-sm mb-6 leading-relaxed">
          Your account for <strong className="text-gray-900">{form.email}</strong> has been created successfully. You can now access wellness services and gifting options worldwide.
        </p>
        <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl text-left text-xs space-y-1 mb-6">
          <p><span className="text-gray-500">Membership Tier:</span> <strong className="text-[#0f285b]">{form.membershipTier}</strong></p>
          <p><span className="text-gray-500">Account Type:</span> <strong className="capitalize text-gray-800">{customerType}</strong></p>
          <p><span className="text-gray-500">ODS Member ID:</span> <strong className="font-mono text-[#0f285b]">MEM-ODS-{Math.floor(100000 + Math.random() * 900000)}</strong></p>
        </div>
        <button
          onClick={() => { setSubmitted(false); }}
          className="w-full py-3 bg-[#0f285b] hover:bg-[#091838] text-[#edc45b] font-bold text-sm rounded-xl transition shadow"
        >
          Go to Sign In
        </button>
      </div>
    );
  }

  const strength = getPasswordStrength();

  return (
    <div className="max-w-xl mx-auto my-8 p-6 md:p-8 bg-white rounded-2xl shadow-xl border border-gray-100 font-sans">
      {/* Brand Header */}
      <div className="text-center mb-6">
        <span className="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#0f285b]/10 text-[#0f285b] mb-2">
          ODS Global Network Member Access
        </span>
        <h1 className="text-3xl font-black text-[#0f285b]">Create Customer Account</h1>
        <p className="text-gray-500 text-sm mt-1">
          Explore wellness, healthcare packages, and seamless digital gifting at your fingertips.
        </p>
      </div>

      {/* Customer Type Selector (Individual vs Diaspora) */}
      <div className="grid grid-cols-2 gap-2 p-1 bg-gray-100 rounded-xl mb-6">
        <button
          type="button"
          onClick={() => { setCustomerType("individual"); setForm({ ...form, countryOfResidence: "Ethiopia", preferredCurrency: "ETB" }); }}
          className={`py-2.5 text-xs font-bold rounded-lg transition flex items-center justify-center gap-2 ${
            customerType === "individual" 
              ? "bg-[#0f285b] text-[#edc45b] shadow" 
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          <User className="w-4 h-4" /> Local Member (Ethiopia)
        </button>
        <button
          type="button"
          onClick={() => { setCustomerType("diaspora"); setForm({ ...form, countryOfResidence: "United States", preferredCurrency: "USD" }); }}
          className={`py-2.5 text-xs font-bold rounded-lg transition flex items-center justify-center gap-2 ${
            customerType === "diaspora" 
              ? "bg-[#0f285b] text-[#edc45b] shadow" 
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          <Globe className="w-4 h-4" /> Diaspora Member (Global)
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Full Name *</label>
          <div className="relative">
            <User className="w-4 h-4 text-gray-400 absolute left-3 top-3.5" />
            <input
              type="text"
              name="fullName"
              required
              value={form.fullName}
              onChange={handleChange}
              placeholder="e.g. Almaz Kebede"
              className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#edc45b] focus:outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Email Address *</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-3.5" />
              <input
                type="email"
                name="email"
                required
                value={form.email}
                onChange={handleChange}
                placeholder="you@domain.com"
                className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#edc45b] focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Phone Number</label>
            <div className="relative">
              <Phone className="w-4 h-4 text-gray-400 absolute left-3 top-3.5" />
              <input
                type="tel"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                placeholder={customerType === "individual" ? "+251 91 100 0000" : "+1 (555) 000-0000"}
                className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#edc45b] focus:outline-none"
              />
            </div>
          </div>
        </div>

        {customerType === "diaspora" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-3 bg-blue-50/50 rounded-xl border border-blue-100">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Country of Residence</label>
              <input
                type="text"
                name="countryOfResidence"
                value={form.countryOfResidence}
                onChange={handleChange}
                placeholder="e.g. USA, Canada, UK"
                className="w-full p-2 bg-white border border-gray-300 rounded-lg text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Preferred Currency</label>
              <select
                name="preferredCurrency"
                value={form.preferredCurrency}
                onChange={handleChange}
                className="w-full p-2 bg-white border border-gray-300 rounded-lg text-xs"
              >
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
                <option value="ETB">ETB (Br)</option>
              </select>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Password *</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-3.5" />
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                required
                value={form.password}
                onChange={handleChange}
                placeholder="Min. 6 characters"
                className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#edc45b] focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Confirm Password *</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-3.5" />
              <input
                type={showPassword ? "text" : "password"}
                name="confirmPassword"
                required
                value={form.confirmPassword}
                onChange={handleChange}
                placeholder="Re-enter password"
                className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#edc45b] focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Password Strength Meter */}
        {form.password && (
          <div className="space-y-1">
            <div className="flex gap-1 h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
              <div className={`h-full transition-all duration-300 ${
                strength >= 1 ? (strength === 1 ? "bg-red-500 w-1/4" : strength === 2 ? "bg-amber-500 w-2/4" : strength === 3 ? "bg-blue-500 w-3/4" : "bg-emerald-500 w-full") : "w-0"
              }`} />
            </div>
            <p className="text-[11px] text-gray-400">
              Strength: {strength <= 1 ? "Weak" : strength === 2 ? "Fair" : strength === 3 ? "Good" : "Strong"}
            </p>
          </div>
        )}

        <div>
          <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Referral Code (Optional)</label>
          <input
            type="text"
            name="referralCode"
            value={form.referralCode}
            onChange={handleChange}
            placeholder="8-digit referral code"
            className="w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#edc45b] focus:outline-none"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-[#0f285b] hover:bg-[#091838] text-[#edc45b] font-bold text-sm rounded-xl transition shadow-md flex items-center justify-center gap-2 mt-4"
        >
          {loading ? "Creating Account..." : "Complete Customer Registration"}
        </button>
      </form>
    </div>
  );
}
