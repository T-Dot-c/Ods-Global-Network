/**
 * Merchant Service — ODS Global Network (Phase 3)
 * Profile retrieval, updates with compliance tracking, and KYC document management.
 */

const API_BASE = 'http://localhost:3001';

export interface MerchantProfile {
  id: string;
  user_id: string;
  business_name: string;
  business_type?: string;
  category?: string;
  business_phone?: string;
  business_email?: string;
  website?: string;
  description?: string;
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

export interface UpdateMerchantPayload {
  business_name?: string;
  business_type?: string;
  category?: string;
  business_phone?: string;
  business_email?: string;
  website?: string;
  description?: string;
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

export async function getMerchantProfile(): Promise<MerchantProfile> {
  const res = await fetch(`${API_BASE}/api/merchant/profile`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.message || 'Failed to fetch merchant profile.');
  }
  return data.profile;
}

export async function updateMerchantProfile(payload: UpdateMerchantPayload): Promise<{ success: boolean; message: string; compliance_reset?: boolean }> {
  const res = await fetch(`${API_BASE}/api/merchant/profile`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.message || 'Failed to update merchant profile.');
  }
  return data;
}

export async function getMerchantDocuments(): Promise<DocumentItem[]> {
  const res = await fetch(`${API_BASE}/api/merchant/documents`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.message || 'Failed to fetch merchant documents.');
  }
  return data.documents || [];
}

export async function uploadMerchantDocument(file: File, purpose: 'kyc_license' | 'kyc_registration' | 'kyc_accreditation'): Promise<{ success: boolean; message: string; document: DocumentItem; compliance_reset?: boolean }> {
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
