import { useState, useEffect } from "react";
import { Edit, X, Image as ImageIcon, RefreshCw } from "lucide-react";
import BASE_URL from "../../../api/api";

/** Contract returned by GET /api/services/provider/:providerId/services */
interface ProviderService {
  id: number;
  title: string;
  description?: string | null;
  category: string;
  subcategory?: string | null;
  /** Normalized number from API; null only when the DB value is missing */
  price: number | null;
  discount: number;
  imageUrl?: string | null;
  location?: string | null;
  status: string;
  rating: number;
  reviewCount?: number;
  providerId?: number;
  duration?: string | null;
  createdAt?: string;
}

const formatCurrency = (value: number | null | undefined): string => {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return "Not set";
  }
  return `ETB ${value.toLocaleString()}`;
};

interface EditServiceModalProps {
  service: ProviderService;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

const EditServiceModal = ({ service, isOpen, onClose, onUpdate }: EditServiceModalProps) => {
  const [discount, setDiscount] = useState<string>(service.discount?.toString() || "0");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(service.imageUrl || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setDiscount(service.discount?.toString() || "0");
      setImagePreview(service.imageUrl || null);
      setImageFile(null);
      setError(null);
    }
  }, [isOpen, service]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const userStr = localStorage.getItem("user");
      const user = userStr ? JSON.parse(userStr) : null;
      const token = localStorage.getItem("token") || user?.token;

      if (!token) {
        throw new Error("You must be logged in");
      }

      const formData = new FormData();
      formData.append("discount", discount);
      if (imageFile) {
        formData.append("image", imageFile);
      }

      const response = await fetch(`${BASE_URL}/services/${service.id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.msg || "Failed to update service");
      }

      await response.json();
      alert("Service updated successfully!");
      onUpdate();
      onClose();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to update service";
      setError(errorMessage);
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const discountPercent = parseFloat(discount) || 0;
  const discountedPrice =
    service.price !== null && discountPercent > 0
      ? service.price * (1 - discountPercent / 100)
      : null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-900">Edit Service</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{service.title}</h3>
            <p className="text-sm text-gray-600">{service.category}</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Discount (%)
            </label>
            <input
              type="number"
              min="0"
              max="100"
              step="0.1"
              value={discount}
              onChange={(e) => setDiscount(e.target.value)}
              className="w-full border border-[#E8E8E8] rounded-lg px-4 py-2 focus:ring-2 focus:ring-[#BE9B49] focus:border-[#BE9B49] outline-none"
              placeholder="Enter discount percentage (0-100)"
            />
            <p className="text-xs text-gray-500 mt-1">
              Current price: {formatCurrency(service.price)}
              {discountedPrice !== null && (
                <span className="font-bold ml-2" style={{ color: "#0F285B" }}>
                  After discount: {formatCurrency(discountedPrice)}
                </span>
              )}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Service Image
            </label>
            <div className="flex items-center space-x-4">
              {imagePreview && (
                <div className="relative">
                  <img
                    src={imagePreview}
                    alt="Service preview"
                    className="w-32 h-32 object-cover rounded-lg border border-[#E8E8E8]"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "/placeholder.png";
                    }}
                  />
                </div>
              )}
              <div className="flex-1">
                <label className="flex items-center justify-center w-full px-4 py-3 border-2 border-dashed border-[#E8E8E8] rounded-lg cursor-pointer hover:border-[#BE9B49] transition-colors">
                  <ImageIcon className="w-5 h-5 text-gray-500 mr-2" />
                  <span className="text-sm text-gray-600">
                    {imageFile ? imageFile.name : "Choose new image"}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </label>
                <p className="text-xs text-gray-500 mt-2">
                  Upload a new image to replace the current one. Leave empty to keep current image.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end space-x-4 pt-4 border-t border-[#E8E8E8]">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-[#E8E8E8] rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-full font-semibold text-sm transition-all shadow-md bg-gradient-to-r from-[#EDC45B] to-[#8D7338] text-[#0F285B] hover:brightness-105 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
            >
              {loading ? "Updating..." : "Update Service"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const ProviderServicesList = () => {
  const [services, setServices] = useState<ProviderService[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingService, setEditingService] = useState<ProviderService | null>(null);

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      setLoading(true);
      setError(null);
      const userStr = localStorage.getItem("user");
      const user = userStr ? JSON.parse(userStr) : null;
      const token = localStorage.getItem("token") || user?.token;

      if (!token) {
        throw new Error("You must be logged in. No token found.");
      }

      if (!user || !user.id) {
        throw new Error("User information not found. Please log in again.");
      }

      const userId = user.id;
      const url = `${BASE_URL}/services/provider/${userId}/services`;
      console.log("Fetching services from:", url);
      console.log("User ID:", userId, "Type:", typeof userId);

      const response = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      console.log("Response status:", response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({
          msg: `HTTP ${response.status}: ${response.statusText}`,
        }));
        console.error("Error response:", errorData);
        throw new Error(
          errorData.msg ||
            `Failed to fetch services: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();
      console.log("Services data received:", data);

      if (!Array.isArray(data)) {
        throw new Error("Unexpected services response shape from API.");
      }

      setServices(data as ProviderService[]);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to load services";
      setError(errorMessage);
      console.error("Error fetching services:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-gray-600">Loading your services...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-600">{error}</p>
        <button
          onClick={fetchServices}
          className="mt-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold" style={{ color: "#0F285B" }}>
          My Services
        </h2>
        <button
          onClick={fetchServices}
          className="flex items-center space-x-2 px-4 py-2 rounded-xl font-semibold text-xs transition shadow-sm hover:brightness-105 text-[#0F285B]"
          style={{ background: "linear-gradient(135deg, #F5E189 0%, #EDC45B 25%, #BE9B49 50%, #BB9F54 75%, #8D7338 100%)" }}
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh</span>
        </button>
      </div>

      {services.length === 0 ? (
        <div className="bg-[#FAF8F5] border border-dashed border-[#E8E8E8] rounded-2xl p-10 text-center">
          <p className="text-gray-500 font-medium">You haven&apos;t added any services yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service) => (
            <div
              key={service.id}
              className="bg-white border border-[#E8E8E8] rounded-2xl shadow-sm overflow-hidden hover:shadow-md hover:border-[#BE9B49] transition-all"
            >
              <div className="relative">
                {service.imageUrl ? (
                  <img
                    src={service.imageUrl}
                    alt={service.title}
                    className="w-full h-48 object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "/placeholder.png";
                    }}
                  />
                ) : (
                  <div className="w-full h-48 bg-gray-100 flex items-center justify-center">
                    <ImageIcon className="w-12 h-12 text-gray-400" />
                  </div>
                )}
                <span
                  className={`absolute top-3 right-3 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                    service.status === "approved"
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      : service.status === "pending"
                      ? "bg-[#FAF0D7] text-[#8D7338] border border-[#BE9B49]/30"
                      : "bg-slate-50 text-slate-700 border border-slate-200"
                  }`}
                >
                  {service.status}
                </span>
              </div>

              <div className="p-5">
                <h3 className="text-lg font-bold mb-1" style={{ color: "#0F285B" }}>
                  {service.title}
                </h3>
                <p className="text-xs text-gray-500 mb-4">{service.category}</p>

                <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#E8E8E8]">
                  <div>
                    <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">Price</p>
                    <p className="text-lg font-bold" style={{ color: "#0F285B" }}>
                      {formatCurrency(service.price)}
                    </p>
                  </div>
                  {service.discount > 0 && (
                    <div className="text-right">
                      <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">Discount</p>
                      <p className="text-sm font-bold text-amber-600">{service.discount}% OFF</p>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => setEditingService(service)}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all shadow-sm border border-[#0F285B] text-[#0F285B] hover:bg-[#0F285B] hover:text-white"
                >
                  <Edit className="w-4 h-4" />
                  <span>Edit Discount &amp; Image</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {editingService && (
        <EditServiceModal
          service={editingService}
          isOpen={!!editingService}
          onClose={() => setEditingService(null)}
          onUpdate={fetchServices}
        />
      )}
    </div>
  );
};

export default ProviderServicesList;
