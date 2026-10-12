import React, { useState, useEffect } from 'react';
import {
  Inbox,
  HelpCircle,
  Briefcase,
  FileText,
  ExternalLink,
  RefreshCw,
  Mail,
  Phone,
  Calendar,
  AlertTriangle,
} from 'lucide-react';
import {
  fetchSupportInbox,
  fetchPartnersInbox,
  SupportTicket,
  PartnerInquiry,
} from '../../../services/adminService';

export const InquiriesInboxTab: React.FC = () => {
  const [subTab, setSubTab] = useState<'support' | 'partners'>('support');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [supportTickets, setSupportTickets] = useState<SupportTicket[]>([]);
  const [supportTotal, setSupportTotal] = useState(0);

  const [partnerInquiries, setPartnerInquiries] = useState<PartnerInquiry[]>([]);
  const [partnersTotal, setPartnersTotal] = useState(0);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      if (subTab === 'support') {
        const data = await fetchSupportInbox();
        setSupportTickets(data.requests);
        setSupportTotal(data.total);
      } else {
        const data = await fetchPartnersInbox();
        setPartnerInquiries(data.partners);
        setPartnersTotal(data.total);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load inbox data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [subTab]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--color-navy-dark)', margin: 0 }}>
            Public Inquiries & Intake Inbox
          </h2>
          <p style={{ color: '#64748b', fontSize: '0.88rem', margin: '4px 0 0' }}>
            Review inbound customer support inquiries and institutional partner proposals.
          </p>
        </div>

        <button
          onClick={loadData}
          disabled={loading}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 16px',
            borderRadius: '8px',
            backgroundColor: '#f8fafc',
            border: '1px solid #cbd5e1',
            color: 'var(--color-navy-dark)',
            fontSize: '0.85rem',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          <span>Refresh</span>
        </button>
      </div>

      {error && (
        <div style={{ padding: '12px 16px', borderRadius: '8px', backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', color: '#991b1b', fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <AlertTriangle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Sub-tab navigation */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
        <button
          onClick={() => setSubTab('support')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 18px',
            borderRadius: '8px',
            border: 'none',
            backgroundColor: subTab === 'support' ? 'rgba(190, 155, 73, 0.15)' : 'transparent',
            color: subTab === 'support' ? 'var(--color-gold-deep)' : '#64748b',
            fontWeight: subTab === 'support' ? 700 : 500,
            fontSize: '0.9rem',
            cursor: 'pointer',
          }}
        >
          <HelpCircle size={16} />
          <span>Customer Support ({supportTotal})</span>
        </button>

        <button
          onClick={() => setSubTab('partners')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 18px',
            borderRadius: '8px',
            border: 'none',
            backgroundColor: subTab === 'partners' ? 'rgba(190, 155, 73, 0.15)' : 'transparent',
            color: subTab === 'partners' ? 'var(--color-gold-deep)' : '#64748b',
            fontWeight: subTab === 'partners' ? 700 : 500,
            fontSize: '0.9rem',
            cursor: 'pointer',
          }}
        >
          <Briefcase size={16} />
          <span>Partner Proposals ({partnersTotal})</span>
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '48px', color: '#64748b' }}>
          <RefreshCw size={26} className="animate-spin" style={{ margin: '0 auto 12px' }} />
          <p>Loading inbox messages...</p>
        </div>
      ) : subTab === 'support' ? (
        supportTickets.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px', backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>
            <Inbox size={32} color="#94a3b8" style={{ margin: '0 auto 10px' }} />
            <div style={{ fontWeight: 600, color: '#475569' }}>No support requests yet</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {supportTickets.map((t) => (
              <div
                key={t.id}
                style={{
                  backgroundColor: '#ffffff',
                  borderRadius: '10px',
                  border: '1px solid #e2e8f0',
                  padding: '18px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
                  <div>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-gold-deep)', letterSpacing: '0.05em' }}>
                      REF: {t.reference_id}
                    </span>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--color-navy-dark)', margin: '4px 0' }}>
                      {t.subject}
                    </h3>
                  </div>
                  <span style={{ fontSize: '0.78rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Calendar size={13} />
                    {new Date(t.created_at).toLocaleString()}
                  </span>
                </div>

                <p style={{ margin: 0, fontSize: '0.9rem', color: '#334155', lineHeight: 1.5, backgroundColor: '#f8fafc', padding: '12px', borderRadius: '6px' }}>
                  {t.message}
                </p>

                <div style={{ display: 'flex', gap: '18px', flexWrap: 'wrap', fontSize: '0.82rem', color: '#64748b' }}>
                  <span>From: <strong style={{ color: '#1e293b' }}>{t.name}</strong></span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Mail size={13} /> {t.email}</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Phone size={13} /> {t.phone}</span>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        partnerInquiries.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px', backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>
            <Briefcase size={32} color="#94a3b8" style={{ margin: '0 auto 10px' }} />
            <div style={{ fontWeight: 600, color: '#475569' }}>No partner proposals yet</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {partnerInquiries.map((p) => (
              <div
                key={p.id}
                style={{
                  backgroundColor: '#ffffff',
                  borderRadius: '10px',
                  border: '1px solid #e2e8f0',
                  padding: '18px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
                  <div>
                    <span
                      style={{
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        backgroundColor: '#e0f2fe',
                        color: '#0369a1',
                      }}
                    >
                      {p.partnership_type.replace('_', ' ')}
                    </span>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-navy-dark)', margin: '4px 0' }}>
                      {p.company_name} ({p.name})
                    </h3>
                  </div>
                  <span style={{ fontSize: '0.78rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Calendar size={13} />
                    {new Date(p.created_at).toLocaleString()}
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '8px', fontSize: '0.84rem', color: '#475569' }}>
                  <div>Email: <strong>{p.email}</strong></div>
                  <div>Phone: <strong>{p.phone}</strong></div>
                  {p.whatsapp && <div>WhatsApp: <strong>{p.whatsapp}</strong></div>}
                  {p.sector && <div>Sector: <strong>{p.sector}</strong></div>}
                  {p.investment_type && <div>Investment: <strong>{p.investment_type}</strong></div>}
                </div>

                {p.enquiry && (
                  <p style={{ margin: 0, fontSize: '0.88rem', color: '#334155', lineHeight: 1.5, backgroundColor: '#f8fafc', padding: '12px', borderRadius: '6px' }}>
                    {p.enquiry}
                  </p>
                )}

                {/* Attached Document Link */}
                {p.document_view_url && (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderRadius: '8px', backgroundColor: 'rgba(190, 155, 73, 0.08)', border: '1px solid rgba(190, 155, 73, 0.3)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <FileText size={18} color="var(--color-gold-deep)" />
                      <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-navy-dark)' }}>
                        Attached Proposal: {p.document_name || 'Document'}
                      </span>
                    </div>
                    <a
                      href={`http://localhost:3001${p.document_view_url}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '6px 12px',
                        borderRadius: '6px',
                        backgroundColor: 'var(--color-gold-deep)',
                        color: '#ffffff',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        textDecoration: 'none',
                      }}
                    >
                      <span>View Proposal</span>
                      <ExternalLink size={13} />
                    </a>
                  </div>
                )}
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
};
