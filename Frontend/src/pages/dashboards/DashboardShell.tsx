/**
 * DashboardShell — ODS Global Network
 *
 * Shared branded wrapper used by all 4 placeholder dashboards.
 * Contains ONLY the 5 approved items per the implementation plan:
 *   1. Welcome header
 *   2. Role badge
 *   3. Account status (merchant / provider only)
 *   4. Coming soon notice
 *   5. Logout button
 */
import React, { useState, useEffect } from 'react';
import { useAuth, UserRole, ApprovalStatus } from '../../context/AuthContext';
import { LogOut, ShieldCheck, CheckCircle2, Clock, Construction, AlertTriangle, Mail } from 'lucide-react';
import { resendVerification } from '../../services/recoveryService';

interface DashboardShellProps {
  onNavigate: (view: string) => void;
}

const ROLE_LABEL: Record<UserRole, string> = {
  customer:    'Customer',
  merchant:    'Merchant',
  provider:    'Service Provider',
  admin:       'Administrator',
  super_admin: 'Super Administrator',
};

const ROLE_COLOR: Record<UserRole, { bg: string; text: string; border: string }> = {
  customer:    { bg: 'rgba(16, 185, 129, 0.12)',  text: '#065f46', border: 'rgba(16, 185, 129, 0.35)' },
  merchant:    { bg: 'rgba(190, 155, 73, 0.12)',  text: '#8d7338', border: 'rgba(190, 155, 73, 0.35)' },
  provider:    { bg: 'rgba(59, 130, 246, 0.12)',  text: '#1e40af', border: 'rgba(59, 130, 246, 0.35)' },
  admin:       { bg: 'rgba(139, 92, 246, 0.12)',  text: '#5b21b6', border: 'rgba(139, 92, 246, 0.35)' },
  super_admin: { bg: 'rgba(220, 38, 38, 0.12)',   text: '#991b1b', border: 'rgba(220, 38, 38, 0.35)' },
};

const STATUS_STYLE: Record<ApprovalStatus, { bg: string; text: string; border: string; label: string }> = {
  pending:  { bg: 'rgba(245, 158, 11, 0.10)', text: '#92400e', border: 'rgba(245, 158, 11, 0.35)', label: 'Pending Review'  },
  approved: { bg: 'rgba(16, 185, 129, 0.10)', text: '#065f46', border: 'rgba(16, 185, 129, 0.35)', label: 'Approved'        },
  rejected: { bg: 'rgba(239, 68, 68, 0.10)',  text: '#7f1d1d', border: 'rgba(239, 68, 68, 0.35)',  label: 'Rejected'        },
};

export const DashboardShell: React.FC<DashboardShellProps> = ({ onNavigate }) => {
  const { user, logout } = useAuth();
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resendMessage, setResendMessage] = useState<string | null>(null);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  if (!user) return null;

  const roleColors  = ROLE_COLOR[user.role];
  const showStatus  = user.role === 'merchant' || user.role === 'provider';
  const statusStyle = STATUS_STYLE[user.approval_status] ?? STATUS_STYLE.pending;
  const isUnverified = !user.is_email_verified && user.role !== 'admin' && user.role !== 'super_admin';

  const handleResend = async () => {
    if (resendCooldown > 0 || !user.email) return;
    setResendMessage('Sending verification link...');
    setResendCooldown(120);

    try {
      await resendVerification(user.email);
      setResendMessage('A fresh verification link has been dispatched to your inbox.');
    } catch {
      setResendMessage('Unable to send verification link. Please try again later.');
    }
  };

  const handleLogout = async () => {
    await logout();
    onNavigate('login');
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#ffffff', // Pure white solid background
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 24px',
        fontFamily: 'var(--font-body)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Subtle Background Texture */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: 'url(/assets/brand/raster/brand-pattern.png)',
          opacity: 0.015, // Extremely subtle 1.5% opacity watermark
          backgroundSize: '360px',
          pointerEvents: 'none',
        }}
      />

      {/* Gold radial glow */}
      <div
        style={{
          position: 'absolute',
          top: '-120px',
          right: '-120px',
          width: '480px',
          height: '480px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(190,155,73,0.12) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      {/* ── Dashboard Card ──────────────────────────────────── */}
      <div
        style={{
          position: 'relative',
          zIndex: 2,
          width: '100%',
          maxWidth: '560px',
          backgroundColor: 'rgba(8, 23, 56, 0.85)',
          border: '1px solid var(--color-border-dark)',
          borderRadius: '20px',
          boxShadow: '0 24px 64px rgba(0,0,0,0.4)',
          backdropFilter: 'blur(16px)',
          padding: '48px 40px',
          textAlign: 'center',
        }}
      >
        {/* Logo */}
        <img
          src="/assets/brand/vector/ods-logo-gold-primary.svg"
          alt="ODS Global Network"
          style={{ height: '44px', marginBottom: isUnverified ? '20px' : '32px' }}
        />

        {/* ── Unverified Email Banner ─────────────────────────── */}
        {isUnverified && (
          <div
            style={{
              backgroundColor: 'rgba(245, 158, 11, 0.12)',
              border: '1px solid rgba(245, 158, 11, 0.35)',
              borderRadius: '12px',
              padding: '16px 20px',
              marginBottom: '28px',
              textAlign: 'left',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
              <div
                style={{
                  color: '#f59e0b',
                  flexShrink: 0,
                  marginTop: '2px',
                }}
              >
                <AlertTriangle size={20} />
              </div>
              <div style={{ flex: 1 }}>
                <h4 style={{ color: '#fbbf24', fontSize: '0.92rem', fontWeight: 700, margin: '0 0 4px' }}>
                  Email Verification Required
                </h4>
                <p style={{ color: '#cbd5e1', fontSize: '0.84rem', lineHeight: 1.5, margin: 0 }}>
                  Your email address (<strong>{user.email}</strong>) is not yet verified. Please verify your email to unlock all features including profile updates and document uploads.
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', paddingTop: '4px' }}>
              <button
                type="button"
                onClick={handleResend}
                disabled={resendCooldown > 0}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  backgroundColor: resendCooldown > 0 ? 'rgba(255, 255, 255, 0.08)' : 'rgba(245, 158, 11, 0.25)',
                  border: '1px solid rgba(245, 158, 11, 0.4)',
                  color: resendCooldown > 0 ? '#94a3b8' : '#fef3c7',
                  padding: '6px 14px',
                  borderRadius: '6px',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  cursor: resendCooldown > 0 ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                <Mail size={14} />
                {resendCooldown > 0 ? `Resend link in ${resendCooldown}s` : 'Resend verification link'}
              </button>

              {resendMessage && (
                <span style={{ fontSize: '0.8rem', color: '#fef3c7', fontStyle: 'italic' }}>
                  {resendMessage}
                </span>
              )}
            </div>
          </div>
        )}

        {/* ── 1. Welcome Header ─────────────────────────────── */}
        <h1
          style={{
            fontSize: '1.9rem',
            fontWeight: 700,
            color: '#ffffff',
            marginBottom: '6px',
            fontFamily: 'var(--font-heading)',
            lineHeight: 1.2,
          }}
        >
          Welcome, {user.full_name.split(' ')[0]}
        </h1>
        <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted-dark)', marginBottom: '28px' }}>
          {user.email}
        </p>

        {/* ── 2. Role Badge ──────────────────────────────────── */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap', marginBottom: '20px' }}>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '5px 16px',
              borderRadius: '999px',
              backgroundColor: roleColors.bg,
              border: `1px solid ${roleColors.border}`,
              fontSize: '0.82rem',
              fontWeight: 700,
              color: roleColors.text,
              letterSpacing: '0.03em',
            }}
          >
            <ShieldCheck size={14} />
            {ROLE_LABEL[user.role]}
          </span>

          {/* ── 3. Account Status (merchant / provider only) ── */}
          {showStatus && (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '5px 16px',
                borderRadius: '999px',
                backgroundColor: statusStyle.bg,
                border: `1px solid ${statusStyle.border}`,
                fontSize: '0.82rem',
                fontWeight: 700,
                color: statusStyle.text,
                letterSpacing: '0.03em',
              }}
            >
              {user.approval_status === 'approved' ? (
                <CheckCircle2 size={14} color={statusStyle.text} />
              ) : (
                <Clock size={14} color={statusStyle.text} />
              )}
              <span>Status: {statusStyle.label}</span>
            </span>
          )}
        </div>

        {/* Divider */}
        <div
          style={{
            height: '1px',
            background: 'linear-gradient(90deg, transparent, rgba(190,155,73,0.3), transparent)',
            margin: '24px 0',
          }}
        />

        {/* ── 4. Coming Soon Notice ─────────────────────────── */}
        <div
          style={{
            backgroundColor: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '12px',
            padding: '20px 24px',
            marginBottom: '32px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
            <Construction size={28} color="var(--color-gold-bright)" />
          </div>
          <p
            style={{
              fontSize: '0.9rem',
              color: 'var(--color-text-muted-dark)',
              lineHeight: 1.65,
              margin: 0,
            }}
          >
            Your full dashboard is under construction — more features coming soon.
          </p>
        </div>

        {/* ── 5. Logout Button ──────────────────────────────── */}
        <button
          id="dashboard-logout-btn"
          onClick={handleLogout}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 28px',
            borderRadius: '10px',
            background: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: '#fca5a5',
            fontSize: '0.9rem',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            fontFamily: 'var(--font-body)',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = 'rgba(239,68,68,0.22)';
            (e.currentTarget as HTMLButtonElement).style.color = '#fecaca';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = 'rgba(239,68,68,0.12)';
            (e.currentTarget as HTMLButtonElement).style.color = '#fca5a5';
          }}
        >
          <LogOut size={16} />
          Sign Out
        </button>
      </div>
    </div>
  );
};

export default DashboardShell;
