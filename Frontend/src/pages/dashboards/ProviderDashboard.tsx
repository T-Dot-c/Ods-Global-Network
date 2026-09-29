import React from 'react';
import {
  LayoutDashboard,
  User,
  Stethoscope,
  Calendar,
  Clock,
  Bell,
  Settings,
  Layers,
  CalendarCheck,
} from 'lucide-react';
import { DashboardLayout, SidebarItem, StatCardItem, QuickActionItem } from './DashboardLayout';

interface ProviderDashboardProps {
  onNavigate: (view: string) => void;
}

export const ProviderDashboard: React.FC<ProviderDashboardProps> = ({ onNavigate }) => {
  const sidebarItems: SidebarItem[] = [
    { id: 'overview', label: 'Overview', icon: <LayoutDashboard size={17} /> },
    { id: 'profile', label: 'Profile', icon: <User size={17} /> },
    { id: 'services', label: 'Services', icon: <Stethoscope size={17} /> },
    { id: 'appointments', label: 'Appointments', icon: <Calendar size={17} /> },
    { id: 'availability', label: 'Availability', icon: <Clock size={17} /> },
    { id: 'notifications', label: 'Notifications', icon: <Bell size={17} /> },
    { id: 'settings', label: 'Settings', icon: <Settings size={17} /> },
  ];

  const statCards: StatCardItem[] = [
    { label: 'Clinical Services', value: 0, subtext: 'Healthcare specialties listed', icon: <Stethoscope size={22} /> },
    { label: 'Patient Queue', value: 0, subtext: 'Scheduled appointments', icon: <Calendar size={22} /> },
    { label: 'Roster Availability', value: 'Active', subtext: 'Consultation schedule live', icon: <CalendarCheck size={22} /> },
  ];

  const quickActions: QuickActionItem[] = [
    { label: 'Provider Profile', icon: <User size={16} color="var(--color-gold-bright)" />, onClick: () => alert('Update facility accreditation & healthcare provider profile.') },
    { label: 'Manage Services', icon: <Layers size={16} color="var(--color-gold-bright)" />, onClick: () => alert('Configure medical, wellness, laboratory, or home care offerings.') },
    { label: 'View Schedule', icon: <Calendar size={16} color="var(--color-gold-bright)" />, onClick: () => alert('Inspect real-time patient appointments & booking calendar.') },
    { label: 'Duty Hours', icon: <Clock size={16} color="var(--color-gold-bright)" />, onClick: () => alert('Configure consultation shifts, walk-in windows & time slots.') },
  ];

  return (
    <DashboardLayout
      role="provider"
      roleTitle="Service Provider Dashboard"
      sidebarItems={sidebarItems}
      statCards={statCards}
      quickActions={quickActions}
      activityTitle="Upcoming Appointments"
      showApprovalStatus={true}
      onNavigate={onNavigate}
    />
  );
};

export default ProviderDashboard;
