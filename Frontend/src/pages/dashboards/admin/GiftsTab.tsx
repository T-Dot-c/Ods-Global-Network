import React, { useState, useEffect } from 'react';
import {
  RefreshCw,
  Eye,
  KeyRound,
} from 'lucide-react';
import {
  fetchAdminGifts,
  fetchAdminGiftDetail,
  cancelAdminGift,
  extendAdminGift,
  revealAdminGiftCode,
  AdminGiftItem,
  AdminGiftDetail,
} from '../../../services/adminService';

export const GiftsTab: React.FC = () => {
  const [gifts, setGifts] = useState<AdminGiftItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [statusFilter, setStatusFilter] = useState('');
  const [senderEmail, setSenderEmail] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Detail Modal State
  const [selectedGiftId, setSelectedGiftId] = useState<string | null>(null);
  const [giftDetail, setGiftDetail] = useState<AdminGiftDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Reveal Code State
  const [revealModalOpen, setRevealModalOpen] = useState(false);
  const [revealReason, setRevealReason] = useState('');
  const [revealedCode, setRevealedCode] = useState<string | null>(null);

  // Cancel & Extend Modals
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [extendModalOpen, setExtendModalOpen] = useState(false);
  const [newExpiryDate, setNewExpiryDate] = useState('');
  const [extendReason, setExtendReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadGifts = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetchAdminGifts({
        status: statusFilter,
        sender_email: senderEmail,
        recipient_email: recipientEmail,
        page,
        limit: 15,
      });
      setGifts(res.gifts);
      setTotalPages(res.pagination?.pages || 1);
    } catch (err: any) {
      setError(err.message || 'Failed to load gift cards.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGifts();
  }, [page, statusFilter]);

  const openDetail = async (id: string) => {
    setSelectedGiftId(id);
    setRevealedCode(null);
    setDetailLoading(true);
    try {
      const data = await fetchAdminGiftDetail(id);
      setGiftDetail(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch gift card details.');
    } finally {
      setDetailLoading(false);
    }
  };

  const handleRevealCode = async () => {
    if (!selectedGiftId || !revealReason.trim()) return;
    try {
      setSubmitting(true);
      const code = await revealAdminGiftCode(selectedGiftId, revealReason.trim());
      setRevealedCode(code);
      setSuccessMsg('Voucher code unmasked. Action has been logged to the audit ledger.');
      setRevealModalOpen(false);
      setRevealReason('');
    } catch (err: any) {
      setError(err.message || 'Failed to reveal redemption code.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelGift = async () => {
    if (!selectedGiftId || !cancelReason.trim()) return;
    try {
      setSubmitting(true);
      await cancelAdminGift(selectedGiftId, cancelReason.trim());
      setSuccessMsg('Gift card cancelled.');
      setCancelModalOpen(false);
      setCancelReason('');
      loadGifts();
      if (selectedGiftId) openDetail(selectedGiftId);
    } catch (err: any) {
      setError(err.message || 'Failed to cancel gift card.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleExtendGift = async () => {
    if (!selectedGiftId || !newExpiryDate) return;
    try {
      setSubmitting(true);
      await extendAdminGift(selectedGiftId, newExpiryDate, extendReason.trim());
      setSuccessMsg('Gift card expiration date extended.');
      setExtendModalOpen(false);
      setNewExpiryDate('');
      setExtendReason('');
      loadGifts();
      if (selectedGiftId) openDetail(selectedGiftId);
    } catch (err: any) {
      setError(err.message || 'Failed to extend expiration.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
        <div>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--color-navy-dark)', margin: 0 }}>
            Digital Gift Vouchers & Audited Code Reveal
          </h2>
          <p style={{ fontSize: '0.86rem', color: '#64748b', margin: '4px 0 0' }}>
            Inspect voucher balances, extend validity, cancel unredeemed cards, and perform audited code reveals
          </p>
        </div>

        <button
          onClick={loadGifts}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 16px',
            backgroundColor: '#ffffff',
            border: '1px solid #cbd5e1',
            borderRadius: '8px',
            fontSize: '0.84rem',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Refresh
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

      {/* Filter Bar */}
      <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap', backgroundColor: '#ffffff', padding: '16px', borderRadius: '10px', border: '1px solid #e2e8f0', marginBottom: '20px' }}>
        <input
          type="text"
          placeholder="Filter by sender email..."
          value={senderEmail}
          onChange={(e) => setSenderEmail(e.target.value)}
          style={{ flex: 1, minWidth: '180px', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.84rem' }}
        />
        <input
          type="text"
          placeholder="Filter by recipient email..."
          value={recipientEmail}
          onChange={(e) => setRecipientEmail(e.target.value)}
          style={{ flex: 1, minWidth: '180px', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.84rem' }}
        />

        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.84rem', backgroundColor: '#ffffff' }}
        >
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="redeemed">Redeemed</option>
          <option value="expired">Expired</option>
          <option value="cancelled">Cancelled</option>
        </select>

        <button
          onClick={() => { setPage(1); loadGifts(); }}
          style={{ padding: '8px 16px', backgroundColor: 'var(--color-navy-dark)', color: '#ffffff', border: 'none', borderRadius: '6px', fontWeight: 600, fontSize: '0.84rem', cursor: 'pointer' }}
        >
          Search
        </button>
      </div>

      {/* Gifts Table */}
      <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
          <thead>
            <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontWeight: 700 }}>
              <th style={{ padding: '14px 18px' }}>Masked Voucher Code</th>
              <th style={{ padding: '14px 18px' }}>Purchaser / Sender</th>
              <th style={{ padding: '14px 18px' }}>Recipient</th>
              <th style={{ padding: '14px 18px' }}>Initial Amount</th>
              <th style={{ padding: '14px 18px' }}>Current Balance</th>
              <th style={{ padding: '14px 18px' }}>Status</th>
              <th style={{ padding: '14px 18px', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && gifts.length === 0 ? (
              <tr><td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Loading gift cards...</td></tr>
            ) : gifts.length === 0 ? (
              <tr><td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>No gift cards found.</td></tr>
            ) : (
              gifts.map((g) => (
                <tr key={g.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '14px 18px' }}>
                    <code style={{ fontWeight: 800, color: 'var(--color-navy-dark)', backgroundColor: '#f1f5f9', padding: '3px 8px', borderRadius: '4px' }}>
                      {g.code}
                    </code>
                    <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '2px' }}>Occasion: {g.occasion}</div>
                  </td>
                  <td style={{ padding: '14px 18px' }}>
                    <div style={{ fontWeight: 600 }}>{g.purchaser_name}</div>
                    <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{g.purchaser_email}</div>
                  </td>
                  <td style={{ padding: '14px 18px' }}>
                    <div style={{ fontWeight: 600 }}>{g.recipient_name || 'Unassigned'}</div>
                    <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{g.recipient_email || 'Direct Claim'}</div>
                  </td>
                  <td style={{ padding: '14px 18px', color: '#475569' }}>
                    {Number(g.initial_amount).toLocaleString()} {g.currency}
                  </td>
                  <td style={{ padding: '14px 18px', fontWeight: 800, color: 'var(--color-gold-deep)' }}>
                    {Number(g.balance).toLocaleString()} {g.currency}
                  </td>
                  <td style={{ padding: '14px 18px' }}>
                    <span style={{
                      padding: '3px 8px', borderRadius: '999px', fontSize: '0.78rem', fontWeight: 700,
                      backgroundColor: g.status === 'active' ? '#dcfce7' : g.status === 'redeemed' ? '#e0f2fe' : '#fee2e2',
                      color: g.status === 'active' ? '#15803d' : g.status === 'redeemed' ? '#0369a1' : '#b91c1c'
                    }}>
                      {g.status}
                    </span>
                  </td>
                  <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                    <button
                      onClick={() => openDetail(g.id)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '5px 12px',
                        backgroundColor: '#f1f5f9',
                        border: '1px solid #cbd5e1',
                        borderRadius: '6px',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      <Eye size={13} /> View
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

      {/* Gift Detail Modal */}
      {selectedGiftId && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ backgroundColor: '#ffffff', borderRadius: '14px', maxWidth: '650px', width: '100%', maxHeight: '90vh', overflowY: 'auto', padding: '28px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-navy-dark)', margin: 0 }}>
                  Digital Voucher Inspection
                </h3>
                <p style={{ color: '#64748b', fontSize: '0.84rem', margin: '4px 0 0' }}>
                  UUID: {selectedGiftId}
                </p>
              </div>
              <button
                onClick={() => { setSelectedGiftId(null); setGiftDetail(null); setRevealedCode(null); }}
                style={{ border: 'none', background: 'none', fontSize: '1.4rem', cursor: 'pointer', color: '#94a3b8' }}
              >
                ✕
              </button>
            </div>

            {detailLoading ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Loading voucher details...</div>
            ) : giftDetail ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {/* Code Display / Reveal Box */}
                <div style={{ padding: '16px 20px', borderRadius: '10px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span style={{ fontSize: '0.78rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>
                      Redemption Code
                    </span>
                    <div style={{ fontSize: '1.2rem', fontWeight: 800, color: revealedCode ? '#15803d' : 'var(--color-navy-dark)', fontFamily: 'monospace' }}>
                      {revealedCode || giftDetail.gift.code}
                    </div>
                  </div>
                  {!revealedCode && (
                    <button
                      onClick={() => setRevealModalOpen(true)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '8px 14px',
                        backgroundColor: '#fee2e2',
                        border: '1px solid #fca5a5',
                        color: '#b91c1c',
                        borderRadius: '6px',
                        fontWeight: 700,
                        fontSize: '0.82rem',
                        cursor: 'pointer',
                      }}
                    >
                      <KeyRound size={14} /> Unmask Code (Audited)
                    </button>
                  )}
                </div>

                {/* Details Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '14px', backgroundColor: '#f8fafc', padding: '16px', borderRadius: '10px' }}>
                  <div>
                    <span style={{ fontSize: '0.78rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Remaining Balance</span>
                    <div style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--color-gold-deep)' }}>
                      {Number(giftDetail.gift.balance).toLocaleString()} {giftDetail.gift.currency}
                    </div>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.78rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Expiry Date</span>
                    <div style={{ fontWeight: 600 }}>{new Date(giftDetail.gift.expiry_date).toLocaleDateString()}</div>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.78rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Purchaser</span>
                    <div>{giftDetail.gift.purchaser_name} ({giftDetail.gift.purchaser_email})</div>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.78rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Recipient</span>
                    <div>{giftDetail.gift.recipient_name || 'None'} ({giftDetail.gift.recipient_email || 'Direct claim'})</div>
                  </div>
                </div>

                {/* Management Actions */}
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  {giftDetail.gift.status === 'active' && (
                    <>
                      <button
                        onClick={() => setExtendModalOpen(true)}
                        style={{ padding: '8px 14px', backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '8px', fontWeight: 600, fontSize: '0.84rem', cursor: 'pointer' }}
                      >
                        Extend Expiration Date
                      </button>
                      <button
                        onClick={() => setCancelModalOpen(true)}
                        style={{ padding: '8px 14px', backgroundColor: '#fee2e2', border: '1px solid #fca5a5', color: '#b91c1c', borderRadius: '8px', fontWeight: 700, fontSize: '0.84rem', cursor: 'pointer' }}
                      >
                        Cancel Voucher & Refund
                      </button>
                    </>
                  )}
                </div>

                {/* Redemptions Ledger */}
                <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '16px' }}>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--color-navy-dark)', marginBottom: '12px' }}>
                    Redemptions History ({giftDetail.redemptions?.length || 0})
                  </h4>
                  {giftDetail.redemptions?.length === 0 ? (
                    <span style={{ color: '#94a3b8', fontSize: '0.84rem' }}>No redemptions applied against this voucher.</span>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {giftDetail.redemptions.map((r) => (
                        <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.84rem' }}>
                          <div>
                            <span style={{ fontWeight: 700, color: '#15803d' }}>-{Number(r.amount).toLocaleString()} ETB</span>
                            <span style={{ color: '#64748b', marginLeft: '10px' }}>by {r.redeemer_name || r.redeemer_email || 'Customer'}</span>
                          </div>
                          <span style={{ color: '#94a3b8', fontSize: '0.78rem' }}>{new Date(r.redeemed_at).toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* Reveal Code Modal */}
      {revealModalOpen && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', maxWidth: '450px', width: '100%', padding: '24px' }}>
            <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#b91c1c', margin: '0 0 10px' }}>
              Authorize Voucher Code Reveal
            </h4>
            <p style={{ fontSize: '0.84rem', color: '#64748b', lineHeight: 1.4, margin: '0 0 14px' }}>
              Revealing an unmasked gift card claim code writes a permanent, high-priority audit record documenting your identity and timestamp.
            </p>
            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                Mandatory Specific Justification:
              </label>
              <textarea
                rows={3}
                required
                value={revealReason}
                onChange={(e) => setRevealReason(e.target.value)}
                placeholder="e.g. Customer lost email confirmation and requested phone verification support..."
                style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.84rem' }}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button
                type="button"
                onClick={() => setRevealModalOpen(false)}
                style={{ padding: '8px 14px', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submitting || !revealReason.trim()}
                onClick={handleRevealCode}
                style={{ padding: '8px 16px', borderRadius: '6px', border: 'none', backgroundColor: '#b91c1c', color: '#ffffff', fontWeight: 700, cursor: 'pointer' }}
              >
                {submitting ? 'Auditing & Revealing...' : 'Acknowledge & Reveal Code'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Extend Modal */}
      {extendModalOpen && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', maxWidth: '450px', width: '100%', padding: '24px' }}>
            <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--color-navy-dark)', margin: '0 0 10px' }}>
              Extend Voucher Expiration Date
            </h4>
            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                New Expiry Date:
              </label>
              <input
                type="date"
                required
                value={newExpiryDate}
                onChange={(e) => setNewExpiryDate(e.target.value)}
                style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.84rem' }}
              />
            </div>
            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                Reason for Extension:
              </label>
              <input
                type="text"
                value={extendReason}
                onChange={(e) => setExtendReason(e.target.value)}
                placeholder="Customer courtesy extension..."
                style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.84rem' }}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button
                type="button"
                onClick={() => setExtendModalOpen(false)}
                style={{ padding: '8px 14px', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submitting || !newExpiryDate}
                onClick={handleExtendGift}
                style={{ padding: '8px 16px', borderRadius: '6px', border: 'none', backgroundColor: 'var(--color-navy-dark)', color: '#ffffff', fontWeight: 700, cursor: 'pointer' }}
              >
                {submitting ? 'Updating...' : 'Save Expiry Date'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Modal */}
      {cancelModalOpen && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', maxWidth: '450px', width: '100%', padding: '24px' }}>
            <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#b91c1c', margin: '0 0 10px' }}>
              Cancel Gift Card & Refund Customer
            </h4>
            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                Cancellation Reason:
              </label>
              <textarea
                rows={2}
                required
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Reason for cancellation and balance return..."
                style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.84rem' }}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button
                type="button"
                onClick={() => setCancelModalOpen(false)}
                style={{ padding: '8px 14px', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submitting || !cancelReason.trim()}
                onClick={handleCancelGift}
                style={{ padding: '8px 16px', borderRadius: '6px', border: 'none', backgroundColor: '#b91c1c', color: '#ffffff', fontWeight: 700, cursor: 'pointer' }}
              >
                {submitting ? 'Cancelling...' : 'Confirm Cancellation'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default GiftsTab;
