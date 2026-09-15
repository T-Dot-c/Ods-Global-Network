import { useEffect, useState } from "react";
import axios from "axios";
import BASE_URL from "../../../api/api";

type DiasporaMember = {
  id: string | number;
  name: string;
  email: string;
  phone?: string;
  country?: string;
  profession?: string;
  createdAt?: string;
  plan?: string | null;
  price?: number | null;
  cadence?: string | null;
};

const DiasporaList = () => {
  const [members, setMembers] = useState<DiasporaMember[]>([]);
  const [loading, setLoading] = useState(true);

  // Email form state
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    // Fetch all diaspora members (backend exposes GET /api/diaspora-members)
    axios.get(`${BASE_URL}/diaspora-members`)
      .then((res) => setMembers(res.data))
      .catch((err) => console.error("Diaspora fetch error:", err))
      .finally(() => setLoading(false));
  }, []);

  const handleSendEmail = async () => {
    if (!subject || !message) return alert("Subject and message are required.");
    try {
      setSending(true);
      await axios.post(`${BASE_URL}/diaspora-members/notify`, { subject, message });
      alert("✅ Emails sent successfully!");
      setSubject("");
      setMessage("");
    } catch (err) {
      console.error("Send email error:", err);
      alert("❌ Failed to send emails.");
    } finally {
      setSending(false);
    }
  };

  if (loading) return <p className="text-center mt-10 text-lg">Loading members...</p>;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h2 className="text-3xl font-bold mb-6 text-center text-[#0f285b]">
        Diaspora Members
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
            className="col-span-2 p-2 border border-gray-300 rounded w-full"
          />
          <button
            onClick={handleSendEmail}
            disabled={sending}
            className="bg-[#0f285b] text-white px-4 py-2 rounded hover:bg-[#091838] transition"
          >
            {sending ? "Sending..." : "Send Email"}
          </button>
        </div>
        <textarea
          rows={4}
          placeholder="Message..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded resize-none"
        />
      </div>

      {/* Members Table with basic subscription info */}
      <div className="overflow-x-auto bg-white rounded-lg shadow-md">
        <table className="min-w-full border-collapse">
          <thead className="bg-[#0f285b] text-white">
            <tr>
              {["#", "Name", "Email", "Phone", "Country", "Profession", "Subscription", "Price", "Joined On"].map((title) => (
                <th key={title} className="py-3 px-4 text-left text-sm font-semibold">{title}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {members.map((member, idx) => (
              <tr key={member.id || idx} className="border-b hover:bg-gray-50 transition">
                <td className="py-2 px-4">{idx + 1}</td>
                <td className="py-2 px-4">{member.name}</td>
                <td className="py-2 px-4">
                  <a href={`mailto:${member.email}`} className="text-blue-600 underline">{member.email}</a>
                </td>
                <td className="py-2 px-4">{member.phone || "-"}</td>
                <td className="py-2 px-4">{member.country || "-"}</td>
                <td className="py-2 px-4">{member.profession || "-"}</td>
                <td className="py-2 px-4 capitalize">
                  {member.plan
                    ? `${member.plan} (${member.cadence || "periodic"})`
                    : "—"}
                </td>
                <td className="py-2 px-4">
                  {member.price != null ? `$${member.price}` : "—"}
                </td>
                <td className="py-2 px-4">
                  {member.createdAt ? new Date(member.createdAt).toLocaleDateString() : "-"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DiasporaList;



