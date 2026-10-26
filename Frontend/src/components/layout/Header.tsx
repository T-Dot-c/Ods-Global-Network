import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Button } from '../common/Button';
import {
  Menu,
  X,
  ChevronDown,
  Search,
  Phone,
  Mail,
  Send,
  MessageSquare,
  Sparkles,
  Gift,
  Building2,
  Stethoscope,
  Pill,
  Activity,
  HeartPulse,
  Truck,
  UserCheck,
  Award,
  BarChart3,
  Handshake,
} from 'lucide-react';

interface HeaderProps {
  currentView: string;
  onNavigate: (view: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ currentView, onNavigate }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [mobileSubmenu, setMobileSubmenu] = useState<string | null>(null);

  // Interactive Search State
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const navRef = useRef<HTMLElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchBtnRef = useRef<HTMLButtonElement>(null);
  const mobileToggleRef = useRef<HTMLButtonElement>(null);

  // Desktop dropdown trigger refs
  const servicesBtnRef = useRef<HTMLButtonElement>(null);
  const giftingBtnRef = useRef<HTMLButtonElement>(null);
  const businessBtnRef = useRef<HTMLButtonElement>(null);
  const aboutBtnRef = useRef<HTMLButtonElement>(null);

  // Mobile accordion header refs
  const mobileServicesBtnRef = useRef<HTMLButtonElement>(null);
  const mobileGiftingBtnRef = useRef<HTMLButtonElement>(null);
  const mobileBusinessBtnRef = useRef<HTMLButtonElement>(null);
  const mobileAboutBtnRef = useRef<HTMLButtonElement>(null);

  // Document-level pointerdown listener: active while any dropdown or search panel is open
  useEffect(() => {
    if (!openDropdown && !searchOpen) return;
    const handleOutsidePointerDown = (event: PointerEvent) => {
      if (navRef.current && !navRef.current.contains(event.target as Node)) {
        setOpenDropdown(null);
        setSearchOpen(false);
      }
    };
    document.addEventListener('pointerdown', handleOutsidePointerDown);
    return () => document.removeEventListener('pointerdown', handleOutsidePointerDown);
  }, [openDropdown, searchOpen]);

  // Keyboard navigation: Escape key closes active overlay and returns focus to the trigger that opened it
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (searchOpen) {
          setSearchOpen(false);
          searchBtnRef.current?.focus();
          return;
        }
        if (openDropdown) {
          const current = openDropdown;
          setOpenDropdown(null);
          if (current === 'services') servicesBtnRef.current?.focus();
          else if (current === 'gifting') giftingBtnRef.current?.focus();
          else if (current === 'businesses') businessBtnRef.current?.focus();
          else if (current === 'about') aboutBtnRef.current?.focus();
          return;
        }
        if (mobileOpen) {
          if (mobileSubmenu) {
            const currentSubmenu = mobileSubmenu;
            setMobileSubmenu(null);
            if (currentSubmenu === 'services') mobileServicesBtnRef.current?.focus();
            else if (currentSubmenu === 'gifting') mobileGiftingBtnRef.current?.focus();
            else if (currentSubmenu === 'businesses') mobileBusinessBtnRef.current?.focus();
            else if (currentSubmenu === 'about') mobileAboutBtnRef.current?.focus();
            return;
          }
          setMobileOpen(false);
          mobileToggleRef.current?.focus();
          return;
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [searchOpen, openDropdown, mobileOpen, mobileSubmenu]);

  // Blur-based closing: only close if relatedTarget is non-null and outside the container
  const handleDropdownBlur = (e: React.FocusEvent<HTMLDivElement>) => {
    if (e.relatedTarget && !e.currentTarget.contains(e.relatedTarget as Node)) {
      setOpenDropdown(null);
    }
  };

  // Focus search input when search is opened
  useEffect(() => {
    if (searchOpen) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
  }, [searchOpen]);

  // Clean in-page smooth scroll handler
  const handleLinkClick = (anchor: string) => {
    setOpenDropdown(null);
    setMobileOpen(false);
    setSearchOpen(false);
    const el = document.querySelector(anchor);
    el?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleItemClick = (item: { anchor?: string; view?: string }) => {
    if (item.view) {
      setOpenDropdown(null);
      setMobileOpen(false);
      setSearchOpen(false);
      onNavigate(item.view);
    } else if (item.anchor) {
      handleLinkClick(item.anchor);
    }
  };

  // 9 Authoritative Categories from KPIs & Scopes Section 4 + All Services
  const servicesMenu: Array<{ label: string; anchor?: string; view?: string; icon: React.ReactNode }> = [
    { label: 'All Services', view: 'services', icon: <Activity size={16} /> },
    { label: 'Hospitals', view: 'services', icon: <Building2 size={16} /> },
    { label: 'Clinics', view: 'services', icon: <Stethoscope size={16} /> },
    { label: 'Pharmacies', view: 'services', icon: <Pill size={16} /> },
    { label: 'Laboratories', view: 'services', icon: <Activity size={16} /> },
    { label: 'Wellness Centers', view: 'services', icon: <HeartPulse size={16} /> },
    { label: 'Ambulance Services', view: 'services', icon: <Truck size={16} /> },
    { label: 'Home Care', view: 'services', icon: <UserCheck size={16} /> },
    { label: 'Specialists', view: 'services', icon: <Award size={16} /> },
    { label: 'Diagnostic Centers', view: 'services', icon: <BarChart3 size={16} /> },
  ];

  // 6 Gifting items synthesized from Scopes Section 7 & approved taxonomy
  const giftingMenu = [
    { label: 'Gift Cards', anchor: '#gifting', icon: <Gift size={16} /> },
    { label: 'Purchase Gift Cards', anchor: '#gifting', icon: <Sparkles size={16} /> },
    { label: 'Redeem Gift Cards', anchor: '#gifting', icon: <Gift size={16} /> },
    { label: 'Individual Gifts', anchor: '#gifting', icon: <Gift size={16} /> },
    { label: 'Corporate Gifts', anchor: '#gifting', icon: <Building2 size={16} /> },
    { label: 'Ethiopian Diaspora', anchor: '#gifting', icon: <HeartPulse size={16} /> },
  ];

  const businessMenu: Array<{ label: string; anchor?: string; view?: string; icon: React.ReactNode }> = [
    { label: 'For Merchants', anchor: '#for-merchants', icon: <Building2 size={16} /> },
    { label: 'For Service Providers', anchor: '#for-providers', icon: <Stethoscope size={16} /> },
    { label: 'Partner With Us', view: 'partner-with-us', icon: <Handshake size={16} /> },
  ];

  const aboutMenu: Array<{ label: string; anchor?: string; view?: string; icon: React.ReactNode }> = [
    { label: 'About ODS Global Net', view: 'company', icon: <Sparkles size={16} /> },
    { label: 'Our Network', anchor: '#ecosystem', icon: <Activity size={16} /> },
    { label: 'Contact Us', view: 'support', icon: <Mail size={16} /> },
  ];

  // Search items across all menus and categories
  const searchableItems = useMemo(
    () => [
      ...servicesMenu.map((s) => ({ ...s, group: 'Healthcare & Wellness' })),
      ...giftingMenu.map((g) => ({ ...g, group: 'Gifting & Vouchers' })),
      ...businessMenu.map((b) => ({ ...b, group: 'Business & Partners' })),
      ...aboutMenu.map((a) => ({ ...a, group: 'Company' })),
    ],
    []
  );

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return searchableItems.filter(
      (item) => item.label.toLowerCase().includes(q) || item.group.toLowerCase().includes(q)
    );
  }, [searchQuery, searchableItems]);

  return (
    <header
      ref={navRef}
      role="banner"
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        backgroundColor: 'color-mix(in srgb, var(--color-navy) 98%, transparent)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderBottom: '1px solid var(--color-border-dark)',
      }}
    >
      <style>{`
        header button:focus-visible,
        header a:focus-visible,
        header input:focus-visible {
          outline: 2px solid var(--color-gold-bright);
          outline-offset: 2px;
        }
        @media (max-width: 960px) {
          .header-contact-links { display: none !important; }
          .header-search-label { display: none !important; }
        }
        @media (max-width: 860px) {
          .header-desktop-nav { display: none !important; }
          .header-mobile-toggle { display: block !important; }
        }
        @media (min-width: 861px) {
          .header-mobile-toggle { display: none !important; }
        }
      `}</style>

      {/* ========================================================================= */}
      {/* 1. TOP UTILITY BAR (DIRECT CONTACTS & HELP CENTER)                        */}
      {/* ========================================================================= */}
      <div
        style={{
          backgroundColor: 'var(--color-navy-dark)',
          borderBottom: '1px solid color-mix(in srgb, var(--color-white) 8%, transparent)',
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
            flexWrap: 'wrap',
            gap: '8px',
          }}
        >
          {/* Left: Direct Contact Links */}
          <div
            className="header-contact-links"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            }}
          >
            <a
              href="tel:+251-960-606-042"
              style={{
                color: 'var(--color-text-muted-dark)',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                textDecoration: 'none',
                fontSize: '0.78rem',
                transition: 'color var(--transition-fast)',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-gold-bright)')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--color-text-muted-dark)')}
              aria-label="Call +251-960-606-042"
            >
              <Phone size={12} color="var(--color-gold-mid)" />
              <span>+251 960 606 042</span>
            </a>

            <a
              href="mailto:info@odsglobal.net"
              style={{
                color: 'var(--color-text-muted-dark)',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                textDecoration: 'none',
                fontSize: '0.78rem',
                transition: 'color var(--transition-fast)',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-gold-bright)')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--color-text-muted-dark)')}
              aria-label="Email info@odsglobal.net"
            >
              <Mail size={12} color="var(--color-gold-mid)" />
              <span>info@odsglobal.net</span>
            </a>

            <a
              href="https://t.me/+251960606042"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                color: 'var(--color-text-muted-dark)',
                display: 'flex',
                alignItems: 'center',
                textDecoration: 'none',
                transition: 'color var(--transition-fast)',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-gold-bright)')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--color-text-muted-dark)')}
              aria-label="ODS Global Net Telegram"
            >
              <Send size={12} color="var(--color-gold-mid)" />
            </a>

            <a
              href="https://wa.me/251960606042"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                color: 'var(--color-text-muted-dark)',
                display: 'flex',
                alignItems: 'center',
                textDecoration: 'none',
                transition: 'color var(--transition-fast)',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-gold-bright)')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--color-text-muted-dark)')}
              aria-label="ODS Global Net WhatsApp"
            >
              <MessageSquare size={12} color="var(--color-gold-mid)" />
            </a>
          </div>

          {/* Right: Help Center */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginLeft: 'auto' }}>
            <button
              onClick={() => onNavigate('support')}
              style={{
                color: 'var(--color-text-muted-dark)',
                fontSize: '0.8rem',
                transition: 'color var(--transition-fast)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-gold-bright)')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--color-text-muted-dark)')}
            >
              Help Center
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. MAIN HEADER (BRAND LOGO, NAV MENUS, SEARCH & ACTION BUTTONS)           */}
      {/* ========================================================================= */}
      <div
        className="container"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: '76px',
          position: 'relative',
        }}
      >
        {/* Left — Official Brand Vector Logo */}
        <div
          onClick={() => handleLinkClick('#hero')}
          style={{
            display: 'flex',
            alignItems: 'center',
            cursor: 'pointer',
            textDecoration: 'none',
          }}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && handleLinkClick('#hero')}
          aria-label="ODS Global Network Home"
        >
          <img
            src="/assets/brand/vector/ods-logo-gold-primary.svg"
            alt="ODS Global Network"
            style={{
              height: '42px',
              width: 'auto',
              objectFit: 'contain',
              display: 'block',
            }}
          />
        </div>

        {/* Center — Desktop Navigation (W3C Disclosure Pattern) */}
        <nav
          className="header-desktop-nav"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '24px',
          }}
          aria-label="Main Navigation"
        >
          {/* Home */}
          <button
            onClick={() => handleLinkClick('#hero')}
            style={{
              color: currentView === 'home' ? 'var(--color-gold-bright)' : 'var(--color-white)',
              fontWeight: 500,
              fontSize: '0.92rem',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              transition: 'color var(--transition-fast)',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-gold-bright)')}
            onMouseLeave={(e) =>
              (e.currentTarget.style.color =
                currentView === 'home' ? 'var(--color-gold-bright)' : 'var(--color-white)')
            }
          >
            Home
          </button>

          {/* Services Dropdown (Disclosure Pattern) */}
          <div
            style={{ position: 'relative' }}
            onBlur={handleDropdownBlur}
          >
            <button
              ref={servicesBtnRef}
              id="services-menu-button"
              onClick={() => setOpenDropdown(openDropdown === 'services' ? null : 'services')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                color: openDropdown === 'services' ? 'var(--color-gold-bright)' : 'var(--color-white)',
                fontWeight: 500,
                fontSize: '0.92rem',
                padding: '8px 0',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                transition: 'color var(--transition-fast)',
              }}
              aria-haspopup="true"
              aria-expanded={openDropdown === 'services'}
              aria-controls="services-dropdown-panel"
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
              <ul
                id="services-dropdown-panel"
                aria-labelledby="services-menu-button"
                style={{
                  listStyle: 'none',
                  margin: 0,
                  position: 'absolute',
                  top: '100%',
                  left: '-10px',
                  width: '260px',
                  backgroundColor: 'color-mix(in srgb, var(--color-navy-dark) 98%, transparent)',
                  backdropFilter: 'blur(16px)',
                  WebkitBackdropFilter: 'blur(16px)',
                  border: '1px solid color-mix(in srgb, var(--color-gold-mid) 30%, transparent)',
                  borderRadius: '12px',
                  boxShadow: 'var(--shadow-card-dark)',
                  padding: '8px 0',
                  zIndex: 120,
                }}
              >
                {servicesMenu.map((item, idx) => (
                  <li key={idx}>
                    <button
                      onClick={() => handleItemClick(item)}
                      style={{
                        width: '100%',
                        textAlign: 'left',
                        padding: '9px 18px',
                        fontSize: '0.88rem',
                        color: idx === 0 ? 'var(--color-gold-bright)' : 'var(--color-border-light)',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                        fontWeight: idx === 0 ? 700 : 500,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        background: 'transparent',
                        border: 'none',
                        borderBottom:
                          idx === 0
                            ? '1px solid color-mix(in srgb, var(--color-white) 8%, transparent)'
                            : 'none',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor =
                          'color-mix(in srgb, var(--color-gold-mid) 15%, transparent)';
                        e.currentTarget.style.color = 'var(--color-gold-bright)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                        e.currentTarget.style.color =
                          idx === 0 ? 'var(--color-gold-bright)' : 'var(--color-border-light)';
                      }}
                    >
                      <span style={{ color: 'var(--color-gold-mid)' }}>{item.icon}</span>
                      {item.label}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* How It Works */}
          <button
            onClick={() => handleLinkClick('#how-it-works')}
            style={{
              color: 'var(--color-white)',
              fontWeight: 500,
              fontSize: '0.92rem',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              transition: 'color var(--transition-fast)',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-gold-bright)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--color-white)')}
          >
            How It Works
          </button>

          {/* Gifting Dropdown (Disclosure Pattern) */}
          <div
            style={{ position: 'relative' }}
            onBlur={handleDropdownBlur}
          >
            <button
              ref={giftingBtnRef}
              id="gifting-menu-button"
              onClick={() => setOpenDropdown(openDropdown === 'gifting' ? null : 'gifting')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                color: openDropdown === 'gifting' ? 'var(--color-gold-bright)' : 'var(--color-white)',
                fontWeight: 500,
                fontSize: '0.92rem',
                padding: '8px 0',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                transition: 'color var(--transition-fast)',
              }}
              aria-haspopup="true"
              aria-expanded={openDropdown === 'gifting'}
              aria-controls="gifting-dropdown-panel"
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
              <ul
                id="gifting-dropdown-panel"
                aria-labelledby="gifting-menu-button"
                style={{
                  listStyle: 'none',
                  margin: 0,
                  position: 'absolute',
                  top: '100%',
                  left: '-10px',
                  width: '240px',
                  backgroundColor: 'color-mix(in srgb, var(--color-navy-dark) 98%, transparent)',
                  backdropFilter: 'blur(16px)',
                  WebkitBackdropFilter: 'blur(16px)',
                  border: '1px solid color-mix(in srgb, var(--color-gold-mid) 30%, transparent)',
                  borderRadius: '12px',
                  boxShadow: 'var(--shadow-card-dark)',
                  padding: '8px 0',
                  zIndex: 120,
                }}
              >
                {giftingMenu.map((item, idx) => (
                  <li key={idx}>
                    <button
                      onClick={() => handleLinkClick(item.anchor)}
                      style={{
                        width: '100%',
                        textAlign: 'left',
                        padding: '9px 18px',
                        fontSize: '0.88rem',
                        color: 'var(--color-border-light)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        background: 'transparent',
                        border: 'none',
                        transition: 'all 0.15s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor =
                          'color-mix(in srgb, var(--color-gold-mid) 15%, transparent)';
                        e.currentTarget.style.color = 'var(--color-gold-bright)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                        e.currentTarget.style.color = 'var(--color-border-light)';
                      }}
                    >
                      <span style={{ color: 'var(--color-gold-mid)' }}>{item.icon}</span>
                      {item.label}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* For Businesses Dropdown (Disclosure Pattern) */}
          <div
            style={{ position: 'relative' }}
            onBlur={handleDropdownBlur}
          >
            <button
              ref={businessBtnRef}
              id="business-menu-button"
              onClick={() => setOpenDropdown(openDropdown === 'businesses' ? null : 'businesses')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                color:
                  openDropdown === 'businesses' ? 'var(--color-gold-bright)' : 'var(--color-white)',
                fontWeight: 500,
                fontSize: '0.92rem',
                padding: '8px 0',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                transition: 'color var(--transition-fast)',
              }}
              aria-haspopup="true"
              aria-expanded={openDropdown === 'businesses'}
              aria-controls="business-dropdown-panel"
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
              <ul
                id="business-dropdown-panel"
                aria-labelledby="business-menu-button"
                style={{
                  listStyle: 'none',
                  margin: 0,
                  position: 'absolute',
                  top: '100%',
                  left: '-10px',
                  width: '220px',
                  backgroundColor: 'color-mix(in srgb, var(--color-navy-dark) 98%, transparent)',
                  backdropFilter: 'blur(16px)',
                  WebkitBackdropFilter: 'blur(16px)',
                  border: '1px solid color-mix(in srgb, var(--color-gold-mid) 30%, transparent)',
                  borderRadius: '12px',
                  boxShadow: 'var(--shadow-card-dark)',
                  padding: '8px 0',
                  zIndex: 120,
                }}
              >
                {businessMenu.map((item, idx) => (
                  <li key={idx}>
                    <button
                      onClick={() => handleItemClick(item)}
                      style={{
                        width: '100%',
                        textAlign: 'left',
                        padding: '9px 18px',
                        fontSize: '0.88rem',
                        color: 'var(--color-border-light)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        background: 'transparent',
                        border: 'none',
                        transition: 'all 0.15s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor =
                          'color-mix(in srgb, var(--color-gold-mid) 15%, transparent)';
                        e.currentTarget.style.color = 'var(--color-gold-bright)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                        e.currentTarget.style.color = 'var(--color-border-light)';
                      }}
                    >
                      <span style={{ color: 'var(--color-gold-mid)' }}>{item.icon}</span>
                      {item.label}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* About Us Dropdown (Disclosure Pattern) */}
          <div
            style={{ position: 'relative' }}
            onBlur={handleDropdownBlur}
          >
            <button
              ref={aboutBtnRef}
              id="about-menu-button"
              onClick={() => setOpenDropdown(openDropdown === 'about' ? null : 'about')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                color: openDropdown === 'about' ? 'var(--color-gold-bright)' : 'var(--color-white)',
                fontWeight: 500,
                fontSize: '0.92rem',
                padding: '8px 0',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                transition: 'color var(--transition-fast)',
              }}
              aria-haspopup="true"
              aria-expanded={openDropdown === 'about'}
              aria-controls="about-dropdown-panel"
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
              <ul
                id="about-dropdown-panel"
                aria-labelledby="about-menu-button"
                style={{
                  listStyle: 'none',
                  margin: 0,
                  position: 'absolute',
                  top: '100%',
                  right: 0,
                  width: '230px',
                  backgroundColor: 'color-mix(in srgb, var(--color-navy-dark) 98%, transparent)',
                  backdropFilter: 'blur(16px)',
                  WebkitBackdropFilter: 'blur(16px)',
                  border: '1px solid color-mix(in srgb, var(--color-gold-mid) 30%, transparent)',
                  borderRadius: '12px',
                  boxShadow: 'var(--shadow-card-dark)',
                  padding: '8px 0',
                  zIndex: 120,
                }}
              >
                {aboutMenu.map((item, idx) => (
                  <li key={idx}>
                    <button
                      onClick={() => handleItemClick(item)}
                      style={{
                        width: '100%',
                        textAlign: 'left',
                        padding: '9px 18px',
                        fontSize: '0.88rem',
                        color: 'var(--color-border-light)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        background: 'transparent',
                        border: 'none',
                        transition: 'all 0.15s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor =
                          'color-mix(in srgb, var(--color-gold-mid) 15%, transparent)';
                        e.currentTarget.style.color = 'var(--color-gold-bright)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                        e.currentTarget.style.color = 'var(--color-border-light)';
                      }}
                    >
                      <span style={{ color: 'var(--color-gold-mid)' }}>{item.icon}</span>
                      {item.label}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </nav>

        {/* Right — Interactive Search & Action CTAs */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          {/* Search Trigger Button */}
          <button
            ref={searchBtnRef}
            onClick={() => setSearchOpen(!searchOpen)}
            style={{
              background: 'color-mix(in srgb, var(--color-white) 6%, transparent)',
              border: `1px solid ${
                searchOpen
                  ? 'var(--color-gold-mid)'
                  : 'color-mix(in srgb, var(--color-white) 15%, transparent)'
              }`,
              borderRadius: '8px',
              padding: '8px 10px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              color: searchOpen ? 'var(--color-gold-bright)' : 'var(--color-border-light)',
              cursor: 'pointer',
              transition: 'all var(--transition-fast)',
            }}
            aria-label="Open search dialog"
            aria-expanded={searchOpen}
            aria-controls="search-dialog"
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'var(--color-gold-mid)';
              e.currentTarget.style.color = 'var(--color-gold-bright)';
            }}
            onMouseLeave={(e) => {
              if (!searchOpen) {
                e.currentTarget.style.borderColor =
                  'color-mix(in srgb, var(--color-white) 15%, transparent)';
                e.currentTarget.style.color = 'var(--color-border-light)';
              }
            }}
          >
            <Search size={16} />
            <span style={{ fontSize: '0.82rem', fontWeight: 500 }} className="header-search-label">
              Search
            </span>
          </button>

          {/* Login CTA */}
          <Button
            variant={currentView === 'login' ? 'gold' : 'outline-gold'}
            size="sm"
            onClick={() => onNavigate('login')}
          >
            Login
          </Button>

          {/* Get Started CTA */}
          <Button variant="gold" size="sm" onClick={() => onNavigate('register')}>
            Get Started
          </Button>

          {/* Mobile hamburger toggle (Disclosure Pattern) */}
          <button
            ref={mobileToggleRef}
            onClick={() => setMobileOpen(!mobileOpen)}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--color-gold-bright)',
              padding: '6px',
              cursor: 'pointer',
            }}
            className="header-mobile-toggle"
            aria-label={mobileOpen ? 'Close Navigation Menu' : 'Open Navigation Menu'}
            aria-expanded={mobileOpen}
            aria-controls="mobile-nav-drawer"
          >
            {mobileOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. INTERACTIVE SEARCH BAR & REAL-TIME RESULTS OVERLAY                     */}
      {/* ========================================================================= */}
      {searchOpen && (
        <div
          id="search-dialog"
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            width: '100%',
            backgroundColor: 'var(--color-navy-dark)',
            borderBottom: '1px solid var(--color-gold-mid)',
            boxShadow: 'var(--shadow-card-dark)',
            padding: '16px 0',
            zIndex: 90,
          }}
        >
          <div className="container" style={{ maxWidth: '720px', margin: '0 auto' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                backgroundColor: 'color-mix(in srgb, var(--color-white) 7%, transparent)',
                border: '1px solid var(--color-border-dark)',
                borderRadius: '10px',
                padding: '6px 14px',
                gap: '10px',
              }}
            >
              <Search size={18} color="var(--color-gold-bright)" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search services, clinics, wellness centers, or gifts..."
                style={{
                  flex: 1,
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--color-white)',
                  fontSize: '0.95rem',
                  fontFamily: 'inherit',
                }}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--color-text-muted-dark)',
                    cursor: 'pointer',
                  }}
                  aria-label="Clear search input"
                >
                  <X size={16} />
                </button>
              )}
              <button
                onClick={() => {
                  setSearchOpen(false);
                  searchBtnRef.current?.focus();
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--color-gold-bright)',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  paddingLeft: '8px',
                }}
              >
                Close
              </button>
            </div>

            {/* Live Search Results Dropdown */}
            {searchQuery.trim() && (
              <div
                style={{
                  marginTop: '12px',
                  backgroundColor: 'color-mix(in srgb, var(--color-card-dark) 98%, transparent)',
                  borderRadius: '10px',
                  border: '1px solid var(--color-border-dark)',
                  maxHeight: '260px',
                  overflowY: 'auto',
                }}
              >
                {searchResults.length > 0 ? (
                  searchResults.map((item, idx) => (
                    <div
                      key={idx}
                      onClick={() => handleItemClick(item)}
                      style={{
                        padding: '10px 16px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        cursor: 'pointer',
                        borderBottom:
                          '1px solid color-mix(in srgb, var(--color-white) 6%, transparent)',
                        transition: 'background 0.15s ease',
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.backgroundColor =
                          'color-mix(in srgb, var(--color-gold-mid) 15%, transparent)')
                      }
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ color: 'var(--color-gold-mid)' }}>{item.icon}</span>
                        <span
                          style={{
                            fontSize: '0.9rem',
                            color: 'var(--color-white)',
                            fontWeight: 500,
                          }}
                        >
                          {item.label}
                        </span>
                      </div>
                      <span
                        style={{
                          fontSize: '0.75rem',
                          color: 'var(--color-gold-bright)',
                          opacity: 0.8,
                        }}
                      >
                        {item.group}
                      </span>
                    </div>
                  ))
                ) : (
                  <div
                    style={{
                      padding: '16px',
                      textAlign: 'center',
                      color: 'var(--color-text-muted-dark)',
                      fontSize: '0.88rem',
                    }}
                  >
                    No results found for &ldquo;{searchQuery}&rdquo;.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. MOBILE RESPONSIVE DRAWER (W3C DISCLOSURE PATTERN)                      */}
      {/* ========================================================================= */}
      {mobileOpen && (
        <div
          id="mobile-nav-drawer"
          style={{
            backgroundColor: 'var(--color-navy-dark)',
            borderBottom: '1px solid var(--color-border-dark)',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            maxHeight: '82vh',
            overflowY: 'auto',
          }}
          role="region"
          aria-label="Mobile Navigation Drawer"
        >
          {/* Mobile Home */}
          <button
            onClick={() => handleLinkClick('#hero')}
            style={{
              textAlign: 'left',
              color: 'var(--color-gold-bright)',
              fontWeight: 700,
              fontSize: '1.05rem',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            Home
          </button>

          {/* Mobile Services Accordion */}
          <div>
            <button
              ref={mobileServicesBtnRef}
              onClick={() => setMobileSubmenu(mobileSubmenu === 'services' ? null : 'services')}
              style={{
                width: '100%',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                color: 'var(--color-white)',
                fontWeight: 600,
                fontSize: '1rem',
                cursor: 'pointer',
                padding: '6px 0',
                background: 'none',
                border: 'none',
                textAlign: 'left',
              }}
              aria-expanded={mobileSubmenu === 'services'}
              aria-controls="mobile-services-panel"
            >
              <span>Services</span>
              <ChevronDown
                size={16}
                style={{
                  transform: mobileSubmenu === 'services' ? 'rotate(180deg)' : 'none',
                  transition: 'transform 0.2s',
                }}
              />
            </button>
            {mobileSubmenu === 'services' && (
              <div
                id="mobile-services-panel"
                style={{
                  paddingLeft: '14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  marginTop: '6px',
                }}
              >
                {servicesMenu.map((m, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleItemClick(m)}
                    style={{
                      textAlign: 'left',
                      color: idx === 0 ? 'var(--color-gold-bright)' : 'var(--color-text-muted-dark)',
                      fontSize: '0.9rem',
                      fontWeight: idx === 0 ? 600 : 400,
                      cursor: 'pointer',
                      padding: '4px 0',
                      background: 'none',
                      border: 'none',
                    }}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Mobile How It Works */}
          <button
            onClick={() => handleLinkClick('#how-it-works')}
            style={{
              textAlign: 'left',
              color: 'var(--color-white)',
              fontWeight: 600,
              fontSize: '1rem',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            How It Works
          </button>

          {/* Mobile Gifting Accordion */}
          <div>
            <button
              ref={mobileGiftingBtnRef}
              onClick={() => setMobileSubmenu(mobileSubmenu === 'gifting' ? null : 'gifting')}
              style={{
                width: '100%',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                color: 'var(--color-white)',
                fontWeight: 600,
                fontSize: '1rem',
                cursor: 'pointer',
                padding: '6px 0',
                background: 'none',
                border: 'none',
                textAlign: 'left',
              }}
              aria-expanded={mobileSubmenu === 'gifting'}
              aria-controls="mobile-gifting-panel"
            >
              <span>Gifting</span>
              <ChevronDown
                size={16}
                style={{
                  transform: mobileSubmenu === 'gifting' ? 'rotate(180deg)' : 'none',
                  transition: 'transform 0.2s',
                }}
              />
            </button>
            {mobileSubmenu === 'gifting' && (
              <div
                id="mobile-gifting-panel"
                style={{
                  paddingLeft: '14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  marginTop: '6px',
                }}
              >
                {giftingMenu.map((m, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleLinkClick(m.anchor)}
                    style={{
                      textAlign: 'left',
                      color: 'var(--color-text-muted-dark)',
                      fontSize: '0.9rem',
                      cursor: 'pointer',
                      padding: '4px 0',
                      background: 'none',
                      border: 'none',
                    }}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Mobile For Businesses Accordion */}
          <div>
            <button
              ref={mobileBusinessBtnRef}
              onClick={() => setMobileSubmenu(mobileSubmenu === 'businesses' ? null : 'businesses')}
              style={{
                width: '100%',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                color: 'var(--color-white)',
                fontWeight: 600,
                fontSize: '1rem',
                cursor: 'pointer',
                padding: '6px 0',
                background: 'none',
                border: 'none',
                textAlign: 'left',
              }}
              aria-expanded={mobileSubmenu === 'businesses'}
              aria-controls="mobile-business-panel"
            >
              <span>For Businesses</span>
              <ChevronDown
                size={16}
                style={{
                  transform: mobileSubmenu === 'businesses' ? 'rotate(180deg)' : 'none',
                  transition: 'transform 0.2s',
                }}
              />
            </button>
            {mobileSubmenu === 'businesses' && (
              <div
                id="mobile-business-panel"
                style={{
                  paddingLeft: '14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  marginTop: '6px',
                }}
              >
                {businessMenu.map((m, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleItemClick(m)}
                    style={{
                      textAlign: 'left',
                      color: 'var(--color-text-muted-dark)',
                      fontSize: '0.9rem',
                      cursor: 'pointer',
                      padding: '4px 0',
                      background: 'none',
                      border: 'none',
                    }}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Mobile About Us Accordion */}
          <div>
            <button
              ref={mobileAboutBtnRef}
              onClick={() => setMobileSubmenu(mobileSubmenu === 'about' ? null : 'about')}
              style={{
                width: '100%',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                color: 'var(--color-white)',
                fontWeight: 600,
                fontSize: '1rem',
                cursor: 'pointer',
                padding: '6px 0',
                background: 'none',
                border: 'none',
                textAlign: 'left',
              }}
              aria-expanded={mobileSubmenu === 'about'}
              aria-controls="mobile-about-panel"
            >
              <span>About Us</span>
              <ChevronDown
                size={16}
                style={{
                  transform: mobileSubmenu === 'about' ? 'rotate(180deg)' : 'none',
                  transition: 'transform 0.2s',
                }}
              />
            </button>
            {mobileSubmenu === 'about' && (
              <div
                id="mobile-about-panel"
                style={{
                  paddingLeft: '14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  marginTop: '6px',
                }}
              >
                {aboutMenu.map((m, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleItemClick(m)}
                    style={{
                      textAlign: 'left',
                      color: 'var(--color-text-muted-dark)',
                      fontSize: '0.9rem',
                      cursor: 'pointer',
                      padding: '4px 0',
                      background: 'none',
                      border: 'none',
                    }}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Mobile Contact Quick Channels */}
          <div
            style={{
              padding: '12px',
              backgroundColor: 'color-mix(in srgb, var(--color-white) 4%, transparent)',
              borderRadius: '8px',
              border: '1px solid color-mix(in srgb, var(--color-white) 8%, transparent)',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              fontSize: '0.85rem',
            }}
          >
            <div style={{ color: 'var(--color-gold-bright)', fontWeight: 600 }}>Direct Contact:</div>
            <a
              href="tel:+251-960-606-042"
              style={{
                color: 'var(--color-border-light)',
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <Phone size={14} color="var(--color-gold-mid)" /> +251 960 606 042
            </a>
            <a
              href="mailto:info@odsglobal.net"
              style={{
                color: 'var(--color-border-light)',
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <Mail size={14} color="var(--color-gold-mid)" /> info@odsglobal.net
            </a>
          </div>

          {/* Action CTAs in Mobile Drawer */}
          <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
            <Button
              variant="outline-gold"
              size="sm"
              fullWidth
              onClick={() => {
                onNavigate('login');
                setMobileOpen(false);
              }}
            >
              Login
            </Button>
            <Button
              variant="gold"
              size="sm"
              fullWidth
              onClick={() => {
                onNavigate('register');
                setMobileOpen(false);
              }}
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
