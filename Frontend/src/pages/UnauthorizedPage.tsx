import React, { useEffect, useRef } from 'react';
import { ShieldAlert, ArrowLeft, LogOut, Home, LogIn } from 'lucide-react';
import { useAuth, UserRole } from '../context/AuthContext';
import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';
import '../styles/batch1-focus.css';

interface UnauthorizedPageProps {
  onNavigate: (view: string) => void;
}

const ROLE_DASHBOARDS: Record<UserRole, string> = {
  customer: 'dashboard',
  merchant: 'merchant/dashboard',
  provider: 'provider/dashboard',
  admin: 'admin/dashboard',
};

export const UnauthorizedPage: React.FC<UnauthorizedPageProps> = ({ onNavigate }) => {
  const { user, logout } = useAuth();
  const headingRef = useRef<HTMLHeadingElement | null>(null);

  // Focus movement on page load (D-03): Focus heading automatically without double announcement
  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  const handleSignOut = async () => {
    try {
      await logout();
      onNavigate('home');
    } catch (err) {
      onNavigate('login');
    }
  };

  const userDashboard = user ? ROLE_DASHBOARDS[user.role] || 'dashboard' : 'dashboard';

  return (
    <div
      className="batch1-page"
      style={{
        minHeight: '100vh',
        backgroundColor: 'var(--color-navy)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '32px 16px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Background Pattern Texture */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: 'url(/assets/brand/raster/brand-pattern.png)',
          opacity: 0.04,
          backgroundSize: '360px',
          pointerEvents: 'none',
        }}
      />

      <Card
        variant="bordered"
        style={{
          maxWidth: '520px',
          width: '100%',
          textAlign: 'center',
          padding: '48px 36px',
          position: 'relative',
          zIndex: 2,
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          boxShadow: 'var(--shadow-card-dark)',
          border: '1px solid rgba(190, 155, 73, 0.3)',
        }}
      >
        {/* Shield Alert Vector Icon */}
        <div
          style={{
            width: '68px',
            height: '68px',
            borderRadius: '50%',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            border: '2px solid rgba(239, 68, 68, 0.25)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '24px',
            color: 'var(--color-danger, #ef4444)',
          }}
        >
          <ShieldAlert size={36} />
        </div>

        {/* Status Pill */}
        <div style={{ marginBottom: '16px' }}>
          <span
            style={{
              fontSize: '0.78rem',
              fontWeight: 700,
              letterSpacing: '1px',
              textTransform: 'uppercase',
              color: 'var(--color-danger, #ef4444)',
              backgroundColor: 'rgba(239, 68, 68, 0.08)',
              padding: '4px 12px',
              borderRadius: '999px',
              border: '1px solid rgba(239, 68, 68, 0.2)',
            }}
          >
            403 • Access Restricted
          </span>
        </div>

        <h1
          ref={headingRef}
          tabIndex={-1}
          style={{
            fontSize: '1.85rem',
            fontWeight: 700,
            color: 'var(--color-navy-dark)',
            marginBottom: '12px',
            lineHeight: 1.25,
            fontFamily: 'var(--font-heading)',
          }}
        >
          Authorization Required
        </h1>

        <p
          style={{
            color: 'var(--color-text-muted)',
            fontSize: '0.95rem',
            lineHeight: 1.6,
            marginBottom: '32px',
          }}
        >
          {user ? (
            <>
              You are signed in as <strong>{user.full_name || user.email}</strong> with{' '}
              <span style={{ textTransform: 'capitalize', fontWeight: 600 }}>{user.role}</span> privileges. You do not
              have authorization to access this portal section.
            </>
          ) : (
            'You do not have permission to view this resource. Please sign in with an authorized account or return to the main platform.'
          )}
        </p>

        {/* Action Buttons based on Session State */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}
        >
          {user ? (
            <>
              <Button
                variant="gold"
                size="md"
                fullWidth
                onClick={() => onNavigate(userDashboard)}
              >
                <ArrowLeft size={16} /> Return to My Dashboard
              </Button>
              <Button
                variant="outline-gold"
                size="md"
                fullWidth
                onClick={handleSignOut}
              >
                <LogOut size={16} /> Sign Out
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="gold"
                size="md"
                fullWidth
                onClick={() => onNavigate('login')}
              >
                <LogIn size={16} /> Sign In
              </Button>
              <Button
                variant="outline-gold"
                size="md"
                fullWidth
                onClick={() => onNavigate('home')}
              >
                <Home size={16} /> Back to Home
              </Button>
            </>
          )}
        </div>
      </Card>

      <div
        style={{
          marginTop: '32px',
          color: 'var(--color-text-muted-dark)',
          fontSize: '0.82rem',
          textAlign: 'center',
          position: 'relative',
          zIndex: 2,
        }}
      >
        ODS Global Network Security • Role-Based Access Control Enforced
      </div>
    </div>
  );
};
