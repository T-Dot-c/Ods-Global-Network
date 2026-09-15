import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const LoginForm = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await login(email, password);
      if (res.success) {
        navigate(res.redirectPath);
      } else {
        setError(res.error || "Login failed. Please verify email and password.");
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] px-4 py-12">
      <div className="bg-white shadow-xl rounded-2xl p-8 sm:p-10 w-full max-w-md border border-gray-100">
        {/* Logo */}
        <div className="flex justify-center mb-5">
          <img
            src="/wanaw gifting logo.jpeg"
            alt="Wanaw Gifting Logo"
            className="h-20 w-20 rounded-full object-cover shadow-sm"
          />
        </div>

        {/* Heading */}
        <div className="text-center mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-[#1c2b21] tracking-tight">
            Welcome Back
          </h1>
          <p className="text-gray-500 text-sm mt-2">
            Login to explore wellness & gifting at your fingertips
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 font-medium">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              name="email"
              autoComplete="username"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent transition"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              name="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent transition"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 bg-[#D4AF37] hover:bg-[#c39e2d] text-[#1c2b21] font-semibold py-3 rounded-full transition shadow-sm text-base flex items-center justify-center cursor-pointer"
          >
            {loading ? "Signing In..." : "Sign In"}
          </button>
        </form>

        {/* Footer Links */}
        <div className="mt-6 text-center space-y-3">
          <p className="text-sm text-gray-700">
            Don’t have an account?{" "}
            <Link to="/register" className="text-gray-900 font-medium hover:underline">
              Register
            </Link>
          </p>

          <div>
            <Link
              to="/forgot-password"
              className="text-sm text-blue-500 hover:text-blue-600 hover:underline"
            >
              Forgot Password?
            </Link>
          </div>

          <p className="text-xs text-gray-400 pt-3">
            © All rights reserved by ODS Global Network
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;
