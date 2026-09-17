import React, { useState } from 'react';
import { Button } from '../common/Button';
import { Menu, X, ShieldCheck } from 'lucide-react';

interface HeaderProps {
  currentView: string;
  onNavigate: (view: 'home' | 'login' | 'register') => void;
}

export const Header: React.FC<HeaderProps> = ({ currentView, onNavigate }) => {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        backgroundColor: 'rgba(15, 40, 91, 0.95)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderBottom: '1px solid var(--color-border-dark)',
      }}
    >
      <div
        className="container"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: '80px',
        }}
      >
        {/* Logo */}
        <div
          onClick={() => onNavigate('home')}
          style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}
        >
          <img
            src="/assets/brand/vector/ods-logo-gold-primary.svg"
            alt="ODS Global Network"
            style={{ height: '48px', objectFit: 'contain' }}
          />
        </div>

        {/* Desktop Navigation Links */}
        <nav
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '32px',
          }}
          className="desktop-nav"
        >
          <button
            onClick={() => onNavigate('home')}
            style={{
              color: currentView === 'home' ? 'var(--color-gold-bright)' : 'var(--color-text-muted-dark)',
              fontWeight: 500,
              fontSize: '0.95rem',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            Home
          </button>
          <a
            href="#services"
            style={{
              color: 'var(--color-text-muted-dark)',
              fontWeight: 500,
              fontSize: '0.95rem',
            }}
          >
            Services & Providers
          </a>
          <a
            href="#gifting"
            style={{
              color: 'var(--color-text-muted-dark)',
              fontWeight: 500,
              fontSize: '0.95rem',
            }}
          >
            Wanaw Gifting
          </a>
          <a
            href="#partners"
            style={{
              color: 'var(--color-text-muted-dark)',
              fontWeight: 500,
              fontSize: '0.95rem',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <ShieldCheck size={16} color="var(--color-gold-mid)" /> Partners
          </a>
        </nav>

        {/* Desktop Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <Button
            variant={currentView === 'login' ? 'gold' : 'outline-gold'}
            size="sm"
            onClick={() => onNavigate('login')}
          >
            Sign In
          </Button>
          <Button
            variant="gold"
            size="sm"
            onClick={() => onNavigate('register')}
          >
            Get Started
          </Button>

          {/* Mobile menu toggle */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            style={{
              display: 'none',
              color: 'var(--color-gold-bright)',
              padding: '6px',
            }}
            className="mobile-toggle"
            aria-label="Toggle Navigation"
          >
            {mobileOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      {mobileOpen && (
        <div
          style={{
            backgroundColor: 'var(--color-navy-dark)',
            borderBottom: '1px solid var(--color-border-dark)',
            padding: '20px 24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
          }}
        >
          <button
            onClick={() => { onNavigate('home'); setMobileOpen(false); }}
            style={{ textAlign: 'left', color: 'var(--color-gold-bright)', fontWeight: 600 }}
          >
            Home
          </button>
          <a
            href="#services"
            onClick={() => setMobileOpen(false)}
            style={{ color: 'var(--color-text-light)' }}
          >
            Services & Providers
          </a>
          <a
            href="#gifting"
            onClick={() => setMobileOpen(false)}
            style={{ color: 'var(--color-text-light)' }}
          >
            Wanaw Gifting
          </a>
          <a
            href="#partners"
            onClick={() => setMobileOpen(false)}
            style={{ color: 'var(--color-text-light)' }}
          >
            Verified Partners
          </a>
          <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
            <Button variant="outline-gold" size="sm" fullWidth onClick={() => { onNavigate('login'); setMobileOpen(false); }}>
              Sign In
            </Button>
            <Button variant="gold" size="sm" fullWidth onClick={() => { onNavigate('register'); setMobileOpen(false); }}>
              Register
            </Button>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
