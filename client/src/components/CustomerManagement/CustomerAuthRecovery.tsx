import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { 
  Mail, 
  Lock, 
  ArrowRight, 
  KeyRound, 
  CheckCircle2, 
  AlertCircle, 
  ShieldCheck,
  Eye,
  EyeOff
} from "lucide-react";

export default function CustomerAuthRecovery() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [view, setView] = useState<"login" | "forgot" | "resetSuccess">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await login(email, password);
      if (res.success) {
        setSuccessMessage("Authentication successful. Redirecting to Dashboard...");
        setTimeout(() => {
          navigate(res.redirectPath);
        }, 600);
      } else {
        setError(res.error || "Invalid email or password.");
      }
    } catch (err: any) {
      setError(err.message || "Invalid email or password.");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!resetEmail) {
      setError("Please enter your registered email address.");
      return;
    }
    setLoading(true);

    try {
      // Simulate /api/auth/forgot-password
      await new Promise(res => setTimeout(res, 900));
      setView("resetSuccess");
    } catch (err: any) {
      setError(err.message || "Failed to initiate password reset.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto my-12 p-6 md:p-8 bg-white rounded-2xl shadow-2xl border border-gray-100 font-sans">
      {/* Brand Header */}
      <div className="text-center mb-6">
        <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-[#0f285b] flex items-center justify-center text-[#edc45b] shadow-md">
          <ShieldCheck className="w-8 h-8" />
        </div>
        <span className="text-xs font-bold uppercase tracking-widest text-[#0f285b]">
          ODS Global Network
        </span>
        <h2 className="text-2xl font-black text-[#0f285b] mt-1">
          {view === "login" ? "Customer Member Login" : view === "forgot" ? "Password Recovery" : "Reset Link Dispatched"}
        </h2>
        <p className="text-gray-500 text-xs mt-1">
          {view === "login" 
            ? "Sign in to access your gifts, appointments, and wellness profile" 
            : view === "forgot" 
            ? "Enter your email to receive a secure password reset link" 
            : "Check your inbox for further instructions"}
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successMessage && (
        <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2 font-medium">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* LOGIN VIEW */}
      {view === "login" && (
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-3.5" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#edc45b] focus:outline-none"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-gray-700 uppercase">Password</label>
              <button
                type="button"
                onClick={() => { setView("forgot"); setError(""); }}
                className="text-xs text-[#0f285b] hover:text-[#edc45b] font-semibold transition"
              >
                Forgot Password?
              </button>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-3.5" />
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
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

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-[#0f285b] hover:bg-[#091838] text-[#edc45b] font-bold text-sm rounded-xl transition shadow-md flex items-center justify-center gap-2 mt-2"
          >
            {loading ? "Authenticating..." : "Sign In to Member Portal"}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      )}

      {/* FORGOT PASSWORD VIEW */}
      {view === "forgot" && (
        <form onSubmit={handleForgotPassword} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Registered Account Email</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-3.5" />
              <input
                type="email"
                required
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                placeholder="Enter your account email"
                className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#edc45b] focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-[#0f285b] hover:bg-[#091838] text-[#edc45b] font-bold text-sm rounded-xl transition shadow-md flex items-center justify-center gap-2"
          >
            <KeyRound className="w-4 h-4" />
            {loading ? "Sending Recovery Link..." : "Send Password Reset Link"}
          </button>

          <div className="text-center pt-2">
            <button
              type="button"
              onClick={() => { setView("login"); setError(""); }}
              className="text-xs text-gray-500 hover:text-[#0f285b] font-semibold"
            >
              ← Back to Sign In
            </button>
          </div>
        </form>
      )}

      {/* RESET SUCCESS CONFIRMATION */}
      {view === "resetSuccess" && (
        <div className="text-center space-y-4">
          <div className="w-12 h-12 mx-auto rounded-full bg-green-100 flex items-center justify-center text-green-700">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <p className="text-xs text-gray-600 leading-relaxed">
            We have sent password recovery instructions and a secure token to:
            <br />
            <strong className="text-gray-900">{resetEmail}</strong>
          </p>
          <button
            type="button"
            onClick={() => { setView("login"); }}
            className="w-full py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold text-xs rounded-xl transition"
          >
            Return to Sign In
          </button>
        </div>
      )}
    </div>
  );
}
