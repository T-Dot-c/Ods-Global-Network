import { useEffect, useState } from "react";
import axios from "axios";
import BASE_URL from "../../../api/api";
import { CreditCard, DollarSign, Calendar, TrendingUp, Receipt } from "lucide-react";

type PaymentData = {
  totalSpent: number;
  totalTransactions: number;
  lastPaymentDate: string;
  averageTransactionAmount: number;
  monthlySpending: Array<{
    month: string;
    amount: number;
  }>;
};

type PaymentSummaryProps = {
  userId: string;
};

const PaymentSummary = ({ userId }: PaymentSummaryProps) => {
  const [paymentData, setPaymentData] = useState<PaymentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPaymentData = async () => {
      try {
        setLoading(true);
        // Enhanced authentication handling (try multiple methods)
        const userStr = localStorage.getItem("user");
        const token = localStorage.getItem("token") || (userStr ? JSON.parse(userStr).token : null);
        
        if (!token) {
          setError("Please login to view payment summary");
          return;
        }

        // Fetch purchases to calculate payment summary
        const response = await axios.get(`${BASE_URL}/api/services/purchase`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        const purchases = response.data;
        
        // Calculate payment summary from purchases
        const totalSpent = purchases.reduce((sum: number, purchase: any) => sum + purchase.amount, 0);
        const totalTransactions = purchases.length;
        const lastPaymentDate = purchases.length > 0 ? purchases[0].purchaseDate : null;
        const averageTransactionAmount = totalTransactions > 0 ? totalSpent / totalTransactions : 0;
        
        // Group by month for monthly spending
        const monthlySpending = purchases.reduce((acc: any, purchase: any) => {
          const month = new Date(purchase.purchaseDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
          if (!acc[month]) {
            acc[month] = 0;
          }
          acc[month] += purchase.amount;
          return acc;
        }, {});
        
        const monthlySpendingArray = Object.entries(monthlySpending).map(([month, amount]) => ({
          month,
          amount: amount as number
        }));

        setPaymentData({
          totalSpent,
          totalTransactions,
          lastPaymentDate: lastPaymentDate || new Date().toISOString(),
          averageTransactionAmount,
          monthlySpending: monthlySpendingArray
        });
      } catch (err) {
        console.error("Payment fetch error:", err);
        setError("Failed to load payment summary");
      } finally {
        setLoading(false);
      }
    };

    fetchPaymentData();
  }, [userId]);

  if (loading) {
    return (
      <div className="p-6 bg-white rounded-xl shadow-md border border-gray-100">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#D4AF37]"></div>
          <span className="ml-3 text-[#1c2b21]">Loading payment summary...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-white rounded-xl shadow-md border border-gray-100">
        <div className="text-center py-8">
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  if (!paymentData) {
    return (
      <div className="p-6 bg-white rounded-xl shadow-md border border-gray-100">
        <div className="text-center py-8">
          <p className="text-gray-600">No payment data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
        <h2 className="text-2xl font-bold text-[#1c2b21] mb-6 flex items-center">
          <CreditCard className="w-6 h-6 mr-3 text-[#D4AF37]" />
          Payment Summary
        </h2>
        
        {/* Payment Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-gradient-to-r from-[#1c2b21] to-[#1c2b21] rounded-lg p-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[#D4AF37] text-sm font-medium">Total Spent</p>
                <p className="text-2xl font-bold">ETB {paymentData.totalSpent.toLocaleString()}</p>
              </div>
              <DollarSign className="w-8 h-8 text-[#D4AF37]" />
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-[#D4AF37] to-[#D4AF37] rounded-lg p-4 text-[#1c2b21]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[#1c2b21] text-sm font-medium">Transactions</p>
                <p className="text-2xl font-bold">{paymentData.totalTransactions}</p>
              </div>
              <Receipt className="w-8 h-8 text-[#1c2b21]" />
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-[#1c2b21] to-[#1c2b21] rounded-lg p-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[#D4AF37] text-sm font-medium">Average</p>
                <p className="text-2xl font-bold">ETB {Math.round(paymentData.averageTransactionAmount).toLocaleString()}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-[#D4AF37]" />
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-[#D4AF37] to-[#D4AF37] rounded-lg p-4 text-[#1c2b21]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[#1c2b21] text-sm font-medium">Last Payment</p>
                <p className="text-lg font-bold">{new Date(paymentData.lastPaymentDate).toLocaleDateString()}</p>
              </div>
              <Calendar className="w-8 h-8 text-[#1c2b21]" />
            </div>
          </div>
        </div>

        {/* Monthly Spending Chart */}
        {paymentData.monthlySpending.length > 0 && (
          <div className="mt-6">
            <h3 className="text-lg font-semibold text-[#1c2b21] mb-4">Monthly Spending</h3>
            <div className="space-y-3">
              {paymentData.monthlySpending.map((month, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-[#f5f5f5] rounded-lg">
                  <span className="font-medium text-[#1c2b21]">{month.month}</span>
                  <span className="font-bold text-[#D4AF37]">ETB {month.amount.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {paymentData.totalTransactions === 0 && (
          <div className="text-center py-12">
            <CreditCard className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-[#1c2b21] mb-2">No payments yet</h3>
            <p className="text-gray-600">Your payment history will appear here once you make your first purchase.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentSummary;


