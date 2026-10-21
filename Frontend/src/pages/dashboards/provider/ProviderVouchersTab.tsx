import React, { useState, useEffect } from 'react';
import {
  Gift,
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  Loader2,
  ShieldCheck,
  Printer,
  X,
  Phone,
  Mail,
  Stethoscope,
  RefreshCw,
  Copy,
} from 'lucide-react';
import {
  GiftCard,
  ProviderVouchersStats,
  getProviderVouchers,
  confirmServiceDelivery,
  checkGiftCard,
  CheckGiftCardResponse,
} from '../../../services/giftingService';

interface ProviderVouchersTabProps {
  providerName?: string;
}

export const ProviderVouchersTab: React.FC<ProviderVouchersTabProps> = ({ providerName = 'Healthcare Facility' }) => {
  const [vouchers, setVouchers] = useState<GiftCard[]>([]);
  const [stats, setStats] = useState<ProviderVouchersStats>({
    total: 0,
    activeCount: 0,
    deliveredCount: 0,
    deliveredValue: 0,
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Quick Verification Form
  const [verifyCode, setVerifyCode] = useState<string>('');
  const [verifyChecking, setVerifyChecking] = useState<boolean>(false);
  const [verifyResult, setVerifyResult] = useState<CheckGiftCardResponse | null>(null);
  const [deliveringCode, setDeliveringCode] = useState<string | null>(null);

  // Selected voucher for receipt printing
  const [receiptVoucher, setReceiptVoucher] = useState<GiftCard | null>(null);

  // Load vouchers
  const loadVouchers = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await getProviderVouchers({
        status: statusFilter !== 'all' ? statusFilter : undefined,
        search: searchTerm.trim() || undefined,
      });
      setVouchers(res.vouchers);
      setStats(res.stats);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to load clinical service vouchers.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVouchers();
  }, [statusFilter]);

  // Handle manual search form submit
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadVouchers();
  };

  // Quick code verification check
  const handleQuickCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verifyCode.trim()) return;
    setVerifyChecking(true);
    setErrorMsg(null);
    setVerifyResult(null);

    try {
      const res = await checkGiftCard(verifyCode.trim());
      setVerifyResult(res);
    } catch (err: any) {
      setErrorMsg(err.message || 'Invalid or unverified voucher code.');
    } finally {
      setVerifyChecking(false);
    }
  };

  // Confirm Service Delivery
  const handleConfirmDelivery = async (code: string) => {
    if (!code) return;
    setDeliveringCode(code);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await confirmServiceDelivery(code);
      setSuccessMsg(`Service Delivery Confirmed for voucher ${code}. Clinical record updated.`);
      setVerifyResult(null);
      setVerifyCode('');
      await loadVouchers();
      if (res.giftCard) {
        setReceiptVoucher(res.giftCard);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to confirm voucher service delivery.');
    } finally {
      setDeliveringCode(null);
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setSuccessMsg(`Copied code "${code}" to clipboard.`);
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '26px' }}>
      {/* ── HEADER BANNER ── */}
      <div
        style={{
          padding: '24px 28px',
          borderRadius: '14px',
          background: 'linear-gradient(135deg, #0F285B 0%, #081738 100%)',
          color: '#ffffff',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          boxShadow: '0 8px 24px rgba(15, 40, 91, 0.15)',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
            <Gift size={24} color="var(--color-gold-bright)" />
            <h2 style={{ fontSize: '1.35rem', fontWeight: 700, margin: 0, color: '#ffffff' }}>
              Patient Service Vouchers & Gifting
            </h2>
          </div>
          <p style={{ margin: 0, color: 'rgba(255, 255, 255, 0.75)', fontSize: '0.88rem' }}>
            Verify incoming patient service vouchers, confirm in-clinic delivery, and reconcile clinical reimbursements.
          </p>
        </div>
        <button
          onClick={loadVouchers}
          disabled={loading}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            color: '#ffffff',
            padding: '10px 18px',
            borderRadius: '8px',
            fontSize: '0.85rem',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          <span>Refresh Ledger</span>
        </button>
      </div>

      {/* ── NOTIFICATIONS ── */}
      {errorMsg && (
        <div
          style={{
            padding: '14px 18px',
            borderRadius: '10px',
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            color: '#991b1b',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '0.9rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <AlertCircle size={18} />
            <span>{errorMsg}</span>
          </div>
          <button
            onClick={() => setErrorMsg(null)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#991b1b' }}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {successMsg && (
        <div
          style={{
            padding: '14px 18px',
            borderRadius: '10px',
            backgroundColor: '#ecfdf5',
            border: '1px solid #a7f3d0',
            color: '#065f46',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '0.9rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <CheckCircle2 size={18} />
            <span>{successMsg}</span>
          </div>
          <button
            onClick={() => setSuccessMsg(null)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#065f46' }}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* ── QUICK IN-CLINIC VERIFICATION & CONFIRMATION BOX ── */}
      <div
        style={{
          padding: '24px',
          borderRadius: '14px',
          backgroundColor: '#ffffff',
          border: '1px solid #e2e8f0',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.04)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
          <ShieldCheck size={20} color="var(--color-gold-bright)" />
          <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: 'var(--color-navy)' }}>
            In-Clinic Patient Voucher Verification
          </h3>
        </div>
        <p style={{ margin: '0 0 16px 0', fontSize: '0.85rem', color: '#64748b' }}>
          When a patient arrives with an ODS gift voucher or digital certificate, enter their claim code below to verify details and confirm delivery.
        </p>

        <form onSubmit={handleQuickCheck} style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ flex: '1', minWidth: '260px' }}>
            <input
              type="text"
              placeholder="e.g. ODS-GC-XXXX-XXXX"
              value={verifyCode}
              onChange={(e) => setVerifyCode(e.target.value.toUpperCase())}
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: '8px',
                border: '1.5px solid #cbd5e1',
                fontSize: '0.95rem',
                fontFamily: 'monospace',
                letterSpacing: '1px',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>
          <button
            type="submit"
            disabled={verifyChecking || !verifyCode.trim()}
            style={{
              padding: '12px 24px',
              borderRadius: '8px',
              backgroundColor: 'var(--color-navy)',
              color: '#ffffff',
              border: 'none',
              fontSize: '0.9rem',
              fontWeight: 600,
              cursor: verifyCode.trim() ? 'pointer' : 'not-allowed',
              opacity: verifyCode.trim() ? 1 : 0.6,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            {verifyChecking ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
            <span>Verify Voucher</span>
          </button>
        </form>

        {/* Verification Result Preview Card */}
        {verifyResult && (
          <div
            style={{
              marginTop: '20px',
              padding: '20px',
              borderRadius: '12px',
              backgroundColor: '#f8fafc',
              border: '1.5px solid #cbd5e1',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '14px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <span
                    style={{
                      padding: '4px 10px',
                      borderRadius: '20px',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      backgroundColor: 'rgba(16, 185, 129, 0.12)',
                      color: '#065f46',
                      border: '1px solid rgba(16, 185, 129, 0.3)',
                    }}
                  >
                    VALID VOUCHER
                  </span>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-navy)' }}>
                    {verifyResult.packageType === 'vip' ? 'VIP Luxury Certificate' : 'Standard Voucher'}
                  </span>
                </div>
                <div style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--color-navy)' }}>
                  {verifyResult.serviceTitle || 'Monetary Clinical Gift'}
                </div>
                <div style={{ fontSize: '0.82rem', color: '#64748b', marginTop: '2px' }}>
                  Occasion: {verifyResult.occasion} • Expires:{' '}
                  {verifyResult.expiryDate ? new Date(verifyResult.expiryDate).toLocaleDateString() : 'N/A'}
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.78rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Voucher Value
                </div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--color-navy)' }}>
                  {verifyResult.initialAmount?.toLocaleString()} {verifyResult.currency || 'ETB'}
                </div>
              </div>
            </div>

            <div style={{ marginTop: '16px', display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => handleConfirmDelivery(verifyCode.trim())}
                disabled={deliveringCode === verifyCode.trim()}
                style={{
                  padding: '10px 22px',
                  borderRadius: '8px',
                  backgroundColor: '#059669',
                  color: '#ffffff',
                  border: 'none',
                  fontSize: '0.88rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 12px rgba(5, 150, 105, 0.2)',
                }}
              >
                {deliveringCode === verifyCode.trim() ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <CheckCircle2 size={16} />
                )}
                <span>Confirm Service Delivery & Settlement</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── 4 KPI STAT CARDS ── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
          gap: '16px',
        }}
      >
        <div
          style={{
            padding: '20px',
            borderRadius: '12px',
            backgroundColor: '#ffffff',
            border: '1px solid #e2e8f0',
          }}
        >
          <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>
            Total Facility Vouchers
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--color-navy)', marginTop: '6px' }}>
            {stats.total}
          </div>
          <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '4px' }}>Assigned patient gifts</div>
        </div>

        <div
          style={{
            padding: '20px',
            borderRadius: '12px',
            backgroundColor: '#ffffff',
            border: '1px solid #e2e8f0',
          }}
        >
          <div style={{ fontSize: '0.8rem', color: '#b45309', fontWeight: 600, textTransform: 'uppercase' }}>
            Awaiting Patient Visit
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#b45309', marginTop: '6px' }}>
            {stats.activeCount}
          </div>
          <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '4px' }}>Active vouchers redeemable</div>
        </div>

        <div
          style={{
            padding: '20px',
            borderRadius: '12px',
            backgroundColor: '#ffffff',
            border: '1px solid #e2e8f0',
          }}
        >
          <div style={{ fontSize: '0.8rem', color: '#065f46', fontWeight: 600, textTransform: 'uppercase' }}>
            Delivered & Serviced
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#065f46', marginTop: '6px' }}>
            {stats.deliveredCount}
          </div>
          <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '4px' }}>Confirmed clinical procedures</div>
        </div>

        <div
          style={{
            padding: '20px',
            borderRadius: '12px',
            backgroundColor: '#ffffff',
            border: '1px solid #e2e8f0',
          }}
        >
          <div style={{ fontSize: '0.8rem', color: 'var(--color-navy)', fontWeight: 600, textTransform: 'uppercase' }}>
            Delivered Clinical Value
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--color-navy)', marginTop: '6px' }}>
            {stats.deliveredValue.toLocaleString()} ETB
          </div>
          <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '4px' }}>Settlement eligible balance</div>
        </div>
      </div>

      {/* ── FILTER & SEARCH TOOLBAR ── */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '14px',
          backgroundColor: '#ffffff',
          padding: '16px 20px',
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
        }}
      >
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {[
            { id: 'all', label: 'All Vouchers' },
            { id: 'active', label: 'Active / Pending Visit' },
            { id: 'delivered', label: 'Delivered' },
            { id: 'expired', label: 'Expired' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              style={{
                padding: '8px 16px',
                borderRadius: '6px',
                fontSize: '0.82rem',
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
                backgroundColor: statusFilter === tab.id ? 'var(--color-navy)' : '#f1f5f9',
                color: statusFilter === tab.id ? '#ffffff' : '#475569',
                transition: 'all 0.15s ease',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '8px', flex: '1', maxWidth: '380px' }}>
          <input
            type="text"
            placeholder="Search code, patient, or service..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 14px',
              borderRadius: '6px',
              border: '1px solid #cbd5e1',
              fontSize: '0.85rem',
              outline: 'none',
            }}
          />
          <button
            type="submit"
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              backgroundColor: '#0F285B',
              color: '#ffffff',
              border: 'none',
              fontSize: '0.82rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Search
          </button>
        </form>
      </div>

      {/* ── DATA TABLE ── */}
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
          overflow: 'hidden',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.02)',
        }}
      >
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569' }}>
                <th style={{ padding: '14px 16px', fontWeight: 600 }}>Voucher Code</th>
                <th style={{ padding: '14px 16px', fontWeight: 600 }}>Patient / Recipient</th>
                <th style={{ padding: '14px 16px', fontWeight: 600 }}>Service Title</th>
                <th style={{ padding: '14px 16px', fontWeight: 600 }}>Occasion</th>
                <th style={{ padding: '14px 16px', fontWeight: 600, textAlign: 'right' }}>Reimbursement Value</th>
                <th style={{ padding: '14px 16px', fontWeight: 600 }}>Status</th>
                <th style={{ padding: '14px 16px', fontWeight: 600, textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                    <Loader2 size={24} className="animate-spin" style={{ margin: '0 auto 10px auto' }} />
                    <div>Loading clinic vouchers...</div>
                  </td>
                </tr>
              ) : vouchers.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '44px 20px', color: '#64748b' }}>
                    <Gift size={32} color="#94a3b8" style={{ margin: '0 auto 10px auto', display: 'block' }} />
                    <div style={{ fontWeight: 600, color: 'var(--color-navy)' }}>No service vouchers found</div>
                    <div style={{ fontSize: '0.8rem', marginTop: '4px' }}>
                      {statusFilter !== 'all' || searchTerm ? 'Try adjusting your search filters.' : 'Incoming patient vouchers will appear here.'}
                    </div>
                  </td>
                </tr>
              ) : (
                vouchers.map((v) => {
                  const isDelivered = v.status === 'delivered';
                  const isActive = v.status === 'active';

                  return (
                    <tr
                      key={v.id}
                      style={{
                        borderBottom: '1px solid #f1f5f9',
                        transition: 'background-color 0.15s ease',
                      }}
                    >
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--color-navy)' }}>
                            {v.code}
                          </span>
                          <button
                            onClick={() => v.code && copyCode(v.code)}
                            title="Copy Code"
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: '2px' }}
                          >
                            <Copy size={13} />
                          </button>
                        </div>
                        <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '2px' }}>
                          {v.package_type === 'vip' ? '★ VIP Package' : 'Standard'}
                        </div>
                      </td>

                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ fontWeight: 600, color: '#1e293b' }}>
                          {v.recipient_name || 'Patient'}
                        </div>
                        {v.recipient_phone && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.76rem', color: '#64748b', marginTop: '2px' }}>
                            <Phone size={11} /> {v.recipient_phone}
                          </div>
                        )}
                        {v.recipient_email && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.76rem', color: '#64748b', marginTop: '1px' }}>
                            <Mail size={11} /> {v.recipient_email}
                          </div>
                        )}
                      </td>

                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ fontWeight: 600, color: 'var(--color-navy)' }}>
                          {v.service_title || 'General Healthcare Gift'}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '2px' }}>
                          {v.service_category || 'Healthcare'}
                        </div>
                      </td>

                      <td style={{ padding: '14px 16px' }}>
                        <span
                          style={{
                            padding: '3px 8px',
                            borderRadius: '12px',
                            fontSize: '0.74rem',
                            fontWeight: 600,
                            backgroundColor: '#f1f5f9',
                            color: '#475569',
                          }}
                        >
                          {v.occasion || 'General'}
                        </span>
                      </td>

                      <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                        <div style={{ fontWeight: 700, color: 'var(--color-navy)' }}>
                          {typeof v.initial_amount === 'number'
                            ? v.initial_amount.toLocaleString()
                            : v.initial_amount}{' '}
                          {v.currency}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: isDelivered ? '#059669' : '#b45309', fontWeight: 600, marginTop: '2px' }}>
                          {isDelivered ? 'Settlement Ready' : 'Awaiting Service'}
                        </div>
                      </td>

                      <td style={{ padding: '14px 16px' }}>
                        {isDelivered ? (
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '5px',
                              padding: '4px 10px',
                              borderRadius: '20px',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              backgroundColor: 'rgba(16, 185, 129, 0.12)',
                              color: '#065f46',
                            }}
                          >
                            <CheckCircle2 size={12} /> Delivered
                          </span>
                        ) : isActive ? (
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '5px',
                              padding: '4px 10px',
                              borderRadius: '20px',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              backgroundColor: 'rgba(245, 158, 11, 0.12)',
                              color: '#92400e',
                            }}
                          >
                            <Clock size={12} /> Active
                          </span>
                        ) : (
                          <span
                            style={{
                              padding: '4px 10px',
                              borderRadius: '20px',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              backgroundColor: '#f1f5f9',
                              color: '#64748b',
                            }}
                          >
                            {v.status.toUpperCase()}
                          </span>
                        )}
                      </td>

                      <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                        {isActive && v.code && (
                          <button
                            onClick={() => handleConfirmDelivery(v.code!)}
                            disabled={deliveringCode === v.code}
                            style={{
                              padding: '6px 14px',
                              borderRadius: '6px',
                              backgroundColor: '#059669',
                              color: '#ffffff',
                              border: 'none',
                              fontSize: '0.78rem',
                              fontWeight: 600,
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                            }}
                          >
                            {deliveringCode === v.code ? (
                              <Loader2 size={13} className="animate-spin" />
                            ) : (
                              <CheckCircle2 size={13} />
                            )}
                            <span>Confirm Delivery</span>
                          </button>
                        )}

                        {isDelivered && (
                          <button
                            onClick={() => setReceiptVoucher(v)}
                            style={{
                              padding: '6px 12px',
                              borderRadius: '6px',
                              backgroundColor: '#f1f5f9',
                              color: 'var(--color-navy)',
                              border: '1px solid #cbd5e1',
                              fontSize: '0.78rem',
                              fontWeight: 600,
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '5px',
                            }}
                          >
                            <Printer size={13} />
                            <span>Receipt</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── PRINTABLE CLINICAL SETTLEMENT RECEIPT MODAL ── */}
      {receiptVoucher && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 40, 91, 0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px',
          }}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '16px',
              maxWidth: '560px',
              width: '100%',
              padding: '32px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
              position: 'relative',
            }}
          >
            <button
              onClick={() => setReceiptVoucher(null)}
              style={{
                position: 'absolute',
                top: '18px',
                right: '18px',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: '#64748b',
              }}
            >
              <X size={20} />
            </button>

            <div style={{ textAlign: 'center', borderBottom: '2px solid #f1f5f9', paddingBottom: '20px', marginBottom: '20px' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: 'var(--color-navy)', fontWeight: 800, fontSize: '1.25rem' }}>
                <Stethoscope size={22} color="var(--color-gold-bright)" />
                ODS GLOBAL NETWORK
              </div>
              <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '4px' }}>
                Clinical Voucher Delivery & Settlement Certificate
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '0.88rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed #e2e8f0', paddingBottom: '8px' }}>
                <span style={{ color: '#64748b' }}>Voucher Claim Code:</span>
                <span style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--color-navy)' }}>
                  {receiptVoucher.code}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed #e2e8f0', paddingBottom: '8px' }}>
                <span style={{ color: '#64748b' }}>Service Delivered:</span>
                <span style={{ fontWeight: 600, color: '#1e293b' }}>
                  {receiptVoucher.service_title || 'Clinical Healthcare Service'}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed #e2e8f0', paddingBottom: '8px' }}>
                <span style={{ color: '#64748b' }}>Patient Name:</span>
                <span style={{ fontWeight: 600, color: '#1e293b' }}>
                  {receiptVoucher.recipient_name || 'Patient'}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed #e2e8f0', paddingBottom: '8px' }}>
                <span style={{ color: '#64748b' }}>Provider Facility:</span>
                <span style={{ fontWeight: 600, color: '#1e293b' }}>
                  {receiptVoucher.provider_name || providerName}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed #e2e8f0', paddingBottom: '8px' }}>
                <span style={{ color: '#64748b' }}>Service Delivery Timestamp:</span>
                <span style={{ fontWeight: 600, color: '#1e293b' }}>
                  {receiptVoucher.delivered_at ? new Date(receiptVoucher.delivered_at).toLocaleString() : new Date().toLocaleString()}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', backgroundColor: '#f8fafc', borderRadius: '8px', marginTop: '6px' }}>
                <span style={{ fontWeight: 700, color: 'var(--color-navy)' }}>Clinical Value for Settlement:</span>
                <span style={{ fontWeight: 800, color: '#059669', fontSize: '1.05rem' }}>
                  {typeof receiptVoucher.initial_amount === 'number'
                    ? receiptVoucher.initial_amount.toLocaleString()
                    : receiptVoucher.initial_amount}{' '}
                  {receiptVoucher.currency}
                </span>
              </div>
            </div>

            <div style={{ marginTop: '24px', display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => window.print()}
                style={{
                  padding: '10px 18px',
                  borderRadius: '8px',
                  backgroundColor: 'var(--color-navy)',
                  color: '#ffffff',
                  border: 'none',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <Printer size={15} />
                <span>Print Certificate</span>
              </button>
              <button
                type="button"
                onClick={() => setReceiptVoucher(null)}
                style={{
                  padding: '10px 18px',
                  borderRadius: '8px',
                  backgroundColor: '#f1f5f9',
                  color: '#475569',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProviderVouchersTab;
