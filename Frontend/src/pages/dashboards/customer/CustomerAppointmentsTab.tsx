import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  MapPin,
  Phone,
  AlertCircle,
  CheckCircle2,
  XCircle,
  RefreshCw,
  CalendarCheck
} from 'lucide-react';
import {
  getCustomerBookings,
  cancelBookingByCustomer,
  rescheduleBooking,
  getAvailableSlots,
  payBookingWithChapa,
  BookingItem,
  TimeSlot
} from '../../../services/bookingService';

export const CustomerAppointmentsTab: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'upcoming' | 'pending' | 'past' | 'all'>('upcoming');
  const [bookings, setBookings] = useState<BookingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [payingBookingId, setPayingBookingId] = useState<string | null>(null);

  // Modals state
  const [cancelModalBooking, setCancelModalBooking] = useState<BookingItem | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);

  const [rescheduleModalBooking, setRescheduleModalBooking] = useState<BookingItem | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [rescheduling, setRescheduling] = useState(false);

  const loadBookings = async () => {
    setLoading(true);
    setError(null);
    try {
      const statusParam = activeTab === 'pending' ? 'pending_payment' : activeTab;
      const data = await getCustomerBookings({ status: statusParam });
      setBookings(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load your appointments.');
    } finally {
      setLoading(false);
    }
  };

  const handlePayBooking = async (bookingId: string) => {
    try {
      setPayingBookingId(bookingId);
      const res = await payBookingWithChapa(bookingId);
      if (res.success && res.checkout_url) {
        window.location.href = res.checkout_url;
      }
    } catch (err: any) {
      alert(err.message || 'Failed to initialize payment.');
      setPayingBookingId(null);
    }
  };

  useEffect(() => {
    loadBookings();
  }, [activeTab]);

  // Load slots when reschedule date is selected
  useEffect(() => {
    if (rescheduleModalBooking && rescheduleDate) {
      const fetchSlots = async () => {
        setLoadingSlots(true);
        setSelectedSlot(null);
        try {
          const res = await getAvailableSlots(rescheduleModalBooking.service_id, rescheduleDate, rescheduleDate);
          setAvailableSlots(res.slots || []);
        } catch {
          setAvailableSlots([]);
        } finally {
          setLoadingSlots(false);
        }
      };
      fetchSlots();
    }
  }, [rescheduleDate, rescheduleModalBooking]);

  const handleCancelSubmit = async () => {
    if (!cancelModalBooking) return;
    setCancelling(true);
    try {
      const res = await cancelBookingByCustomer(cancelModalBooking.id, cancelReason);
      setActionSuccess(`Appointment cancelled successfully. Refund amount: ${res.refund_amount} ${cancelModalBooking.currency}`);
      setCancelModalBooking(null);
      setCancelReason('');
      loadBookings();
    } catch (err: any) {
      alert(err.message || 'Failed to cancel appointment.');
    } finally {
      setCancelling(false);
    }
  };

  const handleRescheduleSubmit = async () => {
    if (!rescheduleModalBooking || !selectedSlot) return;
    setRescheduling(true);
    try {
      await rescheduleBooking(rescheduleModalBooking.id, selectedSlot);
      setActionSuccess('Appointment successfully rescheduled!');
      setRescheduleModalBooking(null);
      setSelectedSlot(null);
      loadBookings();
    } catch (err: any) {
      alert(err.message || 'Failed to reschedule appointment.');
    } finally {
      setRescheduling(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 10px', borderRadius: '9999px', fontSize: '0.78rem', fontWeight: 700, backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
            <CheckCircle2 size={13} /> Confirmed
          </span>
        );
      case 'pending_payment':
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 10px', borderRadius: '9999px', fontSize: '0.78rem', fontWeight: 700, backgroundColor: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
            <Clock size={13} /> Hold Pending Payment
          </span>
        );
      case 'completed':
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 10px', borderRadius: '9999px', fontSize: '0.78rem', fontWeight: 700, backgroundColor: 'rgba(190, 155, 73, 0.18)', color: '#BE9B49', border: '1px solid rgba(190, 155, 73, 0.35)' }}>
            <CalendarCheck size={13} /> Completed
          </span>
        );
      case 'cancelled_by_customer':
      case 'cancelled_by_provider':
      case 'cancelled_by_admin':
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 10px', borderRadius: '9999px', fontSize: '0.78rem', fontWeight: 700, backgroundColor: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
            <XCircle size={13} /> Cancelled
          </span>
        );
      case 'payment_conflict':
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 10px', borderRadius: '9999px', fontSize: '0.78rem', fontWeight: 700, backgroundColor: 'rgba(239, 68, 68, 0.15)', color: '#dc2626', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
            <AlertCircle size={13} /> Payment Conflict
          </span>
        );
      case 'disputed':
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 10px', borderRadius: '9999px', fontSize: '0.78rem', fontWeight: 700, backgroundColor: 'rgba(245, 158, 11, 0.15)', color: '#d97706', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
            <AlertCircle size={13} /> Disputed
          </span>
        );
      case 'no_show':
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 10px', borderRadius: '9999px', fontSize: '0.78rem', fontWeight: 700, backgroundColor: 'rgba(148, 163, 184, 0.15)', color: '#94a3b8', border: '1px solid rgba(148, 163, 184, 0.3)' }}>
            <AlertCircle size={13} /> No Show
          </span>
        );
      default:
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 10px', borderRadius: '9999px', fontSize: '0.78rem', fontWeight: 700, backgroundColor: '#334155', color: '#cbd5e1' }}>
            {status}
          </span>
        );
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header & Filter Tabs */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '16px', borderBottom: '1px solid #e2e8f0', paddingBottom: '16px' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--color-navy-dark, #081738)', margin: 0 }}>
            My Appointments & Bookings
          </h2>
          <p style={{ fontSize: '0.88rem', color: '#64748b', margin: '4px 0 0' }}>
            View scheduled clinical consultations, manage calendar appointments, and request rescheduling.
          </p>
        </div>

        {/* Tab switcher */}
        <div style={{ display: 'flex', gap: '6px', backgroundColor: '#f1f5f9', padding: '4px', borderRadius: '10px' }}>
          {(['upcoming', 'pending', 'past', 'all'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '6px 14px',
                borderRadius: '8px',
                fontSize: '0.84rem',
                fontWeight: 700,
                border: 'none',
                cursor: 'pointer',
                backgroundColor: activeTab === tab ? '#ffffff' : 'transparent',
                color: activeTab === tab ? 'var(--color-navy-dark, #081738)' : '#64748b',
                boxShadow: activeTab === tab ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
                textTransform: 'capitalize',
                transition: 'all 0.15s ease',
              }}
            >
              {tab === 'pending' ? 'Pending Payment' : tab}
            </button>
          ))}
        </div>
      </div>

      {actionSuccess && (
        <div style={{ padding: '12px 16px', borderRadius: '10px', backgroundColor: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', color: '#065f46', fontSize: '0.88rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span>{actionSuccess}</span>
          <button onClick={() => setActionSuccess(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700, color: '#065f46' }}>×</button>
        </div>
      )}

      {error && (
        <div style={{ padding: '12px 16px', borderRadius: '10px', backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#991b1b', fontSize: '0.88rem' }}>
          {error}
        </div>
      )}

      {/* Booking List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '48px 0', color: '#64748b' }}>
          <RefreshCw size={28} className="animate-spin" style={{ margin: '0 auto 12px' }} />
          <p>Loading your appointments...</p>
        </div>
      ) : bookings.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '56px 24px', backgroundColor: '#f8fafc', borderRadius: '16px', border: '1px dashed #cbd5e1' }}>
          <Calendar size={40} color="#94a3b8" style={{ margin: '0 auto 12px' }} />
          <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#334155', margin: '0 0 6px' }}>
            No {activeTab} appointments found
          </h4>
          <p style={{ fontSize: '0.88rem', color: '#64748b', margin: 0 }}>
            {activeTab === 'upcoming' ? 'You have no appointments currently scheduled.' : 'No appointment history available.'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '16px' }}>
          {bookings.map((b) => {
            const start = new Date(b.start_at);
            const isConfirmed = b.status === 'confirmed';
            const hoursNotice = (start.getTime() - Date.now()) / (3600 * 1000);
            const canReschedule = isConfirmed && (b.reschedule_count || 0) < 2 && hoursNotice >= 2;
            const canCancel = ['confirmed', 'awaiting_provider', 'pending_payment'].includes(b.status);

            return (
              <div
                key={b.id}
                style={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '16px',
                  padding: '24px',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.03)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px',
                }}
              >
                {/* Header row */}
                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '0.82rem', fontFamily: 'monospace', fontWeight: 700, padding: '4px 8px', borderRadius: '6px', backgroundColor: '#f1f5f9', color: '#081738' }}>
                      {b.reference}
                    </span>
                    {getStatusBadge(b.status)}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.92rem', fontWeight: 800, color: '#BE9B49' }}>
                    <span>{parseFloat(String(b.price_amount)).toLocaleString()}</span>
                    <span>{b.currency || 'ETB'}</span>
                  </div>
                </div>

                {/* Main details */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
                  <div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#081738', margin: '0 0 4px' }}>
                      {b.service_snapshot?.title || b.current_service_title || 'Healthcare Consultation'}
                    </h3>
                    <div style={{ fontSize: '0.88rem', color: '#475569', fontWeight: 600 }}>
                      {b.provider_name || 'Verified Healthcare Provider'}
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.88rem', color: '#1e293b' }}>
                      <Calendar size={15} color="#BE9B49" />
                      <strong>{start.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</strong>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.88rem', color: '#64748b' }}>
                      <Clock size={15} color="#94a3b8" />
                      <span>{start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ({b.service_snapshot?.duration_minutes || 60} mins)</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.88rem', color: '#475569' }}>
                      <MapPin size={15} color="#BE9B49" />
                      <span style={{ textTransform: 'capitalize' }}>{b.service_snapshot?.location_type?.replace('_', ' ') || 'On-site'}</span>
                    </div>
                    {b.provider_phone && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.88rem', color: '#64748b' }}>
                        <Phone size={15} color="#94a3b8" />
                        <span>{b.provider_phone}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Reschedule metadata badge if rescheduled */}
                {(b.reschedule_count || 0) > 0 && (
                  <div style={{ fontSize: '0.82rem', color: '#0284c7', backgroundColor: '#e0f2fe', padding: '6px 12px', borderRadius: '8px', width: 'fit-content' }}>
                    Rescheduled ({b.reschedule_count}/2 times used)
                  </div>
                )}

                {/* Pending Payment Hold Notice */}
                {b.status === 'pending_payment' && (
                  b.hold_expires_at && new Date(b.hold_expires_at) > new Date() ? (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderRadius: '8px', backgroundColor: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.3)', color: '#92400e', fontSize: '0.84rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Clock size={16} color="#b45309" />
                        <span>
                          <strong>10-Minute Hold Active:</strong> Slot reserved until {new Date(b.hold_expires_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}. Complete payment now to confirm.
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div style={{ padding: '10px 14px', borderRadius: '8px', backgroundColor: '#fef2f2', border: '1px solid #fee2e2', color: '#991b1b', fontSize: '0.84rem' }}>
                      Reservation hold expired. The slot has been released back to public availability.
                    </div>
                  )
                )}

                {/* Footer action bar */}
                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'flex-end', gap: '10px', borderTop: '1px solid #f1f5f9', paddingTop: '14px' }}>
                  {b.status === 'pending_payment' && b.hold_expires_at && new Date(b.hold_expires_at) > new Date() && (
                    <button
                      type="button"
                      onClick={() => handlePayBooking(b.id)}
                      disabled={payingBookingId === b.id}
                      style={{
                        padding: '8px 18px',
                        borderRadius: '8px',
                        fontSize: '0.84rem',
                        fontWeight: 700,
                        backgroundColor: 'var(--color-gold-deep, #BE9B49)',
                        border: 'none',
                        color: '#ffffff',
                        cursor: payingBookingId === b.id ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        boxShadow: '0 2px 8px rgba(190, 155, 73, 0.3)',
                      }}
                    >
                      {payingBookingId === b.id ? (
                        <>
                          <RefreshCw size={14} className="animate-spin" />
                          <span>Connecting to Chapa...</span>
                        </>
                      ) : (
                        <span>Pay {parseFloat(String(b.price_amount)).toLocaleString()} {b.currency || 'ETB'} with Chapa</span>
                      )}
                    </button>
                  )}

                  {canReschedule && (
                    <button
                      onClick={() => {
                        setRescheduleModalBooking(b);
                        const nextDay = new Date(Date.now() + 24 * 3600 * 1000).toISOString().slice(0, 10);
                        setRescheduleDate(nextDay);
                      }}
                      style={{
                        padding: '8px 16px',
                        borderRadius: '8px',
                        fontSize: '0.84rem',
                        fontWeight: 700,
                        backgroundColor: '#f8fafc',
                        border: '1px solid #cbd5e1',
                        color: '#081738',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                    >
                      <RefreshCw size={14} /> Reschedule
                    </button>
                  )}

                  {canCancel && (
                    <button
                      onClick={() => setCancelModalBooking(b)}
                      style={{
                        padding: '8px 16px',
                        borderRadius: '8px',
                        fontSize: '0.84rem',
                        fontWeight: 700,
                        backgroundColor: 'transparent',
                        border: '1px solid #fca5a5',
                        color: '#b91c1c',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                    >
                      <XCircle size={14} /> Cancel Appointment
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Reschedule Modal ────────────────────────────────────── */}
      {rescheduleModalBooking && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '28px', maxWidth: '520px', width: '100%', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#081738', margin: '0 0 8px' }}>
              Reschedule Appointment
            </h3>
            <p style={{ fontSize: '0.88rem', color: '#64748b', margin: '0 0 20px' }}>
              Select a new date and open time slot for <strong>{rescheduleModalBooking.service_snapshot?.title}</strong>.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  Target Date
                </label>
                <input
                  type="date"
                  value={rescheduleDate}
                  min={new Date(Date.now() + 24 * 3600 * 1000).toISOString().slice(0, 10)}
                  onChange={(e) => setRescheduleDate(e.target.value)}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.92rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  Available Slots
                </label>
                {loadingSlots ? (
                  <p style={{ fontSize: '0.88rem', color: '#64748b' }}>Checking provider calendar...</p>
                ) : availableSlots.length === 0 ? (
                  <p style={{ fontSize: '0.88rem', color: '#dc2626' }}>No open slots available on this date. Please choose another date.</p>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '8px', maxHeight: '180px', overflowY: 'auto', padding: '4px' }}>
                    {availableSlots.map((s) => {
                      const st = new Date(s.start_at);
                      const isSel = selectedSlot === s.start_at;
                      return (
                        <button
                          key={s.start_at}
                          type="button"
                          onClick={() => setSelectedSlot(s.start_at)}
                          style={{
                            padding: '8px 10px',
                            borderRadius: '8px',
                            border: isSel ? '2px solid #BE9B49' : '1px solid #cbd5e1',
                            backgroundColor: isSel ? '#fef3c7' : '#ffffff',
                            color: isSel ? '#78350f' : '#081738',
                            fontWeight: 700,
                            fontSize: '0.84rem',
                            cursor: 'pointer',
                          }}
                        >
                          {st.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                onClick={() => setRescheduleModalBooking(null)}
                style={{ padding: '10px 18px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', color: '#475569', fontWeight: 600, cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                onClick={handleRescheduleSubmit}
                disabled={!selectedSlot || rescheduling}
                style={{
                  padding: '10px 20px',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: '#BE9B49',
                  color: '#081738',
                  fontWeight: 700,
                  cursor: !selectedSlot || rescheduling ? 'not-allowed' : 'pointer',
                  opacity: !selectedSlot || rescheduling ? 0.6 : 1,
                }}
              >
                {rescheduling ? 'Rescheduling...' : 'Confirm Reschedule'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Cancel Modal ────────────────────────────────────────── */}
      {cancelModalBooking && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '28px', maxWidth: '480px', width: '100%', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#dc2626', margin: '0 0 8px' }}>
              Cancel Appointment
            </h3>
            <p style={{ fontSize: '0.88rem', color: '#64748b', margin: '0 0 16px' }}>
              Are you sure you want to cancel your appointment for <strong>{cancelModalBooking.service_snapshot?.title}</strong>?
            </p>

            {/* Policy Info */}
            <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px', padding: '14px', marginBottom: '16px', fontSize: '0.84rem', color: '#991b1b' }}>
              <div style={{ fontWeight: 700, marginBottom: '4px' }}>Cancellation Policy:</div>
              <div>{cancelModalBooking.cancellation_policy_snapshot?.description || 'Full refund up to 24h prior, 50% between 6-24h, 0% after.'}</div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                Reason for cancellation (optional)
              </label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Please tell us why you need to cancel..."
                rows={3}
                style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.88rem' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                onClick={() => setCancelModalBooking(null)}
                style={{ padding: '10px 18px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', color: '#475569', fontWeight: 600, cursor: 'pointer' }}
              >
                Keep Booking
              </button>
              <button
                onClick={handleCancelSubmit}
                disabled={cancelling}
                style={{
                  padding: '10px 20px',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: '#dc2626',
                  color: '#ffffff',
                  fontWeight: 700,
                  cursor: cancelling ? 'not-allowed' : 'pointer',
                }}
              >
                {cancelling ? 'Cancelling...' : 'Confirm Cancellation'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
