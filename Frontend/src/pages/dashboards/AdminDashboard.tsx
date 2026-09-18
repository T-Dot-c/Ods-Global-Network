import React from 'react';
import {
  LayoutDashboard,
  Users,
  Building2,
  Stethoscope,
  Calendar,
  CreditCard,
  FileText,
  Settings,
  ShieldCheck,
  BarChart3,
  UserCheck,
} from 'lucide-react';
import { DashboardLayout, SidebarItem, StatCardItem, QuickActionItem } from './DashboardLayout';

interface AdminDashboardProps {
  onNavigate: (view: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onNavigate }) => {
  const sidebarItems: SidebarItem[] = [
    { id: 'overview', label: 'Overview', icon: <LayoutDashboard size={17} /> },
    { id: 'users', label: 'Users', icon: <Users size={17} /> },
    { id: 'merchants', label: 'Merchants', icon: <Building2 size={17} /> },
    { id: 'providers', label: 'Providers', icon: <Stethoscope size={17} /> },
    { id: 'bookings', label: 'Bookings', icon: <Calendar size={17} /> },
    { id: 'transactions', label: 'Transactions', icon: <CreditCard size={17} /> },
    { id: 'reports', label: 'Reports', icon: <BarChart3 size={17} /> },
    { id: 'settings', label: 'Settings', icon: <Settings size={17} /> },
  ];

  // 6 cards (2 rows of 3)
  const statCards: StatCardItem[] = [
    { label: 'Users', value: 1, subtext: 'Registered accounts', icon: <Users size={22} /> },
    { label: 'Merchants', value: 0, subtext: 'Institutional partners', icon: <Building2 size={22} /> },
    { label: 'Providers', value: 0, subtext: 'Accredited facilities', icon: <Stethoscope size={22} /> },
    { label: 'Bookings', value: 0, subtext: 'Platform reservations', icon: <Calendar size={22} /> },
    { label: 'Payments', value: 0, subtext: 'Completed checkouts', icon: <CreditCard size={22} /> },
    { label: 'Pending Reviews', value: 0, subtext: 'Compliance queue', icon: <ShieldCheck size={22} /> },
  ];

  const quickActions: QuickActionItem[] = [
    { label: 'Review Registrations', icon: <ShieldCheck size={16} color="var(--color-gold-bright)" />, onClick: () => alert('Opening compliance review queue.') },
    { label: 'Manage Users', icon: <UserCheck size={16} color="var(--color-gold-bright)" />, onClick: () => alert('Access user role management.') },
    { label: 'View Transactions', icon: <CreditCard size={16} color="var(--color-gold-bright)" />, onClick: () => alert('Inspect audit transaction ledger.') },
    { label: 'View Reports', icon: <FileText size={16} color="var(--color-gold-bright)" />, onClick: () => alert('Generate platform health reports.') },
  ];

  return (
    <DashboardLayout
      role="admin"
      roleTitle="Administrator Dashboard"
      sidebarItems={sidebarItems}
      statCards={statCards}
      quickActions={quickActions}
      activityTitle="System Activity"
      onNavigate={onNavigate}
    />
  );
};

export default AdminDashboard;
