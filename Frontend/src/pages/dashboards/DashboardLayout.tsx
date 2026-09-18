import React, { useState } from 'react';
import { useAuth, UserRole, ApprovalStatus } from '../../context/AuthContext';
import {
  Bell,
  ChevronDown,
  LogOut,
  Settings,
  AlertCircle,
} from 'lucide-react';

export interface SidebarItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
}

export interface StatCardItem {
  label: string;
  value: string | number;
  subtext?: string;
  icon?: React.ReactNode;
}

export interface QuickActionItem {
  label: string;
  onClick?: () => void;
  icon?: React.ReactNode;
}

interface DashboardLayoutProps {
  role: UserRole;
  roleTitle: string;
  sidebarItems: SidebarItem[];
  statCards: StatCardItem[];
  quickActions: QuickActionItem[];
  activityTitle: string;
  activityContent?: React.ReactNode;
  showApprovalStatus?: boolean;
  onNavigate: (view: string) => void;
}

const STATUS_CONFIG: Record<ApprovalStatus, { bg: string; text: string; border: string; label: string; icon: string }> = {
  pending:  { bg: 'rgba(245, 158, 11, 0.12)', text: '#b45309', border: 'rgba(245, 158, 11, 0.4)', label: 'Pending Review', icon: '⏳' },
  approved: { bg: 'rgba(16, 185, 129, 0.12)', text: '#065f46', border: 'rgba(16, 185, 129, 0.4)', label: 'Approved',       icon: '✓' },
  rejected: { bg: 'rgba(239, 68, 68, 0.12)',  text: '#b91c1c', border: 'rgba(239, 68, 68, 0.4)',  label: 'Rejected',       icon: '✕' },
};

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  role,
  roleTitle,
  sidebarItems,
  statCards,
  quickActions,
  activityTitle,
  activityContent,
  showApprovalStatus = false,
  onNavigate,
}) => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('Overview');
  const [profileOpen, setProfileOpen] = useState(false);

  const handleSignOut = async () => {
    await logout();
    onNavigate('login');
  };

  const displayName = user?.full_name || 'User';
  const firstName = displayName.split(' ')[0] || displayName;
  const statusConfig = (user?.approval_status && STATUS_CONFIG[user.approval_status]) || STATUS_CONFIG.pending;

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#ffffff', // Pure white solid background
        color: 'var(--color-navy-dark)',
        fontFamily: 'var(--font-body)',
        display: 'flex',
        flexDirection: 'column',
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
          zIndex: 0,
        }}
      />

      {/* ─────────────────────────────────────────────────────────────
          TOP NAVBAR
          ODS GLOBAL NET                       🔔   [Profile ▾]
         ───────────────────────────────────────────────────────────── */}
      <header
        style={{
          height: '64px',
          backgroundColor: '#ffffff',
          borderBottom: '1px solid rgba(190, 155, 73, 0.28)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 24px',
          position: 'sticky',
          top: 0,
          zIndex: 40,
          boxShadow: '0 2px 10px rgba(0, 0, 0, 0.03)',
        }}
      >
        {/* Left: Brand Logo & Name */}
        <div
          onClick={() => onNavigate('home')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            cursor: 'pointer',
          }}
        >
          <img
            src="/assets/brand/vector/ods-logo-gold-primary.svg"
            alt="ODS Global Net"
            style={{ height: '32px' }}
          />
          <span
            style={{
              fontFamily: 'var(--font-heading)',
              fontWeight: 800,
              fontSize: '1.15rem',
              letterSpacing: '0.08em',
              color: 'var(--color-navy-dark)',
            }}
          >
            ODS <span style={{ color: 'var(--color-gold-deep)' }}>GLOBAL NET</span>
          </span>
        </div>

        {/* Right: Notifications + Profile Dropdown */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {/* Notification Bell */}
          <button
            title="Notifications"
            style={{
              position: 'relative',
              width: '38px',
              height: '38px',
              borderRadius: '8px',
              backgroundColor: '#f8fafc',
              border: '1px solid #e2e8f0',
              color: 'var(--color-navy-dark)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f1f5f9')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#f8fafc')}
          >
            <Bell size={18} />
            <span
              style={{
                position: 'absolute',
                top: '-3px',
                right: '-3px',
                width: '16px',
                height: '16px',
                borderRadius: '50%',
                backgroundColor: 'var(--color-gold-deep)',
                color: '#ffffff',
                fontSize: '0.68rem',
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              0
            </span>
          </button>

          {/* Profile Dropdown Trigger */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '6px 12px',
                borderRadius: '10px',
                backgroundColor: profileOpen ? 'rgba(190, 155, 73, 0.12)' : '#f8fafc',
                border: '1px solid rgba(190, 155, 73, 0.35)',
                color: 'var(--color-navy-dark)',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              <div
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, var(--color-gold-deep) 0%, var(--color-gold-bright) 100%)',
                  color: '#ffffff',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {firstName.charAt(0).toUpperCase()}
              </div>
              <span style={{ fontSize: '0.88rem', fontWeight: 600 }}>
                {firstName}
              </span>
              <span
                style={{
                  fontSize: '0.75rem',
                  padding: '2px 8px',
                  borderRadius: '999px',
                  backgroundColor: 'rgba(190, 155, 73, 0.15)',
                  color: 'var(--color-gold-deep)',
                  fontWeight: 700,
                  textTransform: 'capitalize',
                }}
              >
                {role}
              </span>
              <ChevronDown size={14} color="#64748b" />
            </button>

            {/* Dropdown Menu */}
            {profileOpen && (
              <div
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 8px)',
                  right: 0,
                  width: '230px',
                  backgroundColor: '#ffffff',
                  border: '1px solid rgba(190, 155, 73, 0.35)',
                  borderRadius: '12px',
                  boxShadow: '0 16px 36px rgba(0,0,0,0.12)',
                  padding: '8px',
                  zIndex: 50,
                }}
              >
                <div style={{ padding: '8px 12px 10px', borderBottom: '1px solid #f1f5f9' }}>
                  <div style={{ fontWeight: 700, color: 'var(--color-navy-dark)', fontSize: '0.88rem' }}>{displayName}</div>
                  <div style={{ color: '#64748b', fontSize: '0.76rem', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.email}</div>
                </div>

                <div style={{ padding: '6px 0' }}>
                  <button
                    onClick={() => { setActiveTab('Settings'); setProfileOpen(false); }}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      color: '#334155',
                      fontSize: '0.84rem',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      textAlign: 'left',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f8fafc')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    <Settings size={15} />
                    Settings
                  </button>

                  <button
                    onClick={handleSignOut}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      color: '#dc2626',
                      fontSize: '0.84rem',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      textAlign: 'left',
                      marginTop: '4px',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#fef2f2')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    <LogOut size={15} />
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ─────────────────────────────────────────────────────────────
          BODY: SIDEBAR + MAIN CONTENT
         ───────────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', flex: 1, position: 'relative', zIndex: 1 }}>
        {/* SIDEBAR */}
        <aside
          style={{
            width: '240px',
            backgroundColor: '#f8fafc',
            borderRight: '1px solid #e2e8f0',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: '24px 16px',
            flexShrink: 0,
          }}
        >
          {/* Menu Items */}
          <div>
            <div
              style={{
                fontSize: '0.72rem',
                fontWeight: 700,
                color: 'var(--color-gold-deep)',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                padding: '0 12px 12px',
              }}
            >
              Dashboard Navigation
            </div>

            <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {sidebarItems.map((item) => {
                const isActive = activeTab === item.label;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.label)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      border: 'none',
                      backgroundColor: isActive ? 'rgba(190, 155, 73, 0.15)' : 'transparent',
                      color: isActive ? 'var(--color-gold-deep)' : '#475569',
                      fontWeight: isActive ? 700 : 500,
                      fontSize: '0.88rem',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      textAlign: 'left',
                      position: 'relative',
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) e.currentTarget.style.backgroundColor = '#f1f5f9';
                      if (!isActive) e.currentTarget.style.color = 'var(--color-navy-dark)';
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) e.currentTarget.style.backgroundColor = 'transparent';
                      if (!isActive) e.currentTarget.style.color = '#475569';
                    }}
                  >
                    {isActive && (
                      <span
                        style={{
                          position: 'absolute',
                          left: 0,
                          top: '6px',
                          bottom: '6px',
                          width: '3px',
                          backgroundColor: 'var(--color-gold-deep)',
                          borderRadius: '0 2px 2px 0',
                        }}
                      />
                    )}
                    {item.icon}
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Bottom Sidebar: Sign Out */}
          <div style={{ paddingTop: '20px', borderTop: '1px solid #e2e8f0' }}>
            <button
              onClick={handleSignOut}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '10px 14px',
                borderRadius: '8px',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                backgroundColor: '#fef2f2',
                color: '#dc2626',
                fontSize: '0.88rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#fee2e2';
                e.currentTarget.style.borderColor = '#dc2626';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#fef2f2';
                e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.3)';
              }}
            >
              <LogOut size={16} />
              Sign Out
            </button>
          </div>
        </aside>

        {/* MAIN CONTENT AREA */}
        <main
          style={{
            flex: 1,
            padding: '32px 36px',
            overflowY: 'auto',
            maxWidth: '1280px',
          }}
        >
          {/* Header Greeting */}
          <div style={{ marginBottom: '28px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
              <div>
                <h1
                  style={{
                    fontSize: '1.85rem',
                    fontWeight: 800,
                    color: 'var(--color-navy-dark)',
                    fontFamily: 'var(--font-heading)',
                    marginBottom: '4px',
                  }}
                >
                  Welcome, {displayName}
                </h1>
                <p style={{ color: 'var(--color-gold-deep)', fontSize: '0.95rem', fontWeight: 600 }}>
                  {roleTitle}
                </p>
              </div>

              {/* Status Badge (for Merchant & Provider) */}
              {showApprovalStatus && (
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 16px',
                    borderRadius: '999px',
                    backgroundColor: statusConfig.bg,
                    border: `1px solid ${statusConfig.border}`,
                    color: statusConfig.text,
                    fontSize: '0.85rem',
                    fontWeight: 700,
                  }}
                >
                  <span>{statusConfig.icon}</span>
                  <span>Approval Status: {statusConfig.label}</span>
                </div>
              )}
            </div>

            {/* Pending status notification banner if applicable */}
            {showApprovalStatus && user?.approval_status === 'pending' && (
              <div
                style={{
                  marginTop: '16px',
                  padding: '12px 18px',
                  borderRadius: '10px',
                  backgroundColor: 'rgba(245, 158, 11, 0.08)',
                  border: '1px solid rgba(245, 158, 11, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                }}
              >
                <AlertCircle size={18} color="#b45309" style={{ flexShrink: 0 }} />
                <span style={{ fontSize: '0.85rem', color: '#92400e', lineHeight: 1.5 }}>
                  Your account is currently under compliance & accreditation review. Some features will unlock once approved.
                </span>
              </div>
            )}
          </div>

          {/* ─────────────────────────────────────────────────────────
              STAT CARDS GRID
             ───────────────────────────────────────────────────────── */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: `repeat(${statCards.length > 3 ? 3 : statCards.length}, 1fr)`,
              gap: '18px',
              marginBottom: '28px',
            }}
          >
            {statCards.map((stat, idx) => (
              <div
                key={idx}
                style={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '14px',
                  padding: '22px 24px',
                  boxShadow: '0 4px 16px rgba(0, 0, 0, 0.04)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  transition: 'transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--color-gold-mid)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 8px 24px rgba(190, 155, 73, 0.12)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#e2e8f0';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.04)';
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: '0.82rem',
                      fontWeight: 600,
                      color: '#64748b',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      marginBottom: '8px',
                    }}
                  >
                    {stat.label}
                  </div>
                  <div
                    style={{
                      fontSize: '2rem',
                      fontWeight: 800,
                      color: 'var(--color-navy-dark)',
                      fontFamily: 'var(--font-heading)',
                      lineHeight: 1,
                    }}
                  >
                    {stat.value}
                  </div>
                  {stat.subtext && (
                    <div style={{ fontSize: '0.74rem', color: 'var(--color-gold-deep)', marginTop: '4px', fontWeight: 500 }}>
                      {stat.subtext}
                    </div>
                  )}
                </div>

                {stat.icon && (
                  <div
                    style={{
                      width: '46px',
                      height: '46px',
                      borderRadius: '10px',
                      backgroundColor: 'rgba(190, 155, 73, 0.12)',
                      border: '1px solid rgba(190, 155, 73, 0.25)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--color-gold-deep)',
                    }}
                  >
                    {stat.icon}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* ─────────────────────────────────────────────────────────
              QUICK ACTIONS CARD
             ───────────────────────────────────────────────────────── */}
          <div
            style={{
              backgroundColor: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '16px',
              padding: '24px 28px',
              marginBottom: '28px',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.04)',
            }}
          >
            <h3
              style={{
                fontSize: '1.05rem',
                fontWeight: 700,
                color: 'var(--color-navy-dark)',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <span style={{ color: 'var(--color-gold-deep)' }}>✦</span> Quick Actions
            </h3>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '14px',
              }}
            >
              {quickActions.map((action, idx) => (
                <button
                  key={idx}
                  onClick={action.onClick}
                  style={{
                    padding: '14px 18px',
                    borderRadius: '10px',
                    backgroundColor: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    color: 'var(--color-navy-dark)',
                    fontSize: '0.9rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    transition: 'all 0.2s ease',
                    textAlign: 'left',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(190, 155, 73, 0.1)';
                    e.currentTarget.style.borderColor = 'var(--color-gold-deep)';
                    e.currentTarget.style.color = 'var(--color-gold-deep)';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#f8fafc';
                    e.currentTarget.style.borderColor = '#e2e8f0';
                    e.currentTarget.style.color = 'var(--color-navy-dark)';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  {action.icon}
                  <span>{action.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* ─────────────────────────────────────────────────────────
              ACTIVITY / BOTTOM SECTION
             ───────────────────────────────────────────────────────── */}
          <div
            style={{
              backgroundColor: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '16px',
              padding: '24px 28px',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.04)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3
                style={{
                  fontSize: '1.05rem',
                  fontWeight: 700,
                  color: 'var(--color-navy-dark)',
                }}
              >
                {activityTitle}
              </h3>
            </div>

            {activityContent ? (
              activityContent
            ) : (
              <div
                style={{
                  padding: '32px 20px',
                  borderRadius: '10px',
                  backgroundColor: '#f8fafc',
                  border: '1px dashed #cbd5e1',
                  textAlign: 'center',
                  color: '#64748b',
                  fontSize: '0.88rem',
                }}
              >
                <div style={{ fontSize: '1.6rem', marginBottom: '8px' }}>📋</div>
                <div style={{ fontWeight: 500, color: 'var(--color-navy-dark)' }}>No recent activity to display yet.</div>
                <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '4px' }}>
                  Your upcoming interactions and logs will appear here.
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};
