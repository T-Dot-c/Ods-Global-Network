import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import BASE_URL from "../../api/api";

interface CartItem {
  title: string;
  category?: string;
  description?: string;
  price?: number;
  discount?: number;
  discountedPrice?: number;
  imageUrl?: string;
}

const CartPage = () => {
  const navigate = useNavigate();

  const [cart, setCart] = useState<CartItem[]>([]);
  const [total, setTotal] = useState(0);

  const [buyerId, setBuyerId] = useState<number | null>(null);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  const [guestPhone, setGuestPhone] = useState("");
  const [guestAddress, setGuestAddress] = useState("");

  useEffect(() => {
    const storedCart = JSON.parse(localStorage.getItem("cart") || "[]");
    const storedUser = JSON.parse(localStorage.getItem("user") || "{}");

    setCart(storedCart);
    setTotal(
      storedCart.reduce((sum: number, item: CartItem) => {
        try {
          const basePrice = Number(item.price) || 0;
          let effectivePrice = basePrice;
          
          if (item.discountedPrice !== undefined && item.discountedPrice !== null) {
            effectivePrice = Number(item.discountedPrice) || basePrice;
          } else if (item.discount && item.discount > 0 && basePrice > 0) {
            effectivePrice = basePrice * (1 - Number(item.discount) / 100);
          }
          
          return sum + effectivePrice;
        } catch (error) {
          console.error('Error calculating item price:', error, item);
          return sum + (Number(item.price) || 0);
        }
      }, 0)
    );

    if (storedUser?.id) {
      setBuyerId(storedUser.id);
      setFullName(storedUser.fullName || "");
      setEmail(storedUser.email || "");
      setPhone(storedUser.phone || "");
    }
  }, []);

  const removeFromCart = (index: number) => {
    const updatedCart = [...cart];
    updatedCart.splice(index, 1);
    setCart(updatedCart);
    setTotal(
      updatedCart.reduce((sum: number, item: CartItem) => {
        try {
          const basePrice = Number(item.price) || 0;
          let effectivePrice = basePrice;
          
          if (item.discountedPrice !== undefined && item.discountedPrice !== null) {
            effectivePrice = Number(item.discountedPrice) || basePrice;
          } else if (item.discount && item.discount > 0 && basePrice > 0) {
            effectivePrice = basePrice * (1 - Number(item.discount) / 100);
          }
          
          return sum + effectivePrice;
        } catch (error) {
          console.error('Error calculating item price:', error, item);
          return sum + (Number(item.price) || 0);
        }
      }, 0)
    );
    localStorage.setItem("cart", JSON.stringify(updatedCart));
  };

  const handleConfirmPayment = () => {
    const firstName = fullName?.split(" ")[0] || "Gift";
    const lastName = fullName?.split(" ")[1] || "Receiver";

    navigate("/payment-options", {
      state: {
        cart,
        total,
        email,
        fullName,
        firstName,
        lastName,
        phone: buyerId ? phone : guestPhone,
        address: buyerId ? undefined : guestAddress,
        buyerId,
      },
    });
  };

  return (
    <div className="container mx-auto px-4 py-10">
      <h1 className="text-4xl font-bold mb-6 text-center text-[#2E2E2E] tracking-wide">
        Your Cart
      </h1>

      {/* User Details */}
      <div className="flex justify-end mb-8">
        {buyerId ? (
          <div className="text-sm text-gray-700 bg-gray-50 p-4 rounded-lg shadow-md border border-gray-200">
            <p><span className="font-medium">Name:</span> {fullName}</p>
            <p><span className="font-medium">Email:</span> {email}</p>
            <p><span className="font-medium">Phone:</span> {phone}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full md:w-2/3 lg:w-1/2 bg-gray-50 p-5 rounded-lg shadow-md border border-gray-200 text-sm">
            <input
              type="text"
              placeholder="Your Full Name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="px-3 py-2 border rounded-md focus:ring-2 focus:ring-[#be9b49] focus:outline-none"
              required
            />
            <input
              type="email"
              placeholder="Your Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="px-3 py-2 border rounded-md focus:ring-2 focus:ring-[#be9b49] focus:outline-none"
              required
            />
            <input
              type="tel"
              placeholder="Your Phone"
              value={guestPhone}
              onChange={(e) => setGuestPhone(e.target.value)}
              className="px-3 py-2 border rounded-md focus:ring-2 focus:ring-[#be9b49] focus:outline-none"
              required
            />
            <textarea
              placeholder="Your Address"
              rows={2}
              value={guestAddress}
              onChange={(e) => setGuestAddress(e.target.value)}
              className="px-3 py-2 border rounded-md focus:ring-2 focus:ring-[#be9b49] focus:outline-none md:col-span-2"
              required
            />
          </div>
        )}
      </div>

      {/* Cart Items */}
      {cart.length === 0 ? (
        <p className="text-center text-gray-500 text-lg">Your cart is empty</p>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-5">
            {cart.map((item, index) => (
              <div
                key={index}
                className="border rounded-lg shadow-sm bg-white hover:shadow-md transition flex flex-col"
              >
                <img
                  src={(() => {
                    if (!item.imageUrl) return "/placeholder.png";
                    
                    // If already a full URL, normalize it
                    if (item.imageUrl.startsWith('http')) {
                      if (item.imageUrl.includes('odsglobal.net') && !item.imageUrl.includes('www.odsglobal.net')) {
                        return item.imageUrl.replace(/https?:\/\/(?:www\.)?wanaw\.et/g, 'https://www.odsglobal.net');
                      }
                      return item.imageUrl;
                    }
                    
                    // For relative paths, construct full URL
                    let serverBase;
                    if (BASE_URL.startsWith('http')) {
                      // Production: BASE_URL is full URL like "https://www.odsglobal.net/api"
                      serverBase = BASE_URL.replace('/api', '').replace(/\/$/, '');
                    } else {
                      // Development: BASE_URL is "/api", use localhost server directly
                      serverBase = 'http://localhost:5000';
                    }
                    
                    const imagePath = item.imageUrl.startsWith('/') ? item.imageUrl : `/${item.imageUrl}`;
                    return `${serverBase}${imagePath}`;
                  })()}
                  alt={item.title}
                  className="w-full h-36 object-cover rounded-t-lg"
                  onError={(e) => {
                    // Fallback error handling
                    const img = e.target as HTMLImageElement;
                    console.error('Cart image load error:', img.src);
                    
                    if (item.imageUrl) {
                      // Try normalizing wanaw.et URLs
                      if (img.src.includes('odsglobal.net') && !img.src.includes('www.odsglobal.net')) {
                        img.src = img.src.replace(/https?:\/\/(?:www\.)?wanaw\.et/g, 'https://www.odsglobal.net');
                        return;
                      }
                      
                      // Try constructing from original item.imageUrl
                      if (!item.imageUrl.startsWith('http')) {
                        let serverBase;
                        if (BASE_URL.startsWith('http')) {
                          serverBase = BASE_URL.replace('/api', '').replace(/\/$/, '');
                        } else {
                          serverBase = 'http://localhost:5000';
                        }
                        const imagePath = item.imageUrl.startsWith('/') ? item.imageUrl : `/${item.imageUrl}`;
                        img.src = `${serverBase}${imagePath}`;
                      } else {
                        img.src = "/placeholder.png";
                      }
                    } else {
                      img.src = "/placeholder.png";
                    }
                  }}
                />
                <div className="p-3 flex flex-col flex-grow">
                  <h2 className="text-base font-semibold text-gray-800 leading-tight">
                    {item.title}
                  </h2>
                  <p className="text-xs text-gray-500">{item.category}</p>
                  <p className="text-sm text-gray-600 line-clamp-2 flex-grow mt-1">
                    {item.description}
                  </p>
                  <div className="text-base font-bold mt-2 text-[#2E2E2E]">
                    {(() => {
                      try {
                        const basePrice = Number(item.price) || 0;
                        let effectivePrice = basePrice;
                        
                        // Check for discounted price first
                        if (item.discountedPrice !== undefined && item.discountedPrice !== null) {
                          effectivePrice = Number(item.discountedPrice) || basePrice;
                        } 
                        // Calculate discount if discount percentage exists
                        else if (item.discount && item.discount > 0 && basePrice > 0) {
                          effectivePrice = basePrice * (1 - Number(item.discount) / 100);
                        }
                        
                        // If there's a discount, show both prices
                        if (item.discount && item.discount > 0 && basePrice > 0 && effectivePrice < basePrice) {
                          return (
                            <div>
                              <p className="text-sm text-gray-400 line-through">
                                ETB {basePrice.toFixed(2)}
                              </p>
                              <p className="text-[#2E2E2E]">
                                ETB {effectivePrice.toFixed(2)}
                                <span className="ml-2 text-xs bg-red-500 text-white px-2 py-0.5 rounded">
                                  {Number(item.discount)}% OFF
                                </span>
                              </p>
                            </div>
                          );
                        }
                        // Otherwise show just the effective price
                        return <p>ETB {effectivePrice.toFixed(2)}</p>;
                      } catch (error) {
                        console.error('Error calculating price:', error, item);
                        const fallbackPrice = Number(item.price) || 0;
                        return <p>ETB {fallbackPrice.toFixed(2)}</p>;
                      }
                    })()}
                  </div>
                  <button
                    onClick={() => removeFromCart(index)}
                    className="mt-2 text-red-500 text-xs font-medium hover:underline self-start"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="mt-10 flex flex-col md:flex-row justify-center items-center gap-6">
            <p className="text-lg font-semibold text-gray-800">
              Total:{" "}
              <span className="text-[#be9b49]">
                ETB {Number(total || 0).toFixed(2)}
              </span>
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => navigate("/services")}
                className="px-6 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium border border-gray-300 transition"
              >
                Add More Service
              </button>
              <button
                onClick={handleConfirmPayment}
                className="px-8 py-3 bg-[#be9b49] hover:bg-[#b8962f] text-white rounded-lg font-semibold text-lg transition-colors duration-300 shadow-md"
              >
                Proceed to Payment
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default CartPage;

