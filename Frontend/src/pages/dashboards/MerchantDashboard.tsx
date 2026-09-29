import React from 'react';
import {
  LayoutDashboard,
  Building2,
  Briefcase,
  Calendar,
  Users,
  Bell,
  Settings,
  Layers,
  Clock,
} from 'lucide-react';
import { DashboardLayout, SidebarItem, StatCardItem, QuickActionItem } from './DashboardLayout';

interface MerchantDashboardProps {
  onNavigate: (view: string) => void;
}

export const MerchantDashboard: React.FC<MerchantDashboardProps> = ({ onNavigate }) => {
  const sidebarItems: SidebarItem[] = [
    { id: 'overview', label: 'Overview', icon: <LayoutDashboard size={17} /> },
    { id: 'business', label: 'Business', icon: <Building2 size={17} /> },
    { id: 'services', label: 'Services', icon: <Briefcase size={17} /> },
    { id: 'bookings', label: 'Bookings', icon: <Calendar size={17} /> },
    { id: 'customers', label: 'Customers', icon: <Users size={17} /> },
    { id: 'notifications', label: 'Notifications', icon: <Bell size={17} /> },
    { id: 'settings', label: 'Settings', icon: <Settings size={17} /> },
  ];

  const statCards: StatCardItem[] = [
    { label: 'Services Catalog', value: 0, subtext: 'Active service listings', icon: <Briefcase size={22} /> },
    { label: 'Orders & Bookings', value: 0, subtext: 'Incoming client reservations', icon: <Calendar size={22} /> },
    { label: 'Client Accounts', value: 0, subtext: 'Registered customers served', icon: <Users size={22} /> },
  ];

  const quickActions: QuickActionItem[] = [
    { label: 'Business Profile', icon: <Building2 size={16} color="var(--color-gold-bright)" />, onClick: () => alert('Manage merchant business identity & trade license.') },
    { label: 'Manage Catalog', icon: <Layers size={16} color="var(--color-gold-bright)" />, onClick: () => alert('Add or update health and wellness offerings.') },
    { label: 'View Bookings', icon: <Calendar size={16} color="var(--color-gold-bright)" />, onClick: () => alert('Manage appointment schedules and customer requests.') },
    { label: 'Operating Hours', icon: <Clock size={16} color="var(--color-gold-bright)" />, onClick: () => alert('Configure business availability and time slots.') },
  ];

  return (
    <DashboardLayout
      role="merchant"
      roleTitle="Merchant Dashboard"
      sidebarItems={sidebarItems}
      statCards={statCards}
      quickActions={quickActions}
      activityTitle="Recent Activity"
      showApprovalStatus={true}
      onNavigate={onNavigate}
    />
  );
};

export default MerchantDashboard;
