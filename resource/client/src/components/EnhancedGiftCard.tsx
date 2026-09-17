import { useRef } from "react";
import html2pdf from "html2pdf.js";
import QRCode from "react-qr-code";

interface EnhancedGiftCardProps {
  gift: {
    _id: string;
    recipient?: {
      name?: string;
      email?: string;
      phone?: string;
      whatsapp?: string;
      telegram?: string;
    };
    service?: {
      title?: string;
      category?: string;
    };
    occasion?: string;
    giftCode?: string;
    deliveryStatus?: "pending" | "delivered";
    senderName?: string;
    provider?: {
      fullName?: string;
      email?: string;
    };
    serviceLocation?: string;
    amount?: number;
    currency?: string;
    message?: string;
  };
  onDownload?: () => void;
}

const EnhancedGiftCard = ({ gift, onDownload }: EnhancedGiftCardProps) => {
  const cardRef = useRef<HTMLDivElement>(null);

  const handleDownload = async () => {
    if (!cardRef.current) return;

    try {
      await html2pdf()
        .set({
          margin: [10, 10, 10, 10],
          filename: `GiftCard-${gift.giftCode || gift._id}.pdf`,
          image: { type: "jpeg", quality: 0.98 },
          html2canvas: { 
            scale: 2,
            useCORS: true,
            allowTaint: true,
            backgroundColor: "#ffffff"
          },
          jsPDF: { unit: "mm", format: "a4", orientation: "landscape" },
        })
        .from(cardRef.current)
        .save();
      
      if (onDownload) {
        onDownload();
      }
    } catch (error) {
      console.error("Gift card download failed:", error);
      alert("Failed to generate the gift card. Please try again.");
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case "delivered":
        return "bg-green-100 text-green-800 border-green-200";
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case "delivered":
        return "✅";
      case "pending":
        return "⏳";
      default:
        return "📋";
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
      {/* Gift Card Preview */}
      <div
        ref={cardRef}
        className="relative bg-gradient-to-br from-amber-50 via-yellow-50 to-amber-100 min-h-[400px] p-8"
        style={{
          background: "linear-gradient(145deg, #fef3c7, #fde68a, #f59e0b)",
          fontFamily: "'Inter', 'Segoe UI', sans-serif"
        }}
      >
        {/* Decorative Elements */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-amber-200/30 to-transparent rounded-bl-full"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-yellow-200/30 to-transparent rounded-tr-full"></div>
        
        {/* Header */}
        <div className="text-center mb-6 relative z-10">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-amber-500 to-yellow-600 rounded-full mb-4 shadow-lg">
            <span className="text-2xl">🎁</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Digital Gift Card</h2>
          <div className="w-16 h-1 bg-gradient-to-r from-amber-500 to-yellow-600 mx-auto rounded-full"></div>
        </div>

        {/* Main Content */}
        <div className="space-y-4 relative z-10">
          {/* Sender & Recipient */}
          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 shadow-sm border border-white/50">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="text-center">
                <p className="text-sm font-medium text-gray-600 mb-1">From</p>
                <p className="font-bold text-lg text-gray-800">{gift.senderName || "Anonymous"}</p>
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-gray-600 mb-1">To</p>
                <p className="font-bold text-lg text-gray-800">{gift.recipient?.name || "Recipient"}</p>
              </div>
            </div>
          </div>

          {/* Service Information */}
          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 shadow-sm border border-white/50">
            <div className="text-center mb-3">
              <h3 className="font-bold text-lg text-gray-800 mb-2">{gift.service?.title || "Service"}</h3>
              <div className="flex flex-wrap justify-center gap-2">
                <span className="px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-sm font-medium">
                  {gift.service?.category || "Category"}
                </span>
                {gift.occasion && (
                  <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium">
                    {gift.occasion}
                  </span>
                )}
              </div>
            </div>
            
            {/* Provider Information */}
            {gift.provider?.fullName && (
              <div className="text-center border-t border-gray-200 pt-3 mt-3">
                <p className="text-sm font-medium text-gray-600 mb-1">Service Provider</p>
                <p className="font-semibold text-gray-800">{gift.provider.fullName}</p>
                {gift.provider.email && (
                  <p className="text-sm text-gray-600">{gift.provider.email}</p>
                )}
              </div>
            )}

            {/* Service Location */}
            {gift.serviceLocation && (
              <div className="text-center border-t border-gray-200 pt-3 mt-3">
                <p className="text-sm font-medium text-gray-600 mb-1">📍 Service Location</p>
                <p className="font-semibold text-gray-800">{gift.serviceLocation}</p>
              </div>
            )}
          </div>

          {/* Gift Code & QR */}
          {gift.giftCode && (
            <div className="bg-white/90 backdrop-blur-sm rounded-xl p-4 shadow-sm border border-white/50 text-center">
              <p className="text-sm font-medium text-gray-600 mb-2">Gift Code</p>
              <div className="bg-gradient-to-r from-amber-100 to-yellow-100 rounded-lg p-3 mb-3 border border-amber-200">
                <p className="font-mono font-bold text-lg text-gray-800 tracking-wider">
                  {gift.giftCode}
                </p>
              </div>
              <div className="flex justify-center">
                <QRCode 
                  value={`https://wanaw.com/redeem?code=${gift.giftCode}`} 
                  size={80}
                  className="rounded-lg"
                />
              </div>
            </div>
          )}

          {/* Message */}
          {gift.message && (
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 shadow-sm border border-white/50">
              <p className="text-sm font-medium text-gray-600 mb-2">Personal Message</p>
              <p className="italic text-gray-700 text-center">"{gift.message}"</p>
            </div>
          )}

          {/* Footer */}
          <div className="text-center text-xs text-gray-500 pt-4 border-t border-white/50">
            <p>Generated on {new Date().toLocaleDateString()}</p>
            <p className="mt-1">Powered by ODS Global Network Support Community</p>
          </div>
        </div>
      </div>

      {/* Card Actions */}
      <div className="p-4 bg-gray-50 border-t border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">Status:</span>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(gift.deliveryStatus)}`}>
              {getStatusIcon(gift.deliveryStatus)} {gift.deliveryStatus || "Unknown"}
            </span>
          </div>
          <div className="text-sm text-gray-500">
            ID: {gift._id.slice(-8)}
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-600">
          {gift.recipient?.email && (
            <div>
              <span className="font-medium">Email:</span> {gift.recipient.email}
            </div>
          )}
          {gift.recipient?.phone && (
            <div>
              <span className="font-medium">Phone:</span> {gift.recipient.phone}
            </div>
          )}
        </div>

        <button
          onClick={handleDownload}
          className="w-full mt-4 bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl"
        >
          📥 Download Gift Card PDF
        </button>
      </div>
    </div>
  );
};

export default EnhancedGiftCard;
