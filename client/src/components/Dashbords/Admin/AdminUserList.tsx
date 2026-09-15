import { useEffect, useState } from "react";
import BASE_URL from "../../../api/api";

type User = {
  id: string;
  fullName: string;
  email: string;
  role: string;
  membership: string;
  membershipId: string;
  companyName?: string;
  serviceType?: string;
  phone?: string;
  whatsapp?: string;
  telegram?: string;
  city?: string;
  location?: string;
  tin?: string;
  referralCode?: string;
  referralClicks?: number;

  // Files / Docs
  license?: string;
  tradeRegistration?: string;
  idFile?: string;
  video?: string;
  priceList?: string;

  // JSON fields
  branches?: string;
  banks?: string;
  businessStatus?: string;
  servicePhotos?: string;

  // Tokens
  resetToken?: string;
  tokenExpire?: number;

  // Dates
  createdAt?: string;
  updatedAt?: string;
};

const AdminUserList = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [role, setRole] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      setError("");

      const token = localStorage.getItem("token");

      try {
        const url = `${BASE_URL}/auth/all-users${role ? `?role=${role}` : ""}`;
        const res = await fetch(url, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          throw new Error(`Error fetching users: ${res.statusText}`);
        }

        const data = await res.json();
        setUsers(Array.isArray(data) ? data : []);
      } catch (err: any) {
        console.error("Error fetching users:", err);
        setError(err.message || "Something went wrong while fetching users.");
        setUsers([]);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [role]);

  const safeJSON = (str?: string) => {
    if (!str) return [];
    try {
      return JSON.parse(str);
    } catch {
      return [];
    }
  };

  return (
    <div className="p-2 max-w-full">
      <h2 className="text-lg font-bold mb-2">User Management</h2>

      {/* Role Filter */}
      <div className="mb-2">
        <label className="font-semibold mr-2 text-sm">Filter by Role:</label>
        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="border p-1 rounded text-sm"
        >
          <option value="">All</option>
          <option value="individual">Individual</option>
          <option value="provider">Provider</option>
          <option value="corporate">Corporate</option>
          <option value="diaspora">Diaspora</option>
          <option value="super_admin">Super Admin</option>
          <option value="customer_support_admin">Support Admin</option>
          <option value="marketing_admin">Marketing Admin</option>
        </select>
      </div>

      {/* Table */}
      {loading && <p className="text-sm">Loading users...</p>}
      {error && <p className="text-red-500 text-sm font-semibold">{error}</p>}
      {!loading && !error && users.length === 0 && <p className="text-sm">No users found.</p>}

      {!loading && !error && users.length > 0 && (
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse border text-[11px]">
            <thead>
              <tr className="bg-gray-100">
                <th className="border p-1">#</th>
                <th className="border p-1">Name / Email</th>
                <th className="border p-1">Role</th>
                <th className="border p-1">Membership</th>
                <th className="border p-1">Company / Service</th>
                <th className="border p-1">Contacts</th>
                <th className="border p-1">Location</th>
                <th className="border p-1">Business</th>
                <th className="border p-1">Files</th>
                <th className="border p-1">Referral</th>
                <th className="border p-1">Dates</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user, idx) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="border p-1">{idx + 1}</td>
                  <td className="border p-1">
                    <div className="font-semibold">{user.fullName}</div>
                    <div className="text-gray-600 text-[10px]">{user.email}</div>
                  </td>
                  <td className="border p-1 capitalize">{user.role}</td>
                  <td className="border p-1">
                    {user.membership} <br />#{user.membershipId}
                  </td>
                  <td className="border p-1">
                    {user.companyName || "-"} {user.serviceType ? `(${user.serviceType})` : ""}
                  </td>
                  <td className="border p-1">
                    {user.phone || "-"} <br />
                    {user.whatsapp || "-"} <br />
                    {user.telegram || "-"}
                  </td>
                  <td className="border p-1">
                    {user.city || "-"} <br />
                    {user.location || "-"} <br />
                    {user.tin ? `TIN: ${user.tin}` : ""}
                  </td>
                  <td className="border p-1">
                    {safeJSON(user.businessStatus).join(", ") || "-"} <br />
                    Branches: {safeJSON(user.branches).length} <br />
                    Banks: {safeJSON(user.banks).length}
                  </td>
                  <td className="border p-1 space-y-1">
                    {user.license && (
                      <a href={user.license} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline block">
                        License
                      </a>
                    )}
                    {user.tradeRegistration && (
                      <a href={user.tradeRegistration} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline block">
                        Trade Reg
                      </a>
                    )}
                    {user.idFile && (
                      <a href={user.idFile} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline block">
                        ID File
                      </a>
                    )}
                    {user.priceList && (
                      <a href={user.priceList} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline block">
                        Price List
                      </a>
                    )}
                    {user.video && (
                      <video controls className="w-24 h-16">
                        <source src={user.video} type="video/mp4" />
                      </video>
                    )}
                    {safeJSON(user.servicePhotos).map((url: string, i: number) => (
                      <img key={`${user.id}-photo-${i}`} src={url} alt="service" className="w-10 h-10 inline-block mr-1 object-cover" />
                    ))}
                  </td>
                  <td className="border p-1">
                    {user.referralCode || "-"} <br />
                    ({user.referralClicks || 0} clicks)
                  </td>
                  <td className="border p-1 text-[10px]">
                    Created: {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "-"} <br />
                    Updated: {user.updatedAt ? new Date(user.updatedAt).toLocaleDateString() : "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminUserList;




