import React, { useState, useEffect } from 'react';
import {
  Filter,
  RefreshCw,
  AlertTriangle,
  FileCode,
} from 'lucide-react';
import {
  fetchAdminAuditLogBatch10,
  AdminAuditLogBatch10Item,
} from '../../../services/adminService';

export const AuditLogsTab: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [logs, setLogs] = useState<AdminAuditLogBatch10Item[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [selectedAction, setSelectedAction] = useState<string>('');
  const [selectedTargetType, setSelectedTargetType] = useState<string>('');
  const [activePayloadItem, setActivePayloadItem] = useState<AdminAuditLogBatch10Item | null>(null);

  const loadLogs = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchAdminAuditLogBatch10({
        action: selectedAction || undefined,
        target_type: selectedTargetType || undefined,
        page,
        limit: 20,
      });
      const list = Array.isArray(data?.items) ? data.items : [];
      setLogs(list);
      setTotal(data?.pagination?.total || 0);
      setTotalPages(data?.pagination?.pages || 1);
    } catch (err: any) {
      setError(err.message || 'Failed to load audit logs.');
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, [page, selectedAction, selectedTargetType]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--color-navy-dark)', margin: 0 }}>
            Append-Only Administrative Audit Ledger
          </h2>
          <p style={{ color: '#64748b', fontSize: '0.86rem', margin: '4px 0 0' }}>
            Immutable transactional audit records documenting administrative mutations, permission usage, and justifications.
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
            backgroundColor: '#ffffff',
            border: '1px solid #cbd5e1',
            color: 'var(--color-navy-dark)',
            fontSize: '0.84rem',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          <span>Refresh Ledger ({total} Records)</span>
        </button>
      </div>

      {error && (
        <div style={{ padding: '12px 16px', borderRadius: '8px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <AlertTriangle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Filter Bar */}
      <div style={{ display: 'flex', gap: '12px', alignItems: 'center', backgroundColor: '#ffffff', padding: '14px 18px', borderRadius: '10px', border: '1px solid #e2e8f0', flexWrap: 'wrap' }}>
        <Filter size={15} color="#64748b" />
        <span style={{ fontSize: '0.84rem', fontWeight: 600, color: '#475569' }}>Filter Action:</span>
        <select
          value={selectedAction}
          onChange={(e) => { setSelectedAction(e.target.value); setPage(1); }}
          style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', fontSize: '0.84rem' }}
        >
          <option value="">All Actions</option>
          <option value="USER_SUSPENDED">USER_SUSPENDED</option>
          <option value="USER_REACTIVATED">USER_REACTIVATED</option>
          <option value="USER_ROLE_CHANGED">USER_ROLE_CHANGED</option>
          <option value="FORCE_SIGNOUT">FORCE_SIGNOUT</option>
          <option value="KYC_DECISION">KYC_DECISION</option>
          <option value="SERVICE_DECISION">SERVICE_DECISION</option>
          <option value="SERVICE_TAKEDOWN">SERVICE_TAKEDOWN</option>
          <option value="BOOKING_CANCELLED">BOOKING_CANCELLED</option>
          <option value="BOOKING_CONFLICT_RESOLVED">BOOKING_CONFLICT_RESOLVED</option>
          <option value="REFUND_REQUESTED">REFUND_REQUESTED</option>
          <option value="REFUND_APPROVED">REFUND_APPROVED</option>
          <option value="GIFT_CODE_REVEALED">GIFT_CODE_REVEALED</option>
          <option value="ADMIN_ACCOUNT_CREATE">ADMIN_ACCOUNT_CREATE</option>
          <option value="PLATFORM_SETTINGS_UPDATE">PLATFORM_SETTINGS_UPDATE</option>
        </select>

        <span style={{ fontSize: '0.84rem', fontWeight: 600, color: '#475569' }}>Target Type:</span>
        <select
          value={selectedTargetType}
          onChange={(e) => { setSelectedTargetType(e.target.value); setPage(1); }}
          style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', fontSize: '0.84rem' }}
        >
          <option value="">All Target Types</option>
          <option value="user">User</option>
          <option value="provider">Provider</option>
          <option value="merchant">Merchant</option>
          <option value="service">Service</option>
          <option value="booking">Booking</option>
          <option value="gift_card">Gift Card</option>
          <option value="refund_approval">Refund Approval</option>
          <option value="settings">Platform Settings</option>
        </select>
      </div>

      {/* Logs Table */}
      <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'left' }}>
          <thead>
            <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontWeight: 700 }}>
              <th style={{ padding: '12px 16px' }}>Timestamp</th>
              <th style={{ padding: '12px 16px' }}>Action & Permission</th>
              <th style={{ padding: '12px 16px' }}>Actor</th>
              <th style={{ padding: '12px 16px' }}>Target Entity</th>
              <th style={{ padding: '12px 16px' }}>Reason / Justification</th>
              <th style={{ padding: '12px 16px', textAlign: 'right' }}>Payload Diff</th>
            </tr>
          </thead>
          <tbody>
            {loading && logs.length === 0 ? (
              <tr><td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Loading immutable ledger entries...</td></tr>
            ) : !logs || logs.length === 0 ? (
              <tr><td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>No audit events found matching filters.</td></tr>
            ) : (
              (logs || []).map((item) => (
                <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '12px 16px', color: '#64748b', whiteSpace: 'nowrap' }}>
                    {new Date(item.created_at).toLocaleString()}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ fontWeight: 700, color: 'var(--color-navy-dark)' }}>{item.action}</div>
                    <code style={{ fontSize: '0.74rem', color: 'var(--color-gold-deep)' }}>{item.permission_key}</code>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ fontWeight: 600 }}>{item.actor_name || 'System / Admin'}</div>
                    <div style={{ fontSize: '0.76rem', color: '#94a3b8' }}>{item.actor_email || item.ip_address || '—'}</div>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ padding: '2px 6px', borderRadius: '4px', backgroundColor: '#f1f5f9', fontSize: '0.76rem', fontWeight: 600, color: '#475569' }}>
                      {item.target_type}: {item.target_id.slice(0, 10)}...
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', color: '#475569', maxWidth: '240px' }}>
                    {item.reason || '—'}
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                    <button
                      onClick={() => setActivePayloadItem(item)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '4px 10px',
                        backgroundColor: '#f1f5f9',
                        border: '1px solid #cbd5e1',
                        borderRadius: '6px',
                        fontSize: '0.78rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      <FileCode size={12} /> Inspect Diff
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 18px', backgroundColor: '#f8fafc', borderTop: '1px solid #e2e8f0' }}>
            <button
              disabled={page <= 1}
              onClick={() => setPage(p => Math.max(1, p - 1))}
              style={{ padding: '6px 14px', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', cursor: page <= 1 ? 'not-allowed' : 'pointer' }}
            >
              Previous
            </button>
            <span style={{ fontSize: '0.84rem', color: '#64748b' }}>
              Page {page} of {totalPages}
            </span>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage(p => p + 1)}
              style={{ padding: '6px 14px', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', cursor: page >= totalPages ? 'not-allowed' : 'pointer' }}
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Payload Drawer / Modal */}
      {activePayloadItem && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', maxWidth: '580px', width: '100%', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--color-navy-dark)', margin: 0 }}>
                Audit Payload Summary: {activePayloadItem.action}
              </h4>
              <button
                onClick={() => setActivePayloadItem(null)}
                style={{ border: 'none', background: 'none', fontSize: '1.3rem', cursor: 'pointer', color: '#94a3b8' }}
              >
                ✕
              </button>
            </div>
            <pre style={{ backgroundColor: '#0f172a', color: '#38bdf8', padding: '16px', borderRadius: '8px', fontSize: '0.82rem', overflowX: 'auto', maxHeight: '350px' }}>
              {JSON.stringify(activePayloadItem.summary, null, 2)}
            </pre>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
              <button
                onClick={() => setActivePayloadItem(null)}
                style={{ padding: '8px 16px', backgroundColor: 'var(--color-navy-dark)', color: '#ffffff', border: 'none', borderRadius: '6px', fontWeight: 600, fontSize: '0.84rem', cursor: 'pointer' }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default AuditLogsTab;
