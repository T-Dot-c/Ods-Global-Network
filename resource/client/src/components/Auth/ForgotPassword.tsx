import { useState } from "react";
import { Link } from "react-router-dom";
import BASE_URL from "../../api/api";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");

    try {
      const res = await fetch(`${BASE_URL}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.msg || "Something went wrong.");
      } else {
        setMessage(data.msg || "Reset link sent! Check your email.");
      }
    } catch (err) {
      setError("Something went wrong.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4 relative overflow-hidden">
      {/* Decorative Shapes */}
      <div className="absolute top-0 left-0 w-40 h-40 bg-[#1c2b21] rounded-full opacity-40 animate-pulse z-0"></div>
      <div className="absolute bottom-0 right-0 w-60 h-60 bg-[#1c2b21] rounded-full opacity-30 animate-spin-slow z-0"></div>
      <div className="absolute -top-10 right-10 w-32 h-32 bg-[#D4AF37] rotate-45 rounded-lg opacity-50 z-0"></div>

      {/* Card */}
      <div className="bg-white shadow-2xl rounded-xl p-8 w-full max-w-md relative z-10">
        <div className="absolute -top-5 left-5 bg-[#D4AF37] text-white text-xs px-3 py-1 rounded-full shadow-md">
          ODS Global Network Member Access
        </div>

        <div className="flex justify-center mb-6">
          <img
            src="/wanaw gifting logo.jpeg"
            alt="ODS Global Network Logo"
            className="h-16 w-16 rounded-full object-cover"
          />
        </div>

        <h2 className="text-3xl font-bold mb-4 text-center text-[#1c2b21]">
          Forgot Password
        </h2>
        <p className="text-center text-gray-600 text-sm mb-6">
          Enter your email to receive a password reset link
        </p>

        {error && <p className="text-red-600 mb-4 text-center">{error}</p>}
        {message && <p className="text-green-600 mb-4 text-center">{message}</p>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full mt-1 p-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-[#D4AF37] text-[#1c2b21] font-semibold py-2 rounded-full hover:rounded-md transition"
          >
            Send Reset Link
          </button>
        </form>

        <p className="text-center text-sm mt-6">
          Remembered your password?{" "}
          <Link
            to="/login"
            className="text-[#1c2b21] hover:underline"
          >
            Sign In
          </Link>
        </p>

        <p className="text-center text-xs text-gray-400 mt-4">
          Ⓒ All rights reserved by ODS Global Network
        </p>
      </div>
    </div>
  );
};

export default ForgotPassword;
