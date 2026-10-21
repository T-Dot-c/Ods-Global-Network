import React, { useState, useEffect } from 'react';
import {
  Gift,
  Wallet,
  Sparkles,
  Send,
  CheckCircle,
  Copy,
  Printer,
  X,
  AlertCircle,
  Clock,
  ShieldCheck,
  Award,
  CreditCard,
} from 'lucide-react';
import QRCode from 'qrcode';
import {
  GiftCard,
  WalletActivity,
  getWallet,
  getMyGiftCards,
  purchaseGiftCard,
  redeemGiftCard,
  checkGiftCard,
  CheckGiftCardResponse,
} from '../../../services/giftingService';

const OCCASIONS = [
  { id: 'Birthday', label: '🎂 Birthday Celebration' },
  { id: 'Wedding', label: '💍 Wedding & Melse' },
  { id: 'Graduation', label: '🎓 Academic Graduation' },
  { id: 'Enkutatash', label: '🌼 Enkutatash (Ethiopian New Year)' },
  { id: 'Genna', label: '✨ Genna (Christmas)' },
  { id: 'Fasika', label: '🕊️ Fasika (Easter)' },
  { id: 'Eid', label: '🌙 Eid al-Fitr / Eid al-Adha' },
  { id: 'Health', label: '🩺 Health Blessing & Recovery' },
  { id: 'Thank You', label: '🙏 Appreciation & Thank You' },
  { id: 'Celebration', label: '🎉 General Celebration' },
];

const PRESET_AMOUNTS = [500, 1000, 2500, 5000];

export const CustomerGiftingTab: React.FC = () => {
  // State: Data
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [currency, setCurrency] = useState<string>('ETB');
  const [walletActivity, setWalletActivity] = useState<WalletActivity[]>([]);
  const [sentCards, setSentCards] = useState<GiftCard[]>([]);
  const [receivedCards, setReceivedCards] = useState<GiftCard[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // State: Active Sub-tab
  const [activeSubTab, setActiveSubTab] = useState<'sent' | 'received' | 'activity'>('sent');

  // State: Modals
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState<boolean>(false);
  const [isRedeemModalOpen, setIsRedeemModalOpen] = useState<boolean>(false);
  const [isPreviewCardModalOpen, setIsPreviewCardModalOpen] = useState<boolean>(false);
  const [selectedCardForPrint, setSelectedCardForPrint] = useState<GiftCard | null>(null);
  const [printQrUrl, setPrintQrUrl] = useState<string>('');

  // State: Purchase Form
  const [purchaseForm, setPurchaseForm] = useState({
    amount: 1000,
    isCustomAmount: false,
    customAmount: '',
    giftType: 'monetary' as 'monetary' | 'service',
    packageType: 'vip' as 'vip' | 'basic',
    occasion: 'Birthday',
    serviceTitle: '',
    serviceCategory: 'General Wellness',
    recipientName: '',
    recipientEmail: '',
    recipientPhone: '',
    personalMessage: '',
    scheduledDeliveryDate: '',
    paymentMethod: 'wallet' as 'wallet' | 'chapa' | 'direct',
  });
  const [purchaseSubmitting, setPurchaseSubmitting] = useState<boolean>(false);

  // State: Redeem Form
  const [redeemCode, setRedeemCode] = useState<string>('');
  const [redeemChecking, setRedeemChecking] = useState<boolean>(false);
  const [redeemCheckResult, setRedeemCheckResult] = useState<CheckGiftCardResponse | null>(null);
  const [redeemSubmitting, setRedeemSubmitting] = useState<boolean>(false);

  // Initial load
  const loadGiftingData = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const [walletRes, cardsRes] = await Promise.all([
        getWallet(),
        getMyGiftCards(),
      ]);

      setWalletBalance(walletRes.balance);
      setCurrency(walletRes.currency);
      setWalletActivity(walletRes.activity);
      setSentCards(cardsRes.sent);
      setReceivedCards(cardsRes.received);
    } catch (err: any) {
      console.error('Failed to load gifting data:', err);
      setErrorMsg(err.message || 'Unable to load gifting records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGiftingData();
  }, []);

  // Open Printable Card Modal
  const handleOpenPrintModal = async (card: GiftCard) => {
    setSelectedCardForPrint(card);
    setIsPreviewCardModalOpen(true);
    if (card.code) {
      try {
        const qr = await QRCode.toDataURL(
          `${window.location.origin}/dashboard/customer?tab=gifting&claim=${encodeURIComponent(card.code)}`,
          { width: 160, margin: 1, color: { dark: '#0F285B', light: '#FFFFFF' } }
        );
        setPrintQrUrl(qr);
      } catch (e) {
        console.error('Failed to generate QR:', e);
      }
    }
  };

  // Handle Purchase Submit
  const handlePurchaseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPurchaseSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    const finalAmount = purchaseForm.isCustomAmount
      ? parseFloat(purchaseForm.customAmount)
      : purchaseForm.amount;

    if (isNaN(finalAmount) || finalAmount <= 0) {
      setErrorMsg('Please specify a valid gift amount.');
      setPurchaseSubmitting(false);
      return;
    }

    try {
      const res = await purchaseGiftCard({
        amount: finalAmount,
        currency: 'ETB',
        gift_type: purchaseForm.giftType,
        package_type: purchaseForm.packageType,
        occasion: purchaseForm.occasion,
        service_title: purchaseForm.giftType === 'service' ? purchaseForm.serviceTitle : undefined,
        service_category: purchaseForm.giftType === 'service' ? purchaseForm.serviceCategory : undefined,
        recipient_name: purchaseForm.recipientName.trim() || undefined,
        recipient_email: purchaseForm.recipientEmail.trim() || undefined,
        recipient_phone: purchaseForm.recipientPhone.trim() || undefined,
        personal_message: purchaseForm.personalMessage.trim() || undefined,
        scheduled_delivery_date: purchaseForm.scheduledDeliveryDate || undefined,
        payment_method: purchaseForm.paymentMethod,
      });

      if (res.paymentRequired && res.checkoutUrl) {
        if (res.txRef) {
          sessionStorage.setItem('ods_last_payment_tx_ref', res.txRef);
        }
        setSuccessMsg('Payment session created. Redirecting to Chapa checkout...');
        window.location.href = res.checkoutUrl;
        return;
      }

      if (res.paidViaWallet) {
        setSuccessMsg(
          `Gift Card created successfully and paid from your Digital Wallet! Remaining balance: ${res.newWalletBalance?.toLocaleString()} ETB.`
        );
      } else {
        setSuccessMsg(`Gift Card created successfully! Claim Code: ${res.giftCard?.code}`);
      }

      setIsPurchaseModalOpen(false);
      setPurchaseForm({
        amount: 1000,
        isCustomAmount: false,
        customAmount: '',
        giftType: 'monetary',
        packageType: 'vip',
        occasion: 'Birthday',
        serviceTitle: '',
        serviceCategory: 'General Wellness',
        recipientName: '',
        recipientEmail: '',
        recipientPhone: '',
        personalMessage: '',
        scheduledDeliveryDate: '',
        paymentMethod: 'wallet',
      });

      await loadGiftingData();
      if (res.giftCard) {
        handleOpenPrintModal(res.giftCard);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to complete gift card purchase.');
    } finally {
      setPurchaseSubmitting(false);
    }
  };

  // Handle Code Verification Check
  const handleCheckCode = async () => {
    if (!redeemCode.trim()) return;
    setRedeemChecking(true);
    setErrorMsg(null);
    setRedeemCheckResult(null);

    try {
      const checkRes = await checkGiftCard(redeemCode.trim());
      setRedeemCheckResult(checkRes);
    } catch (err: any) {
      setErrorMsg(err.message || 'This gift card code is invalid or has already been used.');
    } finally {
      setRedeemChecking(false);
    }
  };

  // Handle Redeem Submit
  const handleRedeemSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!redeemCode.trim()) return;
    setRedeemSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await redeemGiftCard(redeemCode.trim());
      setSuccessMsg(
        `Success! ${res.redeemedAmount.toLocaleString()} ${res.currency} has been added to your digital wallet. New balance: ${res.newWalletBalance.toLocaleString()} ${res.currency}.`
      );
      setIsRedeemModalOpen(false);
      setRedeemCode('');
      setRedeemCheckResult(null);
      await loadGiftingData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to redeem gift card.');
    } finally {
      setRedeemSubmitting(false);
    }
  };

  // Copy code helper
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setSuccessMsg(`Copied "${text}" to clipboard!`);
    setTimeout(() => setSuccessMsg(null), 3500);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* ── ALERTS ── */}
      {errorMsg && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            color: '#991b1b',
            borderRadius: '10px',
            padding: '14px 18px',
            fontSize: '0.9rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <AlertCircle size={18} />
            <span>{errorMsg}</span>
          </div>
          <button
            onClick={() => setErrorMsg(null)}
            style={{ background: 'none', border: 'none', color: '#991b1b', cursor: 'pointer' }}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {successMsg && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: '#f0fdf4',
            border: '1px solid #bbf7d0',
            color: '#166534',
            borderRadius: '10px',
            padding: '14px 18px',
            fontSize: '0.9rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <CheckCircle size={18} />
            <span>{successMsg}</span>
          </div>
          <button
            onClick={() => setSuccessMsg(null)}
            style={{ background: 'none', border: 'none', color: '#166534', cursor: 'pointer' }}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* ── WALLET BALANCE & ACTION BANNER ── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '20px',
        }}
      >
        {/* Wallet Card */}
        <div
          style={{
            background: 'linear-gradient(135deg, #0F285B 0%, #1e3a8a 60%, #0d1b3e 100%)',
            borderRadius: '16px',
            padding: '28px',
            color: '#ffffff',
            boxShadow: '0 10px 25px -5px rgba(15, 40, 91, 0.3)',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: '-30px',
              right: '-30px',
              width: '140px',
              height: '140px',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(212, 175, 55, 0.25) 0%, transparent 70%)',
              pointerEvents: 'none',
            }}
          />

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '10px',
                  backgroundColor: 'rgba(212, 175, 55, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px solid rgba(212, 175, 55, 0.4)',
                }}
              >
                <Wallet size={20} color="#fbbf24" />
              </div>
              <span style={{ fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px', color: '#cbd5e1', fontWeight: 600 }}>
                Customer Digital Wallet
              </span>
            </div>
            <span
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.12)',
                padding: '4px 10px',
                borderRadius: '9999px',
                fontSize: '0.75rem',
                color: '#fbbf24',
                fontWeight: 700,
                letterSpacing: '0.5px',
              }}
            >
              ACTIVE
            </span>
          </div>

          <div style={{ margin: '14px 0 20px' }}>
            <div style={{ fontSize: '0.85rem', color: '#94a3b8', marginBottom: '4px' }}>Available Balance</div>
            <div style={{ fontSize: '2.5rem', fontWeight: 800, letterSpacing: '-1px', color: '#ffffff' }}>
              {loading ? '...' : walletBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              <span style={{ fontSize: '1.2rem', fontWeight: 600, color: '#fbbf24', marginLeft: '8px' }}>
                {currency}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#94a3b8', fontSize: '0.82rem' }}>
            <ShieldCheck size={16} color="#34d399" />
            <span>Instant redeemable credit across all verified healthcare providers</span>
          </div>
        </div>

        {/* Action Buttons Box */}
        <div
          style={{
            backgroundColor: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '16px',
            padding: '24px 28px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            gap: '14px',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.04)',
          }}
        >
          <div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0F285B', margin: '0 0 6px 0' }}>
              Digital Gifting & Voucher Hub
            </h3>
            <p style={{ color: '#64748b', fontSize: '0.88rem', margin: 0, lineHeight: 1.5 }}>
              Send personalized wellness vouchers for celebrations and cultural holidays, or redeem received gift cards into your wallet balance.
            </p>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginTop: '8px' }}>
            <button
              onClick={() => setIsPurchaseModalOpen(true)}
              style={{
                flex: '1 1 180px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '12px 20px',
                borderRadius: '10px',
                backgroundColor: '#0F285B',
                color: '#ffffff',
                border: 'none',
                fontWeight: 700,
                fontSize: '0.9rem',
                cursor: 'pointer',
                boxShadow: '0 4px 10px rgba(15, 40, 91, 0.2)',
              }}
            >
              <Gift size={18} color="#fbbf24" />
              <span>Send Gift Card</span>
            </button>

            <button
              onClick={() => {
                setIsRedeemModalOpen(true);
                setRedeemCheckResult(null);
                setRedeemCode('');
              }}
              style={{
                flex: '1 1 180px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '12px 20px',
                borderRadius: '10px',
                backgroundColor: '#f8fafc',
                color: '#0F285B',
                border: '1px solid #cbd5e1',
                fontWeight: 700,
                fontSize: '0.9rem',
                cursor: 'pointer',
              }}
            >
              <Sparkles size={18} color="#d97706" />
              <span>Redeem Voucher</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── SUB-TABS NAVIGATION ── */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          borderBottom: '2px solid #e2e8f0',
          paddingBottom: '2px',
        }}
      >
        <button
          onClick={() => setActiveSubTab('sent')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 18px',
            border: 'none',
            background: 'none',
            borderBottom: activeSubTab === 'sent' ? '3px solid #0F285B' : '3px solid transparent',
            color: activeSubTab === 'sent' ? '#0F285B' : '#64748b',
            fontWeight: activeSubTab === 'sent' ? 700 : 500,
            fontSize: '0.92rem',
            cursor: 'pointer',
            marginBottom: '-2px',
          }}
        >
          <Send size={16} />
          <span>Sent Gift Cards ({sentCards.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('received')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 18px',
            border: 'none',
            background: 'none',
            borderBottom: activeSubTab === 'received' ? '3px solid #0F285B' : '3px solid transparent',
            color: activeSubTab === 'received' ? '#0F285B' : '#64748b',
            fontWeight: activeSubTab === 'received' ? 700 : 500,
            fontSize: '0.92rem',
            cursor: 'pointer',
            marginBottom: '-2px',
          }}
        >
          <Gift size={16} />
          <span>Received Gifts ({receivedCards.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('activity')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 18px',
            border: 'none',
            background: 'none',
            borderBottom: activeSubTab === 'activity' ? '3px solid #0F285B' : '3px solid transparent',
            color: activeSubTab === 'activity' ? '#0F285B' : '#64748b',
            fontWeight: activeSubTab === 'activity' ? 700 : 500,
            fontSize: '0.92rem',
            cursor: 'pointer',
            marginBottom: '-2px',
          }}
        >
          <Clock size={16} />
          <span>Wallet Activity & Redemptions ({walletActivity.length})</span>
        </button>
      </div>

      {/* ── TAB CONTENT: SENT CARDS ── */}
      {activeSubTab === 'sent' && (
        <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', overflow: 'hidden' }}>
          {sentCards.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '56px 24px', color: '#64748b' }}>
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '14px',
                  backgroundColor: '#f1f5f9',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px',
                }}
              >
                <Gift size={28} color="#94a3b8" />
              </div>
              <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#334155', margin: '0 0 6px 0' }}>
                No Sent Gift Cards Yet
              </h4>
              <p style={{ fontSize: '0.88rem', margin: '0 0 18px 0', maxWidth: '380px', marginInline: 'auto' }}>
                Surprise friends, family, or colleagues with an ODS luxury wellness gift card or dedicated healthcare package.
              </p>
              <button
                onClick={() => setIsPurchaseModalOpen(true)}
                style={{
                  padding: '10px 20px',
                  borderRadius: '8px',
                  backgroundColor: '#0F285B',
                  color: '#ffffff',
                  border: 'none',
                  fontWeight: 700,
                  fontSize: '0.88rem',
                  cursor: 'pointer',
                }}
              >
                Send Your First Gift Card
              </button>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569' }}>
                    <th style={{ padding: '14px 20px', fontWeight: 600 }}>Recipient</th>
                    <th style={{ padding: '14px 20px', fontWeight: 600 }}>Occasion / Package</th>
                    <th style={{ padding: '14px 20px', fontWeight: 600 }}>Value</th>
                    <th style={{ padding: '14px 20px', fontWeight: 600 }}>Claim Code</th>
                    <th style={{ padding: '14px 20px', fontWeight: 600 }}>Status</th>
                    <th style={{ padding: '14px 20px', fontWeight: 600 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sentCards.map((card) => (
                    <tr key={card.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '16px 20px' }}>
                        <div style={{ fontWeight: 600, color: '#0F285B' }}>
                          {card.recipient_name || card.recipient_email || 'Recipient'}
                        </div>
                        {card.recipient_email && (
                          <div style={{ fontSize: '0.78rem', color: '#64748b' }}>{card.recipient_email}</div>
                        )}
                      </td>
                      <td style={{ padding: '16px 20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span
                            style={{
                              backgroundColor: card.package_type === 'vip' ? '#fef3c7' : '#e0f2fe',
                              color: card.package_type === 'vip' ? '#b45309' : '#0369a1',
                              padding: '2px 8px',
                              borderRadius: '4px',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                            }}
                          >
                            {card.package_type === 'vip' ? '★ VIP' : 'BASIC'}
                          </span>
                          <span style={{ fontWeight: 600, color: '#334155' }}>{card.occasion}</span>
                        </div>
                        {card.service_title && (
                          <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '2px' }}>
                            {card.service_title}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '16px 20px' }}>
                        <span style={{ fontWeight: 700, color: '#047857', fontSize: '0.95rem' }}>
                          {parseFloat(String(card.initial_amount)).toLocaleString()} {card.currency}
                        </span>
                      </td>
                      <td style={{ padding: '16px 20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span
                            style={{
                              fontFamily: 'monospace',
                              backgroundColor: '#f1f5f9',
                              padding: '4px 8px',
                              borderRadius: '4px',
                              fontWeight: 700,
                              color: '#1e293b',
                            }}
                          >
                            {card.code || 'HIDDEN'}
                          </span>
                          {card.code && (
                            <button
                              onClick={() => copyToClipboard(card.code!)}
                              title="Copy Claim Code"
                              style={{
                                background: 'none',
                                border: 'none',
                                color: '#64748b',
                                cursor: 'pointer',
                                padding: '2px',
                              }}
                            >
                              <Copy size={15} />
                            </button>
                          )}
                        </div>
                      </td>
                      <td style={{ padding: '16px 20px' }}>
                        <span
                          style={{
                            padding: '4px 10px',
                            borderRadius: '9999px',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            backgroundColor:
                              card.status === 'active'
                                ? '#dcfce7'
                                : card.status === 'redeemed'
                                ? '#e0f2fe'
                                : card.status === 'delivered'
                                ? '#f3e8ff'
                                : card.status === 'pending_payment'
                                ? '#fef3c7'
                                : card.status === 'refunded'
                                ? '#ffedd5'
                                : '#fee2e2',
                            color:
                              card.status === 'active'
                                ? '#15803d'
                                : card.status === 'redeemed'
                                ? '#0369a1'
                                : card.status === 'delivered'
                                ? '#7e22ce'
                                : card.status === 'pending_payment'
                                ? '#b45309'
                                : card.status === 'refunded'
                                ? '#c2410c'
                                : '#b91c1c',
                          }}
                        >
                          {card.status.replace('_', ' ').toUpperCase()}
                        </span>
                        {card.scheduled_delivery_date && (
                          <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '3px' }}>
                            <Clock size={11} />
                            Sched: {new Date(card.scheduled_delivery_date).toLocaleDateString()}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '16px 20px' }}>
                        <button
                          onClick={() => handleOpenPrintModal(card)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            backgroundColor: '#f8fafc',
                            border: '1px solid #cbd5e1',
                            padding: '6px 12px',
                            borderRadius: '6px',
                            fontSize: '0.78rem',
                            fontWeight: 600,
                            color: '#0F285B',
                            cursor: 'pointer',
                          }}
                        >
                          <Printer size={14} />
                          <span>View Card</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── TAB CONTENT: RECEIVED GIFTS ── */}
      {activeSubTab === 'received' && (
        <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', overflow: 'hidden' }}>
          {receivedCards.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '56px 24px', color: '#64748b' }}>
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '14px',
                  backgroundColor: '#f1f5f9',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px',
                }}
              >
                <Sparkles size={28} color="#94a3b8" />
              </div>
              <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#334155', margin: '0 0 6px 0' }}>
                No Received Gifts Yet
              </h4>
              <p style={{ fontSize: '0.88rem', margin: '0 0 18px 0', maxWidth: '380px', marginInline: 'auto' }}>
                When someone gifts you an ODS wellness card using your registered email address, it will automatically appear here.
              </p>
              <button
                onClick={() => setIsRedeemModalOpen(true)}
                style={{
                  padding: '10px 20px',
                  borderRadius: '8px',
                  backgroundColor: '#0F285B',
                  color: '#ffffff',
                  border: 'none',
                  fontWeight: 700,
                  fontSize: '0.88rem',
                  cursor: 'pointer',
                }}
              >
                Claim with Code
              </button>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569' }}>
                    <th style={{ padding: '14px 20px', fontWeight: 600 }}>From</th>
                    <th style={{ padding: '14px 20px', fontWeight: 600 }}>Occasion</th>
                    <th style={{ padding: '14px 20px', fontWeight: 600 }}>Balance</th>
                    <th style={{ padding: '14px 20px', fontWeight: 600 }}>Claim Code</th>
                    <th style={{ padding: '14px 20px', fontWeight: 600 }}>Status</th>
                    <th style={{ padding: '14px 20px', fontWeight: 600 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {receivedCards.map((card) => (
                    <tr key={card.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '16px 20px', fontWeight: 600, color: '#0F285B' }}>
                        {card.sender_name || 'Generous Friend'}
                      </td>
                      <td style={{ padding: '16px 20px' }}>
                        <span style={{ fontWeight: 600, color: '#334155' }}>{card.occasion}</span>
                      </td>
                      <td style={{ padding: '16px 20px', fontWeight: 700, color: '#047857' }}>
                        {parseFloat(String(card.balance)).toLocaleString()} {card.currency}
                      </td>
                      <td style={{ padding: '16px 20px', fontFamily: 'monospace', fontWeight: 700 }}>
                        {card.code || 'REDEEMED'}
                      </td>
                      <td style={{ padding: '16px 20px' }}>
                        <span
                          style={{
                            padding: '4px 10px',
                            borderRadius: '9999px',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            backgroundColor:
                              card.status === 'active'
                                ? '#dcfce7'
                                : card.status === 'redeemed'
                                ? '#e0f2fe'
                                : card.status === 'delivered'
                                ? '#f3e8ff'
                                : card.status === 'pending_payment'
                                ? '#fef3c7'
                                : card.status === 'refunded'
                                ? '#ffedd5'
                                : '#fee2e2',
                            color:
                              card.status === 'active'
                                ? '#15803d'
                                : card.status === 'redeemed'
                                ? '#0369a1'
                                : card.status === 'delivered'
                                ? '#7e22ce'
                                : card.status === 'pending_payment'
                                ? '#b45309'
                                : card.status === 'refunded'
                                ? '#c2410c'
                                : '#b91c1c',
                          }}
                        >
                          {card.status.replace('_', ' ').toUpperCase()}
                        </span>
                      </td>
                      <td style={{ padding: '16px 20px' }}>
                        {card.status === 'active' && card.code && (
                          <button
                            onClick={async () => {
                              try {
                                await redeemGiftCard(card.code!);
                                setSuccessMsg('Voucher redeemed directly into your wallet!');
                                loadGiftingData();
                              } catch (e: any) {
                                setErrorMsg(e.message);
                              }
                            }}
                            style={{
                              backgroundColor: '#0F285B',
                              color: '#ffffff',
                              border: 'none',
                              padding: '6px 14px',
                              borderRadius: '6px',
                              fontSize: '0.78rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                            }}
                          >
                            Claim Now
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── TAB CONTENT: WALLET ACTIVITY & REDEMPTIONS ── */}
      {activeSubTab === 'activity' && (
        <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', overflow: 'hidden' }}>
          {walletActivity.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '56px 24px', color: '#64748b' }}>
              <Clock size={28} color="#94a3b8" style={{ marginBottom: '12px' }} />
              <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#334155', margin: '0 0 6px 0' }}>
                No Wallet Activity Recorded
              </h4>
              <p style={{ fontSize: '0.88rem', margin: 0 }}>
                When you redeem gift cards or vouchers, your credits and running balance will be audited here.
              </p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569' }}>
                    <th style={{ padding: '14px 20px', fontWeight: 600 }}>Date & Time</th>
                    <th style={{ padding: '14px 20px', fontWeight: 600 }}>Description</th>
                    <th style={{ padding: '14px 20px', fontWeight: 600 }}>Occasion</th>
                    <th style={{ padding: '14px 20px', fontWeight: 600 }}>Credited Amount</th>
                    <th style={{ padding: '14px 20px', fontWeight: 600 }}>Balance After</th>
                  </tr>
                </thead>
                <tbody>
                  {walletActivity.map((act) => (
                    <tr key={act.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '16px 20px', color: '#64748b', fontSize: '0.82rem' }}>
                        {new Date(act.created_at).toLocaleString()}
                      </td>
                      <td style={{ padding: '16px 20px' }}>
                        <div style={{ fontWeight: 600, color: '#0F285B' }}>Gift Voucher Claimed</div>
                        <div style={{ fontSize: '0.78rem', color: '#64748b', fontFamily: 'monospace' }}>
                          Ref: {act.code || act.gift_card_id.slice(0, 8)}
                        </div>
                      </td>
                      <td style={{ padding: '16px 20px', color: '#334155' }}>
                        {act.occasion || 'Gift'}
                      </td>
                      <td style={{ padding: '16px 20px', fontWeight: 700, color: '#047857' }}>
                        +{parseFloat(String(act.amount)).toLocaleString()} {act.currency}
                      </td>
                      <td style={{ padding: '16px 20px', fontWeight: 600, color: '#0F285B' }}>
                        {parseFloat(String(act.balance_after)).toLocaleString()} {act.currency}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
         MODAL 1: PURCHASE GIFT CARD
         ───────────────────────────────────────────────────────────── */}
      {isPurchaseModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '20px',
            backdropFilter: 'blur(4px)',
          }}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '20px',
              width: '100%',
              maxWidth: '680px',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: '24px 28px',
                borderBottom: '1px solid #e2e8f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: 'linear-gradient(135deg, #0F285B 0%, #1e3a8a 100%)',
                color: '#ffffff',
                borderTopLeftRadius: '20px',
                borderTopRightRadius: '20px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Gift size={24} color="#fbbf24" />
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800 }}>Create & Send Gift Card</h3>
              </div>
              <button
                onClick={() => setIsPurchaseModalOpen(false)}
                style={{ background: 'none', border: 'none', color: '#cbd5e1', cursor: 'pointer', padding: '4px' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body Form */}
            <form onSubmit={handlePurchaseSubmit} style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '22px' }}>
              {/* Gift Type (Monetary vs Service) */}
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '8px' }}>
                  Gifting Model
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <button
                    type="button"
                    onClick={() => setPurchaseForm({ ...purchaseForm, giftType: 'monetary' })}
                    style={{
                      padding: '14px',
                      borderRadius: '10px',
                      border: purchaseForm.giftType === 'monetary' ? '2px solid #0F285B' : '1px solid #cbd5e1',
                      backgroundColor: purchaseForm.giftType === 'monetary' ? '#f0f4ff' : '#ffffff',
                      textAlign: 'left',
                      cursor: 'pointer',
                    }}
                  >
                    <div style={{ fontWeight: 700, color: '#0F285B', fontSize: '0.92rem' }}>💰 Monetary Voucher</div>
                    <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '2px' }}>
                      Credits recipient's digital wallet for any service
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPurchaseForm({ ...purchaseForm, giftType: 'service' })}
                    style={{
                      padding: '14px',
                      borderRadius: '10px',
                      border: purchaseForm.giftType === 'service' ? '2px solid #0F285B' : '1px solid #cbd5e1',
                      backgroundColor: purchaseForm.giftType === 'service' ? '#f0f4ff' : '#ffffff',
                      textAlign: 'left',
                      cursor: 'pointer',
                    }}
                  >
                    <div style={{ fontWeight: 700, color: '#0F285B', fontSize: '0.92rem' }}>🩺 Dedicated Service Gift</div>
                    <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '2px' }}>
                      Designated healthcare examination or treatment
                    </div>
                  </button>
                </div>
              </div>

              {/* Service Title if Dedicated Service */}
              {purchaseForm.giftType === 'service' && (
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    Dedicated Service Title *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Executive Comprehensive Health Screening"
                    value={purchaseForm.serviceTitle}
                    onChange={(e) => setPurchaseForm({ ...purchaseForm, serviceTitle: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '12px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.9rem',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              )}

              {/* Presentation Package Type (Basic vs VIP) */}
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '8px' }}>
                  Card Presentation Edition
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <button
                    type="button"
                    onClick={() => setPurchaseForm({ ...purchaseForm, packageType: 'vip' })}
                    style={{
                      padding: '14px',
                      borderRadius: '10px',
                      border: purchaseForm.packageType === 'vip' ? '2px solid #d97706' : '1px solid #cbd5e1',
                      backgroundColor: purchaseForm.packageType === 'vip' ? '#fffbeb' : '#ffffff',
                      textAlign: 'left',
                      cursor: 'pointer',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Award size={16} color="#d97706" />
                      <strong style={{ color: '#b45309', fontSize: '0.92rem' }}>VIP Luxury Edition</strong>
                    </div>
                    <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '4px' }}>
                      Obsidian & Gold foil styling with QR code
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPurchaseForm({ ...purchaseForm, packageType: 'basic' })}
                    style={{
                      padding: '14px',
                      borderRadius: '10px',
                      border: purchaseForm.packageType === 'basic' ? '2px solid #059669' : '1px solid #cbd5e1',
                      backgroundColor: purchaseForm.packageType === 'basic' ? '#ecfdf5' : '#ffffff',
                      textAlign: 'left',
                      cursor: 'pointer',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Gift size={16} color="#059669" />
                      <strong style={{ color: '#047857', fontSize: '0.92rem' }}>Classic Emerald Edition</strong>
                    </div>
                    <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '4px' }}>
                      Clean, minimalist healthcare voucher
                    </div>
                  </button>
                </div>
              </div>

              {/* Occasion Dropdown */}
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  Select Occasion
                </label>
                <select
                  value={purchaseForm.occasion}
                  onChange={(e) => setPurchaseForm({ ...purchaseForm, occasion: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.9rem',
                    backgroundColor: '#ffffff',
                  }}
                >
                  {OCCASIONS.map((occ) => (
                    <option key={occ.id} value={occ.id}>
                      {occ.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Amount Selection */}
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '8px' }}>
                  Gift Card Value (ETB)
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '10px' }}>
                  {PRESET_AMOUNTS.map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setPurchaseForm({ ...purchaseForm, amount: amt, isCustomAmount: false })}
                      style={{
                        flex: '1 1 80px',
                        padding: '10px 14px',
                        borderRadius: '8px',
                        border:
                          !purchaseForm.isCustomAmount && purchaseForm.amount === amt
                            ? '2px solid #0F285B'
                            : '1px solid #cbd5e1',
                        backgroundColor:
                          !purchaseForm.isCustomAmount && purchaseForm.amount === amt ? '#0F285B' : '#ffffff',
                        color:
                          !purchaseForm.isCustomAmount && purchaseForm.amount === amt ? '#ffffff' : '#334155',
                        fontWeight: 700,
                        fontSize: '0.9rem',
                        cursor: 'pointer',
                      }}
                    >
                      {amt.toLocaleString()} ETB
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setPurchaseForm({ ...purchaseForm, isCustomAmount: true })}
                    style={{
                      flex: '1 1 80px',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      border: purchaseForm.isCustomAmount ? '2px solid #0F285B' : '1px solid #cbd5e1',
                      backgroundColor: purchaseForm.isCustomAmount ? '#0F285B' : '#ffffff',
                      color: purchaseForm.isCustomAmount ? '#ffffff' : '#334155',
                      fontWeight: 700,
                      fontSize: '0.9rem',
                      cursor: 'pointer',
                    }}
                  >
                    Custom
                  </button>
                </div>

                {purchaseForm.isCustomAmount && (
                  <input
                    type="number"
                    min="100"
                    step="50"
                    placeholder="Enter custom amount in ETB"
                    value={purchaseForm.customAmount}
                    onChange={(e) => setPurchaseForm({ ...purchaseForm, customAmount: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '12px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.9rem',
                      boxSizing: 'border-box',
                    }}
                  />
                )}
              </div>

              {/* Recipient Details */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    Recipient Full Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Aster Bekele"
                    value={purchaseForm.recipientName}
                    onChange={(e) => setPurchaseForm({ ...purchaseForm, recipientName: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '12px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.9rem',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    Recipient Email (Receives Gift Card)
                  </label>
                  <input
                    type="email"
                    placeholder="recipient@example.com"
                    value={purchaseForm.recipientEmail}
                    onChange={(e) => setPurchaseForm({ ...purchaseForm, recipientEmail: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '12px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.9rem',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              </div>

              {/* Scheduled Delivery Date */}
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  Scheduled Delivery Date (Optional)
                </label>
                <input
                  type="datetime-local"
                  value={purchaseForm.scheduledDeliveryDate}
                  onChange={(e) => setPurchaseForm({ ...purchaseForm, scheduledDeliveryDate: e.target.value })}
                  min={new Date().toISOString().slice(0, 16)}
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.9rem',
                    boxSizing: 'border-box',
                    backgroundColor: '#ffffff',
                    color: '#1e293b',
                  }}
                />
                <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px' }}>
                  Leave blank for immediate delivery upon payment confirmation.
                </div>
              </div>

              {/* Personal Heartfelt Message */}
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  Personal Message (Printed on Card)
                </label>
                <textarea
                  rows={3}
                  placeholder="Write a warm note to your recipient..."
                  value={purchaseForm.personalMessage}
                  onChange={(e) => setPurchaseForm({ ...purchaseForm, personalMessage: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.9rem',
                    boxSizing: 'border-box',
                    fontFamily: 'inherit',
                  }}
                />
              </div>

              {/* Payment Method Selection */}
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '8px' }}>
                  Select Payment Method
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={() => setPurchaseForm({ ...purchaseForm, paymentMethod: 'chapa' })}
                    style={{
                      padding: '12px 14px',
                      borderRadius: '10px',
                      border: purchaseForm.paymentMethod === 'chapa' ? '2px solid #0F285B' : '1px solid #cbd5e1',
                      backgroundColor: purchaseForm.paymentMethod === 'chapa' ? '#f0f4ff' : '#ffffff',
                      textAlign: 'left',
                      cursor: 'pointer',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <CreditCard size={16} color="#0F285B" />
                      <strong style={{ color: '#0F285B', fontSize: '0.88rem' }}>Chapa Gateway</strong>
                    </div>
                    <div style={{ fontSize: '0.74rem', color: '#64748b', marginTop: '2px' }}>
                      Telebirr, CBE Birr, Cards
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPurchaseForm({ ...purchaseForm, paymentMethod: 'wallet' })}
                    style={{
                      padding: '12px 14px',
                      borderRadius: '10px',
                      border: purchaseForm.paymentMethod === 'wallet' ? '2px solid #047857' : '1px solid #cbd5e1',
                      backgroundColor: purchaseForm.paymentMethod === 'wallet' ? '#ecfdf5' : '#ffffff',
                      textAlign: 'left',
                      cursor: 'pointer',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Wallet size={16} color="#047857" />
                      <strong style={{ color: '#047857', fontSize: '0.88rem' }}>Digital Wallet</strong>
                    </div>
                    <div style={{ fontSize: '0.74rem', color: '#64748b', marginTop: '2px' }}>
                      Balance: {walletBalance.toLocaleString()} {currency}
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPurchaseForm({ ...purchaseForm, paymentMethod: 'direct' })}
                    style={{
                      padding: '12px 14px',
                      borderRadius: '10px',
                      border: purchaseForm.paymentMethod === 'direct' ? '2px solid #d97706' : '1px solid #cbd5e1',
                      backgroundColor: purchaseForm.paymentMethod === 'direct' ? '#fffbeb' : '#ffffff',
                      textAlign: 'left',
                      cursor: 'pointer',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Sparkles size={16} color="#d97706" />
                      <strong style={{ color: '#b45309', fontSize: '0.88rem' }}>Direct / Sandbox</strong>
                    </div>
                    <div style={{ fontSize: '0.74rem', color: '#64748b', marginTop: '2px' }}>
                      Instant issuance for test
                    </div>
                  </button>
                </div>
              </div>

              {/* Submit Buttons */}
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setIsPurchaseModalOpen(false)}
                  style={{
                    padding: '12px 20px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    backgroundColor: '#ffffff',
                    color: '#64748b',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={purchaseSubmitting}
                  style={{
                    padding: '12px 28px',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: '#0F285B',
                    color: '#ffffff',
                    fontWeight: 700,
                    fontSize: '0.95rem',
                    cursor: purchaseSubmitting ? 'not-allowed' : 'pointer',
                    opacity: purchaseSubmitting ? 0.7 : 1,
                    boxShadow: '0 4px 12px rgba(15, 40, 91, 0.25)',
                  }}
                >
                  {purchaseSubmitting ? 'Creating Gift Card...' : 'Confirm & Generate Gift Card'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
         MODAL 2: REDEEM GIFT CARD
         ───────────────────────────────────────────────────────────── */}
      {isRedeemModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '20px',
            backdropFilter: 'blur(4px)',
          }}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '20px',
              width: '100%',
              maxWidth: '520px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              overflow: 'hidden',
            }}
          >
            {/* Header */}
            <div
              style={{
                padding: '24px 28px',
                borderBottom: '1px solid #e2e8f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: 'linear-gradient(135deg, #0F285B 0%, #1e3a8a 100%)',
                color: '#ffffff',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Sparkles size={22} color="#fbbf24" />
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>Redeem Gift Card</h3>
              </div>
              <button
                onClick={() => setIsRedeemModalOpen(false)}
                style={{ background: 'none', border: 'none', color: '#cbd5e1', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Body */}
            <form onSubmit={handleRedeemSubmit} style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '8px' }}>
                  Gift Card Claim Code
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    required
                    placeholder="ODS-GC-XXXX-XXXX"
                    value={redeemCode}
                    onChange={(e) => setRedeemCode(e.target.value.toUpperCase())}
                    style={{
                      flex: 1,
                      padding: '12px 14px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontFamily: 'monospace',
                      fontSize: '1.05rem',
                      fontWeight: 700,
                      letterSpacing: '1px',
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleCheckCode}
                    disabled={redeemChecking || !redeemCode.trim()}
                    style={{
                      padding: '10px 16px',
                      borderRadius: '8px',
                      backgroundColor: '#f1f5f9',
                      border: '1px solid #cbd5e1',
                      color: '#0F285B',
                      fontWeight: 700,
                      fontSize: '0.85rem',
                      cursor: 'pointer',
                    }}
                  >
                    {redeemChecking ? 'Checking...' : 'Verify'}
                  </button>
                </div>
                <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '6px' }}>
                  Enter the 8-character claim code from your email or printable gift voucher.
                </div>
              </div>

              {/* Live Preview of verified card */}
              {redeemCheckResult && (
                <div
                  style={{
                    backgroundColor: '#f0fdf4',
                    border: '1px solid #bbf7d0',
                    borderRadius: '10px',
                    padding: '16px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#166534', fontWeight: 700, fontSize: '0.9rem', marginBottom: '8px' }}>
                    <CheckCircle size={18} />
                    <span>Valid Gift Card Found!</span>
                  </div>
                  <div style={{ fontSize: '0.85rem', color: '#166534' }}>
                    <div><strong>Occasion:</strong> {redeemCheckResult.occasion}</div>
                    {redeemCheckResult.serviceTitle && (
                      <div><strong>Service:</strong> {redeemCheckResult.serviceTitle}</div>
                    )}
                    <div>
                      <strong>Value to Credit:</strong>{' '}
                      <span style={{ fontSize: '1.1rem', fontWeight: 800 }}>
                        {redeemCheckResult.balance} {redeemCheckResult.currency}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Submit Buttons */}
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setIsRedeemModalOpen(false)}
                  style={{
                    padding: '10px 18px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    backgroundColor: '#ffffff',
                    color: '#64748b',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={redeemSubmitting || !redeemCode.trim()}
                  style={{
                    padding: '10px 24px',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: '#0F285B',
                    color: '#ffffff',
                    fontWeight: 700,
                    fontSize: '0.92rem',
                    cursor: redeemSubmitting ? 'not-allowed' : 'pointer',
                    boxShadow: '0 4px 10px rgba(15, 40, 91, 0.25)',
                  }}
                >
                  {redeemSubmitting ? 'Redeeming...' : 'Claim to Digital Wallet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
         MODAL 3: VIEW & PRINT LUXURY GIFT CARD
         ───────────────────────────────────────────────────────────── */}
      {isPreviewCardModalOpen && selectedCardForPrint && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.75)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '20px',
            backdropFilter: 'blur(5px)',
          }}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '20px',
              width: '100%',
              maxWidth: '640px',
              maxHeight: '92vh',
              overflowY: 'auto',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* Header controls */}
            <div
              style={{
                padding: '16px 24px',
                borderBottom: '1px solid #e2e8f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                backgroundColor: '#f8fafc',
              }}
            >
              <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#0F285B' }}>
                Digital Voucher Card Preview
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  onClick={() => window.print()}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 14px',
                    borderRadius: '6px',
                    backgroundColor: '#0F285B',
                    color: '#ffffff',
                    border: 'none',
                    fontWeight: 700,
                    fontSize: '0.82rem',
                    cursor: 'pointer',
                  }}
                >
                  <Printer size={15} />
                  <span>Print Voucher</span>
                </button>
                <button
                  onClick={() => setIsPreviewCardModalOpen(false)}
                  style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* The Luxury Card */}
            <div style={{ padding: '28px' }}>
              <div
                id="printable-gift-card"
                style={{
                  background:
                    selectedCardForPrint.package_type === 'vip'
                      ? 'linear-gradient(135deg, #090e17 0%, #151e2e 50%, #090e17 100%)'
                      : 'linear-gradient(135deg, #064e3b 0%, #047857 50%, #064e3b 100%)',
                  borderRadius: '16px',
                  padding: '32px',
                  color: '#ffffff',
                  boxShadow: '0 15px 35px -5px rgba(0,0,0,0.3)',
                  border:
                    selectedCardForPrint.package_type === 'vip'
                      ? '2px solid #d97706'
                      : '2px solid #10b981',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                {/* Gold/Emerald Foil Accent Watermark */}
                <div
                  style={{
                    position: 'absolute',
                    top: '-40px',
                    right: '-40px',
                    width: '180px',
                    height: '180px',
                    borderRadius: '50%',
                    background:
                      selectedCardForPrint.package_type === 'vip'
                        ? 'radial-gradient(circle, rgba(251, 191, 36, 0.25) 0%, transparent 70%)'
                        : 'radial-gradient(circle, rgba(52, 211, 153, 0.25) 0%, transparent 70%)',
                  }}
                />

                {/* Top Bar */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
                  <div>
                    <div
                      style={{
                        display: 'inline-block',
                        background:
                          selectedCardForPrint.package_type === 'vip'
                            ? 'rgba(217, 119, 6, 0.3)'
                            : 'rgba(5, 150, 105, 0.3)',
                        border:
                          selectedCardForPrint.package_type === 'vip'
                            ? '1px solid #fbbf24'
                            : '1px solid #34d399',
                        color: selectedCardForPrint.package_type === 'vip' ? '#fbbf24' : '#34d399',
                        padding: '3px 10px',
                        borderRadius: '9999px',
                        fontSize: '0.72rem',
                        fontWeight: 800,
                        letterSpacing: '1px',
                        textTransform: 'uppercase',
                        marginBottom: '8px',
                      }}
                    >
                      {selectedCardForPrint.package_type === 'vip' ? '★ VIP LUXURY VOUCHER' : 'OFFICIAL GIFT VOUCHER'}
                    </div>
                    <div style={{ fontSize: '1.4rem', fontWeight: 800, letterSpacing: '-0.5px' }}>
                      ODS Global Network
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px' }}>
                      {selectedCardForPrint.occasion} Edition
                    </div>
                  </div>

                  {/* QR Code */}
                  {printQrUrl && (
                    <div
                      style={{
                        backgroundColor: '#ffffff',
                        padding: '8px',
                        borderRadius: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 4px 10px rgba(0,0,0,0.2)',
                      }}
                    >
                      <img src={printQrUrl} alt="Voucher QR Code" style={{ width: '80px', height: '80px', display: 'block' }} />
                    </div>
                  )}
                </div>

                {/* Recipient & Personal Message */}
                <div style={{ marginBottom: '24px' }}>
                  <div style={{ fontSize: '0.8rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Presented To
                  </div>
                  <div style={{ fontSize: '1.3rem', fontWeight: 700, color: '#ffffff', marginTop: '2px' }}>
                    {selectedCardForPrint.recipient_name || selectedCardForPrint.recipient_email || 'Valued Recipient'}
                  </div>

                  {selectedCardForPrint.personal_message && (
                    <div
                      style={{
                        marginTop: '12px',
                        backgroundColor: 'rgba(255, 255, 255, 0.08)',
                        borderLeft:
                          selectedCardForPrint.package_type === 'vip'
                            ? '3px solid #fbbf24'
                            : '3px solid #34d399',
                        padding: '10px 14px',
                        borderRadius: '4px',
                        fontSize: '0.88rem',
                        fontStyle: 'italic',
                        color: '#e2e8f0',
                        lineHeight: 1.5,
                      }}
                    >
                      "{selectedCardForPrint.personal_message}"
                    </div>
                  )}
                </div>

                {/* Value / Service */}
                <div
                  style={{
                    backgroundColor: 'rgba(0, 0, 0, 0.25)',
                    borderRadius: '12px',
                    padding: '16px 20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    marginBottom: '20px',
                  }}
                >
                  <div>
                    <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px', color: '#94a3b8' }}>
                      {selectedCardForPrint.gift_type === 'service' ? 'Healthcare Service' : 'Voucher Balance'}
                    </div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fbbf24', marginTop: '2px' }}>
                      {selectedCardForPrint.gift_type === 'service'
                        ? (selectedCardForPrint.service_title || 'Dedicated Service')
                        : `${parseFloat(String(selectedCardForPrint.initial_amount)).toLocaleString()} ${selectedCardForPrint.currency}`}
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px', color: '#94a3b8' }}>
                      Claim Code
                    </div>
                    <div
                      style={{
                        fontFamily: 'monospace',
                        fontSize: '1.15rem',
                        fontWeight: 800,
                        color: '#ffffff',
                        backgroundColor: 'rgba(255, 255, 255, 0.15)',
                        padding: '4px 10px',
                        borderRadius: '6px',
                        marginTop: '2px',
                        letterSpacing: '1.5px',
                      }}
                    >
                      {selectedCardForPrint.code || 'REDEEMED'}
                    </div>
                  </div>
                </div>

                {/* Footer Notes */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: '0.72rem',
                    color: '#94a3b8',
                    borderTop: '1px solid rgba(255, 255, 255, 0.12)',
                    paddingTop: '12px',
                  }}
                >
                  <span>Valid through: {new Date(selectedCardForPrint.expiry_date).toLocaleDateString()}</span>
                  <span>ODS Global Network • Secure Digital Health Card</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
