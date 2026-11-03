import React, { useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import {
  Shield,
  User,
  Building2,
  Bell,
  LogOut,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  Clock,
  XCircle,
  Loader2,
} from 'lucide-react';

interface DashboardSettingsViewProps {
  onNavigateToProfile?: () => void;
}

export const DashboardSettingsView: React.FC<DashboardSettingsViewProps> = ({ onNavigateToProfile }) => {
  const { user, signOutAll } = useAuth();
  const [signingOutAll, setSigningOutAll] = useState(false);
  const [securityMsg, setSecurityMsg] = useState<string | null>(null);

  const handleSignOutAll = async () => {
    const confirmed = window.confirm(
      'Are you sure you want to sign out of all devices? This will invalidate all active sessions immediately.'
    );
    if (!confirmed) return;

    try {
      setSigningOutAll(true);
      if (signOutAll) {
        await signOutAll();
      }
      window.location.href = '/login';
    } catch {
      setSecurityMsg('Failed to sign out of all devices. Please try again.');
      setSigningOutAll(false);
    }
  };

  const status = user?.approval_status || 'pending';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px', maxWidth: '960px' }}>
      <div>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--color-navy-dark)', margin: 0 }}>
          Account & Security Settings
        </h2>
        <p style={{ color: '#64748b', fontSize: '0.88rem', margin: '4px 0 0' }}>
          Manage your enterprise access credentials, account security, and notification preferences.
        </p>
      </div>

      {/* Section 1: Account Information */}
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px' }}>
          <User size={20} color="var(--color-gold-deep)" />
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--color-navy-dark)', margin: 0 }}>
            Account Identification
          </h3>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '18px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#64748b', marginBottom: '4px' }}>
              Full Name / Account Owner
            </label>
            <div style={{ fontSize: '0.92rem', fontWeight: 600, color: 'var(--color-navy-dark)' }}>
              {user?.full_name || '—'}
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#64748b', marginBottom: '4px' }}>
              Primary Email Address
            </label>
            <div style={{ fontSize: '0.92rem', fontWeight: 600, color: 'var(--color-navy-dark)' }}>
              {user?.email || '—'}
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#64748b', marginBottom: '4px' }}>
              Account Role
            </label>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <span
                style={{
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  padding: '3px 10px',
                  borderRadius: '999px',
                  backgroundColor: 'rgba(190, 155, 73, 0.15)',
                  color: 'var(--color-gold-deep)',
                }}
              >
                {user?.role}
              </span>
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#64748b', marginBottom: '4px' }}>
              Email Verification Status
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.88rem' }}>
              {user?.is_email_verified ? (
                <>
                  <CheckCircle2 size={16} color="#065f46" />
                  <span style={{ color: '#065f46', fontWeight: 600 }}>Verified</span>
                </>
              ) : (
                <>
                  <AlertTriangle size={16} color="#b45309" />
                  <span style={{ color: '#b45309', fontWeight: 600 }}>Verification Pending</span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Section 2: Security & Device Sessions */}
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px' }}>
          <Shield size={20} color="var(--color-gold-deep)" />
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--color-navy-dark)', margin: 0 }}>
            Session & Device Security
          </h3>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ maxWidth: '600px' }}>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#1e293b', margin: '0 0 4px' }}>
              Sign Out of All Devices
            </h4>
            <p style={{ color: '#64748b', fontSize: '0.84rem', margin: 0, lineHeight: 1.5 }}>
              If you suspect unauthorized access or logged in from a shared computer, you can invalidate all active sessions across all browsers and devices immediately.
            </p>
          </div>

          <button
            type="button"
            onClick={handleSignOutAll}
            disabled={signingOutAll}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 18px',
              borderRadius: '8px',
              backgroundColor: '#fee2e2',
              color: '#991b1b',
              border: '1px solid #fca5a5',
              fontWeight: 600,
              fontSize: '0.88rem',
              cursor: signingOutAll ? 'not-allowed' : 'pointer',
              transition: 'background-color 0.15s ease',
            }}
          >
            {signingOutAll ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Signing out...</span>
              </>
            ) : (
              <>
                <LogOut size={16} />
                <span>Sign Out of All Devices</span>
              </>
            )}
          </button>
        </div>

        {securityMsg && (
          <div style={{ padding: '10px 14px', borderRadius: '8px', backgroundColor: '#fee2e2', color: '#991b1b', fontSize: '0.85rem' }}>
            {securityMsg}
          </div>
        )}
      </div>

      {/* Section 3: Business Profile & Compliance */}
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px' }}>
          <Building2 size={20} color="var(--color-gold-deep)" />
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--color-navy-dark)', margin: 0 }}>
            Commercial Enterprise & Compliance Profile
          </h3>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
              <span style={{ fontSize: '0.92rem', fontWeight: 700, color: '#1e293b' }}>
                Verification & KYC Status:
              </span>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '3px 12px',
                  borderRadius: '999px',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  backgroundColor: status === 'approved' ? 'rgba(16, 185, 129, 0.12)' : (status === 'rejected' ? 'rgba(239, 68, 68, 0.12)' : 'rgba(245, 158, 11, 0.12)'),
                  color: status === 'approved' ? '#065f46' : (status === 'rejected' ? '#b91c1c' : '#b45309'),
                  border: `1px solid ${status === 'approved' ? 'rgba(16, 185, 129, 0.3)' : (status === 'rejected' ? 'rgba(239, 68, 68, 0.3)' : 'rgba(245, 158, 11, 0.3)')}`,
                }}
              >
                {status === 'approved' ? <CheckCircle2 size={13} /> : (status === 'rejected' ? <XCircle size={13} /> : <Clock size={13} />)}
                {status.toUpperCase()}
              </span>
            </div>
            <p style={{ color: '#64748b', fontSize: '0.84rem', margin: 0, lineHeight: 1.5, maxWidth: '640px' }}>
              Your business identity and operating license are managed under the <strong>Business Profile</strong> tab.
            </p>
          </div>

          {onNavigateToProfile && (
            <button
              type="button"
              onClick={onNavigateToProfile}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 18px',
                borderRadius: '8px',
                backgroundColor: '#f8fafc',
                border: '1px solid #cbd5e1',
                color: 'var(--color-navy-dark)',
                fontWeight: 600,
                fontSize: '0.88rem',
                cursor: 'pointer',
              }}
            >
              <span>Edit Business Profile</span>
              <ArrowRight size={16} />
            </button>
          )}
        </div>

        {/* Compliance Reset Advisory Notice */}
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '12px',
            padding: '14px 18px',
            borderRadius: '8px',
            backgroundColor: '#fffbeb',
            border: '1px solid #fde68a',
            color: '#92400e',
            fontSize: '0.84rem',
            lineHeight: 1.5,
          }}
        >
          <AlertTriangle size={18} color="#d97706" style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>
            <strong>Compliance Advisory:</strong> Modifying commercial identity fields (such as Legal Business Name, Registered Category, or Physical Operating Address) triggers an automated Compliance Reset back to Pending review to satisfy regulatory validation.
          </div>
        </div>
      </div>

      {/* Section 4: Notification Preferences */}
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px' }}>
          <Bell size={20} color="var(--color-gold-deep)" />
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--color-navy-dark)', margin: 0 }}>
            Operational Notification Channels
          </h3>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #f8fafc' }}>
            <div>
              <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#1e293b' }}>
                Service Bookings & Order Alerts
              </div>
              <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                Receive real-time email dispatch whenever a customer books or purchases your offering.
              </div>
            </div>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#065f46', backgroundColor: '#ecfdf5', padding: '3px 10px', borderRadius: '999px', border: '1px solid #a7f3d0' }}>
              Active (Email)
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #f8fafc' }}>
            <div>
              <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#1e293b' }}>
                Compliance & Moderation Updates
              </div>
              <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                Notices regarding catalog approvals, audit decisions, or KYC document reviews.
              </div>
            </div>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#065f46', backgroundColor: '#ecfdf5', padding: '3px 10px', borderRadius: '999px', border: '1px solid #a7f3d0' }}>
              Active (Email)
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0' }}>
            <div>
              <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#1e293b' }}>
                SMS Dispatch Notifications
              </div>
              <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                Direct SMS delivery to verified primary phone.
              </div>
            </div>
            <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#94a3b8', backgroundColor: '#f1f5f9', padding: '3px 10px', borderRadius: '999px' }}>
              Optional / Cellular
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

