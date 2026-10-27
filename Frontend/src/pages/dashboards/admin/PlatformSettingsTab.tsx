import React, { useState, useEffect } from 'react';
import {
  Sliders,
  Mail,
  RefreshCw,
  Save,
} from 'lucide-react';
import {
  fetchPlatformSettings,
  updatePlatformSettings,
  fetchEmailTemplates,
  EmailTemplateItem,
} from '../../../services/adminService';

export const PlatformSettingsTab: React.FC = () => {
  const [formValues, setFormValues] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [templates, setTemplates] = useState<EmailTemplateItem[]>([]);

  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [sets, temps] = await Promise.all([
        fetchPlatformSettings(),
        fetchEmailTemplates(),
      ]);
      setTemplates(Array.isArray(temps) ? temps : []);

      const initial: Record<string, any> = {};
      if (Array.isArray(sets)) {
        sets.forEach((s) => {
          initial[s.key] = s.value;
        });
      }
      setFormValues(initial);
    } catch (err: any) {
      setError(err.message || 'Failed to load platform settings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError(null);
      const payload = Object.keys(formValues).map((k) => ({
        key: k,
        value: formValues[k],
      }));
      await updatePlatformSettings(payload);
      setSuccessMsg('Platform operational parameters saved and logged to audit trail.');
    } catch (err: any) {
      setError(err.message || 'Failed to update settings.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
        <div>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--color-navy-dark)', margin: 0 }}>
            Platform Operational Settings & System Templates
          </h2>
          <p style={{ fontSize: '0.86rem', color: '#64748b', margin: '4px 0 0' }}>
            Configure runtime thresholds, appointment booking constraints, and review notification templates
          </p>
        </div>

        <button
          onClick={loadData}
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

      {/* Operational Parameters Form */}
      <div style={{ backgroundColor: '#ffffff', borderRadius: '14px', border: '1px solid #e2e8f0', padding: '24px', marginBottom: '28px', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <Sliders size={20} color="var(--color-gold-deep)" />
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--color-navy-dark)', margin: 0 }}>
            Operational Parameters Store
          </h3>
        </div>

        {loading ? (
          <div style={{ padding: '30px', textAlign: 'center', color: '#64748b' }}>Loading platform configuration...</div>
        ) : (
          <form onSubmit={handleSaveSettings}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '18px', marginBottom: '20px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 700, color: 'var(--color-navy-dark)', marginBottom: '4px' }}>
                  Booking Hold Duration (Minutes)
                </label>
                <input
                  type="number"
                  min={1}
                  max={60}
                  value={formValues.booking_hold_duration_minutes ?? 10}
                  onChange={(e) => setFormValues({ ...formValues, booking_hold_duration_minutes: parseInt(e.target.value, 10) })}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.86rem' }}
                />
                <span style={{ fontSize: '0.74rem', color: '#64748b' }}>
                  Temporary hold timeout during customer Chapa payment checkouts.
                </span>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 700, color: 'var(--color-navy-dark)', marginBottom: '4px' }}>
                  Max Advance Booking Window (Days)
                </label>
                <input
                  type="number"
                  min={1}
                  max={365}
                  value={formValues.booking_max_advance_days ?? 60}
                  onChange={(e) => setFormValues({ ...formValues, booking_max_advance_days: parseInt(e.target.value, 10) })}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.86rem' }}
                />
                <span style={{ fontSize: '0.74rem', color: '#64748b' }}>
                  Maximum forward days allowed for customers to schedule appointments.
                </span>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 700, color: 'var(--color-navy-dark)', marginBottom: '4px' }}>
                  Gift Voucher Validity (Days)
                </label>
                <input
                  type="number"
                  min={30}
                  max={730}
                  value={formValues.gift_voucher_validity_days ?? 365}
                  onChange={(e) => setFormValues({ ...formValues, gift_voucher_validity_days: parseInt(e.target.value, 10) })}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.86rem' }}
                />
                <span style={{ fontSize: '0.74rem', color: '#64748b' }}>
                  Standard active lifespan for purchased gift cards before expiring.
                </span>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 700, color: 'var(--color-navy-dark)', marginBottom: '4px' }}>
                  Two-Person Refund Threshold (ETB)
                </label>
                <input
                  type="number"
                  min={100}
                  step={500}
                  value={formValues.refund_two_person_threshold_etb ?? 10000}
                  onChange={(e) => setFormValues({ ...formValues, refund_two_person_threshold_etb: parseInt(e.target.value, 10) })}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.86rem' }}
                />
                <span style={{ fontSize: '0.74rem', color: '#64748b' }}>
                  Refund amounts strictly above this threshold require secondary sign-off.
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="submit"
                disabled={saving}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '9px 20px',
                  backgroundColor: 'var(--color-navy-dark)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: 700,
                  fontSize: '0.86rem',
                  cursor: 'pointer',
                }}
              >
                <Save size={15} />
                {saving ? 'Saving...' : 'Save Parameters'}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Email & Notification Templates Catalog */}
      <div style={{ backgroundColor: '#ffffff', borderRadius: '14px', border: '1px solid #e2e8f0', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
          <Mail size={20} color="var(--color-gold-deep)" />
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--color-navy-dark)', margin: 0 }}>
            System Notification & Email Templates (Batch 11 Preview)
          </h3>
        </div>
        <p style={{ fontSize: '0.82rem', color: '#64748b', margin: '0 0 16px' }}>
          Active system notification templates dispatched by asynchronous platform events. Full editing and trigger management is scheduled for Batch 11.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '12px' }}>
          {templates.map((t) => (
            <div key={t.id} style={{ backgroundColor: '#f8fafc', padding: '14px 16px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--color-navy-dark)' }}>{t.name}</span>
                <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '2px 6px', borderRadius: '4px', backgroundColor: '#e2e8f0', color: '#475569', textTransform: 'uppercase' }}>
                  {t.category}
                </span>
              </div>
              <p style={{ margin: '0 0 8px', fontSize: '0.8rem', color: '#64748b', lineHeight: 1.4 }}>
                {t.description}
              </p>
              <div style={{ display: 'flex', gap: '4px' }}>
                {t.channels?.map((ch) => (
                  <span key={ch} style={{ fontSize: '0.7rem', padding: '1px 6px', borderRadius: '3px', backgroundColor: '#fef3c7', color: '#92400e', fontWeight: 700, textTransform: 'uppercase' }}>
                    {ch}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
export default PlatformSettingsTab;
