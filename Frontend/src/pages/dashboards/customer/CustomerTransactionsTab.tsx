import React, { useState, useEffect } from 'react';
import { CreditCard, Loader2, RefreshCw, CheckCircle2, Clock, XCircle, Printer, PlusCircle } from 'lucide-react';
import { Button } from '../../../components/common/Button';
import { Input } from '../../../components/common/Input';
import { getPaymentHistory, initializePayment, getReceipt, Transaction, PaymentReceipt } from '../../../services/paymentService';

export const CustomerTransactionsTab: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  // New Payment Modal state
  const [showPayModal, setShowPayModal] = useState<boolean>(false);
  const [payAmount, setPayAmount] = useState<string>('250');
  const [payPurpose, setPayPurpose] = useState<string>('Consultation Service');
  const [payLoading, setPayLoading] = useState<boolean>(false);
  const [payError, setPayError] = useState<string>('');

  // View Receipt Modal state
  const [selectedReceipt, setSelectedReceipt] = useState<PaymentReceipt | null>(null);

  const fetchTransactions = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);

    const res = await getPaymentHistory();
    if (res.success && res.transactions) {
      setTransactions(res.transactions);
      setError('');
    } else {
      setError(res.message || 'Unable to load transaction records.');
    }

    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  const handleStartPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setPayError('');
    setPayLoading(true);

    const amountNum = parseFloat(payAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setPayError('Please enter a valid amount greater than 0.');
      setPayLoading(false);
      return;
    }

    const res = await initializePayment({
      amount: amountNum,
      currency: 'ETB',
      purpose: payPurpose || 'ODS Service Payment',
      paymentMethod: 'chapa',
    });

    setPayLoading(false);

    if (res.success && res.checkout_url) {
      // Redirect to Chapa checkout / simulator
      window.location.href = res.checkout_url;
    } else {
      setPayError(res.message || 'Failed to initialize payment.');
    }
  };

  const handleViewReceipt = async (txRef: string) => {
    const res = await getReceipt(txRef);
    if (res.success && res.receipt) {
      setSelectedReceipt(res.receipt);
    } else {
      alert(res.message || 'Unable to display receipt.');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            padding: '3px 9px',
            borderRadius: '12px',
            fontSize: '12px',
            fontWeight: 600,
            backgroundColor: '#ecfdf5',
            color: '#047857',
            textTransform: 'capitalize',
          }}>
            <CheckCircle2 size={12} />
            Completed
          </span>
        );
      case 'pending':
        return (
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            padding: '3px 9px',
            borderRadius: '12px',
            fontSize: '12px',
            fontWeight: 600,
            backgroundColor: '#fef3c7',
            color: '#b45309',
            textTransform: 'capitalize',
          }}>
            <Clock size={12} />
            Pending
          </span>
        );
      case 'failed':
      case 'cancelled':
        return (
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            padding: '3px 9px',
            borderRadius: '12px',
            fontSize: '12px',
            fontWeight: 600,
            backgroundColor: '#fef2f2',
            color: '#b91c1c',
            textTransform: 'capitalize',
          }}>
            <XCircle size={12} />
            {status}
          </span>
        );
      default:
        return <span>{status}</span>;
    }
  };

  return (
    <div>
      {/* Tab Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#0F285B', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CreditCard size={20} color="#BE9B49" />
            Billing & Transactions
          </h2>
          <p style={{ color: '#64748b', fontSize: '14px', marginTop: '4px' }}>
            View itemized transaction receipts and complete payments via Chapa.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <Button
            variant="outline-gold"
            onClick={() => fetchTransactions(true)}
            disabled={refreshing}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', padding: '8px 14px' }}
          >
            <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
            Refresh
          </Button>

          <Button
            variant="gold"
            onClick={() => setShowPayModal(true)}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', padding: '8px 16px' }}
          >
            <PlusCircle size={15} />
            New Payment
          </Button>
        </div>
      </div>

      {/* Main Table Content */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '48px 0' }}>
          <Loader2 style={{ width: '36px', height: '36px', color: '#0F285B', animation: 'spin 1s linear infinite', margin: '0 auto' }} />
          <p style={{ color: '#64748b', fontSize: '14px', marginTop: '12px' }}>Loading payment history...</p>
        </div>
      ) : error ? (
        <div style={{ padding: '24px', backgroundColor: '#fef2f2', borderRadius: '12px', border: '1px solid #fee2e2', color: '#b91c1c' }}>
          <p style={{ margin: 0, fontWeight: 500 }}>{error}</p>
        </div>
      ) : transactions.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 16px', backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>
          <CreditCard size={40} style={{ color: '#94a3b8', margin: '0 auto 12px' }} />
          <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#334155', margin: '0 0 6px 0' }}>No Transactions Yet</h3>
          <p style={{ color: '#64748b', fontSize: '13px', maxWidth: '360px', margin: '0 auto 18px' }}>
            You haven't made any payments yet. You can test a payment using our free Chapa sandbox.
          </p>
          <Button variant="gold" onClick={() => setShowPayModal(true)}>
            Make a Payment
          </Button>
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #e2e8f0', color: '#64748b' }}>
                <th style={{ padding: '12px 14px', fontWeight: 600 }}>Date</th>
                <th style={{ padding: '12px 14px', fontWeight: 600 }}>Reference</th>
                <th style={{ padding: '12px 14px', fontWeight: 600 }}>Purpose</th>
                <th style={{ padding: '12px 14px', fontWeight: 600 }}>Amount</th>
                <th style={{ padding: '12px 14px', fontWeight: 600 }}>Status</th>
                <th style={{ padding: '12px 14px', fontWeight: 600, textAlign: 'right' }}>Receipt</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx) => (
                <tr key={tx.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '14px', color: '#334155' }}>
                    {new Date(tx.created_at).toLocaleDateString()}
                  </td>
                  <td style={{ padding: '14px', fontFamily: 'monospace', fontWeight: 600, color: '#0F285B' }}>
                    {tx.tx_ref}
                  </td>
                  <td style={{ padding: '14px', color: '#334155' }}>
                    {tx.purpose}
                  </td>
                  <td style={{ padding: '14px', fontWeight: 700, color: '#047857' }}>
                    {parseFloat(String(tx.amount)).toFixed(2)} {tx.currency}
                  </td>
                  <td style={{ padding: '14px' }}>
                    {getStatusBadge(tx.status)}
                  </td>
                  <td style={{ padding: '14px', textAlign: 'right' }}>
                    <Button
                      variant="outline-gold"
                      onClick={() => handleViewReceipt(tx.tx_ref)}
                      style={{ padding: '4px 10px', fontSize: '12px' }}
                    >
                      Receipt
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* New Payment Modal */}
      {showPayModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '16px',
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            maxWidth: '460px',
            width: '100%',
            padding: '28px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)',
          }}>
            <h3 style={{ margin: '0 0 6px 0', fontSize: '18px', color: '#0F285B', fontWeight: 700 }}>
              Initiate Chapa Payment
            </h3>
            <p style={{ color: '#64748b', fontSize: '13px', margin: '0 0 20px 0' }}>
              Test payment processing using the 100% free Chapa sandbox mode.
            </p>

            <form onSubmit={handleStartPayment}>
              {payError && (
                <div style={{ padding: '10px 14px', backgroundColor: '#fef2f2', color: '#b91c1c', borderRadius: '8px', fontSize: '13px', marginBottom: '14px' }}>
                  {payError}
                </div>
              )}

              <div style={{ marginBottom: '14px' }}>
                <Input
                  label="Amount (ETB)"
                  type="number"
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  placeholder="250"
                  required
                />
              </div>

              <div style={{ marginBottom: '22px' }}>
                <Input
                  label="Purpose / Service"
                  type="text"
                  value={payPurpose}
                  onChange={(e) => setPayPurpose(e.target.value)}
                  placeholder="e.g. Medical Consultation"
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <Button
                  type="button"
                  variant="outline-gold"
                  onClick={() => setShowPayModal(false)}
                  disabled={payLoading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="gold"
                  disabled={payLoading}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  {payLoading && <Loader2 size={14} className="animate-spin" />}
                  Proceed to Chapa
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Receipt View Modal */}
      {selectedReceipt && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '16px',
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            maxWidth: '520px',
            width: '100%',
            padding: '28px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', color: '#0F285B', fontWeight: 700 }}>
                Payment Receipt
              </h3>
              <button
                onClick={() => setSelectedReceipt(null)}
                style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#94a3b8' }}
              >
                ✕
              </button>
            </div>

            <div style={{ backgroundColor: '#f8fafc', padding: '18px', borderRadius: '10px', border: '1px solid #e2e8f0', marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0', paddingBottom: '10px', marginBottom: '12px' }}>
                <span style={{ color: '#64748b', fontSize: '13px' }}>Amount:</span>
                <span style={{ fontSize: '18px', fontWeight: 700, color: '#047857' }}>
                  {selectedReceipt.amount.toFixed(2)} {selectedReceipt.currency}
                </span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '12px' }}>
                <div>
                  <span style={{ color: '#64748b', display: 'block' }}>Reference:</span>
                  <span style={{ fontFamily: 'monospace', fontWeight: 600, color: '#0F285B' }}>{selectedReceipt.tx_ref}</span>
                </div>
                <div>
                  <span style={{ color: '#64748b', display: 'block' }}>Status:</span>
                  <span style={{ color: '#047857', fontWeight: 600, textTransform: 'capitalize' }}>{selectedReceipt.status}</span>
                </div>
                <div>
                  <span style={{ color: '#64748b', display: 'block' }}>Purpose:</span>
                  <span style={{ color: '#334155' }}>{selectedReceipt.purpose}</span>
                </div>
                <div>
                  <span style={{ color: '#64748b', display: 'block' }}>Date:</span>
                  <span style={{ color: '#334155' }}>{new Date(selectedReceipt.completed_at || selectedReceipt.created_at).toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <Button
                variant="outline-gold"
                onClick={() => window.print()}
                style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <Printer size={15} />
                Print
              </Button>
              <Button
                variant="gold"
                onClick={() => setSelectedReceipt(null)}
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
