import jsPDF from "jspdf";
import QRCode from "qrcode";

// Optional: default logo as Base64 (in case public path fails)
import defaultLogo from "/brand/ods-logo-mark-gold.png"; // or convert to Base64 if needed

export async function generateCertificate({
  name,
  role,
  level, // optional
  qrData, // optional
  logoUrl, // optional
}: {
  name: string;
  role: string;
  level?: string;
  qrData?: string;
  logoUrl?: string;
}) {
  const doc = new jsPDF("landscape");

  // Brand Colors
  const brandDark: [number, number, number] = [28, 43, 33]; // #0f285b
  const brandGold: [number, number, number] = [212, 175, 55]; // #be9b49

  // Border
  doc.setDrawColor(...brandDark);
  doc.setLineWidth(4);
  doc.rect(10, 10, 277, 190);

  // Logo
  try {
    let imgSrc = logoUrl || `${process.env.PUBLIC_URL}/wanaw gifting logo.jpeg` || defaultLogo;

    // If importing logo as Base64, you can directly pass it
    doc.addImage(imgSrc, "JPEG", 125, 20, 40, 40);
  } catch (err) {
    console.warn("Logo not loaded:", err);
  }

  // Header
  doc.setFont("helvetica", "bold");
  doc.setFontSize(30);
  doc.setTextColor(...brandDark);
  doc.text("Certificate of Recognition", 148.5, 75, { align: "center" });

  // Presented to
  doc.setFontSize(16);
  doc.setTextColor(...brandDark);
  doc.text("This is proudly presented to", 148.5, 95, { align: "center" });

  // Name
  doc.setFontSize(26);
  doc.setFont("times", "bold");
  doc.setTextColor(...brandGold);
  doc.text(name, 148.5, 120, { align: "center" });

  // Role & Level
  doc.setFontSize(16);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...brandDark);
  const levelText = level ? ` (${level})` : "";
  doc.text(`as ${role}${levelText}`, 148.5, 135, { align: "center" });

  // Tagline
  const roleTaglines: Record<string, string> = {
    "Healthcare Professionals": "for outstanding dedication in the healthcare sector.",
    Gifters: "for generous contributions to Hemodialysis patients.",
    Influencers: "for amplifying awareness and inspiring change.",
    "Digital Creator": "for creating impactful content to support Hemodialysis patients.",
    "Brand Ambassadors": "for representing the ODS Global Network Support Community.",
    "Service Providers": "for delivering essential healthcare services.",
    Volunteers: "for dedicated volunteer service.",
    "Internship Program": "for successfully completing the Internship Program.",
  };
  doc.setFontSize(14);
  doc.text(
    roleTaglines[role] || "for valuable contributions to our community.",
    148.5,
    150,
    { align: "center", maxWidth: 240 }
  );

  // Footer date
  const date = new Date().toLocaleDateString();
  doc.setFontSize(12);
  doc.text(`Date: ${date}`, 148.5, 175, { align: "center" });

  // Official Seal
  doc.setDrawColor(...brandGold);
  doc.setFillColor(...brandGold);
  doc.circle(240, 165, 15, "FD");
  doc.setFontSize(10);
  doc.setTextColor(...brandDark);
  doc.text("Wanaw", 240, 165, { align: "center", baseline: "middle" });

  // QR Code
  if (qrData) {
    try {
      const qrUrl = await QRCode.toDataURL(qrData);
      doc.addImage(qrUrl, "PNG", 20, 155, 35, 35); // bottom-left
    } catch (err) {
      console.error("QR code generation failed:", err);
    }
  }

  // Download
  doc.save(`${name}-certificate.pdf`);
}


