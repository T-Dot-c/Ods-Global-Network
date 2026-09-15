import { useEffect, useState } from "react";
import axios from "axios";
import BASE_URL from "../../../api/api";
import { Users, Share2, Copy, CheckCircle, TrendingUp, Gift } from "lucide-react";

type ReferralData = {
  referralCode: string;
  referralClicks: number;
  referredUsers: Array<{
    id: number;
    fullName: string;
    email: string;
    role: string;
    createdAt: string;
  }>;
  totalEarnings: number;
};

type ReferralsProps = {
  userId: string;
};

const Referrals = ({ userId }: ReferralsProps) => {
  const [referralData, setReferralData] = useState<ReferralData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchReferralData = async () => {
      try {
        setLoading(true);
        
        // Enhanced authentication handling (try multiple methods)
        const userStr = localStorage.getItem("user");
        const token = localStorage.getItem("token") || (userStr ? JSON.parse(userStr).token : null);
        
        if (!token) {
          setError("Please login to view referral data");
          return;
        }

        // Get user data to access referral code
        const userResponse = await axios.get(`${BASE_URL}/api/users/profile`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        const user = userResponse.data;
        
        // Get referred users
        const referredResponse = await axios.get(`${BASE_URL}/api/users/referred`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        const referredUsers = referredResponse.data || [];
        
        // Calculate total earnings (mock calculation - you might want to implement actual earnings logic)
        const totalEarnings = referredUsers.length * 50; // ETB 50 per referral
        
        setReferralData({
          referralCode: user.referralCode,
          referralClicks: user.referralClicks || 0,
          referredUsers,
          totalEarnings
        });
      } catch (err) {
        console.error("Referral data fetch error:", err);
        setError("Failed to load referral data");
      } finally {
        setLoading(false);
      }
    };

    fetchReferralData();
  }, [userId]);

  const copyReferralLink = async () => {
    const referralLink = `${window.location.origin}/register?ref=${referralData?.referralCode}`;
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const shareReferralLink = async () => {
    const referralLink = `${window.location.origin}/register?ref=${referralData?.referralCode}`;
    const shareText = `Join me on ODS Global Network Health & Wellness! Use my referral code: ${referralData?.referralCode}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join ODS Global Network Health & Wellness',
          text: shareText,
          url: referralLink,
        });
      } catch (err) {
        console.error("Error sharing:", err);
      }
    } else {
      // Fallback to copying
      copyReferralLink();
    }
  };

  if (loading) {
    return (
      <div className="p-6 bg-white rounded-xl shadow-md border border-gray-100">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#D4AF37]"></div>
          <span className="ml-3 text-[#1c2b21]">Loading referral data...</span>
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

  if (!referralData) {
    return (
      <div className="p-6 bg-white rounded-xl shadow-md border border-gray-100">
        <div className="text-center py-8">
          <p className="text-gray-600">No referral data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
        <h2 className="text-2xl font-bold text-[#1c2b21] mb-6 flex items-center">
          <Users className="w-6 h-6 mr-3 text-[#D4AF37]" />
          Referral Program
        </h2>
        
        {/* Referral Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-gradient-to-r from-[#1c2b21] to-[#1c2b21] rounded-lg p-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[#D4AF37] text-sm font-medium">Total Referrals</p>
                <p className="text-2xl font-bold">{referralData.referredUsers.length}</p>
              </div>
              <Users className="w-8 h-8 text-[#D4AF37]" />
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-[#D4AF37] to-[#D4AF37] rounded-lg p-4 text-[#1c2b21]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[#1c2b21] text-sm font-medium">Link Clicks</p>
                <p className="text-2xl font-bold">{referralData.referralClicks}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-[#1c2b21]" />
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-[#1c2b21] to-[#1c2b21] rounded-lg p-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[#D4AF37] text-sm font-medium">Total Earnings</p>
                <p className="text-2xl font-bold">ETB {referralData.totalEarnings}</p>
              </div>
              <Gift className="w-8 h-8 text-[#D4AF37]" />
            </div>
          </div>
        </div>

        {/* Referral Code Section */}
        <div className="bg-[#f5f5f5] rounded-lg p-4 mb-6">
          <h3 className="text-lg font-semibold text-[#1c2b21] mb-3">Your Referral Code</h3>
          <div className="flex items-center space-x-3">
            <div className="flex-1 bg-white rounded-lg p-3 border border-gray-200">
              <code className="text-[#1c2b21] font-mono text-lg">{referralData.referralCode}</code>
            </div>
            <button
              onClick={copyReferralLink}
              className="bg-[#D4AF37] hover:bg-[#1c2b21] text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
            >
              {copied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Copied!' : 'Copy'}</span>
            </button>
            <button
              onClick={shareReferralLink}
              className="bg-[#1c2b21] hover:bg-[#D4AF37] text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
            >
              <Share2 className="w-4 h-4" />
              <span>Share</span>
            </button>
          </div>
          <p className="text-sm text-gray-600 mt-2">
            Share this code with friends to earn rewards when they join!
          </p>
        </div>

        {/* Referred Users */}
        <div>
          <h3 className="text-lg font-semibold text-[#1c2b21] mb-4">Referred Users</h3>
          {referralData.referredUsers.length === 0 ? (
            <div className="text-center py-8">
              <Users className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <h4 className="text-lg font-semibold text-[#1c2b21] mb-2">No referrals yet</h4>
              <p className="text-gray-600">Start sharing your referral code to earn rewards!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {referralData.referredUsers.map((user) => (
                <div key={user.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-[#D4AF37] rounded-full flex items-center justify-center text-[#1c2b21] font-bold">
                        {user.fullName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-[#1c2b21]">{user.fullName}</p>
                        <p className="text-sm text-gray-600">{user.email}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="inline-block bg-[#D4AF37] text-[#1c2b21] text-xs font-medium px-2 py-1 rounded-full">
                        {user.role}
                      </span>
                      <p className="text-xs text-gray-500 mt-1">
                        Joined {new Date(user.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Referrals;
