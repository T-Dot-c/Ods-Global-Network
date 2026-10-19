import React, { useState, useEffect } from 'react';
import { CheckCircle2, AlertCircle, Loader2, ArrowRight } from 'lucide-react';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { useAuth } from '../context/AuthContext';
import { verifyEmail } from '../services/recoveryService';

interface VerifyEmailPageProps {
  onNavigate: (view: string) => void;
}

export const VerifyEmailPage: React.FC<VerifyEmailPageProps> = ({ onNavigate }) => {
  const { user, refreshUser } = useAuth();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    // 1. Add page-level meta referrer tag to prevent leaking tokens
    let meta = document.querySelector('meta[name="referrer"]');
    let addedMeta = false;
    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute('name', 'referrer');
      meta.setAttribute('content', 'no-referrer');
      document.head.appendChild(meta);
      addedMeta = true;
    }

    // 2. Extract token from URL fragment (#token=...)
    const hash = window.location.hash || '';
    const match = hash.match(/token=([0-9a-fA-F]{64})/i) || hash.match(/#([0-9a-fA-F]{64})/i);

    // Strip fragment immediately from browser address bar & history
    if (hash) {
      window.history.replaceState(null, '', window.location.pathname + window.location.search);
    }

    if (!match) {
      setStatus('error');
      setErrorMessage('No valid verification token was found in the link.');
      return () => {
        if (addedMeta && meta && meta.parentNode) {
          meta.parentNode.removeChild(meta);
        }
      };
    }

    const token = match[1];

    // 3. Submit verification request
    verifyEmail(token)
      .then(async (result) => {
        if (result.success) {
          // Immediately refresh user session in context so dashboard unverified banner clears
          await refreshUser();
          try {
            localStorage.setItem('ods_auth_refresh', Date.now().toString());
          } catch {
            // Storage access might be restricted in some environments
          }
          setStatus('success');
        } else {
          setStatus('error');
          if (result.errorKind === 'invalid_code') {
            setErrorMessage('This verification link is invalid, expired, or has already been used.');
          } else {
            setErrorMessage('Unable to verify your email address. Please request a new verification link.');
          }
        }
      })
      .catch(() => {
        setStatus('error');
        setErrorMessage('Network error occurred. Please check your connection and try again.');
      });

    return () => {
      if (addedMeta && meta && meta.parentNode) {
        meta.parentNode.removeChild(meta);
      }
    };
  }, [refreshUser]);

  const targetDashboard = user
    ? user.role === 'merchant'
      ? 'merchant/dashboard'
      : user.role === 'provider'
      ? 'provider/dashboard'
      : user.role === 'admin' || user.role === 'super_admin'
      ? 'admin/dashboard'
      : 'dashboard'
    : 'login';

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#071228',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
      }}
    >
      <Card
        variant="bordered"
        style={{
          maxWidth: '480px',
          width: '100%',
          backgroundColor: '#ffffff',
          padding: '48px 32px',
          borderRadius: '16px',
          textAlign: 'center',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)',
        }}
      >
        {status === 'loading' && (
          <div style={{ padding: '20px 0' }}>
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                backgroundColor: 'rgba(2, 132, 199, 0.1)',
                color: '#0284c7',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '24px',
              }}
            >
              <Loader2 size={36} className="animate-spin" />
            </div>
            <h2
              style={{
                fontSize: '1.5rem',
                fontWeight: 700,
                color: '#0b1f3a',
                marginBottom: '8px',
              }}
            >
              Verifying Your Email
            </h2>
            <p style={{ color: '#64748b', fontSize: '0.95rem', lineHeight: 1.6 }}>
              Please wait while we confirm your account details…
            </p>
          </div>
        )}

        {status === 'success' && (
          <div>
            <div
              style={{
                width: '68px',
                height: '68px',
                borderRadius: '50%',
                backgroundColor: 'rgba(16, 185, 129, 0.12)',
                border: '2px solid rgba(16, 185, 129, 0.3)',
                color: '#10b981',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '24px',
              }}
            >
              <CheckCircle2 size={40} />
            </div>
            <h2
              style={{
                fontSize: '1.65rem',
                fontWeight: 800,
                color: '#0b1f3a',
                marginBottom: '10px',
              }}
            >
              Email Verified
            </h2>
            <p style={{ color: '#64748b', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '32px' }}>
              Your email address has been successfully verified. You now have full access to all features and services.
            </p>
            <Button
              variant="gold"
              size="lg"
              fullWidth
              onClick={() => onNavigate(targetDashboard)}
              style={{
                padding: '12px 24px',
                fontWeight: 700,
                borderRadius: '10px',
              }}
            >
              {user ? 'Continue to Dashboard' : 'Sign In to Your Account'} <ArrowRight size={18} />
            </Button>
          </div>
        )}

        {status === 'error' && (
          <div>
            <div
              style={{
                width: '68px',
                height: '68px',
                borderRadius: '50%',
                backgroundColor: 'rgba(239, 68, 68, 0.12)',
                border: '2px solid rgba(239, 68, 68, 0.3)',
                color: '#ef4444',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '24px',
              }}
            >
              <AlertCircle size={40} />
            </div>
            <h2
              style={{
                fontSize: '1.65rem',
                fontWeight: 800,
                color: '#0b1f3a',
                marginBottom: '10px',
              }}
            >
              Verification Failed
            </h2>
            <p style={{ color: '#64748b', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '32px' }}>
              {errorMessage}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <Button
                variant="gold"
                size="md"
                fullWidth
                onClick={() => onNavigate(user ? targetDashboard : 'login')}
              >
                {user ? 'Return to Dashboard' : 'Go to Sign In'}
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

export default VerifyEmailPage;
