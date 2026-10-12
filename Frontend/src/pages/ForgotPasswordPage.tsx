import React, { useState, useEffect, useRef } from 'react';
import { Mail, ArrowLeft, KeyRound, ArrowRight, ShieldCheck, UserCheck } from 'lucide-react';
import { useAuth, UserRole } from '../context/AuthContext';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Card } from '../components/common/Card';
import { requestPasswordReset } from '../services/recoveryService';
import '../styles/batch1-focus.css';

interface ForgotPasswordPageProps {
  onNavigate: (view: string) => void;
  onCodeSent: (email: string) => void;
}

const ROLE_DASHBOARDS: Record<UserRole, string> = {
  customer: 'dashboard',
  merchant: 'merchant/dashboard',
  provider: 'provider/dashboard',
  admin: 'admin/dashboard',
  super_admin: 'admin/dashboard',
};

export const ForgotPasswordPage: React.FC<ForgotPasswordPageProps> = ({ onNavigate, onCodeSent }) => {
  const { user } = useAuth();
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  // Focus refs for D-03
  const errorBannerRef = useRef<HTMLDivElement | null>(null);
  const successHeadingRef = useRef<HTMLHeadingElement | null>(null);

  // If user is already signed in, redirect them to their active dashboard
  useEffect(() => {
    if (user) {
      onNavigate(ROLE_DASHBOARDS[user.role] || 'dashboard');
    }
  }, [user, onNavigate]);

  // Focus movement on state changes (D-03):
  // Focus success heading on success; focus error banner on submission error
  useEffect(() => {
    if (successNotice) {
      successHeadingRef.current?.focus();
    }
  }, [successNotice]);

  useEffect(() => {
    if (errorMessage && errorBannerRef.current) {
      errorBannerRef.current.focus();
    }
  }, [errorMessage]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessNotice(null);

    const trimmed = email.trim();
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setErrorMessage("We couldn't complete your request. Please try again.");
      document.getElementById('forgot-email-input')?.focus();
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await requestPasswordReset(trimmed);

      if (result.success) {
        // Uniform neutral notice on success
        setSuccessNotice('If an account exists with this email, a reset code has been sent.');
      } else {
        // D-01: Strictly fixed generic text on every failure — never result.message
        setErrorMessage("We couldn't complete your request. Please try again.");
      }
    } catch (err) {
      // D-01: Strictly fixed generic text on network failure
      setErrorMessage("We couldn't complete your request. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="batch1-page"
      style={{
        minHeight: '100vh',
        backgroundColor: 'var(--color-navy)',
        display: 'flex',
        alignItems: 'stretch',
      }}
    >
      {/* LEFT COLUMN: BRAND SHOWCASE (Desktop) */}
      <div
        className="auth-brand-col"
        style={{
          flex: '1 1 45%',
          backgroundColor: 'var(--color-navy-dark)',
          position: 'relative',
          padding: '60px 48px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          borderRight: '1px solid var(--color-border-dark)',
          overflow: 'hidden',
        }}
      >
        {/* Background Texture */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage: 'url(/assets/brand/raster/brand-pattern.png)',
            opacity: 0.05,
            backgroundSize: '360px',
            pointerEvents: 'none',
          }}
        />

        <div style={{ position: 'relative', zIndex: 2 }}>
          <button
            type="button"
            onClick={() => onNavigate('home')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              color: 'var(--color-gold-bright)',
              fontSize: '0.9rem',
              fontWeight: 500,
              marginBottom: '40px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '4px 8px',
              borderRadius: '6px',
            }}
          >
            <ArrowLeft size={16} /> Return to Home
          </button>

          <img
            src="/assets/brand/vector/ods-logo-gold-primary.svg"
            alt="ODS Global Network"
            style={{ height: '54px', marginBottom: '36px' }}
          />

          <h2 style={{ fontSize: '2.2rem', color: '#ffffff', marginBottom: '16px', lineHeight: 1.25 }}>
            Account <span className="gold-gradient-text">Recovery &amp; Protection</span>
          </h2>
          <p style={{ color: 'var(--color-text-muted-dark)', fontSize: '1rem', lineHeight: 1.6, maxWidth: '440px' }}>
            Regain secure access to your healthcare records, provider bookings, and institutional portal sessions with verified one-time credentials.
          </p>
        </div>

        {/* Feature Badges */}
        <div style={{ position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', gap: '16px', margin: '40px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ padding: '8px', borderRadius: '8px', background: 'rgba(190, 155, 73, 0.15)', color: 'var(--color-gold-bright)' }}>
              <ShieldCheck size={20} />
            </div>
            <div>
              <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#ffffff' }}>Anti-Enumeration Privacy</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted-dark)' }}>Identity checks remain private and unexposed</div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ padding: '8px', borderRadius: '8px', background: 'rgba(190, 155, 73, 0.15)', color: 'var(--color-gold-bright)' }}>
              <UserCheck size={20} />
            </div>
            <div>
              <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#ffffff' }}>Time-Limited OTP Codes</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted-dark)' }}>Cryptographically bounded 15-minute verification</div>
            </div>
          </div>
        </div>

        <div style={{ position: 'relative', zIndex: 2, fontSize: '0.8rem', color: 'var(--color-text-muted-dark)' }}>
          © {new Date().getFullYear()} ODS Global Network. All access monitored and encrypted.
        </div>
      </div>

      {/* RIGHT COLUMN: RECOVERY CARD FORM */}
      <div
        style={{
          flex: '1 1 55%',
          backgroundColor: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '48px 24px',
          position: 'relative',
        }}
      >
        <div style={{ width: '100%', maxWidth: '440px' }}>
          <div style={{ marginBottom: '32px' }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '4px 12px',
                borderRadius: '999px',
                backgroundColor: 'rgba(190, 155, 73, 0.12)',
                border: '1px solid var(--color-gold-mid)',
                marginBottom: '14px',
              }}
            >
              <KeyRound size={14} color="var(--color-gold-deep)" />
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-gold-deep)' }}>
                Credential Recovery
              </span>
            </div>

            <h1
              style={{
                fontSize: '1.9rem',
                color: 'var(--color-navy-dark)',
                fontWeight: 700,
                marginBottom: '8px',
                fontFamily: 'var(--font-heading)',
              }}
            >
              Forgot Password
            </h1>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.92rem', lineHeight: 1.5 }}>
              Enter your registered account email to receive a secure one-time verification code.
            </p>
          </div>

          {/* Error Banner — focused on failure (no aria-live to avoid double announcement) */}
          {errorMessage && (
            <div
              ref={errorBannerRef}
              tabIndex={-1}
              style={{
                padding: '12px 16px',
                borderRadius: '8px',
                backgroundColor: 'rgba(239, 68, 68, 0.08)',
                border: '1px solid rgba(239, 68, 68, 0.25)',
                color: 'var(--color-danger, #ef4444)',
                fontSize: '0.88rem',
                fontWeight: 500,
                lineHeight: 1.5,
                marginBottom: '20px',
              }}
            >
              {errorMessage}
            </div>
          )}

          {/* Success Notice State — heading focused on success (no aria-live to avoid double announcement) */}
          {successNotice ? (
            <Card
              variant="bordered"
              style={{
                padding: '24px',
                backgroundColor: 'rgba(16, 185, 129, 0.04)',
                borderColor: 'var(--color-gold-mid)',
                borderRadius: '12px',
                marginBottom: '24px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '20px' }}>
                <div
                  style={{
                    padding: '8px',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(190, 155, 73, 0.15)',
                    color: 'var(--color-gold-deep)',
                    flexShrink: 0,
                  }}
                >
                  <KeyRound size={20} />
                </div>
                <div>
                  <h3
                    ref={successHeadingRef}
                    tabIndex={-1}
                    style={{
                      fontSize: '1rem',
                      fontWeight: 700,
                      color: 'var(--color-navy-dark)',
                      marginBottom: '4px',
                    }}
                  >
                    Reset Code Dispatched
                  </h3>
                  <p style={{ fontSize: '0.88rem', color: 'var(--color-text-muted)', lineHeight: 1.5 }}>
                    {successNotice}
                  </p>
                </div>
              </div>

              <Button
                variant="gold"
                size="md"
                fullWidth
                onClick={() => onCodeSent(email.trim().toLowerCase())}
              >
                Enter Reset Code <ArrowRight size={16} />
              </Button>
            </Card>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <Input
                id="forgot-email-input"
                theme="light"
                label="Registered Account Email"
                placeholder="name@example.com"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                leftIcon={<Mail size={18} />}
                autoComplete="email"
              />

              <Button
                type="submit"
                variant="gold"
                size="lg"
                fullWidth
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Sending Code...' : 'Send Recovery Code'}
              </Button>
            </form>
          )}

          <div style={{ textAlign: 'center', marginTop: '32px', fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>
            Remembered your password?{' '}
            <button
              type="button"
              onClick={() => onNavigate('login')}
              style={{
                color: 'var(--color-gold-deep)',
                fontWeight: 700,
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '2px 6px',
                borderRadius: '4px',
              }}
            >
              Sign In
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
