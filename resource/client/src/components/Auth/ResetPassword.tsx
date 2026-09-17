import { useLocation } from "react-router-dom";
import { useState } from "react";
import BASE_URL from "../../api/api";

const ResetPassword = () => {
  const location = useLocation();
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  // ✅ Extract token from query string
  const searchParams = new URLSearchParams(location.search);
  const token = searchParams.get("token");

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const res = await fetch(`${BASE_URL}/auth/reset-password/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage(data.msg || "Something went wrong.");
        return;
      }

      setMessage(data.msg); 
      setPassword(""); 
    } catch (err) {
      setMessage("Something went wrong.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4 relative overflow-hidden">
      {/* Decorative Shapes */}
      <div className="absolute top-0 left-0 w-40 h-40 bg-[#1c2b21] rounded-full opacity-40 animate-pulse z-0"></div>
      <div className="absolute bottom-0 right-0 w-60 h-60 bg-[#1c2b21] rounded-full opacity-30 animate-spin-slow z-0"></div>
      <div className="absolute -top-10 right-10 w-32 h-32 bg-[#D4AF37] rotate-45 rounded-lg opacity-50 z-0"></div>

      {/* Reset Password Card */}
      <div className="bg-white shadow-2xl rounded-xl p-8 w-full max-w-md relative z-10">
        <div className="absolute -top-5 left-5 bg-[#D4AF37] text-white text-xs px-3 py-1 rounded-full shadow-md">
          Wanaw Reset Password
        </div>

        <div className="flex justify-center mb-6">
          <img
            src="/wanaw gifting logo.jpeg"
            alt="ODS Global Network Logo"
            className="h-16 w-16 rounded-full object-cover"
          />
        </div>

        <h2 className="text-3xl font-bold mb-6 text-center text-[#1c2b21]">
          Reset Your Password
        </h2>
        {message && <p className="text-green-600 text-center mb-4">{message}</p>}

        <form onSubmit={handleReset} className="space-y-4">
          <input
            type="password"
            className="w-full mt-1 p-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
            placeholder="Enter new password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <button
            type="submit"
            className="w-full bg-[#D4AF37] text-[#1c2b21] font-semibold py-2 rounded-full hover:rounded-md transition"
          >
            Reset Password
          </button>
        </form>

        <p className="text-center text-sm mt-6">
          Remembered your password?{" "}
          <a href="/login" className="text-[#1c2b21] hover:underline">
            Login
          </a>
        </p>

        <p className="text-center text-xs text-gray-400 mt-4">
          Ⓒ All rights reserved by ODS Global Network
        </p>
      </div>
    </div>
  );
};

export default ResetPassword;
