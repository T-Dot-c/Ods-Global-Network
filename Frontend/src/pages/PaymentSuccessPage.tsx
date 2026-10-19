import React, { useState, useEffect } from 'react';
import { CheckCircle2, AlertCircle, Loader2, Printer, ArrowRight } from 'lucide-react';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { getReceipt, PaymentReceipt } from '../services/paymentService';

interface PaymentSuccessPageProps {
  onNavigate?: (view: string) => void;
}

export const PaymentSuccessPage: React.FC<PaymentSuccessPageProps> = ({ onNavigate }) => {
  const [receipt, setReceipt] = useState<PaymentReceipt | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const txRef = params.get('tx_ref') ||
      params.get('txRef') ||
      params.get('trx_ref') ||
      params.get('reference') ||
      sessionStorage.getItem('ods_last_payment_tx_ref');

    if (sessionStorage.getItem('ods_last_payment_tx_ref')) {
      sessionStorage.removeItem('ods_last_payment_tx_ref');
    }

    if (!txRef) {
      setLoading(false);
      setErrorMessage('No transaction reference was provided in the return URL.');
      return;
    }

    let isMounted = true;
    async function loadReceipt() {
      const res = await getReceipt(txRef!);
      if (!isMounted) return;

      if (res.success && res.receipt) {
        setReceipt(res.receipt);
        setLoading(false);
      } else {
        setErrorMessage(res.message || 'Unable to retrieve verified payment receipt.');
        setLoading(false);
      }
    }

    loadReceipt();
    return () => {
      isMounted = false;
    };
  }, []);

  const handlePrint = () => {
    window.print();
  };

  const handleDashboard = () => {
    if (onNavigate) {
      onNavigate('customer');
    } else {
      window.location.href = '/customer';
    }
  };

  return (
    <div style={{
      minHeight: '80vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 16px',
      backgroundColor: '#f8fafc',
    }}>
      <Card style={{
        maxWidth: '560px',
        width: '100%',
        padding: '36px 32px',
        borderRadius: '16px',
        boxShadow: '0 10px 25px -5px rgba(15, 40, 91, 0.08)',
        border: '1px solid #e2e8f0',
        backgroundColor: '#ffffff',
      }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <Loader2 style={{ width: '44px', height: '44px', color: '#0F285B', animation: 'spin 1s linear infinite', margin: '0 auto' }} />
            <h2 style={{ marginTop: '20px', color: '#0F285B', fontSize: '18px', fontWeight: 600 }}>
              Verifying Payment...
            </h2>
            <p style={{ color: '#64748b', fontSize: '14px', marginTop: '6px' }}>
              Confirming transaction status with the payment gateway.
            </p>
          </div>
        ) : errorMessage ? (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <AlertCircle style={{ width: '52px', height: '52px', color: '#ef4444', margin: '0 auto' }} />
            <h2 style={{ marginTop: '16px', color: '#0F285B', fontSize: '20px', fontWeight: 700 }}>
              Transaction Not Verified
            </h2>
            <p style={{ color: '#64748b', fontSize: '14px', marginTop: '8px', lineHeight: 1.5 }}>
              {errorMessage}
            </p>
            <div style={{ marginTop: '28px', display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <Button variant="outline-gold" onClick={handleDashboard}>
                Back to Dashboard
              </Button>
            </div>
          </div>
        ) : receipt ? (
          <div>
            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <div style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                backgroundColor: '#ecfdf5',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
              }}>
                <CheckCircle2 style={{ width: '36px', height: '36px', color: '#10b981' }} />
              </div>
              <h1 style={{ color: '#0F285B', fontSize: '22px', fontWeight: 700, margin: 0 }}>
                Payment Successful
              </h1>
              <p style={{ color: '#64748b', fontSize: '14px', marginTop: '4px' }}>
                Thank you! Your payment has been received and verified.
              </p>
            </div>

            {/* Receipt Summary Card */}
            <div style={{
              backgroundColor: '#f8fafc',
              borderRadius: '12px',
              border: '1px solid #e2e8f0',
              padding: '20px',
              marginBottom: '24px',
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottom: '1px solid #e2e8f0',
                paddingBottom: '14px',
                marginBottom: '14px',
              }}>
                <span style={{ color: '#64748b', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Total Paid
                </span>
                <span style={{ fontSize: '22px', fontWeight: 700, color: '#047857' }}>
                  {receipt.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {receipt.currency}
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '13px' }}>
                <div>
                  <span style={{ color: '#64748b', display: 'block' }}>Reference</span>
                  <span style={{ fontWeight: 600, color: '#0F285B', wordBreak: 'break-all', fontFamily: 'monospace' }}>
                    {receipt.tx_ref}
                  </span>
                </div>
                <div>
                  <span style={{ color: '#64748b', display: 'block' }}>Status</span>
                  <span style={{
                    display: 'inline-block',
                    padding: '2px 8px',
                    borderRadius: '12px',
                    fontSize: '11px',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    backgroundColor: '#ecfdf5',
                    color: '#047857',
                    marginTop: '2px',
                  }}>
                    {receipt.status}
                  </span>
                </div>
                <div>
                  <span style={{ color: '#64748b', display: 'block' }}>Purpose</span>
                  <span style={{ fontWeight: 500, color: '#334155' }}>
                    {receipt.purpose}
                  </span>
                </div>
                <div>
                  <span style={{ color: '#64748b', display: 'block' }}>Date</span>
                  <span style={{ color: '#334155' }}>
                    {new Date(receipt.completed_at || receipt.created_at).toLocaleDateString()}
                  </span>
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                  <span style={{ color: '#64748b', display: 'block' }}>Payer</span>
                  <span style={{ color: '#334155', fontWeight: 500 }}>
                    {receipt.customer_name} ({receipt.customer_email})
                  </span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'space-between' }}>
              <Button
                variant="outline-gold"
                onClick={handlePrint}
                style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
              >
                <Printer style={{ width: '16px', height: '16px' }} />
                Print Receipt
              </Button>
              <Button
                variant="gold"
                onClick={handleDashboard}
                style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
              >
                Go to Dashboard
                <ArrowRight style={{ width: '16px', height: '16px' }} />
              </Button>
            </div>
          </div>
        ) : null}
      </Card>
    </div>
  );
};
