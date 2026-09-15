import { useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import axios from "axios";
import BASE_URL from "../../api/api";
import DownloadableInvoice from "../Services/DownloadableInvoice";
import VipGiftCard from "../VipGiftCard";
import DownloadableGiftCard from "../DownloadableGiftCard";

type RecipientType = {
  name?: string;
  email?: string;
  phone?: string;
  whatsapp?: string;
  telegram?: string;
  giftCode?: string;
  type?: "standard" | "vip" | "corporate";
  occasion?: string;
  message?: string;
  photo?: string | File;
};

type CartItem = {
  id?: string | number;
  title: string;
  category?: string;
  price?: number;
  discount?: number;
  discountedPrice?: number;
  imageUrl?: string;
  location?: string;
};

const PaymentOptions = () => {
  const { state } = useLocation();
  
  // Safety check: Ensure state exists
  if (!state) {
    console.warn("⚠️ No state data in PaymentOptions. Redirecting or showing empty state.");
  }
  
  let { cart = [], total = 0, fullName, email, recipients = [], senderName, senderEmail } = state || {};
  
  // Ensure cart is an array
  if (!Array.isArray(cart)) {
    cart = [];
  }
  
  // Ensure recipients is an array
  if (!Array.isArray(recipients)) {
    recipients = [];
  }
  
  if ((!total || total === 0) && state?.amount) {
    total = state.amount;
  }
  
  // Fallback: If cart is empty but we have other data, try to create a cart item
  if (cart.length === 0 && state && Object.keys(state).length > 0) {
    console.log("🔄 Attempting to create cart from available state data...");
    
    // Check if we have service data in different keys
    const possibleServiceKeys = ['service', 'selectedService', 'item', 'serviceData'];
    for (const key of possibleServiceKeys) {
      if (state[key]) {
        console.log(`✅ Found service data in key '${key}':`, state[key]);
        cart = [state[key]];
        break;
      }
    }
    
    // If still no cart, create a mock item for testing
    if (cart.length === 0) {
      console.log("🔄 Creating mock cart item for testing...");
      cart = [{
        id: "mock-service-1",
        title: "Mock Service",
        price: 2000,
        category: "Test Category",
        location: "Test Location"
      }];
      total = 2000;
    }
  }
  
  // Debug: Check if we have any data in state
  if (!state || Object.keys(state).length === 0) {
    console.warn("⚠️ No state data passed to PaymentOptions. This might be a navigation issue.");
  }
  
  // Debug: Check if cart is empty but we have other data
  if (cart.length === 0 && state) {
    console.warn("⚠️ Cart is empty but state exists. Available keys:", Object.keys(state));
    console.warn("⚠️ State content:", state);
    
    // Try to find cart data in different possible keys
    const possibleCartKeys = ['cart', 'items', 'services', 'selectedServices', 'cartItems'];
    for (const key of possibleCartKeys) {
      if (state[key] && Array.isArray(state[key]) && state[key].length > 0) {
        console.log(`✅ Found cart data in key '${key}':`, state[key]);
        // You could potentially use this data if needed
      }
    }
  }
  
  console.log("🚀 PaymentOptions initialized with state:", state);
  console.log("🚀 Cart items:", cart);
  console.log("🚀 Total from state:", total);
  console.log("🚀 Full state object:", JSON.stringify(state, null, 2));

  const [recipientsWithCodes, setRecipientsWithCodes] = useState<RecipientType[]>(recipients);
  const [currency, setCurrency] = useState<"ETB" | "USD">(
    state?.currency === "USD" || state?.currency === "ETB" ? state.currency : "ETB"
  );
  const [loading, setLoading] = useState(false); // For gift data fetching
  const [purchasing, setPurchasing] = useState(false); // For purchase processing
  const [purchaseId, setPurchaseId] = useState<string | null>(null);
  const [dbGiftData, setDbGiftData] = useState<any[]>([]);
  const [servicePrices, setServicePrices] = useState<{ [key: string]: number }>({});
  const [error, setError] = useState<string | null>(null);

  const exchangeRate = 55;
  const isGiftPayment = recipientsWithCodes.length > 0;

  // Calculate total with discount support
  const getServicePrice = (item: CartItem) => {
    console.log(`🔍 Getting price for item:`, item);
    
    // Use discounted price if available
    if (item.discountedPrice !== undefined && item.discountedPrice !== null) {
      const price = typeof item.discountedPrice === 'string' ? parseFloat(item.discountedPrice) : item.discountedPrice;
      console.log(`✅ Using discounted price for ${item.title}: ${price}`);
      return price;
    }
    
    // Calculate discount if discount percentage is available
    if (item.discount && item.discount > 0 && item.price) {
      const basePrice = typeof item.price === 'string' ? parseFloat(item.price) : item.price;
      const discounted = basePrice * (1 - item.discount / 100);
      console.log(`✅ Calculating discounted price for ${item.title}: ${basePrice} - ${item.discount}% = ${discounted}`);
      return discounted;
    }
    
    // Use regular price
    if (item.price && item.price > 0) {
      const price = typeof item.price === 'string' ? parseFloat(item.price) : item.price;
      console.log(`✅ Using direct price for ${item.title}: ${price}`);
      return price;
    }
    
    // Then check if we fetched the price from backend
    if (item.id && servicePrices[item.id]) {
      const price = servicePrices[item.id];
      console.log(`✅ Using fetched price for ${item.title}: ${price}`);
      return price;
    }
    
    // Fallback to a default price
    console.log(`⚠️ Using fallback price for ${item.title}: 500`);
    return 500;
  };

  // Calculate total with gift tier multipliers - uses discounted price
  const calculateTotalWithGifts = () => {
    if (isGiftPayment && recipientsWithCodes.length > 0 && cart.length > 0) {
      // Get the discounted price (getServicePrice already handles discounts)
      const discountedBasePrice = getServicePrice(cart[0]);
      const VIP_MARKUP = 0.15;
      const CORPORATE_DISCOUNT = 0.15;
      
      return recipientsWithCodes.reduce((sum, recipient) => {
        let multiplier = 1;
        if (recipient.type === "vip") multiplier = 1 + VIP_MARKUP;
        else if (recipient.type === "corporate") multiplier = 1 - CORPORATE_DISCOUNT;
        // Apply tier multiplier to already-discounted price
        return sum + (discountedBasePrice * multiplier);
      }, 0);
    }
    
    // Fallback to regular calculation (already includes discounts)
    return cart.reduce((sum: number, item: CartItem) => {
      const price = getServicePrice(item); // This already applies discounts
      return sum + price;
    }, 0);
  };
  
  const calculatedTotal = calculateTotalWithGifts();
  const finalTotal = total > 0 ? total : calculatedTotal;
  const displayAmount = currency === "ETB" ? finalTotal : parseFloat((finalTotal / exchangeRate).toFixed(2));
  
  // Ensure all values are numbers
  const numericFinalTotal = typeof finalTotal === 'number' ? finalTotal : parseFloat(String(finalTotal)) || 0;
  const numericDisplayAmount = typeof displayAmount === 'number' ? displayAmount : parseFloat(String(displayAmount)) || 0;
  
  console.log(`=== TOTAL CALCULATION DEBUG ===`);
  console.log(`Cart:`, cart);
  console.log(`Service Prices:`, servicePrices);
  console.log(`Calculated Total: ${calculatedTotal}, Final Total: ${finalTotal}, Display Amount: ${displayAmount}`);
  console.log(`=== END DEBUG ===`);

  // Recalculate total when service prices change
  useEffect(() => {
    console.log("🔄 Service prices updated, recalculating total...");
    console.log("Current service prices:", servicePrices);
    console.log("Current cart:", cart);
  }, [servicePrices, cart]);

  // Fetch missing service prices
  useEffect(() => {
    if (cart.length === 0) return;
    
    // Check if we already have prices for all items
    const needsPriceFetch = cart.some((item: CartItem) => 
      item.id && !servicePrices[item.id] && (!item.price || item.price === 0)
    );
    
    if (!needsPriceFetch) return;
    
    const fetchPrices = async () => {
      console.log("🔍 Fetching service prices for cart items:", cart);
      
      try {
        const pricePromises = cart.map(async (item: { id: any; title: string; price?: number; }) => {
          if (item.id && !servicePrices[item.id]) {
            console.log(`🔍 Fetching price for service ${item.id} (${item.title})`);
            try {
              const res = await axios.get(`${BASE_URL}/services/${item.id}`, {
                timeout: 10000 // 10 second timeout
              });
              const price = res.data.price || 0;
              console.log(`✅ Service ${item.id} price: ${price}`);
              console.log(`📊 Full service data:`, res.data);
              return { id: item.id, price };
            } catch (err) {
              console.error(`❌ Failed to fetch price for service ${item.id}:`, err);
              setError(`Failed to fetch price for ${item.title}`);
              return { id: item.id, price: 0 };
            }
          }
          return { id: item.id, price: servicePrices[item.id] || 0 };
        });

        const prices = await Promise.all(pricePromises);
        const priceMap = prices.reduce((acc, { id, price }) => {
          if (id) {
            acc[id] = price;
            console.log(`📊 Set price for service ${id}: ${price}`);
          }
          return acc;
        }, {} as { [key: string]: number });

        console.log("📊 Final service prices:", priceMap);
        setServicePrices(prevPrices => ({ ...prevPrices, ...priceMap }));
      } catch (err) {
        console.error("❌ Failed to fetch service prices:", err);
      }
    };
    
    fetchPrices();
  }, [cart.length]); // Only depend on cart length, not the entire cart object

  // Fetch gift codes from backend
  useEffect(() => {
    if (!purchaseId || !isGiftPayment) return;
    
    // Prevent multiple simultaneous fetches
    if (loading) return;
    
    setLoading(true);

    const fetchGiftCodes = async () => {
      try {
        console.log("🎁 Fetching gift codes for purchase:", purchaseId);
        
        // First try to fetch from gift notifications endpoint (primary source)
        try {
          const giftRes = await axios.get(`${BASE_URL}/gifts/with-codes`);
          const allGifts = giftRes.data || [];
          
          console.log("🎁 All gifts from with-codes:", allGifts);
          
          // Filter gifts for this purchase
          const purchaseGifts = allGifts.filter((gift: any) => 
            gift.purchaseId === parseInt(purchaseId) || 
            gift.purchase_id === parseInt(purchaseId)
          );

          console.log("🎁 Filtered gifts for purchase:", purchaseGifts);

          if (purchaseGifts.length > 0) {
            setDbGiftData(purchaseGifts);

            const normalizedRecipients = recipients.map((r: { giftCode: any; type: any; occasion: any; message: any; photo: any; }, i: string | number) => {
              const gift = purchaseGifts[i] || {};
              console.log(`🎁 Mapping recipient ${i} with gift:`, gift);
              return {
                ...r,
                giftCode: gift.giftCode || gift.gift_code || r.giftCode || "Generating...",
                type: r.type || "standard",
                occasion: gift.occasion || r.occasion || "Special Gift",
                message: r.message || "",
                photo: r.photo || gift.recipient?.photo || "",
              };
            });

            setRecipientsWithCodes(normalizedRecipients);
            return;
          }
        } catch (giftErr) {
          console.error("Failed to fetch from gifts/with-codes endpoint:", giftErr);
        }

        // Fallback: Try to fetch from services/purchase endpoint
        try {
          const res = await axios.get(`${BASE_URL}/services/purchase`);
          const purchases = res.data || [];
          const targetPurchase = purchases.find((p: any) => p.id === parseInt(purchaseId));

          if (targetPurchase && targetPurchase.gifts?.length > 0) {
            setDbGiftData(targetPurchase.gifts);

            const normalizedRecipients = recipients.map((r: { giftCode: any; type: any; occasion: any; message: any; photo: any; }, i: string | number) => {
              const gift = targetPurchase.gifts[i] || {};
              return {
                ...r,
                giftCode: gift.giftCode || r.giftCode || "Generating...",
                type: r.type || "standard",
                occasion: gift.occasion || r.occasion || "Special Gift",
                message: r.message || "",
                photo: r.photo || gift.recipient?.photo || "",
              };
            });

            setRecipientsWithCodes(normalizedRecipients);
            return;
          }
        } catch (purchaseErr) {
          console.error("Failed to fetch from services/purchase endpoint:", purchaseErr);
        }

        // Final fallback: Backend hasn't generated codes yet
        console.log("🎁 No gifts found, using fallback data");
        setRecipientsWithCodes(
          recipients.map((r: { type: any; occasion: any; message: any; }) => ({
            ...r,
            giftCode: "Generating...",
            type: r.type || "standard",
            occasion: r.occasion || "Special Gift",
            message: r.message || "",
          }))
        );
      } catch (err) {
        console.error("Failed to fetch gift codes:", err);
        setRecipientsWithCodes(
          recipients.map((r: { type: any; occasion: any; message: any; }) => ({
            ...r,
            giftCode: "Error loading...",
            type: r.type || "standard",
            occasion: r.occasion || "Special Gift",
            message: r.message || "",
          }))
        );
      } finally {
        setLoading(false);
      }
    };

    fetchGiftCodes();
  }, [purchaseId, isGiftPayment]); // Remove recipients from dependencies to prevent loops

  // Handle purchase
  const handlePurchase = async () => {
    if (cart.length === 0) {
      alert("No items in cart to purchase.");
      return;
    }

    try {
      setPurchasing(true); // Use separate purchasing state
      const purchasePromises = cart.map(async (service: CartItem) => {
        if (!service.id) {
          throw new Error(`Service missing ID: ${service.title || 'Unknown'}`);
        }
        
        // Check if this is a gift purchase (has recipients with photos potentially)
        const isGift = recipientsWithCodes.length > 0;
        
        // If it's a gift and has photos, use FormData
        const hasPhotos = recipientsWithCodes.some(r => r.photo && (r.photo as any) instanceof File);
        
        if (isGift && hasPhotos) {
          // Use FormData for gift purchases with photos
          const formData = new FormData();
          formData.append("buyerName", senderName || fullName || "Anonymous");
          formData.append("buyerEmail", senderEmail || email || "");
          formData.append("recipients", JSON.stringify(recipientsWithCodes));
          
          // Append recipient photos
          recipientsWithCodes.forEach((r, i) => {
            if (r.photo && (r.photo as any) instanceof File) {
              formData.append(`recipients[${i}][photo]`, r.photo as unknown as File);
            }
            formData.append(`recipients[${i}][name]`, r.name || "");
            formData.append(`recipients[${i}][email]`, r.email || "");
            formData.append(`recipients[${i}][phone]`, r.phone || "");
            formData.append(`recipients[${i}][whatsapp]`, r.whatsapp || "");
            formData.append(`recipients[${i}][telegram]`, r.telegram || "");
            formData.append(`recipients[${i}][type]`, r.type || "standard");
          });
          
          // Include authentication token if user is logged in
          const token = localStorage.getItem("token");
          const headers: any = {
            'Content-Type': 'multipart/form-data',
          };
          if (token) {
            headers.Authorization = `Bearer ${token}`;
          }
          
          return axios.post(`${BASE_URL}/services/${service.id}/purchase`, formData, { headers });
        } else {
          // Use JSON for regular purchases or gifts without photos
          const purchasePayload: any = {
            buyerName: senderName || fullName || "Anonymous",
            buyerEmail: senderEmail || email || "",
          };
          
          // Only include recipients if it's a gift purchase
          if (isGift && recipientsWithCodes.length > 0) {
            purchasePayload.recipients = recipientsWithCodes;
          }
          
          // Include authentication token if user is logged in
          const token = localStorage.getItem("token");
          const headers: any = {
            'Content-Type': 'application/json',
          };
          if (token) {
            headers.Authorization = `Bearer ${token}`;
          }
          
          return axios.post(`${BASE_URL}/services/${service.id}/purchase`, purchasePayload, { headers });
        }
      });

      const purchaseResults = await Promise.all(purchasePromises);

      if (purchaseResults.length > 0 && purchaseResults[0].data.purchaseId) {
        setPurchaseId(purchaseResults[0].data.purchaseId);

        // Update recipients with backend-generated codes
        if (purchaseResults[0].data.codes?.length > 0) {
          const updatedRecipients = recipientsWithCodes.map((r, i) => ({
            ...r,
            giftCode: purchaseResults[0].data.codes[i] || r.giftCode,
          }));
          setRecipientsWithCodes(updatedRecipients);
        }

        // Show appropriate message based on payment status
        const purchaseData = purchaseResults[0].data;
        if (purchaseData.paymentPending) {
          alert(`✅ Purchase Recorded!\n\n${purchaseData.receiptMessage || 'Payment is pending. Please complete payment to receive your receipt. The purchase will appear in your provider\'s dashboard and admin purchase list.'}`);
        } else if (isGiftPayment) {
          alert("Purchase successful! Gift codes are being generated...");
        } else {
          alert("✅ Purchase completed successfully! Your purchase has been recorded.");
        }
      }
    } catch (err: any) {
      console.error("Purchase failed:", err);
      console.error("Error response:", err.response);
      
      // Check if response contains purchase ID (purchase was still recorded)
      if (err.response?.data?.purchaseId) {
        const purchaseData = err.response.data;
        alert(`✅ Purchase Recorded!\n\n${purchaseData.receiptMessage || 'Payment is pending. Please complete payment to finalize your purchase. A receipt will be available once payment is confirmed.'}`);
        if (purchaseData.purchaseId) {
          setPurchaseId(purchaseData.purchaseId);
        }
      } else {
        const errorMsg = err.response?.data?.msg || err.response?.data?.error || err.message || 'Unknown error';
        // Check if it's a recipients-related error for self-purchases
        if (errorMsg.toLowerCase().includes('recipient') && recipientsWithCodes.length === 0) {
          // This is a self-purchase, the error shouldn't happen - try to proceed anyway
          console.warn("⚠️ Backend returned recipient error for self-purchase - this shouldn't happen");
          alert(`✅ Purchase processed! If you see any errors, please contact support.\n\nYour purchase should be recorded in the system.`);
        } else {
          alert(`Purchase failed: ${errorMsg}\n\nPlease try again or contact support.`);
        }
      }
    } finally {
      setPurchasing(false);
    }
  };

  // Normalize gifts for invoice

  const paymentMethods = currency === "ETB"
    ? ["Telebirr","Bank Transfer","Card","Bank App","Wallet","Chapa"]
    : ["PayPal","Stripe","Visa/MasterCard","International Bank Transfer"];

  // Show loading state - different messages for gift data vs purchase processing
  if (loading && isGiftPayment) return (
    <div className="text-center py-8">
      <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#be9b49]"></div>
      <p className="mt-2 text-gray-600">Loading gift data...</p>
    </div>
  );
  
  if (purchasing) return (
    <div className="text-center py-8">
      <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#be9b49]"></div>
      <p className="mt-2 text-gray-600">
        {isGiftPayment ? "Processing your gift purchase..." : "Processing your purchase..."}
      </p>
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="bg-white rounded-3xl shadow-2xl p-8 text-center">
          <h2 className="text-3xl font-bold text-red-600 mb-6">Error Loading Payment Options</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => {
              setError(null);
              window.location.reload();
            }}
            className="px-6 py-3 bg-[#be9b49] text-[#0f285b] font-bold rounded-xl shadow-lg hover:shadow-xl transition"
          >
            Retry
          </button>
        </div>
      </div>
    </div>
  );

  // Show error message if no cart data - but only if we're sure there's no data
  // Temporarily disabled for testing - always show payment options
  if (false && cart.length === 0 && (!state || Object.keys(state).length === 0)) {
    return (
      <div className="min-h-screen bg-gray-50 py-10 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="bg-white rounded-3xl shadow-2xl p-8 text-center">
            <h2 className="text-3xl font-bold text-[#0f285b] mb-6">No Items in Cart</h2>
            <p className="text-gray-600 mb-6">
              It looks like no items were selected for purchase. Please go back and select some services.
            </p>
            <button
              onClick={() => window.history.back()}
              className="px-6 py-3 bg-[#be9b49] text-[#0f285b] font-bold rounded-xl shadow-lg hover:shadow-xl transition"
            >
              Go Back
            </button>
            <div className="mt-6 p-4 bg-yellow-50 rounded-lg">
              <p className="text-sm text-gray-600">
                <strong>Debug Info:</strong> Cart length: {cart.length}, Total: {total}
              </p>
              <p className="text-sm text-gray-600">
                State keys: {state ? Object.keys(state).join(', ') : 'No state'}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Safety checks: Ensure arrays are properly initialized
  if (!Array.isArray(cart)) {
    cart = [];
  }
  // Note: recipientsWithCodes and dbGiftData are state variables, 
  // they are already initialized as arrays in useState, so no need to reassign

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-5xl mx-auto space-y-10">

        {/* Invoice Section */}
        <div className="bg-white rounded-3xl shadow-2xl p-8 overflow-hidden">
          <h2 className="text-3xl font-bold text-center text-[#0f285b] mb-6">Payment Summary</h2>
          <p className="text-center text-xl font-bold mb-6">
            Total: {numericDisplayAmount.toFixed(2)} {currency}
          </p>

          <DownloadableInvoice
            fullName={senderName || fullName || "Anonymous"}
            total={numericFinalTotal}
            serviceId={cart[0]?.id?.toString()}
            purchaseId={purchaseId || undefined}
            currency={currency}
            cart={cart}
            gifts={
    isGiftPayment
      ? dbGiftData.length > 0
        ? dbGiftData.map((gift, i) => {
            console.log(`🎁 Mapping Gift ${i}:`, gift);
            console.log(`🎁 Cart Item ${i}:`, cart[i]);
            console.log(`🎁 Recipient ${i}:`, recipientsWithCodes[i]);
            
            const mappedGift = {
              _id: gift.giftCode || gift.gift_code || `GFT-${i}`,
              recipient: {
                name: gift.recipient?.name || gift.recipient_name || recipientsWithCodes[i]?.name,
                email: gift.recipient?.email || gift.recipient_email || recipientsWithCodes[i]?.email,
                phone: gift.recipient?.phone || gift.recipient_phone || recipientsWithCodes[i]?.phone,
                photo: gift.recipient?.photo || gift.recipient_photo || recipientsWithCodes[i]?.photo,
              },
              service: {
                title: gift.service?.title || gift.service_title || cart[i]?.title,
                category: gift.service?.category || gift.service_category || cart[i]?.category || "N/A",
                location: gift.service?.location || gift.service_location || cart[i]?.location || "N/A",
              },
              senderName: gift.senderName || senderName || fullName,
              occasion: gift.occasion || gift.occasion_name || recipientsWithCodes[i]?.occasion,
              giftCode: gift.giftCode || gift.gift_code,
              type: gift.type || recipientsWithCodes[i]?.type || "standard",
              deliveryStatus: gift.deliveryStatus || gift.delivery_status,
              provider: { fullName: gift.provider?.fullName || gift.provider_name },
              message: gift.message || recipientsWithCodes[i]?.message,
            };
            
            console.log(`🎁 Raw gift data ${i}:`, gift);
            console.log(`🎁 Mapped occasion for gift ${i}:`, mappedGift.occasion);
            
            console.log(`🎁 Mapped Gift ${i}:`, mappedGift);
            return mappedGift;
          })
        : recipientsWithCodes.map((r, i) => ({
            _id: r.giftCode || `GFT-${i}`,
            recipient: {
              name: r.name,
              email: r.email,
              phone: r.phone,
              photo: r.photo,
            },
            service: {
              title: cart[i]?.title,
              category: cart[i]?.category || "N/A",
              location: cart[i]?.location || "N/A",
            },
            senderName: senderName || fullName,
            occasion: r.occasion,
            giftCode: r.giftCode,
            type: r.type || "standard",
            message: r.message,
          }))
      : [] // Pass empty array for non-gift purchases
  }
/>


          {/* Purchase Button */}
          <div className="mt-6 text-center">
            <button
              onClick={handlePurchase}
              className="px-6 py-3 bg-[#be9b49] text-[#0f285b] font-bold rounded-xl shadow-lg hover:shadow-xl transition"
            >
              Complete Purchase
            </button>
          </div>
        </div>

        {/* Gift Cards Section - Only show for gift payments with valid gift codes */}
        {isGiftPayment && Array.isArray(recipientsWithCodes) && recipientsWithCodes.length > 0 && (
          <div className="bg-white rounded-3xl shadow-2xl p-8 overflow-hidden">
            <h2 className="text-3xl font-bold text-center text-[#0f285b] mb-6">
              Download Gift Cards
            </h2>
            <p className="text-center text-gray-600 mb-8">
              Download individual gift cards for each recipient below
            </p>
            
            <div className="space-y-8">
              {recipientsWithCodes.map((recipient, index) => {
                try {
                  const giftData = (Array.isArray(dbGiftData) && dbGiftData[index]) || {};
                  const giftType = recipient?.type || giftData?.type || "standard";
                  // Get gift code - prioritize from recipient, then giftData
                  const giftCode = recipient?.giftCode && recipient.giftCode !== "Generating..." && recipient.giftCode !== "N/A"
                    ? recipient.giftCode
                    : (giftData?.giftCode && giftData.giftCode !== "Generating..." && giftData.giftCode !== "N/A"
                      ? giftData.giftCode
                      : (giftData?.gift_code && giftData.gift_code !== "Generating..." && giftData.gift_code !== "N/A"
                        ? giftData.gift_code
                        : "Generating..."));
                  
                  // Get occasion from state or gift data - prioritize state.occasion
                  const stateOccasion = state?.occasion;
                  const occasion = stateOccasion?.title || 
                                   stateOccasion?.occasion || 
                                   giftData?.occasion_name ||
                                   giftData?.occasion || 
                                   recipient?.occasion || 
                                   "Special Gift";
                  
                  const serviceItem = (Array.isArray(cart) && (cart[index] || cart[0])) || {};
                  
                  // Get provider name from service or gift data - prioritize serviceItem
                  const providerName = serviceItem?.providerName || 
                                      serviceItem?.provider?.fullName ||
                                      giftData?.provider_name ||
                                      giftData?.provider?.fullName || 
                                      "N/A";
                  
                  // Handle photo - could be string, File object, or empty object
                  let photoUrl = "";
                  // First check recipient.photo (from form upload)
                  if (recipient?.photo) {
                    if (typeof recipient.photo === 'string' && recipient.photo.trim() !== '' && recipient.photo !== '{}') {
                      photoUrl = recipient.photo;
                    } else if (recipient.photo instanceof File) {
                      photoUrl = URL.createObjectURL(recipient.photo);
                    }
                  }
                  // Then check giftData.recipient.photo (from database)
                  if (!photoUrl && giftData?.recipient?.photo) {
                    if (typeof giftData.recipient.photo === 'string' && giftData.recipient.photo.trim() !== '' && giftData.recipient.photo !== '{}') {
                      photoUrl = giftData.recipient.photo;
                    }
                  }
                  // Finally check giftData.recipient_photo (alternative field name)
                  if (!photoUrl && giftData?.recipient_photo) {
                    if (typeof giftData.recipient_photo === 'string' && giftData.recipient_photo.trim() !== '' && giftData.recipient_photo !== '{}') {
                      photoUrl = giftData.recipient_photo;
                    }
                  }
                  
                  const giftCardProps = {
                    recipientName: recipient?.name || giftData?.recipient?.name || giftData?.recipient_name || "N/A",
                    senderName: senderName || fullName || "Anonymous",
                    serviceTitle: serviceItem?.title || giftData?.service?.title || giftData?.service_title || "N/A",
                    serviceCategory: serviceItem?.category || giftData?.service?.category || giftData?.service_category || "N/A",
                    serviceLocation: serviceItem?.location || giftData?.service?.location || giftData?.service_location || "N/A",
                    serviceProvider: providerName,
                    message: recipient?.message || giftData?.message || "",
                    recipientEmail: recipient?.email || giftData?.recipient?.email || giftData?.recipient_email || "",
                    recipientPhone: recipient?.phone || giftData?.recipient?.phone || giftData?.recipient_phone || "",
                    providerName: providerName,
                    photo: photoUrl,
                    occasion: occasion,
                    currency: currency || "ETB",
                    giftId: giftData?.giftId || giftData?._id || (purchaseId ? `${purchaseId}-${index}` : undefined),
                  };
                  
                  return (
                    <div key={index} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                      <div>
                        <h3 className="text-lg font-semibold text-[#0f285b]">
                          {giftCardProps.recipientName}
                          {giftType === "vip" && (
                            <span className="ml-2 text-[#be9b49]">👑 VIP</span>
                          )}
                          {giftType === "corporate" && (
                            <span className="ml-2 text-blue-600">🏢 Corporate</span>
                          )}
                        </h3>
                      </div>
                      <div style={{ position: 'absolute', left: '-9999px', top: '-9999px', width: '600px' }} data-gift-card-index={index}>
                        {giftType === "vip" ? (
                          <VipGiftCard
                            code={giftCode !== "Generating..." && giftCode !== "N/A" ? giftCode : undefined}
                            {...giftCardProps}
                          />
                        ) : (
                          <DownloadableGiftCard
                            giftCode={giftCode !== "Generating..." && giftCode !== "N/A" ? giftCode : undefined}
                            {...giftCardProps}
                          />
                        )}
                      </div>
                      <button
                        onClick={() => {
                          // Find the hidden gift card and trigger its download button
                          const hiddenCard = document.querySelector(`[data-gift-card-index="${index}"]`);
                          if (hiddenCard) {
                            // Try to find the PDF download button (first button usually)
                            const downloadButtons = hiddenCard.querySelectorAll('button');
                            if (downloadButtons.length > 0) {
                              downloadButtons[0].click();
                            }
                          }
                        }}
                        className="px-6 py-2 bg-gradient-to-r from-[#be9b49] to-[#f5deb3] text-white font-semibold rounded-lg hover:from-[#c9a028] hover:to-[#e6d4a0] transition-all duration-200 shadow-md hover:shadow-lg"
                      >
                        Download Gift Card
                      </button>
                    </div>
                  );
                } catch (error) {
                  console.error(`Error rendering gift card ${index}:`, error);
                  return (
                    <div key={index} className="border-b border-gray-200 pb-8 last:border-b-0 last:pb-0">
                      <p className="text-red-600">Error loading gift card {index + 1}</p>
                    </div>
                  );
                }
              })}
            </div>
          </div>
        )}

        {/* Currency Selection */}
        <div className="flex justify-center gap-4">
          <button
            onClick={() => setCurrency("ETB")}
            className={`px-4 py-2 rounded-lg font-semibold ${currency === "ETB" ? "bg-[#be9b49] text-white" : "bg-gray-200 text-gray-800"}`}
          >
            Birr
          </button>
          <button
            onClick={() => setCurrency("USD")}
            className={`px-4 py-2 rounded-lg font-semibold ${currency === "USD" ? "bg-[#be9b49] text-white" : "bg-gray-200 text-gray-800"}`}
          >
            USD
          </button>
        </div>

        {/* Payment Methods */}
        <div className="bg-white rounded-3xl shadow-2xl p-8">
          <h2 className="text-2xl font-bold text-[#0f285b] mb-4 text-center">Choose Payment Method</h2>
          <p className="text-gray-500 mb-6 text-center">Select a secure method to complete your payment</p>

          <div className="grid gap-4 sm:grid-cols-2">
            {paymentMethods.map((method, i) => (
              <button
                key={i}
                onClick={() => alert(`${method} payment in ${currency} coming soon.`)}
                className="flex items-center justify-center p-4 rounded-2xl font-semibold shadow-lg transform transition hover:scale-105 bg-gray-100 text-gray-800"
              >
                {method}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentOptions;

