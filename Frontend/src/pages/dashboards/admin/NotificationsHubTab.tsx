/**
 * ODS Global Network — Admin Notifications & Delivery Hub Tab (Batch 11)
 *
 * Provides operations team and system administrators with complete visibility:
 * - Real-time queue health tiles (pending, retrying, dead-letter, 24h success/fail)
 * - Filterable notification delivery ledger
 * - Dead-letter queue triage with requeue and discard actions
 * - Notification templates inspection, live variable preview, and test email dispatch
 * - Recipient suppression list management
 */
import React, { useState, useEffect } from 'react';
import {
  Bell,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Send,
  Eye,
  Trash2,
  RotateCcw,
  ShieldAlert,
  Search,
} from 'lucide-react';
import {
  fetchAdminNotificationHealth,
  fetchAdminNotifications,
  requeueDeadNotification,
  discardDeadNotification,
  fetchAdminTemplates,
  previewAdminTemplate,
  sendTestAdminTemplate,
  fetchAdminSuppressions,
  addAdminSuppression,
  removeAdminSuppression,
  NotificationHealthStats,
  AdminNotificationItem,
  NotificationTemplateItem,
  SuppressionItem,
} from '../../../services/notificationService';

export const NotificationsHubTab: React.FC = () => {
  const [subTab, setSubTab] = useState<'queue' | 'dead' | 'templates' | 'suppressions'>('queue');

  // Health Stats
  const [health, setHealth] = useState<NotificationHealthStats | null>(null);
  const [healthLoading, setHealthLoading] = useState(false);

  // Delivery Ledger
  const [notifications, setNotifications] = useState<AdminNotificationItem[]>([]);
  const [ledgerLoading, setLedgerLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [channelFilter, setChannelFilter] = useState<string>('');
  const [searchRecipient, setSearchRecipient] = useState<string>('');

  // Templates
  const [templates, setTemplates] = useState<NotificationTemplateItem[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<NotificationTemplateItem | null>(null);
  const [previewData, setPreviewData] = useState<any>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [testSendSuccess, setTestSendSuccess] = useState(false);

  // Suppressions
  const [suppressions, setSuppressions] = useState<SuppressionItem[]>([]);
  const [newSuppressionAddress, setNewSuppressionAddress] = useState('');
  const [newSuppressionReason, setNewSuppressionReason] = useState('');

  const loadHealth = async () => {
    setHealthLoading(true);
    try {
      const data = await fetchAdminNotificationHealth();
      setHealth(data);
    } catch {
      // ignore
    } finally {
      setHealthLoading(false);
    }
  };

  const loadNotifications = async (statusOverride?: string) => {
    setLedgerLoading(true);
    try {
      const res = await fetchAdminNotifications({
        status: statusOverride !== undefined ? statusOverride : (statusFilter || undefined),
        channel: channelFilter || undefined,
        recipient: searchRecipient || undefined,
        limit: 30,
      });
      setNotifications(res.notifications);
    } catch {
      setNotifications([]);
    } finally {
      setLedgerLoading(false);
    }
  };

  const loadTemplates = async () => {
    try {
      const data = await fetchAdminTemplates();
      setTemplates(data);
      if (data.length > 0 && !selectedTemplate) {
        setSelectedTemplate(data[0]);
      }
    } catch {
      setTemplates([]);
    }
  };

  const loadSuppressions = async () => {
    try {
      const data = await fetchAdminSuppressions();
      setSuppressions(data);
    } catch {
      setSuppressions([]);
    }
  };

  useEffect(() => {
    loadHealth();
  }, []);

  useEffect(() => {
    if (subTab === 'queue') {
      loadNotifications();
    } else if (subTab === 'dead') {
      loadNotifications('dead');
    } else if (subTab === 'templates') {
      loadTemplates();
    } else if (subTab === 'suppressions') {
      loadSuppressions();
    }
  }, [subTab, statusFilter, channelFilter]);

  const handleRequeue = async (id: string) => {
    if (confirm('Requeue this notification for immediate retry?')) {
      await requeueDeadNotification(id, 'Admin manual requeue');
      loadHealth();
      loadNotifications('dead');
    }
  };

  const handleDiscard = async (id: string) => {
    if (confirm('Discard this dead letter notification permanently?')) {
      await discardDeadNotification(id, 'Admin manual discard');
      loadHealth();
      loadNotifications('dead');
    }
  };

  const handlePreview = async (templateKey: string) => {
    setPreviewLoading(true);
    try {
      const rendered = await previewAdminTemplate(templateKey, {
        firstName: 'Jane',
        recipientName: 'Jane Doe',
        reference: 'ODS-BK-123456',
        serviceTitle: 'Cardiology Consultation',
        providerName: 'Addis Cardiac Center',
        amount: '2,500.00',
        appointmentTime: 'Oct 28, 2026, 10:00 AM (EAT)',
      });
      setPreviewData(rendered);
    } catch {
      setPreviewData(null);
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleTestSend = async (templateKey: string) => {
    try {
      await sendTestAdminTemplate(templateKey, {
        firstName: 'Administrator',
        recipientName: 'ODS Admin',
        reference: 'ODS-TEST-999',
        serviceTitle: 'Sample Health Service',
        amount: '1,000.00',
      });
      setTestSendSuccess(true);
      setTimeout(() => setTestSendSuccess(false), 3000);
    } catch {
      alert('Failed to send test email.');
    }
  };

  const handleAddSuppression = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSuppressionAddress) return;
    await addAdminSuppression(newSuppressionAddress, newSuppressionReason);
    setNewSuppressionAddress('');
    setNewSuppressionReason('');
    loadSuppressions();
  };

  const handleRemoveSuppression = async (address: string) => {
    if (confirm(`Remove ${address} from suppression list?`)) {
      await removeAdminSuppression(address);
      loadSuppressions();
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* ── Top Health Tiles ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
        <div style={{ background: '#ffffff', padding: '18px 20px', borderRadius: '10px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#64748b' }}>Pending in Queue</span>
            <Clock size={18} color="#0284c7" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0b1f3a' }}>
            {health?.pendingCount ?? '—'}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '4px' }}>
            Oldest: {health?.oldestPendingRunAt ? new Date(health.oldestPendingRunAt).toLocaleTimeString() : 'None'}
          </div>
        </div>

        <div style={{ background: '#ffffff', padding: '18px 20px', borderRadius: '10px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#64748b' }}>Retrying (Backoff)</span>
            <RefreshCw size={18} color="#eab308" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#ca8a04' }}>
            {health?.retryingCount ?? '—'}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '4px' }}>Active backoff loop</div>
        </div>

        <div style={{ background: '#ffffff', padding: '18px 20px', borderRadius: '10px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#64748b' }}>Dead-Letter Queue</span>
            <AlertTriangle size={18} color="#ef4444" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: (health?.deadCount ?? 0) > 0 ? '#b91c1c' : '#059669' }}>
            {health?.deadCount ?? '—'}
          </div>
          <div style={{ fontSize: '0.75rem', color: (health?.deadCount ?? 0) > 0 ? '#ef4444' : '#64748b', marginTop: '4px' }}>
            {(health?.deadCount ?? 0) > 0 ? 'Requires attention' : 'Healthy'}
          </div>
        </div>

        <div style={{ background: '#ffffff', padding: '18px 20px', borderRadius: '10px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#64748b' }}>Delivered (24h)</span>
            <CheckCircle2 size={18} color="#059669" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#059669' }}>
            {health?.sentLast24h ?? '—'}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '4px' }}>
            Failed: {health?.failedLast24h ?? 0}
          </div>
        </div>
      </div>

      {/* ── Subtabs ── */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
        <button
          onClick={() => setSubTab('queue')}
          style={{
            padding: '8px 16px',
            borderRadius: '6px',
            border: 'none',
            background: subTab === 'queue' ? '#0b1f3a' : '#f1f5f9',
            color: subTab === 'queue' ? '#ffffff' : '#475569',
            fontWeight: 600,
            fontSize: '0.88rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <Bell size={16} /> Delivery Ledger
        </button>

        <button
          onClick={() => setSubTab('dead')}
          style={{
            padding: '8px 16px',
            borderRadius: '6px',
            border: 'none',
            background: subTab === 'dead' ? '#b91c1c' : '#fee2e2',
            color: subTab === 'dead' ? '#ffffff' : '#991b1b',
            fontWeight: 700,
            fontSize: '0.88rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <AlertTriangle size={16} /> Dead-Letter Triage ({health?.deadCount ?? 0})
        </button>

        <button
          onClick={() => setSubTab('templates')}
          style={{
            padding: '8px 16px',
            borderRadius: '6px',
            border: 'none',
            background: subTab === 'templates' ? '#0b1f3a' : '#f1f5f9',
            color: subTab === 'templates' ? '#ffffff' : '#475569',
            fontWeight: 600,
            fontSize: '0.88rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <Eye size={16} /> Template Studio
        </button>

        <button
          onClick={() => setSubTab('suppressions')}
          style={{
            padding: '8px 16px',
            borderRadius: '6px',
            border: 'none',
            background: subTab === 'suppressions' ? '#0b1f3a' : '#f1f5f9',
            color: subTab === 'suppressions' ? '#ffffff' : '#475569',
            fontWeight: 600,
            fontSize: '0.88rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <ShieldAlert size={16} /> Suppressions
        </button>
      </div>

      {/* ── Subtab 1: Delivery Ledger & Subtab 2: Dead Letter ── */}
      {(subTab === 'queue' || subTab === 'dead') && (
        <div style={{ background: '#ffffff', borderRadius: '10px', border: '1px solid #e2e8f0', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
          {/* Filter Bar */}
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#f8fafc', padding: '6px 12px', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
              <Search size={16} color="#94a3b8" />
              <input
                type="text"
                placeholder="Search recipient address..."
                value={searchRecipient}
                onChange={(e) => setSearchRecipient(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && loadNotifications()}
                style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: '0.85rem', width: '200px' }}
              />
            </div>

            {subTab === 'queue' && (
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{ padding: '7px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
              >
                <option value="">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="retrying">Retrying</option>
                <option value="sent">Sent</option>
                <option value="failed">Failed</option>
                <option value="dead">Dead</option>
                <option value="skipped">Skipped</option>
              </select>
            )}

            <select
              value={channelFilter}
              onChange={(e) => setChannelFilter(e.target.value)}
              style={{ padding: '7px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
            >
              <option value="">All Channels</option>
              <option value="email">Email</option>
              <option value="in_app">In-App</option>
            </select>

            <button
              onClick={() => {
                loadHealth();
                loadNotifications(subTab === 'dead' ? 'dead' : undefined);
              }}
              disabled={healthLoading || ledgerLoading}
              style={{ padding: '7px 14px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#ffffff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}
            >
              <RefreshCw size={14} className={healthLoading ? 'spin' : ''} /> Refresh
            </button>
          </div>

          {/* Table */}
          {ledgerLoading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>Loading notifications...</div>
          ) : notifications.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>No records found.</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #e2e8f0', color: '#64748b' }}>
                    <th style={{ padding: '10px 12px' }}>Event / Template</th>
                    <th style={{ padding: '10px 12px' }}>Recipient</th>
                    <th style={{ padding: '10px 12px' }}>Channel</th>
                    <th style={{ padding: '10px 12px' }}>Status</th>
                    <th style={{ padding: '10px 12px' }}>Attempts</th>
                    <th style={{ padding: '10px 12px' }}>Run / Sent At</th>
                    <th style={{ padding: '10px 12px' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {notifications.map((n) => (
                    <tr key={n.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '10px 12px' }}>
                        <div style={{ fontWeight: 600, color: '#1e293b' }}>{n.event_type || n.template_key}</div>
                        <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{n.title || n.template_key} (v{n.template_version})</div>
                      </td>
                      <td style={{ padding: '10px 12px', color: '#334155' }}>
                        {n.recipient_address || `User ID: ${n.recipient_user_id?.slice(0, 8)}`}
                      </td>
                      <td style={{ padding: '10px 12px' }}>
                        <span style={{ textTransform: 'uppercase', fontSize: '0.70rem', fontWeight: 700, padding: '2px 6px', borderRadius: '4px', background: n.channel === 'email' ? '#e0f2fe' : '#fef3c7', color: n.channel === 'email' ? '#0369a1' : '#b45309' }}>
                          {n.channel}
                        </span>
                      </td>
                      <td style={{ padding: '10px 12px' }}>
                        <span
                          style={{
                            padding: '3px 8px',
                            borderRadius: '12px',
                            fontWeight: 700,
                            fontSize: '0.75rem',
                            background:
                              n.status === 'sent' ? '#dcfce7' :
                              n.status === 'dead' ? '#fee2e2' :
                              n.status === 'retrying' ? '#fef9c3' : '#f1f5f9',
                            color:
                              n.status === 'sent' ? '#166534' :
                              n.status === 'dead' ? '#991b1b' :
                              n.status === 'retrying' ? '#854d0e' : '#475569',
                          }}
                        >
                          {n.status}
                        </span>
                        {n.last_error && (
                          <div style={{ fontSize: '0.70rem', color: '#ef4444', marginTop: '2px', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={n.last_error}>
                            {n.last_error}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '10px 12px' }}>{n.attempts} / {n.max_attempts}</td>
                      <td style={{ padding: '10px 12px', color: '#64748b' }}>
                        {new Date(n.sent_at || n.run_at || n.created_at).toLocaleString()}
                      </td>
                      <td style={{ padding: '10px 12px' }}>
                        {n.status === 'dead' ? (
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <button
                              onClick={() => handleRequeue(n.id)}
                              title="Requeue Job"
                              style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid #cbd5e1', background: '#f8fafc', cursor: 'pointer', color: '#0284c7' }}
                            >
                              <RotateCcw size={14} />
                            </button>
                            <button
                              onClick={() => handleDiscard(n.id)}
                              title="Discard Job"
                              style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid #cbd5e1', background: '#f8fafc', cursor: 'pointer', color: '#ef4444' }}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        ) : (
                          <span style={{ color: '#94a3b8' }}>—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Subtab 3: Template Studio ── */}
      {subTab === 'templates' && (
        <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '20px' }}>
          {/* Left: Template Catalog List */}
          <div style={{ background: '#ffffff', borderRadius: '10px', border: '1px solid #e2e8f0', padding: '16px', maxHeight: '600px', overflowY: 'auto' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, margin: '0 0 12px 0', color: '#0b1f3a' }}>Catalog Templates</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {templates.map((tpl) => (
                <div
                  key={tpl.key}
                  onClick={() => {
                    setSelectedTemplate(tpl);
                    handlePreview(tpl.key);
                  }}
                  style={{
                    padding: '10px 12px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    background: selectedTemplate?.key === tpl.key ? '#e0f2fe' : '#f8fafc',
                    border: `1px solid ${selectedTemplate?.key === tpl.key ? '#0284c7' : '#e2e8f0'}`,
                  }}
                >
                  <div style={{ fontWeight: 600, fontSize: '0.85rem', color: '#0f172a' }}>{tpl.key}</div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b' }}>{tpl.category} &bull; v{tpl.version || 1}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Preview & Test Send */}
          <div style={{ background: '#ffffff', borderRadius: '10px', border: '1px solid #e2e8f0', padding: '24px' }}>
            {selectedTemplate ? (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#0b1f3a' }}>{selectedTemplate.key}</h3>
                    <p style={{ margin: '4px 0 0 0', fontSize: '0.82rem', color: '#64748b' }}>{selectedTemplate.description}</p>
                  </div>
                  <button
                    onClick={() => handleTestSend(selectedTemplate.key)}
                    style={{
                      background: 'var(--color-navy-dark, #0b1f3a)',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '8px 16px',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    <Send size={14} /> Send Test to Myself
                  </button>
                </div>

                {testSendSuccess && (
                  <div style={{ padding: '10px 14px', background: '#dcfce7', color: '#166534', borderRadius: '6px', marginBottom: '16px', fontSize: '0.85rem' }}>
                    Test email dispatched successfully to your account!
                  </div>
                )}

                {/* Rendered Preview Box */}
                <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
                  <div style={{ background: '#f1f5f9', padding: '8px 14px', borderBottom: '1px solid #e2e8f0', fontSize: '0.80rem', fontWeight: 600, color: '#475569' }}>
                    Subject: {previewData?.subject || selectedTemplate.subject || 'Preview'}
                  </div>
                  <div style={{ padding: '20px', minHeight: '300px', maxHeight: '450px', overflowY: 'auto' }}>
                    {previewLoading ? (
                      <div style={{ textAlign: 'center', color: '#94a3b8' }}>Rendering preview...</div>
                    ) : previewData?.html ? (
                      <div dangerouslySetInnerHTML={{ __html: previewData.html }} />
                    ) : (
                      <pre style={{ fontSize: '0.85rem', color: '#334155', whiteSpace: 'pre-wrap' }}>
                        {selectedTemplate.body_text}
                      </pre>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', color: '#94a3b8' }}>Select a template to inspect.</div>
            )}
          </div>
        </div>
      )}

      {/* ── Subtab 4: Suppressions ── */}
      {subTab === 'suppressions' && (
        <div style={{ background: '#ffffff', borderRadius: '10px', border: '1px solid #e2e8f0', padding: '24px' }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '1.1rem', fontWeight: 700, color: '#0b1f3a' }}>Recipient Suppression List</h3>
          <p style={{ color: '#64748b', fontSize: '0.88rem', marginBottom: '20px' }}>
            Addresses on this list are automatically blocked from receiving emails to prevent spam complaints and ISP reputation penalties.
          </p>

          {/* Add form */}
          <form onSubmit={handleAddSuppression} style={{ display: 'flex', gap: '10px', marginBottom: '24px' }}>
            <input
              type="email"
              placeholder="recipient@example.com"
              value={newSuppressionAddress}
              onChange={(e) => setNewSuppressionAddress(e.target.value)}
              required
              style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem', flex: 1 }}
            />
            <input
              type="text"
              placeholder="Reason (e.g. Hard bounce, spam complaint)"
              value={newSuppressionReason}
              onChange={(e) => setNewSuppressionReason(e.target.value)}
              style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem', flex: 1 }}
            />
            <button
              type="submit"
              style={{ padding: '8px 18px', borderRadius: '6px', border: 'none', background: '#0b1f3a', color: '#ffffff', fontWeight: 600, cursor: 'pointer', fontSize: '0.85rem' }}
            >
              Add to Suppression
            </button>
          </form>

          {/* Table */}
          {suppressions.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#94a3b8', padding: '30px' }}>No suppressed addresses.</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e2e8f0', color: '#64748b' }}>
                  <th style={{ padding: '8px 12px' }}>Email Address</th>
                  <th style={{ padding: '8px 12px' }}>Reason</th>
                  <th style={{ padding: '8px 12px' }}>Source</th>
                  <th style={{ padding: '8px 12px' }}>Suppressed At</th>
                  <th style={{ padding: '8px 12px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {suppressions.map((s) => (
                  <tr key={s.address} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '8px 12px', fontWeight: 600, color: '#1e293b' }}>{s.address}</td>
                    <td style={{ padding: '8px 12px', color: '#64748b' }}>{s.reason}</td>
                    <td style={{ padding: '8px 12px' }}>
                      <span style={{ fontSize: '0.72rem', padding: '2px 6px', background: '#f1f5f9', borderRadius: '4px' }}>
                        {s.source}
                      </span>
                    </td>
                    <td style={{ padding: '8px 12px', color: '#64748b' }}>{new Date(s.created_at).toLocaleDateString()}</td>
                    <td style={{ padding: '8px 12px' }}>
                      <button
                        onClick={() => handleRemoveSuppression(s.address)}
                        style={{ border: 'none', background: 'none', color: '#ef4444', cursor: 'pointer' }}
                        title="Remove suppression"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
};
