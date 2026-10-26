/**
 * Service Catalog & Healthcare Provider Directory Service (Batch 8 Full Specification)
 * ODS Global Network
 */

const API_BASE = (import.meta as any).env?.VITE_API_BASE || 'http://localhost:5000';

export type ServiceStatus =
  | 'draft'
  | 'pending_review'
  | 'published'
  | 'unpublished'
  | 'rejected'
  | 'taken_down'
  | 'archived'
  // Legacy stubs
  | 'pending'
  | 'approved';

export type LocationType = 'on_site' | 'at_customer' | 'online';

export type DeliveryType = 'in_clinic' | 'home_visit' | 'virtual' | 'diagnostic' | LocationType;

export type HealthcareCategory = string;

export type CategoryCountItem = ServiceCategoryItem;

export interface ServiceCategoryItem {
  id: string;
  parent_id?: string | null;
  name: string;
  slug: string;
  sort_order: number;
  is_active: boolean;
  service_count?: number;
  subcategories?: ServiceCategoryItem[];
}

export interface ServiceGalleryImage {
  id: string;
  image_url: string;
  sort_order: number;
  is_cover: boolean;
  alt_text?: string;
  upload_id?: string;
}

export interface ServiceStatusHistoryItem {
  id: string;
  service_id: string;
  from_status?: string | null;
  to_status: string;
  actor_user_id: string;
  actor_name?: string;
  reason?: string | null;
  created_at: string;
}

export interface ServiceItem {
  id: string;
  owner_user_id?: string;
  owner_type?: 'merchant' | 'provider';
  provider_id?: string;
  owner_name?: string;
  owner_phone?: string;
  owner_email?: string;
  category_id?: string;
  category_name?: string;
  category_slug?: string;
  title: string;
  slug: string;
  short_description?: string;
  description?: string;
  price_amount: number;
  currency: string;
  duration_minutes: number;
  capacity: number;
  lead_time_hours: number;
  location_type: LocationType;
  city?: string;
  area?: string;
  cancellation_note?: string;
  tags?: string[];
  status: ServiceStatus;
  is_active: boolean;
  rejection_reason?: string;
  takedown_reason?: string;
  cover_image_url?: string;
  cover_image_alt?: string;
  gallery?: ServiceGalleryImage[];
  statusHistory?: ServiceStatusHistoryItem[];
  published_at?: string;
  created_at: string;
  updated_at?: string;

  // Compatibility aliases
  price?: number | string;
  delivery_type?: DeliveryType;
  image_url?: string;
  category?: string;
  subcategory?: string;
  provider_name?: string;
  provider_type?: string;
  official_phone?: string;
  official_email?: string;
  address_line?: string;
  discount_percentage?: number | string;
  effective_price?: number | string;
  avg_rating?: number | string;
  review_count?: number;
}

export interface ProviderDirectoryItem {
  id: string;
  user_id?: string;
  provider_name: string;
  provider_type: string;
  service_category?: string;
  official_phone?: string;
  official_email?: string;
  website?: string;
  description?: string;
  operating_hours?: string;
  availability?: string;
  city?: string;
  address_line?: string;
  published_services_count?: number;
  active_services_count?: number;
  avg_rating?: number | string;
  total_reviews?: number;
}

export interface ServiceDetailItem extends ServiceItem {
  provider_description?: string;
  operating_hours?: string;
  region_state?: string;
  recentReviews?: any[];
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CatalogQueryParams {
  categoryId?: string;
  category?: string;
  subcategory?: string;
  search?: string;
  q?: string;
  minPrice?: number | string;
  maxPrice?: number | string;
  locationType?: LocationType;
  deliveryType?: string;
  city?: string;
  area?: string;
  minDuration?: number;
  maxDuration?: number;
  sort?: 'newest' | 'price_asc' | 'price_desc' | 'rating' | 'duration' | 'relevance';
  page?: number;
  limit?: number;
}

export interface CreateServicePayload {
  title: string;
  shortDescription?: string;
  description?: string;
  categoryId?: string;
  category?: string;
  priceAmount: number;
  price?: number;
  currency?: string;
  durationMinutes: number;
  capacity?: number;
  leadTimeHours?: number;
  locationType: LocationType;
  city?: string;
  area?: string;
  cancellationNote?: string;
  tags?: string[];
  imageUrl?: string;
}

export interface UpdateServicePayload extends Partial<CreateServicePayload> {
  isActive?: boolean;
}

export const serviceCatalogService = {
  /**
   * Fetch public catalog services with search, filters, and pagination
   */
  async getPublicCatalog(params?: CatalogQueryParams): Promise<{ data: ServiceItem[]; pagination: PaginationMeta }> {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, val]) => {
        if (val !== undefined && val !== null && val !== '') {
          searchParams.append(key, String(val));
        }
      });
    }

    const res = await fetch(`${API_BASE}/api/services?${searchParams.toString()}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.message || 'Failed to fetch services catalog');
    }
    // Normalize properties for backwards compatibility
    const services = (json.data || []).map((s: any) => ({
      ...s,
      price: s.price_amount !== undefined ? s.price_amount : s.price,
      delivery_type: s.location_type || s.delivery_type,
      image_url: s.cover_image_url || s.image_url,
    }));
    return { data: services, pagination: json.pagination };
  },

  /**
   * Fetch 2-level category taxonomy tree with published service counts
   */
  async getCategories(): Promise<ServiceCategoryItem[]> {
    const res = await fetch(`${API_BASE}/api/services/categories`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.message || 'Failed to fetch categories');
    }
    return json.data || [];
  },

  /**
   * Fetch raw category taxonomy
   */
  async getTaxonomy(): Promise<ServiceCategoryItem[]> {
    const res = await fetch(`${API_BASE}/api/service-categories`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.message || 'Failed to fetch taxonomy');
    }
    return json.data || [];
  },

  /**
   * Fetch healthcare providers directory
   */
  async getProviders(params?: any): Promise<{ data: ProviderDirectoryItem[]; pagination: PaginationMeta }> {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, val]) => {
        if (val !== undefined && val !== null && val !== '') {
          searchParams.append(key, String(val));
        }
      });
    }

    const res = await fetch(`${API_BASE}/api/services/providers?${searchParams.toString()}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.message || 'Failed to fetch provider directory');
    }
    return { data: json.data || [], pagination: json.pagination };
  },

  /**
   * Fetch detailed service by slug or id
   */
  async getServiceDetails(slugOrId: string): Promise<ServiceDetailItem> {
    const res = await fetch(`${API_BASE}/api/services/${encodeURIComponent(slugOrId)}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.message || 'Failed to fetch service details');
    }
    const s = json.data;
    return {
      ...s,
      price: s.price_amount !== undefined ? s.price_amount : s.price,
      delivery_type: s.location_type || s.delivery_type,
      image_url: (s.gallery && s.gallery[0]?.image_url) || s.cover_image_url || s.image_url,
      recentReviews: [],
    };
  },

  /**
   * Reviews stub (Reviews explicitly deferred in Batch 8 specification)
   */
  async getServiceReviews(_serviceId: string, page = 1, limit = 10): Promise<{ data: any[]; pagination: PaginationMeta }> {
    return {
      data: [],
      pagination: { total: 0, page, limit, totalPages: 0 }
    };
  },

  /**
   * Review submission stub
   */
  async submitReview(_serviceId: string, _payload: any): Promise<any> {
    throw new Error('Customer reviews are scheduled for a post-go-live release.');
  },

  /* ─────────────────────────────────────────────────────────────
     Owner Authoring Methods (/api/my/services)
     ───────────────────────────────────────────────────────────── */

  /**
   * Get authored services for authenticated Provider or Merchant
   */
  async getMyServices(status?: string, page = 1, limit = 50): Promise<{ data: ServiceItem[]; pagination: PaginationMeta }> {
    const query = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (status) query.append('status', status);

    const res = await fetch(`${API_BASE}/api/my/services?${query.toString()}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.message || 'Failed to fetch services');
    }
    const services = (json.data || []).map((s: any) => ({
      ...s,
      price: s.price_amount !== undefined ? s.price_amount : s.price,
      delivery_type: s.location_type || s.delivery_type,
      image_url: s.cover_image_url || s.image_url,
    }));
    return { data: services, pagination: json.pagination };
  },

  /**
   * Get single owned service with gallery and history
   */
  async getMyServiceById(id: string): Promise<ServiceItem> {
    const res = await fetch(`${API_BASE}/api/my/services/${id}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.message || 'Failed to fetch service');
    }
    const s = json.data;
    return {
      ...s,
      price: s.price_amount !== undefined ? s.price_amount : s.price,
      delivery_type: s.location_type || s.delivery_type,
    };
  },

  /**
   * Author creates a new service draft
   */
  async createService(payload: CreateServicePayload): Promise<ServiceItem> {
    const res = await fetch(`${API_BASE}/api/my/services`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        ...payload,
        price_amount: payload.priceAmount || payload.price,
        duration_minutes: payload.durationMinutes,
        location_type: payload.locationType,
        lead_time_hours: payload.leadTimeHours,
        short_description: payload.shortDescription,
        category_id: payload.categoryId,
      }),
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.message || 'Failed to create service');
    }
    return json.data;
  },

  /**
   * Author updates existing service
   */
  async updateService(serviceId: string, payload: UpdateServicePayload): Promise<ServiceItem> {
    const res = await fetch(`${API_BASE}/api/my/services/${serviceId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        ...payload,
        price_amount: payload.priceAmount !== undefined ? payload.priceAmount : payload.price,
        duration_minutes: payload.durationMinutes,
        location_type: payload.locationType,
        lead_time_hours: payload.leadTimeHours,
        short_description: payload.shortDescription,
        category_id: payload.categoryId,
      }),
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.message || 'Failed to update service');
    }
    return json.data;
  },

  /**
   * Transition service to published / submit for review
   */
  async publishService(serviceId: string): Promise<ServiceItem> {
    const res = await fetch(`${API_BASE}/api/my/services/${serviceId}/publish`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.message || 'Failed to publish service');
    }
    return json.data;
  },

  /**
   * Owner unpublishes active service
   */
  async unpublishService(serviceId: string): Promise<ServiceItem> {
    const res = await fetch(`${API_BASE}/api/my/services/${serviceId}/unpublish`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.message || 'Failed to unpublish service');
    }
    return json.data;
  },

  /**
   * Owner archives service
   */
  async archiveService(serviceId: string, reason?: string): Promise<ServiceItem> {
    const res = await fetch(`${API_BASE}/api/my/services/${serviceId}/archive`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ reason }),
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.message || 'Failed to archive service');
    }
    return json.data;
  },

  /**
   * Link an image from Batch 4 uploaded documents
   */
  async linkImage(
    serviceId: string,
    payload: {
      uploadId?: string;
      imageUrl?: string;
      sortOrder?: number;
      isCover?: boolean;
      altText?: string;
    }
  ): Promise<ServiceGalleryImage> {
    const res = await fetch(`${API_BASE}/api/my/services/${serviceId}/images`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.message || 'Failed to link image');
    }
    return json.data;
  },

  /**
   * Unlink image from service
   */
  async unlinkImage(serviceId: string, imageId: string): Promise<void> {
    const res = await fetch(`${API_BASE}/api/my/services/${serviceId}/images/${imageId}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.message || 'Failed to unlink image');
    }
  },

  /* ─────────────────────────────────────────────────────────────
     Admin Moderation Methods (/api/admin/services)
     ───────────────────────────────────────────────────────────── */

  /**
   * Admin lists review queue
   */
  async getAdminQueue(status = 'pending_review', page = 1, limit = 50): Promise<{ data: ServiceItem[]; pagination: PaginationMeta }> {
    const res = await fetch(`${API_BASE}/api/admin/services?status=${status}&page=${page}&limit=${limit}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.message || 'Failed to fetch admin review queue');
    }
    return { data: json.data || [], pagination: json.pagination };
  },

  /**
   * Admin approves service
   */
  async approveService(serviceId: string): Promise<ServiceItem> {
    const res = await fetch(`${API_BASE}/api/admin/services/${serviceId}/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.message || 'Failed to approve service');
    }
    return json.data;
  },

  /**
   * Admin rejects service with mandatory reason
   */
  async rejectService(serviceId: string, reason: string): Promise<ServiceItem> {
    const res = await fetch(`${API_BASE}/api/admin/services/${serviceId}/reject`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ reason }),
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.message || 'Failed to reject service');
    }
    return json.data;
  },

  /**
   * Admin takes down service with mandatory reason
   */
  async takedownService(serviceId: string, reason: string): Promise<ServiceItem> {
    const res = await fetch(`${API_BASE}/api/admin/services/${serviceId}/takedown`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ reason }),
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.message || 'Failed to take down service');
    }
    return json.data;
  },

  /**
   * Admin restores taken-down service
   */
  async restoreService(serviceId: string, reason?: string): Promise<ServiceItem> {
    const res = await fetch(`${API_BASE}/api/admin/services/${serviceId}/restore`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ reason }),
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.message || 'Failed to restore service');
    }
    return json.data;
  },
};
