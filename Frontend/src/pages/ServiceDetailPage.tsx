/**
 * ServiceDetailPage.tsx — ODS Global Network (Batch 8)
 * Dedicated Single Healthcare Service Landing & Booking Portal
 */

import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  MapPin,
  Clock,
  ShieldCheck,
  Star,
  Gift,
  Calendar,
  Phone,
  Building2,
  Stethoscope,
  Pill,
  Activity,
  HeartPulse,
  Truck,
  UserCheck,
  Award,
  BarChart3,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { Button } from '../components/common/Button';
import {
  serviceCatalogService,
  ServiceDetailItem
} from '../services/serviceCatalogService';
import { useAuth } from '../context/AuthContext';

interface ServiceDetailPageProps {
  serviceIdOrSlug: string;
  onNavigate: (view: string) => void;
}

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  hospital: <Building2 size={18} />,
  clinic: <Stethoscope size={18} />,
  pharmacy: <Pill size={18} />,
  laboratory: <Activity size={18} />,
  wellness_center: <HeartPulse size={18} />,
  ambulance: <Truck size={18} />,
  home_care: <UserCheck size={18} />,
  specialist: <Award size={18} />,
  diagnostic_center: <BarChart3 size={18} />
};

export const ServiceDetailPage: React.FC<ServiceDetailPageProps> = ({
  serviceIdOrSlug,
  onNavigate
}) => {
  const { user } = useAuth();
  const [service, setService] = useState<ServiceDetailItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Review Submission State
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState<string | null>(null);
  const [reviewError, setReviewError] = useState<string | null>(null);

  // Booking Modal State (Batch 8 teaser -> Batch 9 full booking)
  const [bookingModalOpen, setBookingModalOpen] = useState(false);

  useEffect(() => {
    setLoading(true);
    serviceCatalogService
      .getServiceDetails(serviceIdOrSlug)
      .then((data) => {
        setService(data);
        document.title = `${data.title} | ODS Global Network`;
      })
      .catch((err) => {
        setError(err.message || 'Service not found');
      })
      .finally(() => setLoading(false));
  }, [serviceIdOrSlug]);

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!service) return;
    setSubmittingReview(true);
    setReviewError(null);
    setReviewSuccess(null);

    try {
      await serviceCatalogService.submitReview(service.id, {
        rating: reviewRating,
        reviewText
      });
      setReviewSuccess('Thank you! Your verified review has been posted.');
      setReviewText('');

      // Refresh service details with new review
      const updated = await serviceCatalogService.getServiceDetails(service.id);
      setService(updated);
    } catch (err: any) {
      setReviewError(err.message || 'Failed to submit review');
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleGiftClick = () => {
    onNavigate('gift/claim');
  };

  if (loading) {
    return (
      <div style={{ backgroundColor: '#081738', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#EDC45B', fontSize: '1.1rem' }}>Loading service details...</p>
      </div>
    );
  }

  if (error || !service) {
    return (
      <div style={{ backgroundColor: '#081738', minHeight: '100vh', padding: '60px 20px', textAlign: 'center' }}>
        <div style={{ maxWidth: '600px', margin: '0 auto', backgroundColor: '#0F285B', padding: '40px', borderRadius: '16px' }}>
          <AlertCircle size={48} style={{ color: '#ef4444', margin: '0 auto 16px' }} />
          <h2 style={{ color: '#ffffff', marginBottom: '12px' }}>Service Unavailable</h2>
          <p style={{ color: '#cbd5e1', marginBottom: '24px' }}>{error || 'The requested service offering could not be loaded.'}</p>
          <Button variant="gold" onClick={() => onNavigate('services')}>
            Back to Services Catalog
          </Button>
        </div>
      </div>
    );
  }

  const categoryStr = service.category_name || service.category || 'Clinical Care';
  const categoryIcon = CATEGORY_ICONS[service.category_slug || service.category || ''] || <Activity size={18} />;
  const discount = Number(service.discount_percentage) || 0;
  const price = Number(service.price_amount !== undefined ? service.price_amount : service.price || 0);
  const effectivePrice = Number(service.effective_price || price);
  const rating = Number(service.avg_rating) || 0;

  return (
    <div style={{ backgroundColor: '#081738', minHeight: '100vh', color: '#ffffff' }}>
      {/* ── Breadcrumb Bar ────────────────────────────────────────── */}
      <div
        style={{
          backgroundColor: '#0c1e47',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          padding: '14px 20px'
        }}
      >
        <div
          style={{
            maxWidth: '1280px',
            margin: '0 auto',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '0.86rem',
            color: '#94a3b8'
          }}
        >
          <button
            onClick={() => onNavigate('services')}
            style={{
              background: 'none',
              border: 'none',
              color: '#EDC45B',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: 0,
              fontSize: '0.86rem',
              fontWeight: 600
            }}
          >
            <ArrowLeft size={16} />
            <span>Catalog</span>
          </button>
          <span>/</span>
          <span style={{ textTransform: 'capitalize' }}>{categoryStr}</span>
          <span>/</span>
          <span style={{ color: '#ffffff', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {service.title}
          </span>
        </div>
      </div>

      {/* ── Main Two-Column Layout ───────────────────────────────── */}
      <main style={{ maxWidth: '1280px', margin: '0 auto', padding: '40px 20px 80px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '40px' }} className="detail-grid">
          <style>{`
            @media (min-width: 900px) {
              .detail-grid {
                grid-template-columns: 1.8fr 1.2fr !important;
              }
            }
          `}</style>

          {/* ── Left Column: Service Overview, Description & Reviews ── */}
          <div>
            {/* Category & Status Tags */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '16px' }}>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 14px',
                  borderRadius: '9999px',
                  backgroundColor: 'rgba(190, 155, 73, 0.15)',
                  border: '1px solid rgba(190, 155, 73, 0.35)',
                  color: '#EDC45B',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  textTransform: 'capitalize'
                }}
              >
                {categoryIcon}
                <span>{categoryStr}</span>
              </span>

              <span
                style={{
                  padding: '6px 14px',
                  borderRadius: '9999px',
                  backgroundColor: 'rgba(255, 255, 255, 0.08)',
                  color: '#cbd5e1',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  textTransform: 'capitalize'
                }}
              >
                {(service.location_type || service.delivery_type || 'on_site').replace('_', ' ')}
              </span>

              {discount > 0 && (
                <span
                  style={{
                    padding: '6px 12px',
                    borderRadius: '9999px',
                    backgroundColor: 'rgba(16, 185, 129, 0.2)',
                    color: '#34d399',
                    fontSize: '0.82rem',
                    fontWeight: 700
                  }}
                >
                  {discount}% OFF
                </span>
              )}
            </div>

            {/* Title */}
            <h1
              style={{
                fontSize: 'clamp(1.8rem, 3.2vw, 2.6rem)',
                fontWeight: 700,
                lineHeight: 1.25,
                color: '#ffffff',
                marginBottom: '16px'
              }}
            >
              {service.title}
            </h1>

            {/* Provider and Location Meta */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '20px',
                fontSize: '0.92rem',
                color: '#cbd5e1',
                paddingBottom: '24px',
                borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                marginBottom: '28px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <ShieldCheck size={18} style={{ color: '#10b981' }} />
                <strong>{service.provider_name}</strong>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <MapPin size={16} style={{ color: '#BE9B49' }} />
                <span>{service.city || 'Addis Ababa'}</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Clock size={16} style={{ color: '#BE9B49' }} />
                <span>{service.duration_minutes} minutes appointment</span>
              </div>

              {rating > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#EDC45B', fontWeight: 700 }}>
                  <Star size={16} fill="#EDC45B" stroke="none" />
                  <span>{rating.toFixed(1)}</span>
                  <span style={{ color: '#94a3b8', fontWeight: 500 }}>({service.review_count} verified reviews)</span>
                </div>
              )}
            </div>

            {/* Full Service Description */}
            <section style={{ marginBottom: '40px' }}>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 700, color: '#EDC45B', marginBottom: '14px' }}>
                About This Medical Service
              </h2>
              <div
                style={{
                  fontSize: '1rem',
                  lineHeight: 1.7,
                  color: '#cbd5e1',
                  whiteSpace: 'pre-line'
                }}
              >
                {service.description ||
                  'This service is provided by accredited practitioners utilizing standard diagnostic guidelines, clinical equipment, and patient care standards.'}
              </div>
            </section>

            {/* What's Included */}
            <section
              style={{
                backgroundColor: '#0F285B',
                borderRadius: '16px',
                padding: '24px',
                border: '1px solid rgba(190, 155, 73, 0.25)',
                marginBottom: '40px'
              }}
            >
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#ffffff', marginBottom: '16px' }}>
                Service Inclusions & Clinical Standards
              </h3>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: '12px' }}>
                {[
                  'Initial clinical consultation and patient triage',
                  `Delivery modality: ${(service.location_type || service.delivery_type || 'on_site').replace('_', ' ')} with licensed personnel`,
                  `Full duration: ${service.duration_minutes} minutes dedicated care`,
                  'Official digital receipt and clinical record for insurance / personal file',
                  'Option to purchase as a digital gift voucher for family or friends'
                ].map((item, i) => (
                  <li key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.92rem', color: '#cbd5e1' }}>
                    <CheckCircle2 size={16} style={{ color: '#10b981', flexShrink: 0 }} />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </section>

            {/* ── Verified Customer Reviews Section ────────────────── */}
            <section
              style={{
                borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                paddingTop: '32px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
                <div>
                  <h2 style={{ fontSize: '1.3rem', fontWeight: 700, color: '#ffffff' }}>
                    Customer Reviews & Ratings
                  </h2>
                  <span style={{ fontSize: '0.9rem', color: '#94a3b8' }}>
                    {service.review_count || 0} verified customer evaluations
                  </span>
                </div>

                {rating > 0 && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      backgroundColor: 'rgba(190, 155, 73, 0.15)',
                      padding: '8px 16px',
                      borderRadius: '12px',
                      border: '1px solid rgba(190, 155, 73, 0.3)'
                    }}
                  >
                    <Star size={20} fill="#EDC45B" stroke="none" />
                    <span style={{ fontSize: '1.3rem', fontWeight: 800, color: '#EDC45B' }}>
                      {rating.toFixed(1)}
                    </span>
                    <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>/ 5.0</span>
                  </div>
                )}
              </div>

              {/* Review Form for logged-in customers */}
              {user?.role === 'customer' ? (
                <form
                  onSubmit={handleReviewSubmit}
                  style={{
                    backgroundColor: '#0F285B',
                    borderRadius: '16px',
                    padding: '24px',
                    border: '1px solid rgba(190, 155, 73, 0.3)',
                    marginBottom: '32px'
                  }}
                >
                  <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#EDC45B', marginBottom: '12px' }}>
                    Share Your Feedback
                  </h4>

                  {/* Rating Selector */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                    <span style={{ fontSize: '0.88rem', color: '#cbd5e1', marginRight: '6px' }}>Rating:</span>
                    {[1, 2, 3, 4, 5].map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setReviewRating(s)}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          padding: '2px'
                        }}
                      >
                        <Star
                          size={24}
                          fill={s <= reviewRating ? '#EDC45B' : 'transparent'}
                          stroke={s <= reviewRating ? '#EDC45B' : '#94a3b8'}
                        />
                      </button>
                    ))}
                    <span style={{ fontSize: '0.88rem', fontWeight: 600, color: '#EDC45B', marginLeft: '6px' }}>
                      {reviewRating} out of 5 stars
                    </span>
                  </div>

                  {/* Review Text */}
                  <textarea
                    rows={3}
                    value={reviewText}
                    onChange={(e) => setReviewText(e.target.value)}
                    placeholder="Write details of your experience with this provider and care service..."
                    style={{
                      width: '100%',
                      backgroundColor: '#081738',
                      color: '#ffffff',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      borderRadius: '8px',
                      padding: '12px',
                      fontSize: '0.92rem',
                      outline: 'none',
                      marginBottom: '16px'
                    }}
                  />

                  {reviewSuccess && (
                    <div style={{ color: '#10b981', fontSize: '0.88rem', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <CheckCircle2 size={16} />
                      <span>{reviewSuccess}</span>
                    </div>
                  )}

                  {reviewError && (
                    <div style={{ color: '#ef4444', fontSize: '0.88rem', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <AlertCircle size={16} />
                      <span>{reviewError}</span>
                    </div>
                  )}

                  <Button variant="gold" type="submit" disabled={submittingReview}>
                    {submittingReview ? 'Posting Review...' : 'Submit Verified Review'}
                  </Button>
                </form>
              ) : !user ? (
                <div
                  style={{
                    backgroundColor: 'rgba(15, 40, 91, 0.4)',
                    padding: '16px 20px',
                    borderRadius: '12px',
                    border: '1px dashed rgba(255, 255, 255, 0.15)',
                    marginBottom: '28px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '12px'
                  }}
                >
                  <span style={{ fontSize: '0.88rem', color: '#cbd5e1' }}>
                    Have you used this service? Sign in to submit a verified rating and review.
                  </span>
                  <Button variant="outline-gold" onClick={() => onNavigate('login')}>
                    Sign In to Review
                  </Button>
                </div>
              ) : null}

              {/* Reviews List */}
              {service.recentReviews && service.recentReviews.length > 0 ? (
                <div style={{ display: 'grid', gap: '16px' }}>
                  {service.recentReviews.map((rev) => (
                    <div
                      key={rev.id}
                      style={{
                        backgroundColor: '#0F285B',
                        borderRadius: '12px',
                        padding: '16px 20px',
                        border: '1px solid rgba(255, 255, 255, 0.08)'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <div
                            style={{
                              width: '28px',
                              height: '28px',
                              borderRadius: '9999px',
                              backgroundColor: '#BE9B49',
                              color: '#081738',
                              fontWeight: 700,
                              fontSize: '0.82rem',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                          >
                            {(rev.first_name || 'C')[0]}
                          </div>
                          <span style={{ fontWeight: 600, color: '#ffffff', fontSize: '0.92rem' }}>
                            {rev.first_name} {rev.last_initial}.
                          </span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                              key={s}
                              size={14}
                              fill={s <= rev.rating ? '#EDC45B' : 'transparent'}
                              stroke={s <= rev.rating ? '#EDC45B' : '#94a3b8'}
                            />
                          ))}
                        </div>
                      </div>

                      {rev.review_text && (
                        <p style={{ fontSize: '0.88rem', color: '#cbd5e1', lineHeight: 1.5, margin: 0 }}>
                          {rev.review_text}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ color: '#94a3b8', fontSize: '0.92rem' }}>
                  No customer reviews have been submitted for this service yet. Be the first to review!
                </p>
              )}
            </section>
          </div>

          {/* ── Right Column: Sticky Pricing & Action Card ───────────── */}
          <div>
            <div
              style={{
                backgroundColor: '#0F285B',
                borderRadius: '20px',
                border: '1px solid rgba(190, 155, 73, 0.4)',
                padding: '32px',
                boxShadow: '0 12px 36px rgba(0, 0, 0, 0.35)',
                position: 'sticky',
                top: '24px'
              }}
            >
              {/* Pricing Display */}
              <div style={{ marginBottom: '24px' }}>
                <span style={{ fontSize: '0.85rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                  Standard Institutional Rate
                </span>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px' }}>
                  <span style={{ fontSize: '2.4rem', fontWeight: 800, color: '#EDC45B' }}>
                    {effectivePrice.toLocaleString()}
                  </span>
                  <span style={{ fontSize: '1.1rem', fontWeight: 700, color: '#ffffff' }}>
                    {service.currency || 'ETB'}
                  </span>
                  {discount > 0 && (
                    <span style={{ fontSize: '1rem', color: '#94a3b8', textDecoration: 'line-through' }}>
                      {price.toLocaleString()} ETB
                    </span>
                  )}
                </div>
              </div>

              {/* Primary Actions */}
              <div style={{ display: 'grid', gap: '12px', marginBottom: '28px' }}>
                <Button
                  variant="gold"
                  onClick={() => setBookingModalOpen(true)}
                  style={{ width: '100%', padding: '14px', fontSize: '1rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}
                >
                  <Calendar size={18} />
                  <span>Book Appointment</span>
                </Button>

                <Button
                  variant="outline-gold"
                  onClick={handleGiftClick}
                  style={{ width: '100%', padding: '14px', fontSize: '1rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}
                >
                  <Gift size={18} />
                  <span>Gift This Service</span>
                </Button>
              </div>

              {/* Provider Info Card */}
              <div
                style={{
                  borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                  paddingTop: '24px',
                  display: 'grid',
                  gap: '14px'
                }}
              >
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#EDC45B', margin: 0 }}>
                  Service Provider Information
                </h4>

                <div style={{ fontSize: '0.92rem', color: '#ffffff', fontWeight: 600 }}>
                  {service.provider_name}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.88rem', color: '#cbd5e1' }}>
                  <MapPin size={15} style={{ color: '#BE9B49', flexShrink: 0 }} />
                  <span>{service.address_line ? `${service.address_line}, ${service.city || 'Addis Ababa'}` : `${service.area ? `${service.area}, ` : ''}${service.city || 'Addis Ababa'}, Ethiopia`}</span>
                </div>

                {service.official_phone && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.88rem', color: '#cbd5e1' }}>
                    <Phone size={15} style={{ color: '#BE9B49', flexShrink: 0 }} />
                    <a href={`tel:${service.official_phone}`} style={{ color: '#EDC45B', textDecoration: 'none' }}>
                      {service.official_phone}
                    </a>
                  </div>
                )}

                {service.operating_hours && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.88rem', color: '#cbd5e1' }}>
                    <Clock size={15} style={{ color: '#BE9B49', flexShrink: 0 }} />
                    <span>{service.operating_hours}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* ── Booking Inquiry Modal ─────────────────────────────────── */}
      {bookingModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 999,
            padding: '20px'
          }}
        >
          <div
            style={{
              backgroundColor: '#0F285B',
              borderRadius: '20px',
              border: '1px solid rgba(190, 155, 73, 0.4)',
              padding: '32px',
              maxWidth: '500px',
              width: '100%',
              textAlign: 'center'
            }}
          >
            <Calendar size={48} style={{ color: '#EDC45B', margin: '0 auto 16px' }} />
            <h3 style={{ fontSize: '1.4rem', color: '#ffffff', marginBottom: '8px' }}>
              Book {service.title}
            </h3>
            <p style={{ color: '#cbd5e1', fontSize: '0.92rem', lineHeight: 1.6, marginBottom: '24px' }}>
              Direct calendar scheduling is being connected for Batch 9! To book this consultation immediately, call{' '}
              <strong style={{ color: '#EDC45B' }}>{service.official_phone || '+251 960 606 042'}</strong> or gift this service voucher directly.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <Button variant="outline-gold" onClick={() => setBookingModalOpen(false)}>
                Close
              </Button>
              {service.official_phone && (
                <a
                  href={`tel:${service.official_phone}`}
                  style={{
                    backgroundColor: '#BE9B49',
                    color: '#081738',
                    padding: '10px 20px',
                    borderRadius: '8px',
                    fontWeight: 700,
                    textDecoration: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <Phone size={16} />
                  <span>Call Provider</span>
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
