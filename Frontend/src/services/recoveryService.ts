/**
 * recoveryService.ts — ODS Global Network
 * 
 * Centralized service layer for password recovery workflows:
 *  - requestPasswordReset(email)
 *  - confirmPasswordReset(email, code, newPassword)
 * 
 * Returns typed error kinds ('network' | 'server' | 'invalid_code' | 'rate_limited' | 'unknown')
 * rather than raw server strings, preventing message leakage into the UI.
 * 
 * Includes a dev-only simulation switch strictly eliminated in production builds.
 */

export type RecoveryErrorKind = 'network' | 'server' | 'invalid_code' | 'rate_limited' | 'unknown';

export interface RecoveryResponse {
  success: boolean;
  errorKind?: RecoveryErrorKind;
}

const API_BASE = 'http://localhost:3001';

/**
 * Dev simulation handler
 * Only active in Vite development mode when localStorage flag is set.
 * In production builds (import.meta.env.PROD), this entire logic block is dead-code eliminated.
 */
function handleDevSimulation(
  action: 'forgot' | 'reset',
  params: { email?: string; code?: string; newPassword?: string }
): Promise<RecoveryResponse> | null {
  if (import.meta.env.DEV && typeof window !== 'undefined') {
    const isSimulating = localStorage.getItem('ODS_DEV_SIMULATE_RECOVERY') === 'true';
    if (!isSimulating) return null;

    return new Promise((resolve) => {
      setTimeout(() => {
        if (action === 'forgot') {
          // Distinctive test value: simulate-fail-user@ods-test.local triggers simulated failure
          if (params.email === 'simulate-fail-user@ods-test.local') {
            resolve({
              success: false,
              errorKind: 'server',
            });
          } else {
            resolve({
              success: true,
            });
          }
        } else if (action === 'reset') {
          // Distinctive test value: 789456 triggers simulated success; any other code fails as invalid_code
          if (params.code === '789456') {
            resolve({
              success: true,
            });
          } else {
            resolve({
              success: false,
              errorKind: 'invalid_code',
            });
          }
        }
      }, 600);
    });
  }
  return null;
}

/**
 * Request a password reset code for an email.
 */
export async function requestPasswordReset(email: string): Promise<RecoveryResponse> {
  const simulated = handleDevSimulation('forgot', { email });
  if (simulated) return simulated;

  try {
    const res = await fetch(`${API_BASE}/api/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email: email.trim().toLowerCase() }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok || !data.success) {
      if (res.status === 429) return { success: false, errorKind: 'rate_limited' };
      if (res.status >= 500) return { success: false, errorKind: 'server' };
      return { success: false, errorKind: 'unknown' };
    }

    return { success: true };
  } catch (err) {
    return { success: false, errorKind: 'network' };
  }
}

/**
 * Confirm a password reset using the token from URL fragment and set a new password.
 */
export async function resetPasswordWithToken(
  token: string,
  newPassword: string
): Promise<RecoveryResponse> {
  try {
    const res = await fetch(`${API_BASE}/api/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        token: token.trim(),
        newPassword,
      }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok || !data.success) {
      if (res.status === 400) return { success: false, errorKind: 'invalid_code' };
      if (res.status === 429) return { success: false, errorKind: 'rate_limited' };
      if (res.status >= 500) return { success: false, errorKind: 'server' };
      return { success: false, errorKind: 'unknown' };
    }

    return { success: true };
  } catch {
    return { success: false, errorKind: 'network' };
  }
}

/**
 * Confirm a password reset using either token or 6-digit one-time code and set a new password.
 */
export async function confirmPasswordReset(
  emailOrToken: string,
  code: string,
  newPassword?: string
): Promise<RecoveryResponse> {
  // If called as confirmPasswordReset(token, newPassword)
  if (newPassword === undefined) {
    return resetPasswordWithToken(emailOrToken, code);
  }

  const simulated = handleDevSimulation('reset', { email: emailOrToken, code, newPassword });
  if (simulated) return simulated;

  return resetPasswordWithToken(code, newPassword);
}

/**
 * Verify account email address using token extracted from URL fragment.
 */
export async function verifyEmail(token: string): Promise<RecoveryResponse> {
  try {
    const res = await fetch(`${API_BASE}/api/auth/verify-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ token: token.trim() }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok || !data.success) {
      if (res.status === 400) return { success: false, errorKind: 'invalid_code' };
      if (res.status >= 500) return { success: false, errorKind: 'server' };
      return { success: false, errorKind: 'unknown' };
    }

    return { success: true };
  } catch {
    return { success: false, errorKind: 'network' };
  }
}

/**
 * Request resending account verification email.
 */
export async function resendVerification(email: string): Promise<RecoveryResponse> {
  try {
    const res = await fetch(`${API_BASE}/api/auth/resend-verification`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email: email.trim().toLowerCase() }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok || !data.success) {
      if (res.status === 429) return { success: false, errorKind: 'rate_limited' };
      if (res.status >= 500) return { success: false, errorKind: 'server' };
      return { success: false, errorKind: 'unknown' };
    }

    return { success: true };
  } catch {
    return { success: false, errorKind: 'network' };
  }
}
