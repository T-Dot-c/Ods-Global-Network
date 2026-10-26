import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  User,
  Stethoscope,
  Calendar,
  Clock,
  Settings,
  Layers,
  FileText,
  CheckCircle2,
  XCircle,
  CalendarCheck,
  Gift,
} from 'lucide-react';
import { DashboardLayout, SidebarItem, StatCardItem, QuickActionItem } from './DashboardLayout';
import { ProviderProfileTab } from './provider/ProviderProfileTab';
import { ProviderDocumentsTab } from './provider/ProviderDocumentsTab';
import { ProviderVouchersTab } from './provider/ProviderVouchersTab';
import { ProviderServicesTab } from './provider/ProviderServicesTab';
import { ProviderBookingsTab } from './provider/ProviderBookingsTab';
import { ProviderAvailabilityTab } from './provider/ProviderAvailabilityTab';
import { useAuth, ApprovalStatus } from '../../context/AuthContext';
import { getProviderProfile, ProviderProfile } from '../../services/providerService';

interface ProviderDashboardProps {
  onNavigate: (view: string) => void;
}

export const ProviderDashboard: React.FC<ProviderDashboardProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [profile, setProfile] = useState<ProviderProfile | null>(null);

  const loadProfile = async () => {
    try {
      const p = await getProviderProfile();
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
    { id: 'vouchers', label: 'Patient Vouchers & Gifting', icon: <Gift size={17} /> },
    { id: 'profile', label: 'Facility Profile', icon: <User size={17} /> },
    { id: 'documents', label: 'KYC Documents', icon: <FileText size={17} /> },
    { id: 'services', label: 'Clinical Services', icon: <Stethoscope size={17} /> },
    { id: 'appointments', label: 'Appointments', icon: <Calendar size={17} /> },
    { id: 'availability', label: 'Availability', icon: <Clock size={17} /> },
    { id: 'settings', label: 'Settings', icon: <Settings size={17} /> },
  ];

  const statCards: StatCardItem[] = [
    { label: 'Clinical Services', value: 0, subtext: 'Healthcare specialties listed', icon: <Stethoscope size={22} /> },
    { label: 'Patient Queue', value: 0, subtext: 'Scheduled appointments', icon: <Calendar size={22} /> },
    { label: 'Roster Availability', value: 'Active', subtext: 'Consultation schedule live', icon: <CalendarCheck size={22} /> },
  ];

  const quickActions: QuickActionItem[] = [
    {
      label: 'Verify Voucher',
      icon: <Gift size={16} color="var(--color-gold-bright)" />,
      onClick: () => setActiveTab('vouchers'),
    },
    {
      label: 'Provider Profile',
      icon: <User size={16} color="var(--color-gold-bright)" />,
      onClick: () => setActiveTab('profile'),
    },
    {
      label: 'KYC Documents',
      icon: <FileText size={16} color="var(--color-gold-bright)" />,
      onClick: () => setActiveTab('documents'),
    },
    {
      label: 'Manage Services',
      icon: <Layers size={16} color="var(--color-gold-bright)" />,
      onClick: () => setActiveTab('services'),
    },
    {
      label: 'Duty Hours',
      icon: <Clock size={16} color="var(--color-gold-bright)" />,
      onClick: () => alert('Configure consultation shifts, walk-in windows & time slots.'),
    },
  ];

  return (
    <DashboardLayout
      role="provider"
      roleTitle="Healthcare Provider Dashboard"
      sidebarItems={sidebarItems}
      statCards={statCards}
      quickActions={quickActions}
      activityTitle="Upcoming Appointments"
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
              <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>Provider Accreditation Rejected</div>
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
            <strong>Accreditation Active:</strong> Your healthcare facility is accredited. Note that modifying your provider name, provider type, license number, or physical facility address will trigger a Compliance Reset and require re-verification.
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
            <strong>Clinical Compliance Review in Progress:</strong> Your healthcare provider account is pending accreditation by our medical compliance officers. You may update your facility profile or upload additional clinical licenses at any time.
          </div>
        </div>
      )}

      {/* Tab views */}
      {activeTab === 'vouchers' && (
        <ProviderVouchersTab providerName={profile?.provider_name || user?.full_name} />
      )}
      {activeTab === 'profile' && (
        <ProviderProfileTab onProfileUpdated={(p) => setProfile(p)} />
      )}
      {activeTab === 'documents' && (
        <ProviderDocumentsTab approvalStatus={currentStatus} onDocumentUploaded={loadProfile} />
      )}
      {activeTab === 'services' && (
        <ProviderServicesTab />
      )}
      {activeTab === 'appointments' && (
        <ProviderBookingsTab />
      )}
      {activeTab === 'availability' && (
        <ProviderAvailabilityTab />
      )}
    </DashboardLayout>
  );
};

export default ProviderDashboard;
