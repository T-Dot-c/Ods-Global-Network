/**
 * Gifting & Digital Vouchers Service — ODS Global Network (Batch 7)
 * Handles gift card purchasing, atomic redemption, wallet management,
 * balance inquiries, and service delivery confirmations.
 */

const API_BASE = 'http://localhost:3001';

export interface GiftCard {
  id: string;
  sender_id?: string;
  sender_name?: string;
  recipient_id?: string;
  recipient_name?: string;
  recipient_email?: string;
  recipient_phone?: string;
  code?: string;
  initial_amount: number | string;
  balance: number | string;
  currency: string;
  gift_type: 'monetary' | 'service';
  package_type: 'basic' | 'vip';
  occasion: string;
  service_title?: string;
  service_category?: string;
  status: 'pending_payment' | 'active' | 'redeemed' | 'delivered' | 'expired' | 'cancelled' | 'refunded';
  personal_message?: string;
  expiry_date: string;
  scheduled_delivery_date?: string;
  created_at: string;
  redeemed_at?: string;
  delivered_at?: string;
  sender_email?: string;
  provider_name?: string;
}

export interface PurchaseGiftCardPayload {
  amount: number;
  currency?: string;
  gift_type?: 'monetary' | 'service';
  package_type?: 'basic' | 'vip';
  occasion?: string;
  service_title?: string;
  service_category?: string;
  service_provider_id?: string;
  recipient_name?: string;
  recipient_email?: string;
  recipient_phone?: string;
  personal_message?: string;
  scheduled_delivery_date?: string;
  payment_method?: 'direct' | 'wallet' | 'chapa';
  metadata?: Record<string, unknown>;
}

export interface PurchaseGiftCardResponse {
  success: boolean;
  message?: string;
  giftCard?: GiftCard;
  paymentRequired?: boolean;
  checkoutUrl?: string;
  txRef?: string;
  newWalletBalance?: number;
  paidViaWallet?: boolean;
}

export interface ProviderVouchersStats {
  total: number;
  activeCount: number;
  deliveredCount: number;
  deliveredValue: number;
}

export interface ProviderVouchersResponse {
  success: boolean;
  vouchers: GiftCard[];
  stats: ProviderVouchersStats;
}

export interface WalletActivity {
  id: string;
  gift_card_id: string;
  code?: string;
  amount: number | string;
  currency: string;
  balance_after: number | string;
  created_at: string;
  occasion?: string;
  gift_type?: string;
  service_title?: string;
}

export interface CheckGiftCardResponse {
  success: boolean;
  valid: boolean;
  initialAmount?: number;
  balance?: number;
  currency?: string;
  giftType?: string;
  packageType?: string;
  occasion?: string;
  serviceTitle?: string;
  expiryDate?: string;
  message?: string;
}

export interface RedeemGiftCardResponse {
  success: boolean;
  message: string;
  redeemedAmount: number;
  currency: string;
  newWalletBalance: number;
  giftCard: GiftCard;
}

/**
 * Purchase a new digital gift card or service voucher
 */
export async function purchaseGiftCard(payload: PurchaseGiftCardPayload): Promise<PurchaseGiftCardResponse> {
  const res = await fetch(`${API_BASE}/api/gifting/purchase`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload),
  });

  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.message || 'Failed to create gift card.');
  }

  return data;
}

/**
 * Check gift card validity and value (public/safe preview)
 */
export async function checkGiftCard(code: string): Promise<CheckGiftCardResponse> {
  const res = await fetch(`${API_BASE}/api/gifting/check`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code: code.trim() }),
  });

  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.message || 'Gift card is invalid or expired.');
  }

  return data;
}

/**
 * Redeem gift card balance atomically into current user's digital wallet
 */
export async function redeemGiftCard(code: string): Promise<RedeemGiftCardResponse> {
  const res = await fetch(`${API_BASE}/api/gifting/redeem`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ code: code.trim() }),
  });

  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.message || 'Failed to redeem gift card.');
  }

  return data;
}

/**
 * Retrieve current user's digital wallet balance and redemption ledger
 */
export async function getWallet(): Promise<{ balance: number; currency: string; activity: WalletActivity[] }> {
  const res = await fetch(`${API_BASE}/api/gifting/wallet`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
  });

  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.message || 'Failed to retrieve digital wallet.');
  }

  return {
    balance: parseFloat(data.balance) || 0,
    currency: data.currency || 'ETB',
    activity: data.activity || [],
  };
}

/**
 * Retrieve user's sent and received gift cards
 */
export async function getMyGiftCards(): Promise<{ sent: GiftCard[]; received: GiftCard[] }> {
  const res = await fetch(`${API_BASE}/api/gifting/my-cards`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
  });

  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.message || 'Failed to retrieve your gift cards.');
  }

  return {
    sent: data.sent || [],
    received: data.received || [],
  };
}

/**
 * Healthcare provider confirms delivery of a service-linked voucher
 */
export async function confirmServiceDelivery(code: string, providerId?: string): Promise<{ success: boolean; message: string; giftCard: GiftCard }> {
  const res = await fetch(`${API_BASE}/api/gifting/confirm-delivery`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ code: code.trim(), service_provider_id: providerId }),
  });

  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.message || 'Failed to confirm voucher delivery.');
  }

  return data;
}

/**
 * Retrieve patient vouchers for healthcare provider
 */
export async function getProviderVouchers(params?: {
  status?: string;
  search?: string;
  limit?: number;
  offset?: number;
  providerId?: string;
}): Promise<ProviderVouchersResponse> {
  const query = new URLSearchParams();
  if (params?.status) query.append('status', params.status);
  if (params?.search) query.append('search', params.search);
  if (params?.limit) query.append('limit', String(params.limit));
  if (params?.offset) query.append('offset', String(params.offset));
  if (params?.providerId) query.append('provider_id', params.providerId);

  const qs = query.toString() ? `?${query.toString()}` : '';
  const res = await fetch(`${API_BASE}/api/gifting/provider/vouchers${qs}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
  });

  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.message || 'Failed to retrieve provider service vouchers.');
  }

  return data;
}

export interface PublicGiftCard {
  id: string;
  code: string;
  senderName: string;
  recipientName: string;
  initialAmount: number;
  balance: number;
  currency: string;
  giftType: 'monetary' | 'service';
  packageType: 'basic' | 'vip';
  occasion: string;
  serviceTitle?: string;
  serviceCategory?: string;
  providerName?: string;
  personalMessage?: string;
  status: 'pending_payment' | 'active' | 'redeemed' | 'delivered' | 'expired' | 'cancelled' | 'refunded';
  expiryDate: string;
  scheduledDeliveryDate?: string;
  createdAt: string;
  deliveredAt?: string;
  isClaimable: boolean;
}

/**
 * Public lookup of a gift card for guest claim or safe preview (no auth required)
 */
export async function getPublicGiftCard(code: string): Promise<PublicGiftCard> {
  const res = await fetch(`${API_BASE}/api/gifting/public/claim/${encodeURIComponent(code.trim())}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });

  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.message || 'Gift card not found or invalid.');
  }

  return data.card;
}
