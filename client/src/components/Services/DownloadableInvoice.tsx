import { useRef, useMemo, useEffect, useState } from "react";
import html2pdf from "html2pdf.js";
import QRCode from "react-qr-code";
import BASE_URL from "../../api/api";

interface Recipient {
  name?: string;
  email?: string;
  phone?: string;
  whatsapp?: string;
  telegram?: string;
}

interface Provider {
  fullName?: string;
  email?: string;
}

type GiftTier = "standard" | "vip" | "corporate";

interface Gift {
  message: any;
  _id: string;
  recipient?: Recipient;
  service?: { title?: string; category?: string; location?: string };
  occasion?: string;
  giftCode?: string;
  deliveryStatus?: "pending" | "delivered";
  senderName?: string;
  provider?: Provider;
  type?: GiftTier;
}

interface DownloadableInvoiceProps {
  fullName: string;
  total: number;
  gifts?: Gift[];
  provider?: Provider;
  purchaseId?: string;
  serviceId?: string;
  currency?: "ETB" | "USD";
  cart?: any[];
}

const VIP_MARKUP = 0.15;
const CORPORATE_DISCOUNT = 0.15;

const getTierMultiplier = (tier?: GiftTier) => {
  if (tier === "vip") return 1 + VIP_MARKUP;
  if (tier === "corporate") return 1 - CORPORATE_DISCOUNT;
  return 1;
};

const getTierConfig = (tier: GiftTier = "standard") => {
  switch (tier) {
    case "vip":
      return {
        label: "👑 VIP (+15%)",
        note: " (includes 15% VIP markup)",
        accent: "#be9b49",
        background: "#fef3c7",
      };
    case "corporate":
      return {
        label: "🏢 Corporate (-15%)",
        note: " (includes 15% corporate discount)",
        accent: "#2563eb",
        background: "#eff6ff",
      };
    default:
      return {
        label: "📄 Basic",
        note: "",
        accent: "#6b7280",
        background: "#f9fafb",
      };
  }
};

const DownloadableInvoice = ({
  fullName,
  total,
  gifts = [],
  provider,
  purchaseId,
  serviceId,
  currency = "ETB",
  cart = [],
}: DownloadableInvoiceProps) => {
  const invoiceRef = useRef<HTMLDivElement>(null);
  const [giftCodes, setGiftCodes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [actualTotal, setActualTotal] = useState(total);
  const [serviceData, setServiceData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Determine if this is a gift purchase (check both props and fetched gift codes)
  const isGiftPurchase = gifts.length > 0;

  // Debug logging
  console.log("DownloadableInvoice Props:", {
    fullName,
    total,
    gifts,
    purchaseId,
    serviceId,
    currency,
    cart
  });
  console.log("Gift Codes State:", giftCodes);
  console.log("Actual Total:", actualTotal);

  const baseServicePrice = useMemo(() => {
    const parsePrice = (value: any) => {
      if (typeof value === "number") return value;
      if (typeof value === "string") {
        const parsed = parseFloat(value);
        return isNaN(parsed) ? 0 : parsed;
      }
      return 0;
    };

    // Priority 1: Check cart item for discounted price first (most accurate)
    if (cart && cart.length > 0) {
      const firstItem = cart[0];
      if (firstItem) {
        // First check for explicitly set discountedPrice
        if (firstItem.discountedPrice !== undefined && firstItem.discountedPrice !== null) {
          const parsed = parsePrice(firstItem.discountedPrice);
          if (parsed > 0) {
            console.log(`💰 Using discountedPrice from cart: ${parsed}`);
            return parsed;
          }
        }
        // Then check if discount percentage needs to be applied
        if (firstItem.discount && firstItem.discount > 0 && firstItem.price) {
          const base = parsePrice(firstItem.price);
          if (base > 0) {
            const discounted = base * (1 - firstItem.discount / 100);
            console.log(`💰 Applying discount ${firstItem.discount}%: ${base} -> ${discounted}`);
            return discounted;
          }
        }
        // Fallback to regular price if no discount
        if (firstItem.price !== undefined && firstItem.price !== null) {
          const parsed = parsePrice(firstItem.price);
          if (parsed > 0) {
            console.log(`💰 Using regular price from cart: ${parsed}`);
            return parsed;
          }
        }
      }
    }

    // Priority 2: Check serviceData (might already have discount applied)
    if (serviceData?.price !== undefined && serviceData?.price !== null) {
      const parsed = parsePrice(serviceData.price);
      if (parsed > 0) {
        console.log(`💰 Using price from serviceData: ${parsed}`);
        return parsed;
      }
    }

    console.log(`⚠️ No valid price found, returning 0`);
    return 0;
  }, [serviceData, cart]);

  // Fetch gift codes from gift_notifications endpoint (only for gift purchases)
  useEffect(() => {
    const fetchGiftCodes = async () => {
      if (!purchaseId || gifts.length === 0) return; // Only fetch if it's a gift purchase
      setLoading(true);
      try {
        // First try to fetch from services/purchase endpoint
        const response = await fetch(`/api/services/purchase`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          signal: AbortSignal.timeout(10000) // 10 second timeout
        });
        
        if (response.ok) {
          const purchases = await response.json();
          const targetPurchase = purchases.find(
            (p: any) => p.id === parseInt(purchaseId)
          );
          
          if (targetPurchase && targetPurchase.gifts) {
            console.log("🎁 Target Purchase:", targetPurchase);
            
            // Map gifts from purchase data
            const mappedGifts = (targetPurchase.gifts || []).map((gift: any) => ({
              gift_code: gift.giftCode || "N/A",
              recipient_name: gift.recipient?.name || "N/A",
              service_title: gift.service?.title || targetPurchase.item?.title || "N/A",
              service_category: gift.service?.category || targetPurchase.item?.category || "N/A",
              service_location: gift.service?.location || targetPurchase.item?.location || "N/A",
              provider_name: gift.provider?.fullName || targetPurchase.provider?.fullName || "N/A",
              delivery_status: gift.deliveryStatus || "pending",
              occasion: gift.occasion || "Not specified",
            }));
            
            setGiftCodes(mappedGifts);
          } else {
            // Fallback: Try to fetch from gift_notifications endpoint
            try {
              const giftResponse = await fetch(`${BASE_URL}/gifts/with-codes`, {
                method: 'GET',
                headers: {
                  'Content-Type': 'application/json',
                },
                signal: AbortSignal.timeout(10000) // 10 second timeout
              });
              
              if (giftResponse.ok) {
                const allGifts = await giftResponse.json();
                // Filter gifts for this purchase
                const purchaseGifts = allGifts.filter((gift: any) => 
                  gift.purchaseId === parseInt(purchaseId) || 
                  gift.purchase_id === parseInt(purchaseId)
                );
                
                if (purchaseGifts.length > 0) {
                  console.log("🎁 Purchase Gifts from gift_notifications:", purchaseGifts);
                  
                  // Map gifts from gift_notifications data
                  const mappedGifts = purchaseGifts.map((gift: any) => ({
                    gift_code: gift.giftCode || "N/A",
                    recipient_name: gift.recipient?.name || "N/A",
                    service_title: gift.service?.title || "N/A",
                    service_category: gift.service?.category || "N/A",
                    service_location: gift.service?.location || "N/A",
                    provider_name: gift.provider?.fullName || "N/A",
                    delivery_status: gift.deliveryStatus || "pending",
                    occasion: gift.occasion || "Not specified",
                  }));
                  
                  setGiftCodes(mappedGifts);
                } else {
                  setGiftCodes([]);
                }
              } else {
                setGiftCodes([]);
              }
            } catch (giftErr) {
              console.error("Error fetching from gift_notifications endpoint:", giftErr);
              setGiftCodes([]);
            }
          }
        } else {
          setGiftCodes([]);
        }
      } catch (error) {
        console.error("Error fetching gift codes:", error);
        if (error instanceof Error) {
          if (error.name === 'TimeoutError') {
            setError("Request timed out. Please try again.");
          } else {
            setError(`Failed to fetch gift codes: ${error.message}`);
          }
        } else {
          setError("An unknown error occurred while fetching gift codes.");
        }
        setGiftCodes([]);
      } finally {
        setLoading(false);
      }
    };
    fetchGiftCodes();
  }, [purchaseId]);

  // Calculate total with tiered pricing in background
  useEffect(() => {
    if (cart && cart.length > 0 && gifts && gifts.length > 0) {
      const service = cart[0];
      if (!serviceData) {
          setServiceData(service);
      }

      const totalPrice = gifts.reduce((sum, gift) => {
        const tier = (gift.type as GiftTier) || "standard";
        const multiplier = getTierMultiplier(tier);
        const lineTotal = baseServicePrice * multiplier;
        console.log(
          `💰 Gift tier calculation: tier=${tier}, multiplier=${multiplier}, base=${baseServicePrice}, lineTotal=${lineTotal}`
        );
        return sum + lineTotal;
      }, 0);
      
      console.log(`💰 Final Total Amount Due: ${totalPrice.toFixed(2)} ${currency}`);
      setActualTotal(totalPrice);
    } else if (cart && cart.length > 0) {
      const service = cart[0];
      setServiceData(service);
      console.log(`💰 Fallback calculation: ${baseServicePrice}`);
      setActualTotal(baseServicePrice);
    }
  }, [cart, gifts, currency, baseServicePrice, serviceData]);

  // Update actual total when total prop changes (only if no gifts to calculate from)
  useEffect(() => {
    if (total > 0 && (!gifts || gifts.length === 0)) {
      console.log(`Updating actual total from prop: ${total}`);
      setActualTotal(total);
    }
  }, [total, gifts]);

  const invoiceNumber = useMemo(() => {
    // Generate a 5-digit numeric invoice number
    return Math.floor(Math.random() * 100000)
      .toString()
      .padStart(5, '0');
  }, [fullName]);

  const handleDownload = async () => {
    if (!invoiceRef.current) {
      setError("Invoice content not available for download.");
      return;
    }
    try {
      await html2pdf()
        .set({
          margin: 10,
          filename: `${invoiceNumber}.pdf`,
          image: { type: "jpeg", quality: 0.98 },
          html2canvas: { scale: 2 },
          jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
        })
        .from(invoiceRef.current)
        .save();
    } catch (error) {
      console.error("PDF generation failed:", error);
      setError(`PDF generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };



  // Add error boundary for rendering
  if (!fullName) {
    console.error("DownloadableInvoice: fullName is required");
    return <div>Error: Missing required data</div>;
  }

  // Show error state if there's an error
  if (error) {
    return (
      <div style={{ padding: "1rem", color: "red", backgroundColor: "#fee" }}>
        <h3>Error Loading Invoice</h3>
        <p>{error}</p>
        <button onClick={() => setError(null)}>Try Again</button>
      </div>
    );
  }

  return (
    <div>
      <div
        ref={invoiceRef}
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
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: "1rem",
          }}
        >
          <img
            src="/brand/ods-logo-mark-gold.png"
            alt="ODS Global Network Logo"
            style={{
              height: "4rem",
              width: "4rem",
              borderRadius: "9999px",
              objectFit: "cover",
            }}
          />
          <div style={{ textAlign: "right" }}>
            <p>Invoice Date: {new Date().toLocaleDateString()}</p>
            <p>Invoice #: {invoiceNumber}</p>
          </div>
        </div>

        {/* Company Info */}
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

        {/* Provider Info */}
        {provider && (
          <div
            style={{
              marginBottom: "1rem",
              fontSize: "0.875rem",
              borderTop: "1px dashed #d1d5db",
              paddingTop: "0.75rem",
            }}
          >
            <p>
              <strong>Service Provider:</strong> {provider.fullName || "N/A"}
            </p>
            <p>
              <strong>Email:</strong> {provider.email || "N/A"}
            </p>
          </div>
        )}

        {/* Customer Info */}
        <div style={{ marginBottom: "1rem", fontSize: "0.875rem" }}>
          <p>
            <strong>Customer Name:</strong> {fullName || "Anonymous"}
          </p>
          <p style={{ color: "orange", fontWeight: "bold" }}>
            ⏳ Status: Pending Payment
          </p>
        </div>

        {/* Gifts - Only show if this is a gift purchase */}
        {isGiftPurchase && (
          loading ? (
            <p style={{ marginBottom: "1rem", fontSize: "0.875rem" }}>
              Loading gift codes...
            </p>
          ) : giftCodes.length > 0 ? (
          <div style={{ marginBottom: "1rem", fontSize: "0.875rem" }}>
            {giftCodes && giftCodes.length > 0 && giftCodes.map((gift, idx) => (
              <div
                key={idx}
                style={{
                  marginBottom: "1rem",
                  border: "1px solid #e5e7eb",
                  padding: "0.75rem",
                  borderRadius: "0.5rem",
                  backgroundColor: "#f9fafb",
                }}
              >
                <p>
                  <strong>Gift Recipient:</strong> {gift.recipient_name}
                </p>
                <p>
                  <strong>Gift Title:</strong> {gift.service_title}
                </p>
                <p>
                  <strong>Service Category:</strong> {gift.service_category}
                </p>
                <p>
                  <strong>Service Location:</strong> {gift.service_location}
                </p>
                <p>
                  <strong>Provider:</strong> {gift.provider_name}
                </p>
                <p>
                  <strong>Occasion:</strong> {gift.occasion}
                </p>
                <p style={{ fontWeight: "bold", color: "#be9b49", fontSize: "1rem" }}>
                  🎁 Gift Code: {gift.gift_code}
                </p>
                <p>
                  <strong>Status:</strong>{" "}
                  {gift.delivery_status === "delivered" ? "Delivered ✅" : "Pending ⏳"}
                </p>
              </div>
            ))}
          </div>
        ) : gifts.length > 0 ? (
          <div style={{ marginBottom: "1rem", fontSize: "0.875rem" }}>
            {gifts && gifts.length > 0 && gifts.map((gift, idx) => {
              const giftTier = (gift.type as GiftTier) || "standard";
              const tierConfig = getTierConfig(giftTier);
              const servicePrice = baseServicePrice;
              const multiplier = getTierMultiplier(giftTier);
              const giftPrice = servicePrice * multiplier;
              
              console.log(`💰 Gift ${idx} Price Calculation:`);
              console.log(`💰 Service Price: ${servicePrice}`);
              console.log(`💰 Tier: ${giftTier}`);
              console.log(`💰 Multiplier: ${multiplier}`);
              console.log(`💰 Gift Price: ${giftPrice}`);
              
              return (
              <div
                key={idx}
                style={{
                  marginBottom: "1rem",
                  border: "1px solid #e5e7eb",
                  padding: "0.75rem",
                  borderRadius: "0.5rem",
                    backgroundColor: tierConfig.background,
                    borderLeft: `4px solid ${tierConfig.accent}`,
                }}
              >
                <p>
                  <strong>Gift Recipient:</strong> {gift.recipient?.name || "N/A"}
                </p>
                <p>
                  <strong>Service:</strong> {gift.service?.title || "N/A"}
                </p>
                <p>
                  <strong>Category:</strong> {gift.service?.category || "N/A"}
                </p>
                <p>
                  <strong>Location:</strong> {gift.service?.location || "N/A"}
                </p>
                {gift.occasion && gift.occasion !== "N/A" && gift.occasion !== "Not specified" && (
                  <p>
                    <strong>Occasion:</strong> {gift.occasion}
                  </p>
                )}
                {console.log(`🎁 Gift ${idx} occasion:`, gift.occasion, 'from gift:', gift)}
                  <p>
                    <strong>Gift Card Type:</strong> 
                    <span style={{ 
                      color: tierConfig.accent, 
                      fontWeight: "bold",
                      marginLeft: "0.5rem"
                    }}>
                      {tierConfig.label}
                    </span>
                  </p>
                  <p>
                    <strong>Price:</strong> {giftPrice.toFixed(2)} {currency}
                    {tierConfig.note && (
                      <span style={{ color: tierConfig.accent, fontSize: "0.8rem" }}>
                        {tierConfig.note}
                      </span>
                    )}
                </p>
                {gift.giftCode && gift.giftCode !== "N/A" && gift.giftCode !== "Generating..." && (
                  <p style={{ fontWeight: "bold", color: "#be9b49", fontSize: "1rem" }}>
                    🎁 Gift Code: {gift.giftCode}
                  </p>
                )}
                <p>
                  <strong>Status:</strong>{" "}
                  {gift.deliveryStatus === "delivered" ? "Delivered ✅" : "Pending ⏳"}
                </p>
                {gift.message && (
                  <p>
                    <strong>Message:</strong> {gift.message}
                  </p>
                )}
              </div>
              );
            })}
          </div>
        ) : (
          <p style={{ marginBottom: "1rem", fontSize: "0.875rem" }}>
            No gifts available.
          </p>
        )
        )}


        {/* Total */}
        <div
          style={{
            textAlign: "right",
            fontWeight: "600",
            fontSize: "1rem",
            marginTop: "1rem",
            padding: "1rem",
            backgroundColor: "#f8f9fa",
            borderRadius: "0.5rem",
            border: "2px solid #be9b49",
          }}
        >
          <p style={{ margin: "0", fontSize: "1.2rem", color: "#0f285b" }}>
            <strong>Total Amount Due: {actualTotal.toFixed(2)} {currency}</strong>
          </p>
        </div>

        {/* QR Code */}
        <div style={{ marginTop: "1.5rem", textAlign: "center" }}>
          <p style={{ fontSize: "0.75rem", color: "#6b7280", marginBottom: "0.5rem" }}>
            Scan to verify this invoice
          </p>
          <QRCode value={`https://www.odsglobal.net/invoice?code=${invoiceNumber}`} size={80} />
        </div>

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

      <div style={{ textAlign: "center" }}>
        <button
          onClick={handleDownload}
          style={{
            backgroundColor: "#0f285b",
            color: "#be9b49",
            padding: "0.5rem 1.5rem",
            borderRadius: "0.375rem",
            cursor: "pointer",
            transition: "border-radius 0.3s ease",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.borderRadius = "9999px")}
          onMouseLeave={(e) => (e.currentTarget.style.borderRadius = "0.375rem")}
        >
          Download Invoice
        </button>
      </div>
    </div>
  );
};

export default DownloadableInvoice;
