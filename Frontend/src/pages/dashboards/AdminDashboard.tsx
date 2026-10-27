import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Users,
  ShieldCheck,
  Stethoscope,
  Calendar,
  DollarSign,
  Gift,
  FileText,
  ShieldAlert,
  UserCheck,
  Settings,
  Inbox,
} from 'lucide-react';
import { DashboardLayout, SidebarItem } from './DashboardLayout';
import { AdminOverviewTab } from './admin/AdminOverviewTab';
import { UsersTab } from './admin/UsersTab';
import { KycQueueTab } from './admin/KycQueueTab';
import { ServicesTab } from './admin/ServicesTab';
import { BookingsTab } from './admin/BookingsTab';
import { FinanceTab } from './admin/FinanceTab';
import { GiftsTab } from './admin/GiftsTab';
import { AuditLogsTab } from './admin/AuditLogsTab';
import { ReportsTab } from './admin/ReportsTab';
import { StaffAccountsTab } from './admin/StaffAccountsTab';
import { PlatformSettingsTab } from './admin/PlatformSettingsTab';
import { InquiriesInboxTab } from './admin/InquiriesInboxTab';
import { fetchMyPermissions, AdminPermissionsData } from '../../services/adminService';
import { useAuth } from '../../context/AuthContext';

interface AdminDashboardProps {
  onNavigate: (view: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [permData, setPermData] = useState<AdminPermissionsData | null>(null);

  useEffect(() => {
    fetchMyPermissions()
      .then((data) => setPermData(data))
      .catch((err) => console.warn('[AdminDashboard] Permissions load fallback:', err.message));
  }, []);

  const isSuper = user?.role === 'super_admin' || permData?.isSuperAdmin;
  const perms = permData?.permissions || [];

  const hasPerm = (prefix: string) => {
    if (isSuper || perms.includes('*')) return true;
    return perms.some(p => p.startsWith(prefix) || p === prefix);
  };

  // Dynamically constructed sidebar items based on granular RBAC
  const sidebarItems: SidebarItem[] = [
    { id: 'overview', label: 'Overview', icon: <LayoutDashboard size={17} /> },
    ...(hasPerm('users.') ? [{ id: 'users', label: 'User Directory', icon: <Users size={17} /> }] : []),
    ...(hasPerm('kyc.') ? [{ id: 'kyc', label: 'KYC Compliance', icon: <ShieldCheck size={17} /> }] : []),
    ...(hasPerm('services.') || hasPerm('categories.') ? [{ id: 'services', label: 'Services Catalog', icon: <Stethoscope size={17} /> }] : []),
    ...(hasPerm('bookings.') ? [{ id: 'bookings', label: 'Bookings Ledger', icon: <Calendar size={17} /> }] : []),
    ...(hasPerm('payments.') || hasPerm('refunds.') ? [{ id: 'finance', label: 'Finance & Refunds', icon: <DollarSign size={17} /> }] : []),
    ...(hasPerm('gifts.') ? [{ id: 'gifts', label: 'Digital Vouchers', icon: <Gift size={17} /> }] : []),
    ...(hasPerm('reports.') ? [{ id: 'reports', label: 'Operational Reports', icon: <FileText size={17} /> }] : []),
    ...(isSuper || hasPerm('audit.view') ? [{ id: 'audit', label: 'Audit Ledger', icon: <ShieldAlert size={17} /> }] : []),
    ...(isSuper || hasPerm('admins.manage') ? [{ id: 'staff', label: 'Staff Accounts', icon: <UserCheck size={17} /> }] : []),
    ...(hasPerm('support.') || isSuper ? [{ id: 'inbox', label: 'Inquiries Inbox', icon: <Inbox size={17} /> }] : []),
    ...(isSuper || hasPerm('settings.manage') ? [{ id: 'settings', label: 'Platform Settings', icon: <Settings size={17} /> }] : []),
  ];

  return (
    <DashboardLayout
      role={user?.role || 'admin'}
      roleTitle={isSuper ? 'Super Administrator Console' : 'Operational Administration Console'}
      sidebarItems={sidebarItems}
      activeTab={activeTab}
      onTabChange={(tabId) => setActiveTab(tabId)}
      onNavigate={onNavigate}
    >
      {activeTab === 'overview' && <AdminOverviewTab onNavigateTab={(tab) => setActiveTab(tab)} />}
      {activeTab === 'users' && <UsersTab />}
      {activeTab === 'kyc' && <KycQueueTab />}
      {activeTab === 'services' && <ServicesTab />}
      {activeTab === 'bookings' && <BookingsTab />}
      {activeTab === 'finance' && <FinanceTab />}
      {activeTab === 'gifts' && <GiftsTab />}
      {activeTab === 'reports' && <ReportsTab />}
      {activeTab === 'audit' && <AuditLogsTab />}
      {activeTab === 'staff' && <StaffAccountsTab />}
      {activeTab === 'inbox' && <InquiriesInboxTab />}
      {activeTab === 'settings' && <PlatformSettingsTab />}
    </DashboardLayout>
  );
};

export default AdminDashboard;
