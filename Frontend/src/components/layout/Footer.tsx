import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer
      style={{
        backgroundColor: 'var(--color-navy-dark)',
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
          {/* Col 1: Brand & Mission */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <img
              src="/assets/brand/vector/ods-logo-gold-primary.svg"
              alt="ODS Global Network"
              style={{ height: '44px', objectFit: 'contain', alignSelf: 'flex-start' }}
            />
            <p style={{ fontSize: '0.9rem', lineHeight: '1.6', color: 'var(--color-text-muted-dark)' }}>
              ODS Global Network is the premier digital ecosystem uniting accredited healthcare providers, diagnostic centers, wellness retreats, and rapid ambulance response into one verified network.
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span
                style={{
                  display: 'inline-block',
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--color-success)',
                }}
              />
              <span style={{ fontSize: '0.85rem', color: 'var(--color-gold-highlight)' }}>
                PCI-DSS & HIPAA Compliant Architecture
              </span>
            </div>
          </div>

          {/* Col 2: Services & Providers */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <h4 style={{ color: 'var(--color-gold-bright)', fontSize: '1rem' }}>Provider Categories</h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.9rem' }}>
              <li>Hospitals & Diagnostic Clinics</li>
              <li>Pharmacies & Prescription Delivery</li>
              <li>Wellness Centers & Therapeutic Spas</li>
              <li>24/7 Rapid Ambulance Services</li>
              <li>At-Home Nursing & Care</li>
            </ul>
          </div>

          {/* Col 3: Wanaw Ecosystem */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <h4 style={{ color: 'var(--color-gold-bright)', fontSize: '1rem' }}>Ecosystem & Portals</h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.9rem' }}>
              <li>Customer Appointment Engine</li>
              <li>Merchant Onboarding & KYC</li>
              <li>Wanaw Digital Gift Cards</li>
              <li>Provider Availability Scheduling</li>
              <li>Executive Operations Dashboard</li>
            </ul>
          </div>

          {/* Col 4: Strategic Partners */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <h4 style={{ color: 'var(--color-gold-bright)', fontSize: '1rem' }}>Strategic Partners</h4>
            <p style={{ fontSize: '0.85rem' }}>Integrated with verified banking, telecom, and settlement gateways:</p>
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
          <p>© {new Date().getFullYear()} ODS Global Network. All rights reserved.</p>
          <div style={{ display: 'flex', gap: '20px' }}>
            <span>Security Directives</span>
            <span>Privacy Policy</span>
            <span>Provider Compliance</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
export default Footer;
