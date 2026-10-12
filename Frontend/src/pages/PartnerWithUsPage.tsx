import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Briefcase,
  Handshake,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Award,
  Upload,
  FileText,
  X,
  Loader2,
} from 'lucide-react';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Footer } from '../components/layout/Footer';
import { submitPartnerRequest, uploadStagingDocument } from '../services/publicService';

interface PartnerWithUsPageProps {
  onNavigate: (view: string) => void;
}

type PartnershipTrack = 'investor' | 'strategic_partner' | 'sponsorship';

export const PartnerWithUsPage: React.FC<PartnerWithUsPageProps> = ({ onNavigate }) => {
  useEffect(() => {
    document.title = 'Partner With Us | ODS Global Network';
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute(
        'content',
        'Partner with ODS Global Network as an investor, strategic healthcare partner, or institutional sponsor.'
      );
    }
  }, []);

  const [track, setTrack] = useState<PartnershipTrack>('investor');

  // Form Fields
  const [name, setName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [sector, setSector] = useState('Healthcare');
  const [investmentType, setInvestmentType] = useState('Equity');
  const [enquiry, setEnquiry] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState(''); // Bot honeypot

  // Staging Proposal Document State
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [stagingToken, setStagingToken] = useState<string | null>(null);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [docError, setDocError] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const sectors = [
    'Healthcare',
    'Technology',
    'Finance',
    'Hospitality & Tourism',
    'Manufacturing',
    'Real Estate',
    'Education',
    'Agriculture',
    'Media & Entertainment',
    'Construction',
  ];

  const investmentTypes = ['Equity', 'Debt', 'Convertible Bonds'];

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setDocError(null);

    // Validate size (5 MB limit for anonymous staging)
    if (file.size > 5 * 1024 * 1024) {
      setDocError('Document exceeds maximum allowed size of 5 MB.');
      return;
    }

    const allowedTypes = ['application/pdf', 'image/png', 'image/jpeg'];
    if (!allowedTypes.includes(file.type)) {
      setDocError('Only PDF, PNG, or JPEG documents are permitted.');
      return;
    }

    setUploadingDoc(true);
    const res = await uploadStagingDocument(file);
    setUploadingDoc(false);

    if (res.success && res.staging_token) {
      setUploadedFile(file);
      setStagingToken(res.staging_token);
    } else {
      setDocError(res.message || 'Failed to upload proposal document.');
    }
  };

  const removeUploadedFile = () => {
    setUploadedFile(null);
    setStagingToken(null);
    setDocError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!name.trim() || !companyName.trim() || !email.trim() || !phone.trim()) {
      setErrorMessage('Please fill in all required contact details.');
      return;
    }

    setLoading(true);
    const res = await submitPartnerRequest({
      partnership_type: track,
      name: name.trim(),
      company_name: companyName.trim(),
      email: email.trim(),
      phone: phone.trim(),
      whatsapp: whatsapp.trim() || undefined,
      sector: track === 'sponsorship' ? undefined : sector,
      investment_type: track === 'investor' ? investmentType : undefined,
      enquiry: enquiry.trim() || undefined,
      website_url: websiteUrl.trim(),
      staging_token: stagingToken || undefined,
    });
    setLoading(false);

    if (res.success) {
      setIsSuccess(true);
      setName('');
      setCompanyName('');
      setEmail('');
      setPhone('');
      setWhatsapp('');
      setEnquiry('');
      setWebsiteUrl('');
      setUploadedFile(null);
      setStagingToken(null);
      setDocError(null);
    } else {
      setErrorMessage(res.message || 'Failed to submit partnership inquiry. Please try again.');
    }
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

      {/* ── Hero ─────────────────────────────────────────────────── */}
      <section style={{ padding: '56px 0 36px', textAlign: 'center', borderBottom: '1px solid var(--color-border-dark)' }}>
        <div className="container" style={{ maxWidth: '820px' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 16px',
              borderRadius: '20px',
              backgroundColor: 'color-mix(in srgb, var(--color-gold-bright) 12%, transparent)',
              color: 'var(--color-gold-bright)',
              fontSize: '0.85rem',
              fontWeight: 600,
              marginBottom: '16px',
            }}
          >
            <Handshake size={16} />
            <span>STRATEGIC COLLABORATION</span>
          </div>
          <h1
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: 'clamp(2rem, 3.8vw, 2.6rem)',
              color: 'var(--color-white)',
              margin: '0 0 16px',
              fontWeight: 700,
            }}
          >
            Invest &amp; Partner With Us
          </h1>
          <p style={{ color: 'var(--color-text-muted-dark)', fontSize: '1.02rem', lineHeight: 1.6, margin: 0 }}>
            Join our mission to transform healthcare and digital wellness across Africa. Select your preferred collaboration track below.
          </p>
        </div>
      </section>

      {/* ── Form Section ─────────────────────────────────────────── */}
      <section style={{ padding: '56px 0 72px', flex: 1 }}>
        <div className="container" style={{ maxWidth: '780px' }}>
          {/* Tab Selector */}
          <div
            role="tablist"
            aria-label="Partnership Tracks"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '8px',
              backgroundColor: 'color-mix(in srgb, var(--color-card-dark) 90%, transparent)',
              padding: '6px',
              borderRadius: '12px',
              border: '1px solid var(--color-border-dark)',
              marginBottom: '32px',
            }}
          >
            <button
              type="button"
              role="tab"
              aria-selected={track === 'investor'}
              onClick={() => { setTrack('investor'); setIsSuccess(false); setErrorMessage(null); }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '12px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: track === 'investor' ? 'var(--color-gold-deep)' : 'transparent',
                color: track === 'investor' ? 'var(--color-navy-dark)' : 'var(--color-border-light)',
                fontWeight: 600,
                fontSize: '0.92rem',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <TrendingUp size={16} />
              <span>Investor</span>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={track === 'strategic_partner'}
              onClick={() => { setTrack('strategic_partner'); setIsSuccess(false); setErrorMessage(null); }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '12px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: track === 'strategic_partner' ? 'var(--color-gold-deep)' : 'transparent',
                color: track === 'strategic_partner' ? 'var(--color-navy-dark)' : 'var(--color-border-light)',
                fontWeight: 600,
                fontSize: '0.92rem',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <Briefcase size={16} />
              <span>Strategic Partner</span>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={track === 'sponsorship'}
              onClick={() => { setTrack('sponsorship'); setIsSuccess(false); setErrorMessage(null); }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '12px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: track === 'sponsorship' ? 'var(--color-gold-deep)' : 'transparent',
                color: track === 'sponsorship' ? 'var(--color-navy-dark)' : 'var(--color-border-light)',
                fontWeight: 600,
                fontSize: '0.92rem',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <Award size={16} />
              <span>Sponsorship</span>
            </button>
          </div>

          {/* Form Card */}
          <div
            style={{
              backgroundColor: 'color-mix(in srgb, var(--color-card-dark) 95%, transparent)',
              border: '1px solid var(--color-border-dark)',
              borderRadius: '16px',
              padding: '36px',
              boxShadow: 'var(--shadow-card-dark)',
            }}
          >
            <div style={{ marginBottom: '24px' }}>
              <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.35rem', color: 'var(--color-white)', margin: '0 0 6px' }}>
                {track === 'investor' && 'Investment Collaboration'}
                {track === 'strategic_partner' && 'Strategic Provider Partnership'}
                {track === 'sponsorship' && 'Institutional Sponsorship'}
              </h2>
              <p style={{ color: 'var(--color-text-muted-dark)', fontSize: '0.88rem', margin: 0 }}>
                {track === 'investor' && 'Submit an expression of interest for equity, debt, or strategic capital participation.'}
                {track === 'strategic_partner' && 'Integrate your healthcare organization, clinic, or corporate enterprise into our network.'}
                {track === 'sponsorship' && 'Sponsor wellness initiatives, patient programs, or diaspora healthcare packages.'}
              </p>
            </div>

            {isSuccess && (
              <div
                style={{
                  backgroundColor: 'color-mix(in srgb, var(--color-success) 14%, transparent)',
                  border: '1px solid var(--color-success)',
                  borderRadius: '12px',
                  padding: '24px',
                  marginBottom: '24px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                }}
                role="status"
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--color-success)', fontWeight: 600 }}>
                  <CheckCircle2 size={20} />
                  <span>Partnership Inquiry Received</span>
                </div>
                <p style={{ color: 'var(--color-white)', fontSize: '0.92rem', lineHeight: 1.5, margin: 0 }}>
                  Your partnership inquiry has been received. For urgent matters, please contact us at +251 960 606 042 or info@odsglobal.net.
                </p>
                <button
                  type="button"
                  onClick={() => setIsSuccess(false)}
                  style={{
                    alignSelf: 'flex-start',
                    background: 'none',
                    border: 'none',
                    color: 'var(--color-gold-bright)',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    padding: 0,
                    marginTop: '4px',
                  }}
                >
                  Submit another inquiry &rarr;
                </button>
              </div>
            )}

            {errorMessage && (
              <div
                style={{
                  backgroundColor: 'color-mix(in srgb, var(--color-danger) 14%, transparent)',
                  border: '1px solid var(--color-danger)',
                  borderRadius: '10px',
                  padding: '14px',
                  marginBottom: '20px',
                  color: '#fca5a5',
                  fontSize: '0.88rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                }}
                role="alert"
              >
                <AlertCircle size={18} />
                <span>{errorMessage}</span>
              </div>
            )}

            {!isSuccess && (
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                {/* Honeypot field (hidden from legitimate users) */}
                <div style={{ display: 'none' }} aria-hidden="true">
                  <label htmlFor="website_url-hp">Website URL</label>
                  <input
                    id="website_url-hp"
                    type="text"
                    name="website_url"
                    value={websiteUrl}
                    onChange={(e) => setWebsiteUrl(e.target.value)}
                    tabIndex={-1}
                    autoComplete="off"
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
                  <Input
                    label="Contact Name *"
                    placeholder="Your full name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    maxLength={128}
                    required
                  />

                  <Input
                    label="Organization / Company Name *"
                    placeholder="Company or entity name"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    maxLength={128}
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
                  <Input
                    label="Official Email *"
                    type="email"
                    placeholder="corporate@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    maxLength={255}
                    required
                  />

                  <Input
                    label="Phone Number *"
                    placeholder="+251-911-000000"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    maxLength={50}
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
                  <Input
                    label="WhatsApp (Optional)"
                    placeholder="+251-911-000000"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    maxLength={50}
                  />

                  {track !== 'sponsorship' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontSize: '0.88rem', fontWeight: 500, color: 'var(--color-border-light)' }}>
                        Industry Sector
                      </label>
                      <select
                        value={sector}
                        onChange={(e) => setSector(e.target.value)}
                        style={{
                          backgroundColor: 'color-mix(in srgb, var(--color-white) 6%, transparent)',
                          border: '1px solid var(--color-border-dark)',
                          borderRadius: '8px',
                          padding: '10px 14px',
                          color: 'var(--color-white)',
                          fontSize: '0.92rem',
                          outline: 'none',
                        }}
                      >
                        {sectors.map((s, idx) => (
                          <option key={idx} value={s} style={{ backgroundColor: '#0f285b', color: '#fff' }}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                {track === 'investor' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '0.88rem', fontWeight: 500, color: 'var(--color-border-light)' }}>
                      Proposed Investment Type
                    </label>
                    <select
                      value={investmentType}
                      onChange={(e) => setInvestmentType(e.target.value)}
                      style={{
                        backgroundColor: 'color-mix(in srgb, var(--color-white) 6%, transparent)',
                        border: '1px solid var(--color-border-dark)',
                        borderRadius: '8px',
                        padding: '10px 14px',
                        color: 'var(--color-white)',
                        fontSize: '0.92rem',
                        outline: 'none',
                      }}
                    >
                      {investmentTypes.map((t, idx) => (
                        <option key={idx} value={t} style={{ backgroundColor: '#0f285b', color: '#fff' }}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.88rem', fontWeight: 500, color: 'var(--color-border-light)' }}>
                    Collaboration Details / Proposal Overview (Optional)
                  </label>
                  <textarea
                    rows={4}
                    placeholder="Briefly describe your objectives or partnership interest..."
                    value={enquiry}
                    onChange={(e) => setEnquiry(e.target.value)}
                    maxLength={2000}
                    style={{
                      backgroundColor: 'color-mix(in srgb, var(--color-white) 6%, transparent)',
                      border: '1px solid var(--color-border-dark)',
                      borderRadius: '8px',
                      padding: '12px 14px',
                      color: 'var(--color-white)',
                      fontSize: '0.92rem',
                      fontFamily: 'inherit',
                      resize: 'vertical',
                      outline: 'none',
                    }}
                  />
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted-dark)', textAlign: 'right' }}>
                    {enquiry.length} / 2000
                  </div>
                </div>

                {/* Proposal / Pitch Deck Upload (Staging Document) */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '0.88rem', fontWeight: 500, color: 'var(--color-border-light)' }}>
                    Proposal Document / Pitch Deck (Optional, max 5 MB)
                  </label>
                  
                  {!uploadedFile ? (
                    <div
                      style={{
                        border: '2px dashed var(--color-border-dark)',
                        borderRadius: '10px',
                        padding: '20px',
                        textAlign: 'center',
                        backgroundColor: 'rgba(255, 255, 255, 0.02)',
                        cursor: uploadingDoc ? 'not-allowed' : 'pointer',
                        transition: 'border-color 0.2s',
                        position: 'relative',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--color-gold-bright)')}
                      onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--color-border-dark)')}
                    >
                      <input
                        type="file"
                        accept=".pdf,.png,.jpg,.jpeg"
                        onChange={handleFileChange}
                        disabled={uploadingDoc}
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100%',
                          height: '100%',
                          opacity: 0,
                          cursor: 'pointer',
                        }}
                      />
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                        {uploadingDoc ? (
                          <>
                            <Loader2 size={24} color="var(--color-gold-bright)" className="animate-spin" />
                            <span style={{ fontSize: '0.88rem', color: 'var(--color-gold-bright)' }}>
                              Uploading & verifying proposal...
                            </span>
                          </>
                        ) : (
                          <>
                            <Upload size={24} color="var(--color-gold-bright)" />
                            <div>
                              <span style={{ fontSize: '0.88rem', color: 'var(--color-white)', fontWeight: 600 }}>
                                Click or drag proposal file here
                              </span>
                              <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted-dark)', marginTop: '2px' }}>
                                PDF, PNG, or JPEG formats up to 5 MB
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '12px 16px',
                        borderRadius: '8px',
                        backgroundColor: 'rgba(16, 185, 129, 0.1)',
                        border: '1px solid rgba(16, 185, 129, 0.3)',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <FileText size={20} color="#10b981" />
                        <div>
                          <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--color-white)' }}>
                            {uploadedFile.name}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: '#6ee7b7' }}>
                            {(uploadedFile.size / (1024 * 1024)).toFixed(2)} MB — Verified for attachment
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={removeUploadedFile}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#fca5a5',
                          cursor: 'pointer',
                          padding: '4px',
                          display: 'flex',
                          alignItems: 'center',
                        }}
                        title="Remove attached document"
                      >
                        <X size={18} />
                      </button>
                    </div>
                  )}

                  {docError && (
                    <div style={{ fontSize: '0.82rem', color: '#fca5a5', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <AlertCircle size={14} />
                      <span>{docError}</span>
                    </div>
                  )}
                </div>

                <Button type="submit" variant="gold" fullWidth disabled={loading || uploadingDoc}>
                  {loading ? 'Submitting Inquiry...' : 'Submit Partnership Inquiry'}
                </Button>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────── */}
      <Footer onNavigate={onNavigate} />
    </div>
  );
};

export default PartnerWithUsPage;
