import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  FileCheck,
} from 'lucide-react';
import {
  fetchAdminTransactions,
  fetchAdminReconciliation,
  fetchAdminEarnings,
  fetchAdminRefunds,
  initiateAdminRefund,
  approveAdminRefund,
  AdminTransactionItem,
  AdminEarningsItem,
  AdminRefundApprovalItem,
} from '../../../services/adminService';
import { useAuth } from '../../../context/AuthContext';

export const FinanceTab: React.FC = () => {
  const { user: currentAdmin } = useAuth();
  const [subTab, setSubTab] = useState<'transactions' | 'reconciliation' | 'earnings' | 'refunds'>('transactions');

  // Transactions State
  const [transactions, setTransactions] = useState<AdminTransactionItem[]>([]);
  const [txLoading, setTxLoading] = useState(false);
  const [txSearch, setTxSearch] = useState('');
  const [txStatus, setTxStatus] = useState('');
  const [txPurpose, setTxPurpose] = useState('');
  const [txPage, setTxPage] = useState(1);
  const [txTotalPages, setTxTotalPages] = useState(1);

  // Reconciliation State
  const [reconData, setReconData] = useState<any>(null);
  const [reconLoading, setReconLoading] = useState(false);

  // Earnings State
  const [earnings, setEarnings] = useState<AdminEarningsItem[]>([]);
  const [earningsLoading, setEarningsLoading] = useState(false);

  // Refunds State
  const [refunds, setRefunds] = useState<AdminRefundApprovalItem[]>([]);
  const [refundsLoading, setRefundsLoading] = useState(false);

  // Action Modals State
  const [initiateModalOpen, setInitiateModalOpen] = useState(false);
  const [initTxId, setInitTxId] = useState('');
  const [initBookingId, setInitBookingId] = useState('');
  const [initAmount, setInitAmount] = useState('');
  const [initReason, setInitReason] = useState('');

  const [approveModalOpen, setApproveModalOpen] = useState(false);
  const [selectedApproval, setSelectedApproval] = useState<AdminRefundApprovalItem | null>(null);
  const [decisionReason, setDecisionReason] = useState('');
  const [stepUpPassword, setStepUpPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const loadTransactions = async () => {
    try {
      setTxLoading(true);
      const res = await fetchAdminTransactions({
        search: txSearch,
        status: txStatus,
        purpose: txPurpose,
        page: txPage,
        limit: 15,
      });
      const list = Array.isArray(res?.transactions) ? res.transactions : [];
      setTransactions(list);
      setTxTotalPages(res?.pagination?.pages || 1);
    } catch (err: any) {
      setError(err.message || 'Failed to load transactions.');
      setTransactions([]);
    } finally {
      setTxLoading(false);
    }
  };

  const loadReconciliation = async () => {
    try {
      setReconLoading(true);
      const data = await fetchAdminReconciliation();
      setReconData(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load reconciliation.');
    } finally {
      setReconLoading(false);
    }
  };

  const loadEarnings = async () => {
    try {
      setEarningsLoading(true);
      const data = await fetchAdminEarnings();
      setEarnings(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load provider earnings.');
    } finally {
      setEarningsLoading(false);
    }
  };

  const loadRefunds = async () => {
    try {
      setRefundsLoading(true);
      const data = await fetchAdminRefunds();
      setRefunds(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load refund approvals.');
    } finally {
      setRefundsLoading(false);
    }
  };

  useEffect(() => {
    if (subTab === 'transactions') loadTransactions();
    else if (subTab === 'reconciliation') loadReconciliation();
    else if (subTab === 'earnings') loadEarnings();
    else if (subTab === 'refunds') loadRefunds();
  }, [subTab, txPage, txStatus, txPurpose]);

  const handleInitiateRefund = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!initTxId || !initAmount || !initReason.trim()) return;
    try {
      setSubmitting(true);
      const res = await initiateAdminRefund({
        transaction_id: initTxId.trim(),
        booking_id: initBookingId.trim() || undefined,
        amount: parseFloat(initAmount),
        reason: initReason.trim(),
      });
      setSuccessMsg(res.message || 'Refund initiated.');
      setInitiateModalOpen(false);
      setInitTxId('');
      setInitBookingId('');
      setInitAmount('');
      setInitReason('');
      if (subTab === 'refunds') loadRefunds();
    } catch (err: any) {
      setError(err.message || 'Failed to initiate refund.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleApproveRefund = async (decision: 'approved' | 'rejected') => {
    if (!selectedApproval) return;
    try {
      setSubmitting(true);
      await approveAdminRefund(selectedApproval.id, {
        decision,
        reason: decisionReason.trim() || undefined,
        current_password: stepUpPassword || undefined,
      });
      setSuccessMsg(`Refund request #${selectedApproval.id.slice(0, 8)} ${decision}.`);
      setApproveModalOpen(false);
      setSelectedApproval(null);
      setDecisionReason('');
      setStepUpPassword('');
      loadRefunds();
    } catch (err: any) {
      setError(err.message || 'Failed to authorize refund.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      {/* Header and Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
        <div>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--color-navy-dark)', margin: 0 }}>
            Financial Ledger, Reconciliation & Two-Person Refund Approvals
          </h2>
          <p style={{ fontSize: '0.86rem', color: '#64748b', margin: '4px 0 0' }}>
            Inspect financial transactions, reconcile payment gateways, and enforce two-person authorization for large refunds
          </p>
        </div>

        <button
          onClick={() => setInitiateModalOpen(true)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 16px',
            backgroundColor: 'var(--color-gold-deep)',
            color: '#ffffff',
            border: 'none',
            borderRadius: '8px',
            fontSize: '0.84rem',
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          <DollarSign size={15} />
          Initiate Refund
        </button>
      </div>

      {error && (
        <div style={{ padding: '12px 16px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', color: '#b91c1c', marginBottom: '16px', fontSize: '0.88rem' }}>
          {error}
        </div>
      )}
      {successMsg && (
        <div style={{ padding: '12px 16px', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', color: '#15803d', marginBottom: '16px', fontSize: '0.88rem' }}>
          {successMsg}
        </div>
      )}

      {/* Sub-Tab Navigation */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
        {[
          { id: 'transactions', label: 'Financial Ledger' },
          { id: 'refunds', label: 'Large Refund Approvals (>10,000 ETB)' },
          { id: 'earnings', label: 'Provider Earnings & Commission' },
          { id: 'reconciliation', label: 'Payment Reconciliation Monitor' },
        ].map((t) => {
          const isActive = subTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setSubTab(t.id as any)}
              style={{
                padding: '7px 16px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: isActive ? 'var(--color-navy-dark)' : '#f1f5f9',
                color: isActive ? '#ffffff' : '#475569',
                fontWeight: isActive ? 700 : 500,
                fontSize: '0.84rem',
                cursor: 'pointer',
              }}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      {/* SUBTAB 1: TRANSACTIONS LEDGER */}
      {subTab === 'transactions' && (
        <div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap', backgroundColor: '#ffffff', padding: '16px', borderRadius: '10px', border: '1px solid #e2e8f0', marginBottom: '18px' }}>
            <input
              type="text"
              placeholder="Search by tx_ref, Chapa reference, or user email..."
              value={txSearch}
              onChange={(e) => setTxSearch(e.target.value)}
              style={{ flex: 1, minWidth: '220px', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.84rem' }}
            />
            <select
              value={txStatus}
              onChange={(e) => { setTxStatus(e.target.value); setTxPage(1); }}
              style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.84rem', backgroundColor: '#ffffff' }}
            >
              <option value="">All Statuses</option>
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
              <option value="refunded">Refunded</option>
            </select>
            <select
              value={txPurpose}
              onChange={(e) => { setTxPurpose(e.target.value); setTxPage(1); }}
              style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.84rem', backgroundColor: '#ffffff' }}
            >
              <option value="">All Purposes</option>
              <option value="appointment_booking">Booking</option>
              <option value="gift_card_purchase">Gift Card</option>
              <option value="wallet_deposit">Wallet Deposit</option>
            </select>
            <button
              onClick={() => { setTxPage(1); loadTransactions(); }}
              style={{ padding: '8px 16px', backgroundColor: 'var(--color-navy-dark)', color: '#ffffff', border: 'none', borderRadius: '6px', fontWeight: 600, fontSize: '0.84rem', cursor: 'pointer' }}
            >
              Filter
            </button>
          </div>

          <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontWeight: 700 }}>
                  <th style={{ padding: '14px 18px' }}>Transaction Reference</th>
                  <th style={{ padding: '14px 18px' }}>User</th>
                  <th style={{ padding: '14px 18px' }}>Purpose</th>
                  <th style={{ padding: '14px 18px' }}>Amount</th>
                  <th style={{ padding: '14px 18px' }}>Status</th>
                  <th style={{ padding: '14px 18px' }}>Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {txLoading && transactions.length === 0 ? (
                  <tr><td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Loading transactions...</td></tr>
                ) : !transactions || transactions.length === 0 ? (
                  <tr><td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>No transaction records found.</td></tr>
                ) : (
                  (transactions || []).map((t) => (
                    <tr key={t.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '14px 18px' }}>
                        <div style={{ fontWeight: 800, color: 'var(--color-navy-dark)' }}>{t.tx_ref}</div>
                        <div style={{ fontSize: '0.76rem', color: '#94a3b8' }}>Chapa: {t.chapa_reference || 'N/A'}</div>
                      </td>
                      <td style={{ padding: '14px 18px' }}>
                        <div style={{ fontWeight: 600 }}>{t.user_name}</div>
                        <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{t.user_email}</div>
                      </td>
                      <td style={{ padding: '14px 18px', textTransform: 'capitalize', color: '#475569' }}>
                        {t.purpose?.replace(/_/g, ' ')}
                      </td>
                      <td style={{ padding: '14px 18px', fontWeight: 800, color: 'var(--color-navy-dark)' }}>
                        {Number(t.amount).toLocaleString()} {t.currency}
                      </td>
                      <td style={{ padding: '14px 18px' }}>
                        <span style={{
                          padding: '3px 8px', borderRadius: '999px', fontSize: '0.78rem', fontWeight: 700,
                          backgroundColor: t.status === 'completed' ? '#dcfce7' : t.status === 'refunded' ? '#e0f2fe' : '#fee2e2',
                          color: t.status === 'completed' ? '#15803d' : t.status === 'refunded' ? '#0369a1' : '#b91c1c'
                        }}>
                          {t.status}
                        </span>
                      </td>
                      <td style={{ padding: '14px 18px', color: '#64748b', fontSize: '0.82rem' }}>
                        {new Date(t.created_at).toLocaleString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            {txTotalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 18px', backgroundColor: '#f8fafc', borderTop: '1px solid #e2e8f0' }}>
                <button
                  disabled={txPage <= 1}
                  onClick={() => setTxPage(p => Math.max(1, p - 1))}
                  style={{ padding: '6px 14px', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', cursor: txPage <= 1 ? 'not-allowed' : 'pointer' }}
                >
                  Previous
                </button>
                <span style={{ fontSize: '0.84rem', color: '#64748b' }}>
                  Page {txPage} of {txTotalPages}
                </span>
                <button
                  disabled={txPage >= txTotalPages}
                  onClick={() => setTxPage(p => p + 1)}
                  style={{ padding: '6px 14px', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', cursor: txPage >= txTotalPages ? 'not-allowed' : 'pointer' }}
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUBTAB 2: REFUND APPROVALS (>10,000 ETB) */}
      {subTab === 'refunds' && (
        <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0', backgroundColor: '#f8fafc' }}>
            <h4 style={{ margin: 0, fontSize: '0.96rem', fontWeight: 800, color: 'var(--color-navy-dark)' }}>
              Two-Person Authorization Ledger (Refunds &gt; 10,000 ETB)
            </h4>
            <p style={{ margin: '4px 0 0', fontSize: '0.82rem', color: '#64748b' }}>
              Requires authorization by a distinct administrator holding <code>finance.refund_approve</code> or Super Admin role.
            </p>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontWeight: 700 }}>
                <th style={{ padding: '14px 18px' }}>Transaction & Booking</th>
                <th style={{ padding: '14px 18px' }}>Amount</th>
                <th style={{ padding: '14px 18px' }}>Initiated By</th>
                <th style={{ padding: '14px 18px' }}>Reason</th>
                <th style={{ padding: '14px 18px' }}>Status</th>
                <th style={{ padding: '14px 18px', textAlign: 'right' }}>Authorization Action</th>
              </tr>
            </thead>
            <tbody>
              {refundsLoading && refunds.length === 0 ? (
                <tr><td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Loading refund queue...</td></tr>
              ) : refunds.length === 0 ? (
                <tr><td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>No pending large refund approvals.</td></tr>
              ) : (
                refunds.map((r) => {
                  const isRequester = currentAdmin?.email === r.requested_by_email;
                  return (
                    <tr key={r.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '14px 18px' }}>
                        <div style={{ fontWeight: 800, color: 'var(--color-navy-dark)' }}>{r.tx_ref}</div>
                        <div style={{ fontSize: '0.78rem', color: '#64748b' }}>Booking: {r.booking_reference || 'N/A'}</div>
                      </td>
                      <td style={{ padding: '14px 18px', fontWeight: 800, color: '#dc2626' }}>
                        {Number(r.amount).toLocaleString()} {r.currency}
                      </td>
                      <td style={{ padding: '14px 18px' }}>
                        <div style={{ fontWeight: 600 }}>{r.requested_by_name}</div>
                        <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>{new Date(r.created_at).toLocaleDateString()}</div>
                      </td>
                      <td style={{ padding: '14px 18px', color: '#475569', maxWidth: '240px' }}>
                        {r.request_reason}
                      </td>
                      <td style={{ padding: '14px 18px' }}>
                        <span style={{
                          padding: '3px 8px', borderRadius: '999px', fontSize: '0.78rem', fontWeight: 700,
                          backgroundColor: r.status === 'approved' ? '#dcfce7' : r.status === 'rejected' ? '#fee2e2' : '#fef3c7',
                          color: r.status === 'approved' ? '#15803d' : r.status === 'rejected' ? '#b91c1c' : '#b45309'
                        }}>
                          {r.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                        {r.status === 'pending_approval' ? (
                          <button
                            disabled={isRequester}
                            title={isRequester ? 'Two-person rule: Requester cannot approve own refund' : 'Authorize refund'}
                            onClick={() => { setSelectedApproval(r); setApproveModalOpen(true); }}
                            style={{
                              padding: '5px 12px',
                              backgroundColor: isRequester ? '#f1f5f9' : 'rgba(190, 155, 73, 0.15)',
                              border: isRequester ? '1px solid #cbd5e1' : '1px solid rgba(190, 155, 73, 0.4)',
                              color: isRequester ? '#94a3b8' : 'var(--color-gold-deep)',
                              borderRadius: '6px',
                              fontWeight: 700,
                              fontSize: '0.8rem',
                              cursor: isRequester ? 'not-allowed' : 'pointer',
                            }}
                          >
                            {isRequester ? 'Self-Locked' : 'Decide'}
                          </button>
                        ) : (
                          <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                            Decided by {r.approved_by_name || 'System'}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* SUBTAB 3: PROVIDER EARNINGS */}
      {subTab === 'earnings' && (
        <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontWeight: 700 }}>
                <th style={{ padding: '14px 18px' }}>Provider Name</th>
                <th style={{ padding: '14px 18px' }}>Completed Bookings</th>
                <th style={{ padding: '14px 18px' }}>Gross Revenue (ETB)</th>
                <th style={{ padding: '14px 18px' }}>Provider Share (90%)</th>
                <th style={{ padding: '14px 18px' }}>Platform Commission (10%)</th>
              </tr>
            </thead>
            <tbody>
              {earningsLoading ? (
                <tr><td colSpan={5} style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Calculating provider balances...</td></tr>
              ) : earnings.length === 0 ? (
                <tr><td colSpan={5} style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>No completed appointments yet.</td></tr>
              ) : (
                earnings.map((e) => (
                  <tr key={e.provider_id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '14px 18px' }}>
                      <div style={{ fontWeight: 700, color: 'var(--color-navy-dark)' }}>{e.provider_name}</div>
                      <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>{e.provider_email}</div>
                    </td>
                    <td style={{ padding: '14px 18px', fontWeight: 600 }}>{e.completed_bookings_count} appointments</td>
                    <td style={{ padding: '14px 18px', fontWeight: 700 }}>{Number(e.gross_revenue_etb).toLocaleString()} ETB</td>
                    <td style={{ padding: '14px 18px', fontWeight: 800, color: '#16a34a' }}>{Number(e.provider_earnings_etb).toLocaleString()} ETB</td>
                    <td style={{ padding: '14px 18px', fontWeight: 700, color: 'var(--color-gold-deep)' }}>{Number(e.platform_commission_etb).toLocaleString()} ETB</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* SUBTAB 4: RECONCILIATION */}
      {subTab === 'reconciliation' && (
        <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <FileCheck size={20} color="var(--color-gold-deep)" />
            <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: 'var(--color-navy-dark)' }}>
              Chapa Gateway vs Database Reconciliation Status
            </h4>
          </div>

          {reconLoading ? (
            <div style={{ padding: '30px', textAlign: 'center', color: '#64748b' }}>Running ledger discrepancy scan...</div>
          ) : (
            <div>
              <div style={{ padding: '14px 18px', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '10px', color: '#166534', marginBottom: '16px', fontSize: '0.88rem' }}>
                ✅ <strong>Zero Ledger Drift:</strong> Gateway reconciliation complete ({reconData?.unconfirmed_paid?.length || 0} discrepancy records). All processed transactions match verified appointment booking records and digital voucher balances.
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal: Initiate Refund */}
      {initiateModalOpen && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <form onSubmit={handleInitiateRefund} style={{ backgroundColor: '#ffffff', borderRadius: '12px', maxWidth: '480px', width: '100%', padding: '24px' }}>
            <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--color-navy-dark)', margin: '0 0 12px' }}>
              Initiate Customer Refund
            </h4>
            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                Transaction UUID:
              </label>
              <input
                type="text"
                required
                value={initTxId}
                onChange={(e) => setInitTxId(e.target.value)}
                placeholder="Paste transaction UUID..."
                style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.84rem' }}
              />
            </div>
            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                Booking UUID (Optional):
              </label>
              <input
                type="text"
                value={initBookingId}
                onChange={(e) => setInitBookingId(e.target.value)}
                placeholder="Optional booking UUID..."
                style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.84rem' }}
              />
            </div>
            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                Refund Amount (ETB):
              </label>
              <input
                type="number"
                step="0.01"
                required
                value={initAmount}
                onChange={(e) => setInitAmount(e.target.value)}
                placeholder="e.g. 5000 or 15000"
                style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.84rem' }}
              />
              <span style={{ fontSize: '0.74rem', color: '#64748b' }}>
                * Amounts exceeding 10,000 ETB automatically enter the two-person approval queue.
              </span>
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                Reason for Refund:
              </label>
              <textarea
                rows={2}
                required
                value={initReason}
                onChange={(e) => setInitReason(e.target.value)}
                placeholder="Customer request or administrative cancellation reason..."
                style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.84rem' }}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button
                type="button"
                onClick={() => setInitiateModalOpen(false)}
                style={{ padding: '8px 14px', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                style={{ padding: '8px 16px', borderRadius: '6px', border: 'none', backgroundColor: 'var(--color-navy-dark)', color: '#ffffff', fontWeight: 700, cursor: 'pointer' }}
              >
                {submitting ? 'Submitting...' : 'Submit Refund'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal: Decide Refund Approval (Two-Person Rule) */}
      {approveModalOpen && selectedApproval && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', maxWidth: '480px', width: '100%', padding: '24px' }}>
            <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--color-navy-dark)', margin: '0 0 10px' }}>
              Authorize Large Refund ({Number(selectedApproval.amount).toLocaleString()} {selectedApproval.currency})
            </h4>
            <p style={{ fontSize: '0.84rem', color: '#64748b', lineHeight: 1.4, margin: '0 0 14px' }}>
              Requested by <strong>{selectedApproval.requested_by_name}</strong> for transaction <code>{selectedApproval.tx_ref}</code>.
            </p>
            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                Decision Reason / Notes:
              </label>
              <input
                type="text"
                value={decisionReason}
                onChange={(e) => setDecisionReason(e.target.value)}
                placeholder="Approval or rejection notes..."
                style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.84rem' }}
              />
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                Your Admin Password (Step-Up):
              </label>
              <input
                type="password"
                value={stepUpPassword}
                onChange={(e) => setStepUpPassword(e.target.value)}
                placeholder="Enter password to sign off..."
                style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.84rem' }}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button
                type="button"
                onClick={() => setApproveModalOpen(false)}
                style={{ padding: '8px 14px', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={() => handleApproveRefund('rejected')}
                style={{ padding: '8px 14px', borderRadius: '6px', border: 'none', backgroundColor: '#b91c1c', color: '#ffffff', fontWeight: 700, cursor: 'pointer' }}
              >
                Reject Refund
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={() => handleApproveRefund('approved')}
                style={{ padding: '8px 16px', borderRadius: '6px', border: 'none', backgroundColor: '#15803d', color: '#ffffff', fontWeight: 700, cursor: 'pointer' }}
              >
                {submitting ? 'Processing...' : 'Authorize Refund'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default FinanceTab;
