import { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import BASE_URL from "../api/api";

/* ─── Types ─────────────────────────────────────────── */
type Occasion = {
  _id: string;
  title: string;
  category: string;
  occasion?: string;
  description?: string;
  imageUrl?: string;
};

type Service = {
  id: string | number 
  _id: string;
  title: string;
  price?: number;
  description?: string;
  location?: string;
  imageUrl?: string;
};

/* ─── Component ─────────────────────────────────────── */
const GiftDetails = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  const [occasion, setOccasion] = useState<Occasion | null | undefined>(undefined);
  const [services, setServices] = useState<Service[]>([]);
  const [selectedServiceId, setSelectedServiceId] = useState<string>("");
  const [userSelectedCategory, setUserSelectedCategory] = useState<string | null>(null);

  const slugify = (text: string) =>
    text.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

  // Helper function to construct proper image URLs
  const getImageUrl = (imageUrl: string) => {
    if (!imageUrl || imageUrl.trim() === '') {
      return '';
    }
    
    // If already a full URL, normalize it
    if (imageUrl.startsWith('http')) {
      // Fix URLs that have /api/uploads/ instead of /uploads/
      if (imageUrl.includes('/api/uploads/')) {
        imageUrl = imageUrl.replace('/api/uploads/', '/uploads/');
      }
      // Normalize wanaw.et to www.wanaw.et
      if (imageUrl.includes('wanaw.et') && !imageUrl.includes('www.wanaw.et')) {
        imageUrl = imageUrl.replace(/https?:\/\/(?:www\.)?wanaw\.et/g, 'https://www.wanaw.et');
      }
      return imageUrl;
    }
    
    // For relative paths, construct the full URL
    let serverBase;
    if (BASE_URL.startsWith('http')) {
      // Production: BASE_URL is full URL like "https://wanaw.et/api"
      serverBase = BASE_URL.replace('/api', '').replace(/\/$/, '');
    } else {
      // Development: BASE_URL is "/api", use localhost server directly
      serverBase = 'http://localhost:5000';
    }
    
    const imagePath = imageUrl.startsWith('/') ? imageUrl : `/${imageUrl}`;
    return `${serverBase}${imagePath}`;
  };

  // Read category from URL params on mount
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const category = params.get("category");
    if (category === "corporate" || category === "individual" || category === "diaspora") {
      setUserSelectedCategory(category);
    }
  }, [location.search]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const ocRes = await fetch(`${BASE_URL}/gifts`);
        const occasions: Occasion[] = await ocRes.json();
        const matched = occasions.find((o) => slugify(o.title) === slug);

        if (!matched) {
          setOccasion(null);
          return;
        }

        // Use user-selected category if available, otherwise use the gift's category from API
        const finalCategory = userSelectedCategory || matched.category || "N/A";
        const occasionWithCategory = {
          ...matched,
          category: finalCategory
        };

        setOccasion(occasionWithCategory);

        const srvRes = await fetch(`${BASE_URL}/services?occasionId=${matched._id}`);
        const srvData: Service[] = await srvRes.json();
        setServices(srvData);
      } catch (err) {
        console.error("Error fetching details:", err);
        setOccasion(null);
      }
    };

    fetchData();
  }, [slug, userSelectedCategory]);

const handleSendGift = () => {
  const selectedService = services.find((s) => s.id.toString() === selectedServiceId);
  if (!selectedService || !occasion) return;

  // Ensure the occasion has the correct category (user-selected or from API)
  const occasionWithCorrectCategory = {
    ...occasion,
    category: userSelectedCategory || occasion.category
  };

  navigate("/send-gift", {
    state: { occasion: occasionWithCorrectCategory, service: selectedService },
  });
};


  if (occasion === null) return <div className="p-6">Gift occasion not found.</div>;
  if (occasion === undefined) return <div className="p-6">Loading...</div>;

  return (
    <div className="min-h-screen bg-[#f9f9f9] py-10 px-6 md:px-20">
      
      {/* Occasion Banner */}
      <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-lg p-8 mb-12">
      
      {occasion.imageUrl && occasion.imageUrl.trim() !== '' ? (
  <img
    src={getImageUrl(occasion.imageUrl)}
    alt={occasion.title}
    className="w-full h-64 object-cover rounded-lg mb-6"
    loading="lazy"
    onError={(e) => {
      const target = e.target as HTMLImageElement;
      target.onerror = null; // prevent infinite loop
      target.style.display = 'none'; // hide the broken image
    }}
  />
) : (
  <div className="w-full h-64 bg-gray-200 rounded-lg mb-6 flex items-center justify-center">
    <div className="text-center">
      <p className="text-gray-500 mb-2">No image available</p>
      <div className="text-gray-400 text-4xl">📷</div>
    </div>
  </div>
)}

        <h1 className="text-3xl font-bold text-[#1c2b21] mb-2">{occasion.title}</h1>
        <p className="text-sm text-gray-500 mb-1">
          Category:&nbsp;{occasion.category && typeof occasion.category === 'string' 
            ? occasion.category === "diaspora" 
              ? "Ethiopian Diaspora"
              : occasion.category.charAt(0).toUpperCase() + occasion.category.slice(1).toLowerCase()
            : "N/A"}
        </p>
        {occasion.description && (
          <p className="text-base mt-4 text-gray-700">{occasion.description}</p>
        )}
      </div>

      {/* Service List */}
      <div className="max-w-5xl mx-auto">
        <h2 className="text-2xl font-semibold text-[#1c2b21] mb-6">
          Choose the service you’d like to send
        </h2>

        {services.length === 0 ? (
          <p className="text-gray-600">No services available for this occasion yet.</p>
        ) : (
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
            {services.map((service) => {
              const checked = selectedServiceId === service.id?.toString();

              return (
              <label
  key={service.id}
  className={`cursor-pointer bg-white border rounded-xl p-4 transition duration-300 shadow hover:shadow-lg flex flex-col ${
    checked ? "ring-2 ring-offset-2 ring-[#D4AF37]" : ""
  }`}
>
  <input
    type="radio"
    name="service"
    value={service.id}
    checked={checked}
    onChange={() => setSelectedServiceId(service.id.toString())}
    className="hidden" // ✅ Hide the default radio button
  />

  
  {service.imageUrl ? (
    <img
      src={getImageUrl(service.imageUrl)}
      alt={service.title}
      className="w-full h-40 object-cover rounded mb-3"
      onError={(e) => {
        ((e.target as HTMLImageElement).style.display = "none");
      }}
    />
  ) : (
    <div className="w-full h-40 bg-gray-200 rounded mb-3 flex items-center justify-center">
      <div className="text-center text-gray-500">
        <p className="text-sm">No image</p>
        <div className="text-gray-400 text-2xl">📷</div>
      </div>
    </div>
  )}

  <span className="text-lg font-semibold">{service.title}</span>

  {service.price && (
    <span className="text-sm text-gray-500">{service.price} ETB</span>
  )}

  {service.location && (
    <span className="text-sm text-gray-600 mt-1">📍 {service.location}</span>
  )}

  {service.description && (
    <span className="text-xs text-gray-500 mt-1 line-clamp-2">
      {service.description}
    </span>
  )}
</label>

              );
            })}
          </div>
        )}

        <button
          onClick={handleSendGift}
          disabled={!selectedServiceId}
          className={`mt-10 w-1/2 bg-[#D4AF37] text-[#1c2b21] font-medium py-2 rounded-md transition ${
            !selectedServiceId ? "opacity-50 cursor-not-allowed" : "hover:bg-[#caa82f]"
          }`}
        >
          {selectedServiceId ? "Proceed to Checkout" : "Select a Service"}
        </button>
      </div>
    </div>
  );
};

export default GiftDetails;



