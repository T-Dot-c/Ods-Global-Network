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
} from 'lucide-react';

interface LoginPageProps {
  onNavigate: (view: 'home' | 'login' | 'register') => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onNavigate }) => {
  const [role, setRole] = useState<'customer' | 'merchant' | 'admin'>('customer');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [errors, setErrors] = useState<{ identifier?: string; password?: string; general?: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loginSuccess, setLoginSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
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

    if (Object.keys(newErrors).length === 0) {
      setIsSubmitting(true);
      setTimeout(() => {
        setIsSubmitting(false);
        setLoginSuccess(true);
      }, 1000);
    }
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
              <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#ffffff' }}>Role-Based Access Control</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted-dark)' }}>Strict segregation of Customer, Provider, and Admin permissions</div>
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
          flex: '1 1 55%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px 24px',
        }}
      >
        <div style={{ width: '100%', maxWidth: '440px' }}>
          <div style={{ marginBottom: '32px' }}>
            <h2 style={{ fontSize: '1.9rem', color: '#ffffff', marginBottom: '8px' }}>Sign in to your Account</h2>
            <p style={{ color: 'var(--color-text-muted-dark)', fontSize: '0.95rem' }}>
              Select your portal role and enter your credentials below.
            </p>
          </div>

          {/* Role Pill Selector */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              backgroundColor: 'var(--color-navy-dark)',
              padding: '4px',
              borderRadius: '12px',
              marginBottom: '28px',
              border: '1px solid var(--color-border-dark)',
            }}
          >
            <button
              type="button"
              onClick={() => setRole('customer')}
              style={{
                padding: '8px 12px',
                borderRadius: '8px',
                fontSize: '0.85rem',
                fontWeight: 600,
                color: role === 'customer' ? 'var(--color-navy-dark)' : 'var(--color-text-muted-dark)',
                backgroundColor: role === 'customer' ? 'var(--color-gold-bright)' : 'transparent',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                transition: 'all var(--transition-fast)',
              }}
            >
              <UserCheck size={14} /> Customer
            </button>

            <button
              type="button"
              onClick={() => setRole('merchant')}
              style={{
                padding: '8px 12px',
                borderRadius: '8px',
                fontSize: '0.85rem',
                fontWeight: 600,
                color: role === 'merchant' ? 'var(--color-navy-dark)' : 'var(--color-text-muted-dark)',
                backgroundColor: role === 'merchant' ? 'var(--color-gold-bright)' : 'transparent',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                transition: 'all var(--transition-fast)',
              }}
            >
              <Building2 size={14} /> Provider
            </button>

            <button
              type="button"
              onClick={() => setRole('admin')}
              style={{
                padding: '8px 12px',
                borderRadius: '8px',
                fontSize: '0.85rem',
                fontWeight: 600,
                color: role === 'admin' ? 'var(--color-navy-dark)' : 'var(--color-text-muted-dark)',
                backgroundColor: role === 'admin' ? 'var(--color-gold-bright)' : 'transparent',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                transition: 'all var(--transition-fast)',
              }}
            >
              <KeyRound size={14} /> Admin
            </button>
          </div>

          {loginSuccess ? (
            <Card style={{ textAlign: 'center', padding: '36px 24px' }}>
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
              <h3 style={{ fontSize: '1.4rem', color: '#ffffff', marginBottom: '8px' }}>
                Authentication Successful
              </h3>
              <p style={{ color: 'var(--color-text-muted-dark)', fontSize: '0.9rem', marginBottom: '24px' }}>
                Redirecting securely to your <span style={{ color: 'var(--color-gold-bright)' }}>{role.toUpperCase()}</span> portal session...
              </p>
              <Button variant="gold" size="sm" onClick={() => onNavigate('home')}>
                Return to Dashboard
              </Button>
            </Card>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <Input
                label={role === 'merchant' ? 'Business Email or Phone' : 'Email or Mobile Number'}
                placeholder={role === 'merchant' ? 'admin@clinic.com' : 'you@example.com'}
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                error={errors.identifier}
                leftIcon={<Mail size={18} />}
                autoComplete="username"
              />

              <Input
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
                    style={{ color: 'var(--color-text-muted-dark)', display: 'flex' }}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                }
                autoComplete="current-password"
              />

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-text-muted-dark)', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    style={{ accentColor: 'var(--color-gold-mid)' }}
                  />
                  Remember session
                </label>

                <a href="#forgot" style={{ color: 'var(--color-gold-bright)' }}>
                  Forgot password?
                </a>
              </div>

              <Button type="submit" variant="gold" size="lg" fullWidth disabled={isSubmitting}>
                {isSubmitting ? 'Authenticating...' : `Sign In as ${role === 'merchant' ? 'Provider' : role === 'admin' ? 'Administrator' : 'Customer'}`}
              </Button>
            </form>
          )}

          <div style={{ textAlign: 'center', marginTop: '32px', fontSize: '0.9rem', color: 'var(--color-text-muted-dark)' }}>
            New to ODS Global Network?{' '}
            <button
              onClick={() => onNavigate('register')}
              style={{ color: 'var(--color-gold-bright)', fontWeight: 600 }}
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
