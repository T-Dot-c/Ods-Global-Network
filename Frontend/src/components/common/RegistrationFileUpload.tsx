import React, { useState, useRef } from 'react';
import { Upload, CheckCircle2, X, RefreshCw, AlertCircle, FileText } from 'lucide-react';

interface RegistrationFileUploadProps {
  docType: string;
  label: string;
  subtitle?: string;
  required?: boolean;
  onTokenReceived: (tokenData: { doc_type: string; staging_token: string; file_name: string } | null) => void;
  apiBase?: string;
}

export const RegistrationFileUpload: React.FC<RegistrationFileUploadProps> = ({
  docType,
  label,
  subtitle,
  required = false,
  onTokenReceived,
  apiBase = 'http://localhost:3001',
}) => {
  const [uploading, setUploading] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset state
    setErrorMessage(null);

    // Frontend pre-check: 5 MB cap for anonymous uploads
    const MAX_BYTES = 5 * 1024 * 1024;
    if (file.size > MAX_BYTES) {
      setErrorMessage('File exceeds maximum size of 5 MB.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    // Allowed mime types
    const allowedTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'];
    if (!allowedTypes.includes(file.type.toLowerCase()) && !file.name.match(/\.(pdf|png|jpg|jpeg)$/i)) {
      setErrorMessage('Invalid file format. Only authentic PDF, PNG, and JPEG documents are permitted.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('purpose', docType || 'registration_document');

      const res = await fetch(`${apiBase}/api/documents/upload`, {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        if (res.status === 503) {
          setErrorMessage('Anonymous staging storage capacity temporarily full; please retry later.');
        } else {
          setErrorMessage(data.message || 'Failed to upload document. Please try again.');
        }
        setUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }

      setUploadedFileName(file.name);
      setUploading(false);
      onTokenReceived({
        doc_type: docType,
        staging_token: data.staging_token,
        file_name: file.name,
      });
    } catch (err: any) {
      const msg = err.message || '';
      if (msg.includes('Failed to fetch') || msg.toLowerCase().includes('network')) {
        setErrorMessage('Network error: Unable to reach document upload service.');
      } else {
        setErrorMessage('An unexpected error occurred during upload. Please try again.');
      }
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    setUploadedFileName(null);
    setErrorMessage(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    onTokenReceived(null);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.png,.jpg,.jpeg"
        onChange={handleFileSelect}
        style={{ display: 'none' }}
      />

      <div
        onClick={() => {
          if (!uploading && !uploadedFileName && fileInputRef.current) {
            fileInputRef.current.click();
          }
        }}
        style={{
          border: uploadedFileName
            ? '1.5px solid #10b981'
            : errorMessage
            ? '1.5px solid #ef4444'
            : '1.5px dashed #cbd5e1',
          padding: '10px 12px',
          borderRadius: '8px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          gap: '8px',
          cursor: uploadedFileName ? 'default' : 'pointer',
          backgroundColor: uploadedFileName ? 'rgba(16, 185, 129, 0.06)' : '#f8fafc',
          transition: 'all 0.15s ease',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
            {uploadedFileName ? (
              <FileText size={16} color="#10b981" style={{ flexShrink: 0 }} />
            ) : (
              <Upload size={15} color="var(--color-gold-deep)" style={{ flexShrink: 0 }} />
            )}
            <span
              style={{
                fontSize: '0.82rem',
                color: 'var(--color-navy-dark)',
                fontWeight: 600,
                lineHeight: 1.3,
                textOverflow: 'ellipsis',
                overflow: 'hidden',
                whiteSpace: 'nowrap',
              }}
              title={uploadedFileName || label}
            >
              {uploadedFileName || label} {required && <span style={{ color: '#ef4444' }}>*</span>}
            </span>
          </div>

          {uploadedFileName && (
            <button
              type="button"
              onClick={handleRemove}
              title="Remove document"
              style={{
                background: 'none',
                border: 'none',
                color: '#64748b',
                cursor: 'pointer',
                padding: '2px',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <X size={14} color="#ef4444" />
            </button>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '0.74rem', color: '#64748b' }}>
            {subtitle || 'PDF, PNG, or JPEG (max 5 MB)'}
          </span>

          <span
            style={{
              fontSize: '0.78rem',
              color: uploadedFileName ? '#10b981' : 'var(--color-gold-deep)',
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            {uploading ? (
              <>
                <RefreshCw size={12} style={{ animation: 'spin 1s linear infinite' }} />
                <span>Uploading...</span>
              </>
            ) : uploadedFileName ? (
              <>
                <CheckCircle2 size={13} color="#10b981" />
                <span>Attached</span>
              </>
            ) : (
              'Upload'
            )}
          </span>
        </div>
      </div>

      {errorMessage && (
        <span style={{ fontSize: '0.74rem', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <AlertCircle size={12} /> {errorMessage}
        </span>
      )}
    </div>
  );
};

