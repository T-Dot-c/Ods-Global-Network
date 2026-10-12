/**
 * Frontend/src/services/publicService.ts — ODS Global Network
 * 
 * Centralized service layer for public inquiry workflows:
 *  - submitSupportRequest(data)
 *  - submitPartnerRequest(data)
 * 
 * Follows the typed error classification pattern established in recoveryService.ts.
 */

export type PublicErrorKind = 'network' | 'validation' | 'server' | 'unknown';

export interface SupportSubmissionData {
  name: string;
  email: string;
  subject: string;
  message: string;
  website?: string; // honeypot
}

export interface SupportSubmissionResponse {
  success: boolean;
  reference?: string;
  message?: string;
  errorKind?: PublicErrorKind;
}

export interface PartnerSubmissionData {
  partnership_type: 'investor' | 'strategic_partner' | 'sponsorship';
  name: string;
  company_name: string;
  email: string;
  phone: string;
  whatsapp?: string;
  sector?: string;
  investment_type?: string;
  enquiry?: string;
  website_url?: string; // honeypot
  staging_token?: string;
}

export interface PartnerSubmissionResponse {
  success: boolean;
  message?: string;
  errorKind?: PublicErrorKind;
}

export interface StagingUploadResponse {
  success: boolean;
  message?: string;
  staging_token?: string;
  doc_id?: string;
  expires_in?: string;
}

const API_BASE = 'http://localhost:3001';

/**
 * Submit customer support inquiry to POST /api/support
 */
export async function submitSupportRequest(
  data: SupportSubmissionData
): Promise<SupportSubmissionResponse> {
  try {
    const res = await fetch(`${API_BASE}/api/support`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    const json = await res.json().catch(() => null);

    if (res.ok && json?.success) {
      return {
        success: true,
        reference: json.reference,
        message: json.message,
      };
    }

    if (res.status === 400) {
      return {
        success: false,
        message: json?.message || 'Please check your submission and correct any errors.',
        errorKind: 'validation',
      };
    }

    return {
      success: false,
      message: json?.message || 'Server error processing your request. Please try again.',
      errorKind: 'server',
    };
  } catch (err: unknown) {
    return {
      success: false,
      message: 'Unable to reach the server. Please check your internet connection or call our office.',
      errorKind: 'network',
    };
  }
}

/**
 * Submit partnership inquiry to POST /api/partners
 */
export async function submitPartnerRequest(
  data: PartnerSubmissionData
): Promise<PartnerSubmissionResponse> {
  try {
    const res = await fetch(`${API_BASE}/api/partners`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    const json = await res.json().catch(() => null);

    if (res.ok && json?.success) {
      return {
        success: true,
        message: json.message,
      };
    }

    if (res.status === 400) {
      return {
        success: false,
        message: json?.message || 'Please check your submission and correct any errors.',
        errorKind: 'validation',
      };
    }

    return {
      success: false,
      message: json?.message || 'Server error processing your partnership inquiry. Please try again.',
      errorKind: 'server',
    };
  } catch (err: unknown) {
    return {
      success: false,
      message: 'Unable to reach the server. Please check your internet connection or contact us directly.',
      errorKind: 'network',
    };
  }
}

/**
 * Upload an anonymous staging document (proposal/pitch deck)
 * for attachment to a partner inquiry.
 */
export async function uploadStagingDocument(file: File): Promise<StagingUploadResponse> {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('purpose', 'partner_proposal');

    const res = await fetch(`${API_BASE}/api/documents/upload`, {
      method: 'POST',
      body: formData,
    });

    const json = await res.json().catch(() => null);

    if (res.ok && json?.success) {
      return {
        success: true,
        staging_token: json.staging_token,
        doc_id: json.doc_id,
        expires_in: json.expires_in,
      };
    }

    return {
      success: false,
      message: json?.message || 'Failed to upload proposal document.',
    };
  } catch (err: unknown) {
    return {
      success: false,
      message: 'Network error uploading proposal document. Please check connection.',
    };
  }
}
