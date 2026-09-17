import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Gift as GiftIcon, ChevronDown, ChevronUp } from "lucide-react";

import BASE_URL from "../../api/api";

/* ----------------------------- Types ----------------------------- */
type Recipient = {
  name: string;
  email: string;
   phone?: string;
  profileImage?: File | string; // ✅ union, not string & File
  whatsapp?: string;
  telegram?: string;
   type: "standard" | "vip" | "corporate"; // available gift tiers
   photo?: string | File | null; // <-- allow null
};


type LocationState = {
  occasion?: { _id: string; title: string; category: string };
  service: {
    id: string 
    title: string;
    price?: number;
    discount?: number;
    discountedPrice?: number;
    location?: string;
    description?: string;
    provider?: {
      name: string;
      email?: string;
      phone?: string;
      whatsapp?: string;
      telegram?: string;
    };
    imageUrl?: File | string;
    category?: string;
  };
};

type AvailabilityPayload = {
  serviceId: string;
  checkInDate: string; // YYYY-MM-DD
  checkOutDate: string; // YYYY-MM-DD
  guests: number;
  roomPref?: string;
  contactEmail?: string;
  contactWhatsApp?: string;
  contactTelegram?: string;
};

type AvailabilityResponse = {
  status: "Available" | "Booked" | "Partial" | "Pending" | "Error";
  availableRooms?: number;
  message?: string;
  ticketId?: string; // when request routed to support
};

const hotelRoomSubcategories = [
  {
    label: "3 Star Hotel",
    options: [
      "Standard Room",
      "Deluxe Room",
      "Twin Room",
      "Suit Room",
      "Royal Suite Room",
    ],
  },
  {
    label: "4 Star Hotel",
    options: [
      "Standard Room",
      "Deluxe Room",
      "Twin Room",
      "Suit Room",
      "Royal Suite Room",
    ],
  },
  {
    label: "5 Star Hotel",
    options: [
      "Standard Room",
      "Deluxe Room",
      "Twin Room",
      "Suit Room",
      "Royal Suite Room",
      "Presidential Room",
    ],
  },
  {
    label: "Pensions",
    options: ["Standard Pension Room"],
  },
];
/* ------------------------- Helper utilities ------------------------ */
function parseDateAsLocal(dateString: string) {
  // dateString expected as YYYY-MM-DD
  const [y, m, d] = dateString.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function calcNights(checkIn: string, checkOut: string) {
  const inDate = parseDateAsLocal(checkIn);
  const outDate = parseDateAsLocal(checkOut);
  const diff = outDate.getTime() - inDate.getTime();
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
  return days > 0 ? days : 1;
}

/* ------------------------- Image compression for mobile ------------------------ */
/**
 * Compresses and resizes an image file to reduce upload size (especially important for mobile)
 * @param file - The original image file
 * @param maxWidth - Maximum width (default 1920)
 * @param maxHeight - Maximum height (default 1920)
 * @param quality - JPEG quality 0-1 (default 0.85)
 * @returns Promise<File> - Compressed file
 */
async function compressImage(
  file: File,
  maxWidth: number = 1920,
  maxHeight: number = 1920,
  quality: number = 0.85
): Promise<File> {
  return new Promise((resolve, reject) => {
    // If file is already small (< 1MB), skip compression
    if (file.size < 1024 * 1024) {
      resolve(file);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        // Calculate new dimensions
        let width = img.width;
        let height = img.height;

        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = width * ratio;
          height = height * ratio;
        }

        // Create canvas and draw resized image
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        // Convert to blob
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Failed to compress image'));
              return;
            }

            // Create new File from blob
            const compressedFile = new File(
              [blob],
              file.name || `compressed-${Date.now()}.jpg`,
              { type: 'image/jpeg', lastModified: Date.now() }
            );

            console.log(`📦 Image compressed: ${(file.size / 1024).toFixed(1)}KB → ${(compressedFile.size / 1024).toFixed(1)}KB`);
            resolve(compressedFile);
          },
          'image/jpeg',
          quality
        );
      };
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

/* ------------------------ Component ------------------------ */
const SendGiftForm: React.FC = () => {
  const { state } = useLocation() as { state: LocationState };
  const navigate = useNavigate();

  const { occasion, service } = state || {};

  if (!service) {
    return (
      <div className="p-6">
        <p className="text-red-600 mb-4">No service selected.</p>
        <button
          onClick={() => navigate(-1)}
          className="bg-[#1c2b21] text-white px-4 py-2 rounded"
        >
          Go Back
        </button>
      </div>
    );
  }

  /* ---------------------- Auth / Sender ---------------------- */
  const isLoggedIn = !!localStorage.getItem("user");
  const [senderNameInput, setSenderNameInput] = useState("");
  const [senderEmailInput, setSenderEmailInput] = useState("");

  const getStoredOccasionTitle = () => {
    if (typeof window === "undefined") return "";
    return sessionStorage.getItem("wanaw:selectedOccasionTitle") || "";
  };

  const [occasionTitleInput, setOccasionTitleInput] = useState(() => {
    return occasion?.title || getStoredOccasionTitle();
  });
  const [occasionOptions, setOccasionOptions] = useState<string[]>([]);
  

  useEffect(() => {
    if (!isLoggedIn) {
      try {
        const saved = JSON.parse(localStorage.getItem("guestSender") || "{}");
        setSenderNameInput(saved.name || "");
        setSenderEmailInput(saved.email || "");
      } catch (e) {
        // ignore
      }
    }
  }, [isLoggedIn]);

  useEffect(() => {
    if (!isLoggedIn) {
      localStorage.setItem(
        "guestSender",
        JSON.stringify({ name: senderNameInput, email: senderEmailInput })
      );
    }
  }, [senderNameInput, senderEmailInput, isLoggedIn]);

  useEffect(() => {
    if (occasion?.title) {
      setOccasionTitleInput(occasion.title);
    }
  }, [occasion?.title]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem("wanaw:selectedOccasionTitle", occasionTitleInput || "");
    }
  }, [occasionTitleInput]);

  useEffect(() => {
    const fetchOccasions = async () => {
      try {
        const res = await fetch(`${BASE_URL}/gifts`);
        if (!res.ok) return;
        const data = await res.json();
        const normalizedTitles = ((data || []) as Array<{ title?: string }>)
          .map((gift) => (typeof gift?.title === "string" ? gift.title.trim() : ""))
          .filter((title): title is string => title.length > 0);
        const titles = Array.from(new Set<string>(normalizedTitles));
        setOccasionOptions(titles);
      } catch (err) {
        console.error("Failed to load occasion options:", err);
      }
    };
    fetchOccasions();
  }, []);

  const resolveOccasionTitle = () => occasionTitleInput.trim();

  const loggedInUser = (() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "null");
    } catch (e) {
      return null;
    }
  })();

  const senderName = loggedInUser?.fullName || senderNameInput || "Anonymous";
  const senderEmail = loggedInUser?.email || senderEmailInput || "";

  /* ------------------ Recipients + Gift data ------------------ */
const [recipients, setRecipients] = useState<Recipient[]>([
  { name: "", email: "", phone: "", whatsapp: "", telegram: "", type: "standard", photo: null }
]);

  const [message, setMessage] = useState("");
  const [notifyProvider, setNotifyProvider] = useState(false);
  const [providerMessage, setProviderMessage] = useState("");
  const [deliveryDate, setDeliveryDate] = useState<string>("");

  /* ------------------ Hotel availability states ------------------ */
  const [checkInDate, setCheckInDate] = useState<string>("");
  const [checkOutDate, setCheckOutDate] = useState<string>("");
  const [guests] = useState<number>(1);
  const [roomPref, setRoomPref] = useState<string>("Any");

  const [contactEmail, setContactEmail] = useState<string>("");
  const [contactWhatsApp, setContactWhatsApp] = useState<string>("");
  const [contactTelegram, setContactTelegram] = useState<string>("");

  const [availability, setAvailability] = useState<AvailabilityResponse | null>(null);
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [availabilityError, setAvailabilityError] = useState<string | null>(null);
  const [proceedAnyway, setProceedAnyway] = useState(false);
  const [referralCode, setReferralCode] = useState<string>("");
  const [photoPreviews, setPhotoPreviews] = useState<{ [key: number]: string }>({});

  // Cleanup photo preview URLs when recipients change or on unmount
  useEffect(() => {
    // Clean up previews for recipients that no longer exist
    const currentIndices = new Set(recipients.map((_, i) => i));
    const previewIndices = Object.keys(photoPreviews).map(Number);
    previewIndices.forEach(index => {
      if (!currentIndices.has(index)) {
        if (photoPreviews[index]) {
          URL.revokeObjectURL(photoPreviews[index]);
        }
        setPhotoPreviews(prev => {
          const newPreviews = { ...prev };
          delete newPreviews[index];
          return newPreviews;
        });
      }
    });
  }, [recipients.length, photoPreviews]);

  // Cleanup photo preview URLs on unmount
  useEffect(() => {
    return () => {
      Object.values(photoPreviews).forEach(url => {
        if (url) URL.revokeObjectURL(url);
      });
    };
  }, []);

  const [nights, setNights] = useState<number>(1);

  // Check if service is a hotel room
  const isHotelRoom = service.category === "Hotel Rooms" || service.category === "Hotel";

  // Helper to get effective price (discounted if available, otherwise regular price)
  const getEffectivePrice = () => {
    if (service.discountedPrice !== undefined && service.discountedPrice !== null) {
      return service.discountedPrice;
    }
    if (service.discount && service.discount > 0 && service.price) {
      return service.price * (1 - service.discount / 100);
    }
    return service.price || 0;
  };

  const effectivePrice = getEffectivePrice();

  const normalizedPrice =
    typeof effectivePrice === "string" ? parseFloat(effectivePrice) || 0 : effectivePrice || 0;
  const baseNights = isHotelRoom ? Math.max(1, nights) : 1;

  const getRecipientMultiplier = (type?: Recipient["type"]) => {
    if (type === "vip") return 1.15; // 15% premium
    if (type === "corporate") return 0.85; // 15% discount
    return 1;
  };

  const calculateRecipientPrice = (type?: Recipient["type"]) => {
    return normalizedPrice * baseNights * getRecipientMultiplier(type);
  };

  const computeTotalAmount = () => {
    return recipients.reduce((sum, recipient) => {
      return sum + calculateRecipientPrice(recipient.type);
    }, 0);
  };

  const isCorporateEligible = recipients.length >= 10;

  /* Calculate nights whenever dates change */
  useEffect(() => {
    if (isHotelRoom && checkInDate && checkOutDate) {
      const days = calcNights(checkInDate, checkOutDate);
      setNights(days);
    }
  }, [checkInDate, checkOutDate, isHotelRoom]);

  /* ------------------ Handlers ------------------ */
 const handleRecipientChange = (
  index: number,
  field: keyof Recipient,
  value: string | File | null // ✅ allow both string, File, and null
) => {
  const updated = [...recipients];

  if (field === "type") {
    const selectedType = value as Recipient["type"];
    if (selectedType === "corporate" && !isCorporateEligible) {
      alert("Corporate gifts require at least 10 recipients. Please add more recipients first.");
      return;
    }
    // If switching away from VIP, clean up photo and preview
    if (updated[index].type === "vip" && selectedType !== "vip") {
      if (photoPreviews[index]) {
        URL.revokeObjectURL(photoPreviews[index]);
        setPhotoPreviews(prev => {
          const newPreviews = { ...prev };
          delete newPreviews[index];
          return newPreviews;
        });
      }
      updated[index].photo = null;
    }
    updated[index].type = selectedType;
  } else {
  updated[index][field] = value as any; // or narrow by field if needed
  }

  setRecipients(updated);
};


  async function handleCheckAvailability() {
    setAvailabilityError(null);

    if (!checkInDate || !checkOutDate) {
      setAvailabilityError("Please select check-in and check-out dates.");
      return;
    }

    if (!contactEmail && !contactWhatsApp && !contactTelegram) {
      setAvailabilityError("Please provide at least one contact (email/WhatsApp/Telegram).");
      return;
    }

    // Basic date validity
    const inDate = parseDateAsLocal(checkInDate);
    const outDate = parseDateAsLocal(checkOutDate);
    if (outDate <= inDate) {
      setAvailabilityError("Check-out date must be after check-in date.");
      return;
    }

    setCheckingAvailability(true);


// prepare payload for availability
const payload: AvailabilityPayload = {
  serviceId: service.id,
  checkInDate,
  checkOutDate,
  guests,
  roomPref,
  contactEmail,
  contactWhatsApp,
  contactTelegram,
};


    try {
      const res = await fetch(`${BASE_URL}/hotel/check-availability`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.status === 404) {
        // API not implemented — fallback to support ticket
        const supportRes = await fetch(`${BASE_URL}/support/availability-request`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...payload, senderName, senderEmail }),
        });

        if (supportRes.ok) {
          const data = await supportRes.json();
          setAvailability({
            status: "Pending",
            ticketId: data.ticketId || undefined,
            message:
              "We couldn't check availability automatically. Your request has been forwarded to Customer Support.",
          });
        } else {
          setAvailability({
            status: "Pending",
            message:
              "We couldn't check availability automatically and failed to send the request to support. Please try again later.",
          });
        }

        setCheckingAvailability(false);
        return;
      }

      if (!res.ok) {
        // server error
        setAvailability({ status: "Error", message: "Failed to check availability." });
        setCheckingAvailability(false);
        return;
      }

      const data = await res.json();
      // Expecting response with { status: 'Available'|'Booked'|'Partial', availableRooms?, message? }
      setAvailability({
        status: data.status || "Error",
        availableRooms: data.availableRooms,
        message: data.message,
      });
    } catch (err) {
      console.error(err);
      // Network error -> fallback to support ticket submission
      try {
        const supportRes = await fetch(`${BASE_URL}/support/availability-request`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...payload, senderName, senderEmail }),
        });
        if (supportRes.ok) {
          const d = await supportRes.json();
          setAvailability({
            status: "Pending",
            ticketId: d.ticketId || undefined,
            message: "Network error — we forwarded your request to Customer Support.",
          });
        } else {
          setAvailability({ status: "Error", message: "Network error and failed to contact support." });
        }
      } catch (e) {
        setAvailability({ status: "Error", message: "Network error and failed to contact support." });
      }
    } finally {
      setCheckingAvailability(false);
    }
  }

  /* Reuse notifyAllChannels from your original logic (slightly adapted) */
  const notifyAllChannels = async (
    deliveryCode: string,
    recipient: Recipient,
    finalOccasionTitle: string
  ) => {
    const payload = {
      buyerName: senderName,
      buyerEmail: senderEmail,
      recipientEmail: recipient.email || "",
      recipientPhone: recipient.phone || "",
      recipientWhatsApp: recipient.whatsapp || "",
      recipientTelegram: recipient.telegram || "",
      message,
      senderName,
      serviceTitle: service.title,
      occasionTitle: finalOccasionTitle,
      serviceImageUrl: service.imageUrl,

      notifyProvider,
      providerMessage,
      providerContact: service.provider,

      provider: service.provider?.name || "",
      location: service?.location || "",
      giftCode: deliveryCode,
      deliveryDate,

      serviceId: service.id,

      checkInDate: isHotelRoom ? checkInDate : undefined,
      checkOutDate: isHotelRoom ? checkOutDate : undefined,
      nights: isHotelRoom ? nights : undefined,
    };

    try {
      await fetch(`${BASE_URL}/notifications/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } catch (e) {
      console.error("notifyAllChannels error:", e);
    }
  };

  /* ------------------ Main purchase + send ------------------ */
const handlePayAndSend = async () => {
  const finalOccasionTitle = resolveOccasionTitle();
  // --- Hotel validation ---
  if (isHotelRoom) {
    // Allow proceeding if availability is "Available" or "Pending" (user has checked), or if proceedAnyway is checked
    if (!availability || (availability.status !== "Available" && availability.status !== "Pending" && !proceedAnyway)) {
      alert(
        "Please check room availability first and ensure rooms are available. You can override by checking 'Proceed anyway', but that's at your own risk."
      );
      return;
    }

    if (!checkInDate || !checkOutDate) {
      alert("Please select check-in and check-out dates.");
      return;
    }
  }

  // --- Recipient and sender validation ---
  if (!recipients.some((r) => r.email || r.phone || r.whatsapp || r.telegram)) {
    alert("Please enter at least one recipient contact.");
    return;
  }

  if (!isLoggedIn && !senderEmailInput) {
    alert("Please enter your email.");
    return;
  }

  const corporateCount = recipients.filter((r) => r.type === "corporate").length;
  if (corporateCount > 0 && recipients.length < 10) {
    alert("Corporate gifts require at least 10 recipients. Please add more recipients or switch back to Standard/VIP.");
    return;
  }

  // --- VIP photo validation ---
  const vipRecipientsWithoutPhoto = recipients.filter(
    (r) => r.type === "vip" && (!r.photo || !(r.photo instanceof File))
  );
  if (vipRecipientsWithoutPhoto.length > 0) {
    const recipientNames = vipRecipientsWithoutPhoto.map((r) => r.name || "Unnamed recipient").join(", ");
    alert(`VIP gifts require a photo to be uploaded. Please upload a photo for: ${recipientNames}`);
    return;
  }

  // Additional validation: Ensure all VIP photos are valid File objects with size > 0
  const invalidVipPhotos = recipients.filter(
    (r) => r.type === "vip" && r.photo instanceof File && (r.photo.size === 0 || !r.photo.type)
  );
  if (invalidVipPhotos.length > 0) {
    alert("Some VIP photos appear to be invalid. Please re-upload the photos and try again.");
    return;
  }

  try {
    // --- Prepare FormData for file upload ---
    const formData = new FormData();
    formData.append("buyerName", senderName);
    formData.append("buyerEmail", senderEmail);
    formData.append("deliveryDate", deliveryDate);
    formData.append("message", message);
   formData.append("serviceId", service.id);
    formData.append("occasionTitle", finalOccasionTitle);

    if (isHotelRoom) {
      formData.append("checkInDate", checkInDate);
      formData.append("checkOutDate", checkOutDate);
      formData.append("nights", nights.toString());
    }

    // Validate VIP photos before building FormData
    const photoErrors: string[] = [];
    recipients.forEach((r, i) => {
      if (r.type === "vip") {
        if (r.photo instanceof File) {
          if (r.photo.size === 0) {
            photoErrors.push(`Photo for ${r.name || `recipient ${i + 1}`} appears to be invalid (zero size). Please re-upload.`);
          }
        } else if (r.photo && typeof r.photo === 'string' && r.photo.startsWith('blob:')) {
          photoErrors.push(`Photo for ${r.name || `recipient ${i + 1}`} needs to be re-selected. Please choose the image again.`);
        }
      }
    });

    if (photoErrors.length > 0) {
      alert(photoErrors.join('\n'));
      return;
    }

    // Build FormData after validation
    recipients.forEach((r, i) => {
      formData.append(`recipients[${i}][name]`, r.name);
      formData.append(`recipients[${i}][email]`, r.email);
      formData.append(`recipients[${i}][phone]`, r.phone || "");
      formData.append(`recipients[${i}][whatsapp]`, r.whatsapp || "");
      formData.append(`recipients[${i}][telegram]`, r.telegram || "");
      formData.append(`recipients[${i}][type]`, r.type);
      // Handle VIP photo upload - check both File instance and ensure it's valid
      if (r.type === "vip") {
        if (r.photo instanceof File) {
          // Ensure file name is valid (mobile devices sometimes have empty or invalid names)
          // Use original file name if available, otherwise generate one
          const fileName = (r.photo.name && r.photo.name.trim()) 
            ? r.photo.name 
            : `vip-photo-${i}-${Date.now()}.jpg`;
          
          console.log(`📸 Uploading photo for VIP recipient ${i}:`, fileName, r.photo.size, 'bytes', 'type:', r.photo.type || 'unknown');
          
          // Use the original file object directly to avoid data loss on mobile
          // The third parameter (filename) is optional but helps with server-side handling
          formData.append(`recipients[${i}][photo]`, r.photo, fileName);
        } else if (r.photo) {
          console.warn(`⚠️ VIP recipient ${i} has photo but it's not a File instance:`, typeof r.photo);
        } else {
          console.error(`❌ VIP recipient ${i} (${r.name}) is missing required photo`);
        }
      }
    });

    if (referralCode) {
      formData.append("referralCode", referralCode);
    }

    // --- Send purchase request ---
    // Log FormData contents for debugging (especially on mobile)
    console.log("📤 Sending FormData with recipients:", recipients.length);
    recipients.forEach((r, i) => {
      if (r.type === "vip" && r.photo instanceof File) {
        console.log(`  Recipient ${i} (VIP): photo=${r.photo.name || 'unnamed'}, size=${r.photo.size}, type=${r.photo.type}`);
      }
    });

    let purchaseRes;
    let purchaseData;
    try {
      // Create an AbortController for timeout handling (important for mobile file uploads)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout for file uploads

      try {
        purchaseRes = await fetch(`${BASE_URL}/services/${service.id}/purchase`, {
          method: "POST",
          body: formData,
          signal: controller.signal, // Add abort signal for timeout
        });
        clearTimeout(timeoutId);
      } catch (fetchErr: any) {
        clearTimeout(timeoutId);
        // Check if it was aborted (timeout)
        if (fetchErr.name === 'AbortError' || controller.signal.aborted) {
          throw new Error("Request timeout: The upload is taking too long. Please try again with a smaller image or check your connection.");
        }
        // Re-throw other fetch errors
        throw fetchErr;
      }

      // Check if response is ok before trying to parse JSON
      const contentType = purchaseRes.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        purchaseData = await purchaseRes.json();
      } else {
        const textData = await purchaseRes.text();
        console.error("Non-JSON response:", textData);
        throw new Error(`Server returned non-JSON response: ${purchaseRes.status} ${purchaseRes.statusText}`);
      }
    } catch (fetchError: any) {
      console.error("Network or parsing error:", fetchError);
      
      // More specific error detection
      const errorMessage = fetchError.message || '';
      const errorName = fetchError.name || '';
      
      // Check for specific error types
      if (errorName === 'AbortError' || errorMessage.includes('timeout') || errorMessage.includes('Timeout')) {
        alert("❌ Upload timeout: The image upload is taking too long. Please try:\n- Using a smaller image\n- Checking your internet connection\n- Trying again");
      } else if (errorMessage.includes("Failed to fetch") || errorMessage.includes("NetworkError") || errorMessage.includes("Network request failed")) {
        // This could be actual network issue, CORS, or server not responding
        alert("❌ Connection error: Unable to reach the server. Please:\n- Check your internet connection\n- Try again in a moment\n- If the problem persists, try using a smaller image");
      } else if (errorMessage.includes("CORS") || errorMessage.includes("cross-origin")) {
        alert("❌ Upload error: Please try again or contact support if the issue persists.");
      } else {
        // Generic error with more context
        alert(`❌ Error sending gift: ${errorMessage || 'Unknown error'}\n\nPlease try:\n- Using a smaller image\n- Checking your connection\n- Trying again`);
      }
      return;
    }
    
    if (!purchaseRes.ok) {
      console.error("Purchase failed:", purchaseData);
      // Even if there's an error, check if purchase was still recorded
      if (purchaseData?.purchaseId) {
        alert(`✅ Purchase recorded! ${purchaseData.receiptMessage || 'Payment is pending. Please complete payment to finalize.'}`);
      } else {
        const errorMsg = purchaseData?.message || purchaseData?.error || purchaseRes.statusText || 'Unknown error';
        console.error("Full error details:", { status: purchaseRes.status, data: purchaseData });
        alert(`❌ Failed to send gift: ${errorMsg}`);
        return;
      }
    }

    // Show success message with payment pending info if applicable
    if (purchaseData.paymentPending || purchaseData.receiptMessage) {
      alert(`✅ ${purchaseData.msg || 'Purchase recorded!'}\n\n${purchaseData.receiptMessage || ''}`);
    } else {
      alert("🎉 Gift sent and purchase recorded!");
    }

    const { codes: deliveryCodes = [] } = purchaseData;

    // --- Notify recipients --- (only if codes are available)
    if (deliveryCodes.length > 0) {
      for (let i = 0; i < recipients.length && i < deliveryCodes.length; i++) {
        try {
      await notifyAllChannels(deliveryCodes[i], recipients[i], finalOccasionTitle);
        } catch (err) {
          console.error("Error notifying recipient:", recipients[i], err);
        }
      }
    }

    // Alert already shown above, no need to show again

    const currentTotalAmount = Number(computeTotalAmount().toFixed(2));

    // --- Navigate to payment options ---
    navigate("/payment-options", {
      state: {
        service,
        senderName,
        senderEmail,
        amount: currentTotalAmount,
        total: currentTotalAmount,
        recipients,
        occasion,
        notifyProvider,
        providerMessage,
      },
    });
  } catch (error) {
    console.error("Send gift error:", error);
    alert("❌ Something went wrong while sending the gift.");
  }
};

  /* ------------------ Render ------------------ */
  // Availability is verified if status is "Available" or "Pending" (user has completed the check)
  const availabilityVerified = availability?.status === "Available" || availability?.status === "Pending";

  const totalAmount = Number(computeTotalAmount().toFixed(2));


  return (
    <div className="max-w-lg mx-auto bg-white shadow-xl rounded-2xl overflow-hidden my-10">
      <div className="p-6 sm:p-8">
        <h2 className="flex items-center text-2xl font-bold mb-4 text-[#1c2b21]">
          <GiftIcon className="w-6 h-6 mr-2 text-[#D4AF37]" />
          Send “{service.title}”
        </h2>

        <div className="mb-6 border border-gray-200 rounded-xl p-4 bg-gray-50">
          <label className="block text-sm font-semibold text-[#1c2b21] mb-2">
            Occasion (optional)
          </label>
          <input
            list="wanaw-occasion-options"
            value={occasionTitleInput}
            onChange={(e) => setOccasionTitleInput(e.target.value)}
            placeholder="Type any occasion or leave blank"
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D4AF37] focus:border-[#D4AF37]"
          />
          <datalist id="wanaw-occasion-options">
            {occasionOptions.map((title) => (
              <option key={title} value={title} />
            ))}
          </datalist>
          <div className="text-xs text-gray-500 mt-2 space-y-1">
            {occasion?.title && (
              <p>
                Suggested occasion: <span className="font-semibold">{occasion.title}</span>
                {occasion?.category ? ` (${occasion.category === "diaspora" ? "Ethiopian Diaspora" : occasion.category.charAt(0).toUpperCase() + occasion.category.slice(1)})` : ""}
              </p>
            )}
            <p>This field is optional—add a label if you want it to appear on cards or emails.</p>
          </div>
        </div>

        {/* ---------------------- Availability step (hotel only) ---------------------- */}
        {isHotelRoom && !availabilityVerified && !proceedAnyway && (
          <div className="mb-6 border p-4 rounded bg-gray-50">
            <h3 className="font-semibold mb-3 text-[#1c2b21]">Step 1 — Check Room Availability</h3>

            <label className="block mb-2 font-medium text-[#1c2b21]">Check-in Date</label>
            <input
              type="date"
              value={checkInDate}
              onChange={(e) => setCheckInDate(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg mb-4"
            />

            <label className="block mb-2 font-medium text-[#1c2b21]">Check-out Date</label>
            <input
              type="date"
              value={checkOutDate}
              onChange={(e) => setCheckOutDate(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg mb-4"
            />


            <label className="block mb-2 font-medium text-[#1c2b21]">Room Preference</label>
<select
  value={roomPref}
  onChange={(e) => setRoomPref(e.target.value)}
  className="w-full p-3 border border-gray-300 rounded-lg mb-4"
>
  <option value="">Any</option>
  {hotelRoomSubcategories.map((category, idx) => (
    <optgroup key={idx} label={category.label}>
      {category.options.map((option, i) => (
        <option key={i} value={option}>
          {option}
        </option>
      ))}
    </optgroup>
  ))}
</select>


            <p className="mt-2 mb-2 text-sm text-gray-600">Contact (so we can notify you):</p>
            <input
              type="email"
              placeholder="Email"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              className="w-full p-2 border border-gray-300 mb-2 rounded"
            />
            <input
              type="tel"
              placeholder="WhatsApp (Optional)"
              value={contactWhatsApp}
              onChange={(e) => setContactWhatsApp(e.target.value)}
              className="w-full p-2 border border-gray-300 mb-2 rounded"
            />
            <input
              type="text"
              placeholder="Telegram (Optional)"
              value={contactTelegram}
              onChange={(e) => setContactTelegram(e.target.value)}
              className="w-full p-2 border border-gray-300 mb-4 rounded"
            />

            {availabilityError && <p className="text-red-600 mb-2">{availabilityError}</p>}

            {availability && (
              <div className="p-3 mb-4 rounded border bg-white">
                <p className="font-medium">Status: {availability.status}</p>
                {availability.availableRooms !== undefined && (
                  <p>{availability.availableRooms} rooms available.</p>
                )}
                {availability.message && <p className="text-sm">{availability.message}</p>}
                {availability.ticketId && <p className="text-sm">Ticket: {availability.ticketId}</p>}
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={handleCheckAvailability}
                disabled={checkingAvailability}
                className="bg-[#1c2b21] text-white px-4 py-2 rounded"
              >
                {checkingAvailability ? "Checking..." : "Check Availability"}
              </button>

              <label className="flex items-center text-sm gap-2">
                <input
                  type="checkbox"
                  checked={proceedAnyway}
                  onChange={(e) => setProceedAnyway(e.target.checked)}
                />
                Proceed anyway (I understand availability may not be confirmed)
              </label>
            </div>

            <p className="text-xs text-gray-500 mt-3">
              Note: If automatic checking is not available, your request will be forwarded to customer support and
              they will contact you.
            </p>
          </div>
        )}

        {/* ---------------------- Gift form (rendered once availability is OK or not a hotel) ---------------------- */}
        {(!isHotelRoom || availabilityVerified || proceedAnyway) && (
          <div>
            {/* Sender inputs for guests (when not logged in) */}
            {!isLoggedIn && (
              <>
                <input
                  type="text"
                  placeholder="Your Name"
                  value={senderNameInput}
                  onChange={(e) => setSenderNameInput(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg mb-4"
                />
                <input
                  type="email"
                  placeholder="Your Email (required)"
                  value={senderEmailInput}
                  onChange={(e) => setSenderEmailInput(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg mb-4"
                />
              </>
            )}

            {recipients.map((r, index) => (
  <div key={index} className="mb-6 border p-4 rounded bg-gray-50">
    {/* Recipient Type (Standard / VIP) */}
    <select
      value={r.type || "standard"}
      onChange={(e) => handleRecipientChange(index, "type", e.target.value)}
      className="w-full p-2 border border-gray-300 mb-2 rounded"
    >
      <option value="standard">Standard Gift </option>
      <option value="vip">VIP Gift</option>
      <option value="corporate" disabled={!isCorporateEligible}>
        Corporate Gift (15% off • 10+ recipients)
      </option>
    </select>
    {!isCorporateEligible ? (
      <p className="text-xs text-gray-500 mb-2">
        Add {Math.max(0, 10 - recipients.length)} more recipient
        {Math.max(0, 10 - recipients.length) === 1 ? "" : "s"} to unlock corporate gifting (15% off).
      </p>
    ) : (
      <p className="text-xs text-green-600 mb-2">
        Corporate gifts apply a 15% discount automatically for bulk orders.
      </p>
    )}

    <input
      type="text"
      placeholder="Recipient Name"
      value={r.name}
      onChange={(e) => handleRecipientChange(index, "name", e.target.value)}
      className="w-full p-2 border border-gray-300 mb-2 rounded"
    />
    <input
      type="email"
      placeholder="Recipient Email"
      value={r.email}
      onChange={(e) => handleRecipientChange(index, "email", e.target.value)}
      className="w-full p-2 border border-gray-300 mb-2 rounded"
    />
    <input
      type="tel"
      placeholder="Phone"
      value={r.phone}
      onChange={(e) => handleRecipientChange(index, "phone", e.target.value)}
      className="w-full p-2 border border-gray-300 mb-2 rounded"
    />
    <input
      type="tel"
      placeholder="WhatsApp (Optional)"
      value={r.whatsapp}
      onChange={(e) => handleRecipientChange(index, "whatsapp", e.target.value)}
      className="w-full p-2 border border-gray-300 mb-2 rounded"
    />
    <input
      type="text"
      placeholder="Telegram (Optional)"
      value={r.telegram}
      onChange={(e) => handleRecipientChange(index, "telegram", e.target.value)}
      className="w-full p-2 border border-gray-300 mb-2 rounded"
    />

    {/* If VIP, show photo upload */}
    {r.type === "vip" && (
      <div className="mt-2">
        <label className="block mb-2 font-medium text-[#1c2b21]">
          Upload Photo (VIP only - Required)
        </label>
        <input
          type="file"
          accept="image/*"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (file) {
              // Validate file type
              if (!file.type.startsWith('image/')) {
                alert("Please select an image file.");
                e.target.value = ''; // Reset input
                // Clean up preview
                if (photoPreviews[index]) {
                  URL.revokeObjectURL(photoPreviews[index]);
                  setPhotoPreviews(prev => {
                    const newPreviews = { ...prev };
                    delete newPreviews[index];
                    return newPreviews;
                  });
                }
                return;
              }
              // Validate file size (max 10MB before compression)
              if (file.size > 10 * 1024 * 1024) {
                alert("Image size must be less than 10MB. Please choose a smaller image.");
                e.target.value = ''; // Reset input
                // Clean up preview
                if (photoPreviews[index]) {
                  URL.revokeObjectURL(photoPreviews[index]);
                  setPhotoPreviews(prev => {
                    const newPreviews = { ...prev };
                    delete newPreviews[index];
                    return newPreviews;
                  });
                }
                return;
              }

              try {
                // Compress image to reduce upload size (especially important for mobile)
                const compressedFile = await compressImage(file, 1920, 1920, 0.85);
                
                // Create preview URL from compressed file
                const previewUrl = URL.createObjectURL(compressedFile);
                // Clean up old preview if exists
                if (photoPreviews[index]) {
                  URL.revokeObjectURL(photoPreviews[index]);
                }
                setPhotoPreviews(prev => ({ ...prev, [index]: previewUrl }));
                handleRecipientChange(index, "photo", compressedFile);
              } catch (compressionError) {
                console.error("Image compression failed, using original:", compressionError);
                // If compression fails, use original file
                const previewUrl = URL.createObjectURL(file);
                if (photoPreviews[index]) {
                  URL.revokeObjectURL(photoPreviews[index]);
                }
                setPhotoPreviews(prev => ({ ...prev, [index]: previewUrl }));
                handleRecipientChange(index, "photo", file);
              }
            } else {
              // Clear photo if no file selected
              // Clean up preview
              if (photoPreviews[index]) {
                URL.revokeObjectURL(photoPreviews[index]);
                setPhotoPreviews(prev => {
                  const newPreviews = { ...prev };
                  delete newPreviews[index];
                  return newPreviews;
                });
              }
              handleRecipientChange(index, "photo", null);
            }
          }}
          className="w-full p-2 border border-gray-300 rounded"
          required={r.type === "vip"}
        />
        {photoPreviews[index] && (
          <div className="mt-2">
            <img
              src={photoPreviews[index]}
              alt="Preview"
              className="w-full max-w-xs h-32 object-cover rounded border border-gray-300"
            />
            <div className="mt-1 text-sm text-green-600">
              ✓ Photo selected: {r.photo instanceof File ? r.photo.name : 'Image'} 
              {r.photo instanceof File && ` (${(r.photo.size / 1024).toFixed(1)} KB)`}
            </div>
          </div>
        )}
        {!r.photo && r.type === "vip" && (
          <p className="text-xs text-red-600 mt-1">
            ⚠ Photo is required for VIP gifts
          </p>
        )}
      </div>
    )}
  </div>
))}

<button
  type="button"
  className="bg-[#1c2b21] text-white px-4 py-1 mb-4 rounded"
  onClick={() =>
    setRecipients([
      ...recipients,
      {
        name: "",
        email: "",
        phone: "",
        whatsapp: "",
        telegram: "",
        type: "standard", // default
        photo: null,
      },
    ])
  }
>
  ➕ Add Another Recipient
</button>




            {/* Conditional date inputs */}
            {isHotelRoom ? (
              <>
                <label className="block mb-2 font-medium text-[#1c2b21]">Check-in Date</label>
                <input
                  type="date"
                  value={checkInDate}
                  onChange={(e) => setCheckInDate(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg mb-4"
                  required
                />

                <label className="block mb-2 font-medium text-[#1c2b21]">Check-out Date</label>
                <input
                  type="date"
                  value={checkOutDate}
                  onChange={(e) => setCheckOutDate(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg mb-4"
                  required
                  min={checkInDate || undefined}
                />

                <label className="block mb-2 font-medium text-[#1c2b21]">Number of Nights</label>
                <input
                  type="number"
                  min={1}
                  value={nights}
                  readOnly
                  className="w-full p-3 border border-gray-300 rounded-lg mb-6 bg-gray-100 cursor-not-allowed"
                />
                
                {/* Display total amount calculation for hotel rooms */}
                {effectivePrice > 0 && nights > 0 && (
                  <div className="mb-6 p-3 bg-green/10 rounded-lg border border-green/20">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-gray-600">Price per Night:</span>
                      <div className="text-right">
                        {service.discount && service.discount > 0 && service.price ? (
                          <>
                            <span className="text-xs text-gray-400 line-through mr-2">
                              ETB {service.price.toLocaleString()}
                            </span>
                            <span className="text-sm font-medium text-gray-800">
                              ETB {effectivePrice.toLocaleString()}
                            </span>
                            <span className="ml-2 text-xs bg-red-500 text-white px-2 py-0.5 rounded">
                              {service.discount}% OFF
                            </span>
                          </>
                        ) : (
                          <span className="text-sm font-medium text-gray-800">
                            ETB {effectivePrice.toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t border-green/20">
                      <span className="text-base font-bold text-[#1c2b21]">Total Amount:</span>
                      <span className="text-lg font-bold text-green">ETB {(effectivePrice * nights).toLocaleString()}</span>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <>
                <label className="block mb-2 font-medium text-[#1c2b21]">Preferred Service Date</label>
                <input
                  type="date"
                  value={deliveryDate}
                  onChange={(e) => setDeliveryDate(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg mb-6"
                />
              </>
            )}

            {/* Main Message Section (recipient message, restricted if VIP) */}
<textarea
  placeholder="Add a message (optional)"
  value={message}
  onChange={(e) => {
    const words = e.target.value.trim().split(/\s+/);
    if (recipients.some((r) => r.type === "vip") && words.length > 20) {
      return; // prevent typing more than 20 words
    }
    setMessage(e.target.value);
  }}
  className="w-full p-3 border border-gray-300 rounded-lg mb-6 h-32 resize-none"
/>

{service.provider && (
  <div className="mb-6 border-t pt-4">
    <button
      type="button"
      onClick={() => setNotifyProvider((v) => !v)}
      className="flex items-center text-sm font-medium text-[#1c2b21] mb-2"
    >
      {notifyProvider ? (
        <ChevronUp className="w-4 h-4 mr-1" />
      ) : (
        <ChevronDown className="w-4 h-4 mr-1" />
      )}
      Notify {service.provider.name}
    </button>

    {notifyProvider && (
      <>
        {/* Separate message for provider */}
        <textarea
          placeholder="Message to the service provider (optional)"
          value={providerMessage}
          onChange={(e) => setProviderMessage(e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-lg resize-none"
          rows={4}
        />
      </>
    )}
  </div>
)}

              </div>
            )}

           {effectivePrice > 0 && (
  <div className="text-right text-gray-700 mb-4">
    {service.discount && service.discount > 0 && service.price ? (
      <div>
        <div className="text-sm text-gray-400 line-through mb-1">
          Original: ETB {(service.price * (isHotelRoom ? nights : 1) * recipients.length).toLocaleString()}
        </div>
        <div>
          <span className="font-semibold">Total:</span> <span className="text-[#1c2b21] font-bold">{totalAmount.toLocaleString()}</span> ETB
          <span className="ml-2 text-sm bg-red-500 text-white px-2 py-1 rounded">{service.discount}% OFF</span>
        </div>
      </div>
    ) : (
      <div>
        <span className="font-semibold">Total:</span> {totalAmount.toLocaleString()} ETB
      </div>
    )}
  </div>
)}
<div className="mb-6 border rounded p-4 bg-gray-50">
  <label className="block mb-2 font-medium text-[#1c2b21]">Referral Code (Optional)</label>
    <input
      type="text"
    placeholder="Enter referral code (numbers only)"
      value={referralCode}
    onChange={(e) => {
      // Only allow numeric input
      const value = e.target.value.replace(/\D/g, '');
      setReferralCode(value);
    }}
    maxLength={8}
      className="w-full p-3 border border-gray-300 rounded-lg"
    />
  <p className="text-xs text-gray-500 mt-2">If you have a referral code, enter it here. The referrer will be notified when you complete your purchase.</p>
</div>


           <button
  onClick={handlePayAndSend}
  disabled={isHotelRoom && !availabilityVerified && !proceedAnyway}
  className="w-full bg-[#1c2b21] text-white py-2 rounded hover:bg-[#151e18] transition"
>
  Pay&nbsp;&amp;&nbsp;Send Gift
</button>

          </div>
        )
      </div>
  );
};

export default SendGiftForm;






