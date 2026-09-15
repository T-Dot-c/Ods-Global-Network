import { useEffect, useState } from "react";
import BASE_URL from "../../../api/api";

type Service = {
  id: number;
  title: string;
  category: string;
  subcategory?: string;
  price: number;
  status: string;
  providerId: number;
  providerName?: string;
  providerEmail?: string;
  providerVerified?: boolean;
  imageUrl?: string;
  description?: string;
  location?: string;
  createdAt?: string;
};

const ManageServices = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [pendingServices, setPendingServices] = useState<Service[]>([]);
  const [activeTab, setActiveTab] = useState<"all" | "pending">("pending");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getAuthToken = (): string | null => {
    // Try to get token from localStorage token key first
    const token = localStorage.getItem("token");
    if (token) return token;
    
    // If not found, try to get it from user object
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

  const fetchAllServices = async () => {
    try {
      const token = getAuthToken();
      if (!token) {
        throw new Error("No authentication token found. Please log in again.");
      }
      
      const res = await fetch(`${BASE_URL}/services`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) throw new Error("Failed to fetch services");
      const data = await res.json();
      setServices(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error fetching services:", err);
      setError(err instanceof Error ? err.message : "Failed to load services");
    }
  };

  const fetchPendingServices = async () => {
    try {
      const token = getAuthToken();
      if (!token) {
        throw new Error("No authentication token found. Please log in again.");
      }

      console.log("🔍 Fetching pending services from:", `${BASE_URL}/services/admin/pending`);
      
      const res = await fetch(`${BASE_URL}/services/admin/pending`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      console.log("📡 Response status:", res.status, res.statusText);

      if (!res.ok) {
        const errorText = await res.text();
        console.error("❌ Error response body:", errorText);
        
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { msg: errorText || `HTTP ${res.status}: ${res.statusText}` };
        }
        
        throw new Error(errorData.msg || errorData.error || `Failed to fetch pending services (${res.status})`);
      }

      const data = await res.json();
      console.log("✅ Received pending services:", data);
      setPendingServices(Array.isArray(data) ? data : []);
      setError(null); // Clear any previous errors
    } catch (err) {
      console.error("❌ Error fetching pending services:", err);
      const errorMessage = err instanceof Error ? err.message : "Failed to load pending services";
      setError(errorMessage);
      setPendingServices([]); // Clear services on error
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this service? This action cannot be undone.")) {
      return;
    }

    try {
      const token = getAuthToken();
      if (!token) {
        alert("No authentication token found. Please log in again.");
        return;
      }
      const res = await fetch(`${BASE_URL}/services/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.msg || "Failed to delete service");
      }

      alert("Service deleted successfully");
      if (activeTab === "pending") {
        fetchPendingServices();
      } else {
        fetchAllServices();
      }
    } catch (err) {
      console.error("Error deleting service:", err);
      alert(err instanceof Error ? err.message : "Failed to delete service");
    }
  };

  const handleApprove = async (id: number) => {
    if (!window.confirm("Approve this service?")) {
      return;
    }

    try {
      const token = getAuthToken();
      if (!token) {
        alert("No authentication token found. Please log in again.");
        return;
      }
      const res = await fetch(`${BASE_URL}/services/${id}/approve`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.msg || "Failed to approve service");
      }

      alert("Service approved successfully");
      fetchPendingServices();
      fetchAllServices();
    } catch (err) {
      console.error("Error approving service:", err);
      alert(err instanceof Error ? err.message : "Failed to approve service");
    }
  };

  const handleReject = async (id: number) => {
    if (!window.confirm("Reject this service?")) {
      return;
    }

    try {
      const token = getAuthToken();
      if (!token) {
        alert("No authentication token found. Please log in again.");
        return;
      }
      const res = await fetch(`${BASE_URL}/services/${id}/reject`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.msg || "Failed to reject service");
      }

      alert("Service rejected");
      fetchPendingServices();
      fetchAllServices();
    } catch (err) {
      console.error("Error rejecting service:", err);
      alert(err instanceof Error ? err.message : "Failed to reject service");
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);
      await Promise.all([fetchAllServices(), fetchPendingServices()]);
      setLoading(false);
    };
    loadData();
  }, []);

  const displayServices = activeTab === "pending" ? pendingServices : services;

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#1c2b21] mb-2">Manage Services</h1>
        <p className="text-gray-600">Approve, reject, or delete services submitted by providers</p>
      </div>

      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <div className="flex gap-4">
          <button
            onClick={() => setActiveTab("pending")}
            className={`px-6 py-3 font-semibold transition-colors ${
              activeTab === "pending"
                ? "border-b-2 border-[#D4AF37] text-[#1c2b21]"
                : "text-gray-500 hover:text-[#1c2b21]"
            }`}
          >
            Pending Approval ({pendingServices.length})
          </button>
          <button
            onClick={() => setActiveTab("all")}
            className={`px-6 py-3 font-semibold transition-colors ${
              activeTab === "all"
                ? "border-b-2 border-[#1c2b21] text-[#1c2b21]"
                : "text-gray-500 hover:text-[#1c2b21]"
            }`}
          >
            All Services ({services.length})
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1c2b21] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading services...</p>
        </div>
      ) : error ? (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      ) : (
        <div className="overflow-x-auto bg-white rounded-lg shadow-md">
          <table className="min-w-full border-collapse">
            <thead className="bg-[#1c2b21] text-white">
              <tr>
                <th className="py-3 px-4 text-left text-sm font-semibold">#</th>
                <th className="py-3 px-4 text-left text-sm font-semibold">Service</th>
                <th className="py-3 px-4 text-left text-sm font-semibold">Category</th>
                <th className="py-3 px-4 text-left text-sm font-semibold">Provider</th>
                <th className="py-3 px-4 text-left text-sm font-semibold">Price</th>
                <th className="py-3 px-4 text-left text-sm font-semibold">Status</th>
                <th className="py-3 px-4 text-left text-sm font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {displayServices.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-gray-500">
                    No services found
                  </td>
                </tr>
              ) : (
                displayServices.map((service, index) => {
                  const statusColor =
                    service.status === "approved"
                      ? "bg-green-100 text-green-800"
                      : service.status === "denied"
                        ? "bg-red-100 text-red-800"
                        : "bg-yellow-100 text-yellow-800";

                  return (
                    <tr key={service.id} className="border-b hover:bg-gray-50 transition">
                      <td className="py-3 px-4">{index + 1}</td>
                      <td className="py-3 px-4">
                        <div className="font-semibold">{service.title}</div>
                        {service.location && (
                          <div className="text-xs text-gray-500">{service.location}</div>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-sm">{service.category}</div>
                        {service.subcategory && (
                          <div className="text-xs text-gray-500">{service.subcategory}</div>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-sm">{service.providerName || "N/A"}</div>
                        {service.providerEmail && (
                          <div className="text-xs text-gray-500">{service.providerEmail}</div>
                        )}
                        {service.providerVerified !== undefined && (
                          <span
                            className={`text-xs px-2 py-1 rounded ${
                              service.providerVerified
                                ? "bg-green-100 text-green-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {service.providerVerified ? "✓ Verified" : "Unverified"}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {service.price ? `${parseFloat(String(service.price)).toLocaleString()} ETB` : "N/A"}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${statusColor}`}>
                          {service.status?.toUpperCase() || "PENDING"}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex gap-2">
                          {service.status === "pending" && (
                            <>
                              <button
                                onClick={() => handleApprove(service.id)}
                                className="bg-green-500 text-white px-3 py-1 rounded text-xs hover:bg-green-600 transition"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleReject(service.id)}
                                className="bg-yellow-500 text-white px-3 py-1 rounded text-xs hover:bg-yellow-600 transition"
                              >
                                Reject
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => handleDelete(service.id)}
                            className="bg-red-500 text-white px-3 py-1 rounded text-xs hover:bg-red-600 transition"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ManageServices;

