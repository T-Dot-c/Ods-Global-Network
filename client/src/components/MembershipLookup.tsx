// src/components/MembershipLookup.tsx
import React, { useState } from "react";
import BASE_URL from "../api/api";

interface MembershipData {
  name: string;
  email: string;
  phone: string;
  whatsapp: string;
  telegram: string;
  region: string;
  userType: string;
  membershipId: string;
  roles: string[];
  gifterTier?: string;
  influencerTier?: string;
  influencerRoles?: string[];
  brandAmbassadorTier?: string;
  brandAmbassadorRoles?: string[];
  serviceProviderTier?: string;
  volunteerTier?: string;
  message?: string;
  status?: string;
}

const MembershipLookup: React.FC = () => {
  const [membershipId, setMembershipId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [member, setMember] = useState<MembershipData | null>(null);

  const handleLookup = async () => {
    if (!membershipId.trim()) {
      setError("Please enter a membership ID.");
      return;
    }
    setLoading(true);
    setError("");
    setMember(null);

    try {
      const res = await fetch(`${BASE_URL}/support-community/${membershipId}`);
      if (!res.ok) throw new Error("Membership not found.");

      const json: { success: boolean; data: MembershipData } = await res.json();
      setMember(json.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-indigo-50 to-purple-100 px-4">
      <div className="bg-white shadow-lg rounded-2xl p-6 w-full max-w-md">
        <h1 className="text-2xl font-bold text-center text-indigo-700 mb-4">
          Membership Lookup
        </h1>

        <input
          type="text"
          placeholder="Enter Membership ID"
          value={membershipId}
          onChange={(e) => setMembershipId(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-4 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />

        <button
          onClick={handleLookup}
          disabled={loading}
          className={`w-full py-2 rounded-lg font-medium text-white ${
            loading ? "bg-indigo-400 cursor-not-allowed" : "bg-indigo-600 hover:bg-indigo-700"
          }`}
        >
          {loading ? "Searching..." : "Search"}
        </button>

        {error && <p className="text-red-500 text-sm mt-3 text-center">{error}</p>}

        {member && (
          <div className="mt-6 border-t pt-4 space-y-2">
            <h2 className="text-lg font-semibold text-gray-700 mb-2">Member Details</h2>
            <div className="space-y-1 text-gray-600">
              <p><span className="font-medium">Name:</span> {member.name}</p>
              <p><span className="font-medium">Email:</span> {member.email}</p>
              <p><span className="font-medium">Phone:</span> {member.phone}</p>
              <p><span className="font-medium">WhatsApp:</span> {member.whatsapp}</p>
              <p><span className="font-medium">Telegram:</span> {member.telegram}</p>
              <p><span className="font-medium">Region:</span> {member.region}</p>
              <p><span className="font-medium">User Type:</span> {member.userType}</p>
              <p><span className="font-medium">Membership ID:</span> {member.membershipId}</p>
              <p><span className="font-medium">Roles:</span> {member.roles.join(", ")}</p>
              {member.roles.includes("Gifter") && <p><span className="font-medium">Gifter Tier:</span> {member.gifterTier}</p>}
              {member.roles.includes("Influencer") && (
                <>
                  <p><span className="font-medium">Influencer Tier:</span> {member.influencerTier}</p>
                  <p><span className="font-medium">Influencer Roles:</span> {member.influencerRoles?.join(", ")}</p>
                </>
              )}
              {member.roles.includes("Brand Ambassador") && (
                <>
                  <p><span className="font-medium">Brand Ambassador Tier:</span> {member.brandAmbassadorTier}</p>
                  <p><span className="font-medium">Brand Ambassador Roles:</span> {member.brandAmbassadorRoles?.join(", ")}</p>
                </>
              )}
              {member.roles.includes("Service Provider") && <p><span className="font-medium">Service Provider Tier:</span> {member.serviceProviderTier}</p>}
              {member.roles.includes("Volunteer") && <p><span className="font-medium">Volunteer Tier:</span> {member.volunteerTier}</p>}
              {member.message && <p><span className="font-medium">Message:</span> {member.message}</p>}
              {member.status && <p><span className="font-medium">Status:</span> {member.status}</p>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MembershipLookup;

