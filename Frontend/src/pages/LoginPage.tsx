import React, { useState } from 'react';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Card } from '../components/common/Card';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ShieldCheck,
  ArrowLeft,
  UserCheck,
  Building2,
  KeyRound,
  Stethoscope,
} from 'lucide-react';
import { useAuth, UserRole } from '../context/AuthContext';

const API_BASE = 'http://localhost:3001';

interface LoginPageProps {
  onNavigate: (view: string) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onNavigate }) => {
  const { login } = useAuth();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [errors, setErrors] = useState<{ identifier?: string; password?: string; general?: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loginSuccess, setLoginSuccess] = useState(false);
  const [detectedRole, setDetectedRole] = useState<UserRole>('customer');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: { identifier?: string; password?: string } = {};

    if (!identifier.trim()) {
      newErrors.identifier = 'Email or phone number is required';
    } else if (identifier.includes('@') && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier)) {
      newErrors.identifier = 'Please enter a valid email address';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    setIsSubmitting(true);
    setErrors({});

    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email: identifier.trim(), password }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrors({ general: data.message || 'Invalid email or password.' });
        setIsSubmitting(false);
        return;
      }

      // Store user in context and navigate to role dashboard
      login(data.user);
      setDetectedRole(data.user.role as UserRole);
      setLoginSuccess(true);

      // Brief success flash, then navigate to role-specific dashboard
      setTimeout(() => {
        const role = data.user.role;
        const targetRoute = role === 'customer' ? 'dashboard' : `${role}/dashboard`;
        onNavigate(targetRoute);
      }, 900);
    } catch {
      setErrors({ general: 'Unable to connect to the server. Please try again.' });
      setIsSubmitting(false);
    }
  };

  const roleMeta: Record<UserRole, { name: string; icon: React.ReactNode }> = {
    customer: {
      name: 'Customer Portal',
      icon: <UserCheck size={18} color="var(--color-gold-bright)" />,
    },
    merchant: {
      name: 'Merchant Portal',
      icon: <Building2 size={18} color="var(--color-gold-bright)" />,
    },
    provider: {
      name: 'Service Provider Portal',
      icon: <Stethoscope size={18} color="var(--color-gold-bright)" />,
    },
    admin: {
      name: 'Administrator Portal',
      icon: <KeyRound size={18} color="var(--color-gold-bright)" />,
    },
  };

  return (
    <div
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
            onClick={() => onNavigate('home')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              color: 'var(--color-gold-bright)',
              fontSize: '0.9rem',
              fontWeight: 500,
              marginBottom: '40px',
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
            Secure Gateway to <span className="gold-gradient-text">Premier Health & Wellness</span>
          </h2>
          <p style={{ color: 'var(--color-text-muted-dark)', fontSize: '1rem', lineHeight: 1.6, maxWidth: '440px' }}>
            Access verified medical consultations, manage executive hospital appointments, or administer your merchant operations dashboard.
          </p>
        </div>

        {/* Feature badges */}
        <div style={{ position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', gap: '16px', margin: '40px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ padding: '8px', borderRadius: '8px', background: 'rgba(190, 155, 73, 0.15)', color: 'var(--color-gold-bright)' }}>
              <ShieldCheck size={20} />
            </div>
            <div>
              <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#ffffff' }}>Bank-Grade Security</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted-dark)' }}>HMAC-signed sessions & end-to-end data encryption</div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ padding: '8px', borderRadius: '8px', background: 'rgba(190, 155, 73, 0.15)', color: 'var(--color-gold-bright)' }}>
              <UserCheck size={20} />
            </div>
            <div>
              <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#ffffff' }}>Automatic Portal Routing</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted-dark)' }}>Instant authentication and routing to Customer, Provider, or Admin portals</div>
            </div>
          </div>
        </div>

        <div style={{ position: 'relative', zIndex: 2, fontSize: '0.8rem', color: 'var(--color-text-muted-dark)' }}>
          © {new Date().getFullYear()} ODS Global Network. All transactions protected.
        </div>
      </div>

      {/* RIGHT COLUMN: LOGIN FORM */}
      <div
        style={{
          backgroundColor: '#ffffff',
          flex: '1 1 55%',
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px 24px',
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
            opacity: 0.015,
            backgroundSize: '360px',
            pointerEvents: 'none',
          }}
        />

        <div style={{ position: 'relative', zIndex: 2, width: '100%', maxWidth: '440px' }}>
          <div style={{ marginBottom: '32px' }}>
            <h2 style={{ fontSize: '1.9rem', color: 'var(--color-navy-dark)', fontWeight: 700, marginBottom: '8px' }}>
              Sign in to your Account
            </h2>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.95rem', lineHeight: 1.5 }}>
              Enter your credentials below to automatically access your designated portal.
            </p>
          </div>

          {loginSuccess ? (
            <Card
              style={{
                textAlign: 'center',
                padding: '36px 24px',
                backgroundColor: '#ffffff',
                border: '1px solid var(--color-border-light)',
                boxShadow: 'var(--shadow-lg)',
              }}
            >
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '50%',
                  background: 'rgba(16, 185, 129, 0.15)',
                  color: 'var(--color-success)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px',
                }}
              >
                <ShieldCheck size={32} />
              </div>
              <h3 style={{ fontSize: '1.4rem', color: 'var(--color-navy-dark)', fontWeight: 700, marginBottom: '8px' }}>
                Authentication Successful
              </h3>

              {/* Automatically Detected Portal Badge */}
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '6px 16px',
                  borderRadius: '999px',
                  backgroundColor: 'rgba(190, 155, 73, 0.12)',
                  border: '1px solid var(--color-gold-mid)',
                  margin: '12px auto 18px',
                }}
              >
                {roleMeta[detectedRole].icon}
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-gold-deep)' }}>
                  {roleMeta[detectedRole].name}
                </span>
              </div>

              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginBottom: '24px', lineHeight: 1.6 }}>
                Welcome back! Your credentials have been authenticated. Redirecting securely to your portal session...
              </p>
              <Button variant="gold" size="sm" onClick={() => onNavigate('home')}>
                Return to Dashboard
              </Button>
            </Card>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <Input
                theme="light"
                label="Email or Mobile Number"
                placeholder="name@example.com or +251..."
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                error={errors.identifier}
                leftIcon={<Mail size={18} />}
                autoComplete="username"
              />

              <Input
                theme="light"
                label="Password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your account password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                error={errors.password}
                leftIcon={<Lock size={18} />}
                rightIcon={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{ color: 'var(--color-text-muted)', display: 'flex' }}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                }
                autoComplete="current-password"
              />

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-text-muted)', cursor: 'pointer', fontWeight: 500 }}>
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    style={{ accentColor: 'var(--color-gold-deep)' }}
                  />
                  Remember session
                </label>

                <button
                  type="button"
                  onClick={() => onNavigate('forgot-password')}
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    color: 'var(--color-gold-deep)',
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontSize: 'inherit',
                    fontFamily: 'inherit',
                    borderRadius: '4px',
                    outline: 'none',
                  }}
                  onFocus={(e) => (e.currentTarget.style.boxShadow = '0 0 0 2px var(--color-gold-bright)')}
                  onBlur={(e) => (e.currentTarget.style.boxShadow = 'none')}
                >
                  Forgot password?
                </button>
              </div>

              {/* General API error banner */}
              {errors.general && (
                <div
                  style={{
                    padding: '10px 14px',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(239, 68, 68, 0.08)',
                    border: '1px solid rgba(239, 68, 68, 0.25)',
                    color: '#dc2626',
                    fontSize: '0.85rem',
                    fontWeight: 500,
                    lineHeight: 1.5,
                  }}
                >
                  {errors.general}
                </div>
              )}

              <Button type="submit" variant="gold" size="lg" fullWidth disabled={isSubmitting}>
                {isSubmitting ? 'Authenticating...' : 'Sign In'}
              </Button>
            </form>
          )}

          <div style={{ textAlign: 'center', marginTop: '32px', fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>
            New to ODS Global Network?{' '}
            <button
              onClick={() => onNavigate('register')}
              style={{ color: 'var(--color-gold-deep)', fontWeight: 700 }}
            >
              Create an Account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
