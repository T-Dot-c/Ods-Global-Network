import React, { useState, useEffect } from 'react';
import {
  Users,
  ShieldCheck,
  Stethoscope,
  Calendar,
  DollarSign,
  AlertTriangle,
  Gift,
  ArrowRight,
  RefreshCw,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import { fetchAdminDashboard, DashboardMetricsData } from '../../../services/adminService';

interface AdminOverviewTabProps {
  onNavigateTab: (tabId: string) => void;
}

export const AdminOverviewTab: React.FC<AdminOverviewTabProps> = ({ onNavigateTab }) => {
  const [data, setData] = useState<DashboardMetricsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const metrics = await fetchAdminDashboard();
      setData(metrics);
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard metrics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading && !data) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px 0', gap: '12px' }}>
        <RefreshCw size={22} className="animate-spin" color="var(--color-gold-deep)" />
        <span style={{ color: 'var(--color-navy-dark)', fontWeight: 600 }}>Loading operational control center...</span>
      </div>
    );
  }

  const counters = data?.counters || {};
  const needsAttention = data?.needs_attention || [];

  const cards = [
    {
      title: 'Active Users (30d)',
      value: counters.new_users_30d ?? 0,
      sub: 'Platform registered users',
      icon: <Users size={22} color="var(--color-gold-deep)" />,
      tab: 'users',
    },
    {
      title: 'Pending KYC Reviews',
      value: counters.pending_kyc_count ?? 0,
      sub: 'Merchants & providers in queue',
      icon: <ShieldCheck size={22} color="#b45309" />,
      tab: 'kyc',
      highlight: (counters.pending_kyc_count || 0) > 0,
    },
    {
      title: 'Services Pending Review',
      value: counters.pending_services_count ?? 0,
      sub: 'Catalog moderation intake',
      icon: <Stethoscope size={22} color="#0284c7" />,
      tab: 'services',
      highlight: (counters.pending_services_count || 0) > 0,
    },
    {
      title: 'Bookings Today',
      value: counters.today_confirmed_bookings ?? 0,
      sub: 'Scheduled appointments',
      icon: <Calendar size={22} color="#059669" />,
      tab: 'bookings',
    },
    {
      title: 'Today Revenue (ETB)',
      value: counters.today_revenue_etb ? `${counters.today_revenue_etb.toLocaleString()} ETB` : '0 ETB',
      sub: 'Confirmed payments',
      icon: <DollarSign size={22} color="#16a34a" />,
      tab: 'finance',
    },
    {
      title: 'Payment Conflicts',
      value: counters.payment_conflicts_count ?? 0,
      sub: 'Late bookings requiring resolution',
      icon: <AlertTriangle size={22} color="#dc2626" />,
      tab: 'bookings',
      highlight: (counters.payment_conflicts_count || 0) > 0,
    },
    {
      title: 'Pending Large Refunds',
      value: counters.pending_refund_approvals ?? 0,
      sub: '> 10,000 ETB 2-person reviews',
      icon: <Clock size={22} color="#ea580c" />,
      tab: 'finance',
      highlight: (counters.pending_refund_approvals || 0) > 0,
    },
    {
      title: 'Expiring Gifts (30d)',
      value: counters.expiring_gifts_30d ?? 0,
      sub: 'Active digital vouchers',
      icon: <Gift size={22} color="var(--color-gold-bright)" />,
      tab: 'gifts',
    },
  ];

  return (
    <div>
      {/* Top Bar with Refresh */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--color-navy-dark)', margin: 0 }}>
            Platform Operational Metrics
          </h2>
          <p style={{ fontSize: '0.88rem', color: '#64748b', margin: '4px 0 0' }}>
            Real-time status counters and administrative intervention queue
          </p>
        </div>
        <button
          onClick={loadData}
          disabled={loading}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 16px',
            backgroundColor: '#ffffff',
            border: '1px solid #cbd5e1',
            borderRadius: '8px',
            color: 'var(--color-navy-dark)',
            fontSize: '0.85rem',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Refresh Metrics
        </button>
      </div>

      {error && (
        <div style={{ padding: '14px 18px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px', color: '#b91c1c', marginBottom: '24px', fontSize: '0.88rem' }}>
          {error}
        </div>
      )}

      {/* KPI Cards Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
          gap: '16px',
          marginBottom: '32px',
        }}
      >
        {cards.map((c, i) => (
          <div
            key={i}
            onClick={() => onNavigateTab(c.tab)}
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '12px',
              border: c.highlight ? '1px solid #fca5a5' : '1px solid #e2e8f0',
              padding: '18px 20px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-2px)')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
              <span style={{ fontSize: '0.84rem', fontWeight: 600, color: '#64748b' }}>{c.title}</span>
              <div style={{ padding: '8px', borderRadius: '8px', backgroundColor: '#f8fafc' }}>
                {c.icon}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--color-navy-dark)', marginBottom: '4px' }}>
                {c.value}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>{c.sub}</span>
                <ArrowRight size={14} color="var(--color-gold-deep)" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Needs Attention Queue */}
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '14px',
          border: '1px solid #e2e8f0',
          padding: '24px',
          boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
          <AlertTriangle size={20} color="var(--color-gold-deep)" />
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--color-navy-dark)', margin: 0 }}>
            Operational Intervention Queue (Needs Attention)
          </h3>
        </div>

        {needsAttention.length === 0 ? (
          <div style={{ padding: '32px 0', textAlign: 'center', color: '#64748b' }}>
            <CheckCircle2 size={32} color="#059669" style={{ margin: '0 auto 8px' }} />
            <p style={{ margin: 0, fontWeight: 600 }}>All queues are clear. No pending administrative interventions require immediate attention.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {needsAttention.map((item, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '14px 18px',
                  backgroundColor: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '10px',
                }}
              >
                <div>
                  <span style={{ fontWeight: 700, color: 'var(--color-navy-dark)', fontSize: '0.92rem' }}>
                    {item.label}
                  </span>
                  <span
                    style={{
                      marginLeft: '10px',
                      padding: '2px 8px',
                      borderRadius: '999px',
                      backgroundColor: '#fee2e2',
                      color: '#b91c1c',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                    }}
                  >
                    {item.count} items
                  </span>
                </div>
                <button
                  onClick={() => onNavigateTab(item.tab)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 14px',
                    borderRadius: '6px',
                    backgroundColor: 'rgba(190, 155, 73, 0.15)',
                    border: '1px solid rgba(190, 155, 73, 0.4)',
                    color: 'var(--color-gold-deep)',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Review Queue
                  <ArrowRight size={13} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
export default AdminOverviewTab;
