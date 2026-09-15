import React, { useRef, useState, useEffect } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import BASE_URL from "../api/api";
import axios from "axios";
import QRCode from "react-qr-code";

// Helper to get logo URL
const getLogoUrl = () => {
  if (typeof window !== 'undefined') {
    const isProduction = window.location.hostname === 'www.odsglobal.net' || window.location.hostname === 'odsglobal.net';
    if (isProduction) {
      return `${window.location.protocol}//${window.location.host}/brand/ods-logo-mark-gold.png`;
    }
  }
  return "/brand/ods-logo-mark-gold.png";
};

interface VipGiftCardProps {
  recipientName?: string;
  code?: string;
  senderName?: string;
  serviceTitle?: string;
  serviceCategory?: string;
  serviceProvider?: string;
  serviceLocation?: string;
  message?: string;
  recipientEmail?: string;
  recipientPhone?: string;
  providerName?: string;
  photo?: string;
  occasion?: string;
  totalAmount?: number;
  currency?: "ETB" | "USD";
  giftId?: string;
}

interface GiftData {
  _id: string;
  recipient?: {
    name?: string;
    email?: string;
    phone?: string;
    whatsapp?: string;
    telegram?: string;
    photo?: string;
  };
  service?: {
    title?: string;
    category?: string;
    location?: string;
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
}

const VipGiftCard: React.FC<VipGiftCardProps> = ({
  recipientName,
  code,
  senderName,
  serviceTitle,
  serviceCategory,
  serviceProvider,
  serviceLocation,
  message,
  recipientEmail,
  recipientPhone,
  providerName,
  photo,
  occasion,
  currency = "ETB",
  giftId,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [giftData, setGiftData] = useState<GiftData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch gift data from API if giftId is provided
  useEffect(() => {
    const fetchGiftData = async () => {
      if (!giftId) return;
      
      setLoading(true);
      try {
        console.log("🎁 Fetching VIP gift data from /gifts/with-codes endpoint...");
        const res = await axios.get(`${BASE_URL}/gifts/with-codes`);
        const fetchedGifts = res.data || [];
        
        const specificGift = fetchedGifts.find((gift: any) => 
          gift.giftId === giftId || gift._id === giftId
        );
        
        if (specificGift) {
          const mappedGift: GiftData = {
            _id: specificGift.giftId || specificGift._id || `gift-${Math.random()}`,
            service: {
              title: specificGift.service?.title || specificGift.service_title || "N/A",
              category: specificGift.service?.category || specificGift.service_category || "N/A",
              location: specificGift.serviceLocation || specificGift.service_location || "N/A",
            },
            senderName: specificGift.senderName || "Unknown",
            provider: {
              fullName: specificGift.provider?.fullName || specificGift.provider_name || "N/A",
              email: specificGift.provider?.email || specificGift.provider_email || "",
            },
            occasion: specificGift.occasion || specificGift.occasion_name || "Special Gift",
            giftCode: specificGift.giftCode || specificGift.gift_code || null,
            deliveryStatus: specificGift.deliveryStatus || specificGift.delivery_status || "pending",
            recipient: {
              name: specificGift.recipient?.name || specificGift.recipient_name || "N/A",
              email: specificGift.recipient?.email || specificGift.recipient_email || "",
              phone: specificGift.recipient?.phone || specificGift.recipient_phone || "",
              whatsapp: specificGift.recipient?.whatsapp || specificGift.recipient_whatsapp || "",
              telegram: specificGift.recipient?.telegram || specificGift.recipient_telegram || "",
              photo: specificGift.recipient?.photo || specificGift.recipient_photo || "",
            },
            serviceLocation: specificGift.serviceLocation || specificGift.service_location || "N/A",
            amount: specificGift.amount || 0,
            currency: specificGift.currency || "ETB",
            message: specificGift.message || "",
          };
          
          setGiftData(mappedGift);
          console.log("✅ VIP gift data fetched:", mappedGift);
        } else {
          setError("Gift not found");
        }
      } catch (err) {
        console.error("❌ Failed to fetch VIP gift data:", err);
        setError("Failed to load gift data");
      } finally {
        setLoading(false);
      }
    };

    fetchGiftData();
  }, [giftId]);

  /** ✅ Download as PDF */
  const downloadAsPDF = async () => {
    if (!cardRef.current) return;
    try {
      const canvas = await html2canvas(cardRef.current, { 
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#ffffff"
      });
    const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("portrait", "mm", "a4");
    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
    pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(`VIP-GiftCard-${displayData.code || giftData?.giftCode || 'unknown'}.pdf`);
    } catch (error) {
      console.error("PDF generation failed:", error);
      alert("Failed to generate PDF. Please try again.");
    }
  };

  /** ✅ Download as PNG */
  const downloadAsPNG = async () => {
    if (!cardRef.current) return;
    try {
    const canvas = await html2canvas(cardRef.current, { scale: 2 });
    const link = document.createElement("a");
    link.href = canvas.toDataURL("image/png");
      link.download = `VIP-GiftCard-${displayData.code || giftData?.giftCode || 'unknown'}.png`;
    link.click();
    } catch (error) {
      console.error("PNG generation failed:", error);
      alert("Failed to generate PNG. Please try again.");
    }
  };

  // Fix photo path - prioritize props over fetched data
  const recipientPhoto = photo || giftData?.recipient?.photo;
  let photoUrl = null;
  
  if (recipientPhoto && typeof recipientPhoto === 'string' && recipientPhoto.trim() !== '' && recipientPhoto !== '{}') {
    // If it's a blob URL, use it as is
    if (recipientPhoto.startsWith("blob:")) {
      photoUrl = recipientPhoto;
    }
    // If it's already a full URL (http/https), use it as is
    else if (recipientPhoto.startsWith("http://") || recipientPhoto.startsWith("https://")) {
      photoUrl = recipientPhoto;
    } 
    // If it starts with /uploads/, construct full URL
    else if (recipientPhoto.startsWith("/uploads/")) {
      // In production, use www.odsglobal.net, otherwise use current host
      const isProduction = window.location.hostname === 'www.odsglobal.net' || window.location.hostname === 'odsglobal.net';
      const baseUrl = isProduction 
        ? 'https://www.odsglobal.net'
        : `${window.location.protocol}//${window.location.host}`;
      photoUrl = `${baseUrl}${recipientPhoto}`;
    }
    // Otherwise, assume it's a filename and prepend /uploads/
    else {
      const isProduction = window.location.hostname === 'www.odsglobal.net' || window.location.hostname === 'odsglobal.net';
      const baseUrl = isProduction 
        ? 'https://www.odsglobal.net'
        : `${window.location.protocol}//${window.location.host}`;
      photoUrl = `${baseUrl}/uploads/${recipientPhoto}`;
    }
  }

  // Use props first (they come from PaymentOptions with correct data), then fallback to fetched data
  const displayData = {
    recipientName: recipientName || giftData?.recipient?.name || "N/A",
    senderName: senderName || giftData?.senderName || "Anonymous",
    serviceTitle: serviceTitle || giftData?.service?.title || "N/A",
    serviceCategory: serviceCategory || giftData?.service?.category || "N/A",
    serviceProvider: serviceProvider || giftData?.provider?.fullName || "N/A",
    serviceLocation: serviceLocation || giftData?.serviceLocation || "N/A",
    message: message || giftData?.message || "",
    recipientEmail: recipientEmail || giftData?.recipient?.email || "",
    recipientPhone: recipientPhone || giftData?.recipient?.phone || "",
    providerName: providerName || serviceProvider || giftData?.provider?.fullName || "N/A",
    providerEmail: giftData?.provider?.email || "",
    occasion: occasion && occasion !== "Special Gift" && occasion !== "N/A" 
      ? occasion 
      : (giftData?.occasion && giftData.occasion !== "Special Gift" && giftData.occasion !== "N/A"
        ? giftData.occasion
        : "Special Gift"),
    code: code && code !== "Generating..." && code !== "N/A"
      ? code
      : (giftData?.giftCode && giftData.giftCode !== "Generating..." && giftData.giftCode !== "N/A"
        ? giftData.giftCode
        : "Generating..."),
    currency: currency || giftData?.currency || "ETB",
    deliveryStatus: giftData?.deliveryStatus || "pending",
  };
  
  if (loading) {
    return (
      <div style={{ padding: "1rem", textAlign: "center" }}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#be9b49] mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading VIP gift card...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: "1rem", color: "red", backgroundColor: "#fee" }}>
        <h3>Error Loading VIP Gift Card</h3>
          <p>{error}</p>
        <button onClick={() => setError(null)}>Try Again</button>
      </div>
    );
  }

  return (
    <div>
      <div
        ref={cardRef}
        style={{
          backgroundColor: "#fff",
          boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
          borderRadius: "0.5rem",
          border: "1px solid #d1d5db",
          padding: "1.5rem",
          marginBottom: "1.5rem",
          fontFamily: "'Segoe UI', sans-serif",
          color: "#0f285b",
          maxWidth: "42rem",
          margin: "0 auto",
          borderTop: "6px solid #be9b49",
        }}
      >
        {/* Header - Exact Invoice Style */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: "1rem",
          }}
        >
          <img
            src={getLogoUrl()}
            alt="ODS Global Network Logo"
            style={{
              height: "4rem",
              width: "4rem",
              borderRadius: "9999px",
              objectFit: "cover",
            }}
            onError={(e) => {
              if ((e.target as HTMLImageElement).src.includes("www.odsglobal.net")) {
                (e.target as HTMLImageElement).src = "/brand/ods-logo-mark-gold.png";
              } else {
                (e.target as HTMLImageElement).style.display = "none";
              }
            }}
          />
          <div style={{ textAlign: "right" }}>
            <p style={{ fontSize: "0.875rem", margin: 0 }}>Gift Card Date: {new Date().toLocaleDateString()}</p>
            <p style={{ fontSize: "0.875rem", margin: 0 }}>
              {displayData.code && displayData.code !== "N/A" ? `Code: ${displayData.code}` : "Premium Digital Gift"}
            </p>
          </div>
        </div>

        {/* Company Info - Exact Invoice Style */}
        <div style={{ marginBottom: "1rem", fontSize: "0.875rem" }}>
          <p>
            <strong>Company:</strong> ODS Global Network Gifting
          </p>
          <p>
            <strong>TIN:</strong> XXX
          </p>
          <p>
            <strong>Address:</strong> Addis Ababa, Ethiopia
          </p>
          <p>
            <strong>Phone:</strong> +251 989 177 777
          </p>
        </div>

        {/* Provider Info - Exact Invoice Style */}
        {(displayData.providerName || displayData.serviceProvider) && (
          <div
            style={{
              marginBottom: "1rem",
              fontSize: "0.875rem",
              borderTop: "1px dashed #d1d5db",
              paddingTop: "0.75rem",
            }}
          >
            <p>
              <strong>Service Provider:</strong> {displayData.providerName || displayData.serviceProvider}
            </p>
            {displayData.providerEmail && (
              <p>
                <strong>Email:</strong> {displayData.providerEmail}
              </p>
            )}
          </div>
        )}

        {/* Sender & Recipient Info - Exact Invoice Style */}
        <div style={{ marginBottom: "1rem", fontSize: "0.875rem" }}>
          <p>
            <strong>From:</strong> {displayData.senderName || "Anonymous"}
          </p>
          <p>
            <strong>To:</strong> {displayData.recipientName || "Recipient"}
          </p>
          {displayData.recipientEmail && (
            <p>
              <strong>Recipient Email:</strong> {displayData.recipientEmail}
            </p>
          )}
          {displayData.recipientPhone && (
            <p>
              <strong>Recipient Phone:</strong> {displayData.recipientPhone}
            </p>
          )}
        </div>

        {/* Recipient Photo - VIP Only */}
        {photoUrl && (
          <div style={{ textAlign: "center", marginBottom: "1rem" }}>
              <img
                src={photoUrl}
                alt={`${displayData.recipientName}'s photo`}
              style={{
                width: "200px",
                height: "150px",
                borderRadius: "0.5rem",
                objectFit: "cover",
                border: "3px solid #be9b49",
                boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
              }}
                onError={(e) => {
                  console.error("Image failed to load:", photoUrl);
                  (e.target as HTMLImageElement).src = "/default-avatar.png";
                }}
              />
          </div>
        )}

        {/* Gift Details - Exact Invoice Style */}
        <div
          style={{
            marginBottom: "1rem",
            border: "1px solid #e5e7eb",
            padding: "0.75rem",
            borderRadius: "0.5rem",
            backgroundColor: "#fef3c7",
            borderLeft: "4px solid #be9b49",
          }}
        >
          {displayData.serviceTitle && (
            <p>
              <strong>Service:</strong> {displayData.serviceTitle}
            </p>
          )}
          {displayData.serviceCategory && (
            <p>
              <strong>Category:</strong> {displayData.serviceCategory}
            </p>
          )}
          {displayData.serviceLocation && displayData.serviceLocation !== "N/A" && (
            <p>
              <strong>Location:</strong> {displayData.serviceLocation}
            </p>
          )}
          {displayData.occasion && displayData.occasion !== "N/A" && displayData.occasion !== "Not specified" && (
            <p>
              <strong>Occasion:</strong> {displayData.occasion}
                  </p>
                )}
          <p>
            <strong>Gift Card Type:</strong>{" "}
            <span style={{ color: "#be9b49", fontWeight: "bold" }}>
              👑 VIP (+15% Premium)
              </span>
          </p>
          {displayData.code && displayData.code !== "Generating..." && displayData.code !== "N/A" && (
            <p style={{ fontWeight: "bold", color: "#be9b49", fontSize: "1rem", marginTop: "0.5rem" }}>
              🎁 Gift Code: {displayData.code}
            </p>
          )}
          <p>
            <strong>Status:</strong>{" "}
            {displayData.deliveryStatus === "delivered" ? "Delivered ✅" : "Pending ⏳"}
          </p>
          {displayData.message && (
            <p>
              <strong>Message:</strong> {displayData.message}
            </p>
          )}
        </div>

        {/* QR Code - Exact Invoice Style */}
        {displayData.code && displayData.code !== "Generating..." && displayData.code !== "N/A" && (
          <div style={{ marginTop: "1.5rem", textAlign: "center" }}>
            <p style={{ fontSize: "0.75rem", color: "#6b7280", marginBottom: "0.5rem" }}>
              Scan to redeem this VIP gift card
            </p>
            <QRCode value={`https://www.odsglobal.net/redeem?code=${displayData.code}`} size={80} />
          </div>
        )}

        {/* Gradient Footer - Exact Invoice Style */}
        <div
          style={{
            height: "30px",
            background: "linear-gradient(to right, #be9b49, #f5deb3)",
            marginTop: "1.5rem",
            borderBottomLeftRadius: "0.5rem",
            borderBottomRightRadius: "0.5rem",
          }}
        />
      </div>

      {/* Download Buttons - Exact Invoice Style */}
      <div style={{ textAlign: "center" }}>
        <button
          onClick={downloadAsPDF}
          style={{
            backgroundColor: "#0f285b",
            color: "#be9b49",
            padding: "0.5rem 1.5rem",
            borderRadius: "0.375rem",
            cursor: "pointer",
            transition: "border-radius 0.3s ease",
            border: "none",
            marginRight: "0.5rem",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.borderRadius = "9999px")}
          onMouseLeave={(e) => (e.currentTarget.style.borderRadius = "0.375rem")}
        >
          Download VIP PDF
        </button>
        <button
          onClick={downloadAsPNG}
          style={{
            backgroundColor: "#0f285b",
            color: "#be9b49",
            padding: "0.5rem 1.5rem",
            borderRadius: "0.375rem",
            cursor: "pointer",
            transition: "border-radius 0.3s ease",
            border: "none",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.borderRadius = "9999px")}
          onMouseLeave={(e) => (e.currentTarget.style.borderRadius = "0.375rem")}
        >
          Download VIP PNG
        </button>
      </div>
    </div>
  );
};

export default VipGiftCard;
