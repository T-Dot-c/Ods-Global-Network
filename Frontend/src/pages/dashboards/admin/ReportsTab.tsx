import React, { useState, useEffect } from 'react';
import {
  Download,
  Calendar,
  RefreshCw,
  TrendingUp,
  Users,
  ShieldCheck,
  Stethoscope,
  DollarSign,
} from 'lucide-react';
import { fetchAdminReport, getReportExportUrl } from '../../../services/adminService';

interface ReportOption {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
}

export const ReportsTab: React.FC = () => {
  const [selectedReport, setSelectedReport] = useState<string>('users');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reports: ReportOption[] = [
    {
      id: 'users',
      name: 'User Registrations',
      description: 'Breakdown of accounts created by role and verification status',
      icon: <Users size={18} color="var(--color-navy-dark)" />,
    },
    {
      id: 'kyc_funnel',
      name: 'KYC Compliance Funnel',
      description: 'Accreditation status rates for healthcare merchants and providers',
      icon: <ShieldCheck size={18} color="#059669" />,
    },
    {
      id: 'catalog_breakdown',
      name: 'Services Catalog Taxonomy',
      description: 'Published vs pending service offerings categorized by specialty',
      icon: <Stethoscope size={18} color="#0284c7" />,
    },
    {
      id: 'booking_volume',
      name: 'Booking Volume & Cancellations',
      description: 'Scheduled, completed, and customer/provider cancellation counts',
      icon: <Calendar size={18} color="var(--color-gold-deep)" />,
    },
    {
      id: 'revenue_net',
      name: 'Revenue, Refunds & Net Volume',
      description: 'Gross platform booking volume, Chapa refunds, and net ledger flow',
      icon: <DollarSign size={18} color="#16a34a" />,
    },
    {
      id: 'top_providers',
      name: 'Top Healthcare Providers',
      description: 'Leading healthcare clinics and doctors ranked by completed bookings',
      icon: <TrendingUp size={18} color="#9333ea" />,
    },
  ];

  const runReport = async () => {
    try {
      setLoading(true);
      setError(null);
      const rows = await fetchAdminReport(selectedReport, dateFrom || undefined, dateTo || undefined);
      setData(rows || []);
    } catch (err: any) {
      setError(err.message || 'Failed to generate operational report.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runReport();
  }, [selectedReport]);

  const handleExportCsv = () => {
    const exportUrl = getReportExportUrl(selectedReport, dateFrom || undefined, dateTo || undefined);
    window.open(exportUrl, '_blank');
  };

  const columns = data.length > 0 ? Object.keys(data[0]) : [];

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
        <div>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--color-navy-dark)', margin: 0 }}>
            Standard Operational Reports & Audited CSV Export
          </h2>
          <p style={{ fontSize: '0.86rem', color: '#64748b', margin: '4px 0 0' }}>
            Generate executive compliance and performance analytics with streaming CSV data export
          </p>
        </div>

        <button
          onClick={handleExportCsv}
          disabled={data.length === 0}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 18px',
            backgroundColor: data.length === 0 ? '#f1f5f9' : 'var(--color-navy-dark)',
            color: data.length === 0 ? '#94a3b8' : '#ffffff',
            border: 'none',
            borderRadius: '8px',
            fontSize: '0.84rem',
            fontWeight: 700,
            cursor: data.length === 0 ? 'not-allowed' : 'pointer',
          }}
        >
          <Download size={15} />
          Export CSV (Audited)
        </button>
      </div>

      {error && (
        <div style={{ padding: '12px 16px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', color: '#b91c1c', marginBottom: '16px', fontSize: '0.88rem' }}>
          {error}
        </div>
      )}

      {/* Report Selector Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px', marginBottom: '24px' }}>
        {reports.map((r) => {
          const isSelected = selectedReport === r.id;
          return (
            <div
              key={r.id}
              onClick={() => setSelectedReport(r.id)}
              style={{
                backgroundColor: isSelected ? 'rgba(190, 155, 73, 0.08)' : '#ffffff',
                border: isSelected ? '2px solid var(--color-gold-deep)' : '1px solid #e2e8f0',
                borderRadius: '10px',
                padding: '14px 16px',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                {r.icon}
                <span style={{ fontWeight: 700, fontSize: '0.92rem', color: isSelected ? 'var(--color-gold-deep)' : 'var(--color-navy-dark)' }}>
                  {r.name}
                </span>
              </div>
              <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b', lineHeight: 1.4 }}>
                {r.description}
              </p>
            </div>
          );
        })}
      </div>

      {/* Date Filters & Run Bar */}
      <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap', backgroundColor: '#ffffff', padding: '14px 18px', borderRadius: '10px', border: '1px solid #e2e8f0', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#475569' }}>From:</span>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.84rem' }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#475569' }}>To:</span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.84rem' }}
          />
        </div>

        <button
          onClick={runReport}
          disabled={loading}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '7px 16px',
            backgroundColor: 'var(--color-navy-dark)',
            color: '#ffffff',
            border: 'none',
            borderRadius: '6px',
            fontWeight: 600,
            fontSize: '0.84rem',
            cursor: 'pointer',
          }}
        >
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          Run Report
        </button>
      </div>

      {/* Results Table */}
      <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <div style={{ padding: '14px 18px', borderBottom: '1px solid #e2e8f0', backgroundColor: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--color-navy-dark)' }}>
            Report Dataset: {reports.find(r => r.id === selectedReport)?.name} ({data.length} records)
          </span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontWeight: 700 }}>
                {columns.map((c) => (
                  <th key={c} style={{ padding: '12px 16px', textTransform: 'capitalize' }}>
                    {c.replace(/_/g, ' ')}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={columns.length || 1} style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
                    Compiling report query...
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={columns.length || 1} style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
                    No records found for the selected time range.
                  </td>
                </tr>
              ) : (
                data.map((row, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    {columns.map((c) => (
                      <td key={c} style={{ padding: '12px 16px', color: '#334155' }}>
                        {row[c] !== null && row[c] !== undefined ? String(row[c]) : '-'}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
export default ReportsTab;
