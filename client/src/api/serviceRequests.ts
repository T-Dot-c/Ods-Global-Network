import api from "../components/axiosInstance";

export type ServiceRequestStatus =
  | "pending"
  | "open"
  | "in_progress"
  | "completed"
  | "rejected";

export type ProposalStatus = "pending" | "accepted" | "rejected";

export interface ServiceRequestPayload {
  title: string;
  description: string;
  occasion?: string;
  location: string;
  budget?: number | null;
  preferred_date?: string;
  requester_name: string;
  requester_email: string;
  requester_whatsapp?: string;
  requester_phone?: string;
  request_type: "service" | "gift";
  service_type?: string;
  gift_recipients?: Array<{
    name: string;
    email?: string;
    phone?: string;
    whatsapp?: string;
    location?: string;
  }>;
}

export const createServiceRequest = async (payload: ServiceRequestPayload) => {
  const { data } = await api.post("/requests", payload);
  return data;
};

export const getMyServiceRequests = async () => {
  const { data } = await api.get("/my-requests");
  return data;
};

export const getOpenServiceRequests = async () => {
  const { data } = await api.get("/requests/open");
  return data;
};

export const getServiceRequestDetails = async (requestId: number | string) => {
  const { data } = await api.get(`/requests/${requestId}`);
  return data;
};

export const submitServiceProposal = async (
  requestId: number | string,
  payload: { price: number; message?: string }
) => {
  const { data } = await api.post(`/requests/${requestId}/proposals`, payload);
  return data;
};

export const acceptServiceRequest = async (
  requestId: number | string,
  payload?: { acceptance_message?: string }
) => {
  const { data } = await api.patch(`/requests/${requestId}/accept`, payload ?? {});
  return data;
};

export const updateProposalStatus = async (
  proposalId: number | string,
  status: ProposalStatus
) => {
  const { data } = await api.patch(`/proposals/${proposalId}`, { status });
  return data;
};

export const updateRequestStatus = async (
  requestId: number | string,
  status: ServiceRequestStatus
) => {
  const { data } = await api.patch(`/requests/${requestId}/status`, { status });
  return data;
};
