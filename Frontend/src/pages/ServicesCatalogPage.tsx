/**
 * ServicesCatalogPage.tsx — ODS Global Network (Batch 8)
 * Public Service Catalog & Healthcare Provider Directory
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Search,
  Filter,
  Star,
  MapPin,
  Clock,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  Building2,
  Stethoscope,
  Pill,
  Activity,
  HeartPulse,
  Truck,
  UserCheck,
  Award,
  BarChart3,
  Gift,
  ArrowUpDown,
  RefreshCw,
  X,
  AlertCircle
} from 'lucide-react';
import { Button } from '../components/common/Button';
import {
  serviceCatalogService,
  ServiceItem,
  ProviderDirectoryItem,
  CategoryCountItem
} from '../services/serviceCatalogService';

interface ServicesCatalogPageProps {
  onNavigate: (view: string) => void;
  onSelectService?: (idOrSlug: string) => void;
  initialCategory?: string;
}

const CATEGORY_META: Record<string, { label: string; icon: React.ReactNode }> = {
  hospital: { label: 'Hospitals', icon: <Building2 size={16} /> },
  clinic: { label: 'Clinics', icon: <Stethoscope size={16} /> },
  pharmacy: { label: 'Pharmacies', icon: <Pill size={16} /> },
  laboratory: { label: 'Laboratories', icon: <Activity size={16} /> },
  wellness_center: { label: 'Wellness Centers', icon: <HeartPulse size={16} /> },
  ambulance: { label: 'Ambulance Services', icon: <Truck size={16} /> },
  home_care: { label: 'Home Care', icon: <UserCheck size={16} /> },
  specialist: { label: 'Specialists', icon: <Award size={16} /> },
  diagnostic_center: { label: 'Diagnostic Centers', icon: <BarChart3 size={16} /> }
};

const DELIVERY_MODALITY_META: Record<string, { label: string; color: string }> = {
  in_clinic: { label: 'In-Clinic', color: '#3b82f6' },
  home_visit: { label: 'Home Visit', color: '#10b981' },
  virtual: { label: 'Virtual / Telehealth', color: '#8b5cf6' },
  diagnostic: { label: 'Diagnostic Center', color: '#f59e0b' },
  on_site: { label: 'On-Site', color: '#3b82f6' },
  at_customer: { label: 'At Patient Location', color: '#10b981' },
  online: { label: 'Online / Telehealth', color: '#8b5cf6' }
};

export const ServicesCatalogPage: React.FC<ServicesCatalogPageProps> = ({
  onNavigate,
  onSelectService,
  initialCategory
}) => {
  // Active Tab: 'services' | 'providers'
  const [activeTab, setActiveTab] = useState<'services' | 'providers'>('services');

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory || '');
  const [selectedModality, setSelectedModality] = useState<string>('');
  const [sortOption, setSortOption] = useState<'newest' | 'price_asc' | 'price_desc' | 'rating' | 'duration'>('newest');
  const [minPrice, setMinPrice] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<string>('');

  // Data States
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [providers, setProviders] = useState<ProviderDirectoryItem[]>([]);
  const [categories, setCategories] = useState<CategoryCountItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);

  // Set document title & SEO meta
  useEffect(() => {
    document.title = 'Healthcare Services Catalog & Provider Directory | ODS Global Network';
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute(
        'content',
        'Explore verified hospitals, clinics, diagnostic centers, and wellness specialists in Ethiopia. Book care or gift healthcare vouchers to loved ones.'
      );
    }
  }, []);

  // Fetch category taxonomy
  useEffect(() => {
    serviceCatalogService
      .getCategories()
      .then((cats) => setCategories(cats))
      .catch((err) => console.error('Failed to load categories', err));
  }, []);

  // Fetch services data
  const loadServices = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await serviceCatalogService.getPublicCatalog({
        search: searchQuery || undefined,
        category: selectedCategory || undefined,
        deliveryType: selectedModality || undefined,
        minPrice: minPrice ? Number(minPrice) : undefined,
        maxPrice: maxPrice ? Number(maxPrice) : undefined,
        sort: sortOption,
        page: currentPage,
        limit: 12
      });
      setServices(res.data);
      setTotalCount(res.pagination.total);
    } catch (err: any) {
      setError(err.message || 'Failed to retrieve healthcare services catalog');
    } finally {
      setLoading(false);
    }
  }, [searchQuery, selectedCategory, selectedModality, minPrice, maxPrice, sortOption, currentPage]);

  // Fetch providers data
  const loadProviders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await serviceCatalogService.getProviders({
        search: searchQuery || undefined,
        category: selectedCategory || undefined,
        page: currentPage,
        limit: 12
      });
      setProviders(res.data);
      setTotalCount(res.pagination.total);
    } catch (err: any) {
      setError(err.message || 'Failed to retrieve provider directory');
    } finally {
      setLoading(false);
    }
  }, [searchQuery, selectedCategory, currentPage]);

  // Reload when tab or filters change
  useEffect(() => {
    if (activeTab === 'services') {
      loadServices();
    } else {
      loadProviders();
    }
  }, [activeTab, loadServices, loadProviders]);

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('');
    setSelectedModality('');
    setMinPrice('');
    setMaxPrice('');
    setSortOption('newest');
    setCurrentPage(1);
  };

  const handleServiceClick = (slugOrId: string) => {
    if (onSelectService) {
      onSelectService(slugOrId);
    } else {
      onNavigate(`services/${slugOrId}`);
    }
  };

  const handleGiftServiceClick = (e: React.MouseEvent, _service: ServiceItem) => {
    e.stopPropagation();
    onNavigate('gift/claim');
  };

  return (
    <div style={{ backgroundColor: '#081738', minHeight: '100vh', color: '#ffffff' }}>
      {/* ── Hero & Search Banner ─────────────────────────────────── */}
      <section
        style={{
          background: 'radial-gradient(circle at 50% 0%, #153875 0%, #081738 80%)',
          borderBottom: '1px solid rgba(190, 155, 73, 0.2)',
          padding: '64px 20px 40px',
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <div style={{ maxWidth: '1000px', margin: '0 auto', position: 'relative', zIndex: 2 }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 16px',
              borderRadius: '9999px',
              backgroundColor: 'rgba(190, 155, 73, 0.15)',
              border: '1px solid rgba(190, 155, 73, 0.35)',
              color: '#EDC45B',
              fontSize: '0.85rem',
              fontWeight: 600,
              marginBottom: '20px'
            }}
          >
            <Sparkles size={15} />
            <span>Verified Healthcare & Wellness Network</span>
          </div>

          <h1
            style={{
              fontSize: 'clamp(2rem, 4vw, 3.2rem)',
              fontWeight: 700,
              lineHeight: 1.2,
              marginBottom: '16px',
              fontFamily: "'Google Sans Flex', 'Inter', sans-serif"
            }}
          >
            Find, Book & Gift <span style={{ color: '#EDC45B' }}>Premium Care</span>
          </h1>

          <p
            style={{
              fontSize: 'clamp(1rem, 1.8vw, 1.15rem)',
              color: '#cbd5e1',
              maxWidth: '680px',
              margin: '0 auto 36px',
              lineHeight: 1.6
            }}
          >
            Connect directly with Ethiopia&apos;s leading accredited hospitals, specialized clinics, licensed pharmacies,
            and wellness practitioners — all unified under one trusted platform.
          </p>

          {/* Unified Search Bar */}
          <div
            style={{
              maxWidth: '720px',
              margin: '0 auto',
              display: 'flex',
              alignItems: 'center',
              backgroundColor: 'rgba(15, 40, 91, 0.95)',
              borderRadius: '16px',
              padding: '8px 12px 8px 20px',
              border: '1px solid rgba(190, 155, 73, 0.4)',
              boxShadow: '0 12px 30px rgba(0, 0, 0, 0.35)'
            }}
          >
            <Search size={22} style={{ color: '#BE9B49', marginRight: '12px', flexShrink: 0 }} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder={
                activeTab === 'services'
                  ? 'Search by service (e.g., Cardiac Consultation, Full Lab Panel, Dental)...'
                  : 'Search by provider name, specialty, or clinic...'
              }
              style={{
                width: '100%',
                backgroundColor: 'transparent',
                border: 'none',
                outline: 'none',
                color: '#ffffff',
                fontSize: '1rem',
                padding: '8px 0'
              }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  padding: '4px 8px',
                  display: 'flex',
                  alignItems: 'center'
                }}
                title="Clear search"
              >
                <X size={18} />
              </button>
            )}
            <button
              onClick={() => setIsFilterDrawerOpen(!isFilterDrawerOpen)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '10px 16px',
                borderRadius: '10px',
                backgroundColor: selectedCategory || selectedModality || minPrice || maxPrice ? '#BE9B49' : 'rgba(255, 255, 255, 0.08)',
                color: selectedCategory || selectedModality || minPrice || maxPrice ? '#081738' : '#ffffff',
                border: 'none',
                fontWeight: 600,
                fontSize: '0.88rem',
                cursor: 'pointer',
                marginLeft: '8px',
                transition: 'all 0.2s ease'
              }}
            >
              <Filter size={16} />
              <span>Filters</span>
            </button>
          </div>

          {/* Tab Switcher: Services vs Provider Directory */}
          <div
            style={{
              display: 'inline-flex',
              marginTop: '32px',
              backgroundColor: 'rgba(15, 40, 91, 0.7)',
              padding: '4px',
              borderRadius: '12px',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}
          >
            <button
              onClick={() => {
                setActiveTab('services');
                setCurrentPage(1);
              }}
              style={{
                padding: '10px 24px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: activeTab === 'services' ? '#BE9B49' : 'transparent',
                color: activeTab === 'services' ? '#081738' : '#cbd5e1',
                fontWeight: 700,
                fontSize: '0.92rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <Activity size={17} />
              <span>Services Catalog</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('providers');
                setCurrentPage(1);
              }}
              style={{
                padding: '10px 24px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: activeTab === 'providers' ? '#BE9B49' : 'transparent',
                color: activeTab === 'providers' ? '#081738' : '#cbd5e1',
                fontWeight: 700,
                fontSize: '0.92rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <Building2 size={17} />
              <span>Provider Directory</span>
            </button>
          </div>
        </div>
      </section>

      {/* ── Category Chips Bar ───────────────────────────────────── */}
      <section
        style={{
          backgroundColor: '#0c1e47',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          padding: '16px 20px',
          overflowX: 'auto',
          whiteSpace: 'nowrap'
        }}
      >
        <div
          style={{
            maxWidth: '1280px',
            margin: '0 auto',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}
        >
          <button
            onClick={() => {
              setSelectedCategory('');
              setCurrentPage(1);
            }}
            style={{
              padding: '8px 18px',
              borderRadius: '9999px',
              fontSize: '0.85rem',
              fontWeight: selectedCategory === '' ? 700 : 500,
              backgroundColor: selectedCategory === '' ? '#BE9B49' : 'rgba(255, 255, 255, 0.06)',
              color: selectedCategory === '' ? '#081738' : '#cbd5e1',
              border: selectedCategory === '' ? 'none' : '1px solid rgba(255, 255, 255, 0.12)',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            All Categories
          </button>

          {Object.keys(CATEGORY_META).map((catKey) => {
            const meta = CATEGORY_META[catKey];
            const isSelected = selectedCategory === catKey;
            const catItem = categories.find((c) => c.slug === catKey || (c as any).category === catKey);
            const count = (catItem && typeof catItem.service_count === 'number') ? catItem.service_count : 0;

            return (
              <button
                key={catKey}
                onClick={() => {
                  setSelectedCategory(isSelected ? '' : catKey);
                  setCurrentPage(1);
                }}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 16px',
                  borderRadius: '9999px',
                  fontSize: '0.85rem',
                  fontWeight: isSelected ? 700 : 500,
                  backgroundColor: isSelected ? '#BE9B49' : 'rgba(255, 255, 255, 0.06)',
                  color: isSelected ? '#081738' : '#cbd5e1',
                  border: isSelected ? 'none' : '1px solid rgba(255, 255, 255, 0.12)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <span>{meta.icon}</span>
                <span>{meta.label}</span>
                {count > 0 && (
                  <span
                    style={{
                      fontSize: '0.72rem',
                      padding: '2px 6px',
                      borderRadius: '9999px',
                      backgroundColor: isSelected ? '#081738' : 'rgba(255, 255, 255, 0.15)',
                      color: isSelected ? '#EDC45B' : '#ffffff',
                      marginLeft: '2px'
                    }}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </section>

      {/* ── Main Content Area with Optional Filter Drawer ───────── */}
      <main style={{ maxWidth: '1280px', margin: '0 auto', padding: '36px 20px 80px' }}>
        {/* Controls Bar (Sort & Results Summary) */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '16px',
            marginBottom: '28px',
            paddingBottom: '16px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
          }}
        >
          <div>
            <span style={{ fontSize: '1rem', color: '#94a3b8' }}>
              Showing <strong style={{ color: '#ffffff' }}>{totalCount}</strong>{' '}
              {activeTab === 'services' ? 'verified healthcare services' : 'accredited healthcare institutions'}
            </span>
            {(selectedCategory || selectedModality || searchQuery || minPrice || maxPrice) && (
              <button
                onClick={handleResetFilters}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#EDC45B',
                  fontSize: '0.88rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  marginLeft: '16px',
                  textDecoration: 'underline'
                }}
              >
                Clear all filters
              </button>
            )}
          </div>

          {activeTab === 'services' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '0.88rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <ArrowUpDown size={15} /> Sort by:
              </span>
              <select
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value as any)}
                style={{
                  backgroundColor: '#0F285B',
                  color: '#ffffff',
                  border: '1px solid rgba(190, 155, 73, 0.35)',
                  borderRadius: '8px',
                  padding: '8px 12px',
                  fontSize: '0.88rem',
                  outline: 'none',
                  cursor: 'pointer'
                }}
              >
                <option value="newest">Newest Additions</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="rating">Highest Rated</option>
                <option value="duration">Shortest Duration</option>
              </select>
            </div>
          )}
        </div>

        {/* Filter Drawer / Expandable Panel */}
        {isFilterDrawerOpen && (
          <div
            style={{
              backgroundColor: '#0F285B',
              borderRadius: '16px',
              padding: '24px',
              border: '1px solid rgba(190, 155, 73, 0.3)',
              marginBottom: '32px',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '24px'
            }}
          >
            {/* Delivery Modality */}
            {activeTab === 'services' && (
              <div>
                <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 600, color: '#EDC45B', marginBottom: '8px' }}>
                  Delivery Modality
                </label>
                <select
                  value={selectedModality}
                  onChange={(e) => {
                    setSelectedModality(e.target.value);
                    setCurrentPage(1);
                  }}
                  style={{
                    width: '100%',
                    backgroundColor: '#081738',
                    color: '#ffffff',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    borderRadius: '8px',
                    padding: '10px 12px',
                    fontSize: '0.9rem',
                    outline: 'none'
                  }}
                >
                  <option value="">All Modalities</option>
                  <option value="in_clinic">In-Clinic Visit</option>
                  <option value="home_visit">Home Visit / At-Home Care</option>
                  <option value="virtual">Virtual / Telehealth Consultation</option>
                  <option value="diagnostic">Diagnostic Center Procedure</option>
                </select>
              </div>
            )}

            {/* Price Range */}
            {activeTab === 'services' && (
              <div>
                <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 600, color: '#EDC45B', marginBottom: '8px' }}>
                  Price Range (ETB)
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    type="number"
                    placeholder="Min ETB"
                    value={minPrice}
                    onChange={(e) => {
                      setMinPrice(e.target.value);
                      setCurrentPage(1);
                    }}
                    style={{
                      width: '100%',
                      backgroundColor: '#081738',
                      color: '#ffffff',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      borderRadius: '8px',
                      padding: '10px 12px',
                      fontSize: '0.9rem',
                      outline: 'none'
                    }}
                  />
                  <span style={{ color: '#94a3b8' }}>-</span>
                  <input
                    type="number"
                    placeholder="Max ETB"
                    value={maxPrice}
                    onChange={(e) => {
                      setMaxPrice(e.target.value);
                      setCurrentPage(1);
                    }}
                    style={{
                      width: '100%',
                      backgroundColor: '#081738',
                      color: '#ffffff',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      borderRadius: '8px',
                      padding: '10px 12px',
                      fontSize: '0.9rem',
                      outline: 'none'
                    }}
                  />
                </div>
              </div>
            )}

            {/* Reset Button */}
            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
              <button
                onClick={handleResetFilters}
                style={{
                  padding: '10px 20px',
                  borderRadius: '8px',
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  color: '#ffffff',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  fontWeight: 600,
                  fontSize: '0.9rem',
                  cursor: 'pointer'
                }}
              >
                Reset All Filters
              </button>
            </div>
          </div>
        )}

        {/* ── Content Grid ────────────────────────────────────────── */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '80px 20px' }}>
            <RefreshCw size={36} className="animate-spin" style={{ color: '#BE9B49', margin: '0 auto 16px' }} />
            <p style={{ color: '#94a3b8', fontSize: '1rem' }}>Loading catalog offerings...</p>
          </div>
        ) : error ? (
          <div
            style={{
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '12px',
              padding: '24px',
              textAlign: 'center',
              color: '#f87171'
            }}
          >
            <AlertCircle size={28} style={{ margin: '0 auto 12px' }} />
            <p>{error}</p>
          </div>
        ) : activeTab === 'services' ? (
          /* Services Grid */
          services.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: '64px 20px',
                backgroundColor: 'rgba(15, 40, 91, 0.4)',
                borderRadius: '16px',
                border: '1px dashed rgba(255, 255, 255, 0.15)'
              }}
            >
              <Activity size={40} style={{ color: '#BE9B49', margin: '0 auto 16px' }} />
              <h3 style={{ fontSize: '1.25rem', marginBottom: '8px' }}>No healthcare services match your criteria</h3>
              <p style={{ color: '#94a3b8', maxWidth: '480px', margin: '0 auto 24px', fontSize: '0.92rem' }}>
                Try adjusting your search keywords, clearing price bounds, or exploring a different provider category.
              </p>
              <Button variant="outline-gold" onClick={handleResetFilters}>
                View All Healthcare Services
              </Button>
            </div>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                gap: '24px'
              }}
            >
              {services.map((service) => {
                const catSlug = service.category_slug || service.category || '';
                const categoryInfo = (CATEGORY_META as Record<string, any>)[catSlug] || {
                  label: service.category_name || service.category || 'Clinical Service',
                  icon: <Activity size={16} />
                };
                const delivType = service.location_type || service.delivery_type || 'on_site';
                const modalityInfo = (DELIVERY_MODALITY_META as Record<string, any>)[delivType] || {
                  label: delivType.replace('_', ' '),
                  color: '#BE9B49'
                };
                const discount = Number(service.discount_percentage) || 0;
                const price = Number(service.price_amount !== undefined ? service.price_amount : service.price || 0);
                const effectivePrice = Number(service.effective_price || price);
                const rating = Number(service.avg_rating) || 0;

                return (
                  <div
                    key={service.id}
                    onClick={() => handleServiceClick(service.slug || service.id)}
                    style={{
                      backgroundColor: '#0F285B',
                      borderRadius: '16px',
                      border: '1px solid rgba(190, 155, 73, 0.25)',
                      overflow: 'hidden',
                      display: 'flex',
                      flexDirection: 'column',
                      cursor: 'pointer',
                      transition: 'all 0.25s ease',
                      boxShadow: '0 8px 24px rgba(0, 0, 0, 0.25)',
                      position: 'relative'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-4px)';
                      e.currentTarget.style.borderColor = '#BE9B49';
                      e.currentTarget.style.boxShadow = '0 16px 36px rgba(190, 155, 73, 0.2)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'none';
                      e.currentTarget.style.borderColor = 'rgba(190, 155, 73, 0.25)';
                      e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.25)';
                    }}
                  >
                    {/* Card Top: Badges */}
                    <div style={{ padding: '20px 20px 12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginBottom: '12px' }}>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '4px 10px',
                            borderRadius: '9999px',
                            backgroundColor: 'rgba(190, 155, 73, 0.15)',
                            color: '#EDC45B',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            letterSpacing: '0.02em'
                          }}
                        >
                          {categoryInfo.icon}
                          {categoryInfo.label}
                        </span>

                        <span
                          style={{
                            padding: '4px 10px',
                            borderRadius: '9999px',
                            backgroundColor: 'rgba(255, 255, 255, 0.08)',
                            color: modalityInfo.color,
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            border: `1px solid ${modalityInfo.color}40`
                          }}
                        >
                          {modalityInfo.label}
                        </span>
                      </div>

                      {/* Title */}
                      <h3
                        style={{
                          fontSize: '1.2rem',
                          fontWeight: 700,
                          color: '#ffffff',
                          lineHeight: 1.35,
                          marginBottom: '8px'
                        }}
                      >
                        {service.title}
                      </h3>

                      {/* Provider info snippet */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.86rem', color: '#cbd5e1', marginBottom: '10px' }}>
                        <ShieldCheck size={16} style={{ color: '#10b981', flexShrink: 0 }} />
                        <span style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {service.provider_name || 'Accredited Healthcare Provider'}
                        </span>
                      </div>

                      {/* Location & Duration row */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '16px' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <MapPin size={14} style={{ color: '#BE9B49' }} />
                          {service.city || 'Addis Ababa'}
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Clock size={14} style={{ color: '#BE9B49' }} />
                          {service.duration_minutes} mins
                        </span>
                        {rating > 0 && (
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#EDC45B', fontWeight: 600 }}>
                            <Star size={14} fill="#EDC45B" stroke="none" />
                            {rating.toFixed(1)} ({service.review_count})
                          </span>
                        )}
                      </div>

                      {/* Description preview */}
                      <p
                        style={{
                          fontSize: '0.85rem',
                          color: '#94a3b8',
                          lineHeight: 1.5,
                          marginBottom: '20px',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden'
                        }}
                      >
                        {service.description || 'Comprehensive clinical healthcare service delivered by licensed practitioners with quality guarantee.'}
                      </p>
                    </div>

                    {/* Card Footer: Pricing & CTAs */}
                    <div
                      style={{
                        marginTop: 'auto',
                        padding: '16px 20px',
                        backgroundColor: 'rgba(8, 23, 56, 0.6)',
                        borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '12px'
                      }}
                    >
                      <div>
                        {discount > 0 && (
                          <div style={{ fontSize: '0.78rem', color: '#94a3b8', textDecoration: 'line-through' }}>
                            {price.toLocaleString()} ETB
                          </div>
                        )}
                        <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#EDC45B' }}>
                          {effectivePrice.toLocaleString()}{' '}
                          <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#ffffff' }}>ETB</span>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <button
                          onClick={(e) => handleGiftServiceClick(e, service)}
                          style={{
                            padding: '8px 12px',
                            borderRadius: '8px',
                            backgroundColor: 'rgba(190, 155, 73, 0.15)',
                            color: '#EDC45B',
                            border: '1px solid rgba(190, 155, 73, 0.35)',
                            fontWeight: 600,
                            fontSize: '0.82rem',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            transition: 'all 0.15s ease'
                          }}
                          title="Gift this service as a digital voucher"
                        >
                          <Gift size={14} />
                          <span>Gift</span>
                        </button>

                        <button
                          onClick={() => handleServiceClick(service.slug || service.id)}
                          style={{
                            padding: '8px 14px',
                            borderRadius: '8px',
                            backgroundColor: '#BE9B49',
                            color: '#081738',
                            border: 'none',
                            fontWeight: 700,
                            fontSize: '0.85rem',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          <span>Details</span>
                          <ChevronRight size={15} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )
        ) : (
          /* Healthcare Provider Directory Grid */
          providers.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: '64px 20px',
                backgroundColor: 'rgba(15, 40, 91, 0.4)',
                borderRadius: '16px',
                border: '1px dashed rgba(255, 255, 255, 0.15)'
              }}
            >
              <Building2 size={40} style={{ color: '#BE9B49', margin: '0 auto 16px' }} />
              <h3 style={{ fontSize: '1.25rem', marginBottom: '8px' }}>No accredited providers match your search</h3>
              <p style={{ color: '#94a3b8', maxWidth: '480px', margin: '0 auto 24px', fontSize: '0.92rem' }}>
                Try searching for another specialty or clear your filter criteria.
              </p>
              <Button variant="outline-gold" onClick={handleResetFilters}>
                View All Providers
              </Button>
            </div>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
                gap: '24px'
              }}
            >
              {providers.map((prov) => {
                const categoryInfo = CATEGORY_META[prov.provider_type] || {
                  label: prov.provider_type,
                  icon: <Building2 size={16} />
                };
                const rating = Number(prov.avg_rating) || 0;

                return (
                  <div
                    key={prov.id}
                    style={{
                      backgroundColor: '#0F285B',
                      borderRadius: '16px',
                      border: '1px solid rgba(190, 155, 73, 0.25)',
                      padding: '24px',
                      display: 'flex',
                      flexDirection: 'column',
                      boxShadow: '0 8px 24px rgba(0, 0, 0, 0.25)',
                      transition: 'all 0.25s ease'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', marginBottom: '14px' }}>
                      <div>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '4px 10px',
                            borderRadius: '9999px',
                            backgroundColor: 'rgba(190, 155, 73, 0.15)',
                            color: '#EDC45B',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            marginBottom: '8px'
                          }}
                        >
                          {categoryInfo.icon}
                          {categoryInfo.label}
                        </span>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#ffffff', lineHeight: 1.3 }}>
                          {prov.provider_name}
                        </h3>
                      </div>

                      <div
                        style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '10px',
                          backgroundColor: 'rgba(16, 185, 129, 0.15)',
                          border: '1px solid rgba(16, 185, 129, 0.3)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#10b981',
                          flexShrink: 0
                        }}
                        title="ODS Verified Accreditation"
                      >
                        <ShieldCheck size={22} />
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '0.84rem', color: '#cbd5e1', marginBottom: '12px' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <MapPin size={15} style={{ color: '#BE9B49' }} />
                        {prov.city || 'Addis Ababa'}
                      </span>
                      {rating > 0 && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#EDC45B', fontWeight: 600 }}>
                          <Star size={15} fill="#EDC45B" stroke="none" />
                          {rating.toFixed(1)} ({prov.total_reviews} reviews)
                        </span>
                      )}
                    </div>

                    <p
                      style={{
                        fontSize: '0.86rem',
                        color: '#94a3b8',
                        lineHeight: 1.5,
                        marginBottom: '16px',
                        display: '-webkit-box',
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden'
                      }}
                    >
                      {prov.description || 'Accredited medical facility providing specialized clinical consultations, diagnostics, and patient care.'}
                    </p>

                    <div
                      style={{
                        marginTop: 'auto',
                        paddingTop: '16px',
                        borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}
                    >
                      <span style={{ fontSize: '0.82rem', color: '#cbd5e1' }}>
                        <strong style={{ color: '#EDC45B' }}>{prov.active_services_count}</strong> active services
                      </span>

                      <button
                        onClick={() => {
                          setSearchQuery(prov.provider_name);
                          setActiveTab('services');
                          setCurrentPage(1);
                        }}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '8px 14px',
                          borderRadius: '8px',
                          backgroundColor: '#BE9B49',
                          color: '#081738',
                          fontWeight: 700,
                          fontSize: '0.84rem',
                          border: 'none',
                          cursor: 'pointer'
                        }}
                      >
                        <span>View Services</span>
                        <ChevronRight size={15} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )
        )}
      </main>
    </div>
  );
};
