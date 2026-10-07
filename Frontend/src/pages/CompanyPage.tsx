import React, { useEffect } from 'react';
import {
  ArrowLeft,
  Building2,
  Stethoscope,
  Pill,
  Activity,
  HeartPulse,
  Truck,
  UserCheck,
  Award,
  BarChart3,
  Globe,
  Sparkles,
  Users,
  Gift,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { Footer } from '../components/layout/Footer';

interface CompanyPageProps {
  onNavigate: (view: string) => void;
}

export const CompanyPage: React.FC<CompanyPageProps> = ({ onNavigate }) => {
  useEffect(() => {
    document.title = 'Company Overview | ODS Global Network';
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute(
        'content',
        'Learn about ODS Global Network, our mission, vision, 9 healthcare provider categories, and integrated wellness ecosystem.'
      );
    }
  }, []);

  const providerCategories = [
    { title: 'Hospitals', desc: 'Tertiary hospitals and specialized surgical centers.', icon: <Building2 size={24} /> },
    { title: 'Clinics & Urgent Care', desc: 'Outpatient clinics, walk-in practices, and urgent medical care.', icon: <Stethoscope size={24} /> },
    { title: 'Pharmacies', desc: 'Licensed retail pharmacies and essential medication delivery.', icon: <Pill size={24} /> },
    { title: 'Laboratories & Pathology', desc: 'Clinical diagnostic labs, specimen testing, and pathology centers.', icon: <Activity size={24} /> },
    { title: 'Wellness Centers & Spas', desc: 'Holistic retreats, therapeutic wellness, and fitness sanctuaries.', icon: <HeartPulse size={24} /> },
    { title: '24/7 Ambulance Services', desc: 'Emergency medical dispatch and rapid patient transport.', icon: <Truck size={24} /> },
    { title: 'Home Care & Nursing', desc: 'In-home clinical caregivers, nurse visits, and elderly support.', icon: <UserCheck size={24} /> },
    { title: 'Specialists & Consultants', desc: 'Board-certified medical consultants across clinical disciplines.', icon: <Award size={24} /> },
    { title: 'Diagnostic & Imaging', desc: 'Medical imaging, ultrasound, MRI, and radiology diagnostics.', icon: <BarChart3 size={24} /> },
  ];

  const pillars = [
    { title: 'Centralized Healthcare Ecosystem', desc: 'Unifying multi-category providers into a single, accessible digital network.', icon: <ShieldCheck size={24} /> },
    { title: 'Diaspora Family Support', desc: 'Empowering families worldwide to arrange and sponsor reliable care for loved ones back home.', icon: <Globe size={24} /> },
    { title: 'Corporate Wellness Solutions', desc: 'Comprehensive employee health packages and healthcare benefits for organizations.', icon: <Users size={24} /> },
    { title: 'Social & Community Impact', desc: 'Targeted support initiatives dedicated to improving regional healthcare accessibility.', icon: <Sparkles size={24} /> },
  ];

  const handleGiftingClick = () => {
    onNavigate('home');
    setTimeout(() => {
      const el = document.querySelector('#gifting');
      el?.scrollIntoView({ behavior: 'smooth' });
    }, 60);
  };

  return (
    <div style={{ backgroundColor: 'var(--color-navy-dark)', minHeight: '100vh', color: 'var(--color-white)', display: 'flex', flexDirection: 'column' }}>
      {/* ── Top Sticky Utility Bar ───────────────────────────────── */}
      <div
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 90,
          backgroundColor: 'color-mix(in srgb, var(--color-navy) 98%, transparent)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderBottom: '1px solid var(--color-border-dark)',
          padding: '14px 0',
        }}
      >
        <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <button
            type="button"
            onClick={() => onNavigate('home')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              color: 'var(--color-gold-bright)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.92rem',
              padding: '6px 10px',
              borderRadius: '6px',
            }}
            aria-label="Back to Home"
          >
            <ArrowLeft size={18} />
            <span>Back to Home</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('home')}
            style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
            aria-label="ODS Global Network Home"
          >
            <img
              src="/assets/brand/vector/ods-logo-gold-primary.svg"
              alt="ODS Global Network"
              style={{ height: '36px', width: 'auto' }}
            />
          </button>
        </div>
      </div>

      {/* ── Hero Section ─────────────────────────────────────────── */}
      <section style={{ padding: '64px 0 48px', borderBottom: '1px solid var(--color-border-dark)' }}>
        <div className="container" style={{ maxWidth: '880px', textAlign: 'center' }}>
          <div
            style={{
              display: 'inline-block',
              padding: '6px 16px',
              borderRadius: '20px',
              backgroundColor: 'color-mix(in srgb, var(--color-gold-bright) 12%, transparent)',
              color: 'var(--color-gold-bright)',
              fontSize: '0.85rem',
              fontWeight: 600,
              marginBottom: '16px',
              letterSpacing: '0.04em',
            }}
          >
            ETHIOPIAN BLESSINGS, MODERN GIFTING
          </div>
          <h1
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: 'clamp(2rem, 4vw, 2.8rem)',
              color: 'var(--color-white)',
              lineHeight: 1.25,
              marginBottom: '20px',
              fontWeight: 700,
            }}
          >
            ODS Global Network
          </h1>
          <p
            style={{
              fontSize: '1.08rem',
              lineHeight: 1.7,
              color: 'var(--color-text-muted-dark)',
              maxWidth: '760px',
              margin: '0 auto',
            }}
          >
            An integrated digital ecosystem connecting individuals, families, licensed healthcare providers, and commercial merchants. We are building the bridge between quality care, modern digital wellness, and meaningful support for local and diaspora communities.
          </p>
        </div>
      </section>

      {/* ── Mission & Vision ─────────────────────────────────────── */}
      <section style={{ padding: '56px 0', borderBottom: '1px solid var(--color-border-dark)' }}>
        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '28px' }}>
            <div
              style={{
                backgroundColor: 'color-mix(in srgb, var(--color-card-dark) 90%, transparent)',
                border: '1px solid var(--color-border-dark)',
                borderRadius: '16px',
                padding: '32px',
                boxShadow: 'var(--shadow-card-dark)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                <div style={{ padding: '10px', borderRadius: '10px', backgroundColor: 'color-mix(in srgb, var(--color-gold-bright) 12%, transparent)', color: 'var(--color-gold-bright)' }}>
                  <Sparkles size={22} />
                </div>
                <h2 style={{ fontSize: '1.35rem', color: 'var(--color-gold-bright)', fontFamily: 'var(--font-heading)', margin: 0 }}>
                  Our Mission
                </h2>
              </div>
              <p style={{ color: 'var(--color-text-muted-dark)', lineHeight: 1.7, fontSize: '0.98rem', margin: 0 }}>
                Connecting people to better healthcare, seamless gifting, and verified wellness services across Ethiopia and the diaspora through innovative, secure, and compassionate digital infrastructure.
              </p>
            </div>

            <div
              style={{
                backgroundColor: 'color-mix(in srgb, var(--color-card-dark) 90%, transparent)',
                border: '1px solid var(--color-border-dark)',
                borderRadius: '16px',
                padding: '32px',
                boxShadow: 'var(--shadow-card-dark)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                <div style={{ padding: '10px', borderRadius: '10px', backgroundColor: 'color-mix(in srgb, var(--color-gold-bright) 12%, transparent)', color: 'var(--color-gold-bright)' }}>
                  <Globe size={22} />
                </div>
                <h2 style={{ fontSize: '1.35rem', color: 'var(--color-gold-bright)', fontFamily: 'var(--font-heading)', margin: 0 }}>
                  Our Vision
                </h2>
              </div>
              <p style={{ color: 'var(--color-text-muted-dark)', lineHeight: 1.7, fontSize: '0.98rem', margin: 0 }}>
                To become the leading digital healthcare ecosystem transforming how Africa accesses, delivers, and experiences healthcare and wellness services.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 9 Provider Categories ─────────────────────────────────── */}
      <section style={{ padding: '64px 0', borderBottom: '1px solid var(--color-border-dark)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', maxWidth: '720px', margin: '0 auto 48px' }}>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.8rem', color: 'var(--color-white)', marginBottom: '14px' }}>
              Provider Network Categories
            </h2>
            <p style={{ color: 'var(--color-text-muted-dark)', fontSize: '0.95rem', lineHeight: 1.6 }}>
              ODS Global Network integrates 9 comprehensive healthcare and wellness sectors to ensure complete continuum of care.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
            {providerCategories.map((cat, idx) => (
              <div
                key={idx}
                style={{
                  backgroundColor: 'color-mix(in srgb, var(--color-card-dark) 70%, transparent)',
                  border: '1px solid var(--color-border-dark)',
                  borderRadius: '12px',
                  padding: '24px',
                  display: 'flex',
                  gap: '16px',
                  alignItems: 'flex-start',
                }}
              >
                <div style={{ color: 'var(--color-gold-bright)', padding: '8px', borderRadius: '8px', backgroundColor: 'color-mix(in srgb, var(--color-gold-bright) 10%, transparent)', flexShrink: 0 }}>
                  {cat.icon}
                </div>
                <div>
                  <h3 style={{ fontSize: '1.05rem', color: 'var(--color-white)', margin: '0 0 6px', fontWeight: 600 }}>
                    {cat.title}
                  </h3>
                  <p style={{ color: 'var(--color-text-muted-dark)', fontSize: '0.88rem', lineHeight: 1.5, margin: 0 }}>
                    {cat.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Strategic Pillars ─────────────────────────────────────── */}
      <section style={{ padding: '64px 0', borderBottom: '1px solid var(--color-border-dark)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', maxWidth: '720px', margin: '0 auto 48px' }}>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.8rem', color: 'var(--color-white)', marginBottom: '14px' }}>
              Strategic Platform Pillars
            </h2>
            <p style={{ color: 'var(--color-text-muted-dark)', fontSize: '0.95rem' }}>
              Key architectural foundations driving healthcare accessibility and diaspora engagement.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '24px' }}>
            {pillars.map((p, idx) => (
              <div
                key={idx}
                style={{
                  backgroundColor: 'color-mix(in srgb, var(--color-navy) 60%, transparent)',
                  border: '1px solid var(--color-border-dark)',
                  borderRadius: '14px',
                  padding: '26px',
                }}
              >
                <div style={{ color: 'var(--color-gold-bright)', marginBottom: '14px' }}>{p.icon}</div>
                <h3 style={{ fontSize: '1.08rem', color: 'var(--color-white)', marginBottom: '8px' }}>{p.title}</h3>
                <p style={{ color: 'var(--color-text-muted-dark)', fontSize: '0.88rem', lineHeight: 1.6, margin: 0 }}>{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Condensed Cultural Gifting Block ─────────────────────── */}
      <section style={{ padding: '56px 0 72px' }}>
        <div className="container">
          <div
            style={{
              backgroundColor: 'color-mix(in srgb, var(--color-card-dark) 95%, transparent)',
              border: '1px solid var(--color-gold-mid)',
              borderRadius: '16px',
              padding: '36px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              gap: '18px',
              maxWidth: '820px',
              margin: '0 auto',
            }}
          >
            <div style={{ color: 'var(--color-gold-bright)', padding: '12px', borderRadius: '50%', backgroundColor: 'color-mix(in srgb, var(--color-gold-bright) 15%, transparent)' }}>
              <Gift size={28} />
            </div>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.5rem', color: 'var(--color-white)', margin: 0 }}>
              Cultural Gifting &amp; Vouchers
            </h2>
            <p style={{ color: 'var(--color-text-muted-dark)', fontSize: '0.95rem', lineHeight: 1.6, maxWidth: '640px', margin: 0 }}>
              Celebrate Ethiopian traditions and express care through digital gift vouchers, corporate health packages, and diaspora wellness gifting.
            </p>
            <button
              type="button"
              onClick={handleGiftingClick}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: 'var(--color-gold-deep)',
                color: 'var(--color-navy-dark)',
                border: 'none',
                borderRadius: '8px',
                padding: '12px 24px',
                fontWeight: 600,
                fontSize: '0.95rem',
                cursor: 'pointer',
                transition: 'background var(--transition-fast)',
                marginTop: '8px',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--color-gold-bright)')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'var(--color-gold-deep)')}
            >
              <span>Explore Gifting on Home</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────── */}
      <Footer onNavigate={onNavigate} />
    </div>
  );
};

export default CompanyPage;
