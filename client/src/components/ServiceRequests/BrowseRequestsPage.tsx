import { type FormEvent, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  acceptServiceRequest,
  getOpenServiceRequests,
  submitServiceProposal,
} from "../../api/serviceRequests";

interface OpenRequest {
  id: number;
  title: string;
  description: string;
  location: string;
  budget: number | null;
  preferred_date?: string;
  status?: string;
  service_id?: number | null;
  request_type?: "service" | "gift";
}

const BrowseRequestsPage = () => {
  const [requests, setRequests] = useState<OpenRequest[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [price, setPrice] = useState("");
  const [message, setMessage] = useState("");
  const [acceptingId, setAcceptingId] = useState<number | null>(null);
  const [acceptMessage, setAcceptMessage] = useState("");
  const [submittingAccept, setSubmittingAccept] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = async () => {
    try {
      const data = await getOpenServiceRequests();
      setRequests(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err?.response?.data?.msg || "Failed to load open requests.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const submitProposal = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedId) return;
    try {
      await submitServiceProposal(selectedId, { price: Number(price), message });
      setSelectedId(null);
      setPrice("");
      setMessage("");
      await load();
    } catch (err: any) {
      setError(err?.response?.data?.msg || "Failed to submit proposal.");
    }
  };

  const acceptRequest = async (e: FormEvent) => {
    e.preventDefault();
    if (!acceptingId) return;
    setSubmittingAccept(true);
    setError("");
    try {
      await acceptServiceRequest(acceptingId, {
        acceptance_message: acceptMessage.trim() || undefined,
      });
      setAcceptingId(null);
      setAcceptMessage("");
      setNotice("Request accepted. The requester has been notified.");
      await load();
    } catch (err: any) {
      setError(err?.response?.data?.msg || "Failed to accept request.");
    } finally {
      setSubmittingAccept(false);
    }
  };

  if (loading) return <div className="p-6">Loading open requests...</div>;

  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="mb-4">
        <Link to="/provider-dashboard" className="text-sm font-medium text-[#0f285b] hover:underline">
          ← Back to Provider Dashboard
        </Link>
      </div>
      <h1 className="text-2xl font-bold text-[#0f285b] mb-4">Browse Service Requests</h1>
      {error && <p className="text-red-600 mb-3">{error}</p>}
      {notice && <p className="text-green-700 mb-3">{notice}</p>}

      {requests.length === 0 ? (
        <p className="text-gray-600">There are no open service requests right now.</p>
      ) : (
        <div className="space-y-3">
          {requests.map((req) => {
            const isPending = req.status === "pending";
            return (
              <div key={req.id} className="bg-white border rounded-lg p-4">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="font-semibold">{req.title}</h3>
                  <span className="shrink-0 rounded-full bg-[#be9b49]/15 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[#0f285b]">
                    {isPending ? "Requested Service" : req.status || "Open"}
                  </span>
                </div>
                <p className="text-sm text-gray-700 mt-1">{req.description}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {req.location} {req.budget ? `- Budget ETB ${req.budget}` : ""}
                </p>

                <div className="mt-3 flex flex-wrap gap-2">
                  {isPending ? (
                    <button
                      className="bg-[#0f285b] text-[#be9b49] px-3 py-2 rounded text-sm font-semibold hover:bg-[#16301b] transition"
                      onClick={() => {
                        setAcceptingId(req.id);
                        setAcceptMessage("");
                        setError("");
                      }}
                    >
                      Accept Request
                    </button>
                  ) : (
                    <button
                      className="bg-[#0f285b] text-[#be9b49] px-3 py-2 rounded text-sm font-semibold hover:bg-[#16301b] transition"
                      onClick={() => setSelectedId(req.id)}
                    >
                      Submit Proposal
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {selectedId && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4">
          <form onSubmit={submitProposal} className="bg-white rounded-xl p-5 w-full max-w-md space-y-3">
            <h2 className="text-lg font-semibold">Submit Proposal</h2>
            <input
              type="number"
              min="0"
              step="0.01"
              className="w-full border rounded-lg px-3 py-2"
              placeholder="Your price"
              required
              value={price}
              onChange={(e) => setPrice(e.target.value)}
            />
            <textarea
              className="w-full border rounded-lg px-3 py-2 min-h-[100px]"
              placeholder="Proposal message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
            <div className="flex gap-2">
              <button type="submit" className="bg-[#0f285b] text-[#be9b49] px-4 py-2 rounded">
                Send
              </button>
              <button type="button" className="bg-gray-200 px-4 py-2 rounded" onClick={() => setSelectedId(null)}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {acceptingId && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4">
          <form onSubmit={acceptRequest} className="bg-white rounded-xl p-5 w-full max-w-md space-y-3">
            <h2 className="text-lg font-semibold">Accept Request</h2>
            <p className="text-sm text-gray-600">
              Confirm that you can fulfil this request. The requester will be notified with your optional message.
            </p>
            <textarea
              className="w-full border rounded-lg px-3 py-2 min-h-[100px]"
              placeholder="Message to the requester (optional)"
              value={acceptMessage}
              onChange={(e) => setAcceptMessage(e.target.value)}
            />
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={submittingAccept}
                className="bg-[#0f285b] text-[#be9b49] px-4 py-2 rounded disabled:opacity-60"
              >
                {submittingAccept ? "Accepting..." : "Confirm Accept"}
              </button>
              <button
                type="button"
                className="bg-gray-200 px-4 py-2 rounded"
                onClick={() => setAcceptingId(null)}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default BrowseRequestsPage;
