import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Plus,
  Trash2,
  Save,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Globe
} from 'lucide-react';
import {
  getWeeklyAvailability,
  setWeeklyAvailability,
  getAvailabilityExceptions,
  addAvailabilityException,
  deleteAvailabilityException,
  AvailabilityRule,
  AvailabilityException
} from '../../../services/bookingService';

const WEEKDAYS = [
  { day: 1, name: 'Monday' },
  { day: 2, name: 'Tuesday' },
  { day: 3, name: 'Wednesday' },
  { day: 4, name: 'Thursday' },
  { day: 5, name: 'Friday' },
  { day: 6, name: 'Saturday' },
  { day: 0, name: 'Sunday' },
];

export const ProviderAvailabilityTab: React.FC = () => {
  const [rules, setRules] = useState<AvailabilityRule[]>([]);
  const [exceptions, setExceptions] = useState<AvailabilityException[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingRules, setSavingRules] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Exception form state
  const [exDate, setExDate] = useState('');
  const [exIsClosed, setExIsClosed] = useState(true);
  const [exStart, setExStart] = useState('09:00');
  const [exEnd, setExEnd] = useState('17:00');
  const [exNote, setExNote] = useState('');
  const [addingEx, setAddingEx] = useState(false);

  const loadData = async () => {
    setLoading(true);
    setStatusMessage(null);
    try {
      const [rData, eData] = await Promise.all([
        getWeeklyAvailability(),
        getAvailabilityExceptions(),
      ]);

      // Normalize rules for all 7 days
      const normalized: AvailabilityRule[] = WEEKDAYS.map(({ day }) => {
        const found = rData.find(r => r.weekday === day);
        return found || {
          weekday: day,
          start_time: '09:00:00',
          end_time: '17:00:00',
          is_active: day !== 0, // active Mon-Sat, Sunday off by default
          time_zone: 'Africa/Addis_Ababa',
        };
      });

      setRules(normalized);
      setExceptions(eData);
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Failed to load availability data.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDayToggle = (weekday: number) => {
    setRules(prev =>
      prev.map(r => (r.weekday === weekday ? { ...r, is_active: !r.is_active } : r))
    );
  };

  const handleTimeChange = (weekday: number, field: 'start_time' | 'end_time', val: string) => {
    const formatted = val.length === 5 ? `${val}:00` : val;
    setRules(prev =>
      prev.map(r => (r.weekday === weekday ? { ...r, [field]: formatted } : r))
    );
  };

  const handleSaveWeeklyRules = async () => {
    setSavingRules(true);
    setStatusMessage(null);
    try {
      await setWeeklyAvailability(rules);
      setStatusMessage({ type: 'success', text: 'Weekly working hours saved successfully!' });
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Failed to save weekly schedule.' });
    } finally {
      setSavingRules(false);
    }
  };

  const handleAddException = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!exDate) return;
    setAddingEx(true);
    setStatusMessage(null);
    try {
      await addAvailabilityException({
        exception_date: exDate,
        is_closed: exIsClosed,
        start_time: exIsClosed ? null : `${exStart}:00`,
        end_time: exIsClosed ? null : `${exEnd}:00`,
        note: exNote || null,
      });
      setExDate('');
      setExNote('');
      setStatusMessage({ type: 'success', text: 'Calendar exception date added.' });
      const eData = await getAvailabilityExceptions();
      setExceptions(eData);
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Failed to add exception.' });
    } finally {
      setAddingEx(false);
    }
  };

  const handleDeleteException = async (id: string) => {
    if (!confirm('Are you sure you want to remove this exception date?')) return;
    try {
      await deleteAvailabilityException(id);
      setExceptions(prev => prev.filter(e => e.id !== id));
      setStatusMessage({ type: 'success', text: 'Exception deleted.' });
    } catch (err: any) {
      alert(err.message || 'Failed to delete exception.');
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 0', color: '#64748b' }}>
        <RefreshCw size={28} className="animate-spin" style={{ margin: '0 auto 12px' }} />
        <p>Loading duty hours and schedule settings...</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      {/* Header */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '16px', borderBottom: '1px solid #e2e8f0', paddingBottom: '16px' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--color-navy-dark, #081738)', margin: 0 }}>
            Duty Hours & Availability
          </h2>
          <p style={{ fontSize: '0.88rem', color: '#64748b', margin: '4px 0 0' }}>
            Configure recurring clinic shifts and custom blackout dates to manage appointment booking slots.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#f1f5f9', padding: '6px 12px', borderRadius: '8px', fontSize: '0.84rem', color: '#475569', fontWeight: 600 }}>
          <Globe size={15} color="#BE9B49" />
          <span>Default Timezone: <strong>Africa/Addis_Ababa (EAT)</strong></span>
        </div>
      </div>

      {statusMessage && (
        <div style={{
          padding: '12px 16px',
          borderRadius: '10px',
          backgroundColor: statusMessage.type === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
          border: `1px solid ${statusMessage.type === 'success' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
          color: statusMessage.type === 'success' ? '#065f46' : '#991b1b',
          fontSize: '0.88rem',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}>
          {statusMessage.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* ── Section 1: Weekly Recurring Schedule Grid ───────────── */}
      <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#081738', margin: 0 }}>
              Weekly Recurring Operating Hours
            </h3>
            <p style={{ fontSize: '0.84rem', color: '#64748b', margin: '2px 0 0' }}>
              Set standard working hours for each day of the week. Unchecked days are closed.
            </p>
          </div>

          <button
            onClick={handleSaveWeeklyRules}
            disabled={savingRules}
            style={{
              padding: '10px 20px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: '#BE9B49',
              color: '#081738',
              fontWeight: 700,
              fontSize: '0.88rem',
              cursor: savingRules ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 2px 8px rgba(190, 155, 73, 0.3)',
            }}
          >
            <Save size={16} />
            <span>{savingRules ? 'Saving...' : 'Save Weekly Schedule'}</span>
          </button>
        </div>

        <div style={{ display: 'grid', gap: '12px' }}>
          {WEEKDAYS.map(({ day, name }) => {
            const rule = rules.find(r => r.weekday === day);
            const active = rule?.is_active ?? false;
            const startTime = (rule?.start_time || '09:00:00').slice(0, 5);
            const endTime = (rule?.end_time || '17:00:00').slice(0, 5);

            return (
              <div
                key={day}
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 16px',
                  borderRadius: '10px',
                  backgroundColor: active ? '#f8fafc' : '#f1f5f9',
                  border: `1px solid ${active ? '#cbd5e1' : '#e2e8f0'}`,
                  gap: '12px',
                }}
              >
                {/* Day name & toggle */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: '140px' }}>
                  <input
                    type="checkbox"
                    id={`day-${day}`}
                    checked={active}
                    onChange={() => handleDayToggle(day)}
                    style={{ width: '18px', height: '18px', accentColor: '#BE9B49', cursor: 'pointer' }}
                  />
                  <label htmlFor={`day-${day}`} style={{ fontWeight: 700, fontSize: '0.92rem', color: active ? '#081738' : '#94a3b8', cursor: 'pointer' }}>
                    {name}
                  </label>
                </div>

                {/* Hours inputs or Closed badge */}
                {active ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '0.82rem', color: '#64748b' }}>From:</span>
                      <input
                        type="time"
                        value={startTime}
                        onChange={(e) => handleTimeChange(day, 'start_time', e.target.value)}
                        style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.88rem', fontWeight: 600 }}
                      />
                    </div>
                    <span style={{ color: '#94a3b8' }}>—</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '0.82rem', color: '#64748b' }}>To:</span>
                      <input
                        type="time"
                        value={endTime}
                        onChange={(e) => handleTimeChange(day, 'end_time', e.target.value)}
                        style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.88rem', fontWeight: 600 }}
                      />
                    </div>
                  </div>
                ) : (
                  <span style={{ fontSize: '0.84rem', fontWeight: 600, color: '#94a3b8', padding: '4px 10px', backgroundColor: '#e2e8f0', borderRadius: '6px' }}>
                    Closed
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Section 2: Blackout Dates & Holiday Exceptions ───────── */}
      <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
        <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#081738', margin: '0 0 6px' }}>
          Blackout Dates & Custom Hours Exceptions
        </h3>
        <p style={{ fontSize: '0.84rem', color: '#64748b', margin: '0 0 20px' }}>
          Mark national holidays, annual facility closures, or specific dates with modified working hours.
        </p>

        {/* Add exception form */}
        <form onSubmit={handleAddException} style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', gap: '12px', padding: '16px', backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '24px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
              Date
            </label>
            <input
              type="date"
              required
              value={exDate}
              min={new Date().toISOString().slice(0, 10)}
              onChange={(e) => setExDate(e.target.value)}
              style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.88rem' }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingBottom: '8px' }}>
            <input
              type="checkbox"
              id="exIsClosed"
              checked={exIsClosed}
              onChange={(e) => setExIsClosed(e.target.checked)}
              style={{ width: '16px', height: '16px', accentColor: '#BE9B49', cursor: 'pointer' }}
            />
            <label htmlFor="exIsClosed" style={{ fontSize: '0.84rem', fontWeight: 600, color: '#1e293b', cursor: 'pointer' }}>
              Closed All Day (Blackout)
            </label>
          </div>

          {!exIsClosed && (
            <>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                  Start
                </label>
                <input
                  type="time"
                  value={exStart}
                  onChange={(e) => setExStart(e.target.value)}
                  style={{ padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.88rem' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                  End
                </label>
                <input
                  type="time"
                  value={exEnd}
                  onChange={(e) => setExEnd(e.target.value)}
                  style={{ padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.88rem' }}
                />
              </div>
            </>
          )}

          <div style={{ flex: '1', minWidth: '160px' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
              Reason / Note
            </label>
            <input
              type="text"
              placeholder="e.g. National Holiday, Facility Maintenance"
              value={exNote}
              onChange={(e) => setExNote(e.target.value)}
              style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.88rem' }}
            />
          </div>

          <button
            type="submit"
            disabled={addingEx}
            style={{
              padding: '9px 18px',
              borderRadius: '6px',
              border: 'none',
              backgroundColor: '#081738',
              color: '#ffffff',
              fontWeight: 700,
              fontSize: '0.88rem',
              cursor: addingEx ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Plus size={16} />
            <span>{addingEx ? 'Adding...' : 'Add Exception'}</span>
          </button>
        </form>

        {/* Existing exceptions list */}
        {exceptions.length === 0 ? (
          <p style={{ fontSize: '0.88rem', color: '#94a3b8', fontStyle: 'italic', margin: 0 }}>
            No blackout dates or special-hour exceptions currently scheduled.
          </p>
        ) : (
          <div style={{ display: 'grid', gap: '8px' }}>
            {exceptions.map((ex) => {
              const d = new Date(ex.exception_date);
              return (
                <div
                  key={ex.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    backgroundColor: '#ffffff',
                    border: '1px solid #e2e8f0',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Calendar size={16} color="#BE9B49" />
                    <strong>{d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</strong>
                    {ex.is_closed ? (
                      <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#b91c1c', backgroundColor: '#fef2f2', padding: '2px 8px', borderRadius: '4px' }}>
                        Closed All Day
                      </span>
                    ) : (
                      <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#0369a1', backgroundColor: '#f0f9ff', padding: '2px 8px', borderRadius: '4px' }}>
                        Special Hours: {ex.start_time?.slice(0, 5)} - {ex.end_time?.slice(0, 5)}
                      </span>
                    )}
                    {ex.note && <span style={{ fontSize: '0.82rem', color: '#64748b' }}>({ex.note})</span>}
                  </div>

                  <button
                    onClick={() => ex.id && handleDeleteException(ex.id)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: '4px' }}
                    title="Delete exception"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
