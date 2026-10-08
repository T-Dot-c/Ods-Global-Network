/**
 * Customer Portal Service — ODS Global Network
 * Handles customer profile retrieval, updates, and password changes.
 */

const API_BASE = 'http://localhost:3001';

export interface CustomerProfile {
  id: string;
  email: string;
  full_name: string;
  phone: string;
  role: string;
  preferred_language: 'en' | 'am';
  notification_preference: 'email' | 'sms' | 'both';
  country: string;
  region_state: string;
  city: string;
  postal_code: string;
  address_line: string;
  created_at: string;
  last_login_at: string | null;
}

export interface UpdateProfilePayload {
  full_name: string;
  phone?: string;
  preferred_language?: 'en' | 'am';
  notification_preference?: 'email' | 'sms' | 'both';
  country?: string;
  region_state?: string;
  city?: string;
  postal_code?: string;
  address_line?: string;
}

export interface ChangePasswordPayload {
  current_password: string;
  new_password: string;
}

export interface ServiceResponse<T = unknown> {
  success: boolean;
  message?: string;
  profile?: T;
}

/**
 * Fetch authenticated customer's profile
 */
export async function getCustomerProfile(): Promise<CustomerProfile> {
  const res = await fetch(`${API_BASE}/api/customer/profile`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
  });

  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.message || 'Failed to fetch customer profile.');
  }

  return data.profile;
}

/**
 * Update authenticated customer's profile
 */
export async function updateCustomerProfile(payload: UpdateProfilePayload): Promise<CustomerProfile> {
  const res = await fetch(`${API_BASE}/api/customer/profile`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload),
  });

  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.message || 'Failed to update customer profile.');
  }

  return data.profile;
}

/**
 * Change customer password
 */
export async function changeCustomerPassword(payload: ChangePasswordPayload): Promise<{ message: string }> {
  const res = await fetch(`${API_BASE}/api/customer/change-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload),
  });

  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.message || 'Failed to change password.');
  }

  return { message: data.message || 'Password updated successfully.' };
}
