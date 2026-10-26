import React, { useState } from 'react';
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
} from 'lucide-react';
import { DashboardLayout, SidebarItem, StatCardItem, QuickActionItem } from './DashboardLayout';
import { CustomerProfileTab } from './customer/CustomerProfileTab';
import { CustomerSecurityTab } from './customer/CustomerSecurityTab';
import { CustomerTransactionsTab } from './customer/CustomerTransactionsTab';
import { CustomerGiftingTab } from './customer/CustomerGiftingTab';
import { CustomerAppointmentsTab } from './customer/CustomerAppointmentsTab';

interface CustomerDashboardProps {
  onNavigate: (view: string) => void;
}

export const CustomerDashboard: React.FC<CustomerDashboardProps> = ({ onNavigate }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'profile' | 'security' | 'transactions' | 'appointments' | 'giftcards' | 'notifications'>('overview');

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
    { label: 'Appointments', value: 'Not available yet', subtext: 'Medical & diagnostic consultations', icon: <Calendar size={22} /> },
    { label: 'Gift Cards & Wallet', value: 'Active', subtext: 'Digital balance & wellness vouchers', icon: <Gift size={22} /> },
    { label: 'Account Status', value: 'Active', subtext: 'Verified Customer Account', icon: <Shield size={22} /> },
  ];

  const quickActions: QuickActionItem[] = [
    {
      label: 'Explore Services',
      icon: <Search size={16} color="var(--color-gold-bright)" />,
      onClick: () => onNavigate('home'),
    },
    {
      label: 'Gift Cards & Wallet',
      icon: <Gift size={16} color="var(--color-gold-bright)" />,
      onClick: () => setActiveTab('giftcards'),
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

  return (
    <DashboardLayout
      role="customer"
      roleTitle="Customer Portal"
      sidebarItems={sidebarItems}
      statCards={statCards}
      quickActions={quickActions}
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
              Notifications Not Available Yet
            </h3>
            <p style={{ color: '#64748b', fontSize: '0.9rem', maxWidth: '480px', margin: '0 auto', lineHeight: 1.6 }}>
              Real-time SMS and email alert feeds, booking reminders, and security notices are not available yet.
            </p>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default CustomerDashboard;
