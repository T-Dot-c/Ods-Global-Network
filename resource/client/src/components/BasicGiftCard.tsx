import React, { useRef } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

// Helper to get logo URL that works in both local and production
const getLogoUrl = () => {
  // Use window location to construct absolute URL for production
  if (typeof window !== 'undefined') {
    const isProduction = window.location.hostname === 'www.wanaw.et' || window.location.hostname === 'wanaw.et';
    if (isProduction) {
      return `${window.location.protocol}//${window.location.host}/wanaw%20gifting%20logo.jpeg`;
    }
  }
  // Fallback to relative path for local development
  return "/wanaw gifting logo.jpeg";
};

interface BasicGiftCardProps {
  recipientName: string;
  code: string;
  senderName: string;
  serviceTitle?: string;
  serviceCategory?: string;
  serviceProvider?: string;
  serviceLocation?: string;
  message?: string;
  occasion?: string;
}

const BasicGiftCard: React.FC<BasicGiftCardProps> = ({
  recipientName,
  code,
  senderName,
  serviceTitle,
  serviceCategory,
  serviceProvider,
  serviceLocation,
  message,
  occasion,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);

  /** Download as PDF */
  const downloadAsPDF = async () => {
    if (!cardRef.current) return;
    const canvas = await html2canvas(cardRef.current, { scale: 2 });
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("p", "mm", "a4");
    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
    pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
    pdf.save("basic-gift-card.pdf");
  };

  /** Download as PNG */
  const downloadAsPNG = async () => {
    if (!cardRef.current) return;
    const canvas = await html2canvas(cardRef.current, { scale: 2 });
    const link = document.createElement("a");
    link.href = canvas.toDataURL("image/png");
    link.download = "basic-gift-card.png";
    link.click();
  };

  return (
    <div className="flex flex-col items-center">
      {/* Gift Card */}
      <div
        ref={cardRef}
        className="w-full max-w-md mx-auto bg-gradient-to-br from-[#fffaf5] to-[#fff3e0] rounded-2xl shadow-2xl p-6 sm:p-8 font-poppins relative overflow-hidden"
      >
      {/* Decorative Circles */}
      <div className="absolute -top-12 -left-12 w-32 h-32 bg-gradient-to-br from-[#D4AF37] to-[#1c2b21] rounded-full opacity-20 animate-spin-slow"></div>
      <div className="absolute -bottom-12 -right-12 w-40 h-40 bg-gradient-to-tr from-[#D4AF37] to-[#1c2b21] rounded-full opacity-20 animate-pulse"></div>

      {/* Header */}
      <h2 className="text-2xl font-bold text-[#D4AF37] text-center mb-4">Gift Card</h2>

      {/* Recipient Info */}
      <div className="text-center mb-6 space-y-1">
        <p className="text-gray-800 font-medium">To: {recipientName}</p>
        <p className="text-gray-800 font-medium">From: {senderName}</p>
      </div>

      {/* Gift Code Box */}
      <div className="w-full bg-[#fff4e6] border-2 border-dashed border-[#D4AF37] rounded-xl py-3 flex flex-col items-center mb-6 shadow-inner">
        <p className="text-[#D4AF37] font-semibold text-lg">🎉 Gift Code</p>
        <p className="text-2xl font-bold text-[#1c2b21] mt-1">{code}</p>
      </div>

      {/* Service Details */}
      <div className="text-center mb-4 space-y-1 text-gray-600 text-sm">
        {serviceTitle && <p>Service: {serviceTitle}</p>}
        {serviceCategory && <p>Category: {serviceCategory}</p>}
        {serviceProvider && <p>Provider: {serviceProvider}</p>}
        {serviceLocation && <p>Location: {serviceLocation}</p>}
        {occasion && <p>Occasion: {occasion}</p>}
        {message && <p className="italic">Message: {message}</p>}
      </div>

      {/* Motto */}
      <p className="text-center italic text-gray-500 mb-4">“Ethiopian Blessings, Modern Gifting”</p>

      {/* Footer */}
      <div className="w-full border-t border-[#D4AF37] pt-4 text-center space-y-1 text-gray-800 text-sm">
        <p>📞 +251-960-606-042</p>
        <p>📧 support@odsglobal.net</p>
        <p>🌐 <a href="https://www.odsglobal.net/" target="_blank" className="text-[#D4AF37] hover:underline">www.odsglobal.net</a></p>
      </div>

      {/* ODS Global Network Logo - Below Invoice */}
      <div className="w-full mt-6 pt-4 border-t-2 border-[#D4AF37]/30 flex justify-center">
        <img
          src={getLogoUrl()}
          alt="ODS Global Network Logo"
          className="h-16 w-16 md:h-20 md:w-20 rounded-full object-cover border-2 border-[#D4AF37] shadow-lg"
          onError={(e) => {
            console.error("Logo failed to load, trying fallback");
            // Fallback to relative path if absolute fails
            if ((e.target as HTMLImageElement).src.includes("www.wanaw.et")) {
              (e.target as HTMLImageElement).src = "/wanaw gifting logo.jpeg";
            } else {
              (e.target as HTMLImageElement).style.display = "none";
            }
          }}
        />
      </div>
      </div>

      {/* Download Buttons */}
      <div className="mt-4 flex gap-2">
        <button
          onClick={downloadAsPDF}
          className="px-4 py-2 bg-[#1c2b21] text-[#D4AF37] rounded-lg hover:bg-[#2a3a2f] transition-colors text-sm font-medium"
        >
          📄 Download PDF
        </button>
        <button
          onClick={downloadAsPNG}
          className="px-4 py-2 bg-[#D4AF37] text-[#1c2b21] rounded-lg hover:bg-[#e6c200] transition-colors text-sm font-medium"
        >
          🖼️ Download PNG
        </button>
      </div>
    </div>
  );
};

export default BasicGiftCard;


