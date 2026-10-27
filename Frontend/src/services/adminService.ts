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

/* ─────────────────────────────────────────────────────────────
   Batch 10: Full Admin Console Types & API Client Methods
   ───────────────────────────────────────────────────────────── */

export interface AdminPermissionsData {
  role: string;
  isSuperAdmin: boolean;
  permissions: string[];
}

export interface DashboardMetricsData {
  counters: {
    new_users_30d?: number;
    pending_kyc_count?: number;
    pending_services_count?: number;
    today_confirmed_bookings?: number;
    today_revenue_etb?: number;
    payment_conflicts_count?: number;
    pending_refund_approvals?: number;
    expiring_gifts_30d?: number;
    [key: string]: number | undefined;
  };
  needs_attention: Array<{
    type: string;
    label: string;
    count: number;
    tab: string;
  }>;
}

export interface AdminUserItem {
  id: string;
  email: string;
  full_name: string;
  phone: string | null;
  role: string;
  is_active: boolean;
  is_email_verified: boolean;
  created_at: string;
  last_login_at: string | null;
  active_bookings_count?: number;
}

export interface AdminUserDetail {
  user: {
    id: string;
    email: string;
    full_name: string;
    phone: string | null;
    role: string;
    is_active: boolean;
    is_email_verified: boolean;
    must_change_password: boolean;
    created_at: string;
    last_login_at: string | null;
  };
  notes: Array<{
    id: string;
    note: string;
    author_name: string;
    created_at: string;
  }>;
  recent_bookings?: any[];
  recent_transactions?: any[];
}

export interface AdminServiceItem {
  id: string;
  provider_id: string;
  provider_name?: string;
  title: string;
  slug: string;
  category_id: string;
  category_name?: string;
  price_amount: number;
  currency: string;
  status: 'draft' | 'pending_review' | 'published' | 'rejected' | 'taken_down' | 'archived' | 'suspended' | 'unpublished';
  is_active: boolean;
  duration_minutes: number;
  created_at: string;
  upcoming_bookings_count?: number;
}

export interface AdminCategoryItem {
  id: string;
  name: string;
  slug: string;
  parent_id: string | null;
  sort_order: number;
  is_active: boolean;
  services_count?: number;
}

export interface AdminBookingItem {
  id: string;
  reference: string;
  status: string;
  appointment_date: string;
  start_time: string;
  end_time: string;
  price_amount: number;
  currency: string;
  payment_method: string;
  customer_name: string;
  customer_email: string;
  provider_name: string;
  provider_email: string;
  service_title: string;
  created_at: string;
  is_disputed?: boolean;
}

export interface AdminBookingDetail {
  booking: AdminBookingItem & {
    contact_phone?: string;
    customer_note?: string;
    cancellation_reason?: string;
    cancelled_by_role?: string;
    dispute_notes?: string;
  };
  timeline: Array<{
    id: string;
    from_status: string;
    to_status: string;
    reason: string;
    created_at: string;
  }>;
  transaction?: {
    id: string;
    tx_ref: string;
    amount: number;
    status: string;
    payment_method: string;
  } | null;
}

export interface AdminTransactionItem {
  id: string;
  user_id: string;
  user_email: string;
  user_name: string;
  amount: number;
  currency: string;
  status: string;
  purpose: string;
  tx_ref: string;
  chapa_reference: string | null;
  created_at: string;
}

export interface AdminReconciliationItem {
  unconfirmed_paid: any[];
  orphaned_records: any[];
}

export interface AdminEarningsItem {
  provider_id: string;
  provider_name: string;
  provider_email: string;
  completed_bookings_count: number;
  gross_revenue_etb: number;
  provider_earnings_etb: number;
  platform_commission_etb: number;
}

export interface AdminRefundApprovalItem {
  id: string;
  transaction_id: string;
  booking_id: string | null;
  amount: number;
  currency: string;
  status: 'pending_approval' | 'approved' | 'rejected';
  request_reason: string;
  decision_reason: string | null;
  requested_by_name: string;
  requested_by_email: string;
  approved_by_name: string | null;
  tx_ref: string;
  booking_reference: string | null;
  created_at: string;
  decided_at: string | null;
}

export interface AdminGiftItem {
  id: string;
  code: string;
  gift_type: string;
  initial_amount: number;
  balance: number;
  currency: string;
  status: string;
  occasion: string;
  recipient_name: string | null;
  recipient_email: string | null;
  expiry_date: string;
  created_at: string;
  purchaser_email: string;
  purchaser_name: string;
}

export interface AdminGiftDetail {
  gift: AdminGiftItem & {
    personal_message?: string;
  };
  redemptions: Array<{
    id: string;
    amount: number;
    redeemed_at: string;
    redeemer_email?: string;
    redeemer_name?: string;
  }>;
}

export interface AdminAuditLogBatch10Item {
  id: string;
  actor_user_id: string | null;
  actor_email?: string;
  actor_name?: string;
  permission_key: string;
  action: string;
  target_type: string;
  target_id: string;
  summary: Record<string, any>;
  reason: string | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

export interface AdminStaffItem {
  id: string;
  email: string;
  full_name: string;
  phone: string | null;
  role: string;
  admin_level: string | null;
  is_active: boolean;
  must_change_password: boolean;
  created_at: string;
  last_login_at: string | null;
  groups: Array<{
    id: string;
    name: string;
    description: string;
  }>;
}

export interface AdminPlatformSetting {
  key: string;
  value: any;
  value_type: 'integer' | 'string' | 'boolean' | 'json';
  description: string;
  updated_at: string;
}

export interface EmailTemplateItem {
  id: string;
  name: string;
  category: string;
  description: string;
  channels: string[];
}

/** Fetch resolved permissions for current admin session */
export async function fetchMyPermissions(): Promise<AdminPermissionsData> {
  const res = await fetch(`${API_BASE}/api/admin/my-permissions`, {
    credentials: 'include',
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.message || 'Failed to resolve admin permissions.');
  }
  return data.data;
}

/** Fetch aggregated dashboard metrics and action items */
export async function fetchAdminDashboard(): Promise<DashboardMetricsData> {
  const res = await fetch(`${API_BASE}/api/admin/dashboard`, {
    credentials: 'include',
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.message || 'Failed to load dashboard metrics.');
  }
  return data.data;
}

/** User Administration API */
export async function fetchAdminUsers(params: {
  search?: string;
  role?: string;
  status?: string;
  page?: number;
  limit?: number;
} = {}): Promise<{ users: AdminUserItem[]; pagination: any }> {
  const url = new URL(`${API_BASE}/api/admin/users`);
  if (params.search) url.searchParams.set('search', params.search);
  if (params.role) url.searchParams.set('role', params.role);
  if (params.status) url.searchParams.set('status', params.status);
  if (params.page) url.searchParams.set('page', String(params.page));
  if (params.limit) url.searchParams.set('limit', String(params.limit));

  const res = await fetch(url.toString(), { credentials: 'include' });
  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data.message || 'Failed to list users.');
  return data.data;
}

export async function fetchAdminUserDetail(userId: string): Promise<AdminUserDetail> {
  const res = await fetch(`${API_BASE}/api/admin/users/${userId}`, { credentials: 'include' });
  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data.message || 'Failed to fetch user details.');
  return data.data;
}

export async function suspendAdminUser(userId: string, reason: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/admin/users/${userId}/suspend`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ reason }),
  });
  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data.message || 'Failed to suspend user.');
}

export async function reactivateAdminUser(userId: string, reason: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/admin/users/${userId}/reactivate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ reason }),
  });
  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data.message || 'Failed to reactivate user.');
}

export async function forceSignoutAdminUser(userId: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/admin/users/${userId}/force-signout`, {
    method: 'POST',
    credentials: 'include',
  });
  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data.message || 'Failed to terminate user sessions.');
}

export async function addAdminUserNote(userId: string, note: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/admin/users/${userId}/notes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ note }),
  });
  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data.message || 'Failed to add admin note.');
}

export async function changeAdminUserRole(userId: string, role: string, current_password: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/admin/users/${userId}/change-role`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ role, current_password }),
  });
  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data.message || 'Failed to change user role.');
}

/** Services & Categories API */
export async function fetchAdminServices(params: {
  status?: string;
  category_id?: string;
  search?: string;
  page?: number;
  limit?: number;
} = {}): Promise<{ services: AdminServiceItem[]; pagination: any }> {
  const url = new URL(`${API_BASE}/api/admin/services`);
  if (params.status) url.searchParams.set('status', params.status);
  if (params.category_id) url.searchParams.set('category_id', params.category_id);
  if (params.search) url.searchParams.set('search', params.search);
  if (params.page) url.searchParams.set('page', String(params.page));
  if (params.limit) url.searchParams.set('limit', String(params.limit));

  const res = await fetch(url.toString(), { credentials: 'include' });
  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data.message || 'Failed to list services.');

  let servicesList: AdminServiceItem[] = [];
  if (Array.isArray(data.data)) {
    servicesList = data.data;
  } else if (Array.isArray(data.data?.services)) {
    servicesList = data.data.services;
  } else if (Array.isArray(data.services)) {
    servicesList = data.services;
  }

  const paginationObj = data.pagination || data.data?.pagination || {
    page: 1,
    limit: 15,
    total: servicesList.length,
    pages: 1,
  };

  return { services: servicesList, pagination: paginationObj };
}

export async function decideAdminService(serviceId: string, decision: 'approved' | 'rejected', reason?: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/admin/services/${serviceId}/decision`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ decision, reason }),
  });
  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data.message || 'Failed to moderate service.');
}

export async function takedownAdminService(serviceId: string, reason: string): Promise<{ upcoming_bookings_count: number }> {
  const res = await fetch(`${API_BASE}/api/admin/services/${serviceId}/takedown`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ reason }),
  });
  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data.message || 'Failed to take down service.');
  return data.data || { upcoming_bookings_count: 0 };
}

export async function restoreAdminService(serviceId: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/admin/services/${serviceId}/restore`, {
    method: 'POST',
    credentials: 'include',
  });
  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data.message || 'Failed to restore service.');
}

export async function fetchAdminCategories(): Promise<AdminCategoryItem[]> {
  const res = await fetch(`${API_BASE}/api/admin/categories`, { credentials: 'include' });
  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data.message || 'Failed to fetch categories.');
  return data.data;
}

export async function createAdminCategory(category: { name: string; slug: string; parent_id?: string | null; sort_order?: number }): Promise<void> {
  const res = await fetch(`${API_BASE}/api/admin/categories`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(category),
  });
  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data.message || 'Failed to create category.');
}

export async function updateAdminCategory(id: string, updates: Partial<AdminCategoryItem>): Promise<void> {
  const res = await fetch(`${API_BASE}/api/admin/categories/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(updates),
  });
  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data.message || 'Failed to update category.');
}

/** Bookings API */
export async function fetchAdminBookings(params: {
  status?: string;
  search?: string;
  from_date?: string;
  to_date?: string;
  page?: number;
  limit?: number;
} = {}): Promise<{ bookings: AdminBookingItem[]; pagination: any }> {
  const url = new URL(`${API_BASE}/api/admin/bookings`);
  if (params.status) url.searchParams.set('status', params.status);
  if (params.search) url.searchParams.set('search', params.search);
  if (params.from_date) url.searchParams.set('from_date', params.from_date);
  if (params.to_date) url.searchParams.set('to_date', params.to_date);
  if (params.page) url.searchParams.set('page', String(params.page));
  if (params.limit) url.searchParams.set('limit', String(params.limit));

  const res = await fetch(url.toString(), { credentials: 'include' });
  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data.message || 'Failed to list bookings.');
  return data.data;
}

export async function fetchAdminBookingDetail(bookingId: string): Promise<AdminBookingDetail> {
  const res = await fetch(`${API_BASE}/api/admin/bookings/${bookingId}`, { credentials: 'include' });
  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data.message || 'Failed to fetch booking details.');
  return data.data;
}

export async function cancelAdminBooking(bookingId: string, payload: { reason: string; refund_override?: boolean; refund_amount?: number }): Promise<void> {
  const res = await fetch(`${API_BASE}/api/admin/bookings/${bookingId}/cancel`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data.message || 'Failed to cancel booking.');
}

export async function resolveAdminBookingConflict(bookingId: string, payload: { resolution: 'refund' | 'confirm_new_slot'; slot_id?: string; notes?: string }): Promise<void> {
  const res = await fetch(`${API_BASE}/api/admin/bookings/${bookingId}/resolve-conflict`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data.message || 'Failed to resolve booking conflict.');
}

export async function disputeAdminBooking(bookingId: string, is_disputed: boolean, dispute_notes?: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/admin/bookings/${bookingId}/dispute`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ is_disputed, dispute_notes }),
  });
  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data.message || 'Failed to update dispute flag.');
}

/** Finance & Refunds API */
export async function fetchAdminTransactions(params: {
  status?: string;
  purpose?: string;
  search?: string;
  page?: number;
  limit?: number;
} = {}): Promise<{ transactions: AdminTransactionItem[]; pagination: any }> {
  const url = new URL(`${API_BASE}/api/admin/transactions`);
  if (params.status) url.searchParams.set('status', params.status);
  if (params.purpose) url.searchParams.set('purpose', params.purpose);
  if (params.search) url.searchParams.set('search', params.search);
  if (params.page) url.searchParams.set('page', String(params.page));
  if (params.limit) url.searchParams.set('limit', String(params.limit));

  const res = await fetch(url.toString(), { credentials: 'include' });
  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data.message || 'Failed to fetch transactions.');
  return data.data;
}

export async function fetchAdminReconciliation(): Promise<AdminReconciliationItem> {
  const res = await fetch(`${API_BASE}/api/admin/reconciliation`, { credentials: 'include' });
  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data.message || 'Failed to load reconciliation.');
  return data.data;
}

export async function fetchAdminEarnings(): Promise<AdminEarningsItem[]> {
  const res = await fetch(`${API_BASE}/api/admin/earnings`, { credentials: 'include' });
  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data.message || 'Failed to fetch provider earnings.');
  return data.data;
}

export async function fetchAdminRefunds(): Promise<AdminRefundApprovalItem[]> {
  const res = await fetch(`${API_BASE}/api/admin/refunds`, { credentials: 'include' });
  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data.message || 'Failed to list refund records.');
  return data.data;
}

export async function initiateAdminRefund(payload: {
  transaction_id: string;
  booking_id?: string;
  amount: number;
  reason: string;
}): Promise<{ status: string; message: string }> {
  const res = await fetch(`${API_BASE}/api/admin/refunds`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data.message || 'Failed to initiate refund.');
  return data;
}

export async function approveAdminRefund(approvalId: string, payload: { decision: 'approved' | 'rejected'; reason?: string; current_password?: string }): Promise<void> {
  const res = await fetch(`${API_BASE}/api/admin/refunds/${approvalId}/approve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data.message || 'Failed to process refund approval.');
}

/** Gifts API */
export async function fetchAdminGifts(params: {
  status?: string;
  sender_email?: string;
  recipient_email?: string;
  page?: number;
  limit?: number;
} = {}): Promise<{ gifts: AdminGiftItem[]; pagination: any }> {
  const url = new URL(`${API_BASE}/api/admin/gifts`);
  if (params.status) url.searchParams.set('status', params.status);
  if (params.sender_email) url.searchParams.set('sender_email', params.sender_email);
  if (params.recipient_email) url.searchParams.set('recipient_email', params.recipient_email);
  if (params.page) url.searchParams.set('page', String(params.page));
  if (params.limit) url.searchParams.set('limit', String(params.limit));

  const res = await fetch(url.toString(), { credentials: 'include' });
  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data.message || 'Failed to list gifts.');
  return data.data;
}

export async function fetchAdminGiftDetail(giftId: string): Promise<AdminGiftDetail> {
  const res = await fetch(`${API_BASE}/api/admin/gifts/${giftId}`, { credentials: 'include' });
  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data.message || 'Failed to fetch gift details.');
  return data.data;
}

export async function cancelAdminGift(giftId: string, reason: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/admin/gifts/${giftId}/cancel`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ reason }),
  });
  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data.message || 'Failed to cancel gift card.');
}

export async function extendAdminGift(giftId: string, new_expiry_date: string, reason?: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/admin/gifts/${giftId}/extend`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ new_expiry_date, reason }),
  });
  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data.message || 'Failed to extend gift card.');
}

export async function revealAdminGiftCode(giftId: string, reason: string): Promise<string> {
  const res = await fetch(`${API_BASE}/api/admin/gifts/${giftId}/reveal-code`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ reason }),
  });
  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data.message || 'Failed to reveal code.');
  return data.data.code;
}

/** Audit Log (Batch 10) */
export async function fetchAdminAuditLogBatch10(params: {
  action?: string;
  target_type?: string;
  page?: number;
  limit?: number;
} = {}): Promise<{ items: AdminAuditLogBatch10Item[]; pagination: any }> {
  const url = new URL(`${API_BASE}/api/admin/audit-log`);
  if (params.action) url.searchParams.set('action', params.action);
  if (params.target_type) url.searchParams.set('target_type', params.target_type);
  if (params.page) url.searchParams.set('page', String(params.page));
  if (params.limit) url.searchParams.set('limit', String(params.limit));

  const res = await fetch(url.toString(), { credentials: 'include' });
  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data.message || 'Failed to fetch audit log.');
  return data.data;
}

/** Operational Reports & CSV */
export async function fetchAdminReport(reportName: string, date_from?: string, date_to?: string): Promise<any[]> {
  const url = new URL(`${API_BASE}/api/admin/reports/${reportName}`);
  if (date_from) url.searchParams.set('date_from', date_from);
  if (date_to) url.searchParams.set('date_to', date_to);

  const res = await fetch(url.toString(), { credentials: 'include' });
  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data.message || 'Failed to run report.');
  return data.data;
}

export function getReportExportUrl(reportName: string, date_from?: string, date_to?: string): string {
  const url = new URL(`${API_BASE}/api/admin/reports/${reportName}/export`);
  if (date_from) url.searchParams.set('date_from', date_from);
  if (date_to) url.searchParams.set('date_to', date_to);
  return url.toString();
}

/** Staff & Settings */
export async function fetchAdminStaff(): Promise<AdminStaffItem[]> {
  const res = await fetch(`${API_BASE}/api/admin/staff`, { credentials: 'include' });
  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data.message || 'Failed to list staff accounts.');
  return data.data;
}

export async function createAdminStaff(payload: any): Promise<void> {
  const res = await fetch(`${API_BASE}/api/admin/staff`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data.message || 'Failed to provision staff account.');
}

export async function updateAdminStaffGroups(staffId: string, group_ids: string[]): Promise<void> {
  const res = await fetch(`${API_BASE}/api/admin/staff/${staffId}/groups`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ group_ids }),
  });
  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data.message || 'Failed to update staff permissions.');
}

export async function deactivateAdminStaff(staffId: string, reason: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/admin/staff/${staffId}/deactivate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ reason }),
  });
  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data.message || 'Failed to deactivate staff account.');
}

export async function fetchPlatformSettings(): Promise<AdminPlatformSetting[]> {
  const res = await fetch(`${API_BASE}/api/admin/settings`, { credentials: 'include' });
  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data.message || 'Failed to fetch settings.');
  return data.data;
}

export async function updatePlatformSettings(settings: Array<{ key: string; value: any }>): Promise<void> {
  const res = await fetch(`${API_BASE}/api/admin/settings`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ settings }),
  });
  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data.message || 'Failed to update settings.');
}

export async function fetchEmailTemplates(): Promise<EmailTemplateItem[]> {
  const res = await fetch(`${API_BASE}/api/admin/templates`, { credentials: 'include' });
  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data.message || 'Failed to fetch templates.');
  return data.data;
}

