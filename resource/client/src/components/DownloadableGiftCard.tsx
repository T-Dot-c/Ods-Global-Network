import { useRef, useState, useEffect } from "react";
import html2pdf from "html2pdf.js";
import QRCode from "react-qr-code";
import axios from "axios";
import BASE_URL from "../api/api";

// Helper to get logo URL that works in both local and production
const getLogoUrl = () => {
  if (typeof window !== 'undefined') {
    const isProduction = window.location.hostname === 'www.wanaw.et' || window.location.hostname === 'wanaw.et';
    if (isProduction) {
      return `${window.location.protocol}//${window.location.host}/wanaw%20gifting%20logo.jpeg`;
    }
  }
  return "/wanaw gifting logo.jpeg";
};

interface GiftCardProps {
  senderName?: string;
  recipientName?: string;
  giftItem?: string;
  message?: string;
  giftCode?: string;
  amount?: number;
  totalAmount?: number;
  currency?: "ETB" | "USD";
  serviceTitle?: string;
  serviceCategory?: string;
  serviceLocation?: string;
  occasion?: string;
  recipientEmail?: string;
  recipientPhone?: string;
  providerName?: string;
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

const DownloadableGiftCard = ({
  senderName,
  recipientName,
  message,
  giftCode,
  totalAmount,
  currency = "ETB",
  serviceTitle,
  serviceCategory,
  serviceLocation,
  occasion,
  recipientEmail,
  recipientPhone,
  providerName,
  giftId,
}: GiftCardProps) => {
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
        console.log("🎁 Fetching gift data from /gifts/with-codes endpoint...");
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
          console.log("✅ Gift data fetched:", mappedGift);
        } else {
          setError("Gift not found");
        }
      } catch (err) {
        console.error("❌ Failed to fetch gift data:", err);
        setError("Failed to load gift data");
      } finally {
        setLoading(false);
      }
    };

    fetchGiftData();
  }, [giftId]);

  const handleDownload = async () => {
    if (!cardRef.current) return;

    try {
      await html2pdf()
        .set({
          margin: [10, 10, 10, 10],
          filename: `GiftCard-${displayData.giftCode || Date.now()}.pdf`,
          image: { type: "jpeg", quality: 0.98 },
          html2canvas: { 
            scale: 2,
            useCORS: true,
            allowTaint: true,
            backgroundColor: "#ffffff"
          },
          jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
        })
        .from(cardRef.current)
        .save();
    } catch (error) {
      console.error("Gift card download failed:", error);
      alert("Failed to generate the gift card. Please try again.");
    }
  };

  // Use fetched data or props
  const displayData = giftData ? {
    senderName: giftData.senderName || senderName,
    recipientName: giftData.recipient?.name || recipientName,
    serviceTitle: giftData.service?.title || serviceTitle,
    serviceCategory: giftData.service?.category || serviceCategory,
    serviceLocation: giftData.serviceLocation || serviceLocation,
    message: giftData.message || message,
    recipientEmail: giftData.recipient?.email || recipientEmail,
    recipientPhone: giftData.recipient?.phone || recipientPhone,
    providerName: giftData.provider?.fullName || providerName,
    providerEmail: giftData.provider?.email || "",
    occasion: giftData.occasion && giftData.occasion !== "N/A" && giftData.occasion !== "Not specified" ? giftData.occasion : (occasion && occasion !== "N/A" ? occasion : "Special Gift"),
    giftCode: giftData.giftCode && giftData.giftCode !== "Generating..." && giftData.giftCode !== "N/A" ? giftData.giftCode : (giftCode && giftCode !== "Generating..." && giftCode !== "N/A" ? giftCode : null),
    totalAmount: giftData.amount || totalAmount,
    currency: giftData.currency || currency,
    deliveryStatus: giftData.deliveryStatus || "pending",
  } : {
    senderName,
    recipientName,
    serviceTitle,
    serviceCategory,
    serviceLocation,
    message,
    recipientEmail,
    recipientPhone,
    providerName,
    providerEmail: "",
    occasion: occasion && occasion !== "N/A" ? occasion : "Special Gift",
    giftCode: giftCode && giftCode !== "Generating..." && giftCode !== "N/A" ? giftCode : null,
    totalAmount,
    currency,
    deliveryStatus: "pending",
  };

  if (loading) {
    return (
      <div style={{ padding: "1rem", textAlign: "center" }}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#D4AF37] mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading gift card...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: "1rem", color: "red", backgroundColor: "#fee" }}>
        <h3>Error Loading Gift Card</h3>
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
          color: "#1c2b21",
          maxWidth: "42rem",
          margin: "0 auto",
          borderTop: "6px solid #D4AF37",
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
              if ((e.target as HTMLImageElement).src.includes("www.wanaw.et")) {
                (e.target as HTMLImageElement).src = "/wanaw gifting logo.jpeg";
              } else {
                (e.target as HTMLImageElement).style.display = "none";
              }
            }}
          />
          <div style={{ textAlign: "right" }}>
            <p style={{ fontSize: "0.875rem", margin: 0 }}>Gift Card Date: {new Date().toLocaleDateString()}</p>
            <p style={{ fontSize: "0.875rem", margin: 0 }}>
              {displayData.giftCode ? `Code: ${displayData.giftCode}` : "Digital Gift"}
            </p>
          </div>
        </div>

        {/* Company Info - Exact Invoice Style */}
        <div style={{ marginBottom: "1rem", fontSize: "0.875rem" }}>
          <p>
            <strong>Company:</strong> ODS Global Network Health and Wellness Digital Solutions
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
        {displayData.providerName && (
          <div
            style={{
              marginBottom: "1rem",
              fontSize: "0.875rem",
              borderTop: "1px dashed #d1d5db",
              paddingTop: "0.75rem",
            }}
          >
            <p>
              <strong>Service Provider:</strong> {displayData.providerName}
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

        {/* Gift Details - Exact Invoice Style */}
        <div
          style={{
            marginBottom: "1rem",
            border: "1px solid #e5e7eb",
            padding: "0.75rem",
            borderRadius: "0.5rem",
            backgroundColor: "#f9fafb",
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
          {displayData.giftCode && displayData.giftCode !== "Generating..." && displayData.giftCode !== "N/A" && (
            <p style={{ fontWeight: "bold", color: "#D4AF37", fontSize: "1rem", marginTop: "0.5rem" }}>
              🎁 Gift Code: {displayData.giftCode}
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
          {displayData.totalAmount && (
            <p>
              <strong>Amount:</strong> {displayData.totalAmount.toFixed(2)} {displayData.currency}
            </p>
          )}
        </div>

        {/* QR Code - Exact Invoice Style */}
        {displayData.giftCode && displayData.giftCode !== "Generating..." && displayData.giftCode !== "N/A" && (
          <div style={{ marginTop: "1.5rem", textAlign: "center" }}>
            <p style={{ fontSize: "0.75rem", color: "#6b7280", marginBottom: "0.5rem" }}>
              Scan to redeem this gift card
            </p>
            <QRCode value={`https://www.wanaw.et/redeem?code=${displayData.giftCode}`} size={80} />
          </div>
        )}

        {/* Gradient Footer - Exact Invoice Style */}
        <div
          style={{
            height: "30px",
            background: "linear-gradient(to right, #D4AF37, #f5deb3)",
            marginTop: "1.5rem",
            borderBottomLeftRadius: "0.5rem",
            borderBottomRightRadius: "0.5rem",
          }}
        />
      </div>

      {/* Download Button - Exact Invoice Style */}
      <div style={{ textAlign: "center" }}>
        <button
          onClick={handleDownload}
          style={{
            backgroundColor: "#1c2b21",
            color: "#D4AF37",
            padding: "0.5rem 1.5rem",
            borderRadius: "0.375rem",
            cursor: "pointer",
            transition: "border-radius 0.3s ease",
            border: "none",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.borderRadius = "9999px")}
          onMouseLeave={(e) => (e.currentTarget.style.borderRadius = "0.375rem")}
        >
          Download Gift Card
        </button>
      </div>
    </div>
  );
};

export default DownloadableGiftCard;
