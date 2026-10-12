import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Clock,
  CheckCircle2,
  XCircle,
  FileText,
  AlertTriangle,
  ExternalLink,
  RefreshCw,
  Search,
  Filter,
} from 'lucide-react';
import { fetchKycQueue, submitKycDecision, KycEntity } from '../../../services/adminService';

export const KycQueueTab: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [merchants, setMerchants] = useState<KycEntity[]>([]);
  const [providers, setProviders] = useState<KycEntity[]>([]);
  const [totalPending, setTotalPending] = useState(0);

  const [filterType, setFilterType] = useState<'all' | 'merchant' | 'provider'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [searchQuery, setSearchQuery] = useState('');

  // Reject modal state
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [selectedEntity, setSelectedEntity] = useState<KycEntity | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [submittingDecision, setSubmittingDecision] = useState(false);

  const loadQueue = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchKycQueue();
      if (data.queue) {
        setMerchants(data.queue.merchants);
        setProviders(data.queue.providers);
        setTotalPending(data.queue.total_pending);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load KYC queue.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQueue();
  }, []);

  const handleApprove = async (entity: KycEntity) => {
    if (!window.confirm(`Are you sure you want to approve ${entity.display_name}? This will verify attached documents.`)) {
      return;
    }

    try {
      setSubmittingDecision(true);
      setError(null);
      setSuccessMsg(null);
      const res = await submitKycDecision(entity.entity_type, entity.id, 'approved');
      setSuccessMsg(res.message || `${entity.display_name} has been approved.`);
      await loadQueue();
    } catch (err: any) {
      setError(err.message || 'Failed to approve entity.');
    } finally {
      setSubmittingDecision(false);
    }
  };

  const openRejectModal = (entity: KycEntity) => {
    setSelectedEntity(entity);
    setRejectReason('');
    setRejectModalOpen(true);
  };

  const handleConfirmReject = async () => {
    if (!selectedEntity) return;
    if (!rejectReason.trim()) {
      alert('Please provide a specific reason for rejection.');
      return;
    }

    try {
      setSubmittingDecision(true);
      setError(null);
      setSuccessMsg(null);
      const res = await submitKycDecision(selectedEntity.entity_type, selectedEntity.id, 'rejected', rejectReason.trim());
      setSuccessMsg(res.message || `${selectedEntity.display_name} has been rejected.`);
      setRejectModalOpen(false);
      setSelectedEntity(null);
      await loadQueue();
    } catch (err: any) {
      setError(err.message || 'Failed to reject entity.');
    } finally {
      setSubmittingDecision(false);
    }
  };

  // Combine and filter list
  const allEntities = [...merchants, ...providers];
  const filteredEntities = allEntities.filter((e) => {
    if (filterType !== 'all' && e.entity_type !== filterType) return false;
    if (filterStatus !== 'all' && e.approval_status !== filterStatus) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = e.display_name?.toLowerCase().includes(q);
      const matchEmail = e.user_email?.toLowerCase().includes(q);
      const matchCategory = e.category?.toLowerCase().includes(q);
      if (!matchName && !matchEmail && !matchCategory) return false;
    }
    return true;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Top Banner & Refresh */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--color-navy-dark)', margin: 0 }}>
            KYC & Accreditation Review Queue
          </h2>
          <p style={{ color: '#64748b', fontSize: '0.88rem', margin: '4px 0 0' }}>
            Inspect compliance records, verify documents, and apply atomic accreditation decisions.
          </p>
        </div>
        <button
          onClick={loadQueue}
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
          <span>Refresh Queue ({totalPending} Pending)</span>
        </button>
      </div>

      {/* Alerts */}
      {successMsg && (
        <div style={{ padding: '12px 16px', borderRadius: '8px', backgroundColor: 'rgba(16, 185, 129, 0.1)', border: '1px solid #10b981', color: '#065f46', fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <CheckCircle2 size={18} />
          <span>{successMsg}</span>
        </div>
      )}
      {error && (
        <div style={{ padding: '12px 16px', borderRadius: '8px', backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', color: '#991b1b', fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <AlertTriangle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Controls: Search & Filters */}
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center', backgroundColor: '#f8fafc', padding: '14px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
        <div style={{ position: 'relative', flex: '1 1 240px' }}>
          <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            placeholder="Search business name, category, or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px 8px 36px',
              borderRadius: '6px',
              border: '1px solid #cbd5e1',
              fontSize: '0.88rem',
              outline: 'none',
              backgroundColor: '#ffffff',
            }}
          />
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <Filter size={15} color="#64748b" />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as any)}
            style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.88rem', backgroundColor: '#ffffff', outline: 'none' }}
          >
            <option value="all">All Entity Types</option>
            <option value="merchant">Merchants Only</option>
            <option value="provider">Providers Only</option>
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.88rem', backgroundColor: '#ffffff', outline: 'none' }}
          >
            <option value="pending">Pending Only</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="all">All Statuses</option>
          </select>
        </div>
      </div>

      {/* Submissions List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '48px', color: '#64748b' }}>
          <RefreshCw size={28} className="animate-spin" style={{ margin: '0 auto 12px' }} />
          <p>Loading compliance queue submissions...</p>
        </div>
      ) : filteredEntities.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px', backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>
          <ShieldCheck size={36} color="var(--color-gold-deep)" style={{ margin: '0 auto 12px' }} />
          <div style={{ fontWeight: 700, color: 'var(--color-navy-dark)', fontSize: '1rem' }}>No Submissions Found</div>
          <p style={{ color: '#64748b', fontSize: '0.88rem', maxWidth: '400px', margin: '6px auto 0' }}>
            There are no entities matching your current filters. Check other status categories or search queries.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {filteredEntities.map((entity) => {
            const isPending = entity.approval_status === 'pending';
            const isApproved = entity.approval_status === 'approved';
            const isRejected = entity.approval_status === 'rejected';

            return (
              <div
                key={`${entity.entity_type}-${entity.id}`}
                style={{
                  backgroundColor: '#ffffff',
                  borderRadius: '12px',
                  border: isPending ? '1px solid rgba(190, 155, 73, 0.4)' : '1px solid #e2e8f0',
                  boxShadow: isPending ? '0 4px 12px rgba(190, 155, 73, 0.08)' : '0 2px 4px rgba(0,0,0,0.02)',
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px',
                }}
              >
                {/* Header row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span
                        style={{
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          padding: '3px 8px',
                          borderRadius: '4px',
                          backgroundColor: entity.entity_type === 'merchant' ? '#e0f2fe' : '#f3e8ff',
                          color: entity.entity_type === 'merchant' ? '#0369a1' : '#7e22ce',
                        }}
                      >
                        {entity.entity_type}
                      </span>
                      <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--color-navy-dark)', margin: 0 }}>
                        {entity.display_name}
                      </h3>
                    </div>
                    <div style={{ fontSize: '0.82rem', color: '#64748b', marginTop: '4px' }}>
                      Category: <strong style={{ color: '#334155' }}>{entity.category || 'General'}</strong> &bull; User: {entity.user_full_name} ({entity.user_email})
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div>
                    {isPending && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '999px', backgroundColor: 'rgba(245, 158, 11, 0.12)', color: '#b45309', fontSize: '0.82rem', fontWeight: 700 }}>
                        <Clock size={14} /> Pending Review
                      </span>
                    )}
                    {isApproved && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '999px', backgroundColor: 'rgba(16, 185, 129, 0.12)', color: '#065f46', fontSize: '0.82rem', fontWeight: 700 }}>
                        <CheckCircle2 size={14} /> Approved
                      </span>
                    )}
                    {isRejected && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '999px', backgroundColor: 'rgba(239, 68, 68, 0.12)', color: '#b91c1c', fontSize: '0.82rem', fontWeight: 700 }}>
                        <XCircle size={14} /> Rejected
                      </span>
                    )}
                  </div>
                </div>

                {/* Rejection Reason notice if rejected */}
                {isRejected && entity.rejection_reason && (
                  <div style={{ padding: '10px 14px', borderRadius: '8px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', fontSize: '0.84rem' }}>
                    <strong>Rejection Reason:</strong> {entity.rejection_reason}
                  </div>
                )}

                {/* Attached Documents */}
                <div style={{ backgroundColor: '#f8fafc', padding: '14px', borderRadius: '8px', border: '1px solid #f1f5f9' }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: '8px' }}>
                    Attached KYC Documents ({entity.documents.length})
                  </div>
                  {entity.documents.length === 0 ? (
                    <div style={{ fontSize: '0.84rem', color: '#94a3b8', fontStyle: 'italic' }}>
                      No compliance documents attached. Entity cannot be approved until at least 1 document is uploaded.
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '10px' }}>
                      {entity.documents.map((doc) => (
                        <div
                          key={doc.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '8px 12px',
                            backgroundColor: '#ffffff',
                            borderRadius: '6px',
                            border: '1px solid #e2e8f0',
                            fontSize: '0.82rem',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                            <FileText size={16} color="var(--color-gold-deep)" style={{ flexShrink: 0 }} />
                            <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              <div style={{ fontWeight: 600, color: '#334155' }}>{doc.file_name}</div>
                              <div style={{ fontSize: '0.74rem', color: '#94a3b8' }}>
                                {doc.purpose} &bull; {(doc.file_size / 1024).toFixed(0)} KB &bull;{' '}
                                <span style={{ color: doc.status === 'verified' ? '#10b981' : doc.status === 'rejected' ? '#ef4444' : '#f59e0b', fontWeight: 600 }}>
                                  {doc.status}
                                </span>
                              </div>
                            </div>
                          </div>

                          <a
                            href={`http://localhost:3001${doc.view_url}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '4px 8px',
                              borderRadius: '4px',
                              backgroundColor: '#f1f5f9',
                              color: 'var(--color-navy-dark)',
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              textDecoration: 'none',
                              flexShrink: 0,
                            }}
                          >
                            <span>View</span>
                            <ExternalLink size={12} />
                          </a>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Action buttons (only for pending entities) */}
                {isPending && (
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', paddingTop: '8px', borderTop: '1px solid #f1f5f9' }}>
                    <button
                      onClick={() => openRejectModal(entity)}
                      disabled={submittingDecision}
                      style={{
                        padding: '8px 18px',
                        borderRadius: '6px',
                        backgroundColor: '#fff',
                        border: '1px solid #ef4444',
                        color: '#dc2626',
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      Reject Submission
                    </button>
                    <button
                      onClick={() => handleApprove(entity)}
                      disabled={submittingDecision || entity.documents.length === 0}
                      title={entity.documents.length === 0 ? 'Cannot approve without documents' : 'Approve entity'}
                      style={{
                        padding: '8px 20px',
                        borderRadius: '6px',
                        backgroundColor: entity.documents.length === 0 ? '#94a3b8' : 'var(--color-gold-deep)',
                        border: 'none',
                        color: '#ffffff',
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        cursor: entity.documents.length === 0 ? 'not-allowed' : 'pointer',
                      }}
                    >
                      Approve & Accredit
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Reject Modal */}
      {rejectModalOpen && selectedEntity && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '16px',
          }}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '12px',
              maxWidth: '500px',
              width: '100%',
              padding: '24px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#dc2626' }}>
              <XCircle size={22} />
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700, color: 'var(--color-navy-dark)' }}>
                Reject Submission
              </h3>
            </div>

            <p style={{ margin: 0, fontSize: '0.88rem', color: '#64748b' }}>
              Please provide a clear compliance reason for rejecting <strong>{selectedEntity.display_name}</strong>. This feedback will be displayed on their dashboard to guide re-submission.
            </p>

            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                Rejection Reason *
              </label>
              <textarea
                rows={4}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="e.g. Incomplete trade license document. Please upload a clear color scan showing full expiration date."
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.88rem',
                  outline: 'none',
                  fontFamily: 'inherit',
                  resize: 'vertical',
                }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
              <button
                type="button"
                onClick={() => setRejectModalOpen(false)}
                disabled={submittingDecision}
                style={{
                  padding: '8px 16px',
                  borderRadius: '6px',
                  backgroundColor: '#f1f5f9',
                  border: 'none',
                  color: '#475569',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReject}
                disabled={submittingDecision || !rejectReason.trim()}
                style={{
                  padding: '8px 18px',
                  borderRadius: '6px',
                  backgroundColor: '#dc2626',
                  border: 'none',
                  color: '#ffffff',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  cursor: !rejectReason.trim() ? 'not-allowed' : 'pointer',
                }}
              >
                {submittingDecision ? 'Submitting...' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
