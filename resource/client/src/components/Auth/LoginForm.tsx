import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import GoogleRedirectButton from "./GoogleRedirectButton";
import BASE_URL from "../../api/api";



const LoginForm = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
  e.preventDefault();
  setError("");

  try {
    const response = await fetch(`${BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      setError(data.msg || "Login failed");
      return;
    }

    localStorage.setItem("user", JSON.stringify({ ...data.user, token: data.token }));
    localStorage.setItem("token", data.token); // Also store token separately for easier access
    localStorage.setItem("userRole", data.user.role);

    if (data.user.role === "provider" || data.user.role === "corporate") {
      localStorage.setItem("providerId", data.user.id);
    }

    // Redirect based on role
    const role = data.user.role;
    if (role === "admin") navigate("/dashboard");
    else if (role === "provider") navigate("/provider-dashboard");
    else if (role === "corporate") navigate("/corporate-dashboard");
    else if (role === "diaspora") navigate("/diaspora-dashboard");
    else if (role === "individual") navigate("/individual-dashboard", { state: { userId: data.user.id } });
    else if (role === "marketing_admin") navigate("/marketing-dashboard");
    else if (role === "customer_support_admin") navigate("/support-dashboard");
    else if (role === "super_admin") navigate("/admin-dashboard");

  } catch (err) {
    console.error(err);
    setError("Something went wrong. Please try again.");
  }
};

  return (
    <div className="min-h-screen flex items-cent
    er justify-center bg-white px-4 relative overflow-hidden">
      {/* Decorative Shapes */}
      <div className="absolute top-0 left-0 w-40
       h-40 bg-[#1c2b21] rounded-full opacity-40 animate-pulse z-0"></div>
      <div className="absolute bottom-0 right-0 w-60 h-60 bg-[#1c2b21] rounded-full opacity-30 animate-spin-slow z-0"></div>
      <div className="absolute -top-10 right-10 w-32 h-32 bg-[#D4AF37] rotate-45 rounded-lg opacity-50 z-0"></div>

      {/* Login Card */}
      <div className="bg-white shadow-2xl rounded-xl p-8 w-full max-w-md relative z-10">
        <div className="absolute -top-5 left-5 bg-[#D4AF37] text-white text-xs px-3 py-1 rounded-full shadow-md">
          ODS Global Network Member Access
        </div>

        <div className="flex justify-center mb-6">
          <img src="/wanaw gifting logo.jpeg" alt="ODS Global Network Logo" className="h-16 w-16 rounded-full object-cover" />
        </div>

        <h2 className="text-3xl font-bold mb-6 text-center text-[#1c2b21]">Welcome Back</h2>
        {error && <p className="text-red-600 mb-4">{error}</p>}

        <p className="text-center text-gray-600 text-sm mb-6">
          Login to explore wellness & gifting at your fingertips
        </p>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              name="email"
              autoComplete="username"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full mt-1 p-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Password</label>
            <input
              type="password"
              name="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full mt-1 p-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-[#D4AF37] text-[#1c2b21] font-semibold py-2 rounded-full hover:rounded-md transition"
          >
            Sign In
          </button>

          <GoogleRedirectButton />
        </form>

        <p className="text-center text-sm mt-6">
          Don’t have an account?{" "}
          <Link to="/register" className="text-[#1c2b21] text-base hover:underline">
            Register
          </Link>
        </p>

        <div className="text-center mt-4">
          <Link to="/forgot-password" className="text-sm text-blue-600 hover:underline">
            Forgot Password?
          </Link>
        </div>

        <p className="text-center text-xs text-gray-400 mt-4">Ⓒ All rights reserved by ODS Global Network</p>
      </div>
    </div>
  );
};

export default LoginForm;
