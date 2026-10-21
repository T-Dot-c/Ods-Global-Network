import React, { useState, useEffect } from 'react';
import {
  CheckCircle,
  Printer,
  Copy,
  Wallet,
  ShieldCheck,
  AlertCircle,
  Search,
  Sparkles,
  Building,
  Calendar,
  Lock,
} from 'lucide-react';
import QRCode from 'qrcode';
import { getPublicGiftCard, redeemGiftCard, PublicGiftCard } from '../services/giftingService';
import { useAuth } from '../context/AuthContext';

interface GiftClaimPageProps {
  onNavigate: (view: string) => void;
}

export const GiftClaimPage: React.FC<GiftClaimPageProps> = ({ onNavigate }) => {
  const { user } = useAuth();

  // URL query code param extraction
  const getInitialCode = (): string => {
    const params = new URLSearchParams(window.location.search);
    return params.get('code') || params.get('claim') || '';
  };

  const [inputCode, setInputCode] = useState<string>(getInitialCode);
  const [currentCode, setCurrentCode] = useState<string>(getInitialCode);
  const [card, setCard] = useState<PublicGiftCard | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [redeeming, setRedeeming] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  // Fetch gift card details
  const fetchCardDetails = async (codeToFetch: string) => {
    if (!codeToFetch.trim()) {
      setCard(null);
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const data = await getPublicGiftCard(codeToFetch.trim());
      setCard(data);

      // Generate QR Code
      try {
        const qr = await QRCode.toDataURL(
          `${window.location.origin}/gift/claim?code=${encodeURIComponent(data.code)}`,
          {
            width: 200,
            margin: 1,
            color: {
              dark: '#0F285B',
              light: '#FFFFFF',
            },
          }
        );
        setQrDataUrl(qr);
      } catch (qrErr) {
        console.error('Failed to generate claim QR code:', qrErr);
      }
    } catch (err: any) {
      console.error('Failed to load public gift card:', err);
      setCard(null);
      setErrorMsg(err.message || 'Unable to find gift card with the provided code.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentCode) {
      fetchCardDetails(currentCode);
    }
  }, [currentCode]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputCode.trim()) return;
    const clean = inputCode.trim();
    setCurrentCode(clean);
    window.history.pushState(null, '', `/gift/claim?code=${encodeURIComponent(clean)}`);
  };

  const handleCopyCode = () => {
    if (!card?.code) return;
    navigator.clipboard.writeText(card.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleRedeemWallet = async () => {
    if (!card?.code) return;
    if (!user) {
      // Store pending redemption code in sessionStorage so user can redeem after login
      sessionStorage.setItem('ods_pending_claim_code', card.code);
      onNavigate('login');
      return;
    }

    setRedeeming(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await redeemGiftCard(card.code);
      setSuccessMsg(
        `Success! ${res.redeemedAmount.toLocaleString()} ${res.currency} has been added to your digital wallet balance.`
      );
      // Re-fetch card details to reflect 'redeemed' status
      await fetchCardDetails(card.code);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to redeem voucher into wallet.');
    } finally {
      setRedeeming(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#071228',
        color: '#f8fafc',
        fontFamily: "'Inter', sans-serif",
        padding: '40px 16px 80px 16px',
      }}
    >
      <style>{`
        @media print {
          body {
            background-color: #ffffff !important;
            color: #000000 !important;
          }
          .no-print {
            display: none !important;
          }
          .print-container {
            border: 2px solid #0F285B !important;
            box-shadow: none !important;
            page-break-inside: avoid;
            background: #ffffff !important;
            color: #000000 !important;
          }
        }
      `}</style>

      <div style={{ maxWidth: '840px', margin: '0 auto' }}>
        {/* Navigation Bar / Top Return */}
        <div
          className="no-print"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '32px',
          }}
        >
          <button
            onClick={() => onNavigate('home')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: 'transparent',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              fontSize: '0.9rem',
              fontWeight: 600,
            }}
          >
            ← Return to Home
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              style={{
                fontSize: '0.8rem',
                color: '#BE9B49',
                backgroundColor: 'rgba(190, 155, 73, 0.12)',
                border: '1px solid rgba(190, 155, 73, 0.3)',
                padding: '4px 12px',
                borderRadius: '9999px',
                fontWeight: 700,
                letterSpacing: '0.5px',
              }}
            >
              ODS VERIFIED VOUCHER
            </span>
          </div>
        </div>

        {/* Header Title */}
        <div className="no-print" style={{ textAlign: 'center', marginBottom: '36px' }}>
          <h1
            style={{
              fontSize: '2.2rem',
              fontWeight: 800,
              color: '#ffffff',
              letterSpacing: '-0.5px',
              margin: '0 0 10px 0',
            }}
          >
            Digital Gift & Voucher Claim Portal
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '1rem', margin: 0 }}>
            Present in clinic for healthcare services or credit directly to your digital wallet.
          </p>
        </div>

        {/* Code Search Input Bar (No-Print) */}
        <div
          className="no-print"
          style={{
            backgroundColor: 'rgba(15, 40, 91, 0.4)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(8px)',
            borderRadius: '14px',
            padding: '16px',
            marginBottom: '36px',
          }}
        >
          <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: '240px', position: 'relative' }}>
              <input
                type="text"
                placeholder="Enter claim code (e.g. ODS-GC-XXXX-XXXX)"
                value={inputCode}
                onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: '10px',
                  border: '1px solid #334155',
                  backgroundColor: '#0B1933',
                  color: '#ffffff',
                  fontSize: '0.95rem',
                  letterSpacing: '1px',
                  fontFamily: 'monospace',
                  boxSizing: 'border-box',
                  outline: 'none',
                }}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: '#BE9B49',
                color: '#071228',
                border: 'none',
                borderRadius: '10px',
                padding: '12px 24px',
                fontWeight: 700,
                fontSize: '0.95rem',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1,
                transition: 'all 0.2s',
              }}
            >
              <Search size={18} />
              {loading ? 'Verifying...' : 'Find Voucher'}
            </button>
          </form>
        </div>

        {/* Error Notification */}
        {errorMsg && (
          <div
            className="no-print"
            style={{
              backgroundColor: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid #ef4444',
              borderRadius: '10px',
              padding: '14px 18px',
              marginBottom: '28px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              color: '#fca5a5',
            }}
          >
            <AlertCircle size={20} color="#ef4444" style={{ flexShrink: 0 }} />
            <span style={{ fontSize: '0.9rem' }}>{errorMsg}</span>
          </div>
        )}

        {/* Success Notification */}
        {successMsg && (
          <div
            className="no-print"
            style={{
              backgroundColor: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid #10b981',
              borderRadius: '10px',
              padding: '14px 18px',
              marginBottom: '28px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              color: '#6ee7b7',
            }}
          >
            <CheckCircle size={20} color="#10b981" style={{ flexShrink: 0 }} />
            <span style={{ fontSize: '0.9rem' }}>{successMsg}</span>
          </div>
        )}

        {/* Voucher Presentation Card */}
        {card && (
          <div
            className="print-container"
            style={{
              backgroundColor: '#0d1f42',
              borderRadius: '18px',
              border: '2px solid rgba(190, 155, 73, 0.4)',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 30px rgba(190, 155, 73, 0.15)',
              overflow: 'hidden',
              marginBottom: '36px',
            }}
          >
            {/* Card Header Ribbon */}
            <div
              style={{
                background:
                  card.packageType === 'vip'
                    ? 'linear-gradient(135deg, #1e293b 0%, #0F285B 50%, #1e1b4b 100%)'
                    : 'linear-gradient(135deg, #0F285B 0%, #1e3a8a 100%)',
                borderBottom: '3px solid #BE9B49',
                padding: '28px 32px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '16px',
              }}
            >
              <div>
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    backgroundColor: 'rgba(190, 155, 73, 0.2)',
                    border: '1px solid #BE9B49',
                    borderRadius: '9999px',
                    padding: '3px 12px',
                    fontSize: '0.75rem',
                    fontWeight: 800,
                    color: '#fbbf24',
                    letterSpacing: '1px',
                    textTransform: 'uppercase',
                    marginBottom: '10px',
                  }}
                >
                  <Sparkles size={13} />
                  {card.packageType === 'vip' ? 'VIP LUXURY VOUCHER' : 'OFFICIAL HEALTH VOUCHER'}
                </div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.3px' }}>
                  ODS Global Network
                </div>
                <div style={{ fontSize: '0.85rem', color: '#cbd5e1', marginTop: '2px' }}>
                  Occasion: <strong style={{ color: '#ffffff' }}>{card.occasion}</strong>
                </div>
              </div>

              {/* Status Badge */}
              <div>
                <span
                  style={{
                    padding: '6px 14px',
                    borderRadius: '9999px',
                    fontSize: '0.8rem',
                    fontWeight: 800,
                    letterSpacing: '0.5px',
                    textTransform: 'uppercase',
                    backgroundColor:
                      card.status === 'active'
                        ? '#14532d'
                        : card.status === 'redeemed'
                        ? '#1e3a8a'
                        : card.status === 'delivered'
                        ? '#581c87'
                        : card.status === 'pending_payment'
                        ? '#78350f'
                        : '#7f1d1d',
                    color:
                      card.status === 'active'
                        ? '#86efac'
                        : card.status === 'redeemed'
                        ? '#93c5fd'
                        : card.status === 'delivered'
                        ? '#d8b4fe'
                        : card.status === 'pending_payment'
                        ? '#fde68a'
                        : '#fca5a5',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                  }}
                >
                  {card.status.replace('_', ' ')}
                </span>
              </div>
            </div>

            {/* Card Body */}
            <div style={{ padding: '32px' }}>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                  gap: '28px',
                  alignItems: 'center',
                }}
              >
                {/* Left Column: Details */}
                <div>
                  <div style={{ fontSize: '0.85rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '4px' }}>
                    {card.giftType === 'service' ? 'Healthcare Service Voucher' : 'Gift Value'}
                  </div>
                  <div
                    style={{
                      fontSize: card.giftType === 'service' ? '1.8rem' : '2.4rem',
                      fontWeight: 800,
                      color: '#ffffff',
                      marginBottom: '16px',
                      lineHeight: 1.2,
                    }}
                  >
                    {card.giftType === 'service'
                      ? card.serviceTitle || 'Accredited Healthcare Package'
                      : `${card.initialAmount.toLocaleString()} ${card.currency}`}
                  </div>

                  {card.providerName && (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        padding: '10px 14px',
                        borderRadius: '8px',
                        marginBottom: '16px',
                        color: '#cbd5e1',
                        fontSize: '0.9rem',
                      }}
                    >
                      <Building size={16} color="#BE9B49" />
                      <span>
                        Fulfillment Facility: <strong style={{ color: '#ffffff' }}>{card.providerName}</strong>
                      </span>
                    </div>
                  )}

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '20px' }}>
                    <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.04)', padding: '10px 14px', borderRadius: '8px' }}>
                      <div style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase' }}>Recipient</div>
                      <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#f8fafc', marginTop: '2px' }}>
                        {card.recipientName}
                      </div>
                    </div>

                    <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.04)', padding: '10px 14px', borderRadius: '8px' }}>
                      <div style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase' }}>Sender</div>
                      <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#f8fafc', marginTop: '2px' }}>
                        {card.senderName}
                      </div>
                    </div>
                  </div>

                  {/* Personal Message Note */}
                  {card.personalMessage && (
                    <div
                      style={{
                        backgroundColor: 'rgba(15, 40, 91, 0.6)',
                        borderLeft: '4px solid #BE9B49',
                        padding: '14px 18px',
                        borderRadius: '4px',
                        marginBottom: '20px',
                        fontStyle: 'italic',
                        color: '#e2e8f0',
                        fontSize: '0.95rem',
                        lineHeight: 1.5,
                      }}
                    >
                      "{card.personalMessage}"
                    </div>
                  )}

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#94a3b8', fontSize: '0.85rem' }}>
                    <Calendar size={15} />
                    <span>
                      Valid until: <strong style={{ color: '#ffffff' }}>{new Date(card.expiryDate).toLocaleDateString()}</strong>
                    </span>
                  </div>
                </div>

                {/* Right Column: Code & QR */}
                <div
                  style={{
                    backgroundColor: '#ffffff',
                    color: '#0F285B',
                    borderRadius: '14px',
                    padding: '24px',
                    textAlign: 'center',
                    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)',
                  }}
                >
                  <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b', letterSpacing: '1px', marginBottom: '8px' }}>
                    SECURE REDEMPTION CODE
                  </div>

                  <div
                    style={{
                      fontFamily: "'Courier New', monospace",
                      fontSize: '1.45rem',
                      fontWeight: 800,
                      letterSpacing: '2px',
                      color: '#0F285B',
                      backgroundColor: '#f8fafc',
                      border: '1px dashed #cbd5e1',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      marginBottom: '16px',
                    }}
                  >
                    {card.code}
                  </div>

                  {qrDataUrl && (
                    <div style={{ margin: '0 auto 16px auto', display: 'inline-block' }}>
                      <img
                        src={qrDataUrl}
                        alt="Voucher QR Code"
                        style={{
                          width: '160px',
                          height: '160px',
                          borderRadius: '8px',
                          border: '1px solid #e2e8f0',
                          padding: '6px',
                          backgroundColor: '#ffffff',
                        }}
                      />
                    </div>
                  )}

                  <div style={{ fontSize: '0.78rem', color: '#64748b', lineHeight: 1.4 }}>
                    Present this QR code or claim string at our accredited clinic or redeem below.
                  </div>
                </div>
              </div>

              {/* Action Buttons (No-Print) */}
              <div
                className="no-print"
                style={{
                  borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                  marginTop: '28px',
                  paddingTop: '24px',
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '12px',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  <button
                    onClick={handleCopyCode}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      backgroundColor: 'rgba(255, 255, 255, 0.08)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      color: '#ffffff',
                      padding: '10px 16px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '0.88rem',
                      fontWeight: 600,
                    }}
                  >
                    {copied ? <CheckCircle size={16} color="#10b981" /> : <Copy size={16} />}
                    {copied ? 'Code Copied!' : 'Copy Code'}
                  </button>

                  <button
                    onClick={handlePrint}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      backgroundColor: 'rgba(255, 255, 255, 0.08)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      color: '#ffffff',
                      padding: '10px 16px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '0.88rem',
                      fontWeight: 600,
                    }}
                  >
                    <Printer size={16} />
                    Print Voucher
                  </button>
                </div>

                {/* Claim / Redeem Action Button */}
                {card.isClaimable && (
                  <div>
                    {user ? (
                      <button
                        onClick={handleRedeemWallet}
                        disabled={redeeming}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          backgroundColor: '#059669',
                          color: '#ffffff',
                          border: 'none',
                          padding: '12px 24px',
                          borderRadius: '8px',
                          fontWeight: 700,
                          fontSize: '0.95rem',
                          cursor: redeeming ? 'not-allowed' : 'pointer',
                          opacity: redeeming ? 0.7 : 1,
                          boxShadow: '0 4px 12px rgba(5, 150, 105, 0.3)',
                        }}
                      >
                        <Wallet size={18} />
                        {redeeming ? 'Crediting Wallet...' : 'Redeem into Digital Wallet'}
                      </button>
                    ) : (
                      <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                        <button
                          onClick={() => {
                            sessionStorage.setItem('ods_pending_claim_code', card.code);
                            onNavigate('login');
                          }}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            backgroundColor: '#BE9B49',
                            color: '#071228',
                            border: 'none',
                            padding: '12px 20px',
                            borderRadius: '8px',
                            fontWeight: 700,
                            fontSize: '0.92rem',
                            cursor: 'pointer',
                          }}
                        >
                          <Lock size={16} />
                          Sign In to Redeem Wallet
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Informational Guidance Cards (No-Print) */}
        <div
          className="no-print"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '18px',
          }}
        >
          <div
            style={{
              backgroundColor: 'rgba(15, 40, 91, 0.3)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '12px',
              padding: '20px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <Building size={18} color="#BE9B49" />
              <div style={{ fontWeight: 700, color: '#ffffff', fontSize: '0.95rem' }}>In-Person Delivery</div>
            </div>
            <div style={{ color: '#94a3b8', fontSize: '0.85rem', lineHeight: 1.5 }}>
              Service vouchers can be presented directly at authorized ODS network partner clinics. Staff verify the code in-clinic before treatment.
            </div>
          </div>

          <div
            style={{
              backgroundColor: 'rgba(15, 40, 91, 0.3)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '12px',
              padding: '20px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <Wallet size={18} color="#BE9B49" />
              <div style={{ fontWeight: 700, color: '#ffffff', fontSize: '0.95rem' }}>Digital Wallet Credit</div>
            </div>
            <div style={{ color: '#94a3b8', fontSize: '0.85rem', lineHeight: 1.5 }}>
              Monetary gift cards convert instantly to your ODS customer digital wallet balance, usable toward any network medical service.
            </div>
          </div>

          <div
            style={{
              backgroundColor: 'rgba(15, 40, 91, 0.3)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '12px',
              padding: '20px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <ShieldCheck size={18} color="#BE9B49" />
              <div style={{ fontWeight: 700, color: '#ffffff', fontSize: '0.95rem' }}>Double-Spend Protected</div>
            </div>
            <div style={{ color: '#94a3b8', fontSize: '0.85rem', lineHeight: 1.5 }}>
              Cryptographically secured via unguessable claim hashes and atomic database locks for maximum patient financial safety.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GiftClaimPage;
