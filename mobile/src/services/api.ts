import axios from 'axios';

// Configuration de l'API
// TODO: Mettre à jour avec l'URL réelle de votre backend
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
  },
  timeout: 10000,
});

// Intercepteur pour ajouter le token d'authentification et désactiver le cache
api.interceptors.request.use(
  (config) => {
    // TODO: Ajouter le token d'authentification depuis le store
    // const token = getToken();
    // if (token) {
    //   config.headers.Authorization = `Bearer ${token}`;
    // }

    // Désactiver le cache pour toutes les requêtes
    config.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate';
    config.headers['Pragma'] = 'no-cache';
    config.headers['Expires'] = '0';

    // Ajouter un timestamp pour éviter le cache du navigateur/app
    if (config.method === 'get') {
      config.params = {
        ...config.params,
        _t: Date.now(),
      };
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Types
export interface Service {
  id: string;
  name_fr: string;
  name_en: string;
  description_fr?: string;
  description_en?: string;
  category: string;
  images: string[];
  duration: number;
  base_price: number;
  purpose_fr?: string;
  purpose_en?: string;
  ideal_for_fr?: string;
  ideal_for_en?: string;
  provider_count?: number;
  created_at: string;
  updated_at: string;
}

export interface Therapist {
  id: string;
  user_id: string;
  bio_fr?: string;
  bio_en?: string;
  experience: number;
  is_licensed: boolean;
  license_number?: string;
  is_mobile: boolean;
  travel_radius: number;
  travel_fee: number;
  latitude: number;
  longitude: number;
  city: string;
  region: string;
  portfolio_images: string[];
  salon_id?: string;
  rating: number;
  review_count: number;
  booking_count: number;
  is_active: boolean;
  user?: {
    id: string;
    first_name: string;
    last_name: string;
    avatar?: string;
    phone: string;
    email?: string;
  };
  salon?: {
    id: string;
    name_fr: string;
    name_en: string;
    quarter?: string;
    city?: string;
  };
  education?: Array<{
    id: string;
    title: string;
    institution?: string;
    year?: number;
  }>;
}

export interface Salon {
  id: string;
  user_id: string;
  name_fr: string;
  name_en: string;
  description_fr?: string;
  description_en?: string;
  quarter: string;
  street?: string;
  landmark: string;
  city: string;
  region: string;
  latitude: number;
  longitude: number;
  logo?: string;
  cover_image?: string;
  ambiance_images: string[];
  established_year?: number;
  features?: any;
  opening_hours?: any;
  rating: number;
  review_count: number;
  service_count: number;
  is_active: boolean;
  is_verified: boolean;
  user?: {
    id: string;
    first_name: string;
    last_name: string;
    phone: string;
    email?: string;
  };
}

export interface TherapistService {
  service_id: string;
  therapist_id: string;
  price: number;
  duration: number;
  is_active: boolean;
  service: Service;
}

export interface SalonService {
  service_id: string;
  salon_id: string;
  price: number;
  duration: number;
  is_active: boolean;
  service: Service;
}

// =============================================
// Services API
// =============================================

export const servicesApi = {
  /**
   * Récupérer tous les services
   */
  getAll: async (category?: string): Promise<Service[]> => {
    const params = category ? { category } : {};
    const response = await api.get('/services', { params });
    return response.data;
  },

  /**
   * Récupérer un service par ID
   */
  getById: async (id: string): Promise<Service> => {
    const response = await api.get(`/services/${id}`);
    return response.data;
  },
};

// =============================================
// Therapists API
// =============================================

export const therapistsApi = {
  /**
   * Récupérer tous les thérapeutes
   */
  getAll: async (params?: { city?: string; serviceId?: string }): Promise<Therapist[]> => {
    const response = await api.get('/therapists', { params });
    return response.data;
  },

  /**
   * Récupérer un thérapeute par ID
   */
  getById: async (id: string): Promise<Therapist> => {
    const response = await api.get(`/therapists/${id}`);
    return response.data;
  },

  /**
   * Récupérer les services d'un thérapeute
   */
  getServices: async (id: string): Promise<TherapistService[]> => {
    const response = await api.get(`/therapists/${id}/services`);
    return response.data;
  },
};

// =============================================
// Salons API
// =============================================

export const salonsApi = {
  /**
   * Récupérer tous les salons
   */
  getAll: async (params?: { city?: string; serviceId?: string }): Promise<Salon[]> => {
    const response = await api.get('/salons', { params });
    return response.data;
  },

  /**
   * Récupérer un salon par ID
   */
  getById: async (id: string): Promise<Salon> => {
    const response = await api.get(`/salons/${id}`);
    return response.data;
  },

  /**
   * Récupérer les services d'un salon
   */
  getServices: async (id: string): Promise<SalonService[]> => {
    const response = await api.get(`/salons/${id}/services`);
    return response.data;
  },

  /**
   * Récupérer les thérapeutes d'un salon
   */
  getTherapists: async (id: string): Promise<Therapist[]> => {
    const response = await api.get(`/salons/${id}/therapists`);
    return response.data;
  },
};

// =============================================
// Categories API
// =============================================

export interface CategoryTranslation {
  category: string;
  name_fr: string;
  name_en: string;
  description_fr?: string;
  description_en?: string;
}

export const categoriesApi = {
  /**
   * Récupérer toutes les catégories avec leurs traductions
   */
  getAll: async (): Promise<CategoryTranslation[]> => {
    const response = await api.get('/categories');
    return response.data;
  },
};

// =============================================
// Bookings API
// =============================================

export interface BookingItem {
  id?: string;
  booking_id?: string;
  service_id: string;
  service_name: string;
  price: number;
  duration: number;
  created_at?: string;
}

export interface Booking {
  id: string;
  user_id: string;
  therapist_id?: string;
  salon_id?: string;
  scheduled_at: string;
  duration: number;
  location_type: 'AT_HOME' | 'AT_SALON';
  quarter?: string;
  street?: string;
  landmark?: string;
  city: string;
  region: string;
  latitude?: number;
  longitude?: number;
  instructions?: string;
  subtotal: number;
  travel_fee?: number;
  tip?: number;
  total: number;
  status: 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';
  notes?: string;
  cancelled_at?: string;
  cancel_reason?: string;
  created_at: string;
  updated_at: string;
  items?: BookingItem[];
  provider?: any;
}

export interface CreateBookingDto {
  user_id: string;
  therapist_id?: string;
  salon_id?: string;
  scheduled_at: string;
  duration: number;
  location_type: 'AT_HOME' | 'AT_SALON';
  quarter?: string;
  street?: string;
  landmark?: string;
  city: string;
  region: string;
  latitude?: number;
  longitude?: number;
  instructions?: string;
  subtotal: number;
  travel_fee?: number;
  tip?: number;
  total: number;
  notes?: string;
  items: BookingItem[];
}

export const bookingsApi = {
  /**
   * Créer une nouvelle réservation
   */
  create: async (data: CreateBookingDto): Promise<Booking> => {
    const response = await api.post('/bookings', data);
    return response.data;
  },

  /**
   * Récupérer toutes les réservations d'un utilisateur
   */
  getAll: async (userId?: string): Promise<Booking[]> => {
    const params = userId ? { userId } : undefined;
    const response = await api.get('/bookings', { params });
    return response.data;
  },

  /**
   * Récupérer une réservation par ID
   */
  getById: async (id: string): Promise<Booking> => {
    const response = await api.get(`/bookings/${id}`);
    return response.data;
  },
};

// Export de l'instance axios pour des usages personnalisés
export default api;
