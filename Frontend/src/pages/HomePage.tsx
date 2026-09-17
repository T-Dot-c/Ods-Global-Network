import React from 'react';
import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';
import {
  ArrowRight,
  Sparkles,
  Gift,
  CheckCircle2,
} from 'lucide-react';

interface HomePageProps {
  onNavigate: (view: 'home' | 'login' | 'register') => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onNavigate }) => {
  const categories = [
    {
      title: 'Hospitals & Clinics',
      description: 'Consult with board-certified physicians, book diagnostic scans, and secure priority outpatient consultations.',
      icon: '/assets/icons/medical.svg',
      tag: 'Priority Access',
    },
    {
      title: 'Therapeutic Wellness & Spas',
      description: 'Rejuvenate with holistic wellness therapies, hydrotherapy, physiotherapy, and certified stress-reduction retreats.',
      icon: '/assets/icons/wellness.svg',
      tag: 'Holistic Care',
    },
    {
      title: 'At-Home Nursing & Care',
      description: 'Licensed nurses, geriatric assistance, post-surgical rehabilitation, and infant support delivered to your residence.',
      icon: '/assets/icons/home-health.svg',
      tag: 'Home Visits',
    },
    {
      title: 'Recovery Lodging & Stays',
      description: 'Medical-grade recuperative hotel suites and retreats equipped with 24/7 on-call medical monitoring.',
      icon: '/assets/icons/hotel-room.svg',
      tag: 'Extended Care',
    },
    {
      title: 'Mindfulness & Mental Health',
      description: 'Confidential psychiatric evaluations, certified psychotherapy sessions, and guided meditation practices.',
      icon: '/assets/icons/Mindfulness.svg',
      tag: 'Confidential',
    },
    {
      title: 'Special Celebrations & Packages',
      description: 'Bespoke executive health gift packages, anniversary wellness escapes, and family healthcare bundles.',
      icon: '/assets/icons/Festivities.svg',
      tag: 'Exclusive',
    },
  ];

  return (
    <div style={{ backgroundColor: 'var(--color-navy)', color: 'var(--color-text-light)', minHeight: '100vh' }}>
      {/* 1. HERO SECTION */}
      <section
        style={{
          position: 'relative',
          paddingTop: '80px',
          paddingBottom: '100px',
          backgroundImage: 'radial-gradient(circle at 50% 15%, rgba(18, 49, 104, 0.95) 0%, rgba(15, 40, 91, 1) 60%, rgba(8, 23, 56, 1) 100%)',
          overflow: 'hidden',
          borderBottom: '1px solid var(--color-border-dark)',
        }}
      >
        {/* Subtle background luxury pattern */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage: 'url(/assets/brand/raster/brand-pattern.png)',
            opacity: 0.04,
            backgroundSize: '400px',
            pointerEvents: 'none',
          }}
        />

        <div className="container" style={{ position: 'relative', zIndex: 2, textAlign: 'center' }}>
          {/* Trust Badge */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 18px',
              borderRadius: '999px',
              backgroundColor: 'rgba(18, 49, 104, 0.85)',
              border: '1px solid var(--color-gold-mid)',
              marginBottom: '28px',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <Sparkles size={16} color="var(--color-gold-bright)" />
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-gold-highlight)', letterSpacing: '0.5px' }}>
              CERTIFIED HEALTHCARE & LUXURY WELLNESS ECOSYSTEM
            </span>
          </div>

          {/* Main Title */}
          <h1
            style={{
              fontSize: 'clamp(2.5rem, 5vw, 4.2rem)',
              maxWidth: '920px',
              margin: '0 auto 24px',
              letterSpacing: '-0.02em',
              lineHeight: 1.15,
            }}
          >
            Elevate Your Well-Being with <span className="gold-gradient-text">ODS Global Network</span>
          </h1>

          {/* Subtitle */}
          <p
            style={{
              fontSize: 'clamp(1.05rem, 2vw, 1.25rem)',
              maxWidth: '720px',
              margin: '0 auto 40px',
              color: 'var(--color-text-muted-dark)',
              lineHeight: 1.6,
            }}
          >
            A unified, state-of-the-art platform connecting individuals and enterprises with world-class hospitals, accredited specialists, diagnostic centers, and therapeutic wellness retreats.
          </p>

          {/* Action CTAs */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', flexWrap: 'wrap', marginBottom: '60px' }}>
            <Button size="lg" variant="gold" onClick={() => onNavigate('register')}>
              Book an Appointment <ArrowRight size={18} />
            </Button>
            <Button size="lg" variant="outline-gold" onClick={() => onNavigate('register')}>
              Join as Provider / Merchant
            </Button>
          </div>

          {/* Key Metrics Strip */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '20px',
              maxWidth: '960px',
              margin: '0 auto',
            }}
          >
            <div style={{ padding: '20px', borderRadius: '12px', background: 'rgba(12, 33, 76, 0.75)', border: '1px solid var(--color-border-dark)' }}>
              <div style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--color-gold-bright)' }}>98.8%</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted-dark)', marginTop: '4px' }}>Appointment Confirmation Accuracy</div>
            </div>
            <div style={{ padding: '20px', borderRadius: '12px', background: 'rgba(12, 33, 76, 0.75)', border: '1px solid var(--color-border-dark)' }}>
              <div style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--color-gold-bright)' }}>&lt; 5 Min</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted-dark)', marginTop: '4px' }}>Provider Verification SLA</div>
            </div>
            <div style={{ padding: '20px', borderRadius: '12px', background: 'rgba(12, 33, 76, 0.75)', border: '1px solid var(--color-border-dark)' }}>
              <div style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--color-gold-bright)' }}>24/7</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted-dark)', marginTop: '4px' }}>Rapid Emergency Dispatch</div>
            </div>
            <div style={{ padding: '20px', borderRadius: '12px', background: 'rgba(12, 33, 76, 0.75)', border: '1px solid var(--color-border-dark)' }}>
              <div style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--color-gold-bright)' }}>100%</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted-dark)', marginTop: '4px' }}>PCI-Compliant Settlements</div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. SERVICES & PROVIDER DIRECTORY */}
      <section id="services" style={{ padding: '100px 0', borderBottom: '1px solid var(--color-border-dark)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '64px' }}>
            <h2 style={{ fontSize: '2.4rem', marginBottom: '16px' }}>
              Comprehensive <span className="gold-gradient-text">Healthcare & Lifestyle</span> Services
            </h2>
            <p style={{ color: 'var(--color-text-muted-dark)', maxWidth: '640px', margin: '0 auto', fontSize: '1.05rem' }}>
              Direct access to accredited medical clinics, rehabilitation experts, wellness retreats, and digital diagnostics.
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
              gap: '28px',
            }}
          >
            {categories.map((cat, idx) => (
              <Card
                key={idx}
                className="luxury-hover-card"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '18px',
                  cursor: 'pointer',
                  border: '1px solid var(--color-border-dark)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div
                    style={{
                      width: '56px',
                      height: '56px',
                      borderRadius: '12px',
                      background: 'rgba(18, 49, 104, 0.85)',
                      border: '1px solid var(--color-gold-deep)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <img src={cat.icon} alt={cat.title} style={{ width: '32px', height: '32px' }} />
                  </div>
                  <span
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      color: 'var(--color-gold-bright)',
                      backgroundColor: 'rgba(190, 155, 73, 0.15)',
                      border: '1px solid rgba(190, 155, 73, 0.35)',
                      padding: '4px 10px',
                      borderRadius: '999px',
                    }}
                  >
                    {cat.tag}
                  </span>
                </div>

                <h3 style={{ fontSize: '1.3rem', color: 'var(--color-text-light)' }}>{cat.title}</h3>
                <p style={{ fontSize: '0.92rem', color: 'var(--color-text-muted-dark)', lineHeight: 1.6, flexGrow: 1 }}>
                  {cat.description}
                </p>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '0.9rem',
                    fontWeight: 600,
                    color: 'var(--color-gold-highlight)',
                    marginTop: '8px',
                  }}
                  onClick={() => onNavigate('register')}
                >
                  Schedule Appointment <ArrowRight size={16} />
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* 3. WANAW DIGITAL GIFT CARD SPOTLIGHT */}
      <section id="gifting" style={{ padding: '100px 0', borderBottom: '1px solid var(--color-border-dark)', backgroundColor: 'var(--color-navy-dark)' }}>
        <div className="container">
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
              gap: '60px',
              alignItems: 'center',
            }}
          >
            <div>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '6px 14px',
                  borderRadius: '999px',
                  background: 'rgba(190, 155, 73, 0.15)',
                  border: '1px solid var(--color-gold-mid)',
                  marginBottom: '20px',
                }}
              >
                <Gift size={16} color="var(--color-gold-bright)" />
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-gold-bright)' }}>
                  WANAW HEALTH & WELLNESS GIFTING
                </span>
              </div>
              <h2 style={{ fontSize: '2.4rem', marginBottom: '20px', lineHeight: 1.2 }}>
                Gift Health, Vitality, and <span className="gold-gradient-text">Peace of Mind</span>
              </h2>
              <p style={{ color: 'var(--color-text-muted-dark)', fontSize: '1rem', lineHeight: 1.7, marginBottom: '28px' }}>
                Empower your loved ones or corporate teams with redeemable digital vouchers accepted across our entire network of hospitals, executive health checkups, dental clinics, and retreat spas.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '36px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <CheckCircle2 size={20} color="var(--color-gold-bright)" />
                  <span style={{ fontSize: '0.95rem' }}>100% Cryptographically verified redemption codes</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <CheckCircle2 size={20} color="var(--color-gold-bright)" />
                  <span style={{ fontSize: '0.95rem' }}>Instant digital delivery via SMS and secure email</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <CheckCircle2 size={20} color="var(--color-gold-bright)" />
                  <span style={{ fontSize: '0.95rem' }}>Real-time balance tracking and expiration alerts</span>
                </div>
              </div>

              <Button variant="gold" size="md" onClick={() => onNavigate('register')}>
                Purchase Digital Voucher
              </Button>
            </div>

            {/* Visual Gift Card Mockup */}
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <div
                style={{
                  width: '100%',
                  maxWidth: '420px',
                  borderRadius: '20px',
                  padding: '32px',
                  background: 'linear-gradient(135deg, #123168 0%, #081738 50%, #050f24 100%)',
                  border: '1.5px solid var(--color-gold-mid)',
                  boxShadow: 'var(--shadow-gold)',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '40px' }}>
                  <img
                    src="/assets/brand/vector/ods-logo-gold-primary.svg"
                    alt="ODS Gifting"
                    style={{ height: '36px' }}
                  />
                  <span style={{ color: 'var(--color-gold-highlight)', fontSize: '0.85rem', fontWeight: 600 }}>
                    EXECUTIVE VOUCHER
                  </span>
                </div>
                <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#ffffff', letterSpacing: '2px', marginBottom: '24px' }}>
                  •••• •••• •••• 8826
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted-dark)' }}>VOUCHER BALANCE</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--color-gold-bright)' }}>5,000 ETB / USD</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted-dark)' }}>VALID THRU</div>
                    <div style={{ fontSize: '0.9rem', color: '#ffffff' }}>12/28</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. STRATEGIC PARTNERS TRUST BAR */}
      <section id="partners" style={{ padding: '64px 0', borderBottom: '1px solid var(--color-border-dark)' }}>
        <div className="container" style={{ textAlign: 'center' }}>
          <p style={{ fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1.5px', color: 'var(--color-text-muted-dark)', marginBottom: '32px' }}>
            Trusted Infrastructure & Settlement Gateways
          </p>
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '48px',
              flexWrap: 'wrap',
            }}
          >
            <div style={{ background: '#ffffff', padding: '10px 24px', borderRadius: '12px', boxShadow: 'var(--shadow-sm)' }}>
              <img src="/assets/brand/partners/capital-bank.png" alt="Capital Bank" style={{ height: '32px', objectFit: 'contain' }} />
            </div>
            <div style={{ background: '#ffffff', padding: '10px 24px', borderRadius: '12px', boxShadow: 'var(--shadow-sm)' }}>
              <img src="/assets/brand/partners/ethiotel.png" alt="Ethio Telecom" style={{ height: '32px', objectFit: 'contain' }} />
            </div>
            <div style={{ background: '#ffffff', padding: '10px 24px', borderRadius: '12px', boxShadow: 'var(--shadow-sm)' }}>
              <img src="/assets/brand/partners/chapa.png" alt="Chapa Payment Gateway" style={{ height: '32px', objectFit: 'contain' }} />
            </div>
          </div>
        </div>
      </section>

      {/* 5. CALL TO ACTION FOR MERCHANTS */}
      <section style={{ padding: '80px 0', textAlign: 'center', backgroundColor: 'var(--color-navy)' }}>
        <div className="container" style={{ maxWidth: '800px' }}>
          <h2 style={{ fontSize: '2.2rem', marginBottom: '18px' }}>
            Are You a Healthcare or Wellness Provider?
          </h2>
          <p style={{ color: 'var(--color-text-muted-dark)', fontSize: '1.05rem', lineHeight: 1.6, marginBottom: '32px' }}>
            Join our enterprise network. Onboard your clinics, synchronize real-time doctor schedules, accept automated digital payments, and scale your reach.
          </p>
          <Button size="lg" variant="gold" onClick={() => onNavigate('register')}>
            Begin Merchant Onboarding <ArrowRight size={18} />
          </Button>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
