import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import BASE_URL from "../api/api";

/* Types */
type Service = {
  _id: string;
  title: string;
  description?: string;
  category: string;
  price: number;
  discount?: number;
  discountedPrice?: number;
  location?: string;
  duration?: string;
  imageUrl?: string;
  providerId: { fullName: string };
};

/* Category headings */
const categoryHeadings: Record<string, { letter: string; label: string }> = {
  Wellness: { letter: "", label: "Wellness Services" },
  Medical: { letter: "", label: "Medical Services" },
  "Home Based/Mobile Services": { letter: "", label: "Home Based / Mobile Services" },
  "Hotel Rooms": { letter: "", label: "Hotel Room Services" },
};

/* Category images */
const categoryImages: Record<string, string> = {
  Wellness: "/wellness.svg",
  Medical: "/medical.svg",
  "Home Based/Mobile Services": "/home-health.svg",
  "Hotel Rooms": "/hotel-room.svg",
};

const ServiceCatalog = () => {
  const navigate = useNavigate();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const res = await fetch(`${BASE_URL}/services`);
        if (!res.ok) throw new Error("Failed to fetch services");
        const data: Service[] = await res.json();
        setServices(data);
      } catch (err) {
        console.error(err);
        setError("Unable to load services right now.");
      } finally {
        setLoading(false);
      }
    };

    fetchServices();
  }, []);

  const formatPrice = (p: number) => `${p.toLocaleString()}\u202fETB`;
  const imgSrc = (url?: string) => {
    if (!url) return "/placeholder.svg";
    
    // If already a full URL, normalize it
    if (url.startsWith('http')) {
      if (url.includes('odsglobal.net') && !url.includes('www.odsglobal.net')) {
        url = url.replace(/https?:\/\/(?:www\.)?wanaw\.et/g, 'https://www.odsglobal.net');
      }
      return url;
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
    
    const imagePath = url.startsWith('/') ? url : `/${url}`;
    return `${serverBase}${imagePath}`;
  };

  if (loading)
    return (
      <section className="py-20 text-center text-gray-500 text-lg">Loading…</section>
    );

  if (error)
    return (
      <section className="py-20 text-center text-red-600 text-lg">{error}</section>
    );

  return (
    <section className="px-4 py-10 max-w-7xl mx-auto">
      <h2 className="text-3xl sm:text-4xl font-bold text-center text-[#0f285b] mb-16">
        Service Catalog
      </h2>

      {Object.entries(categoryHeadings).map(([catKey, meta]) => {
        const grouped = services.filter((s) => s.category === catKey);
        const categoryImage = categoryImages[catKey] || "/placeholder.svg";

        return (
          <div key={catKey} className="mb-24">
            {/* Category Header */}
            <div className="mb-6 rounded-2xl overflow-hidden shadow-xl group flex flex-col md:flex-row items-center gap-6">
              <img
                src={categoryImage}
                alt={`${catKey} cover`}
                className="w-full md:w-1/2 h-64 object-cover rounded-2xl transition-transform duration-500 group-hover:scale-105"
              />

              <div className="flex flex-col justify-center text-center md:text-left px-4 md:px-6 flex-1">
                <h3 className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#0f285b]">
                  {meta.label}
                </h3>
                <button
                  onClick={() =>
                    setExpandedCategory(expandedCategory === catKey ? null : catKey)
                  }
                  className="mt-6 bg-[#be9b49] text-[#0f285b] font-medium text-sm sm:text-base px-6 py-3 rounded-full hover:bg-[#caa82f] transition w-full sm:w-max mx-auto md:mx-0"
                >
                  {expandedCategory === catKey ? "Hide Services" : "View Services"}
                </button>
              </div>
            </div>

            {/* Service Cards */}
            {expandedCategory === catKey && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
                {grouped.length > 0 ? (
                  grouped.map((srv) => (
                    <div
                      key={srv._id}
                      className="bg-white rounded-2xl shadow-sm hover:shadow-lg transition overflow-hidden flex flex-col"
                    >
                      <img
                        src={imgSrc(srv.imageUrl)}
                        alt={srv.title}
                        className="w-full h-60 object-cover"
                      />
                      <div className="p-5 flex flex-col flex-1">
                        <h4 className="text-lg font-semibold text-[#0f285b]">
                          {srv.title}
                        </h4>
                        <p className="text-sm text-gray-600 mt-1">
                          👤 {srv.providerId?.fullName ?? "Unknown Provider"}
                        </p>
                        {srv.location && (
                          <p className="text-sm text-gray-500 mt-1">
                            📍 {srv.location}
                          </p>
                        )}
                        <div className="mt-2">
                          {srv.discount && srv.discount > 0 ? (
                            <div>
                              <p className="text-sm text-gray-500 line-through">
                                {formatPrice(srv.price)}
                              </p>
                              <div className="flex items-center gap-2 mt-1">
                                <p className="text-base font-medium text-[#be9b49]">
                                  {formatPrice(srv.discountedPrice || (srv.price * (1 - srv.discount / 100)))}
                                </p>
                                <span className="text-xs bg-red-500 text-white px-2 py-1 rounded">
                                  {srv.discount}% OFF
                                </span>
                              </div>
                            </div>
                          ) : (
                            <p className="text-base font-medium text-gray-800">
                              {formatPrice(srv.price)}
                            </p>
                          )}
                        </div>

                        <button
                          onClick={() =>
                            navigate("/send-gift", { state: { service: srv } })
                          }
                          className="mt-auto bg-[#be9b49] text-[#0f285b] text-sm font-semibold py-2 px-4 rounded-full hover:bg-[#caa82f] transition mt-4"
                        >
                          Send This Gift
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-gray-500 text-center col-span-full py-10">
                    No services available in this category.
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </section>
  );
};

export default ServiceCatalog;

