import { useEffect, useState } from "react";
import axios from "axios";
import BASE_URL from "../../../api/api";

type DiplomaticMember = {
  id: string | number;
  name: string;
  email: string;
  phone?: string;
  alternativePhone?: string;
  whatsapp?: string;
  telegram?: string;
  institution?: string;
  institutionName?: string;
  suggestion?: string;
  createdAt?: string;
};

const DiplomaticCommunityList = () => {
  const [members, setMembers] = useState<DiplomaticMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Email form state
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(`${BASE_URL}/diplomatic-community`);
      if (response.data.success) {
        setMembers(response.data.data || []);
      } else {
        setError("Failed to fetch members");
      }
    } catch (err: any) {
      console.error("Diplomatic community fetch error:", err);
      setError(err.response?.data?.message || "Failed to load members");
    } finally {
      setLoading(false);
    }
  };

  const handleSendEmail = async () => {
    if (!subject || !message) {
      alert("Subject and message are required.");
      return;
    }
    try {
      setSending(true);
      // Note: You may need to create this endpoint if it doesn't exist
      await axios.post(`${BASE_URL}/diplomatic-community/notify`, { 
        subject, 
        message 
      });
      alert("✅ Emails sent successfully!");
      setSubject("");
      setMessage("");
    } catch (err: any) {
      console.error("Send email error:", err);
      alert("❌ Failed to send emails. " + (err.response?.data?.message || ""));
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <p className="text-center mt-10 text-lg">Loading members...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <p className="text-center mt-10 text-lg text-red-600">{error}</p>
        <button
          onClick={fetchMembers}
          className="mt-4 mx-auto block bg-[#0f285b] text-white px-4 py-2 rounded hover:bg-[#091838] transition"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h2 className="text-3xl font-bold mb-6 text-center text-[#0f285b]">
        Africa Union, Embassy & Diplomatic Community Members
      </h2>

      {/* Send Email Form */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <h3 className="text-xl font-semibold mb-4">Send Email to All Members</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
          <input
            type="text"
            placeholder="Subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="col-span-2 p-2 border border-gray-300 rounded w-full focus:outline-none focus:ring-2 focus:ring-[#be9b49]"
          />
          <button
            onClick={handleSendEmail}
            disabled={sending}
            className="bg-[#0f285b] text-white px-4 py-2 rounded hover:bg-[#091838] transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {sending ? "Sending..." : "Send Email"}
          </button>
        </div>
        <textarea
          rows={4}
          placeholder="Message..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded resize-none focus:outline-none focus:ring-2 focus:ring-[#be9b49]"
        />
      </div>

      {/* Members Table */}
      <div className="overflow-x-auto bg-white rounded-lg shadow-md">
        <table className="min-w-full border-collapse">
          <thead className="bg-[#0f285b] text-white">
            <tr>
              {[
                "#",
                "Name",
                "Email",
                "Phone",
                "Alt. Phone",
                "WhatsApp",
                "Telegram",
                "Institution",
                "Institution Name",
                "Suggestion",
                "Joined On",
              ].map((title) => (
                <th key={title} className="py-3 px-4 text-left text-sm font-semibold">
                  {title}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {members.length === 0 ? (
              <tr>
                <td colSpan={11} className="py-8 text-center text-gray-500">
                  No members found.
                </td>
              </tr>
            ) : (
              members.map((member, idx) => (
                <tr key={member.id || idx} className="border-b hover:bg-gray-50 transition">
                  <td className="py-2 px-4">{idx + 1}</td>
                  <td className="py-2 px-4 font-medium">{member.name}</td>
                  <td className="py-2 px-4">
                    <a
                      href={`mailto:${member.email}`}
                      className="text-blue-600 underline hover:text-blue-800"
                    >
                      {member.email}
                    </a>
                  </td>
                  <td className="py-2 px-4">{member.phone || "-"}</td>
                  <td className="py-2 px-4">{member.alternativePhone || "-"}</td>
                  <td className="py-2 px-4">{member.whatsapp || "-"}</td>
                  <td className="py-2 px-4">{member.telegram || "-"}</td>
                  <td className="py-2 px-4">{member.institution || "-"}</td>
                  <td className="py-2 px-4">{member.institutionName || "-"}</td>
                  <td className="py-2 px-4 max-w-xs">
                    {member.suggestion ? (
                      <div className="truncate" title={member.suggestion}>
                        {member.suggestion.length > 50
                          ? `${member.suggestion.substring(0, 50)}...`
                          : member.suggestion}
                      </div>
                    ) : (
                      "-"
                    )}
                  </td>
                  <td className="py-2 px-4">
                    {member.createdAt
                      ? new Date(member.createdAt).toLocaleDateString()
                      : "-"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Summary */}
      <div className="mt-6 text-center text-gray-600">
        <p>Total Members: <span className="font-semibold text-[#0f285b]">{members.length}</span></p>
      </div>
    </div>
  );
};

export default DiplomaticCommunityList;



