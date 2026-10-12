import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Filter,
  RefreshCw,
  Lock,
  AlertTriangle,
} from 'lucide-react';
import { fetchAuditLogs, AuditLogItem } from '../../../services/adminService';
import { useAuth } from '../../../context/AuthContext';

export const AuditLogsTab: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [total, setTotal] = useState(0);
  const [selectedAction, setSelectedAction] = useState<string>('');

  const isSuperAdmin = user?.role === 'super_admin';

  const loadLogs = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchAuditLogs(selectedAction || undefined);
      setLogs(data.logs);
      setTotal(data.total);
    } catch (err: any) {
      setError(err.message || 'Failed to load audit logs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isSuperAdmin) {
      loadLogs();
    } else {
      setLoading(false);
    }
  }, [selectedAction, isSuperAdmin]);

  if (!isSuperAdmin) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 24px', backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
        <Lock size={44} color="#94a3b8" style={{ margin: '0 auto 16px' }} />
        <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--color-navy-dark)', margin: 0 }}>
          Super Admin Clearance Required
        </h3>
        <p style={{ color: '#64748b', fontSize: '0.9rem', maxWidth: '440px', margin: '8px auto 0', lineHeight: 1.5 }}>
          The immutable platform audit ledger contains security-sensitive credentials and access events. This stream is restricted strictly to the <strong>super_admin</strong> role.
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--color-navy-dark)', margin: 0 }}>
            Platform Security Audit Log Stream
          </h2>
          <p style={{ color: '#64748b', fontSize: '0.88rem', margin: '4px 0 0' }}>
            Append-only security ledger tracking authentication, KYC decisions, compliance resets, and document accesses.
          </p>
        </div>

        <button
          onClick={loadLogs}
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
          <span>Refresh Ledger ({total} Records)</span>
        </button>
      </div>

      {error && (
        <div style={{ padding: '12px 16px', borderRadius: '8px', backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', color: '#991b1b', fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <AlertTriangle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Action filter */}
      <div style={{ display: 'flex', gap: '12px', alignItems: 'center', backgroundColor: '#f8fafc', padding: '12px 16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
        <Filter size={15} color="#64748b" />
        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>Filter by Event Action:</span>
        <select
          value={selectedAction}
          onChange={(e) => setSelectedAction(e.target.value)}
          style={{
            padding: '6px 12px',
            borderRadius: '6px',
            border: '1px solid #cbd5e1',
            backgroundColor: '#ffffff',
            fontSize: '0.85rem',
            outline: 'none',
          }}
        >
          <option value="">All Actions</option>
          <option value="LOGIN">LOGIN</option>
          <option value="LOGOUT">LOGOUT</option>
          <option value="LOGIN_FAILED">LOGIN_FAILED</option>
          <option value="KYC_APPROVAL">KYC_APPROVAL</option>
          <option value="KYC_REJECTION">KYC_REJECTION</option>
          <option value="KYC_RESUBMISSION">KYC_RESUBMISSION</option>
          <option value="COMPLIANCE_RESET">COMPLIANCE_RESET</option>
          <option value="DOCUMENT_VIEWED">DOCUMENT_VIEWED</option>
          <option value="DOCUMENT_UPLOADED">DOCUMENT_UPLOADED</option>
          <option value="DOCUMENT_PURGED">DOCUMENT_PURGED</option>
          <option value="PASSWORD_CHANGED">PASSWORD_CHANGED</option>
        </select>
      </div>

      {/* Logs Table */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '48px', color: '#64748b' }}>
          <RefreshCw size={26} className="animate-spin" style={{ margin: '0 auto 12px' }} />
          <p>Loading security audit ledger...</p>
        </div>
      ) : logs.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px', backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>
          <ShieldAlert size={32} color="#94a3b8" style={{ margin: '0 auto 10px' }} />
          <div style={{ fontWeight: 600, color: '#475569' }}>No audit events found</div>
        </div>
      ) : (
        <div style={{ backgroundColor: '#ffffff', borderRadius: '10px', border: '1px solid #e2e8f0', overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'left' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#64748b', fontSize: '0.78rem', textTransform: 'uppercase' }}>
                <th style={{ padding: '12px 16px' }}>Timestamp</th>
                <th style={{ padding: '12px 16px' }}>Action</th>
                <th style={{ padding: '12px 16px' }}>User Email</th>
                <th style={{ padding: '12px 16px' }}>IP / Agent</th>
                <th style={{ padding: '12px 16px' }}>Details Payload</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((item) => (
                <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '12px 16px', color: '#64748b', whiteSpace: 'nowrap' }}>
                    {new Date(item.created_at).toLocaleString()}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span
                      style={{
                        padding: '3px 8px',
                        borderRadius: '4px',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        backgroundColor:
                          item.action.includes('REJECT') || item.action.includes('FAILED')
                            ? '#fee2e2'
                            : item.action.includes('APPROVAL')
                            ? '#d1fae5'
                            : item.action.includes('RESET')
                            ? '#fef3c7'
                            : '#f1f5f9',
                        color:
                          item.action.includes('REJECT') || item.action.includes('FAILED')
                            ? '#b91c1c'
                            : item.action.includes('APPROVAL')
                            ? '#065f46'
                            : item.action.includes('RESET')
                            ? '#92400e'
                            : '#334155',
                      }}
                    >
                      {item.action}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', fontWeight: 600, color: '#1e293b' }}>
                    {item.user_email || 'System / Anonymous'}
                  </td>
                  <td style={{ padding: '12px 16px', color: '#64748b', fontSize: '0.8rem' }}>
                    {item.ip_address || '—'}
                  </td>
                  <td style={{ padding: '12px 16px', fontFamily: 'monospace', fontSize: '0.75rem', color: '#475569', maxWidth: '340px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {item.details ? JSON.stringify(item.details) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
