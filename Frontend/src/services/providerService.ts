/**
 * Provider Service — ODS Global Network (Phase 3)
 * Profile retrieval, updates with compliance tracking, and KYC document management.
 */

const API_BASE = 'http://localhost:3001';

export interface ProviderProfile {
  id: string;
  user_id: string;
  provider_name: string;
  provider_type?: string;
  service_category?: string;
  official_phone?: string;
  official_email?: string;
  website?: string;
  description?: string;
  services_offered?: string[];
  operating_hours?: Record<string, unknown> | string;
  availability?: string;
  license_no?: string;
  approval_status: 'pending' | 'approved' | 'rejected';
  rejection_reason?: string | null;
  reviewed_at?: string | null;
  created_at: string;
  updated_at: string;
  address?: {
    id?: string;
    country?: string;
    region_state?: string;
    city?: string;
    postal_code?: string;
    address_line?: string;
    branch_code?: string;
  } | null;
  contact?: {
    id?: string;
    full_name?: string;
    position_role?: string;
    email?: string;
    phone?: string;
  } | null;
}

export interface UpdateProviderPayload {
  provider_name?: string;
  provider_type?: string;
  service_category?: string;
  official_phone?: string;
  official_email?: string;
  website?: string;
  description?: string;
  services_offered?: string[];
  operating_hours?: Record<string, unknown> | string;
  availability?: string;
  license_no?: string;
  country?: string;
  region_state?: string;
  city?: string;
  postal_code?: string;
  address_line?: string;
  contact_full_name?: string;
  contact_position?: string;
  contact_email?: string;
  contact_phone?: string;
}

export interface DocumentItem {
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

export async function getProviderProfile(): Promise<ProviderProfile> {
  const res = await fetch(`${API_BASE}/api/provider/profile`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.message || 'Failed to fetch provider profile.');
  }
  return data.profile;
}

export async function updateProviderProfile(payload: UpdateProviderPayload): Promise<{ success: boolean; message: string; compliance_reset?: boolean }> {
  const res = await fetch(`${API_BASE}/api/provider/profile`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.message || 'Failed to update provider profile.');
  }
  return data;
}

export async function getProviderDocuments(): Promise<DocumentItem[]> {
  const res = await fetch(`${API_BASE}/api/provider/documents`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.message || 'Failed to fetch provider documents.');
  }
  return data.documents || [];
}

export async function uploadProviderDocument(file: File, purpose: 'kyc_license' | 'kyc_registration' | 'kyc_accreditation'): Promise<{ success: boolean; message: string; document: DocumentItem; compliance_reset?: boolean }> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('purpose', purpose);

  const res = await fetch(`${API_BASE}/api/documents/upload`, {
    method: 'POST',
    credentials: 'include',
    body: formData,
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.message || 'Document upload failed.');
  }
  return data;
}
