import React, { useState, useEffect, useRef } from 'react';
import { Lock, Eye, EyeOff, CheckCircle2, ArrowRight, ArrowLeft, RefreshCw, KeyRound, ShieldAlert } from 'lucide-react';
import { useAuth, UserRole } from '../context/AuthContext';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Card } from '../components/common/Card';
import { PasswordStrengthIndicator } from '../components/common/PasswordStrengthIndicator';
import { confirmPasswordReset, requestPasswordReset } from '../services/recoveryService';
import '../styles/batch1-focus.css';

interface ResetPasswordPageProps {
  email: string | null;
  onNavigate: (view: string) => void;
  onResetSuccess: () => void;
  onStartAgain: () => void;
}

const ROLE_DASHBOARDS: Record<UserRole, string> = {
  customer: 'dashboard',
  merchant: 'merchant/dashboard',
  provider: 'provider/dashboard',
  admin: 'admin/dashboard',
};

export const ResetPasswordPage: React.FC<ResetPasswordPageProps> = ({
  email,
  onNavigate,
  onResetSuccess,
  onStartAgain,
}) => {
  const { user } = useAuth();
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  // Resend cooldown timer (60 seconds)
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resendStatus, setResendStatus] = useState<string | null>(null);

  // D-03: Programmatic focus refs
  const startAgainHeadingRef = useRef<HTMLHeadingElement | null>(null);
  const successHeadingRef = useRef<HTMLHeadingElement | null>(null);
  const errorBannerRef = useRef<HTMLDivElement | null>(null);

  // If user is already signed in, redirect them to their active dashboard
  useEffect(() => {
    if (user) {
      onNavigate(ROLE_DASHBOARDS[user.role] || 'dashboard');
    }
  }, [user, onNavigate]);

  // D-03: Focus movement on Start Again card mount
  useEffect(() => {
    if (!email && !isSuccess) {
      startAgainHeadingRef.current?.focus();
    }
  }, [email, isSuccess]);

  // D-03: Focus movement on Success card appearance
  useEffect(() => {
    if (isSuccess) {
      successHeadingRef.current?.focus();
    }
  }, [isSuccess]);

  // D-03: Focus movement on API submission error
  useEffect(() => {
    if (errorMessage && errorBannerRef.current) {
      errorBannerRef.current.focus();
    }
  }, [errorMessage]);

  // Resend countdown interval
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const handleResendCode = async () => {
    if (!email || resendCooldown > 0) return;
    setResendStatus('Resending verification code...');
    setErrorMessage(null);

    try {
      const res = await requestPasswordReset(email);
      if (res.success) {
        setResendStatus('New verification code dispatched.');
        setResendCooldown(60);
      } else {
        // D-01: Map failure to fixed page copy
        setResendStatus("We couldn't complete your request. Please try again.");
      }
    } catch (err) {
      setResendStatus("We couldn't complete your request. Please try again.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email) {
      setErrorMessage("We couldn't complete your request. Please try again.");
      return;
    }

    const trimmedCode = code.trim();
    if (!trimmedCode || trimmedCode.length < 6) {
      setErrorMessage('Please enter the complete 6-digit verification code.');
      // D-03: Move focus to first invalid field
      document.getElementById('reset-code-input')?.focus();
      return;
    }

    if (newPassword.length < 8) {
      setErrorMessage('New password must be at least 8 characters long.');
      // D-03: Move focus to first invalid field
      document.getElementById('reset-new-password-input')?.focus();
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('Passwords do not match. Please re-enter your password.');
      // D-03: Move focus to first invalid field
      document.getElementById('reset-confirm-password-input')?.focus();
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await confirmPasswordReset(email, trimmedCode, newPassword);

      if (result.success) {
        setIsSuccess(true);
        // Clear sensitive credentials and inform parent to clear memory email
        setCode('');
        setNewPassword('');
        setConfirmPassword('');
        onResetSuccess();
      } else {
        // D-01: invalid_code shows generic invalid/expired copy; network, server, unknown show generic failure
        if (result.errorKind === 'invalid_code') {
          setErrorMessage('The recovery code is invalid or has expired. Please check your code or request a new one.');
        } else {
          setErrorMessage("We couldn't complete your request. Please try again.");
        }
      }
    } catch (err) {
      // D-01: Network failure shows generic failure
      setErrorMessage("We couldn't complete your request. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Condition 2: If no active email in state, render Start Again fallback card
  if (!email && !isSuccess) {
    return (
      <div
        className="batch1-page"
        style={{
          minHeight: '100vh',
          backgroundColor: 'var(--color-navy)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
        }}
      >
        <Card
          variant="bordered"
          style={{
            maxWidth: '460px',
            width: '100%',
            backgroundColor: '#ffffff',
            padding: '40px 32px',
            borderRadius: '16px',
            textAlign: 'center',
            boxShadow: 'var(--shadow-card-dark)',
          }}
        >
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              backgroundColor: 'rgba(15, 40, 91, 0.08)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '20px',
              color: 'var(--color-navy)',
            }}
          >
            <ShieldAlert size={28} />
          </div>

          <h2
            ref={startAgainHeadingRef}
            tabIndex={-1}
            style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--color-navy-dark)', marginBottom: '8px' }}
          >
            Recovery Session Expired
          </h2>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.92rem', lineHeight: 1.5, marginBottom: '28px' }}>
            No active password recovery session was found. Please enter your account email to receive a new one-time code.
          </p>

          <Button variant="gold" size="md" fullWidth onClick={onStartAgain}>
            Start Again <ArrowRight size={16} />
          </Button>
        </Card>
      </div>
    );
  }

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
            Create New <span className="gold-gradient-text">Password</span>
          </h2>
          <p style={{ color: 'var(--color-text-muted-dark)', fontSize: '1rem', lineHeight: 1.6, maxWidth: '440px' }}>
            Choose a robust, unique password to safeguard your access to ODS Global Network medical scheduling, payments, and management tools.
          </p>
        </div>

        <div style={{ position: 'relative', zIndex: 2, fontSize: '0.8rem', color: 'var(--color-text-muted-dark)' }}>
          © {new Date().getFullYear()} ODS Global Network. Bank-grade security and authentication.
        </div>
      </div>

      {/* RIGHT COLUMN: RESET FORM */}
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
        <div style={{ width: '100%', maxWidth: '460px' }}>
          {isSuccess ? (
            <Card
              variant="bordered"
              style={{
                textAlign: 'center',
                padding: '40px 24px',
                borderRadius: '16px',
                backgroundColor: '#ffffff',
                border: '1.5px solid var(--color-gold-mid)',
              }}
            >
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(16, 185, 129, 0.1)',
                  color: 'var(--color-success, #10b981)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '20px',
                }}
              >
                <CheckCircle2 size={36} />
              </div>

              <h2
                ref={successHeadingRef}
                tabIndex={-1}
                style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--color-navy-dark)', marginBottom: '8px' }}
              >
                Password Reset Complete
              </h2>

              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.92rem', lineHeight: 1.6, marginBottom: '28px' }}>
                Your account password has been updated successfully. You can now use your new credentials to sign in.
              </p>

              <Button
                variant="gold"
                size="lg"
                fullWidth
                onClick={() => onNavigate('login')}
              >
                Sign In Now <ArrowRight size={16} />
              </Button>
            </Card>
          ) : (
            <>
              <div style={{ marginBottom: '28px' }}>
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
                    Verify &amp; Reset
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
                  Set New Password
                </h1>
                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', lineHeight: 1.5 }}>
                  Enter the 6-digit code sent to <strong>{email}</strong> and specify your new password.
                </p>

                <div style={{ marginTop: '6px' }}>
                  <button
                    type="button"
                    onClick={onStartAgain}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--color-gold-deep)',
                      fontSize: '0.82rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      padding: '2px 4px',
                      borderRadius: '4px',
                    }}
                  >
                    Use a different email
                  </button>
                </div>
              </div>

              {/* Error Banner — D-03: Focused on failure (no aria-live to avoid double announcement) */}
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

              {/* Resend status notice — D-03: Uses aria-live (no focus change) */}
              {resendStatus && (
                <div
                  style={{
                    padding: '8px 12px',
                    borderRadius: '6px',
                    backgroundColor: 'rgba(15, 40, 91, 0.04)',
                    color: 'var(--color-navy)',
                    fontSize: '0.82rem',
                    marginBottom: '16px',
                  }}
                  aria-live="polite"
                >
                  {resendStatus}
                </div>
              )}

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {/* 6-Digit Code Input */}
                <div>
                  <Input
                    id="reset-code-input"
                    theme="light"
                    label="6-Digit Verification Code"
                    placeholder="Enter 6-digit code"
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    required
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, ''))}
                    leftIcon={<KeyRound size={18} />}
                  />
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '6px' }}>
                    <button
                      type="button"
                      onClick={handleResendCode}
                      disabled={resendCooldown > 0}
                      style={{
                        background: 'none',
                        border: 'none',
                        fontSize: '0.82rem',
                        fontWeight: 600,
                        color: resendCooldown > 0 ? 'var(--color-text-muted)' : 'var(--color-gold-deep)',
                        cursor: resendCooldown > 0 ? 'not-allowed' : 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '2px 4px',
                        borderRadius: '4px',
                      }}
                    >
                      <RefreshCw size={12} />
                      {resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : 'Resend code'}
                    </button>
                  </div>
                </div>

                {/* New Password */}
                <div>
                  <Input
                    id="reset-new-password-input"
                    theme="light"
                    label="New Password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Min 8 characters"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    leftIcon={<Lock size={18} />}
                    rightIcon={
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        style={{ color: 'var(--color-text-muted)', display: 'flex', background: 'none', border: 'none', padding: '2px', borderRadius: '4px' }}
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    }
                    autoComplete="new-password"
                  />
                  <PasswordStrengthIndicator password={newPassword} />
                </div>

                {/* Confirm Password */}
                <Input
                  id="reset-confirm-password-input"
                  theme="light"
                  label="Confirm New Password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Re-enter new password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  leftIcon={<Lock size={18} />}
                  autoComplete="new-password"
                />

                <Button
                  type="submit"
                  variant="gold"
                  size="lg"
                  fullWidth
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Resetting Password...' : 'Confirm & Reset Password'}
                </Button>
              </form>
            </>
          )}

          <div style={{ textAlign: 'center', marginTop: '28px', fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>
            Remembered your credentials?{' '}
            <button
              type="button"
              onClick={() => onNavigate('login')}
              style={{
                color: 'var(--color-gold-deep)',
                fontWeight: 700,
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '2px 4px',
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
