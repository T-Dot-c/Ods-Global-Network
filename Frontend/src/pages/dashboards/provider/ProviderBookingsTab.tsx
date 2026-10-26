import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  User,
  Phone,
  Mail,
  CheckCircle2,
  XCircle,
  AlertCircle,
  CalendarCheck,
  RefreshCw,
  Search
} from 'lucide-react';
import {
  getProviderBookings,
  markBookingCompleted,
  markBookingNoShow,
  cancelBookingByProvider,
  BookingItem
} from '../../../services/bookingService';

export const ProviderBookingsTab: React.FC = () => {
  const [bookings, setBookings] = useState<BookingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Cancel modal state
  const [cancellingBooking, setCancellingBooking] = useState<BookingItem | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [processingCancel, setProcessingCancel] = useState(false);

  const loadBookings = async () => {
    setLoading(true);
    setFeedback(null);
    try {
      const data = await getProviderBookings({
        status: statusFilter === 'all' ? undefined : statusFilter,
      });
      setBookings(data);
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'Failed to load appointments.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBookings();
  }, [statusFilter]);

  const handleComplete = async (id: string) => {
    try {
      await markBookingCompleted(id);
      setFeedback({ type: 'success', text: 'Appointment marked as completed.' });
      loadBookings();
    } catch (err: any) {
      alert(err.message || 'Failed to mark appointment completed.');
    }
  };

  const handleNoShow = async (id: string) => {
    if (!confirm('Are you sure you want to mark this patient as a No-Show?')) return;
    try {
      await markBookingNoShow(id);
      setFeedback({ type: 'success', text: 'Appointment recorded as No-Show.' });
      loadBookings();
    } catch (err: any) {
      alert(err.message || 'Failed to record no-show.');
    }
  };

  const handleCancelSubmit = async () => {
    if (!cancellingBooking || !cancelReason.trim()) return;
    setProcessingCancel(true);
    try {
      await cancelBookingByProvider(cancellingBooking.id, cancelReason);
      setFeedback({ type: 'success', text: 'Appointment cancelled. Customer will receive a full refund.' });
      setCancellingBooking(null);
      setCancelReason('');
      loadBookings();
    } catch (err: any) {
      alert(err.message || 'Failed to cancel appointment.');
    } finally {
      setProcessingCancel(false);
    }
  };

  const filtered = bookings.filter(b => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      b.reference.toLowerCase().includes(q) ||
      (b.customer_name || '').toLowerCase().includes(q) ||
      (b.service_snapshot?.title || '').toLowerCase().includes(q)
    );
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 10px', borderRadius: '9999px', fontSize: '0.78rem', fontWeight: 700, backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
            <CheckCircle2 size={13} /> Confirmed
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
      {/* Header */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '16px', borderBottom: '1px solid #e2e8f0', paddingBottom: '16px' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--color-navy-dark, #081738)', margin: 0 }}>
            Incoming Appointments & Bookings
          </h2>
          <p style={{ fontSize: '0.88rem', color: '#64748b', margin: '4px 0 0' }}>
            Track patient reservations, view contact information, and record consultation completion.
          </p>
        </div>

        {/* Filter controls */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ position: 'relative' }}>
            <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder="Search by patient or reference..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ padding: '8px 14px 8px 36px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.88rem', minWidth: '240px' }}
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.88rem', fontWeight: 600, backgroundColor: '#ffffff' }}
          >
            <option value="all">All Statuses</option>
            <option value="confirmed">Confirmed</option>
            <option value="completed">Completed</option>
            <option value="no_show">No Show</option>
            <option value="cancelled_by_customer">Cancelled by Patient</option>
            <option value="cancelled_by_provider">Cancelled by Provider</option>
          </select>
        </div>
      </div>

      {feedback && (
        <div style={{
          padding: '12px 16px',
          borderRadius: '10px',
          backgroundColor: feedback.type === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
          border: `1px solid ${feedback.type === 'success' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
          color: feedback.type === 'success' ? '#065f46' : '#991b1b',
          fontSize: '0.88rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <span>{feedback.text}</span>
          <button onClick={() => setFeedback(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700, color: 'inherit' }}>×</button>
        </div>
      )}

      {/* Bookings table */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#64748b' }}>
          <RefreshCw size={28} className="animate-spin" style={{ margin: '0 auto 12px' }} />
          <p>Loading appointments...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '56px 24px', backgroundColor: '#f8fafc', borderRadius: '16px', border: '1px dashed #cbd5e1' }}>
          <Calendar size={40} color="#94a3b8" style={{ margin: '0 auto 12px' }} />
          <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#334155', margin: '0 0 6px' }}>
            No appointments match your filter
          </h4>
          <p style={{ fontSize: '0.88rem', color: '#64748b', margin: 0 }}>
            When clients book your published clinical services, reservations will appear here.
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '14px' }}>
          {filtered.map((b) => {
            const start = new Date(b.start_at);
            const isConfirmed = b.status === 'confirmed';
            const hasStarted = Date.now() >= start.getTime();

            return (
              <div
                key={b.id}
                style={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '14px',
                  padding: '20px 24px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '14px',
                }}
              >
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

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                  <div>
                    <h4 style={{ fontSize: '1rem', fontWeight: 800, color: '#081738', margin: '0 0 4px' }}>
                      {b.service_snapshot?.title || 'Clinical Consultation'}
                    </h4>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.86rem', color: '#475569' }}>
                      <User size={14} color="#BE9B49" />
                      <strong>{b.customer_name || 'Patient'}</strong>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.88rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#1e293b' }}>
                      <Calendar size={15} color="#BE9B49" />
                      <strong>{start.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</strong>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b' }}>
                      <Clock size={15} color="#94a3b8" />
                      <span>{start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ({b.service_snapshot?.duration_minutes || 60} mins)</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.88rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#334155' }}>
                      <Phone size={15} color="#BE9B49" />
                      <span>{b.customer_phone}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b' }}>
                      <Mail size={15} color="#94a3b8" />
                      <span>{b.customer_email}</span>
                    </div>
                  </div>
                </div>

                {b.customer_note && (
                  <div style={{ fontSize: '0.84rem', color: '#475569', backgroundColor: '#f8fafc', padding: '8px 12px', borderRadius: '8px', fontStyle: 'italic' }}>
                    Patient Note: "{b.customer_note}"
                  </div>
                )}

                {/* Action Buttons for Confirmed Appointments */}
                {isConfirmed && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'flex-end', gap: '10px', borderTop: '1px solid #f1f5f9', paddingTop: '12px' }}>
                    <button
                      onClick={() => handleComplete(b.id)}
                      disabled={!hasStarted}
                      title={!hasStarted ? 'Can be marked completed once appointment time arrives' : ''}
                      style={{
                        padding: '6px 14px',
                        borderRadius: '6px',
                        border: 'none',
                        backgroundColor: hasStarted ? '#10b981' : '#e2e8f0',
                        color: hasStarted ? '#ffffff' : '#94a3b8',
                        fontWeight: 700,
                        fontSize: '0.82rem',
                        cursor: hasStarted ? 'pointer' : 'not-allowed',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                    >
                      <CheckCircle2 size={14} /> Mark Completed
                    </button>

                    <button
                      onClick={() => handleNoShow(b.id)}
                      disabled={!hasStarted}
                      title={!hasStarted ? 'Can be marked as no-show once appointment time arrives' : ''}
                      style={{
                        padding: '6px 14px',
                        borderRadius: '6px',
                        border: '1px solid #cbd5e1',
                        backgroundColor: '#ffffff',
                        color: hasStarted ? '#64748b' : '#94a3b8',
                        fontWeight: 600,
                        fontSize: '0.82rem',
                        cursor: hasStarted ? 'pointer' : 'not-allowed',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                    >
                      <AlertCircle size={14} /> Mark No-Show
                    </button>

                    <button
                      onClick={() => setCancellingBooking(b)}
                      style={{
                        padding: '6px 14px',
                        borderRadius: '6px',
                        border: '1px solid #fca5a5',
                        backgroundColor: '#ffffff',
                        color: '#b91c1c',
                        fontWeight: 600,
                        fontSize: '0.82rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                    >
                      <XCircle size={14} /> Cancel with Reason
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── Cancel Appointment Modal ────────────────────────────── */}
      {cancellingBooking && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '28px', maxWidth: '480px', width: '100%', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#dc2626', margin: '0 0 8px' }}>
              Cancel Appointment
            </h3>
            <p style={{ fontSize: '0.88rem', color: '#64748b', margin: '0 0 16px' }}>
              Provider cancellation will trigger an automatic <strong>100% full refund</strong> to the patient ({cancellingBooking.price_amount} {cancellingBooking.currency}).
            </p>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                Cancellation Reason (Required, at least 5 characters)
              </label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="State why the clinic/provider cannot attend (e.g. emergency surgery, doctor illness)..."
                rows={3}
                style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.88rem' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                onClick={() => {
                  setCancellingBooking(null);
                  setCancelReason('');
                }}
                style={{ padding: '10px 18px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', color: '#475569', fontWeight: 600, cursor: 'pointer' }}
              >
                Abort
              </button>
              <button
                onClick={handleCancelSubmit}
                disabled={cancelReason.trim().length < 5 || processingCancel}
                style={{
                  padding: '10px 20px',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: '#dc2626',
                  color: '#ffffff',
                  fontWeight: 700,
                  cursor: cancelReason.trim().length < 5 || processingCancel ? 'not-allowed' : 'pointer',
                  opacity: cancelReason.trim().length < 5 || processingCancel ? 0.6 : 1,
                }}
              >
                {processingCancel ? 'Processing...' : 'Confirm Full Refund & Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
