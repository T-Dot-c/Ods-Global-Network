import React from 'react';
import {
  LayoutDashboard,
  User,
  Calendar,
  Gift,
  Bell,
  Settings,
  CreditCard,
  Search,
  History,
  PlusCircle,
} from 'lucide-react';
import { DashboardLayout, SidebarItem, StatCardItem, QuickActionItem } from './DashboardLayout';

interface CustomerDashboardProps {
  onNavigate: (view: string) => void;
}

export const CustomerDashboard: React.FC<CustomerDashboardProps> = ({ onNavigate }) => {
  const sidebarItems: SidebarItem[] = [
    { id: 'overview', label: 'Overview', icon: <LayoutDashboard size={17} /> },
    { id: 'profile', label: 'My Profile', icon: <User size={17} /> },
    { id: 'appointments', label: 'Appointments', icon: <Calendar size={17} /> },
    { id: 'giftcards', label: 'Gift Cards', icon: <Gift size={17} /> },
    { id: 'notifications', label: 'Notifications', icon: <Bell size={17} /> },
    { id: 'settings', label: 'Settings', icon: <Settings size={17} /> },
  ];

  const statCards: StatCardItem[] = [
    { label: 'Bookings', value: 0, subtext: 'Upcoming appointments & tests', icon: <Calendar size={22} /> },
    { label: 'Payments', value: 0, subtext: 'Transactions & invoices', icon: <CreditCard size={22} /> },
    { label: 'Gift Vouchers', value: 0, subtext: 'Active balances & redemptions', icon: <Gift size={22} /> },
  ];

  const quickActions: QuickActionItem[] = [
    { label: 'Find Services', icon: <Search size={16} color="var(--color-gold-bright)" />, onClick: () => alert('Discover verified hospitals, clinics, pharmacies & wellness centers.') },
    { label: 'Book Appointment', icon: <PlusCircle size={16} color="var(--color-gold-bright)" />, onClick: () => alert('Schedule medical consultations & laboratory tests.') },
    { label: 'Buy Gift Card', icon: <Gift size={16} color="var(--color-gold-bright)" />, onClick: () => alert('Purchase ODS Basic or VIP digital wellness vouchers.') },
    { label: 'View History', icon: <History size={16} color="var(--color-gold-bright)" />, onClick: () => alert('Inspect past appointments, treatments & payments.') },
  ];

  return (
    <DashboardLayout
      role="customer"
      roleTitle="Customer Dashboard"
      sidebarItems={sidebarItems}
      statCards={statCards}
      quickActions={quickActions}
      activityTitle="Recent Activity"
      onNavigate={onNavigate}
    />
  );
};

export default CustomerDashboard;
