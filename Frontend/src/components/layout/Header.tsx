import React, { useState, useRef, useEffect } from 'react';
import { Button } from '../common/Button';
import { Menu, X, ChevronDown, Globe } from 'lucide-react';

interface HeaderProps {
  currentView: string;
  onNavigate: (view: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ currentView, onNavigate }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [mobileSubmenu, setMobileSubmenu] = useState<string | null>(null);
  const [langOpen, setLangOpen] = useState(false);
  const navRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(event.target as Node)) {
        setOpenDropdown(null);
        setLangOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLinkClick = (anchor: string) => {
    setOpenDropdown(null);
    setMobileOpen(false);
    if (currentView !== 'home') {
      onNavigate('home');
      setTimeout(() => {
        const el = document.querySelector(anchor);
        el?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } else {
      const el = document.querySelector(anchor);
      el?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const servicesMenu = [
    { label: 'All Services', anchor: '#services' },
    { label: 'Hospitals', anchor: '#services' },
    { label: 'Clinics', anchor: '#services' },
    { label: 'Pharmacies', anchor: '#services' },
    { label: 'Laboratories', anchor: '#services' },
    { label: 'Wellness Centers', anchor: '#services' },
    { label: 'Home Care', anchor: '#services' },
    { label: 'Specialists', anchor: '#services' },
    { label: 'Diagnostic Centers', anchor: '#services' },
  ];

  const giftingMenu = [
    { label: 'Gift Cards', anchor: '#gifting' },
    { label: 'Send a Gift', anchor: '#gifting' },
    { label: 'Redeem a Gift Card', anchor: '#gifting' },
  ];

  const businessMenu = [
    { label: 'For Merchants', anchor: '#for-merchants' },
    { label: 'For Service Providers', anchor: '#for-providers' },
  ];

  const aboutMenu = [
    { label: 'About ODS Global Net', anchor: '#about' },
    { label: 'Our Network', anchor: '#ecosystem' },
    { label: 'Contact Us', anchor: '#contact' },
  ];

  return (
    <header
      ref={navRef}
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        backgroundColor: 'rgba(15, 40, 91, 0.96)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderBottom: '1px solid var(--color-border-dark)',
      }}
    >
      {/* ========================================================================= */}
      {/* 1. TOP UTILITY BAR */}
      {/* ========================================================================= */}
      <div
        style={{
          backgroundColor: 'var(--color-navy-dark)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          fontSize: '0.8rem',
          color: 'var(--color-text-muted-dark)',
          padding: '6px 0',
        }}
      >
        <div
          className="container"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          {/* Left: Welcome Banner */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                backgroundColor: 'var(--color-gold-bright)',
                display: 'inline-block',
              }}
            />
            <span style={{ fontWeight: 500, letterSpacing: '0.3px', color: '#e2e8f0' }}>
              Welcome to ODS Global Net
            </span>
          </div>

          {/* Right: Quick Links */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
            <button
              onClick={() => handleLinkClick('#contact')}
              style={{
                color: 'var(--color-text-muted-dark)',
                fontSize: '0.8rem',
                transition: 'color var(--transition-fast)',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-gold-bright)')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--color-text-muted-dark)')}
            >
              Help Center
            </button>

            <span style={{ color: 'rgba(255, 255, 255, 0.15)', fontSize: '0.75rem' }}>|</span>

            <button
              onClick={() => handleLinkClick('#contact')}
              style={{
                color: 'var(--color-text-muted-dark)',
                fontSize: '0.8rem',
                transition: 'color var(--transition-fast)',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-gold-bright)')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--color-text-muted-dark)')}
            >
              Contact Us
            </button>

            <span style={{ color: 'rgba(255, 255, 255, 0.15)', fontSize: '0.75rem' }}>|</span>

            {/* Language Selector (EN ▾) */}
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setLangOpen(!langOpen)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  color: 'var(--color-text-muted-dark)',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  transition: 'color var(--transition-fast)',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-gold-bright)')}
                onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--color-text-muted-dark)')}
              >
                <Globe size={13} color="var(--color-gold-mid)" />
                <span style={{ color: 'var(--color-gold-bright)' }}>EN</span>
                <ChevronDown size={12} style={{ transform: langOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
              </button>

              {langOpen && (
                <div
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 8px)',
                    right: 0,
                    backgroundColor: 'var(--color-navy-dark)',
                    border: '1px solid var(--color-border-dark)',
                    borderRadius: '8px',
                    boxShadow: 'var(--shadow-card-dark)',
                    padding: '6px 0',
                    zIndex: 110,
                    minWidth: '110px',
                  }}
                >
                  <div
                    onClick={() => setLangOpen(false)}
                    style={{
                      padding: '6px 14px',
                      fontSize: '0.8rem',
                      color: 'var(--color-gold-bright)',
                      fontWeight: 600,
                      cursor: 'pointer',
                      backgroundColor: 'rgba(190, 155, 73, 0.12)',
                    }}
                  >
                    English (EN)
                  </div>
                  <div
                    onClick={() => setLangOpen(false)}
                    style={{
                      padding: '6px 14px',
                      fontSize: '0.8rem',
                      color: 'var(--color-text-muted-dark)',
                      cursor: 'pointer',
                    }}
                  >
                    Amharic (ET)
                  </div>
                </div>
              )}
            </div>

            <span style={{ color: 'rgba(255, 255, 255, 0.15)', fontSize: '0.75rem' }}>|</span>

            {/* Top Lightweight Login link */}
            <button
              onClick={() => onNavigate('login')}
              style={{
                color: 'var(--color-gold-bright)',
                fontWeight: 600,
                fontSize: '0.8rem',
                transition: 'opacity var(--transition-fast)',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.8')}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
            >
              Login
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. MAIN HEADER */}
      {/* ========================================================================= */}
      <div
        className="container"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: '76px',
        }}
      >
        {/* Left — Logo Block */}
        <div
          onClick={() => onNavigate('home')}
          style={{
            display: 'flex',
            flexDirection: 'column',
            cursor: 'pointer',
            textDecoration: 'none',
          }}
        >
          <img
            src="/assets/brand/vector/ods-logo-gold-primary.svg"
            alt="ODS Global Net"
            style={{ height: '42px', objectFit: 'contain' }}
          />

        </div>

        {/* Center/Left — Primary Navigation */}
        <nav
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '22px',
          }}
          className="desktop-nav"
        >
          {/* Home */}
          {/* <button
            onClick={() => onNavigate('home')}
            style={{
              color: currentView === 'home' ? 'var(--color-gold-bright)' : '#ffffff',
              fontWeight: 600,
              fontSize: '0.92rem',
              transition: 'color var(--transition-fast)',
            }}
          >
            Home
          </button> */}

          {/* Services Dropdown */}
          <div
            style={{ position: 'relative' }}
            onMouseEnter={() => setOpenDropdown('services')}
            onMouseLeave={() => setOpenDropdown(null)}
          >
            <button
              onClick={() => setOpenDropdown(openDropdown === 'services' ? null : 'services')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                color: openDropdown === 'services' ? 'var(--color-gold-bright)' : '#ffffff',
                fontWeight: 500,
                fontSize: '0.92rem',
                padding: '8px 0',
                transition: 'color var(--transition-fast)',
              }}
            >
              Services
              <ChevronDown
                size={14}
                style={{
                  transform: openDropdown === 'services' ? 'rotate(180deg)' : 'none',
                  transition: 'transform 0.2s ease',
                  color: 'var(--color-gold-mid)',
                }}
              />
            </button>

            {openDropdown === 'services' && (
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  left: '-10px',
                  width: '240px',
                  backgroundColor: 'rgba(8, 23, 56, 0.98)',
                  backdropFilter: 'blur(16px)',
                  WebkitBackdropFilter: 'blur(16px)',
                  border: '1px solid rgba(190, 155, 73, 0.3)',
                  borderRadius: '12px',
                  boxShadow: '0 16px 36px rgba(0,0,0,0.5)',
                  padding: '8px 0',
                  zIndex: 120,
                }}
              >
                {servicesMenu.map((item, idx) => (
                  <div
                    key={idx}
                    onClick={() => handleLinkClick(item.anchor)}
                    style={{
                      padding: '9px 18px',
                      fontSize: '0.88rem',
                      color: '#e2e8f0',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      fontWeight: idx === 0 ? 700 : 500,
                      borderBottom: idx === 0 ? '1px solid rgba(255,255,255,0.08)' : 'none',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'rgba(190, 155, 73, 0.15)';
                      e.currentTarget.style.color = 'var(--color-gold-bright)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.color = '#e2e8f0';
                    }}
                  >
                    {item.label}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* How It Works */}
          <button
            onClick={() => handleLinkClick('#how-it-works')}
            style={{
              color: '#ffffff',
              fontWeight: 500,
              fontSize: '0.92rem',
              transition: 'color var(--transition-fast)',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-gold-bright)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#ffffff')}
          >
            How It Works
          </button>

          {/* Gifting Dropdown */}
          <div
            style={{ position: 'relative' }}
            onMouseEnter={() => setOpenDropdown('gifting')}
            onMouseLeave={() => setOpenDropdown(null)}
          >
            <button
              onClick={() => setOpenDropdown(openDropdown === 'gifting' ? null : 'gifting')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                color: openDropdown === 'gifting' ? 'var(--color-gold-bright)' : '#ffffff',
                fontWeight: 500,
                fontSize: '0.92rem',
                padding: '8px 0',
                transition: 'color var(--transition-fast)',
              }}
            >
              Gifting
              <ChevronDown
                size={14}
                style={{
                  transform: openDropdown === 'gifting' ? 'rotate(180deg)' : 'none',
                  transition: 'transform 0.2s ease',
                  color: 'var(--color-gold-mid)',
                }}
              />
            </button>

            {openDropdown === 'gifting' && (
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  left: '-10px',
                  width: '210px',
                  backgroundColor: 'rgba(8, 23, 56, 0.98)',
                  backdropFilter: 'blur(16px)',
                  WebkitBackdropFilter: 'blur(16px)',
                  border: '1px solid rgba(190, 155, 73, 0.3)',
                  borderRadius: '12px',
                  boxShadow: '0 16px 36px rgba(0,0,0,0.5)',
                  padding: '8px 0',
                  zIndex: 120,
                }}
              >
                {giftingMenu.map((item, idx) => (
                  <div
                    key={idx}
                    onClick={() => handleLinkClick(item.anchor)}
                    style={{
                      padding: '9px 18px',
                      fontSize: '0.88rem',
                      color: '#e2e8f0',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'rgba(190, 155, 73, 0.15)';
                      e.currentTarget.style.color = 'var(--color-gold-bright)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.color = '#e2e8f0';
                    }}
                  >
                    {item.label}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* For Businesses Dropdown */}
          <div
            style={{ position: 'relative' }}
            onMouseEnter={() => setOpenDropdown('businesses')}
            onMouseLeave={() => setOpenDropdown(null)}
          >
            <button
              onClick={() => setOpenDropdown(openDropdown === 'businesses' ? null : 'businesses')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                color: openDropdown === 'businesses' ? 'var(--color-gold-bright)' : '#ffffff',
                fontWeight: 500,
                fontSize: '0.92rem',
                padding: '8px 0',
                transition: 'color var(--transition-fast)',
              }}
            >
              For Businesses
              <ChevronDown
                size={14}
                style={{
                  transform: openDropdown === 'businesses' ? 'rotate(180deg)' : 'none',
                  transition: 'transform 0.2s ease',
                  color: 'var(--color-gold-mid)',
                }}
              />
            </button>

            {openDropdown === 'businesses' && (
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  left: '-10px',
                  width: '210px',
                  backgroundColor: 'rgba(8, 23, 56, 0.98)',
                  backdropFilter: 'blur(16px)',
                  WebkitBackdropFilter: 'blur(16px)',
                  border: '1px solid rgba(190, 155, 73, 0.3)',
                  borderRadius: '12px',
                  boxShadow: '0 16px 36px rgba(0,0,0,0.5)',
                  padding: '8px 0',
                  zIndex: 120,
                }}
              >
                {businessMenu.map((item, idx) => (
                  <div
                    key={idx}
                    onClick={() => handleLinkClick(item.anchor)}
                    style={{
                      padding: '9px 18px',
                      fontSize: '0.88rem',
                      color: '#e2e8f0',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'rgba(190, 155, 73, 0.15)';
                      e.currentTarget.style.color = 'var(--color-gold-bright)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.color = '#e2e8f0';
                    }}
                  >
                    {item.label}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* About Us Dropdown */}
          <div
            style={{ position: 'relative' }}
            onMouseEnter={() => setOpenDropdown('about')}
            onMouseLeave={() => setOpenDropdown(null)}
          >
            <button
              onClick={() => setOpenDropdown(openDropdown === 'about' ? null : 'about')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                color: openDropdown === 'about' ? 'var(--color-gold-bright)' : '#ffffff',
                fontWeight: 500,
                fontSize: '0.92rem',
                padding: '8px 0',
                transition: 'color var(--transition-fast)',
              }}
            >
              About Us
              <ChevronDown
                size={14}
                style={{
                  transform: openDropdown === 'about' ? 'rotate(180deg)' : 'none',
                  transition: 'transform 0.2s ease',
                  color: 'var(--color-gold-mid)',
                }}
              />
            </button>

            {openDropdown === 'about' && (
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  right: 0,
                  width: '210px',
                  backgroundColor: 'rgba(8, 23, 56, 0.98)',
                  backdropFilter: 'blur(16px)',
                  WebkitBackdropFilter: 'blur(16px)',
                  border: '1px solid rgba(190, 155, 73, 0.3)',
                  borderRadius: '12px',
                  boxShadow: '0 16px 36px rgba(0,0,0,0.5)',
                  padding: '8px 0',
                  zIndex: 120,
                }}
              >
                {aboutMenu.map((item, idx) => (
                  <div
                    key={idx}
                    onClick={() => handleLinkClick(item.anchor)}
                    style={{
                      padding: '9px 18px',
                      fontSize: '0.88rem',
                      color: '#e2e8f0',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'rgba(190, 155, 73, 0.15)';
                      e.currentTarget.style.color = 'var(--color-gold-bright)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.color = '#e2e8f0';
                    }}
                  >
                    {item.label}
                  </div>
                ))}
              </div>
            )}
          </div>
        </nav>

        {/* Right — Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <Button
            variant={currentView === 'login' ? 'gold' : 'outline-gold'}
            size="sm"
            onClick={() => onNavigate('login')}
          >
            Login
          </Button>
          <Button
            variant="gold"
            size="sm"
            onClick={() => onNavigate('register')}
          >
            Get Started
          </Button>

          {/* Mobile menu toggle button */}
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

      {/* ========================================================================= */}
      {/* 3. MOBILE RESPONSIVE DRAWER */}
      {/* ========================================================================= */}
      {mobileOpen && (
        <div
          style={{
            backgroundColor: 'var(--color-navy-dark)',
            borderBottom: '1px solid var(--color-border-dark)',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            maxHeight: '80vh',
            overflowY: 'auto',
          }}
        >
          {/* Mobile Home */}
          <button
            onClick={() => { onNavigate('home'); setMobileOpen(false); }}
            style={{ textAlign: 'left', color: 'var(--color-gold-bright)', fontWeight: 700, fontSize: '1.05rem' }}
          >
            Home
          </button>

          {/* Mobile Services Accordion */}
          <div>
            <div
              onClick={() => setMobileSubmenu(mobileSubmenu === 'services' ? null : 'services')}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                color: '#ffffff',
                fontWeight: 600,
                fontSize: '1rem',
                cursor: 'pointer',
                padding: '6px 0',
              }}
            >
              <span>Services</span>
              <ChevronDown size={16} style={{ transform: mobileSubmenu === 'services' ? 'rotate(180deg)' : 'none' }} />
            </div>
            {mobileSubmenu === 'services' && (
              <div style={{ paddingLeft: '14px', display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '6px' }}>
                {servicesMenu.map((m, idx) => (
                  <span
                    key={idx}
                    onClick={() => handleLinkClick(m.anchor)}
                    style={{ color: 'var(--color-text-muted-dark)', fontSize: '0.9rem', cursor: 'pointer', padding: '4px 0' }}
                  >
                    {m.label}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Mobile How It Works */}
          <button
            onClick={() => handleLinkClick('#how-it-works')}
            style={{ textAlign: 'left', color: '#ffffff', fontWeight: 600, fontSize: '1rem' }}
          >
            How It Works
          </button>

          {/* Mobile Gifting Accordion */}
          <div>
            <div
              onClick={() => setMobileSubmenu(mobileSubmenu === 'gifting' ? null : 'gifting')}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                color: '#ffffff',
                fontWeight: 600,
                fontSize: '1rem',
                cursor: 'pointer',
                padding: '6px 0',
              }}
            >
              <span>Gifting</span>
              <ChevronDown size={16} style={{ transform: mobileSubmenu === 'gifting' ? 'rotate(180deg)' : 'none' }} />
            </div>
            {mobileSubmenu === 'gifting' && (
              <div style={{ paddingLeft: '14px', display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '6px' }}>
                {giftingMenu.map((m, idx) => (
                  <span
                    key={idx}
                    onClick={() => handleLinkClick(m.anchor)}
                    style={{ color: 'var(--color-text-muted-dark)', fontSize: '0.9rem', cursor: 'pointer', padding: '4px 0' }}
                  >
                    {m.label}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Mobile For Businesses Accordion */}
          <div>
            <div
              onClick={() => setMobileSubmenu(mobileSubmenu === 'businesses' ? null : 'businesses')}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                color: '#ffffff',
                fontWeight: 600,
                fontSize: '1rem',
                cursor: 'pointer',
                padding: '6px 0',
              }}
            >
              <span>For Businesses</span>
              <ChevronDown size={16} style={{ transform: mobileSubmenu === 'businesses' ? 'rotate(180deg)' : 'none' }} />
            </div>
            {mobileSubmenu === 'businesses' && (
              <div style={{ paddingLeft: '14px', display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '6px' }}>
                {businessMenu.map((m, idx) => (
                  <span
                    key={idx}
                    onClick={() => handleLinkClick(m.anchor)}
                    style={{ color: 'var(--color-text-muted-dark)', fontSize: '0.9rem', cursor: 'pointer', padding: '4px 0' }}
                  >
                    {m.label}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Mobile About Us Accordion */}
          <div>
            <div
              onClick={() => setMobileSubmenu(mobileSubmenu === 'about' ? null : 'about')}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                color: '#ffffff',
                fontWeight: 600,
                fontSize: '1rem',
                cursor: 'pointer',
                padding: '6px 0',
              }}
            >
              <span>About Us</span>
              <ChevronDown size={16} style={{ transform: mobileSubmenu === 'about' ? 'rotate(180deg)' : 'none' }} />
            </div>
            {mobileSubmenu === 'about' && (
              <div style={{ paddingLeft: '14px', display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '6px' }}>
                {aboutMenu.map((m, idx) => (
                  <span
                    key={idx}
                    onClick={() => handleLinkClick(m.anchor)}
                    style={{ color: 'var(--color-text-muted-dark)', fontSize: '0.9rem', cursor: 'pointer', padding: '4px 0' }}
                  >
                    {m.label}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Action CTAs in Mobile Drawer */}
          <div style={{ display: 'flex', gap: '12px', marginTop: '14px' }}>
            <Button
              variant="outline-gold"
              size="sm"
              fullWidth
              onClick={() => { onNavigate('login'); setMobileOpen(false); }}
            >
              Login
            </Button>
            <Button
              variant="gold"
              size="sm"
              fullWidth
              onClick={() => { onNavigate('register'); setMobileOpen(false); }}
            >
              Get Started
            </Button>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
