import React from 'react';

export interface FooterProps {
  onNavigate?: (view: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  return (
    <footer
      id="contact"
      style={{
        backgroundColor: '#0f285b',
        borderTop: '1px solid var(--color-border-dark)',
        paddingTop: '64px',
        paddingBottom: '40px',
        color: 'var(--color-text-muted-dark)',
        marginTop: 'auto',
      }}
    >
      <div className="container">
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '40px',
            marginBottom: '48px',
          }}
        >
          {/* Col 1: Brand & Mission & Contact */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <img
              src="/assets/brand/vector/ods-logo-gold-primary.svg"
              alt="ODS Global Network"
              style={{ height: '44px', objectFit: 'contain', alignSelf: 'flex-start' }}
            />
            <p style={{ fontSize: '0.9rem', lineHeight: '1.6', color: 'var(--color-text-muted-dark)' }}>
              ODS Global Network Gifting is a digital platform connecting customers, merchants, and service providers across wellness, home care, medical clinics, and hospitality.
            </p>
            <p style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-gold-bright)', fontStyle: 'italic' }}>
              &ldquo;Ethiopian Blessings, Modern Gifting&rdquo;
            </p>
            <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted-dark)', lineHeight: '1.6' }}>
              <div>Addis Ababa, Ethiopia</div>
              <div>Tel: <a href="tel:+251-960-606-042" style={{ color: 'var(--color-gold-bright)' }}>+251 960 606 042</a></div>
              <div>Email: <a href="mailto:info@odsglobal.net" style={{ color: 'var(--color-gold-bright)' }}>info@odsglobal.net</a></div>
            </div>
          </div>

          {/* Col 2: Services & Providers */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <h4 style={{ color: 'var(--color-gold-bright)', fontSize: '1rem' }}>Provider Categories</h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.88rem' }}>
              <li>Hospitals</li>
              <li>Clinics &amp; Urgent Care</li>
              <li>Pharmacies</li>
              <li>Laboratories &amp; Pathology</li>
              <li>Wellness Centers &amp; Spas</li>
              <li>24/7 Ambulance Services</li>
              <li>Home Care &amp; Nursing</li>
              <li>Specialists &amp; Consultants</li>
              <li>Diagnostic &amp; Imaging Centers</li>
            </ul>
          </div>

          {/* Col 3: ODS Global Network Ecosystem */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <h4 style={{ color: 'var(--color-gold-bright)', fontSize: '1rem' }}>Ecosystem &amp; Portals</h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.88rem' }}>
              <li>Customer Appointment Engine</li>
              <li>Merchant Registration &amp; KYC</li>
              <li>ODS Digital Gift Cards &amp; Vouchers</li>
              <li>Service Provider Scheduling</li>
              <li>Executive Operations Dashboard</li>
              <li>Diaspora &amp; Community Initiatives</li>
            </ul>
          </div>

          {/* Col 4: Strategic Partners */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <h4 style={{ color: 'var(--color-gold-bright)', fontSize: '1rem' }}>Strategic Partners</h4>
            <p style={{ fontSize: '0.85rem' }}>Planned integrations with banking, telecom, and settlement partners:</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center', marginTop: '6px' }}>
              <div
                style={{
                  background: '#ffffff',
                  padding: '6px 12px',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <img src="/assets/brand/partners/chapa.png" alt="Chapa" style={{ height: '22px' }} />
              </div>
              <div
                style={{
                  background: '#ffffff',
                  padding: '6px 12px',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <img src="/assets/brand/partners/ethiotel.png" alt="Ethio Telecom" style={{ height: '22px' }} />
              </div>
              <div
                style={{
                  background: '#ffffff',
                  padding: '6px 12px',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <img src="/assets/brand/partners/capital-bank.png" alt="Capital Bank" style={{ height: '22px' }} />
              </div>
            </div>
          </div>
        </div>

        {/* Bottom divider */}
        <div
          style={{
            borderTop: '1px solid rgba(27, 59, 117, 0.6)',
            paddingTop: '24px',
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '0.85rem',
            gap: '12px',
          }}
        >
          <p>© {new Date().getFullYear()} ODS Global Network Health &amp; Wellness. All rights reserved.</p>
          <div style={{ display: 'flex', gap: '18px', color: 'var(--color-text-muted-dark)', fontSize: '0.82rem' }}>
            <span>Privacy Policy</span>
            <span>•</span>
            <button
              type="button"
              onClick={() => onNavigate?.('terms')}
              style={{
                background: 'none',
                border: 'none',
                color: 'inherit',
                font: 'inherit',
                cursor: 'pointer',
                padding: 0,
                textDecoration: 'none',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-gold-bright)')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'inherit')}
            >
              Terms &amp; Conditions
            </button>
            <span>•</span>
            <button
              type="button"
              onClick={() => onNavigate?.('support')}
              style={{
                background: 'none',
                border: 'none',
                color: 'inherit',
                font: 'inherit',
                cursor: 'pointer',
                padding: 0,
                textDecoration: 'none',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-gold-bright)')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'inherit')}
            >
              Help Center
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};
export default Footer;
