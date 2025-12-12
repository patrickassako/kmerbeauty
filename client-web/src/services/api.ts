import axios, { InternalAxiosRequestConfig } from 'axios';
import { createClient } from '@/lib/supabase';

// Configuration de l'API
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

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
    async (config: InternalAxiosRequestConfig) => {
        // Ajouter le token d'authentification depuis Supabase
        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();

        if (session?.access_token) {
            config.headers.Authorization = `Bearer ${session.access_token}`;
        }

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
    components?: string[];
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
// Contractor API
// =============================================

export interface DashboardStats {
    total_income: number;
    upcoming_appointments: number;
    total_clients: number;
    completed_bookings: number;
    total_proposals: number;
    earnings_chart?: Array<{ date: string; amount: number }>;
}

export interface ContractorService {
    id: string;
    service_id: string;
    contractor_id: string;
    price: number;
    duration: number;
    is_active: boolean;
    service?: Service;
}

export const contractorApi = {

    createProfile: async (data: any) => {
        const response = await api.post('/contractors/profile', data);
        return response.data;
    },

    updateProfile: async (userId: string, data: any) => {
        const response = await api.put(`/contractors/profile/${userId}`, data);
        return response.data;
    },

    uploadFile: async (file: File, userId: string, fileType: string) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('userId', userId);
        formData.append('fileType', fileType);

        const response = await api.post('/contractors/upload', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    },

    checkAvailability: async (contractorId: string, dateTime: string, duration: number) => {
        const response = await api.post(`/contractors/${contractorId}/check-availability`, {
            date_time: dateTime,
            duration,
        });
        return response.data;
    },

    getProfileByUserId: async (userId: string) => {
        const response = await api.get(`/contractors/profile/user/${userId}`);
        return response.data;
    },

    getDashboard: async (contractorId: string): Promise<DashboardStats> => {
        const response = await api.get(`/contractors/${contractorId}/dashboard`);
        return response.data;
    },

    getServices: async (contractorId: string): Promise<ContractorService[]> => {
        const response = await api.get(`/contractors/${contractorId}/services`);
        return response.data;
    },

    addService: async (data: { contractor_id: string; service_id: string; price: number; duration: number }) => {
        const response = await api.post('/contractors/services', data);
        return response.data;
    },

    updateService: async (id: string, data: { price: number; duration: number }) => {
        const response = await api.put(`/contractors/services/${id}`, data);
        return response.data;
    },

    deleteService: async (id: string) => {
        const response = await api.delete(`/contractors/services/${id}`);
        return response.data;
    },

    getUpcomingAppointments: async (contractorId: string, day?: string) => {
        const response = await api.get(`/contractors/${contractorId}/appointments`, { params: { status: 'upcoming', day } });
        return response.data;
    },

    getEarnings: async (contractorId: string, period: 'week' | 'month' | 'year' = 'month') => {
        const response = await api.get(`/contractors/${contractorId}/earnings`, { params: { period } });
        return response.data;
    }
};

// =============================================
// Credits API
// =============================================

export const creditsApi = {
    getBalance: async (providerId: string, providerType: 'therapist' | 'salon') => {
        const response = await api.get(`/credits/balance/${providerId}`, { params: { type: providerType } });
        return response.data;
    },

    getPacks: async () => {
        const response = await api.get('/credits/packs');
        return response.data;
    }
};

// =============================================
// Services API
// =============================================

export const servicesApi = {
    getAll: async (category?: string): Promise<Service[]> => {
        const params = category ? { category } : {};
        const response = await api.get('/services', { params });
        return response.data;
    },

    getById: async (id: string): Promise<Service> => {
        const response = await api.get(`/services/${id}`);
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
    service_image?: string;
    service?: {
        id: string;
        images: string[];
        name_fr?: string;
        name_en?: string;
        name?: string;
    };
}

export interface Booking {
    id: string;
    user_id: string;
    therapist_id?: string;
    salon_id?: string;
    scheduled_at: string;
    duration: number;
    location_type: 'HOME' | 'SALON';
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
    status: 'PENDING' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
    notes?: string;
    items?: BookingItem[];
    client?: {
        id: string;
        first_name: string;
        last_name: string;
        email?: string;
        phone?: string;
        profile_picture?: string;
        avatar?: string;
    };
    service?: {
        name: string;
    }
}

export const bookingsApi = {
    getForContractor: async (contractorId: string, status?: string): Promise<Booking[]> => {
        const params = status ? { status } : undefined;
        const response = await api.get(`/bookings/contractor/${contractorId}`, { params });
        return response.data;
    },

    getById: async (id: string): Promise<Booking> => {
        const response = await api.get(`/bookings/${id}`);
        return response.data;
    },

    cancel: async (id: string, reason?: string) => {
        const response = await api.post(`/bookings/${id}/cancel`, { reason });
        return response.data;
    },

    confirm: async (id: string) => {
        const response = await api.patch(`/bookings/${id}/confirm`);
        return response.data;
    },

    start: async (id: string) => {
        const response = await api.patch(`/bookings/${id}/start`);
        return response.data;
    },

    complete: async (id: string) => {
        const response = await api.post(`/bookings/${id}/complete`);
        return response.data;
    }
};

export const marketplaceApi = {
    getMyProducts: async () => {
        const response = await api.get('/marketplace/my-products');
        return response.data;
    },

    getProductById: async (id: string) => {
        const response = await api.get(`/marketplace/products/${id}`);
        return response.data;
    },

    createProduct: async (data: any) => {
        const response = await api.post('/marketplace/products', data);
        return response.data;
    },

    updateProduct: async (id: string, data: any) => {
        const response = await api.patch(`/marketplace/products/${id}`, data);
        return response.data;
    },

    deleteProduct: async (id: string) => {
        const response = await api.delete(`/marketplace/products/${id}`);
        return response.data;
    },

    uploadFile: async (file: File, userId: string, fileType: 'product' | 'video' = 'product') => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('userId', userId);
        formData.append('fileType', fileType);

        const response = await api.post('/marketplace/upload', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    }
};

export default api;
