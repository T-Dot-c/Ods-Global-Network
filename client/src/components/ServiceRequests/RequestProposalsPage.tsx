import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getServiceRequestDetails, updateProposalStatus, updateRequestStatus } from "../../api/serviceRequests";

interface Proposal {
  id: number;
  provider_name: string;
  price: number;
  message: string;
  status: "pending" | "accepted" | "rejected";
}

const RequestProposalsPage = () => {
  const { id } = useParams();
  const [requestData, setRequestData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    if (!id) return;
    try {
      const data = await getServiceRequestDetails(id);
      setRequestData(data);
    } catch (err: any) {
      setError(err?.response?.data?.msg || "Failed to load request details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [id]);

  const acceptProposal = async (proposalId: number) => {
    try {
      await updateProposalStatus(proposalId, "accepted");
      await load();
    } catch (err: any) {
      setError(err?.response?.data?.msg || "Failed to accept proposal.");
    }
  };

  const markCompleted = async () => {
    if (!id) return;
    try {
      await updateRequestStatus(id, "completed");
      await load();
    } catch (err: any) {
      setError(err?.response?.data?.msg || "Failed to update request status.");
    }
  };

  if (loading) return <div className="p-6">Loading request details...</div>;
  if (!requestData) return <div className="p-6">Request not found.</div>;

  return (
    <div className="max-w-5xl mx-auto p-6">
      <h1 className="text-2xl font-bold text-[#1c2b21]">{requestData.title}</h1>
      <p className="text-gray-700 mt-2">{requestData.description}</p>
      <p className="text-sm text-gray-500 mt-1">
        {requestData.location} - {requestData.status}
      </p>
      {error && <p className="text-red-600 mt-2">{error}</p>}

      <div className="mt-6 space-y-3">
        <h2 className="text-xl font-semibold">Proposals</h2>
        {!requestData.proposals?.length ? (
          <p className="text-gray-600">No proposals yet.</p>
        ) : (
          requestData.proposals.map((proposal: Proposal) => (
            <div key={proposal.id} className="bg-white border rounded-lg p-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">{proposal.provider_name || "Provider"}</h3>
                <span className="font-bold">ETB {proposal.price}</span>
              </div>
              <p className="text-sm text-gray-700 mt-2">{proposal.message || "No message"}</p>
              <p className="text-xs mt-2 text-gray-500">Status: {proposal.status}</p>
              {proposal.status === "pending" && requestData.status !== "completed" && (
                <button
                  onClick={() => acceptProposal(proposal.id)}
                  className="mt-3 bg-[#1c2b21] text-[#D4AF37] px-3 py-2 rounded text-sm"
                >
                  Accept Proposal
                </button>
              )}
            </div>
          ))
        )}
      </div>

      {requestData.status === "in_progress" && (
        <button onClick={markCompleted} className="mt-6 bg-green-700 text-white px-4 py-2 rounded">
          Mark Request Completed
        </button>
      )}
    </div>
  );
};

export default RequestProposalsPage;
