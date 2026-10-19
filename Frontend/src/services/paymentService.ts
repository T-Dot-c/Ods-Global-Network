/**
 * Payment Service — ODS Global Network (Batch 6)
 * Handles payment initialization, status verification, receipt retrieval, and history.
 */

const API_BASE = 'http://localhost:3001';

export interface Transaction {
  id: string;
  tx_ref: string;
  amount: number | string;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  payment_method: string;
  purpose: string;
  created_at: string;
  completed_at: string | null;
}

export interface PaymentReceipt {
  tx_ref: string;
  reference: string;
  amount: number;
  currency: string;
  status: string;
  payment_method: string;
  purpose: string;
  customer_name: string;
  customer_email: string;
  created_at: string;
  completed_at: string | null;
}

export interface InitializePaymentParams {
  amount: number;
  currency?: string;
  purpose?: string;
  paymentMethod?: string;
  metadata?: Record<string, unknown>;
}

export interface InitializePaymentResponse {
  success: boolean;
  message?: string;
  tx_ref?: string;
  checkout_url?: string;
  mode?: string;
  code?: string;
}

export interface VerifyPaymentResponse {
  success: boolean;
  message?: string;
  transaction?: Transaction;
}

export interface ReceiptResponse {
  success: boolean;
  message?: string;
  receipt?: PaymentReceipt;
}

export interface HistoryResponse {
  success: boolean;
  message?: string;
  transactions?: Transaction[];
}

/**
 * Initialize a payment session
 */
export async function initializePayment(
  params: InitializePaymentParams
): Promise<InitializePaymentResponse> {
  try {
    const res = await fetch(`${API_BASE}/api/payments/initialize`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(params),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return {
        success: false,
        message: data.message || 'Payment initialization failed.',
        code: data.code,
      };
    }

    return {
      success: true,
      tx_ref: data.tx_ref,
      checkout_url: data.checkout_url,
      mode: data.mode,
    };
  } catch (err) {
    return {
      success: false,
      message: 'Network error communicating with payment service.',
    };
  }
}

/**
 * Verify payment status by transaction reference
 */
export async function verifyPayment(txRef: string): Promise<VerifyPaymentResponse> {
  try {
    const res = await fetch(`${API_BASE}/api/payments/verify/${encodeURIComponent(txRef)}`, {
      method: 'GET',
      credentials: 'include',
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return {
        success: false,
        message: data.message || 'Verification lookup failed.',
      };
    }

    return {
      success: true,
      transaction: data.transaction,
    };
  } catch (err) {
    return {
      success: false,
      message: 'Network error checking payment status.',
    };
  }
}

/**
 * Retrieve itemized receipt for a transaction
 */
export async function getReceipt(txRef: string): Promise<ReceiptResponse> {
  try {
    const res = await fetch(`${API_BASE}/api/payments/receipt/${encodeURIComponent(txRef)}`, {
      method: 'GET',
      credentials: 'include',
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return {
        success: false,
        message: data.message || 'Receipt not found.',
      };
    }

    return {
      success: true,
      receipt: data.receipt,
    };
  } catch (err) {
    return {
      success: false,
      message: 'Network error loading receipt.',
    };
  }
}

/**
 * Fetch transaction history for current authenticated customer
 */
export async function getPaymentHistory(): Promise<HistoryResponse> {
  try {
    const res = await fetch(`${API_BASE}/api/payments/history`, {
      method: 'GET',
      credentials: 'include',
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return {
        success: false,
        message: data.message || 'Failed to fetch transaction history.',
      };
    }

    return {
      success: true,
      transactions: data.transactions || [],
    };
  } catch (err) {
    return {
      success: false,
      message: 'Network error loading transaction history.',
    };
  }
}
