import React, { useState, useEffect } from 'react';
import {
  FileText,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  RefreshCw,
  Loader2,
} from 'lucide-react';
import {
  getMerchantDocuments,
  uploadMerchantDocument,
  DocumentItem,
} from '../../../services/merchantService';

interface MerchantDocumentsTabProps {
  approvalStatus?: 'pending' | 'approved' | 'rejected';
  onDocumentUploaded?: () => void;
}

export const MerchantDocumentsTab: React.FC<MerchantDocumentsTabProps> = ({
  approvalStatus,
  onDocumentUploaded,
}) => {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [purpose, setPurpose] = useState<'kyc_license' | 'kyc_registration' | 'kyc_accreditation'>('kyc_license');

  const loadDocuments = async () => {
    try {
      setLoading(true);
      setError(null);
      const docs = await getMerchantDocuments();
      setDocuments(docs);
    } catch (err: any) {
      setError(err.message || 'Failed to load documents.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDocuments();
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setSuccessMsg(null);

    // Frontend pre-check: 7 MB authenticated upload cap
    if (file.size > 7 * 1024 * 1024) {
      setError('File exceeds maximum size of 10 MB.');
      return;
    }

    try {
      setUploading(true);
      const res = await uploadMerchantDocument(file, purpose);
      if (res.compliance_reset) {
        setSuccessMsg('KYC Document uploaded. Account approval has transitioned back to Pending for accreditation review.');
      } else {
        setSuccessMsg('KYC Document uploaded successfully.');
      }
      await loadDocuments();
      if (onDocumentUploaded) onDocumentUploaded();
    } catch (err: any) {
      setError(err.message || 'Failed to upload document.');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--color-navy-dark)', margin: 0 }}>
            Compliance & KYC Documents
          </h2>
          <p style={{ color: '#64748b', fontSize: '0.88rem', margin: '4px 0 0' }}>
            Upload commercial trade licenses, tax registration, and business accreditations.
          </p>
        </div>

        <button
          onClick={loadDocuments}
          disabled={loading}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 16px',
            borderRadius: '8px',
            backgroundColor: '#f8fafc',
            border: '1px solid #cbd5e1',
            color: 'var(--color-navy-dark)',
            fontSize: '0.85rem',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          <span>Refresh</span>
        </button>
      </div>

      {successMsg && (
        <div style={{ padding: '12px 16px', borderRadius: '8px', backgroundColor: 'rgba(16, 185, 129, 0.1)', border: '1px solid #10b981', color: '#065f46', fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <CheckCircle2 size={18} />
          <span>{successMsg}</span>
        </div>
      )}
      {error && (
        <div style={{ padding: '12px 16px', borderRadius: '8px', backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', color: '#991b1b', fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <AlertTriangle size={18} />
          <span>{error}</span>
        </div>
      )}
      {approvalStatus === 'rejected' && (
        <div style={{ padding: '12px 16px', borderRadius: '8px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', fontSize: '0.88rem' }}>
          Please upload corrected replacement KYC documents below to re-submit your profile for accreditation review.
        </div>
      )}

      {/* Upload Box */}
      <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--color-navy-dark)', margin: 0 }}>
          Upload New Compliance Document
        </h3>

        <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 200px' }}>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
              Document Purpose
            </label>
            <select
              value={purpose}
              onChange={(e) => setPurpose(e.target.value as any)}
              style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.88rem', outline: 'none' }}
            >
              <option value="kyc_license">Business License / Trade Registration (kyc_license)</option>
              <option value="kyc_registration">Tax Identification / Commercial Reg (kyc_registration)</option>
              <option value="kyc_accreditation">Institutional Accreditation (kyc_accreditation)</option>
            </select>
          </div>

          <div style={{ flex: '2 1 280px' }}>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
              Select File (PDF, PNG, JPG — max 10 MB)
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="file"
                accept=".pdf,.png,.jpg,.jpeg"
                onChange={handleFileUpload}
                disabled={uploading}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  backgroundColor: '#f8fafc',
                  fontSize: '0.85rem',
                  cursor: uploading ? 'not-allowed' : 'pointer',
                }}
              />
              {uploading && (
                <div style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--color-gold-deep)' }}>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Uploading...</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Documents Table */}
      <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'left' }}>
          <thead>
            <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#64748b', fontSize: '0.78rem', textTransform: 'uppercase' }}>
              <th style={{ padding: '12px 16px' }}>Document Name</th>
              <th style={{ padding: '12px 16px' }}>Purpose</th>
              <th style={{ padding: '12px 16px' }}>Size</th>
              <th style={{ padding: '12px 16px' }}>Status</th>
              <th style={{ padding: '12px 16px' }}>Uploaded</th>
              <th style={{ padding: '12px 16px', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} style={{ padding: '32px', textAlign: 'center', color: '#64748b' }}>
                  Loading documents...
                </td>
              </tr>
            ) : documents.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: '32px', textAlign: 'center', color: '#94a3b8' }}>
                  No documents uploaded yet. Upload your business license to complete onboarding.
                </td>
              </tr>
            ) : (
              documents.map((doc) => (
                <tr key={doc.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--color-navy-dark)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <FileText size={16} color="var(--color-gold-deep)" />
                      <span>{doc.file_name}</span>
                    </div>
                  </td>
                  <td style={{ padding: '12px 16px', color: '#64748b' }}>
                    {doc.purpose}
                  </td>
                  <td style={{ padding: '12px 16px', color: '#64748b' }}>
                    {(doc.file_size / 1024).toFixed(0)} KB
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span
                      style={{
                        padding: '3px 8px',
                        borderRadius: '4px',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        backgroundColor:
                          doc.status === 'verified'
                            ? '#d1fae5'
                            : doc.status === 'rejected'
                            ? '#fee2e2'
                            : '#fef3c7',
                        color:
                          doc.status === 'verified'
                            ? '#065f46'
                            : doc.status === 'rejected'
                            ? '#b91c1c'
                            : '#92400e',
                      }}
                    >
                      {doc.status}
                    </span>
                    {doc.rejection_reason && (
                      <div style={{ fontSize: '0.74rem', color: '#dc2626', marginTop: '2px' }}>
                        {doc.rejection_reason}
                      </div>
                    )}
                  </td>
                  <td style={{ padding: '12px 16px', color: '#64748b' }}>
                    {new Date(doc.uploaded_at).toLocaleDateString()}
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                    <a
                      href={`http://localhost:3001${doc.view_url}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '4px 10px',
                        borderRadius: '4px',
                        backgroundColor: '#f1f5f9',
                        color: 'var(--color-navy-dark)',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        textDecoration: 'none',
                      }}
                    >
                      <span>View</span>
                      <ExternalLink size={12} />
                    </a>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
