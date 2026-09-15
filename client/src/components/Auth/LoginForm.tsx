import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const shimmerStyle = `
  @keyframes btnShimmer {
    0%   { background-position: -200% center; }
    100% { background-position: 200% center; }
  }
  .btn-shine {
    background: linear-gradient(
      90deg,
      #8D7338 0%,
      #EDC45B 30%,
      #FFF4B8 50%,
      #EDC45B 70%,
      #8D7338 100%
    );
    background-size: 200% auto;
    animation: btnShimmer 1.6s linear infinite;
    box-shadow: 0 0 18px 2px rgba(237, 196, 91, 0.55);
  }
`;

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
    <div className="min-h-screen flex items-center justify-center bg-[#E8E8E8] px-4 py-12 relative overflow-hidden">
      {/* Inject shimmer keyframe */}
      <style>{shimmerStyle}</style>

      {/* Decorative background shapes (gold gradient) */}
      <div
        className="pointer-events-none absolute -top-24 -left-24 w-72 h-72 rounded-full opacity-20"
        style={{ background: "linear-gradient(135deg, #EDC45B, #8D7338)" }}
      />
      <div
        className="pointer-events-none absolute -bottom-16 -right-16 w-56 h-56 rotate-45 opacity-15"
        style={{ background: "linear-gradient(135deg, #EDC45B, #8D7338)" }}
      />
      <div
        className="pointer-events-none absolute bottom-20 left-10 w-20 h-20 rounded-full opacity-20"
        style={{ background: "linear-gradient(135deg, #EDC45B, #8D7338)" }}
      />
      <div
        className="pointer-events-none absolute top-16 right-20 w-14 h-14 rotate-45 opacity-15"
        style={{ background: "linear-gradient(135deg, #EDC45B, #8D7338)" }}
      />

      {/* Card */}
      <div className="relative bg-white shadow-2xl rounded-2xl w-full max-w-md border border-gray-100 overflow-hidden">

        {/* Thin gold gradient accent bar at card top */}
        <div
          className="h-1.5 w-full"
          style={{ background: "linear-gradient(90deg, #EDC45B, #8D7338)" }}
        />

        <div className="px-8 sm:px-10 py-10">

          {/* Logo - gold logo mark on deep navy circle */}
          <div className="flex justify-center mb-6">
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center shadow-md"
              style={{ backgroundColor: "#0F285B" }}
            >
              <img
                src="/brand/gold-logo-mark.svg"
                alt="ODS Global Network Logo"
                className="w-12 h-12 object-contain"
              />
            </div>
          </div>

          {/* Heading */}
          <div className="text-center mb-7">
            <h1
              className="text-2xl sm:text-3xl font-bold tracking-tight"
              style={{ color: "#0F285B" }}
            >
              Welcome Back
            </h1>
            <p className="text-sm mt-2" style={{ color: "#6B7280" }}>
              Login to explore wellness &amp; gifting at your fingertips
            </p>
          </div>

          {/* Error banner */}
          {error && (
            <div
              className="mb-5 px-4 py-3 rounded-lg text-xs font-medium border"
              style={{
                backgroundColor: "#FDECEA",
                borderColor: "#B3261E",
                color: "#B3261E",
              }}
            >
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-5">

            {/* Email */}
            <div>
              <label
                htmlFor="login-email"
                className="block text-sm font-semibold mb-1.5"
                style={{ color: "#0F285B" }}
              >
                Email
              </label>
              <input
                id="login-email"
                type="email"
                name="email"
                autoComplete="username"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-4 py-2.5 rounded-lg text-sm text-gray-800 placeholder-gray-400 outline-none transition"
                style={{ border: "1.5px solid #E8E8E8" }}
                onFocus={(e) => { e.currentTarget.style.borderColor = "#BE9B49"; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = "#E8E8E8"; }}
              />
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="login-password"
                className="block text-sm font-semibold mb-1.5"
                style={{ color: "#0F285B" }}
              >
                Password
              </label>
              <input
                id="login-password"
                type="password"
                name="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-2.5 rounded-lg text-sm text-gray-800 placeholder-gray-400 outline-none transition"
                style={{ border: "1.5px solid #E8E8E8" }}
                onFocus={(e) => { e.currentTarget.style.borderColor = "#BE9B49"; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = "#E8E8E8"; }}
              />
            </div>

            {/* Sign In button - gold gradient with shimmer on hover */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-1 font-semibold py-3 rounded-full text-base flex items-center justify-center cursor-pointer shadow-sm active:scale-[0.98]"
              style={{
                background: "linear-gradient(90deg, #EDC45B, #8D7338)",
                color: "#0F285B",
                opacity: loading ? 0.75 : 1,
                transition: "opacity 0.2s, box-shadow 0.3s",
              }}
              onMouseEnter={(e) => {
                if (!loading) e.currentTarget.classList.add("btn-shine");
              }}
              onMouseLeave={(e) => {
                e.currentTarget.classList.remove("btn-shine");
              }}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  Signing In...
                </span>
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          {/* Footer links */}
          <div className="mt-7 text-center space-y-3">
            <p className="text-sm" style={{ color: "#0F285B" }}>
              Don&apos;t have an account?{" "}
              <Link
                to="/register"
                className="font-semibold transition-colors hover:text-[#BE9B49]"
                style={{ color: "#0F285B" }}
              >
                Register
              </Link>
            </p>

            <div>
              <Link
                to="/forgot-password"
                className="text-sm font-medium transition-colors hover:text-[#8D7338]"
                style={{ color: "#BE9B49" }}
              >
                Forgot Password?
              </Link>
            </div>

            <p className="text-xs pt-2" style={{ color: "#8D7338" }}>
              &copy; All rights reserved by ODS Global Network
            </p>
          </div>

        </div>
      </div>
    </div>
  );
};

export default LoginForm;
