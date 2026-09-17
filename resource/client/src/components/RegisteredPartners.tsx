import { useEffect, useState } from "react";
import axios from "axios";
import BASE_URL from "../api/api";

interface Partner {
  _id: string;
  tab: string;
  investmentType?: string[];
  sector?: string;
  name: string;
  companyName: string;
  email: string;
  phone: string;
  officePhone?: string;
  whatsapp?: string;
  enquiry?: string;
  motto?: string;
  specialPackages?: string;
  messages?: string;
  coBrand?: string;
  effectiveDate?: string;
  expiryDate?: string;
  idOrPassport?: string;
  license?: string;
  tradeRegistration?: string;
  businessProposal?: string;
  businessPlan?: string;
  logo?: string;
  mouSigned?: string;
  contractSigned?: string;
  createdAt: string;
}

export default function RegisteredPartners() {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    const fetchPartners = async () => {
      try {
        const res = await axios.get(`${BASE_URL}/partner-requests`);
        setPartners(res.data);
      } catch (err) {
        console.error("❌ Fetch partners error:", err);
        alert("Failed to fetch partners.");
      } finally {
        setLoading(false);
      }
    };
    fetchPartners();
  }, []);

  const handleSendEmail = async () => {
    if (!subject || !message) {
      alert("Please provide both subject and message.");
      return;
    }

    try {
      setSending(true);
      await axios.post(`${BASE_URL}/partner-notify`, { subject, message });
      alert("✅ Emails sent successfully to all partners!");
      setSubject("");
      setMessage("");
    } catch (err) {
      console.error("❌ Sending emails error:", err);
      alert("Failed to send emails. Check the server logs.");
    } finally {
      setSending(false);
    }
  };

  if (loading) return <p className="text-center mt-10 text-lg">Loading partners...</p>;

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h2 className="text-3xl font-bold text-center mb-8 text-[#1c2b21]">
        Registered Partners
      </h2>

      {/* Send Email Section */}
      <div className="bg-[#f9fafb] p-4 sm:p-6 rounded-lg shadow mb-8">
        <h3 className="text-xl font-semibold mb-3">Send Email to All Partners</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <input
            type="text"
            placeholder="Email Subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="border border-gray-300 rounded px-3 py-2 w-full"
          />
          <textarea
            placeholder="Message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="border border-gray-300 rounded px-3 py-2 w-full"
            rows={2}
          />
        </div>
        <button
          onClick={handleSendEmail}
          disabled={sending}
          className={`bg-[#1c2b21] text-white px-6 py-2 rounded hover:bg-[#0f1a14] transition ${
            sending ? "opacity-60 cursor-not-allowed" : ""
          }`}
        >
          {sending ? "Sending..." : "Send to All Partners"}
        </button>
      </div>

      {/* Partners Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white shadow-md rounded-lg overflow-hidden">
          <thead className="bg-[#1c2b21] text-white">
            <tr>
              <th className="py-3 px-4 text-left text-sm font-semibold">Name</th>
              <th className="py-3 px-4 text-left text-sm font-semibold">Company</th>
              <th className="py-3 px-4 text-left text-sm font-semibold">Type</th>
              <th className="py-3 px-4 text-left text-sm font-semibold">Sector</th>
              <th className="py-3 px-4 text-left text-sm font-semibold">Email</th>
              <th className="py-3 px-4 text-left text-sm font-semibold">Phone</th>
              <th className="py-3 px-4 text-left text-sm font-semibold">WhatsApp</th>
              <th className="py-3 px-4 text-left text-sm font-semibold">Attachments</th>
            </tr>
          </thead>
          <tbody>
            {partners.map((p) => (
              <tr key={p._id} className="border-b hover:bg-gray-50 transition">
                <td className="py-2 px-4 text-sm">{p.name}</td>
                <td className="py-2 px-4 text-sm">{p.companyName}</td>
                <td className="py-2 px-4 text-sm">{p.tab}</td>
                <td className="py-2 px-4 text-sm">{p.sector || "-"}</td>
                <td className="py-2 px-4 text-sm">{p.email}</td>
                <td className="py-2 px-4 text-sm">{p.phone}</td>
                <td className="py-2 px-4 text-sm">{p.whatsapp || "-"}</td>
                <td className="py-2 px-4 text-sm space-y-1">
                  {p.idOrPassport && <a href={p.idOrPassport} target="_blank" className="text-blue-600 underline block">ID / Passport</a>}
                  {p.license && <a href={p.license} target="_blank" className="text-blue-600 underline block">License</a>}
                  {p.tradeRegistration && <a href={p.tradeRegistration} target="_blank" className="text-blue-600 underline block">Trade Reg.</a>}
                  {p.businessProposal && <a href={p.businessProposal} target="_blank" className="text-blue-600 underline block">Proposal</a>}
                  {p.businessPlan && <a href={p.businessPlan} target="_blank" className="text-blue-600 underline block">Business Plan</a>}
                  {p.logo && <a href={p.logo} target="_blank" className="text-blue-600 underline block">Logo</a>}
                  {p.mouSigned && <a href={p.mouSigned} target="_blank" className="text-blue-600 underline block">MOU</a>}
                  {p.contractSigned && <a href={p.contractSigned} target="_blank" className="text-blue-600 underline block">Contract</a>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
