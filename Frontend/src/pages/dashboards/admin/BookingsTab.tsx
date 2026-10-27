import React, { useState, useEffect } from 'react';
import {
  RefreshCw,
  Eye,
  Flag,
} from 'lucide-react';
import {
  fetchAdminBookings,
  fetchAdminBookingDetail,
  cancelAdminBooking,
  resolveAdminBookingConflict,
  disputeAdminBooking,
  AdminBookingItem,
  AdminBookingDetail,
} from '../../../services/adminService';

export const BookingsTab: React.FC = () => {
  const [bookings, setBookings] = useState<AdminBookingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Detail Modal State
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);
  const [bookingDetail, setBookingDetail] = useState<AdminBookingDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Action Modals State
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [refundOverride, setRefundOverride] = useState(false);
  const [overrideAmount, setOverrideAmount] = useState('');
  const [conflictModalOpen, setConflictModalOpen] = useState(false);
  const [conflictResolution, setConflictResolution] = useState<'refund' | 'confirm_new_slot'>('refund');
  const [conflictNotes, setConflictNotes] = useState('');
  const [disputeNotes, setDisputeNotes] = useState('');
  const [submittingAction, setSubmittingAction] = useState(false);

  const loadBookings = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetchAdminBookings({
        status: statusFilter,
        search,
        from_date: fromDate,
        to_date: toDate,
        page,
        limit: 15,
      });
      const list = Array.isArray(res?.bookings) ? res.bookings : [];
      setBookings(list);
      setTotalPages(res?.pagination?.pages || 1);
    } catch (err: any) {
      setError(err.message || 'Failed to load bookings ledger.');
      setBookings([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBookings();
  }, [page, statusFilter]);

  const openDetail = async (id: string) => {
    setSelectedBookingId(id);
    setDetailLoading(true);
    try {
      const data = await fetchAdminBookingDetail(id);
      setBookingDetail(data);
      setDisputeNotes(data.booking.dispute_notes || '');
    } catch (err: any) {
      setError(err.message || 'Failed to fetch booking details.');
    } finally {
      setDetailLoading(false);
    }
  };

  const handleCancelBooking = async () => {
    if (!selectedBookingId || !cancelReason.trim()) return;
    try {
      setSubmittingAction(true);
      await cancelAdminBooking(selectedBookingId, {
        reason: cancelReason.trim(),
        refund_override: refundOverride,
        refund_amount: refundOverride ? parseFloat(overrideAmount) : undefined,
      });
      setSuccessMsg('Booking cancelled and refund processed.');
      setCancelModalOpen(false);
      setCancelReason('');
      loadBookings();
      if (selectedBookingId) openDetail(selectedBookingId);
    } catch (err: any) {
      setError(err.message || 'Failed to cancel booking.');
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleResolveConflict = async () => {
    if (!selectedBookingId) return;
    try {
      setSubmittingAction(true);
      await resolveAdminBookingConflict(selectedBookingId, {
        resolution: conflictResolution,
        notes: conflictNotes.trim(),
      });
      setSuccessMsg(`Conflict resolved via ${conflictResolution}.`);
      setConflictModalOpen(false);
      loadBookings();
      if (selectedBookingId) openDetail(selectedBookingId);
    } catch (err: any) {
      setError(err.message || 'Failed to resolve conflict.');
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleToggleDispute = async (currentlyDisputed: boolean) => {
    if (!selectedBookingId) return;
    try {
      await disputeAdminBooking(selectedBookingId, !currentlyDisputed, disputeNotes);
      setSuccessMsg(`Booking dispute flag ${!currentlyDisputed ? 'raised' : 'cleared'}.`);
      if (selectedBookingId) openDetail(selectedBookingId);
      loadBookings();
    } catch (err: any) {
      setError(err.message || 'Failed to update dispute flag.');
    }
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
        <div>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--color-navy-dark)', margin: 0 }}>
            Appointment Bookings Ledger & Conflict Resolution
          </h2>
          <p style={{ fontSize: '0.86rem', color: '#64748b', margin: '4px 0 0' }}>
            Inspect scheduled healthcare appointments, resolve late-payment conflicts, and process cancellations
          </p>
        </div>

        <button
          onClick={loadBookings}
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
          placeholder="Search by Reference (ODS-BK-...), customer or provider..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ flex: 1, minWidth: '220px', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.84rem' }}
        />

        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.84rem', backgroundColor: '#ffffff' }}
        >
          <option value="">All Statuses</option>
          <option value="pending_payment">Pending Payment</option>
          <option value="confirmed">Confirmed</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
          <option value="payment_conflict">Payment Conflict (Attention)</option>
        </select>

        <input
          type="date"
          value={fromDate}
          onChange={(e) => setFromDate(e.target.value)}
          style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.84rem' }}
        />
        <input
          type="date"
          value={toDate}
          onChange={(e) => setToDate(e.target.value)}
          style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.84rem' }}
        />

        <button
          onClick={() => { setPage(1); loadBookings(); }}
          style={{ padding: '8px 16px', backgroundColor: 'var(--color-navy-dark)', color: '#ffffff', border: 'none', borderRadius: '6px', fontWeight: 600, fontSize: '0.84rem', cursor: 'pointer' }}
        >
          Filter
        </button>
      </div>

      {/* Bookings Table */}
      <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
          <thead>
            <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontWeight: 700 }}>
              <th style={{ padding: '14px 18px' }}>Reference & Service</th>
              <th style={{ padding: '14px 18px' }}>Schedule</th>
              <th style={{ padding: '14px 18px' }}>Customer</th>
              <th style={{ padding: '14px 18px' }}>Provider</th>
              <th style={{ padding: '14px 18px' }}>Amount</th>
              <th style={{ padding: '14px 18px' }}>Status</th>
              <th style={{ padding: '14px 18px', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && bookings.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
                  Loading bookings...
                </td>
              </tr>
            ) : !bookings || bookings.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
                  No bookings found matching filter criteria.
                </td>
              </tr>
            ) : (
              (bookings || []).map((b) => (
                <tr key={b.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '14px 18px' }}>
                    <div style={{ fontWeight: 800, color: 'var(--color-gold-deep)' }}>{b.reference}</div>
                    <div style={{ color: 'var(--color-navy-dark)', fontWeight: 600, fontSize: '0.82rem' }}>{b.service_title}</div>
                    {b.is_disputed && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', color: '#dc2626', fontSize: '0.74rem', fontWeight: 700 }}>
                        <Flag size={11} /> Disputed
                      </span>
                    )}
                  </td>
                  <td style={{ padding: '14px 18px' }}>
                    <div style={{ fontWeight: 600, color: 'var(--color-navy-dark)' }}>{b.appointment_date}</div>
                    <div style={{ color: '#64748b', fontSize: '0.8rem' }}>{b.start_time} - {b.end_time}</div>
                  </td>
                  <td style={{ padding: '14px 18px' }}>
                    <div style={{ fontWeight: 600 }}>{b.customer_name}</div>
                    <div style={{ color: '#64748b', fontSize: '0.8rem' }}>{b.customer_email}</div>
                  </td>
                  <td style={{ padding: '14px 18px' }}>
                    <div style={{ fontWeight: 600 }}>{b.provider_name}</div>
                    <div style={{ color: '#64748b', fontSize: '0.8rem' }}>{b.provider_email}</div>
                  </td>
                  <td style={{ padding: '14px 18px', fontWeight: 700, color: 'var(--color-navy-dark)' }}>
                    {Number(b.price_amount).toLocaleString()} {b.currency}
                  </td>
                  <td style={{ padding: '14px 18px' }}>
                    <span
                      style={{
                        padding: '3px 8px',
                        borderRadius: '999px',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        backgroundColor:
                          b.status === 'confirmed' ? '#dcfce7' :
                          b.status === 'completed' ? '#e0f2fe' :
                          b.status === 'payment_conflict' ? '#fee2e2' :
                          b.status === 'cancelled' ? '#f1f5f9' : '#fef3c7',
                        color:
                          b.status === 'confirmed' ? '#15803d' :
                          b.status === 'completed' ? '#0369a1' :
                          b.status === 'payment_conflict' ? '#b91c1c' :
                          b.status === 'cancelled' ? '#475569' : '#b45309',
                      }}
                    >
                      {b.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                    <button
                      onClick={() => openDetail(b.id)}
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
                      <Eye size={13} /> Inspect
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

      {/* Booking Detail Modal */}
      {selectedBookingId && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ backgroundColor: '#ffffff', borderRadius: '14px', maxWidth: '750px', width: '100%', maxHeight: '90vh', overflowY: 'auto', padding: '28px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-navy-dark)', margin: 0 }}>
                  Booking {bookingDetail?.booking.reference || 'Detail'}
                </h3>
                <p style={{ color: '#64748b', fontSize: '0.84rem', margin: '4px 0 0' }}>
                  ID: {selectedBookingId}
                </p>
              </div>
              <button
                onClick={() => { setSelectedBookingId(null); setBookingDetail(null); }}
                style={{ border: 'none', background: 'none', fontSize: '1.4rem', cursor: 'pointer', color: '#94a3b8' }}
              >
                ✕
              </button>
            </div>

            {detailLoading ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Loading booking record...</div>
            ) : bookingDetail ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {/* Status Alert if Payment Conflict */}
                {bookingDetail.booking.status === 'payment_conflict' && (
                  <div style={{ padding: '14px 18px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 800, color: '#991b1b', marginBottom: '2px' }}>
                        Late-Payment Slot Conflict
                      </div>
                      <div style={{ fontSize: '0.84rem', color: '#b91c1c' }}>
                        Customer completed payment after hold expiration, and the slot was taken.
                      </div>
                    </div>
                    <button
                      onClick={() => setConflictModalOpen(true)}
                      style={{ padding: '8px 14px', backgroundColor: '#dc2626', color: '#ffffff', border: 'none', borderRadius: '6px', fontWeight: 700, fontSize: '0.84rem', cursor: 'pointer' }}
                    >
                      Resolve Conflict
                    </button>
                  </div>
                )}

                {/* Details Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', backgroundColor: '#f8fafc', padding: '16px', borderRadius: '10px' }}>
                  <div>
                    <span style={{ fontSize: '0.78rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Service</span>
                    <div style={{ fontWeight: 700, color: 'var(--color-navy-dark)' }}>{bookingDetail.booking.service_title}</div>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.78rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Schedule</span>
                    <div style={{ fontWeight: 600 }}>{bookingDetail.booking.appointment_date} ({bookingDetail.booking.start_time})</div>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.78rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Total Fee</span>
                    <div style={{ fontWeight: 700, color: 'var(--color-navy-dark)' }}>{bookingDetail.booking.price_amount} {bookingDetail.booking.currency}</div>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.78rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Customer Contact</span>
                    <div>{bookingDetail.booking.customer_name} ({bookingDetail.booking.contact_phone || bookingDetail.booking.customer_email})</div>
                  </div>
                </div>

                {/* Dispute & Cancel Actions */}
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                  {bookingDetail.booking.status === 'confirmed' && (
                    <button
                      onClick={() => setCancelModalOpen(true)}
                      style={{ padding: '8px 16px', backgroundColor: '#fee2e2', border: '1px solid #fca5a5', color: '#b91c1c', borderRadius: '8px', fontWeight: 700, fontSize: '0.84rem', cursor: 'pointer' }}
                    >
                      Admin Cancellation & Refund
                    </button>
                  )}

                  <button
                    onClick={() => handleToggleDispute(Boolean(bookingDetail.booking.is_disputed))}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: bookingDetail.booking.is_disputed ? '#f1f5f9' : '#fffbeb',
                      border: bookingDetail.booking.is_disputed ? '1px solid #cbd5e1' : '1px solid #fde68a',
                      color: bookingDetail.booking.is_disputed ? '#475569' : '#b45309',
                      borderRadius: '8px',
                      fontWeight: 700,
                      fontSize: '0.84rem',
                      cursor: 'pointer',
                    }}
                  >
                    {bookingDetail.booking.is_disputed ? 'Clear Dispute Flag' : 'Flag as Disputed'}
                  </button>
                </div>

                {/* Timeline History */}
                <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '16px' }}>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--color-navy-dark)', marginBottom: '12px' }}>
                    Status Transition Timeline ({bookingDetail.timeline?.length || 0})
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {bookingDetail.timeline?.map((t) => (
                      <div key={t.id} style={{ display: 'flex', gap: '12px', fontSize: '0.84rem' }}>
                        <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: 'var(--color-gold-deep)', marginTop: '4px' }} />
                        <div style={{ flex: 1 }}>
                          <span style={{ fontWeight: 700, color: 'var(--color-navy-dark)' }}>{t.from_status} → {t.to_status}</span>
                          <span style={{ color: '#64748b', marginLeft: '10px' }}>{t.reason}</span>
                          <div style={{ fontSize: '0.76rem', color: '#94a3b8' }}>{new Date(t.created_at).toLocaleString()}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* Cancellation Modal */}
      {cancelModalOpen && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', maxWidth: '450px', width: '100%', padding: '24px' }}>
            <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#b91c1c', margin: '0 0 10px' }}>
              Confirm Administrative Cancellation
            </h4>
            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                Mandatory Cancellation Reason:
              </label>
              <textarea
                rows={2}
                required
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Reason for administrative cancellation..."
                style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.84rem' }}
              />
            </div>
            <div style={{ marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                type="checkbox"
                id="refundOverrideCheck"
                checked={refundOverride}
                onChange={(e) => setRefundOverride(e.target.checked)}
              />
              <label htmlFor="refundOverrideCheck" style={{ fontSize: '0.84rem', color: '#475569', fontWeight: 600 }}>
                Override Standard Cancellation Policy Refund
              </label>
            </div>
            {refundOverride && (
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                  Custom Refund Amount (ETB):
                </label>
                <input
                  type="number"
                  value={overrideAmount}
                  onChange={(e) => setOverrideAmount(e.target.value)}
                  placeholder="Enter exact ETB refund..."
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.84rem' }}
                />
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button
                type="button"
                onClick={() => setCancelModalOpen(false)}
                style={{ padding: '8px 14px', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', cursor: 'pointer' }}
              >
                Back
              </button>
              <button
                type="button"
                disabled={submittingAction || !cancelReason.trim()}
                onClick={handleCancelBooking}
                style={{ padding: '8px 16px', borderRadius: '6px', border: 'none', backgroundColor: '#b91c1c', color: '#ffffff', fontWeight: 700, cursor: 'pointer' }}
              >
                {submittingAction ? 'Processing...' : 'Confirm Cancellation'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Conflict Resolution Modal */}
      {conflictModalOpen && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', maxWidth: '450px', width: '100%', padding: '24px' }}>
            <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--color-navy-dark)', margin: '0 0 10px' }}>
              Resolve Late-Payment Conflict
            </h4>
            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                Resolution Action:
              </label>
              <select
                value={conflictResolution}
                onChange={(e) => setConflictResolution(e.target.value as any)}
                style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.84rem', backgroundColor: '#ffffff' }}
              >
                <option value="refund">Issue Full 100% Customer Refund</option>
                <option value="confirm_new_slot">Confirm into Re-opened / Alternate Slot</option>
              </select>
            </div>
            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                Administrative Resolution Notes:
              </label>
              <textarea
                rows={2}
                value={conflictNotes}
                onChange={(e) => setConflictNotes(e.target.value)}
                placeholder="Log customer communication or rationale..."
                style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.84rem' }}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button
                type="button"
                onClick={() => setConflictModalOpen(false)}
                style={{ padding: '8px 14px', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submittingAction}
                onClick={handleResolveConflict}
                style={{ padding: '8px 16px', borderRadius: '6px', border: 'none', backgroundColor: 'var(--color-navy-dark)', color: '#ffffff', fontWeight: 700, cursor: 'pointer' }}
              >
                {submittingAction ? 'Resolving...' : 'Apply Resolution'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default BookingsTab;
