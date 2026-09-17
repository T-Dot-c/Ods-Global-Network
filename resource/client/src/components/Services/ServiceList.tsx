import { useEffect, useState } from "react";
import { Star } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import BASE_URL from "../../api/api";

const wellnessSubcategories = [
  {
    label: "Salon & Hairstyling",
    options: ["Hair Styling", "Haircut", "Hair Coloring", "Blow Dry"],
  },
  {
    label: "Gym & Fitness",
    options: ["Gym", "Personal Trainer", "Yoga Instructor", "Health Coach"],
  },
  {
    label: "Outdoor Wellness Activities",
    options: ["Hiking", "Wellness Camping"],
  },
  {
    label: "Spa and Wellness Treatments",
    options: ["Massages", "Facials", "Other Spa Services"],
  },
  {
    label: "Cosmetic Services",
    options: ["Skin Treatments", "Makeup Services"],
  },
  {
    label: "Holistic Therapies",
    options: ["Aromatherapy", "Acupuncture", "Reiki"],
  },
  {
    label: "Spa Academy",
    options: ["Professional Spa Training", "Massage Therapy Courses"],
  },
];

const homeBasedSubcategories = [
  {
    label: "Health - Medical",
    options: ["Primary Care", "Preventive Services"],
  },
  {
    label: "Health - Skilled Nursing",
    options: ["Full Time", "Assistants", "Care Taker"],
  },
  {
    label: "Spa and Wellness Treatments",
    options: ["Massages", "Facials", "Other Spa Services"],
  },
  {
    label: "Cosmetic Services",
    options: ["Skin Treatments", "Hair Styling", "Makeup Services"],
  },
];

const healthSubcategories = [
  {
    label: "Full Checkups",
    options: [
      "General Health Checkup",
      "Blood Tests",
      "Blood Pressure Monitoring",
      "Cholesterol & Glucose Screening",
      "Vision & Hearing Tests",
      "Physical Examination",
    ],
  },
  {
    label: "Prenatal Services",
    options: ["Checkups & ultrasound", "Checkup only", "Intravenous drip"],
  },
  {
    label: "Dental Services",
    options: [
      "Crowning",
      "Braces",
      "Fillings",
      "Scaling",
      "Denture",
      "Extraction",
      "Root Canal Therapy",
      "Implants",
    ],
  },
  {
    label: "Physiotherapy Services",
    options: [
      "Consultant ~ Full Time",
      "Consultant ~ Visit~1",
      "Consultant ~ Visit~2",
      "Consultant ~ Visit~3",
    ],
  },
  {
    label: "Diagnostic Imaging Services",
    options: ["CT Scan", "MRI"],
  },
  {
    label: "Hemodialysis Services",
    options: [
      "Consultation",
      "Single Dialysis Session",
      "Weekly ~ Three Dialysis Session",
      "Bi-weekly ~ Six Dialysis Session",
      "Monthly ~ Twelve Dialysis Session",
    ],
  },
  {
    label: "Aesthetic Services - Dermatology",
    options: ["Acne Treatment", "Scar Removal Treatment", "Hair Transplant", "Laser Hair Removal", "General Treatment"],
  },
  {
    label: "Nutritionist Services",
    options: [
      "Personalized Nutrition Plans",
      "Nutritional Counseling",
      "Nutritional Education",
      "Cooking Classes",
      "Weight Management",
      "Chronic Disease Management",
      "Ongoing Support",
      "Group Sessions",
    ],
  },
  {
    label: "Aesthetic Services - Aesthetic Treatments",
    options: ["Facials", "Chemical peels", "Microneedling", "Waxing", "Makeup application", "Body treatments"],
  },
  {
    label: "Nutrition & Dietary Academy",
    options: ["Nutrition Courses", "Dietary Programs"],
  },
  {
    label: "Food Preparation Academy",
    options: ["Cooking Classes", "Food Safety Courses"],
  },
];

const hotelRoomSubcategories = [
  {
    label: "3 Star Hotel",
    options: ["Standard Room", "Deluxe Room", "Twin Room", "Suit Room", "Royal Suite Room"],
  },
  {
    label: "4 Star Hotel",
    options: ["Standard Room", "Deluxe Room", "Twin Room", "Suit Room", "Royal Suite Room"],
  },
  {
    label: "5 Star Hotel",
    options: ["Standard Room", "Deluxe Room", "Twin Room", "Suit Room", "Royal Suite Room", "Presidential Room"],
  },
  {
    label: "Pensions",
    options: ["Standard Pension Room"],
  },
];

const ServiceList = () => {
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSubcategory, setSelectedSubcategory] = useState("");

  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const categoryFilter = queryParams.get("category");

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const query = new URLSearchParams();
        if (categoryFilter) query.append("category", categoryFilter);
        if (selectedSubcategory) query.append("subcategory", selectedSubcategory);

        const res = await fetch(`${BASE_URL}/services?${query.toString()}`);
        const data = await res.json();

        if (!Array.isArray(data)) {
          console.warn("Unexpected services payload", data);
          setServices([]);
          setLoading(false);
          return;
        }

        // Apply initial filtering only if filters are provided
        let filtered = data;
        
        if (categoryFilter) {
          filtered = filtered.filter((s: any) => {
            const serviceCategory = (s.category || "").toLowerCase();
            const filterCategory = categoryFilter.toLowerCase();
            return serviceCategory.includes(filterCategory);
          });
        }
        
        if (selectedSubcategory) {
          filtered = filtered.filter((s: any) => {
            const serviceSubcategory = (s.subcategory || "").toLowerCase().trim();
            const filterSubcategory = selectedSubcategory.toLowerCase().trim();
            return serviceSubcategory === filterSubcategory;
          });
        }

        console.log("📊 Services loaded:", filtered.length, "out of", data.length);
        console.log("📋 Sample service:", filtered[0]);
        setServices(filtered.length > 0 ? filtered : data); // If filtered is empty, show all services
        setLoading(false);
      } catch (error) {
        console.error("❌ Error fetching services", error);
        setServices([]);
        setLoading(false);
      }
    };

    fetchServices();
  }, [categoryFilter, selectedSubcategory]);

  const handleAddToCart = (service: any) => {
    const cart = JSON.parse(localStorage.getItem("cart") || "[]");
    cart.push(service);
    localStorage.setItem("cart", JSON.stringify(cart));
    alert(`"${service.title}" added to cart!`);
    navigate("/cart");
  };

  const handleSendGift = (service: any) => {
    navigate("/send-gift", { state: { service } });
  };

  const handleViewDetails = (service: any) => {
    if (!service?.id) {
      console.warn("Service is missing an id; cannot navigate to detail page", service);
      return;
    }
    navigate(`/services/${service.id}`);
  };

  const filteredServices = services.filter((service) => {
    // If there's a search term, check if it matches
    const query = searchTerm.toLowerCase().trim();
    const matchesSearch = !query || (
      (service.title?.toLowerCase() || "").includes(query) ||
      (service.description?.toLowerCase() || "").includes(query) ||
      (service.category?.toLowerCase() || "").includes(query) ||
      (service.subcategory?.toLowerCase() || "").includes(query)
    );

    // If there's a selected subcategory, it must match exactly (ignore case)
    const matchesSubcategory = !selectedSubcategory || (
      selectedSubcategory.toLowerCase().trim() === (service.subcategory?.toLowerCase().trim() || "")
    );

    return matchesSearch && matchesSubcategory;
  });

  if (loading) {
    return (
      <p className="text-center text-gray-500 mt-16 text-lg">Loading services...</p>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-10">
      <h1 className="text-3xl font-extrabold text-center text-[#1c2b21] mb-6">
        Available Services
      </h1>

      {/* 🔍 Search input */}
      <div className="max-w-md mx-auto mb-10 space-y-4">
        <input
          type="text"
          placeholder="Search services..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-[#D4AF37] text-sm"
        />

        {/* Hotel Rooms */}
        {categoryFilter?.toLowerCase() === "hotel" && (
          <select
            value={selectedSubcategory}
            onChange={(e) => setSelectedSubcategory(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-[#D4AF37] text-sm"
          >
            <option value="">-- Select Room Type --</option>
            {hotelRoomSubcategories.map((group) => (
              <optgroup key={group.label} label={group.label}>
                {group.options.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        )}

        {/* Wellness */}
        {categoryFilter?.toLowerCase() === "wellness" && (
          <select
            value={selectedSubcategory}
            onChange={(e) => setSelectedSubcategory(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-[#D4AF37] text-sm"
          >
            <option value="">-- Select Wellness Subcategory --</option>
            {wellnessSubcategories.map((group) => (
              <optgroup key={group.label} label={group.label}>
                {group.options.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        )}

        {/* Home Based / Mobile */}
        {categoryFilter?.toLowerCase() === "home based/mobile services" && (
          <select
            value={selectedSubcategory}
            onChange={(e) => setSelectedSubcategory(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-[#D4AF37] text-sm"
          >
            <option value="">-- Select Home Based Subcategory --</option>
            {homeBasedSubcategories.map((group) => (
              <optgroup key={group.label} label={group.label}>
                {group.options.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        )}

        {/* Health */}
        {categoryFilter?.toLowerCase() === "health" && (
          <select
            value={selectedSubcategory}
            onChange={(e) => setSelectedSubcategory(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-[#D4AF37] text-sm"
          >
            <option value="">-- Select Health Subcategory --</option>
            {healthSubcategories.map((group) => (
              <optgroup key={group.label} label={group.label}>
                {group.options.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
       {filteredServices.length > 0 ? (
  filteredServices.map((service) => (
    <div
      key={service.id}
      className="bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-lg transition duration-300 p-5 flex flex-col group"
    >
      {service.imageUrl ? (
        <img
          src={(() => {
            if (service.imageUrl.startsWith('http')) {
              if (service.imageUrl.includes('wanaw.et') && !service.imageUrl.includes('www.wanaw.et')) {
                return service.imageUrl.replace(/https?:\/\/(?:www\.)?wanaw\.et/g, 'https://www.wanaw.et');
              }
              return service.imageUrl;
            }
            
            let serverBase;
            if (BASE_URL.startsWith('http')) {
              serverBase = BASE_URL.replace('/api', '').replace(/\/$/, '');
            } else {
              serverBase = 'http://localhost:5000';
            }
            
            const imagePath = service.imageUrl.startsWith('/') ? service.imageUrl : `/${service.imageUrl}`;
            return `${serverBase}${imagePath}`;
          })()}
          className="w-full h-48 object-cover rounded-xl mb-4"
          alt={service.title}
          onError={(e) => {
            const img = e.target as HTMLImageElement;
            console.error('Image load error:', img.src, 'Original URL:', service.imageUrl);
            img.src = '/placeholder.png';
            img.onerror = null;
          }}
        />
      ) : (
        <div className="w-full h-48 bg-gray-200 rounded-xl mb-4 flex items-center justify-center">
          <div className="text-center">
            <div className="text-gray-400 text-4xl mb-2">📷</div>
            <p className="text-gray-500 text-sm">No image</p>
          </div>
        </div>
      )}

      <div className="flex-1">
        <h2 className="text-xl font-bold text-[#1c2b21] mb-2">{service.title}</h2>
        <p className="text-sm text-gray-600 mb-1">
          Category: {service.category}
        </p>
        <p className="text-sm text-gray-600 mb-1">
          Subcategory: {service.subcategory || "Not specified"}
        </p>
        <p className="text-sm text-gray-500 mb-3 line-clamp-3">
          {service.description}
        </p>
        <div className="flex items-center gap-2 mb-3">
          <div className="flex items-center gap-1">
            {Array.from({ length: 5 }).map((_, starIndex) => {
              const starValue = starIndex + 1;
              const ratingValue = Number(service.rating) || 0;
              const isFilled = ratingValue >= starValue - 0.3;
              return (
                <Star
                  key={`${service.id}-star-${starValue}`}
                  size={18}
                  className={isFilled ? "text-[#D4AF37]" : "text-gray-300"}
                  fill={isFilled ? "currentColor" : "none"}
                />
              );
            })}
          </div>
          <span className="text-sm text-gray-500">
            {(Number(service.rating) || 0).toFixed(1)} · {service.reviewCount || 0} review{(service.reviewCount || 0) === 1 ? "" : "s"}
          </span>
        </div>
        <div className="mb-2">
          {service.discount && service.discount > 0 ? (
            <div>
              <p className="text-sm text-gray-500 line-through mb-1">
                ETB {service.price?.toLocaleString()}
                {service.category === "Hotel" || service.category === "Hotel Rooms" ? " / night" : ""}
              </p>
              <p className="text-lg font-semibold text-[#D4AF37]">
                ETB {service.discountedPrice ? service.discountedPrice.toLocaleString() : (service.price * (1 - service.discount / 100)).toLocaleString()}
                {service.category === "Hotel" || service.category === "Hotel Rooms" ? " / night" : ""}
                <span className="ml-2 text-sm bg-red-500 text-white px-2 py-1 rounded">
                  {service.discount}% OFF
                </span>
              </p>
            </div>
          ) : (
            <p className="text-lg font-semibold text-[#D4AF37]">
              ETB {service.price?.toLocaleString()}
              {service.category === "Hotel" || service.category === "Hotel Rooms" ? " / night" : ""}
            </p>
          )}
        </div>
        {service.location && (
          <p className="text-sm text-gray-600 mb-1">Location: {service.location}</p>
        )}
        <p className="text-sm text-gray-400 mb-4">
          Posted by: {service.providerName || "Unknown"}
        </p>
      </div>

      <div className="flex flex-wrap gap-2 mt-auto pt-4 border-t border-gray-200">
        <button
          onClick={() => handleViewDetails(service)}
          className="w-full bg-white border border-gray-300 text-[#1c2b21] font-semibold py-3 px-3 rounded-lg hover:border-[#D4AF37] hover:text-[#D4AF37] transition-all shadow-sm hover:shadow-md flex items-center justify-center gap-1.5 text-sm"
        >
          <span>🔍</span>
          <span>View Details & Reviews</span>
        </button>
        <button
          onClick={() => {
            handleAddToCart(service);
          }}
          className="flex-1 min-w-[110px] bg-[#1c2b21] text-white font-semibold py-3 px-3 rounded-lg hover:bg-[#111] transition-all shadow-sm hover:shadow-md flex items-center justify-center gap-1.5 text-sm"
        >
          <span>🛒</span>
          <span>Add to Cart</span>
        </button>
        <button
          onClick={() => {
            handleSendGift(service);
          }}
          className="flex-1 min-w-[110px] bg-[#1c2b21] text-white font-semibold py-3 px-3 rounded-lg hover:bg-[#111] transition-all shadow-sm hover:shadow-md flex items-center justify-center gap-1.5 text-sm"
        >
          <span>🎁</span>
          <span>Send Gift</span>
        </button>
      </div>
    </div>
  ))
) : (
  <div className="text-center text-gray-500 col-span-full py-8">
    <p className="mb-4">No services match your search criteria.</p>
    {(searchTerm || selectedSubcategory) && (
      <button
        onClick={() => {
          setSearchTerm("");
          setSelectedSubcategory("");
        }}
        className="px-4 py-2 bg-[#D4AF37] text-[#1c2b21] rounded-lg hover:bg-[#b8962f] transition font-semibold"
      >
        Clear All Filters
      </button>
    )}
    {services.length === 0 && (
      <p className="mt-4 text-sm">No services are available at the moment.</p>
    )}
  </div>
)}

      </div>
    </div>
  );
};

export default ServiceList;

