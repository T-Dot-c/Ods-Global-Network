import { useRef } from "react";
import html2pdf from "html2pdf.js";
import QRCode from "react-qr-code";

interface PremiumGiftCardProps {
  fullName: string;
  senderName: string;
  recipientName: string;
  giftItem: string;
  message?: string;
  giftCode: string | null;
}

const PremiumGiftCard = ({
  senderName,
  recipientName,
  giftItem,
  message,
  giftCode,
}: PremiumGiftCardProps) => {
  const cardRef = useRef<HTMLDivElement>(null);

  const handleDownload = () => {
    if (!cardRef.current) return;
    html2pdf()
      .set({
        margin: 10,
        filename: `GiftCard-${giftCode || "temp"}.pdf`,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: "mm", format: "a4", orientation: "landscape" },
      })
      .from(cardRef.current)
      .save();
  };

  return (
    <div>
      <div
        ref={cardRef}
        style={{
          width: "650px",
          margin: "auto",
          padding: "3rem",
          borderRadius: "1rem",
          background: "linear-gradient(145deg, #D4AF37, #FFD700)",
          color: "#1c2b21",
          fontFamily: "'Segoe UI', sans-serif",
          boxShadow: "0 10px 30px rgba(0,0,0,0.3)",
          position: "relative",
          overflow: "hidden",
          border: "2px solid #8B4513",
        }}
      >
        <h2
          style={{
            fontSize: "2rem",
            fontWeight: "bold",
            textAlign: "center",
            marginBottom: "1rem",
            textShadow: "1px 1px 3px rgba(0,0,0,0.2)",
          }}
        >
          🎁 Premium e-Gift Card
        </h2>

        <p
          style={{
            fontSize: "1.1rem",
            textAlign: "center",
            margin: "0.5rem 0",
            fontWeight: "600",
          }}
        >
          From: <strong>{senderName}</strong>
        </p>

        <p
          style={{
            fontSize: "1.1rem",
            textAlign: "center",
            margin: "0.5rem 0",
            fontWeight: "600",
          }}
        >
          To: <strong>{recipientName}</strong>
        </p>

        <p
          style={{
            fontSize: "1rem",
            textAlign: "center",
            margin: "1rem 0",
            padding: "0.5rem 1rem",
            backgroundColor: "rgba(255, 255, 255, 0.3)",
            borderRadius: "0.5rem",
            fontWeight: "bold",
            color: "#4B2E2E",
            textShadow: "0 1px 2px rgba(0,0,0,0.2)",
          }}
        >
          Gift Item: {giftItem}
        </p>

        {message && (
          <p
            style={{
              fontSize: "0.95rem",
              textAlign: "center",
              margin: "1rem 0",
              fontStyle: "italic",
              color: "#1c2b21",
              backgroundColor: "rgba(255, 255, 255, 0.25)",
              padding: "0.5rem 1rem",
              borderRadius: "0.5rem",
            }}
          >
            "{message}"
          </p>
        )}

        <p
          style={{
            fontSize: "1.2rem",
            textAlign: "center",
            fontWeight: "bold",
            marginTop: "1.5rem",
            letterSpacing: "2px",
            color: "#8B4513",
            textShadow: "1px 1px 2px rgba(0,0,0,0.2)",
          }}
        >
          Gift Code: {giftCode || "Generating..."}
        </p>

        <div
          style={{
            display: "flex",
            justifyContent: "center",
            marginTop: "1.5rem",
            padding: "1rem",
            backgroundColor: "rgba(255, 255, 255, 0.2)",
            borderRadius: "1rem",
            boxShadow: "inset 0 0 10px rgba(0,0,0,0.1)",
          }}
        >
          <QRCode value={`https://wanaw.com/redeem?code=${giftCode || ""}`} size={120} />
        </div>

        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            width: "100%",
            height: "10px",
            background: "linear-gradient(to right, #FFD700, #DAA520)",
            borderBottomLeftRadius: "1rem",
            borderBottomRightRadius: "1rem",
          }}
        />
      </div>

      <div style={{ textAlign: "center", marginTop: "1.5rem" }}>
        <button
          onClick={handleDownload}
          style={{
            backgroundColor: "#1c2b21",
            color: "#FFD700",
            padding: "0.75rem 2rem",
            borderRadius: "0.5rem",
            cursor: "pointer",
            fontWeight: "bold",
            fontSize: "1rem",
            boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
            transition: "all 0.2s ease",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#3a3a3a")}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#1c2b21")}
        >
          Download Gift Card
        </button>
      </div>
    </div>
  );
};

export default PremiumGiftCard;



