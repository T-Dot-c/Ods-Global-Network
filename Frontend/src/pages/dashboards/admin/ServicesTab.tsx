import React, { useState, useEffect } from 'react';
import {
  RefreshCw,
  FolderTree,
  ShieldAlert,
} from 'lucide-react';
import {
  fetchAdminServices,
  decideAdminService,
  takedownAdminService,
  restoreAdminService,
  fetchAdminCategories,
  createAdminCategory,
  AdminServiceItem,
  AdminCategoryItem,
} from '../../../services/adminService';

export const ServicesTab: React.FC = () => {
  const [services, setServices] = useState<AdminServiceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Moderation / Takedown Modal State
  const [selectedService, setSelectedService] = useState<AdminServiceItem | null>(null);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [takedownModalOpen, setTakedownModalOpen] = useState(false);
  const [actionReason, setActionReason] = useState('');
  const [upcomingImpactCount, setUpcomingImpactCount] = useState<number | null>(null);
  const [submittingAction, setSubmittingAction] = useState(false);

  // Categories Modal State
  const [categoriesModalOpen, setCategoriesModalOpen] = useState(false);
  const [categories, setCategories] = useState<AdminCategoryItem[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatSlug, setNewCatSlug] = useState('');
  const [newCatParent, setNewCatParent] = useState('');

  const loadServices = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetchAdminServices({
        status: statusFilter,
        search,
        page,
        limit: 15,
      });
      setServices(res.services);
      setTotalPages(res.pagination?.pages || 1);
    } catch (err: any) {
      setError(err.message || 'Failed to load services.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadServices();
  }, [page, statusFilter]);

  const loadCategories = async () => {
    try {
      setCategoriesLoading(true);
      const data = await fetchAdminCategories();
      setCategories(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load categories.');
    } finally {
      setCategoriesLoading(false);
    }
  };

  const openCategoriesModal = () => {
    setCategoriesModalOpen(true);
    loadCategories();
  };

  const handleApprove = async (service: AdminServiceItem) => {
    if (!window.confirm(`Approve service "${service.title}" and publish to live directory?`)) return;
    try {
      await decideAdminService(service.id, 'approved');
      setSuccessMsg(`Service "${service.title}" approved and published.`);
      loadServices();
    } catch (err: any) {
      setError(err.message || 'Failed to approve service.');
    }
  };

  const handleReject = async () => {
    if (!selectedService || !actionReason.trim()) return;
    try {
      setSubmittingAction(true);
      await decideAdminService(selectedService.id, 'rejected', actionReason);
      setSuccessMsg(`Service "${selectedService.title}" rejected.`);
      setRejectModalOpen(false);
      setActionReason('');
      setSelectedService(null);
      loadServices();
    } catch (err: any) {
      setError(err.message || 'Failed to reject service.');
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleTakedown = async () => {
    if (!selectedService || !actionReason.trim()) return;
    try {
      setSubmittingAction(true);
      const impact = await takedownAdminService(selectedService.id, actionReason);
      setSuccessMsg(`Service taken down. Warning: ${impact.upcoming_bookings_count} upcoming bookings remain valid.`);
      setTakedownModalOpen(false);
      setActionReason('');
      setSelectedService(null);
      loadServices();
    } catch (err: any) {
      setError(err.message || 'Failed to takedown service.');
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleRestore = async (service: AdminServiceItem) => {
    if (!window.confirm(`Restore service "${service.title}" back to published state?`)) return;
    try {
      await restoreAdminService(service.id);
      setSuccessMsg(`Service "${service.title}" restored to directory.`);
      loadServices();
    } catch (err: any) {
      setError(err.message || 'Failed to restore service.');
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName || !newCatSlug) return;
    try {
      await createAdminCategory({
        name: newCatName.trim(),
        slug: newCatSlug.toLowerCase().trim().replace(/[^a-z0-9-]/g, '-'),
        parent_id: newCatParent || null,
      });
      setNewCatName('');
      setNewCatSlug('');
      setNewCatParent('');
      setSuccessMsg('Category created.');
      loadCategories();
    } catch (err: any) {
      setError(err.message || 'Failed to create category.');
    }
  };

  return (
    <div>
      {/* Header and Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
        <div>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--color-navy-dark)', margin: 0 }}>
            Healthcare Catalog Moderation & Taxonomy
          </h2>
          <p style={{ fontSize: '0.86rem', color: '#64748b', margin: '4px 0 0' }}>
            Review provider service submissions, manage takedowns, and organize category taxonomy
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={openCategoriesModal}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              backgroundColor: 'rgba(190, 155, 73, 0.15)',
              border: '1px solid rgba(190, 155, 73, 0.4)',
              color: 'var(--color-gold-deep)',
              borderRadius: '8px',
              fontSize: '0.84rem',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            <FolderTree size={15} />
            Category Taxonomy
          </button>

          <button
            onClick={loadServices}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              backgroundColor: '#ffffff',
              border: '1px solid #cbd5e1',
              borderRadius: '8px',
              fontSize: '0.84rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div style={{ padding: '12px 16px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', color: '#b91c1c', marginBottom: '16px', fontSize: '0.88rem' }}>
          {error}
        </div>
      )}
      {successMsg && (
        <div style={{ padding: '12px 16px', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', color: '#15803d', marginBottom: '16px', fontSize: '0.88rem' }}>
          {successMsg}
        </div>
      )}

      {/* Search Bar */}
      <form
        onSubmit={(e) => { e.preventDefault(); setPage(1); loadServices(); }}
        style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '16px' }}
      >
        <input
          type="text"
          placeholder="Search services by title or provider..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ flex: 1, padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.84rem' }}
        />
        <button
          type="submit"
          style={{ padding: '8px 16px', backgroundColor: 'var(--color-navy-dark)', color: '#ffffff', border: 'none', borderRadius: '6px', fontWeight: 600, fontSize: '0.84rem', cursor: 'pointer' }}
        >
          Search
        </button>
      </form>

      {/* Status Filter Tabs */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
        {[
          { id: '', label: 'All Services' },
          { id: 'pending_review', label: 'Pending Review' },
          { id: 'published', label: 'Published' },
          { id: 'draft', label: 'Drafts' },
          { id: 'rejected', label: 'Rejected' },
          { id: 'suspended', label: 'Suspended / Taken Down' },
        ].map((tab) => {
          const isActive = statusFilter === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => { setStatusFilter(tab.id); setPage(1); }}
              style={{
                padding: '7px 14px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: isActive ? 'var(--color-navy-dark)' : '#f1f5f9',
                color: isActive ? '#ffffff' : '#475569',
                fontWeight: isActive ? 700 : 500,
                fontSize: '0.84rem',
                cursor: 'pointer',
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Services Table */}
      <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
          <thead>
            <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontWeight: 700 }}>
              <th style={{ padding: '14px 18px' }}>Service Offering</th>
              <th style={{ padding: '14px 18px' }}>Provider</th>
              <th style={{ padding: '14px 18px' }}>Price</th>
              <th style={{ padding: '14px 18px' }}>Duration</th>
              <th style={{ padding: '14px 18px' }}>Status</th>
              <th style={{ padding: '14px 18px', textAlign: 'right' }}>Moderation Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && services.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
                  Loading catalog items...
                </td>
              </tr>
            ) : services.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
                  No services found in this view.
                </td>
              </tr>
            ) : (
              services.map((s) => (
                <tr key={s.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '14px 18px' }}>
                    <div style={{ fontWeight: 700, color: 'var(--color-navy-dark)' }}>{s.title}</div>
                    <div style={{ color: '#64748b', fontSize: '0.8rem' }}>{s.category_name || 'General Health'}</div>
                  </td>
                  <td style={{ padding: '14px 18px', color: '#334155' }}>
                    {s.provider_name || 'Provider Account'}
                  </td>
                  <td style={{ padding: '14px 18px', fontWeight: 600, color: 'var(--color-navy-dark)' }}>
                    {s.price_amount ? `${Number(s.price_amount).toLocaleString()} ${s.currency}` : 'Free Consultation'}
                  </td>
                  <td style={{ padding: '14px 18px', color: '#64748b' }}>
                    {s.duration_minutes} min
                  </td>
                  <td style={{ padding: '14px 18px' }}>
                    <span
                      style={{
                        padding: '3px 8px',
                        borderRadius: '999px',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        backgroundColor:
                          s.status === 'published' ? '#dcfce7' :
                          s.status === 'pending_review' ? '#fef3c7' :
                          s.status === 'rejected' ? '#fee2e2' : '#f1f5f9',
                        color:
                          s.status === 'published' ? '#15803d' :
                          s.status === 'pending_review' ? '#b45309' :
                          s.status === 'rejected' ? '#b91c1c' : '#475569',
                      }}
                    >
                      {s.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                      {s.status === 'pending_review' && (
                        <>
                          <button
                            onClick={() => handleApprove(s)}
                            style={{ padding: '5px 12px', backgroundColor: '#dcfce7', border: '1px solid #86efac', color: '#15803d', borderRadius: '6px', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer' }}
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => { setSelectedService(s); setRejectModalOpen(true); }}
                            style={{ padding: '5px 12px', backgroundColor: '#fee2e2', border: '1px solid #fca5a5', color: '#b91c1c', borderRadius: '6px', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer' }}
                          >
                            Reject
                          </button>
                        </>
                      )}

                      {s.status === 'published' && (
                        <button
                          onClick={() => { setSelectedService(s); setUpcomingImpactCount(s.upcoming_bookings_count ?? 0); setTakedownModalOpen(true); }}
                          style={{ padding: '5px 12px', backgroundColor: '#fee2e2', border: '1px solid #fca5a5', color: '#b91c1c', borderRadius: '6px', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer' }}
                        >
                          Takedown
                        </button>
                      )}

                      {(s.status === 'suspended' || s.status === 'unpublished') && (
                        <button
                          onClick={() => handleRestore(s)}
                          style={{ padding: '5px 12px', backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '6px', fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer' }}
                        >
                          Restore
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', padding: '16px', borderTop: '1px solid #e2e8f0' }}>
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              style={{ padding: '6px 14px', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: page <= 1 ? '#f8fafc' : '#ffffff', cursor: page <= 1 ? 'not-allowed' : 'pointer', fontSize: '0.85rem' }}
            >
              Previous
            </button>
            <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
              Page {page} of {totalPages}
            </span>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              style={{ padding: '6px 14px', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: page >= totalPages ? '#f8fafc' : '#ffffff', cursor: page >= totalPages ? 'not-allowed' : 'pointer', fontSize: '0.85rem' }}
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Reject Modal */}
      {rejectModalOpen && selectedService && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', maxWidth: '450px', width: '100%', padding: '24px' }}>
            <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#b91c1c', margin: '0 0 10px' }}>
              Reject Service Submission
            </h4>
            <p style={{ fontSize: '0.84rem', color: '#64748b', margin: '0 0 14px' }}>
              Service: <strong>{selectedService.title}</strong>
            </p>
            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                Rejection Reason (Provided to Provider):
              </label>
              <textarea
                rows={3}
                required
                value={actionReason}
                onChange={(e) => setActionReason(e.target.value)}
                placeholder="Specify what needs correction or policy reason..."
                style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.84rem' }}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button
                type="button"
                onClick={() => setRejectModalOpen(false)}
                style={{ padding: '8px 14px', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submittingAction || !actionReason.trim()}
                onClick={handleReject}
                style={{ padding: '8px 16px', borderRadius: '6px', border: 'none', backgroundColor: '#b91c1c', color: '#ffffff', fontWeight: 700, cursor: 'pointer' }}
              >
                {submittingAction ? 'Rejecting...' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Takedown Modal with Upcoming Bookings Warning */}
      {takedownModalOpen && selectedService && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', maxWidth: '480px', width: '100%', padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
              <ShieldAlert size={20} color="#b91c1c" />
              <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#b91c1c', margin: 0 }}>
                Administrative Service Takedown
              </h4>
            </div>

            <div style={{ padding: '12px 14px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', marginBottom: '14px', fontSize: '0.84rem', color: '#991b1b' }}>
              <strong>Impact Notice:</strong> This service has <strong>{upcomingImpactCount ?? 0} upcoming confirmed bookings</strong>. Takedown unpublishes the service from search, but existing confirmed bookings remain valid unless explicitly cancelled.
            </div>

            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                Mandatory Takedown Justification:
              </label>
              <textarea
                rows={3}
                required
                value={actionReason}
                onChange={(e) => setActionReason(e.target.value)}
                placeholder="State administrative takedown justification..."
                style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.84rem' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button
                type="button"
                onClick={() => setTakedownModalOpen(false)}
                style={{ padding: '8px 14px', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submittingAction || !actionReason.trim()}
                onClick={handleTakedown}
                style={{ padding: '8px 16px', borderRadius: '6px', border: 'none', backgroundColor: '#b91c1c', color: '#ffffff', fontWeight: 700, cursor: 'pointer' }}
              >
                {submittingAction ? 'Processing...' : 'Confirm Takedown'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Category Taxonomy Modal */}
      {categoriesModalOpen && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ backgroundColor: '#ffffff', borderRadius: '14px', maxWidth: '650px', width: '100%', maxHeight: '90vh', overflowY: 'auto', padding: '28px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--color-navy-dark)', margin: 0 }}>
                Category Taxonomy Management
              </h3>
              <button
                onClick={() => setCategoriesModalOpen(false)}
                style={{ border: 'none', background: 'none', fontSize: '1.3rem', cursor: 'pointer', color: '#94a3b8' }}
              >
                ✕
              </button>
            </div>

            {/* Create Category Form */}
            <form onSubmit={handleCreateCategory} style={{ backgroundColor: '#f8fafc', padding: '16px', borderRadius: '10px', border: '1px solid #e2e8f0', marginBottom: '20px' }}>
              <h4 style={{ fontSize: '0.88rem', fontWeight: 700, margin: '0 0 10px', color: 'var(--color-navy-dark)' }}>
                Add New Healthcare Category
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '10px', marginBottom: '10px' }}>
                <input
                  type="text"
                  placeholder="Category Name (e.g. Cardiology)"
                  required
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  style={{ padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.84rem' }}
                />
                <input
                  type="text"
                  placeholder="Slug (e.g. cardiology)"
                  required
                  value={newCatSlug}
                  onChange={(e) => setNewCatSlug(e.target.value)}
                  style={{ padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.84rem' }}
                />
                <select
                  value={newCatParent}
                  onChange={(e) => setNewCatParent(e.target.value)}
                  style={{ padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.84rem', backgroundColor: '#ffffff' }}
                >
                  <option value="">Top-Level Category</option>
                  {categories.filter(c => !c.parent_id).map(c => (
                    <option key={c.id} value={c.id}>Subcategory of: {c.name}</option>
                  ))}
                </select>
              </div>
              <button
                type="submit"
                style={{ padding: '8px 16px', backgroundColor: 'var(--color-gold-deep)', color: '#ffffff', border: 'none', borderRadius: '6px', fontWeight: 700, fontSize: '0.84rem', cursor: 'pointer' }}
              >
                Create Category
              </button>
            </form>

            {/* Category List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {categoriesLoading ? (
                <div style={{ padding: '20px', textAlign: 'center', color: '#64748b' }}>Loading categories...</div>
              ) : (
                categories.map((c) => (
                  <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '0.86rem' }}>
                    <div>
                      <span style={{ fontWeight: 700, color: 'var(--color-navy-dark)' }}>{c.name}</span>
                      <span style={{ color: '#94a3b8', fontSize: '0.8rem', marginLeft: '8px' }}>/{c.slug}</span>
                      {c.parent_id && <span style={{ marginLeft: '8px', fontSize: '0.74rem', padding: '2px 6px', backgroundColor: '#f1f5f9', borderRadius: '4px', color: '#64748b' }}>Subcategory</span>}
                    </div>
                    <span style={{ fontSize: '0.78rem', color: c.is_active ? '#15803d' : '#94a3b8', fontWeight: 600 }}>
                      {c.is_active ? 'Active' : 'Archived'}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default ServicesTab;
