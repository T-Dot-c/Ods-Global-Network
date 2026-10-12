/**
 * Admin Service — ODS Global Network (Phase 3)
 * Handles KYC review queue, decisions, intake inboxes, and audit log streams.
 */

const API_BASE = 'http://localhost:3001';

export interface KycDocument {
  id: string;
  document_type: string;
  purpose: string;
  file_name: string;
  mime_type: string;
  file_size: number;
  status: 'pending' | 'verified' | 'rejected';
  uploaded_at: string;
  rejection_reason?: string | null;
  view_url: string;
}

export interface KycEntity {
  id: string;
  entity_type: 'merchant' | 'provider';
  display_name: string;
  category: string;
  approval_status: 'pending' | 'approved' | 'rejected';
  rejection_reason?: string | null;
  reviewed_at?: string | null;
  user_email: string;
  user_full_name: string;
  reviewer_email?: string | null;
  created_at: string;
  updated_at: string;
  documents: KycDocument[];
}

export interface KycQueueResponse {
  success: boolean;
  message?: string;
  queue?: {
    merchants: KycEntity[];
    providers: KycEntity[];
    total_pending: number;
  };
}

export interface SupportTicket {
  id: string;
  reference_id: string;
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  status: string;
  created_at: string;
}

export interface PartnerInquiry {
  id: string;
  partnership_type: string;
  name: string;
  company_name: string;
  email: string;
  phone: string;
  whatsapp?: string;
  sector?: string;
  investment_type?: string;
  enquiry?: string;
  document_id?: string;
  created_at: string;
  document_view_url?: string;
  document_name?: string;
  document_mime?: string;
}

export interface AuditLogItem {
  id: string;
  user_id?: string;
  action: string;
  ip_address?: string;
  user_agent?: string;
  details?: Record<string, unknown>;
  created_at: string;
  user_email?: string;
}

export async function fetchKycQueue(): Promise<KycQueueResponse> {
  const res = await fetch(`${API_BASE}/api/admin/kyc/queue`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.message || 'Failed to fetch KYC queue.');
  }
  return data;
}

export async function submitKycDecision(
  entityType: 'merchant' | 'provider',
  entityId: string,
  decision: 'approved' | 'rejected',
  reason?: string
): Promise<{ success: boolean; message: string }> {
  const res = await fetch(`${API_BASE}/api/admin/kyc/${entityType}/${entityId}/decision`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ decision, reason }),
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.message || 'Failed to apply KYC decision.');
  }
  return data;
}

export async function fetchSupportInbox(status?: string): Promise<{ total: number; requests: SupportTicket[] }> {
  const url = new URL(`${API_BASE}/api/admin/inbox/support`);
  if (status) url.searchParams.set('status', status);

  const res = await fetch(url.toString(), {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.message || 'Failed to fetch support requests.');
  }
  return data;
}

export async function fetchPartnersInbox(partnershipType?: string): Promise<{ total: number; partners: PartnerInquiry[] }> {
  const url = new URL(`${API_BASE}/api/admin/inbox/partners`);
  if (partnershipType) url.searchParams.set('partnership_type', partnershipType);

  const res = await fetch(url.toString(), {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.message || 'Failed to fetch partner inquiries.');
  }
  return data;
}

export async function fetchAuditLogs(action?: string): Promise<{ total: number; logs: AuditLogItem[] }> {
  const url = new URL(`${API_BASE}/api/admin/audit-logs`);
  if (action) url.searchParams.set('action', action);

  const res = await fetch(url.toString(), {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.message || 'Failed to fetch audit logs.');
  }
  return data;
}
