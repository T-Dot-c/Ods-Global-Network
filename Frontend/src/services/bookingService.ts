/**
 * ODS Global Network — Booking & Availability Client Service (Batch 9)
 *
 * Provides typed access to:
 * - Public slot availability & dynamic scheduling
 * - 10-minute hold reservation & checkout
 * - Customer booking management, cancellation & rescheduling
 * - Provider weekly availability schedules & blackout exceptions
 * - Provider appointment management (complete, no-show, cancel)
 * - Admin platform oversight
 */

const API_BASE = (import.meta as any).env?.VITE_API_BASE || 'http://localhost:3001';

export type BookingStatus =
  | 'pending_payment'
  | 'awaiting_provider'
  | 'confirmed'
  | 'completed'
  | 'cancelled_by_customer'
  | 'cancelled_by_provider'
  | 'cancelled_by_admin'
  | 'declined'
  | 'no_show'
  | 'expired'
  | 'payment_conflict';

export interface TimeSlot {
  start_at: string;
  end_at: string;
  available_capacity: number;
  total_capacity: number;
}

export interface ServiceAvailabilityData {
  service_id: string;
  service_title: string;
  duration_minutes: number;
  price_amount: number;
  currency: string;
  location_type: string;
  time_zone: string;
  slots: TimeSlot[];
}

export interface BookingStatusHistoryItem {
  id: string;
  booking_id: string;
  from_status: string | null;
  to_status: string;
  actor_user_id: string | null;
  actor_name?: string;
  reason: string | null;
  created_at: string;
}

export interface BookingItem {
  id: string;
  reference: string;
  service_id: string;
  service_title?: string;
  current_service_title?: string;
  customer_user_id: string;
  provider_user_id: string;
  start_at: string;
  end_at: string;
  status: BookingStatus;
  hold_expires_at?: string | null;
  price_amount: number;
  currency: string;
  contact_phone?: string;
  customer_note?: string;
  service_snapshot: {
    title: string;
    duration_minutes: number;
    price: number;
    currency: string;
    location_type: string;
  };
  cancellation_policy_snapshot: {
    preset: string;
    description: string;
    full_refund_hours: number;
    partial_refund_hours: number;
    partial_refund_percent: number;
  };
  reschedule_count: number;
  refund_amount: number;
  provider_name?: string;
  provider_phone?: string;
  provider_email?: string;
  customer_name?: string;
  customer_phone?: string;
  customer_email?: string;
  created_at: string;
  updated_at: string;
  history?: BookingStatusHistoryItem[];
}

export interface AvailabilityRule {
  id?: string;
  provider_user_id?: string;
  service_id?: string | null;
  weekday: number; // 0=Sunday, 1=Monday, ..., 6=Saturday
  start_time: string;
  end_time: string;
  time_zone?: string;
  is_active?: boolean;
}

export interface AvailabilityException {
  id?: string;
  provider_user_id?: string;
  service_id?: string | null;
  exception_date: string;
  is_closed: boolean;
  start_time?: string | null;
  end_time?: string | null;
  note?: string | null;
  created_at?: string;
}

/**
 * 1. Fetch available slots for service
 */
export async function getAvailableSlots(
  serviceId: string,
  fromDate?: string,
  toDate?: string
): Promise<ServiceAvailabilityData> {
  const params = new URLSearchParams();
  if (fromDate) params.append('from', fromDate);
  if (toDate) params.append('to', toDate);

  const res = await fetch(`${API_BASE}/api/services/${serviceId}/availability?${params.toString()}`, {
    credentials: 'include',
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.message || 'Failed to fetch availability.');
  }
  return data.data;
}

/**
 * 2. Create booking hold (10-minute hold)
 */
export async function createBookingHold(payload: {
  service_id: string;
  start_at: string;
  contact_phone: string;
  customer_note?: string;
}): Promise<{ booking: BookingItem; hold_expires_at: string; hold_minutes: number }> {
  const res = await fetch(`${API_BASE}/api/bookings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.message || 'Failed to reserve appointment time slot.');
  }
  return data.data;
}

/**
 * 3. Fetch customer bookings
 */
export async function getCustomerBookings(params?: {
  status?: string;
  limit?: number;
  offset?: number;
}): Promise<BookingItem[]> {
  const sp = new URLSearchParams();
  if (params?.status) sp.append('status', params.status);
  if (params?.limit) sp.append('limit', String(params.limit));
  if (params?.offset) sp.append('offset', String(params.offset));

  const res = await fetch(`${API_BASE}/api/bookings?${sp.toString()}`, {
    credentials: 'include',
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.message || 'Failed to fetch bookings.');
  }
  return data.data;
}

/**
 * 4. Fetch booking by ID
 */
export async function getBookingById(bookingId: string): Promise<BookingItem> {
  const res = await fetch(`${API_BASE}/api/bookings/${bookingId}`, {
    credentials: 'include',
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.message || 'Failed to load booking details.');
  }
  return data.data;
}

/**
 * 5. Redeem gift card for booking payment
 */
export async function payBookingWithGiftCard(
  bookingId: string,
  giftCode: string
): Promise<{ success: boolean; booking_id: string; reference: string; status: string; gift_balance_remaining: number }> {
  const res = await fetch(`${API_BASE}/api/bookings/${bookingId}/pay-gift`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ gift_code: giftCode }),
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.message || 'Failed to redeem gift card for booking.');
  }
  return data.data;
}

/**
 * 5b. Initiate Chapa payment for pending booking
 */
export async function payBookingWithChapa(
  bookingId: string
): Promise<{ success: boolean; checkout_url: string; tx_ref: string }> {
  const res = await fetch(`${API_BASE}/api/bookings/${bookingId}/pay-chapa`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.message || 'Failed to initiate Chapa payment.');
  }
  return data;
}

/**
 * 6. Customer cancel booking
 */
export async function cancelBookingByCustomer(
  bookingId: string,
  reason?: string
): Promise<{ success: boolean; booking_id: string; refund_amount: number }> {
  const res = await fetch(`${API_BASE}/api/bookings/${bookingId}/cancel`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ reason }),
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.message || 'Failed to cancel booking.');
  }
  return data.data;
}

/**
 * 7. Reschedule booking
 */
export async function rescheduleBooking(
  bookingId: string,
  newStartAt: string
): Promise<BookingItem> {
  const res = await fetch(`${API_BASE}/api/bookings/${bookingId}/reschedule`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ new_start_at: newStartAt }),
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.message || 'Failed to reschedule appointment.');
  }
  return data.data;
}

/**
 * 8. Provider availability management
 */
export async function getWeeklyAvailability(serviceId?: string): Promise<AvailabilityRule[]> {
  const sp = new URLSearchParams();
  if (serviceId) sp.append('service_id', serviceId);

  const res = await fetch(`${API_BASE}/api/my/availability?${sp.toString()}`, {
    credentials: 'include',
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.message || 'Failed to fetch weekly schedule.');
  }
  return data.data;
}

export async function setWeeklyAvailability(
  rules: AvailabilityRule[],
  serviceId?: string
): Promise<AvailabilityRule[]> {
  const res = await fetch(`${API_BASE}/api/my/availability`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ rules, service_id: serviceId || null }),
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.message || 'Failed to save weekly schedule.');
  }
  return data.data;
}

export async function getAvailabilityExceptions(serviceId?: string): Promise<AvailabilityException[]> {
  const sp = new URLSearchParams();
  if (serviceId) sp.append('service_id', serviceId);

  const res = await fetch(`${API_BASE}/api/my/availability/exceptions?${sp.toString()}`, {
    credentials: 'include',
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.message || 'Failed to fetch exception dates.');
  }
  return data.data;
}

export async function addAvailabilityException(
  payload: AvailabilityException,
  serviceId?: string
): Promise<AvailabilityException> {
  const res = await fetch(`${API_BASE}/api/my/availability/exceptions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ ...payload, service_id: serviceId || null }),
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.message || 'Failed to add exception date.');
  }
  return data.data;
}

export async function deleteAvailabilityException(exceptionId: string): Promise<boolean> {
  const res = await fetch(`${API_BASE}/api/my/availability/exceptions/${exceptionId}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.message || 'Failed to delete exception date.');
  }
  return true;
}

/**
 * 9. Provider incoming bookings
 */
export async function getProviderBookings(params?: {
  status?: string;
  fromDate?: string;
  toDate?: string;
  limit?: number;
  offset?: number;
}): Promise<BookingItem[]> {
  const sp = new URLSearchParams();
  if (params?.status) sp.append('status', params.status);
  if (params?.fromDate) sp.append('fromDate', params.fromDate);
  if (params?.toDate) sp.append('toDate', params.toDate);
  if (params?.limit) sp.append('limit', String(params.limit));
  if (params?.offset) sp.append('offset', String(params.offset));

  const res = await fetch(`${API_BASE}/api/my/bookings?${sp.toString()}`, {
    credentials: 'include',
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.message || 'Failed to fetch provider appointments.');
  }
  return data.data;
}

export async function markBookingCompleted(bookingId: string): Promise<boolean> {
  const res = await fetch(`${API_BASE}/api/my/bookings/${bookingId}/complete`, {
    method: 'POST',
    credentials: 'include',
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.message || 'Failed to mark appointment as completed.');
  }
  return true;
}

export async function markBookingNoShow(bookingId: string): Promise<boolean> {
  const res = await fetch(`${API_BASE}/api/my/bookings/${bookingId}/no-show`, {
    method: 'POST',
    credentials: 'include',
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.message || 'Failed to mark appointment as no-show.');
  }
  return true;
}

export async function cancelBookingByProvider(
  bookingId: string,
  reason: string
): Promise<{ success: boolean; refund_amount: number }> {
  const res = await fetch(`${API_BASE}/api/my/bookings/${bookingId}/cancel`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ reason }),
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.message || 'Failed to cancel appointment.');
  }
  return data.data;
}

/**
 * 10. Admin bookings oversight
 */
export async function getAdminBookings(params?: {
  status?: string;
  limit?: number;
  offset?: number;
}): Promise<BookingItem[]> {
  const sp = new URLSearchParams();
  if (params?.status) sp.append('status', params.status);
  if (params?.limit) sp.append('limit', String(params.limit));
  if (params?.offset) sp.append('offset', String(params.offset));

  const res = await fetch(`${API_BASE}/api/admin/bookings?${sp.toString()}`, {
    credentials: 'include',
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.message || 'Failed to fetch platform bookings.');
  }
  return data.data;
}

export async function cancelBookingByAdmin(
  bookingId: string,
  reason: string
): Promise<{ success: boolean; refund_amount: number }> {
  const res = await fetch(`${API_BASE}/api/admin/bookings/${bookingId}/cancel`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ reason }),
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.message || 'Failed to cancel booking.');
  }
  return data.data;
}
