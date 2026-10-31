import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  User,
  Shield,
  Calendar,
  Gift,
  Bell,
  Search,
  HelpCircle,
  Key,
  CreditCard,
  ArrowRight,
  Clock,
  Sparkles,
} from 'lucide-react';
import { DashboardLayout, SidebarItem, StatCardItem, QuickActionItem } from './DashboardLayout';
import { CustomerProfileTab } from './customer/CustomerProfileTab';
import { CustomerSecurityTab } from './customer/CustomerSecurityTab';
import { CustomerTransactionsTab } from './customer/CustomerTransactionsTab';
import { CustomerGiftingTab } from './customer/CustomerGiftingTab';
import { CustomerAppointmentsTab } from './customer/CustomerAppointmentsTab';
import { useAuth } from '../../context/AuthContext';
import { getWallet } from '../../services/giftingService';
import { getCustomerBookings, BookingItem } from '../../services/bookingService';
import { getPaymentHistory } from '../../services/paymentService';

interface CustomerDashboardProps {
  onNavigate: (view: string) => void;
}

export const CustomerDashboard: React.FC<CustomerDashboardProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'profile' | 'security' | 'transactions' | 'appointments' | 'giftcards' | 'notifications'>('overview');

  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [walletCurrency, setWalletCurrency] = useState<string>('ETB');
  const [upcomingCount, setUpcomingCount] = useState<number | null>(null);
  const [recentBookings, setRecentBookings] = useState<BookingItem[]>([]);
  const [txCount, setTxCount] = useState<number | null>(null);

  useEffect(() => {
    // 1. Digital wallet
    getWallet()
      .then((data) => {
        setWalletBalance(data.balance);
        setWalletCurrency(data.currency || 'ETB');
      })
      .catch(() => {
        setWalletBalance(0);
      });

    // 2. Customer bookings
    getCustomerBookings({ status: 'upcoming' })
      .then((items) => {
        setUpcomingCount(items.length);
        setRecentBookings(items.slice(0, 3));
      })
      .catch(() => {
        setUpcomingCount(0);
      });

    // 3. Transactions
    getPaymentHistory()
      .then((res) => {
        if (res.success && res.transactions) {
          setTxCount(res.transactions.length);
        } else {
          setTxCount(0);
        }
      })
      .catch(() => {
        setTxCount(0);
      });
  }, []);

  const sidebarItems: SidebarItem[] = [
    { id: 'overview', label: 'Overview', icon: <LayoutDashboard size={17} /> },
    { id: 'profile', label: 'My Profile', icon: <User size={17} /> },
    { id: 'security', label: 'Security', icon: <Shield size={17} /> },
    { id: 'transactions', label: 'Transactions', icon: <CreditCard size={17} /> },
    { id: 'appointments', label: 'Appointments', icon: <Calendar size={17} /> },
    { id: 'giftcards', label: 'Gift Cards & Wallet', icon: <Gift size={17} /> },
    { id: 'notifications', label: 'Notifications', icon: <Bell size={17} /> },
  ];

  const statCards: StatCardItem[] = [
    {
      label: 'Upcoming Appointments',
      value: upcomingCount !== null ? upcomingCount : '0',
      subtext: upcomingCount === 1 ? '1 scheduled consultation' : `${upcomingCount ?? 0} scheduled consultations`,
      icon: <Calendar size={22} />,
    },
    {
      label: 'Digital Wallet',
      value: walletBalance !== null ? `${walletCurrency} ${walletBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : `${walletCurrency} 0.00`,
      subtext: 'Available wellness balance',
      icon: <Gift size={22} />,
    },
    {
      label: 'Payment Records',
      value: txCount !== null ? txCount : '0',
      subtext: 'Invoices & transactions',
      icon: <CreditCard size={22} />,
    },
    {
      label: 'Account Status',
      value: user?.is_email_verified ? 'Verified' : 'Active',
      subtext: user?.is_email_verified ? 'Verified Customer Account' : 'Customer Account',
      icon: <Shield size={22} />,
    },
  ];

  const quickActions: QuickActionItem[] = [
    {
      label: 'Explore Services',
      icon: <Search size={16} color="var(--color-gold-bright)" />,
      onClick: () => onNavigate('services'),
    },
    {
      label: 'Book Consultation',
      icon: <Calendar size={16} color="var(--color-gold-bright)" />,
      onClick: () => setActiveTab('appointments'),
    },
    {
      label: 'Gift Cards & Wallet',
      icon: <Gift size={16} color="var(--color-gold-bright)" />,
      onClick: () => setActiveTab('giftcards'),
    },
    {
      label: 'Payment History',
      icon: <CreditCard size={16} color="var(--color-gold-bright)" />,
      onClick: () => setActiveTab('transactions'),
    },
    {
      label: 'Edit Profile',
      icon: <User size={16} color="var(--color-gold-bright)" />,
      onClick: () => setActiveTab('profile'),
    },
    {
      label: 'Account Security',
      icon: <Key size={16} color="var(--color-gold-bright)" />,
      onClick: () => setActiveTab('security'),
    },
    {
      label: 'Help & Support',
      icon: <HelpCircle size={16} color="var(--color-gold-bright)" />,
      onClick: () => onNavigate('support'),
    },
  ];

  const activityContent = (
    <div>
      {recentBookings.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {recentBookings.map((b) => (
            <div
              key={b.id}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '14px 18px',
                borderRadius: '10px',
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0',
              }}
            >
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--color-navy-dark)' }}>
                  {b.service_title || 'Clinical Consultation'}
                </div>
                <div style={{ fontSize: '0.8rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '8px', marginTop: '3px' }}>
                  <Clock size={13} />
                  <span>
                    {b.start_at ? new Date(b.start_at).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Upcoming'}
                  </span>
                  <span>•</span>
                  <span>Ref: {b.reference}</span>
                </div>
              </div>
              <button
                onClick={() => setActiveTab('appointments')}
                style={{
                  padding: '6px 14px',
                  borderRadius: '6px',
                  backgroundColor: 'rgba(190, 155, 73, 0.15)',
                  border: '1px solid rgba(190, 155, 73, 0.35)',
                  color: 'var(--color-gold-deep)',
                  fontWeight: 600,
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <span>Details</span>
                <ArrowRight size={14} />
              </button>
            </div>
          ))}
          <div style={{ textAlign: 'right', marginTop: '4px' }}>
            <button
              onClick={() => setActiveTab('appointments')}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--color-gold-deep)',
                fontWeight: 700,
                fontSize: '0.85rem',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <span>View all appointments</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      ) : (
        <div
          style={{
            padding: '32px 24px',
            borderRadius: '12px',
            backgroundColor: '#f8fafc',
            border: '1px dashed #cbd5e1',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              backgroundColor: 'rgba(190, 155, 73, 0.12)',
              border: '1px solid rgba(190, 155, 73, 0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 14px',
              color: 'var(--color-gold-deep)',
            }}
          >
            <Sparkles size={24} />
          </div>
          <h4 style={{ margin: '0 0 6px', fontSize: '1.05rem', fontWeight: 700, color: 'var(--color-navy-dark)' }}>
            Welcome to your Customer Portal
          </h4>
          <p style={{ margin: '0 auto 20px', maxWidth: '520px', fontSize: '0.88rem', color: '#64748b', lineHeight: 1.6 }}>
            You haven’t scheduled any consultations or services yet. Browse our network of verified medical institutions, diagnostics labs, and wellness providers.
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={() => onNavigate('services')}
              style={{
                padding: '10px 20px',
                borderRadius: '8px',
                backgroundColor: 'var(--color-gold-deep)',
                color: '#ffffff',
                border: 'none',
                fontWeight: 700,
                fontSize: '0.88rem',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 2px 8px rgba(190, 155, 73, 0.25)',
              }}
            >
              <Search size={16} />
              <span>Browse Services Catalog</span>
            </button>
            <button
              onClick={() => setActiveTab('giftcards')}
              style={{
                padding: '10px 20px',
                borderRadius: '8px',
                backgroundColor: '#ffffff',
                border: '1px solid #cbd5e1',
                color: 'var(--color-navy-dark)',
                fontWeight: 600,
                fontSize: '0.88rem',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <Gift size={16} color="var(--color-gold-deep)" />
              <span>Gift Cards & Wallet</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <DashboardLayout
      role="customer"
      roleTitle="Customer Portal"
      sidebarItems={sidebarItems}
      statCards={statCards}
      quickActions={quickActions}
      activityTitle="Recent Activity & Bookings"
      activityContent={activityContent}
      activeTab={activeTab}
      onTabChange={(tabId) => setActiveTab(tabId as any)}
      onNavigate={onNavigate}
    >
      {activeTab === 'profile' && (
        <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '28px 32px', boxShadow: '0 4px 16px rgba(0, 0, 0, 0.04)' }}>
          <CustomerProfileTab />
        </div>
      )}

      {activeTab === 'security' && (
        <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '28px 32px', boxShadow: '0 4px 16px rgba(0, 0, 0, 0.04)' }}>
          <CustomerSecurityTab />
        </div>
      )}

      {activeTab === 'transactions' && (
        <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '28px 32px', boxShadow: '0 4px 16px rgba(0, 0, 0, 0.04)' }}>
          <CustomerTransactionsTab />
        </div>
      )}

      {activeTab === 'appointments' && (
        <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '28px 32px', boxShadow: '0 4px 16px rgba(0, 0, 0, 0.04)' }}>
          <CustomerAppointmentsTab />
        </div>
      )}

      {activeTab === 'giftcards' && (
        <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '28px 32px', boxShadow: '0 4px 16px rgba(0, 0, 0, 0.04)' }}>
          <CustomerGiftingTab />
        </div>
      )}

      {activeTab === 'notifications' && (
        <div
          style={{
            backgroundColor: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '16px',
            padding: '48px 32px',
            textAlign: 'center',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.04)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '16px',
          }}
        >
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '16px',
              backgroundColor: 'rgba(190, 155, 73, 0.12)',
              border: '1px solid rgba(190, 155, 73, 0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Bell size={32} color="var(--color-gold-deep)" />
          </div>
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-navy-dark)', margin: '0 0 6px' }}>
              Notifications Hub
            </h3>
            <p style={{ color: '#64748b', fontSize: '0.9rem', maxWidth: '480px', margin: '0 auto', lineHeight: 1.6 }}>
              Stay tuned for real-time booking reminders, digital voucher alerts, and security notifications directly in this feed.
            </p>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default CustomerDashboard;
