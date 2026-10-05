import React from 'react';
import { ArrowLeft, ShieldCheck, Mail, Phone, MapPin } from 'lucide-react';
import { Footer } from '../components/layout/Footer';
import '../styles/batch1-focus.css';

interface TermsPageProps {
  onNavigate: (view: string) => void;
}

export const TermsPage: React.FC<TermsPageProps> = ({ onNavigate }) => {
  return (
    <div
      className="batch1-page"
      style={{
        minHeight: '100vh',
        backgroundColor: '#ffffff',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Top Brand Utility Navigation */}
      <header
        style={{
          backgroundColor: 'var(--color-navy-dark)',
          borderBottom: '1px solid var(--color-border-dark)',
          padding: '16px 24px',
          position: 'sticky',
          top: 0,
          zIndex: 10,
        }}
      >
        <div
          className="container"
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <button
              type="button"
              onClick={() => onNavigate('home')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                color: 'var(--color-gold-bright)',
                backgroundColor: 'transparent',
                border: 'none',
                cursor: 'pointer',
                fontSize: '0.9rem',
                fontWeight: 600,
                padding: '6px 12px',
                borderRadius: '6px',
              }}
              aria-label="Return to Home"
            >
              <ArrowLeft size={18} />
              <span>Back to Home</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => onNavigate('home')}
            style={{
              background: 'none',
              border: 'none',
              padding: 0,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <img
              src="/assets/brand/vector/ods-logo-gold-primary.svg"
              alt="ODS Global Network"
              style={{ height: '38px' }}
            />
          </button>
        </div>
      </header>

      {/* Hero Title Section */}
      <section
        style={{
          backgroundColor: 'var(--color-navy)',
          color: '#ffffff',
          padding: '56px 24px 48px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage: 'url(/assets/brand/raster/brand-pattern.png)',
            opacity: 0.05,
            backgroundSize: '360px',
            pointerEvents: 'none',
          }}
        />

        <div className="container" style={{ position: 'relative', zIndex: 2, maxWidth: '820px' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '4px 14px',
              borderRadius: '999px',
              backgroundColor: 'rgba(190, 155, 73, 0.15)',
              border: '1px solid var(--color-gold-mid)',
              marginBottom: '18px',
            }}
          >
            <ShieldCheck size={16} color="var(--color-gold-bright)" />
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--color-gold-bright)' }}>
              Legal &amp; Compliance Policy
            </span>
          </div>

          <h1
            style={{
              fontSize: '2.4rem',
              fontWeight: 700,
              marginBottom: '12px',
              fontFamily: 'var(--font-heading)',
              lineHeight: 1.2,
            }}
          >
            Terms &amp; Conditions
          </h1>

          <p style={{ color: 'var(--color-text-muted-dark)', fontSize: '0.95rem' }}>
            Last updated: October 5, 2026
          </p>
        </div>
      </section>

      {/* Main Legal Content Container */}
      <main
        style={{
          flex: '1 0 auto',
          padding: '56px 24px 80px',
          backgroundColor: '#ffffff',
        }}
      >
        <div
          className="container"
          style={{
            maxWidth: '820px',
            color: 'var(--color-text-dark)',
            lineHeight: 1.75,
            fontSize: '1rem',
          }}
        >
          {/* Section 1 */}
          <section style={{ marginBottom: '40px' }}>
            <h2
              style={{
                fontSize: '1.4rem',
                fontWeight: 700,
                color: 'var(--color-navy-dark)',
                marginBottom: '14px',
                fontFamily: 'var(--font-heading)',
                borderBottom: '2px solid rgba(15, 40, 91, 0.08)',
                paddingBottom: '8px',
              }}
            >
              1. Acceptance of Platform Terms
            </h2>
            <p style={{ marginBottom: '16px' }}>
              Welcome to <strong>ODS Global Network</strong>. By accessing or utilizing our digital platform, portal
              services, appointment booking systems, or associated digital features, you confirm that you have read,
              understood, and agree to be legally bound by these Terms and Conditions.
            </p>
            <p>
              If you do not agree to these terms, you must refrain from accessing or utilizing any services provided
              by ODS Global Network.
            </p>
          </section>

          {/* Section 2 */}
          <section style={{ marginBottom: '40px' }}>
            <h2
              style={{
                fontSize: '1.4rem',
                fontWeight: 700,
                color: 'var(--color-navy-dark)',
                marginBottom: '14px',
                fontFamily: 'var(--font-heading)',
                borderBottom: '2px solid rgba(15, 40, 91, 0.08)',
                paddingBottom: '8px',
              }}
            >
              2. Platform Services &amp; Network Scope
            </h2>
            <p style={{ marginBottom: '16px' }}>
              ODS Global Network provides a unified digital ecosystem designed to connect individuals, registered
              enterprises, licensed healthcare providers, and verified commercial merchants:
            </p>
            <ul style={{ paddingLeft: '24px', marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <li>
                <strong>Customers:</strong> May discover accredited service providers, schedule verified consultations,
                and manage bookings and vouchers.
              </li>
              <li>
                <strong>Service Providers:</strong> Licensed hospitals, clinics, medical laboratories, diagnostic
                centers, and specialized wellness facilities managing availability and patient appointments.
              </li>
              <li>
                <strong>Merchants:</strong> Commercial institutions, healthcare equipment suppliers, and verified
                vendors managing catalog inventory and order fulfillments.
              </li>
            </ul>
          </section>

          {/* Section 3 */}
          <section style={{ marginBottom: '40px' }}>
            <h2
              style={{
                fontSize: '1.4rem',
                fontWeight: 700,
                color: 'var(--color-navy-dark)',
                marginBottom: '14px',
                fontFamily: 'var(--font-heading)',
                borderBottom: '2px solid rgba(15, 40, 91, 0.08)',
                paddingBottom: '8px',
              }}
            >
              3. Payments, Billing &amp; Confirmations
            </h2>
            <p style={{ marginBottom: '16px' }}>
              All commercial transactions, digital vouchers, and appointment reservations conducted through ODS Global
              Network are handled through verified payment gateway integrations.
            </p>
            <p style={{ marginBottom: '16px' }}>
              Payments are confirmed only after the payment provider confirms them. In case of payment failure or
              settlement cancellation, no service, digital voucher, or appointment reservation will be processed or
              honored.
            </p>
            <p>
              Users are responsible for ensuring that sufficient funds and accurate billing information are provided at
              the time of checkout.
            </p>
          </section>

          {/* Section 4 */}
          <section style={{ marginBottom: '40px' }}>
            <h2
              style={{
                fontSize: '1.4rem',
                fontWeight: 700,
                color: 'var(--color-navy-dark)',
                marginBottom: '14px',
                fontFamily: 'var(--font-heading)',
                borderBottom: '2px solid rgba(15, 40, 91, 0.08)',
                paddingBottom: '8px',
              }}
            >
              4. Limitation of Third-Party Liability
            </h2>
            <p style={{ marginBottom: '16px' }}>
              ODS Global Network functions as a digital facilitation platform. To the maximum extent permitted by
              applicable law, ODS Global Network is not liable for delays, service interruptions, or operational
              failures caused by third-party payment gateways, telecommunication operators, internet service providers,
              or independent delivery partners.
            </p>
            <p>
              Professional medical care, diagnostics, and pharmaceutical fulfillment are delivered exclusively by the
              independent licensed service providers registered on the network.
            </p>
          </section>

          {/* Section 5 */}
          <section style={{ marginBottom: '40px' }}>
            <h2
              style={{
                fontSize: '1.4rem',
                fontWeight: 700,
                color: 'var(--color-navy-dark)',
                marginBottom: '14px',
                fontFamily: 'var(--font-heading)',
                borderBottom: '2px solid rgba(15, 40, 91, 0.08)',
                paddingBottom: '8px',
              }}
            >
              5. Customer Support &amp; Official Inquiries
            </h2>
            <p style={{ marginBottom: '20px' }}>
              For legal inquiries, operational support, dispute assistance, or general questions regarding these terms,
              please reach our dedicated support administration:
            </p>

            <div
              style={{
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                padding: '24px',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: '16px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Mail size={20} color="var(--color-gold-deep)" />
                <div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Email Support</div>
                  <a
                    href="mailto:info@odsglobal.net"
                    style={{ color: 'var(--color-navy-dark)', fontWeight: 600, fontSize: '0.92rem' }}
                  >
                    info@odsglobal.net
                  </a>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Phone size={20} color="var(--color-gold-deep)" />
                <div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Direct Helpline</div>
                  <a
                    href="tel:+251-960-606-042"
                    style={{ color: 'var(--color-navy-dark)', fontWeight: 600, fontSize: '0.92rem' }}
                  >
                    +251 960 606 042
                  </a>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <MapPin size={20} color="var(--color-gold-deep)" />
                <div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Headquarters</div>
                  <span style={{ color: 'var(--color-navy-dark)', fontWeight: 600, fontSize: '0.92rem' }}>
                    Addis Ababa, Ethiopia
                  </span>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>

      {/* Render Shared Footer with onNavigate */}
      <Footer onNavigate={onNavigate} />
    </div>
  );
};
