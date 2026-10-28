const API_BASE_URL = 'http://localhost:3001/api';

export interface InAppNotification {
  id: string;
  category: string;
  template_key: string;
  title: string;
  rendered_body: string;
  action_url?: string | null;
  read_at?: string | null;
  created_at: string;
}

export interface NotificationPreferences {
  [category: string]: {
    email: boolean;
    in_app: boolean;
  };
}

export interface AdminNotificationItem {
  id: string;
  event_id: string;
  recipient_user_id?: string | null;
  recipient_address: string;
  channel: string;
  category: string;
  template_key: string;
  template_version: number;
  status: 'pending' | 'retrying' | 'sent' | 'failed' | 'dead' | 'skipped' | 'discarded';
  attempts: number;
  max_attempts: number;
  run_at: string;
  sent_at?: string | null;
  last_error?: string | null;
  title?: string | null;
  created_at: string;
  event_type?: string | null;
}

export interface NotificationHealthStats {
  pendingCount: number;
  retryingCount: number;
  deadCount: number;
  sentLast24h: number;
  failedLast24h: number;
  oldestPendingRunAt?: string | null;
}

export interface NotificationTemplateItem {
  key: string;
  channel: string;
  category: string;
  is_essential: boolean;
  description: string;
  version?: number;
  subject?: string;
  body_html?: string;
  body_text?: string;
  locale?: string;
}

export interface SuppressionItem {
  address: string;
  reason: string;
  source: string;
  created_at: string;
}

/**
 * Fetch unread in-app notification count
 */
export async function fetchUnreadNotificationCount(): Promise<number> {
  try {
    const res = await fetch(`${API_BASE_URL}/notifications/unread-count`, {
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });
    if (!res.ok) return 0;
    const json = await res.json();
    return json.unread_count || 0;
  } catch {
    return 0;
  }
}

/**
 * Fetch paginated in-app notifications
 */
export async function fetchInAppNotifications(page = 1, limit = 20, unreadOnly = false): Promise<{ notifications: InAppNotification[]; total: number }> {
  try {
    const res = await fetch(`${API_BASE_URL}/notifications?page=${page}&limit=${limit}&unread_only=${unreadOnly}`, {
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });
    if (!res.ok) return { notifications: [], total: 0 };
    const json = await res.json();
    return {
      notifications: Array.isArray(json.data) ? json.data : [],
      total: json.pagination?.total || 0,
    };
  } catch {
    return { notifications: [], total: 0 };
  }
}

/**
 * Mark a single notification as read
 */
export async function markNotificationAsRead(id: string): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE_URL}/notifications/${id}/read`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Mark all user notifications as read
 */
export async function markAllNotificationsAsRead(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE_URL}/notifications/read-all`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Fetch user notification preferences
 */
export async function fetchNotificationPreferences(): Promise<NotificationPreferences> {
  const res = await fetch(`${API_BASE_URL}/notifications/preferences`, {
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Failed to load preferences.');
  const json = await res.json();
  return json.data || {};
}

/**
 * Save user notification preferences
 */
export async function updateNotificationPreferences(preferences: NotificationPreferences): Promise<boolean> {
  const res = await fetch(`${API_BASE_URL}/notifications/preferences`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ preferences }),
  });
  return res.ok;
}

/* ─────────────────────────────────────────────────────────────
   ADMIN NOTIFICATION SERVICES
   ───────────────────────────────────────────────────────────── */

export async function fetchAdminNotificationHealth(): Promise<NotificationHealthStats> {
  const res = await fetch(`${API_BASE_URL}/admin/notifications/health`, {
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Failed to load health statistics.');
  const json = await res.json();
  return json.data;
}

export async function fetchAdminNotifications(params: {
  status?: string;
  channel?: string;
  category?: string;
  recipient?: string;
  page?: number;
  limit?: number;
}): Promise<{ notifications: AdminNotificationItem[]; total: number }> {
  const query = new URLSearchParams();
  if (params.status) query.set('status', params.status);
  if (params.channel) query.set('channel', params.channel);
  if (params.category) query.set('category', params.category);
  if (params.recipient) query.set('recipient', params.recipient);
  if (params.page) query.set('page', String(params.page));
  if (params.limit) query.set('limit', String(params.limit));

  const res = await fetch(`${API_BASE_URL}/admin/notifications?${query.toString()}`, {
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Failed to load notification ledger.');
  const json = await res.json();
  return {
    notifications: Array.isArray(json.data) ? json.data : [],
    total: json.pagination?.total || 0,
  };
}

export async function requeueDeadNotification(id: string, reason?: string): Promise<boolean> {
  const res = await fetch(`${API_BASE_URL}/admin/notifications/${id}/requeue`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ reason }),
  });
  return res.ok;
}

export async function discardDeadNotification(id: string, reason?: string): Promise<boolean> {
  const res = await fetch(`${API_BASE_URL}/admin/notifications/${id}/discard`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ reason }),
  });
  return res.ok;
}

export async function fetchAdminTemplates(): Promise<NotificationTemplateItem[]> {
  const res = await fetch(`${API_BASE_URL}/admin/notifications/templates/catalog`, {
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Failed to load templates.');
  const json = await res.json();
  return Array.isArray(json.data) ? json.data : [];
}

export async function previewAdminTemplate(key: string, sampleData: Record<string, any>): Promise<any> {
  const res = await fetch(`${API_BASE_URL}/admin/notifications/templates/${key}/preview`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ sampleData }),
  });
  if (!res.ok) throw new Error('Preview failed.');
  const json = await res.json();
  return json.data;
}

export async function sendTestAdminTemplate(key: string, sampleData: Record<string, any>): Promise<boolean> {
  const res = await fetch(`${API_BASE_URL}/admin/notifications/templates/${key}/test-send`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ sampleData }),
  });
  return res.ok;
}

export async function fetchAdminSuppressions(): Promise<SuppressionItem[]> {
  const res = await fetch(`${API_BASE_URL}/admin/notifications/suppressions/list`, {
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
  });
  if (!res.ok) return [];
  const json = await res.json();
  return Array.isArray(json.data) ? json.data : [];
}

export async function addAdminSuppression(address: string, reason?: string): Promise<boolean> {
  const res = await fetch(`${API_BASE_URL}/admin/notifications/suppressions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ address, reason }),
  });
  return res.ok;
}

export async function removeAdminSuppression(address: string): Promise<boolean> {
  const res = await fetch(`${API_BASE_URL}/admin/notifications/suppressions/${encodeURIComponent(address)}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
  });
  return res.ok;
}
