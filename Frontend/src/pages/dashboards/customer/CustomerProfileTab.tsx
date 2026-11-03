import React, { useState, useEffect } from 'react';
import { User, Mail, Globe, Bell, MapPin, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { getCustomerProfile, updateCustomerProfile, CustomerProfile } from '../../../services/customerService';
import { useAuth } from '../../../context/AuthContext';
import { PhoneInput } from '../../../components/common/PhoneInput';

export const CustomerProfileTab: React.FC = () => {
  const { updateUser } = useAuth();
  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form State
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [lang, setLang] = useState<'en' | 'am'>('en');
  const [notif, setNotif] = useState<'email' | 'sms' | 'both'>('email');
  const [country, setCountry] = useState('Ethiopia');
  const [regionState, setRegionState] = useState('');
  const [city, setCity] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [addressLine, setAddressLine] = useState('');

  useEffect(() => {
    let mounted = true;
    getCustomerProfile()
      .then((data) => {
        if (!mounted) return;
        setProfile(data);
        setFullName(data.full_name || '');
        setPhone(data.phone || '');
        setLang(data.preferred_language || 'en');
        setNotif(data.notification_preference || 'email');
        setCountry(data.country || 'Ethiopia');
        setRegionState(data.region_state || '');
        setCity(data.city || '');
        setPostalCode(data.postal_code || '');
        setAddressLine(data.address_line || '');
      })
      .catch((err) => {
        if (!mounted) return;
        setErrorMsg(err.message || 'Failed to load profile.');
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!fullName.trim()) {
      setErrorMsg('Full name is required.');
      return;
    }

    setSaving(true);
    try {
      const updated = await updateCustomerProfile({
        full_name: fullName.trim(),
        phone: phone.trim() || undefined,
        preferred_language: lang,
        notification_preference: notif,
        country: country.trim() || undefined,
        region_state: regionState.trim() || undefined,
        city: city.trim() || undefined,
        postal_code: postalCode.trim() || undefined,
        address_line: addressLine.trim() || undefined,
      });

      setProfile(updated);
      updateUser({ full_name: updated.full_name });
      setSuccessMsg('Profile updated successfully.');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '48px 0', textAlign: 'center', color: '#64748b' }}>
        <Loader2 size={32} className="animate-spin" style={{ margin: '0 auto 12px' }} />
        <div>Loading customer profile…</div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header Info */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--color-navy-dark)', margin: '0 0 6px' }}>
            Personal Profile & Preferences
          </h2>
          <p style={{ color: '#64748b', fontSize: '0.88rem', margin: 0 }}>
            Manage your personal identity, contact details, language, and notification channels.
          </p>
        </div>

        {profile && (
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <span
              style={{
                fontSize: '0.75rem',
                padding: '4px 10px',
                borderRadius: '6px',
                backgroundColor: '#f1f5f9',
                color: '#475569',
                fontWeight: 600,
              }}
            >
              Member Since: {new Date(profile.created_at).toLocaleDateString()}
            </span>
            {profile.last_login_at && (
              <span
                style={{
                  fontSize: '0.75rem',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  backgroundColor: 'rgba(190, 155, 73, 0.12)',
                  color: 'var(--color-gold-deep)',
                  fontWeight: 600,
                }}
              >
                Last Active: {new Date(profile.last_login_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Notifications */}
      {successMsg && (
        <div
          style={{
            padding: '12px 18px',
            borderRadius: '10px',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            color: '#065f46',
            fontSize: '0.88rem',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}
        >
          <CheckCircle2 size={18} color="#065f46" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div
          style={{
            padding: '12px 18px',
            borderRadius: '10px',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: '#b91c1c',
            fontSize: '0.88rem',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}
        >
          <AlertCircle size={18} color="#b91c1c" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '18px' }}>
          {/* Full Name */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-navy-dark)' }}>
              Full Name <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <div style={{ position: 'relative' }}>
              <User size={16} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '14px' }} />
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '10px 14px 10px 38px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.9rem',
                  outline: 'none',
                }}
              />
            </div>
          </div>

          {/* Email (Disabled) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-navy-dark)' }}>
                Email Address
              </label>
              <span style={{ fontSize: '0.72rem', color: '#94a3b8', fontStyle: 'italic' }}>Immutable identity</span>
            </div>
            <div style={{ position: 'relative' }}>
              <Mail size={16} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '14px' }} />
              <input
                type="email"
                value={profile?.email || ''}
                disabled
                style={{
                  width: '100%',
                  padding: '10px 14px 10px 38px',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0',
                  backgroundColor: '#f8fafc',
                  color: '#64748b',
                  fontSize: '0.9rem',
                  cursor: 'not-allowed',
                }}
              />
            </div>
          </div>

          {/* Phone Number */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-navy-dark)' }}>
              Phone Number
            </label>
            <PhoneInput value={phone} onChange={setPhone} />
          </div>

          {/* Preferred Language */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-navy-dark)' }}>
              Preferred Language
            </label>
            <div style={{ position: 'relative' }}>
              <Globe size={16} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '14px' }} />
              <select
                value={lang}
                onChange={(e) => setLang(e.target.value as 'en' | 'am')}
                style={{
                  width: '100%',
                  padding: '10px 14px 10px 38px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  backgroundColor: '#ffffff',
                  fontSize: '0.9rem',
                  outline: 'none',
                  cursor: 'pointer',
                }}
              >
                <option value="en">English</option>
                <option value="am">Amharic (አማርኛ)</option>
              </select>
            </div>
          </div>

          {/* Notification Preference */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-navy-dark)' }}>
              Notification Channel
            </label>
            <div style={{ position: 'relative' }}>
              <Bell size={16} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '14px' }} />
              <select
                value={notif}
                onChange={(e) => setNotif(e.target.value as 'email' | 'sms' | 'both')}
                style={{
                  width: '100%',
                  padding: '10px 14px 10px 38px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  backgroundColor: '#ffffff',
                  fontSize: '0.9rem',
                  outline: 'none',
                  cursor: 'pointer',
                }}
              >
                <option value="email">Email Only</option>
                <option value="sms">SMS Only</option>
                <option value="both">Both Email & SMS</option>
              </select>
            </div>
          </div>

          {/* Country */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-navy-dark)' }}>
              Country
            </label>
            <div style={{ position: 'relative' }}>
              <MapPin size={16} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '14px' }} />
              <input
                type="text"
                placeholder="Ethiopia"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 14px 10px 38px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.9rem',
                  outline: 'none',
                }}
              />
            </div>
          </div>

          {/* City */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-navy-dark)' }}>
              City
            </label>
            <input
              type="text"
              placeholder="Addis Ababa"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '0.9rem',
                outline: 'none',
              }}
            />
          </div>

          {/* Address Line */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-navy-dark)' }}>
              Address Line
            </label>
            <input
              type="text"
              placeholder="Bole Sub-City, Woreda 03"
              value={addressLine}
              onChange={(e) => setAddressLine(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '0.9rem',
                outline: 'none',
              }}
            />
          </div>
        </div>

        {/* Submit button */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
          <button
            type="submit"
            disabled={saving}
            style={{
              padding: '12px 28px',
              borderRadius: '8px',
              border: 'none',
              background: 'linear-gradient(135deg, var(--color-gold-deep) 0%, var(--color-gold-bright) 100%)',
              color: '#ffffff',
              fontSize: '0.92rem',
              fontWeight: 700,
              cursor: saving ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 4px 14px rgba(190, 155, 73, 0.25)',
            }}
          >
            {saving && <Loader2 size={16} className="animate-spin" />}
            <span>{saving ? 'Saving…' : 'Save Changes'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default CustomerProfileTab;
