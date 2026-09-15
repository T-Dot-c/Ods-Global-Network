import axios from "axios";
import { useEffect, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import BASE_URL from "../../../api/api";
import { jwtDecode } from "jwt-decode";


interface User {
  _id: string;
  fullName: string;
  email: string;
  role: string;
  membership: string;
  companyName?: string;
  phone?: string;
  city?: string;
  location?: string;
}

interface DecodedToken {
  exp: number;
  [key: string]: any;
}

const Account = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"profile" | "security">("profile");
  const [editMode, setEditMode] = useState(false);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const navigate = useNavigate();

  // Helper: get token safely and check expiration
  const getToken = () => {
    const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
    const token = storedUser.token || localStorage.getItem("token");
    if (!token) return null;

    try {
      const decoded = jwtDecode<DecodedToken>(token);
      const now = Date.now() / 1000;
      if (decoded && decoded.exp && decoded.exp < now) {
        localStorage.removeItem("user");
        localStorage.removeItem("token");
        navigate("/login");
        return null;
      }
      return token;
    } catch {
      return token;
    }
  };

  // Fetch profile on mount
  useEffect(() => {
    const fetchProfile = async () => {
      const token = getToken();
      if (!token) return;

      try {
        const res = await axios.get(`${BASE_URL}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUser(res.data);
      } catch (err) {
        console.error("Failed to load profile", err);
        setError("Failed to load profile");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (!user) return;
    setUser({ ...user, [e.target.name]: e.target.value });
  };

  const handleSaveProfile = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSaving(true);
    setError(null);
    setSuccess(null);

    const token = getToken();
    if (!token) return;

    try {
      const res = await axios.put(
        `${BASE_URL}/auth/me`,
        {
          fullName: user.fullName,
          phone: user.phone,
          city: user.city,
          location: user.location,
          companyName: user.companyName,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setUser(res.data);
      setSuccess("Profile updated successfully!");
      setEditMode(false);

      // Update stored user in localStorage
      const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
      localStorage.setItem("user", JSON.stringify({ ...storedUser, ...res.data }));
    } catch (err) {
      console.error("Failed to update profile", err);
      setError("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);

    const token = getToken();
    if (!token) return;

    try {
      await axios.put(
        `${BASE_URL}/auth/change-password`,
        { currentPassword, newPassword },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setSuccess("Password changed successfully!");
      setCurrentPassword("");
      setNewPassword("");
    } catch (err) {
      console.error("Failed to change password", err);
      setError("Failed to change password");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="text-center mt-20 text-gray-500">Loading profile...</p>;
  if (!user) return <p className="text-center mt-20 text-red-500">No user found</p>;

  return (
    <div className="max-w-full md:max-w-lg mx-auto mt-6 p-4 md:p-6 bg-green rounded-2xl shadow-xl text-gray-800">
      {/* Tab Buttons */}
      <div className="flex flex-col sm:flex-row border-b border-white mb-6 justify-center sm:space-x-4 space-y-2 sm:space-y-0">
        <button
          className={`flex-1 px-4 py-2 font-semibold rounded-lg transition-all text-center ${
            activeTab === "profile" ? "bg-[#be9b49] text-white shadow-lg" : "text-white hover:bg-white/20"
          }`}
          onClick={() => setActiveTab("profile")}
        >
          Profile
        </button>
        <button
          className={`flex-1 px-4 py-2 font-semibold rounded-lg transition-all text-center ${
            activeTab === "security" ? "bg-[#be9b49] text-white shadow-lg" : "text-white hover:bg-white/20"
          }`}
          onClick={() => setActiveTab("security")}
        >
          Security
        </button>
      </div>

      {/* Error & Success */}
      {error && <p className="text-red-200 mb-4 text-center">{error}</p>}
      {success && <p className="text-green-200 mb-4 text-center">{success}</p>}

      {/* Profile Tab */}
      {activeTab === "profile" && (
        <form onSubmit={handleSaveProfile} className="space-y-4 bg-white rounded-xl p-4 md:p-6 shadow-lg">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-gray-700">Your Profile</h2>
            <button
              type="button"
              onClick={() => setEditMode(!editMode)}
              className="text-gray-500 hover:text-gray-700 text-lg"
            >
              ✏️
            </button>
          </div>

          {[
            { label: "Full Name", name: "fullName", type: "text", auto: "name" },
            { label: "Email", name: "email", type: "email", auto: "email", disabled: true },
            { label: "Phone", name: "phone", type: "text", auto: "tel" },
            { label: "City", name: "city", type: "text", auto: "address-level2" },
            { label: "Location", name: "location", type: "text", auto: "address-line1" },
            ...(user.companyName ? [{ label: "Company Name", name: "companyName", type: "text", auto: "organization" }] : []),
          ].map(({ label, name, type, auto, disabled }) => (
            <div key={name}>
              <label className="block mb-2 font-medium text-gray-600">{label}</label>
              <input
                type={type}
                name={name}
                value={(user as any)[name] || ""}
                onChange={handleChange}
                disabled={disabled ?? !editMode}
                autoComplete={auto}
                className={`w-full border p-2 md:p-3 rounded-lg shadow-sm transition-all focus:ring-2 focus:ring-blue-400 ${
                  disabled ?? !editMode ? "bg-gray-100" : "bg-white"
                }`}
              />
            </div>
          ))}

          {editMode && (
            <button
              type="submit"
              disabled={saving}
              className="w-full bg-green text-gold py-3 md:py-4 rounded-xl font-semibold hover:scale-105 transition-transform shadow-lg"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          )}
        </form>
      )}

      {/* Security Tab */}
      {activeTab === "security" && (
        <form onSubmit={handleChangePassword} className="space-y-4 md:space-y-6 bg-white rounded-2xl p-4 md:p-6 shadow-lg">
          <h2 className="text-2xl font-bold text-gray-700 mb-4 text-center md:text-left">Change Password</h2>

          <div>
            <label className="block mb-2 font-medium text-gray-600">Current Password</label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
              autoComplete="current-password"
              className="w-full border p-3 md:p-4 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-400 transition-all"
            />
          </div>

          <div>
            <label className="block mb-2 font-medium text-gray-600">New Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              autoComplete="new-password"
              className="w-full border p-3 md:p-4 rounded-lg shadow-sm  transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-gradient-to-r from-green-600 via-yellow-500 to-orange-500 text-white py-3 md:py-4 rounded-xl font-semibold hover:scale-105 transition-transform shadow-lg"
          >
            {saving ? "Updating..." : "Update Password"}
          </button>
        </form>
      )}
    </div>
  );
};

export default Account;
