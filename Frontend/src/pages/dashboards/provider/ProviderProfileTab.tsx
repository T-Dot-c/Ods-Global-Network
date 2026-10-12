import React, { useState, useEffect } from 'react';
import {
  Stethoscope,
  MapPin,
  Save,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';
import {
  getProviderProfile,
  updateProviderProfile,
  ProviderProfile,
  UpdateProviderPayload,
} from '../../../services/providerService';

interface ProviderProfileTabProps {
  onProfileUpdated?: (updated: ProviderProfile) => void;
}

export const ProviderProfileTab: React.FC<ProviderProfileTabProps> = ({ onProfileUpdated }) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Profile Form State
  const [providerName, setProviderName] = useState('');
  const [providerType, setProviderType] = useState('');
  const [serviceCategory, setServiceCategory] = useState('');
  const [officialPhone, setOfficialPhone] = useState('');
  const [officialEmail, setOfficialEmail] = useState('');
  const [website, setWebsite] = useState('');
  const [description, setDescription] = useState('');
  const [licenseNo, setLicenseNo] = useState('');

  // Address State
  const [addressLine, setAddressLine] = useState('');
  const [city, setCity] = useState('');
  const [regionState, setRegionState] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [country, setCountry] = useState('Ethiopia');

  // Contact State
  const [contactName, setContactName] = useState('');
  const [contactPosition, setContactPosition] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');

  const [approvalStatus, setApprovalStatus] = useState<'pending' | 'approved' | 'rejected'>('pending');

  const loadProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      const prof = await getProviderProfile();
      setProviderName(prof.provider_name || '');
      setProviderType(prof.provider_type || '');
      setServiceCategory(prof.service_category || '');
      setOfficialPhone(prof.official_phone || '');
      setOfficialEmail(prof.official_email || '');
      setWebsite(prof.website || '');
      setDescription(prof.description || '');
      setLicenseNo(prof.license_no || '');
      setApprovalStatus(prof.approval_status);

      if (prof.address) {
        setAddressLine(prof.address.address_line || '');
        setCity(prof.address.city || '');
        setRegionState(prof.address.region_state || '');
        setPostalCode(prof.address.postal_code || '');
        setCountry(prof.address.country || 'Ethiopia');
      }

      if (prof.contact) {
        setContactName(prof.contact.full_name || '');
        setContactPosition(prof.contact.position_role || '');
        setContactEmail(prof.contact.email || '');
        setContactPhone(prof.contact.phone || '');
      }

      if (onProfileUpdated) onProfileUpdated(prof);
    } catch (err: any) {
      setError(err.message || 'Failed to load provider profile.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (approvalStatus === 'approved') {
      const confirmed = window.confirm(
        'Notice: Modifying your provider name, provider type, license number, or physical facility address will trigger a Compliance Reset, transitioning your account back to Pending review. Do you wish to continue?'
      );
      if (!confirmed) return;
    }

    try {
      setSaving(true);
      const payload: UpdateProviderPayload = {
        provider_name: providerName.trim(),
        provider_type: providerType.trim() || undefined,
        service_category: serviceCategory.trim() || undefined,
        official_phone: officialPhone.trim() || undefined,
        official_email: officialEmail.trim() || undefined,
        website: website.trim() || undefined,
        description: description.trim() || undefined,
        license_no: licenseNo.trim() || undefined,
        address_line: addressLine.trim() || undefined,
        city: city.trim() || undefined,
        region_state: regionState.trim() || undefined,
        postal_code: postalCode.trim() || undefined,
        country: country.trim() || undefined,
        contact_full_name: contactName.trim() || undefined,
        contact_position: contactPosition.trim() || undefined,
        contact_email: contactEmail.trim() || undefined,
        contact_phone: contactPhone.trim() || undefined,
      };

      const res = await updateProviderProfile(payload);
      if (res.compliance_reset) {
        setSuccessMsg('Profile updated. Because compliance-critical fields changed, your account was transitioned back to Pending review.');
      } else {
        setSuccessMsg(res.message || 'Provider profile updated successfully.');
      }
      await loadProfile();
    } catch (err: any) {
      setError(err.message || 'Failed to update provider profile.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '48px', color: '#64748b' }}>
        <RefreshCw size={26} className="animate-spin" style={{ margin: '0 auto 12px' }} />
        <p>Loading healthcare provider profile...</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--color-navy-dark)', margin: 0 }}>
            Healthcare Provider Profile & Facility Info
          </h2>
          <p style={{ color: '#64748b', fontSize: '0.88rem', margin: '4px 0 0' }}>
            Maintain medical accreditation, clinical license number, and facility address.
          </p>
        </div>

        <button
          type="submit"
          disabled={saving}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 22px',
            borderRadius: '8px',
            backgroundColor: 'var(--color-gold-deep)',
            border: 'none',
            color: '#ffffff',
            fontWeight: 700,
            fontSize: '0.9rem',
            cursor: saving ? 'not-allowed' : 'pointer',
          }}
        >
          <Save size={16} />
          <span>{saving ? 'Saving...' : 'Save Profile Changes'}</span>
        </button>
      </div>

      {successMsg && (
        <div style={{ padding: '12px 16px', borderRadius: '8px', backgroundColor: 'rgba(16, 185, 129, 0.1)', border: '1px solid #10b981', color: '#065f46', fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <CheckCircle2 size={18} />
          <span>{successMsg}</span>
        </div>
      )}
      {error && (
        <div style={{ padding: '12px 16px', borderRadius: '8px', backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', color: '#991b1b', fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <AlertTriangle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Facility / Clinic Section */}
      <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px' }}>
          <Stethoscope size={20} color="var(--color-gold-deep)" />
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--color-navy-dark)', margin: 0 }}>
            Clinical Facility & License Information
          </h3>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
              Provider / Facility Name *
            </label>
            <input
              type="text"
              required
              value={providerName}
              onChange={(e) => setProviderName(e.target.value)}
              style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.88rem', outline: 'none' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
              Provider Type (e.g. Clinic, Hospital, Lab) *
            </label>
            <input
              type="text"
              required
              value={providerType}
              onChange={(e) => setProviderType(e.target.value)}
              style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.88rem', outline: 'none' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
              Medical / Facility License Number *
            </label>
            <input
              type="text"
              required
              value={licenseNo}
              onChange={(e) => setLicenseNo(e.target.value)}
              style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.88rem', outline: 'none' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
              Official Phone
            </label>
            <input
              type="text"
              value={officialPhone}
              onChange={(e) => setOfficialPhone(e.target.value)}
              style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.88rem', outline: 'none' }}
            />
          </div>
        </div>
      </div>

      {/* Address Section */}
      <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px' }}>
          <MapPin size={20} color="var(--color-gold-deep)" />
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--color-navy-dark)', margin: 0 }}>
            Physical Clinic / Facility Location
          </h3>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
              Facility Address Line
            </label>
            <input
              type="text"
              value={addressLine}
              onChange={(e) => setAddressLine(e.target.value)}
              style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.88rem', outline: 'none' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
              City
            </label>
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.88rem', outline: 'none' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
              Region / State
            </label>
            <input
              type="text"
              value={regionState}
              onChange={(e) => setRegionState(e.target.value)}
              style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.88rem', outline: 'none' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
              Country
            </label>
            <input
              type="text"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.88rem', outline: 'none' }}
            />
          </div>
        </div>
      </div>
    </form>
  );
};
