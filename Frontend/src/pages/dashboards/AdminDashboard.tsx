import React, { useState } from 'react';
import {
  LayoutDashboard,
  Users,
  Building2,
  Stethoscope,
  Settings,
  ShieldCheck,
  Inbox,
  ShieldAlert,
} from 'lucide-react';
import { DashboardLayout, SidebarItem, StatCardItem, QuickActionItem } from './DashboardLayout';
import { KycQueueTab } from './admin/KycQueueTab';
import { InquiriesInboxTab } from './admin/InquiriesInboxTab';
import { AuditLogsTab } from './admin/AuditLogsTab';
import { useAuth } from '../../context/AuthContext';

interface AdminDashboardProps {
  onNavigate: (view: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<string>('overview');

  const sidebarItems: SidebarItem[] = [
    { id: 'overview', label: 'Overview', icon: <LayoutDashboard size={17} /> },
    { id: 'kyc', label: 'KYC Queue', icon: <ShieldCheck size={17} /> },
    { id: 'inbox', label: 'Inquiries Inbox', icon: <Inbox size={17} /> },
    ...(user?.role === 'super_admin' ? [{ id: 'audit', label: 'Audit Logs', icon: <ShieldAlert size={17} /> }] : []),
    { id: 'users', label: 'Users', icon: <Users size={17} /> },
    { id: 'merchants', label: 'Merchants', icon: <Building2 size={17} /> },
    { id: 'providers', label: 'Providers', icon: <Stethoscope size={17} /> },
    { id: 'settings', label: 'Settings', icon: <Settings size={17} /> },
  ];

  const statCards: StatCardItem[] = [
    { label: 'KYC Reviews', value: 'Active', subtext: 'Merchant & provider compliance queue', icon: <ShieldCheck size={22} /> },
    { label: 'Intake Inbox', value: 'Active', subtext: 'Support & partner proposal stream', icon: <Inbox size={22} /> },
    { label: 'Audit Ledger', value: user?.role === 'super_admin' ? 'Super Admin' : 'Restricted', subtext: 'Platform security logs', icon: <ShieldAlert size={22} /> },
  ];

  const quickActions: QuickActionItem[] = [
    {
      label: 'KYC Compliance Queue',
      icon: <ShieldCheck size={16} color="var(--color-gold-bright)" />,
      onClick: () => setActiveTab('kyc'),
    },
    {
      label: 'Public Inquiries Inbox',
      icon: <Inbox size={16} color="var(--color-gold-bright)" />,
      onClick: () => setActiveTab('inbox'),
    },
    ...(user?.role === 'super_admin'
      ? [
          {
            label: 'Security Audit Logs',
            icon: <ShieldAlert size={16} color="var(--color-gold-bright)" />,
            onClick: () => setActiveTab('audit'),
          },
        ]
      : []),
  ];

  return (
    <DashboardLayout
      role={user?.role || 'admin'}
      roleTitle={user?.role === 'super_admin' ? 'Super Administrator Console' : 'Administrator Dashboard'}
      sidebarItems={sidebarItems}
      statCards={statCards}
      quickActions={quickActions}
      activityTitle="System Operations"
      activeTab={activeTab}
      onTabChange={(tabId) => setActiveTab(tabId)}
      onNavigate={onNavigate}
    >
      {activeTab === 'kyc' && <KycQueueTab />}
      {activeTab === 'inbox' && <InquiriesInboxTab />}
      {activeTab === 'audit' && <AuditLogsTab />}
    </DashboardLayout>
  );
};

export default AdminDashboard;
