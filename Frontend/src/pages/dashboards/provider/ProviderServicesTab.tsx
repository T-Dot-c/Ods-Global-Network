/**
 * ProviderServicesTab.tsx — ODS Global Network (Batch 8)
 * Provider Dashboard Tab for Clinical Services Authoring & Management
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Stethoscope,
  Plus,
  Edit2,
  Archive,
  RefreshCw,
  X,
  AlertCircle
} from 'lucide-react';
import { Button } from '../../../components/common/Button';
import {
  serviceCatalogService,
  ServiceItem,
  ServiceCategoryItem,
  LocationType,
  ServiceStatus
} from '../../../services/serviceCatalogService';
import { ApprovalStatus } from '../../../context/AuthContext';

const STATUS_CONFIG: Record<
  ServiceStatus,
  { label: string; bg: string; color: string; border: string }
> = {
  draft: { label: 'Draft', bg: '#f1f5f9', color: '#475569', border: '#cbd5e1' },
  pending_review: { label: 'Pending Review', bg: '#fef3c7', color: '#92400e', border: '#fcd34d' },
  published: { label: 'Published', bg: '#d1fae5', color: '#065f46', border: '#6ee7b7' },
  unpublished: { label: 'Unpublished', bg: '#ede9fe', color: '#5b21b6', border: '#c4b5fd' },
  rejected: { label: 'Rejected', bg: '#fee2e2', color: '#991b1b', border: '#fca5a5' },
  taken_down: { label: 'Taken Down', bg: '#ffe4e6', color: '#9f1239', border: '#fda4af' },
  archived: { label: 'Archived', bg: '#f3f4f6', color: '#6b7280', border: '#d1d5db' },
  pending: { label: 'Pending Review', bg: '#fef3c7', color: '#92400e', border: '#fcd34d' },
  approved: { label: 'Published', bg: '#d1fae5', color: '#065f46', border: '#6ee7b7' },
};

interface ProviderServicesTabProps {
  approvalStatus?: ApprovalStatus;
}

export const ProviderServicesTab: React.FC<ProviderServicesTabProps> = ({ approvalStatus }) => {
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [categories, setCategories] = useState<ServiceCategoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter State
  const [statusFilter, setStatusFilter] = useState<string>('');

  // Add / Edit Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [modalSuccess, setModalSuccess] = useState<string | null>(null);

  // Form Fields
  const [title, setTitle] = useState('');
  const [shortDescription, setShortDescription] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [priceAmount, setPriceAmount] = useState('');
  const [durationMinutes, setDurationMinutes] = useState('45');
  const [capacity, setCapacity] = useState('1');
  const [leadTimeHours, setLeadTimeHours] = useState('24');
  const [locationType, setLocationType] = useState<LocationType>('on_site');
  const [city, setCity] = useState('Addis Ababa');
  const [area, setArea] = useState('Bole');
  const [cancellationNote, setCancellationNote] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  const fetchCategories = useCallback(async () => {
    try {
      const cats = await serviceCatalogService.getCategories();
      setCategories(cats);
    } catch (err) {
      console.error('Failed to load categories', err);
    }
  }, []);

  const fetchServices = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await serviceCatalogService.getMyServices(statusFilter || undefined);
      setServices(res.data);
    } catch (err: any) {
      setError(err.message || 'Failed to load services');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  const handleOpenCreate = () => {
    setEditingServiceId(null);
    setTitle('');
    setShortDescription('');
    setDescription('');
    setCategoryId('');
    setPriceAmount('');
    setDurationMinutes('45');
    setCapacity('1');
    setLeadTimeHours('24');
    setLocationType('on_site');
    setCity('Addis Ababa');
    setArea('Bole');
    setCancellationNote('');
    setImageUrl('');
    setModalError(null);
    setModalSuccess(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (svc: ServiceItem) => {
    setEditingServiceId(svc.id);
    setTitle(svc.title);
    setShortDescription(svc.short_description || '');
    setDescription(svc.description || '');
    setCategoryId(svc.category_id || '');
    setPriceAmount(String(svc.price_amount !== undefined ? svc.price_amount : svc.price || ''));
    setDurationMinutes(String(svc.duration_minutes || 45));
    setCapacity(String(svc.capacity || 1));
    setLeadTimeHours(String(svc.lead_time_hours || 24));
    setLocationType((svc.location_type as LocationType) || 'on_site');
    setCity(svc.city || 'Addis Ababa');
    setArea(svc.area || '');
    setCancellationNote(svc.cancellation_note || '');
    setImageUrl(svc.cover_image_url || svc.image_url || '');
    setModalError(null);
    setModalSuccess(null);
    setIsModalOpen(true);
  };

  const handleSaveService = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setModalError(null);
    setModalSuccess(null);

    if (!categoryId) {
      setModalError('Please select a category taxonomy.');
      setSaving(false);
      return;
    }

    const numPrice = Number(priceAmount);
    if (isNaN(numPrice) || numPrice <= 0) {
      setModalError('Price must be a valid number greater than zero');
      setSaving(false);
      return;
    }

    try {
      if (editingServiceId) {
        await serviceCatalogService.updateService(editingServiceId, {
          title,
          shortDescription,
          description,
          categoryId,
          priceAmount: numPrice,
          durationMinutes: parseInt(durationMinutes, 10) || 45,
          capacity: parseInt(capacity, 10) || 1,
          leadTimeHours: parseInt(leadTimeHours, 10) || 0,
          locationType,
          city,
          area,
          cancellationNote,
          imageUrl: imageUrl || undefined,
        });
        setModalSuccess('Clinical service offering updated successfully');
      } else {
        await serviceCatalogService.createService({
          title,
          shortDescription,
          description,
          categoryId,
          priceAmount: numPrice,
          currency: 'ETB',
          durationMinutes: parseInt(durationMinutes, 10) || 45,
          capacity: parseInt(capacity, 10) || 1,
          leadTimeHours: parseInt(leadTimeHours, 10) || 0,
          locationType,
          city,
          area,
          cancellationNote,
          imageUrl: imageUrl || undefined,
        });
        setModalSuccess('New service created as draft. You can now submit it for review.');
      }

      await fetchServices();
      setTimeout(() => {
        setIsModalOpen(false);
      }, 1200);
    } catch (err: any) {
      const msg = err.message || '';
      if (msg.includes('Failed to fetch') || msg.includes('NetworkError') || msg.toLowerCase().includes('network')) {
        setModalError("We couldn't reach the server. Please check your connection and try again.");
      } else {
        setModalError(msg || 'Failed to save service');
      }
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async (id: string) => {
    try {
      await serviceCatalogService.publishService(id);
      await fetchServices();
    } catch (err: any) {
      alert(err.message || 'Failed to submit service for review');
    }
  };

  const handleUnpublish = async (id: string) => {
    try {
      await serviceCatalogService.unpublishService(id);
      await fetchServices();
    } catch (err: any) {
      alert(err.message || 'Failed to unpublish service');
    }
  };

  const handleArchive = async (id: string, sTitle: string) => {
    if (!window.confirm(`Are you sure you want to decommission and archive "${sTitle}"?`)) {
      return;
    }
    try {
      await serviceCatalogService.archiveService(id);
      await fetchServices();
    } catch (err: any) {
      alert(err.message || 'Failed to archive service');
    }
  };

  // KPIs
  const totalCount = services.length;
  const publishedCount = services.filter((s) => s.status === 'published' || s.status === 'approved').length;
  const pendingCount = services.filter((s) => s.status === 'pending_review' || s.status === 'pending').length;
  const draftCount = services.filter((s) => s.status === 'draft').length;

  return (
    <div style={{ display: 'grid', gap: '28px' }}>
      {/* ── Header & Action ──────────────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--color-navy-dark)', margin: 0 }}>
            Clinical Services & Catalog Menu
          </h2>
          <p style={{ fontSize: '0.9rem', color: '#64748b', margin: '4px 0 0' }}>
            Author, price, and maintain your institution&apos;s healthcare and clinical service menu.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '12px 20px',
            borderRadius: '10px',
            backgroundColor: 'var(--color-navy-mid)',
            color: '#ffffff',
            border: 'none',
            fontWeight: 700,
            fontSize: '0.92rem',
            cursor: 'pointer',
            boxShadow: '0 4px 14px rgba(15, 40, 91, 0.25)',
            transition: 'all 0.2s ease',
          }}
        >
          <Plus size={18} color="var(--color-gold-bright)" />
          <span>Add New Service</span>
        </button>
      </div>

      {/* ── Metric Highlights ────────────────────────────────────── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
        }}
      >
        <div
          style={{
            backgroundColor: '#ffffff',
            padding: '18px 20px',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          }}
        >
          <span style={{ fontSize: '0.82rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>
            Total Services
          </span>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--color-navy-dark)', marginTop: '4px' }}>
            {totalCount}
          </div>
        </div>

        <div
          style={{
            backgroundColor: '#ffffff',
            padding: '18px 20px',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          }}
        >
          <span style={{ fontSize: '0.82rem', color: '#065f46', fontWeight: 600, textTransform: 'uppercase' }}>
            Active / Published
          </span>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#059669', marginTop: '4px' }}>
            {publishedCount}
          </div>
        </div>

        <div
          style={{
            backgroundColor: '#ffffff',
            padding: '18px 20px',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          }}
        >
          <span style={{ fontSize: '0.82rem', color: '#92400e', fontWeight: 600, textTransform: 'uppercase' }}>
            Under Review
          </span>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#d97706', marginTop: '4px' }}>
            {pendingCount}
          </div>
        </div>

        <div
          style={{
            backgroundColor: '#ffffff',
            padding: '18px 20px',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          }}
        >
          <span style={{ fontSize: '0.82rem', color: '#475569', fontWeight: 600, textTransform: 'uppercase' }}>
            Drafts
          </span>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#64748b', marginTop: '4px' }}>
            {draftCount}
          </div>
        </div>
      </div>

      {/* ── Filter Bar ───────────────────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          backgroundColor: '#ffffff',
          padding: '14px 18px',
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '0.88rem', color: '#475569', fontWeight: 600 }}>Filter by Lifecycle:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              padding: '6px 12px',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              backgroundColor: '#f8fafc',
              fontSize: '0.88rem',
              color: '#334155',
              cursor: 'pointer',
            }}
          >
            <option value="">All Statuses ({totalCount})</option>
            <option value="draft">Draft</option>
            <option value="pending_review">Pending Review</option>
            <option value="published">Published</option>
            <option value="unpublished">Unpublished</option>
            <option value="rejected">Rejected</option>
            <option value="taken_down">Taken Down</option>
            <option value="archived">Archived</option>
          </select>
        </div>

        <button
          onClick={fetchServices}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 12px',
            borderRadius: '8px',
            border: '1px solid #e2e8f0',
            backgroundColor: '#ffffff',
            color: '#64748b',
            fontSize: '0.85rem',
            cursor: 'pointer',
          }}
        >
          <RefreshCw size={14} />
          <span>Refresh</span>
        </button>
      </div>

      {/* ── KYC Notice for Pending Review ────────────────────────── */}
      {approvalStatus && approvalStatus !== 'approved' && (
        <div
          style={{
            padding: '14px 18px',
            borderRadius: '10px',
            backgroundColor: '#f8fafc',
            border: '1px solid #cbd5e1',
            color: '#475569',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            fontSize: '0.88rem',
            lineHeight: 1.5,
          }}
        >
          <AlertCircle size={20} color="#64748b" style={{ flexShrink: 0 }} />
          <div>
            <strong>KYC Notice:</strong> You can create and save draft clinical offerings right now. Submitting offerings for public catalog review will be enabled once your healthcare provider accreditation is approved by medical compliance officers.
          </div>
        </div>
      )}

      {/* ── Services Table ───────────────────────────────────────── */}
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          overflow: 'hidden',
        }}
      >
        {loading ? (
          <div style={{ padding: '60px 20px', textAlign: 'center', color: '#64748b' }}>
            <RefreshCw size={24} style={{ animation: 'spin 1s linear infinite', margin: '0 auto 12px' }} />
            <p style={{ margin: 0, fontSize: '0.92rem' }}>Loading clinical services...</p>
          </div>
        ) : error ? (
          <div style={{ padding: '40px 20px', textAlign: 'center', color: '#b91c1c' }}>
            <AlertCircle size={28} style={{ margin: '0 auto 8px' }} />
            <p style={{ margin: 0, fontWeight: 600 }}>{error}</p>
          </div>
        ) : services.length === 0 ? (
          <div style={{ padding: '60px 20px', textAlign: 'center', color: '#64748b' }}>
            <Stethoscope size={36} color="#94a3b8" style={{ margin: '0 auto 12px' }} />
            <h4 style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--color-navy-dark)', margin: 0 }}>
              No clinical services found
            </h4>
            <p style={{ fontSize: '0.88rem', margin: '6px 0 16px' }}>
              Create your first clinical service to list it on the public ODS Global Network directory.
            </p>
            <Button variant="gold" onClick={handleOpenCreate}>
              <Plus size={16} /> Add Service
            </Button>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#64748b' }}>
                  <th style={{ padding: '14px 18px', fontWeight: 600 }}>Service Offering</th>
                  <th style={{ padding: '14px 18px', fontWeight: 600 }}>Category</th>
                  <th style={{ padding: '14px 18px', fontWeight: 600 }}>Fee (ETB)</th>
                  <th style={{ padding: '14px 18px', fontWeight: 600 }}>Location Mode</th>
                  <th style={{ padding: '14px 18px', fontWeight: 600 }}>Lifecycle Status</th>
                  <th style={{ padding: '14px 18px', fontWeight: 600, textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {services.map((svc) => {
                  const statusConf = STATUS_CONFIG[svc.status] || STATUS_CONFIG.draft;
                  const priceVal = svc.price_amount !== undefined ? svc.price_amount : svc.price;

                  return (
                    <tr
                      key={svc.id}
                      style={{
                        borderBottom: '1px solid #f1f5f9',
                        transition: 'background-color 0.15s ease',
                      }}
                    >
                      <td style={{ padding: '16px 18px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          {svc.cover_image_url || svc.image_url ? (
                            <img
                              src={svc.cover_image_url || svc.image_url}
                              alt={svc.title}
                              style={{ width: '48px', height: '48px', borderRadius: '8px', objectFit: 'cover' }}
                            />
                          ) : (
                            <div
                              style={{
                                width: '48px',
                                height: '48px',
                                borderRadius: '8px',
                                backgroundColor: '#f1f5f9',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#94a3b8',
                              }}
                            >
                              <Stethoscope size={20} />
                            </div>
                          )}
                          <div>
                            <div style={{ fontWeight: 700, color: 'var(--color-navy-dark)' }}>{svc.title}</div>
                            <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '2px' }}>
                              slug: {svc.slug}
                            </div>
                            {svc.rejection_reason && svc.status === 'rejected' && (
                              <div
                                style={{
                                  fontSize: '0.78rem',
                                  color: '#dc2626',
                                  marginTop: '4px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                }}
                              >
                                <AlertCircle size={12} /> Reason: {svc.rejection_reason}
                              </div>
                            )}
                            {svc.takedown_reason && svc.status === 'taken_down' && (
                              <div
                                style={{
                                  fontSize: '0.78rem',
                                  color: '#e11d48',
                                  marginTop: '4px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                }}
                              >
                                <AlertCircle size={12} /> Takedown: {svc.takedown_reason}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '16px 18px', color: '#475569' }}>
                        {svc.category_name || svc.category || 'Clinical Care'}
                      </td>
                      <td style={{ padding: '16px 18px' }}>
                        <div style={{ fontWeight: 700, color: 'var(--color-navy-dark)' }}>
                          {Number(priceVal).toLocaleString('en-US', { minimumFractionDigits: 2 })} ETB
                        </div>
                      </td>
                      <td style={{ padding: '16px 18px', color: '#475569' }}>
                        <span
                          style={{
                            display: 'inline-block',
                            padding: '3px 8px',
                            borderRadius: '6px',
                            backgroundColor: '#f1f5f9',
                            fontSize: '0.8rem',
                            fontWeight: 600,
                          }}
                        >
                          {(svc.location_type || svc.delivery_type || 'on_site').replace('_', ' ')}
                        </span>
                      </td>
                      <td style={{ padding: '16px 18px' }}>
                        <span
                          style={{
                            display: 'inline-block',
                            padding: '4px 10px',
                            borderRadius: '12px',
                            backgroundColor: statusConf.bg,
                            color: statusConf.color,
                            border: `1px solid ${statusConf.border}`,
                            fontSize: '0.8rem',
                            fontWeight: 700,
                          }}
                        >
                          {statusConf.label}
                        </span>
                      </td>
                      <td style={{ padding: '16px 18px', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                          {/* Publish / Submit for review button */}
                          {(svc.status === 'draft' || svc.status === 'unpublished' || svc.status === 'rejected') && (
                            <button
                              onClick={() => {
                                if (approvalStatus && approvalStatus !== 'approved') {
                                  alert(
                                    approvalStatus === 'pending'
                                      ? 'Your healthcare provider account KYC is currently pending review. Only approved providers can publish services.'
                                      : 'Your provider accreditation was rejected. Please re-upload KYC documents before submitting services.'
                                  );
                                  return;
                                }
                                handlePublish(svc.id);
                              }}
                              disabled={approvalStatus !== undefined && approvalStatus !== 'approved'}
                              title={
                                approvalStatus && approvalStatus !== 'approved'
                                  ? 'Account accreditation required before submitting offerings for public review'
                                  : svc.status === 'unpublished'
                                  ? 'Republish'
                                  : 'Submit for Review'
                              }
                              style={{
                                padding: '6px 10px',
                                borderRadius: '6px',
                                backgroundColor: approvalStatus && approvalStatus !== 'approved' ? '#f1f5f9' : '#d1fae5',
                                color: approvalStatus && approvalStatus !== 'approved' ? '#94a3b8' : '#065f46',
                                border: `1px solid ${approvalStatus && approvalStatus !== 'approved' ? '#e2e8f0' : '#6ee7b7'}`,
                                cursor: approvalStatus && approvalStatus !== 'approved' ? 'not-allowed' : 'pointer',
                                fontSize: '0.78rem',
                                fontWeight: 700,
                                opacity: approvalStatus && approvalStatus !== 'approved' ? 0.7 : 1,
                              }}
                            >
                              {svc.status === 'unpublished' ? 'Republish' : 'Submit'}
                            </button>
                          )}

                          {/* Unpublish button */}
                          {svc.status === 'published' && (
                            <button
                              onClick={() => handleUnpublish(svc.id)}
                              title="Unpublish from catalog"
                              style={{
                                padding: '6px 10px',
                                borderRadius: '6px',
                                backgroundColor: '#ede9fe',
                                color: '#5b21b6',
                                border: '1px solid #c4b5fd',
                                cursor: 'pointer',
                                fontSize: '0.78rem',
                                fontWeight: 700,
                              }}
                            >
                              Unpublish
                            </button>
                          )}

                          {/* Edit button */}
                          {svc.status !== 'archived' && (
                            <button
                              onClick={() => handleOpenEdit(svc)}
                              title="Edit service details"
                              style={{
                                padding: '6px',
                                borderRadius: '6px',
                                backgroundColor: '#f8fafc',
                                border: '1px solid #cbd5e1',
                                color: '#475569',
                                cursor: 'pointer',
                              }}
                            >
                              <Edit2 size={14} />
                            </button>
                          )}

                          {/* Archive button */}
                          {svc.status !== 'archived' && (
                            <button
                              onClick={() => handleArchive(svc.id, svc.title)}
                              title="Archive service"
                              style={{
                                padding: '6px',
                                borderRadius: '6px',
                                backgroundColor: '#fff1f2',
                                border: '1px solid #fecdd3',
                                color: '#be123c',
                                cursor: 'pointer',
                              }}
                            >
                              <Archive size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Add / Edit Modal ─────────────────────────────────────── */}
      {isModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(8, 23, 56, 0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px',
          }}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '16px',
              width: '100%',
              maxWidth: '680px',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
              padding: '28px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-navy-dark)', margin: 0 }}>
                {editingServiceId ? 'Edit Clinical Service Offering' : 'Create New Clinical Service'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#64748b',
                  cursor: 'pointer',
                  padding: '4px',
                }}
              >
                <X size={20} />
              </button>
            </div>

            {modalError && (
              <div
                style={{
                  backgroundColor: '#fef2f2',
                  border: '1px solid #f87171',
                  color: '#b91c1c',
                  padding: '12px 14px',
                  borderRadius: '8px',
                  fontSize: '0.88rem',
                  marginBottom: '16px',
                }}
              >
                {modalError}
              </div>
            )}

            {modalSuccess && (
              <div
                style={{
                  backgroundColor: '#ecfdf5',
                  border: '1px solid #34d399',
                  color: '#065f46',
                  padding: '12px 14px',
                  borderRadius: '8px',
                  fontSize: '0.88rem',
                  marginBottom: '16px',
                }}
              >
                {modalSuccess}
              </div>
            )}

            <form onSubmit={handleSaveService} style={{ display: 'grid', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                  Clinical Service Title *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Comprehensive Cardiology Diagnostic Assessment"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.92rem',
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                    Category Taxonomy *
                  </label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.92rem',
                    }}
                  >
                    <option value="" disabled>
                      Select a category...
                    </option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                    Location Modality *
                  </label>
                  <select
                    value={locationType}
                    onChange={(e) => setLocationType(e.target.value as LocationType)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.92rem',
                    }}
                  >
                    <option value="on_site">On-Site (At Clinic/Hospital)</option>
                    <option value="at_customer">At Patient Location (Home Visit)</option>
                    <option value="online">Online / Telehealth Consultation</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                  Short Summary (Search Facet Preview)
                </label>
                <input
                  type="text"
                  maxLength={300}
                  value={shortDescription}
                  onChange={(e) => setShortDescription(e.target.value)}
                  placeholder="One sentence highlighting key clinical procedure or care scope (max 300 characters)"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.92rem',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                  Detailed Clinical Description
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Comprehensive diagnostic guidelines, required preparations, physician credentials, and inclusions..."
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.92rem',
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                    Consultation Fee (ETB) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    required
                    value={priceAmount}
                    onChange={(e) => setPriceAmount(e.target.value)}
                    placeholder="1500.00"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.92rem',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                    Duration (Minutes)
                  </label>
                  <input
                    type="number"
                    min="5"
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.92rem',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                    Patient Capacity
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={capacity}
                    onChange={(e) => setCapacity(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.92rem',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                    Lead Time (Hours notice)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={leadTimeHours}
                    onChange={(e) => setLeadTimeHours(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.92rem',
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                  Cover Image URL
                </label>
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/... or uploaded document URL"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.92rem',
                  }}
                />
                {imageUrl && (
                  <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <img
                      src={imageUrl}
                      alt="Cover Preview"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                        const fb = (e.target as HTMLElement).nextElementSibling as HTMLElement;
                        if (fb) fb.style.display = 'inline-block';
                      }}
                      onLoad={(e) => {
                        (e.target as HTMLImageElement).style.display = 'block';
                        const fb = (e.target as HTMLElement).nextElementSibling as HTMLElement;
                        if (fb) fb.style.display = 'none';
                      }}
                      style={{
                        width: '80px',
                        height: '56px',
                        borderRadius: '6px',
                        objectFit: 'cover',
                        border: '1px solid #e2e8f0',
                      }}
                    />
                    <span style={{ fontSize: '0.8rem', color: '#dc2626', display: 'none' }}>
                      Unable to preview image from URL (image will still be saved).
                    </span>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
                <Button variant="outline-gold" type="button" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </Button>
                <Button variant="gold" type="submit" disabled={saving}>
                  {saving ? 'Saving...' : editingServiceId ? 'Update Service' : 'Create Draft Service'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
