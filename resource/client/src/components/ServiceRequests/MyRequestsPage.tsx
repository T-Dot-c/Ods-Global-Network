import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getMyServiceRequests } from "../../api/serviceRequests";

interface ServiceRequestRow {
  id: number;
  title: string;
  location: string;
  status: string;
  created_at: string;
}

const MyRequestsPage = () => {
  const [rows, setRows] = useState<ServiceRequestRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getMyServiceRequests();
        setRows(Array.isArray(data) ? data : []);
      } catch (err: any) {
        setError(err?.response?.data?.msg || "Failed to load your requests.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return <div className="p-6">Loading requests...</div>;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-[#1c2b21]">My Requests</h1>
        <Link to="/request-service" className="text-sm bg-[#1c2b21] text-[#D4AF37] px-3 py-2 rounded">
          New Request
        </Link>
      </div>

      {error && <p className="text-red-600 mb-3">{error}</p>}
      {!rows.length ? (
        <p className="text-gray-600">You have no service requests yet.</p>
      ) : (
        <div className="space-y-3">
          {rows.map((row) => (
            <div key={row.id} className="bg-white border rounded-lg p-4 flex items-center justify-between">
              <div>
                <h3 className="font-semibold">{row.title}</h3>
                <p className="text-sm text-gray-600">
                  {row.location} - {row.status}
                </p>
              </div>
              <Link to={`/requests/${row.id}`} className="text-[#1c2b21] font-semibold">
                View Proposals
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyRequestsPage;
