import { useEffect, useState } from "react";
import BASE_URL from "../../../api/api";

// Define User type
interface User {
  _id: string;
  fullName?: string;
  firstName?: string;
  email: string;
  membership?: string;
}

const ManageMemberships = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loadingUserId, setLoadingUserId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Fetch all users with auth token
  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem("token");

      const res = await fetch(`${BASE_URL}/users`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error("Failed to fetch users");
      const data = await res.json();
      setUsers(data);
      setError(null);
    } catch (error) {
      console.error("Error fetching users:", error);
      setError("Failed to fetch users.");
    }
  };

  // Update membership level with auth token
  const updateMembership = async (id: string, newLevel: string) => {
    try {
      setLoadingUserId(id);
      setError(null);

      const token = localStorage.getItem("token");

      const res = await fetch(`${BASE_URL}/users/${id}/membership`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ membership: newLevel }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.msg || "Failed to update membership");
      }

      await fetchUsers(); // Refresh users after update
    } catch (error: any) {
      console.error("Error updating membership:", error);
      setError(error.message || "Error updating membership");
    } finally {
      setLoadingUserId(null);
    }
  };

  // Fetch users on component mount
  useEffect(() => {
    fetchUsers();
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Manage Memberships</h1>

      {error && (
        <div className="mb-4 p-2 bg-red-200 text-red-800 rounded">{error}</div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full border border-gray-300 rounded-md">
          <thead>
            <tr className="bg-gray-100 text-left">
              <th className="p-3 border">Name</th>
              <th className="p-3 border">Email</th>
              <th className="p-3 border">Membership</th>
              <th className="p-3 border">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.length > 0 ? (
              users.map((user) => (
                <tr key={user._id} className="border-t hover:bg-gray-50">
                  <td className="p-3 border">
                    {user.fullName || user.firstName || "Unknown"}
                  </td>
                  <td className="p-3 border">{user.email}</td>
                  <td className="p-3 border capitalize">
                    {user.membership || "none"}
                  </td>
                  <td className="p-3 border">
                    {["basic", "premium", "enterprise"].map((level) => (
                      <button
                        key={level}
                        onClick={() => updateMembership(user._id, level)}
                        disabled={loadingUserId === user._id}
                        className={`mr-2 mb-1 px-3 py-1 rounded text-sm ${
                          loadingUserId === user._id
                            ? "bg-gray-400 text-gray-700 cursor-not-allowed"
                            : "bg-[#1c2b21] text-white hover:bg-[#2e4033]"
                        }`}
                      >
                        {loadingUserId === user._id ? "Updating..." : level}
                      </button>
                    ))}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="p-4 text-center text-gray-500">
                  No users found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ManageMemberships;



