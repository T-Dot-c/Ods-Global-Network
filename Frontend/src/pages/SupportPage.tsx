import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Phone,
  Mail,
  Send,
  MessageSquare,
  HelpCircle,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
} from 'lucide-react';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Footer } from '../components/layout/Footer';
import { submitSupportRequest } from '../services/publicService';

interface SupportPageProps {
  onNavigate: (view: string) => void;
}

export const SupportPage: React.FC<SupportPageProps> = ({ onNavigate }) => {
  useEffect(() => {
    document.title = 'Customer Support & Help Center | ODS Global Network';
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute(
        'content',
        'Contact ODS Global Network customer care, submit an inquiry, and find answers to frequently asked questions.'
      );
    }
  }, []);

  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [website, setWebsite] = useState(''); // Bot honeypot

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [submittedRef, setSubmittedRef] = useState<string | null>(null);

  // FAQ Accordion State
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const faqs = [
    {
      q: 'What is ODS Global Network?',
      a: 'ODS Global Network is an integrated digital platform connecting individuals, diaspora families, healthcare and wellness providers, and commercial merchants.',
    },
    {
      q: 'How do I get started or create an account?',
      a: 'You can create an account by clicking Get Started in the top navigation, where you can register as a customer, merchant, or service provider.',
    },
    {
      q: 'How can I reach the ODS Global Network team?',
      a: 'You can submit an inquiry using the contact form on this page, email us directly at info@odsglobal.net, call +251 960 606 042, or connect via Telegram and WhatsApp.',
    },
    {
      q: 'What services will be available through the network?',
      a: 'The platform network connects users across 9 categories, including hospitals, clinics, pharmacies, diagnostic laboratories, wellness centers, and home care services.',
    },
    {
      q: 'How do I inquire about partnerships or corporate packages?',
      a: 'You can reach out directly via our contact form or visit the Partner With Us page to submit an investment, strategic partnership, or sponsorship inquiry.',
    },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!name.trim() || !email.trim() || !subject.trim() || !message.trim()) {
      setErrorMessage('Please fill in all required fields.');
      return;
    }

    setLoading(true);
    const res = await submitSupportRequest({
      name: name.trim(),
      email: email.trim(),
      subject: subject.trim(),
      message: message.trim(),
      website: website.trim(),
    });
    setLoading(false);

    if (res.success && res.reference) {
      setSubmittedRef(res.reference);
      setName('');
      setEmail('');
      setSubject('');
      setMessage('');
      setWebsite('');
    } else {
      setErrorMessage(res.message || 'Unable to submit support request. Please try again.');
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

      {/* ── Header Intro ─────────────────────────────────────────── */}
      <section style={{ padding: '56px 0 36px', textAlign: 'center', borderBottom: '1px solid var(--color-border-dark)' }}>
        <div className="container" style={{ maxWidth: '780px' }}>
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
            <HelpCircle size={16} />
            <span>CUSTOMER CARE &amp; INQUIRIES</span>
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
            Support &amp; Help Center
          </h1>
          <p style={{ color: 'var(--color-text-muted-dark)', fontSize: '1.02rem', lineHeight: 1.6, margin: 0 }}>
            Have a question or require assistance with your account? Connect with our team through direct channels or submit an inquiry below.
          </p>
        </div>
      </section>

      {/* ── Direct Channels Bar ──────────────────────────────────── */}
      <section style={{ padding: '32px 0', borderBottom: '1px solid var(--color-border-dark)', backgroundColor: 'color-mix(in srgb, var(--color-navy) 40%, transparent)' }}>
        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
            <a
              href="tel:+251-960-606-042"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '16px',
                borderRadius: '10px',
                backgroundColor: 'color-mix(in srgb, var(--color-card-dark) 80%, transparent)',
                border: '1px solid var(--color-border-dark)',
                textDecoration: 'none',
                color: 'var(--color-white)',
                transition: 'border-color var(--transition-fast)',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--color-gold-mid)')}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--color-border-dark)')}
            >
              <div style={{ color: 'var(--color-gold-bright)' }}><Phone size={20} /></div>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted-dark)', textTransform: 'uppercase' }}>Phone Support</div>
                <div style={{ fontSize: '0.92rem', fontWeight: 600 }}>+251 960 606 042</div>
              </div>
            </a>

            <a
              href="mailto:info@odsglobal.net"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '16px',
                borderRadius: '10px',
                backgroundColor: 'color-mix(in srgb, var(--color-card-dark) 80%, transparent)',
                border: '1px solid var(--color-border-dark)',
                textDecoration: 'none',
                color: 'var(--color-white)',
                transition: 'border-color var(--transition-fast)',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--color-gold-mid)')}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--color-border-dark)')}
            >
              <div style={{ color: 'var(--color-gold-bright)' }}><Mail size={20} /></div>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted-dark)', textTransform: 'uppercase' }}>Official Email</div>
                <div style={{ fontSize: '0.92rem', fontWeight: 600 }}>info@odsglobal.net</div>
              </div>
            </a>

            <a
              href="https://t.me/+251960606042"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '16px',
                borderRadius: '10px',
                backgroundColor: 'color-mix(in srgb, var(--color-card-dark) 80%, transparent)',
                border: '1px solid var(--color-border-dark)',
                textDecoration: 'none',
                color: 'var(--color-white)',
                transition: 'border-color var(--transition-fast)',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--color-gold-mid)')}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--color-border-dark)')}
            >
              <div style={{ color: 'var(--color-gold-bright)' }}><Send size={20} /></div>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted-dark)', textTransform: 'uppercase' }}>Telegram</div>
                <div style={{ fontSize: '0.92rem', fontWeight: 600 }}>@odsglobalnet</div>
              </div>
            </a>

            <a
              href="https://wa.me/251960606042"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '16px',
                borderRadius: '10px',
                backgroundColor: 'color-mix(in srgb, var(--color-card-dark) 80%, transparent)',
                border: '1px solid var(--color-border-dark)',
                textDecoration: 'none',
                color: 'var(--color-white)',
                transition: 'border-color var(--transition-fast)',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--color-gold-mid)')}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--color-border-dark)')}
            >
              <div style={{ color: 'var(--color-gold-bright)' }}><MessageSquare size={20} /></div>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted-dark)', textTransform: 'uppercase' }}>WhatsApp</div>
                <div style={{ fontSize: '0.92rem', fontWeight: 600 }}>Direct Messaging</div>
              </div>
            </a>
          </div>
        </div>
      </section>

      {/* ── Main Content: Form + FAQ ─────────────────────────────── */}
      <section style={{ padding: '64px 0', flex: 1 }}>
        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '48px', alignItems: 'start' }}>
            {/* Left: Contact Form */}
            <div
              style={{
                backgroundColor: 'color-mix(in srgb, var(--color-card-dark) 95%, transparent)',
                border: '1px solid var(--color-border-dark)',
                borderRadius: '16px',
                padding: '36px',
                boxShadow: 'var(--shadow-card-dark)',
              }}
            >
              <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.4rem', color: 'var(--color-white)', marginTop: 0, marginBottom: '8px' }}>
                Submit a Support Request
              </h2>
              <p style={{ color: 'var(--color-text-muted-dark)', fontSize: '0.9rem', marginBottom: '24px' }}>
                Please provide detailed information so we can document your inquiry accurately.
              </p>

              {submittedRef && (
                <div
                  style={{
                    backgroundColor: 'color-mix(in srgb, var(--color-success) 14%, transparent)',
                    border: '1px solid var(--color-success)',
                    borderRadius: '12px',
                    padding: '20px',
                    marginBottom: '24px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                  }}
                  role="status"
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--color-success)', fontWeight: 600 }}>
                    <CheckCircle2 size={20} />
                    <span>Inquiry Logged Successfully</span>
                  </div>
                  <p style={{ color: 'var(--color-white)', fontSize: '0.92rem', lineHeight: 1.5, margin: 0 }}>
                    Your support request has been received. Your tracking reference is{' '}
                    <strong style={{ color: 'var(--color-gold-bright)', letterSpacing: '0.04em' }}>{submittedRef}</strong>.
                  </p>
                  <p style={{ color: 'var(--color-text-muted-dark)', fontSize: '0.85rem', margin: 0 }}>
                    For urgent matters, please contact us at +251 960 606 042 or info@odsglobal.net.
                  </p>
                  <button
                    type="button"
                    onClick={() => setSubmittedRef(null)}
                    style={{
                      alignSelf: 'flex-start',
                      marginTop: '6px',
                      background: 'none',
                      border: 'none',
                      color: 'var(--color-gold-bright)',
                      fontSize: '0.82rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      padding: 0,
                    }}
                  >
                    Submit another request &rarr;
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

              {!submittedRef && (
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                  {/* Honeypot field (hidden from legitimate users) */}
                  <div style={{ display: 'none' }} aria-hidden="true">
                    <label htmlFor="website-hp">Website</label>
                    <input
                      id="website-hp"
                      type="text"
                      name="website"
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                      tabIndex={-1}
                      autoComplete="off"
                    />
                  </div>

                  <Input
                    label="Full Name *"
                    placeholder="Enter your full name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    maxLength={128}
                    required
                  />

                  <Input
                    label="Email Address *"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    maxLength={255}
                    required
                  />

                  <Input
                    label="Subject *"
                    placeholder="Brief description of your inquiry"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    maxLength={200}
                    required
                  />

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '0.88rem', fontWeight: 500, color: 'var(--color-border-light)' }}>
                      Message *
                    </label>
                    <textarea
                      rows={5}
                      placeholder="Please explain how our team can help you..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      maxLength={2000}
                      required
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
                      {message.length} / 2000
                    </div>
                  </div>

                  <Button type="submit" variant="gold" fullWidth disabled={loading}>
                    {loading ? 'Submitting...' : 'Send Support Request'}
                  </Button>
                </form>
              )}
            </div>

            {/* Right: Truthful FAQs */}
            <div>
              <div style={{ marginBottom: '24px' }}>
                <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.4rem', color: 'var(--color-white)', margin: '0 0 8px' }}>
                  Frequently Asked Questions
                </h2>
                <p style={{ color: 'var(--color-text-muted-dark)', fontSize: '0.9rem', margin: 0 }}>
                  General information about ODS Global Network platform access and communication channels.
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {faqs.map((faq, idx) => {
                  const isOpen = expandedFaq === idx;
                  return (
                    <div
                      key={idx}
                      style={{
                        backgroundColor: 'color-mix(in srgb, var(--color-card-dark) 80%, transparent)',
                        border: `1px solid ${isOpen ? 'var(--color-gold-mid)' : 'var(--color-border-dark)'}`,
                        borderRadius: '12px',
                        overflow: 'hidden',
                        transition: 'border-color var(--transition-fast)',
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => setExpandedFaq(isOpen ? null : idx)}
                        style={{
                          width: '100%',
                          padding: '16px 20px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          background: 'none',
                          border: 'none',
                          color: isOpen ? 'var(--color-gold-bright)' : 'var(--color-white)',
                          fontWeight: 600,
                          fontSize: '0.95rem',
                          textAlign: 'left',
                          cursor: 'pointer',
                        }}
                        aria-expanded={isOpen}
                      >
                        <span>{faq.q}</span>
                        <ChevronDown
                          size={18}
                          style={{
                            transform: isOpen ? 'rotate(180deg)' : 'none',
                            transition: 'transform 0.2s ease',
                            color: 'var(--color-gold-mid)',
                            flexShrink: 0,
                            marginLeft: '12px',
                          }}
                        />
                      </button>
                      {isOpen && (
                        <div style={{ padding: '0 20px 18px', color: 'var(--color-text-muted-dark)', fontSize: '0.9rem', lineHeight: 1.6 }}>
                          {faq.a}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────── */}
      <Footer onNavigate={onNavigate} />
    </div>
  );
};

export default SupportPage;
