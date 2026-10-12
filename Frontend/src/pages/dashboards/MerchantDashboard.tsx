import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Building2,
  Briefcase,
  Calendar,
  Users,
  Settings,
  Layers,
  Clock,
  FileText,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { DashboardLayout, SidebarItem, StatCardItem, QuickActionItem } from './DashboardLayout';
import { MerchantProfileTab } from './merchant/MerchantProfileTab';
import { MerchantDocumentsTab } from './merchant/MerchantDocumentsTab';
import { useAuth, ApprovalStatus } from '../../context/AuthContext';
import { getMerchantProfile, MerchantProfile } from '../../services/merchantService';

interface MerchantDashboardProps {
  onNavigate: (view: string) => void;
}

export const MerchantDashboard: React.FC<MerchantDashboardProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [profile, setProfile] = useState<MerchantProfile | null>(null);

  const loadProfile = async () => {
    try {
      const p = await getMerchantProfile();
      setProfile(p);
    } catch {
      // Ignore initial load failure if network issue
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const currentStatus: ApprovalStatus = profile?.approval_status || user?.approval_status || 'pending';

  const sidebarItems: SidebarItem[] = [
    { id: 'overview', label: 'Overview', icon: <LayoutDashboard size={17} /> },
    { id: 'business', label: 'Business Profile', icon: <Building2 size={17} /> },
    { id: 'documents', label: 'KYC Documents', icon: <FileText size={17} /> },
    { id: 'services', label: 'Services Catalog', icon: <Briefcase size={17} /> },
    { id: 'bookings', label: 'Bookings', icon: <Calendar size={17} /> },
    { id: 'customers', label: 'Customers', icon: <Users size={17} /> },
    { id: 'settings', label: 'Settings', icon: <Settings size={17} /> },
  ];

  const statCards: StatCardItem[] = [
    { label: 'Services Catalog', value: 0, subtext: 'Active service listings', icon: <Briefcase size={22} /> },
    { label: 'Orders & Bookings', value: 0, subtext: 'Incoming client reservations', icon: <Calendar size={22} /> },
    { label: 'Client Accounts', value: 0, subtext: 'Registered customers served', icon: <Users size={22} /> },
  ];

  const quickActions: QuickActionItem[] = [
    {
      label: 'Business Profile',
      icon: <Building2 size={16} color="var(--color-gold-bright)" />,
      onClick: () => setActiveTab('business'),
    },
    {
      label: 'KYC Documents',
      icon: <FileText size={16} color="var(--color-gold-bright)" />,
      onClick: () => setActiveTab('documents'),
    },
    {
      label: 'Manage Catalog',
      icon: <Layers size={16} color="var(--color-gold-bright)" />,
      onClick: () => alert('Add or update health and wellness offerings.'),
    },
    {
      label: 'View Bookings',
      icon: <Calendar size={16} color="var(--color-gold-bright)" />,
      onClick: () => alert('Manage appointment schedules and customer requests.'),
    },
  ];

  return (
    <DashboardLayout
      role="merchant"
      roleTitle="Merchant Enterprise Dashboard"
      sidebarItems={sidebarItems}
      statCards={statCards}
      quickActions={quickActions}
      activityTitle="Recent Activity"
      showApprovalStatus={true}
      activeTab={activeTab}
      onTabChange={(tabId) => setActiveTab(tabId)}
      onNavigate={onNavigate}
    >
      {/* Real-time Approval Status Banners */}
      {currentStatus === 'rejected' && (
        <div
          style={{
            padding: '16px 20px',
            borderRadius: '10px',
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            color: '#991b1b',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px',
            marginBottom: '24px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <XCircle size={22} color="#dc2626" />
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>Account Accreditation Rejected</div>
              <div style={{ fontSize: '0.85rem', color: '#b91c1c', marginTop: '2px' }}>
                Reason: {profile?.rejection_reason || 'Compliance criteria not met. Please review your submitted documents.'}
              </div>
            </div>
          </div>
          <button
            onClick={() => setActiveTab('documents')}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              backgroundColor: '#dc2626',
              color: '#ffffff',
              border: 'none',
              fontSize: '0.82rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Re-Upload KYC Documents
          </button>
        </div>
      )}

      {currentStatus === 'approved' && (
        <div
          style={{
            padding: '14px 18px',
            borderRadius: '10px',
            backgroundColor: 'rgba(16, 185, 129, 0.08)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '24px',
          }}
        >
          <CheckCircle2 size={20} color="#059669" />
          <div style={{ fontSize: '0.85rem', color: '#065f46', lineHeight: 1.5 }}>
            <strong>Accreditation Active:</strong> Your merchant account has been fully accredited. Note that modifying your business name, category, or physical address will trigger a Compliance Reset and require re-verification.
          </div>
        </div>
      )}

      {currentStatus === 'pending' && (
        <div
          style={{
            padding: '14px 18px',
            borderRadius: '10px',
            backgroundColor: 'rgba(245, 158, 11, 0.08)',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '24px',
          }}
        >
          <Clock size={20} color="#b45309" />
          <div style={{ fontSize: '0.85rem', color: '#92400e', lineHeight: 1.5 }}>
            <strong>Compliance Review in Progress:</strong> Your account is pending accreditation by our compliance officers. You may update your profile or upload additional compliance documents at any time.
          </div>
        </div>
      )}

      {/* Tab views */}
      {activeTab === 'business' && (
        <MerchantProfileTab onProfileUpdated={(p) => setProfile(p)} />
      )}
      {activeTab === 'documents' && (
        <MerchantDocumentsTab approvalStatus={currentStatus} onDocumentUploaded={loadProfile} />
      )}
    </DashboardLayout>
  );
};

export default MerchantDashboard;
