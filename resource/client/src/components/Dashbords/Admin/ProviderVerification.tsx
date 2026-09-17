import { useEffect, useState } from "react";
import BASE_URL from "../../../api/api";

type Provider = {
  id: number;
  fullName: string;
  email: string;
  role: string;
  membership: string;
  isVerified: boolean | number;
  verifiedAt?: string;
  createdAt: string;
  phone?: string;
  companyName?: string;
};

export default function ProviderVerification() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProviders();
  }, []);

  const getAuthToken = (): string | null => {
    const token = localStorage.getItem("token");
    if (token) return token;
    
    const userStr = localStorage.getItem("user");
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        return user.token || null;
      } catch {
        return null;
      }
    }
    
    return null;
  };

  const fetchProviders = async () => {
    try {
      const token = getAuthToken();
      if (!token) {
        throw new Error("No authentication token found. Please log in again.");
      }
      
      const res = await fetch(`${BASE_URL}/provider`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) throw new Error("Failed to fetch providers");
      const data = await res.json();
      setProviders(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch providers:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (providerId: number) => {
    try {
      const token = getAuthToken();
      if (!token) {
        alert("No authentication token found. Please log in again.");
        return;
      }
      const res = await fetch(`${BASE_URL}/provider/${providerId}/verify`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        alert("Provider verified successfully!");
        fetchProviders();
      } else {
        const error = await res.json();
        alert(`Failed to verify: ${error.msg || "Unknown error"}`);
      }
    } catch (err) {
      console.error("Error verifying provider:", err);
      alert("Something went wrong");
    }
  };

  const handleUnverify = async (providerId: number) => {
    try {
      const token = getAuthToken();
      if (!token) {
        alert("No authentication token found. Please log in again.");
        return;
      }
      const res = await fetch(`${BASE_URL}/provider/${providerId}/unverify`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        alert("Provider verification removed!");
        fetchProviders();
      } else {
        const error = await res.json();
        alert(`Failed to unverify: ${error.msg || "Unknown error"}`);
      }
    } catch (err) {
      console.error("Error unverifying provider:", err);
      alert("Something went wrong");
    }
  };

  if (loading) return <div className="p-4">Loading providers...</div>;

  return (
    <div className="p-4 overflow-x-auto">
      <h2 className="text-xl font-bold mb-4">Provider Verification</h2>
      <table className="min-w-full table-auto border border-gray-300 text-sm">
        <thead className="bg-gray-100">
          <tr>
            <th className="border p-2">#</th>
            <th className="border p-2">Username</th>
            <th className="border p-2">Email</th>
            <th className="border p-2">Membership</th>
            <th className="border p-2">Verified</th>
            <th className="border p-2">Verified At</th>
            <th className="border p-2">Joined</th>
            <th className="border p-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {providers.map((provider, index) => (
            <tr key={provider.id}>
              <td className="border p-2 text-center">{index + 1}</td>
              <td className="border p-2">{provider.fullName || provider.companyName || "N/A"}</td>
              <td className="border p-2">{provider.email}</td>
              <td className="border p-2 text-center">
                <span
                  className={`px-2 py-1 rounded text-xs ${
                    provider.membership === "enterprise"
                      ? "bg-purple-100 text-purple-800"
                      : provider.membership === "premium"
                      ? "bg-blue-100 text-blue-800"
                      : provider.membership === "basic"
                      ? "bg-green-100 text-green-800"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {provider.membership}
                </span>
              </td>
              <td className="border p-2 text-center">
                {provider.isVerified ? (
                  <span className="text-green-600 font-semibold">✓ Verified</span>
                ) : (
                  <span className="text-red-600">✗ Not Verified</span>
                )}
              </td>
              <td className="border p-2 text-center">
                {provider.verifiedAt
                  ? new Date(provider.verifiedAt).toLocaleDateString()
                  : "—"}
              </td>
              <td className="border p-2 text-center">
                {provider.createdAt
                  ? new Date(provider.createdAt).toLocaleDateString()
                  : "—"}
              </td>
              <td className="border p-2 text-center">
                {provider.isVerified ? (
                  <button
                    onClick={() => handleUnverify(provider.id)}
                    className="bg-red-500 text-white px-3 py-1 rounded text-xs hover:bg-red-600"
                  >
                    Unverify
                  </button>
                ) : (
                  <button
                    onClick={() => handleVerify(provider.id)}
                    className="bg-green-500 text-white px-3 py-1 rounded text-xs hover:bg-green-600"
                  >
                    Verify
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
