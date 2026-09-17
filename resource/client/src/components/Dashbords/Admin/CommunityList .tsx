import { useEffect, useState } from "react";
import BASE_URL from "../../../api/api";


type Member = {
  id?: number;
  _id?: string;
  name: string;
  email: string;
  phone: string;
  location: string;
  specialization: string;
  memberType: string;
  cvUrl?: string;
  credentialsUrl?: string;
  certificateNumber?: string;
  certificateIssuedAt?: string;
  subscriptionPlan?: string;
  subscriptionPrice?: string;
  subscriptionCadence?: string;
  renewalHistory?: unknown;
  organization?: string;
  roleTitle?: string;
  notes?: string;
  isRenewal?: string;
  paymentStatus?: string;
  paymentDate?: string;
};

type TabType = "professional" | "premium";

const CommunityList = () => {
  const [activeTab, setActiveTab] = useState<TabType>("professional");
  const [professionalMembers, setProfessionalMembers] = useState<Member[]>([]);
  const [premiumMembers, setPremiumMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        setLoading(true);
        const [communityRes, premiumRes] = await Promise.all([
          fetch(`${BASE_URL}/community`),
          fetch(`${BASE_URL}/premium-community`),
        ]);

        const communityData = communityRes.ok ? await communityRes.json() : [];
        const premiumData = premiumRes.ok ? await premiumRes.json() : [];

        // Filter out premium members from professional community
        const professionalData = Array.isArray(communityData)
          ? communityData.filter(
              (member: any) =>
                member.memberType !== "ODS Global Network-premium" &&
                !member.subscriptionPlan
            )
          : [];

        const normalizedPremium: Member[] = Array.isArray(premiumData)
          ? premiumData.map((member: any) => ({
              ...member,
              memberType: "ODS Global Network-premium",
              location:
                member.organization ||
                member.roleTitle ||
                member.notes ||
                member.phone ||
                "—",
              specialization:
                member.roleTitle || member.notes || "Premium Concierge Member",
              cvUrl: undefined,
              credentialsUrl: undefined,
            }))
          : [];

        setProfessionalMembers(professionalData);
        setPremiumMembers(normalizedPremium);
      } catch (err) {
        console.error("Failed to fetch members:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchMembers();
  }, []);

  const renderProfessionalTable = () => (
    <div className="overflow-x-auto">
      <div className="mb-4 flex items-center gap-2">
        <div className="h-1 w-12 bg-[#1c2b21]"></div>
        <h3 className="text-lg font-semibold text-[#1c2b21]">
          Professionals Community ({professionalMembers.length})
        </h3>
      </div>
      <table className="min-w-full table-auto border border-gray-300 text-sm">
        <thead className="bg-[#1c2b21] text-white">
          <tr>
            <th className="border p-2">#</th>
            <th className="border p-2">Certificate #</th>
            <th className="border p-2">Issued On</th>
            <th className="border p-2">Name</th>
            <th className="border p-2">Email</th>
            <th className="border p-2">Phone</th>
            <th className="border p-2">Location</th>
            <th className="border p-2">Specialization</th>
            <th className="border p-2">Member Type</th>
            <th className="border p-2">CV</th>
            <th className="border p-2">Credentials</th>
          </tr>
        </thead>
        <tbody>
          {professionalMembers.length === 0 ? (
            <tr>
              <td colSpan={11} className="border p-4 text-center text-gray-500">
                No professional community members found
              </td>
            </tr>
          ) : (
            professionalMembers.map((member, index) => {
              const issuedAt = member.certificateIssuedAt
                ? new Date(member.certificateIssuedAt).toLocaleDateString()
                : "—";

              return (
                <tr key={member._id || member.id || index} className="hover:bg-gray-50">
                  <td className="border p-2 text-center">{index + 1}</td>
                  <td className="border p-2 text-center font-semibold text-[#1c2b21]">
                    {member.certificateNumber || "Pending"}
                  </td>
                  <td className="border p-2 text-center">{issuedAt}</td>
                  <td className="border p-2">{member.name}</td>
                  <td className="border p-2">{member.email}</td>
                  <td className="border p-2">{member.phone || "—"}</td>
                  <td className="border p-2">{member.location || "—"}</td>
                  <td className="border p-2">{member.specialization || "—"}</td>
                  <td className="border p-2">
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                      {member.memberType || "Professional"}
                    </span>
                  </td>
                  <td className="border p-2 text-blue-600">
                    {member.cvUrl ? (
                      <a
                        href={member.cvUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:underline"
                      >
                        View CV
                      </a>
                    ) : (
                      "N/A"
                    )}
                  </td>
                  <td className="border p-2 text-blue-600">
                    {member.credentialsUrl ? (
                      <a
                        href={member.credentialsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:underline"
                      >
                        View Credentials
                      </a>
                    ) : (
                      "N/A"
                    )}
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );

  const renderPremiumTable = () => (
    <div className="overflow-x-auto">
      <div className="mb-4 flex items-center gap-2">
        <div className="h-1 w-12 bg-[#D4AF37]"></div>
        <h3 className="text-lg font-semibold text-[#1c2b21]">
          ODS Global Network Premium Community ({premiumMembers.length})
        </h3>
      </div>
      <table className="min-w-full table-auto border border-gray-300 text-sm">
        <thead className="bg-[#D4AF37] text-[#1c2b21]">
          <tr>
            <th className="border p-2">#</th>
            <th className="border p-2">Certificate #</th>
            <th className="border p-2">Issued On</th>
            <th className="border p-2">Name</th>
            <th className="border p-2">Email</th>
            <th className="border p-2">Phone</th>
            <th className="border p-2">Organization</th>
            <th className="border p-2">Role</th>
            <th className="border p-2">Subscription Plan</th>
            <th className="border p-2">Price</th>
            <th className="border p-2">Payment Status</th>
            <th className="border p-2">Payment Date</th>
          </tr>
        </thead>
        <tbody>
          {premiumMembers.length === 0 ? (
            <tr>
              <td colSpan={12} className="border p-4 text-center text-gray-500">
                No premium members found
              </td>
            </tr>
          ) : (
            premiumMembers.map((member, index) => {
              const issuedAt = member.certificateIssuedAt
                ? new Date(member.certificateIssuedAt).toLocaleDateString()
                : "—";
              const paymentDate = member.paymentDate
                ? new Date(member.paymentDate).toLocaleDateString()
                : "—";

              const subscriptionInfo = member.subscriptionPlan
                ? `${member.subscriptionPlan} (${member.subscriptionCadence || "N/A"})`
                : "Not Set";

              const paymentStatusColor =
                member.paymentStatus === "paid"
                  ? "bg-green-100 text-green-800"
                  : member.paymentStatus === "failed"
                    ? "bg-red-100 text-red-800"
                    : "bg-yellow-100 text-yellow-800";

              return (
                <tr key={member._id || member.id || index} className="hover:bg-gray-50">
                  <td className="border p-2 text-center">{index + 1}</td>
                  <td className="border p-2 text-center font-semibold text-[#D4AF37]">
                    {member.certificateNumber || "Pending"}
                  </td>
                  <td className="border p-2 text-center">{issuedAt}</td>
                  <td className="border p-2 font-medium">{member.name}</td>
                  <td className="border p-2">{member.email}</td>
                  <td className="border p-2">{member.phone || "—"}</td>
                  <td className="border p-2">{member.organization || "—"}</td>
                  <td className="border p-2">{member.roleTitle || "—"}</td>
                  <td className="border p-2">
                    <span className="text-xs">{subscriptionInfo}</span>
                  </td>
                  <td className="border p-2">
                    {member.subscriptionPrice
                      ? `${parseFloat(member.subscriptionPrice).toLocaleString()} ETB`
                      : "—"}
                  </td>
                  <td className="border p-2">
                    <span
                      className={`px-2 py-1 rounded text-xs font-semibold ${paymentStatusColor}`}
                    >
                      {member.paymentStatus?.toUpperCase() || "PENDING"}
                    </span>
                  </td>
                  <td className="border p-2 text-center">{paymentDate}</td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="p-4">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-[#1c2b21] mb-2">Community Members</h2>
        <p className="text-gray-600">
          Manage Professional Community and ODS Global Network Premium memberships
        </p>
      </div>

      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <div className="flex gap-4">
          <button
            onClick={() => setActiveTab("professional")}
            className={`px-6 py-3 font-semibold transition-colors ${
              activeTab === "professional"
                ? "border-b-2 border-[#1c2b21] text-[#1c2b21]"
                : "text-gray-500 hover:text-[#1c2b21]"
            }`}
          >
            Professionals Community ({professionalMembers.length})
          </button>
          <button
            onClick={() => setActiveTab("premium")}
            className={`px-6 py-3 font-semibold transition-colors ${
              activeTab === "premium"
                ? "border-b-2 border-[#D4AF37] text-[#1c2b21]"
                : "text-gray-500 hover:text-[#1c2b21]"
            }`}
          >
            ODS Global Network Premium ({premiumMembers.length})
          </button>
        </div>
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1c2b21] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading members...</p>
        </div>
      ) : (
        <>
          {activeTab === "professional" && renderProfessionalTable()}
          {activeTab === "premium" && renderPremiumTable()}
        </>
      )}
    </div>
  );
};

export default CommunityList;
