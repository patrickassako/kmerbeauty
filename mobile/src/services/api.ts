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
  service?: {
    id: string;
    images: string[];
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

  /**
   * Annuler une réservation
   */
  cancel: async (id: string, reason?: string): Promise<Booking> => {
    const response = await api.patch(`/bookings/${id}/cancel`, { reason });
    return response.data;
  },
};

// =============================================
// Chat API
// =============================================

export interface ChatMessage {
  id: string;
  chat_id: string;
  sender_id: string;
  content: string;
  type: 'TEXT' | 'IMAGE' | 'VOICE' | 'SERVICE_SUGGESTION' | 'SYSTEM';
  attachments?: string[];
  reply_to_message_id?: string;
  duration_seconds?: number; // Pour les messages vocaux
  offer_data?: {
    service_name: string;
    description?: string;
    price: number;
    duration: number;
    custom_fields?: Record<string, any>;
  };
  is_read: boolean;
  read_at?: string;
  created_at: string;
}

export interface Chat {
  id: string;
  booking_id: string;
  client_id: string;
  provider_id: string;
  last_message?: string;
  last_message_at?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  unread_count?: number;
}

export interface SendMessageDto {
  sender_id: string;
  content: string;
  type?: 'TEXT' | 'IMAGE' | 'VOICE' | 'SERVICE_SUGGESTION' | 'SYSTEM';
  attachments?: string[];
  reply_to_message_id?: string;
  duration_seconds?: number;
  offer_data?: {
    service_name: string;
    description?: string;
    price: number;
    duration: number;
    custom_fields?: Record<string, any>;
  };
}

export interface ChatOffer {
  id: string;
  message_id: string;
  chat_id: string;
  service_name: string;
  description?: string;
  price: number;
  duration: number;
  custom_fields?: Record<string, any>;
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'EXPIRED';
  booking_id?: string;
  expires_at?: string;
  client_response?: string;
  responded_at?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateOfferDto {
  chat_id: string;
  sender_id: string;
  service_name: string;
  description?: string;
  price: number;
  duration: number;
  custom_fields?: Record<string, any>;
  expires_in_hours?: number;
}

// =============================================
// Reviews API
// =============================================

export interface Review {
  id: string;
  rating: number;
  comment?: string;
  cleanliness?: number;
  professionalism?: number;
  value?: number;
  created_at: string;
  user: {
    id: string;
    first_name: string;
    last_name: string;
    avatar?: string;
  };
}

export interface CreateReviewDto {
  user_id: string;
  therapist_id?: string;
  salon_id?: string;
  rating: number;
  comment?: string;
  cleanliness?: number;
  professionalism?: number;
  value?: number;
}

export const reviewsApi = {
  /**
   * Get reviews for a therapist
   */
  getTherapistReviews: async (therapistId: string): Promise<Review[]> => {
    const response = await api.get(`/reviews/therapist/${therapistId}`);
    return response.data;
  },

  /**
   * Get reviews for a salon
   */
  getSalonReviews: async (salonId: string): Promise<Review[]> => {
    const response = await api.get(`/reviews/salon/${salonId}`);
    return response.data;
  },

  /**
   * Create a new review
   */
  createReview: async (data: CreateReviewDto): Promise<Review> => {
    const response = await api.post('/reviews', data);
    return response.data;
  },
};

// =============================================
// Favorites API
// =============================================

export const favoritesApi = {
  /**
   * Check if a therapist is favorited
   */
  checkTherapistFavorite: async (userId: string, therapistId: string): Promise<boolean> => {
    const response = await api.get(`/favorites/check/therapist/${therapistId}`, {
      params: { userId },
    });
    return response.data.isFavorite;
  },

  /**
   * Check if a salon is favorited
   */
  checkSalonFavorite: async (userId: string, salonId: string): Promise<boolean> => {
    const response = await api.get(`/favorites/check/salon/${salonId}`, {
      params: { userId },
    });
    return response.data.isFavorite;
  },

  /**
   * Add therapist to favorites
   */
  addTherapistToFavorites: async (userId: string, therapistId: string) => {
    const response = await api.post('/favorites/therapist', {
      userId,
      therapistId,
    });
    return response.data;
  },

  /**
   * Add salon to favorites
   */
  addSalonToFavorites: async (userId: string, salonId: string) => {
    const response = await api.post('/favorites/salon', {
      userId,
      salonId,
    });
    return response.data;
  },

  /**
   * Remove therapist from favorites
   */
  removeTherapistFromFavorites: async (userId: string, therapistId: string) => {
    const response = await api.delete(`/favorites/therapist/${therapistId}`, {
      params: { userId },
    });
    return response.data;
  },

  /**
   * Remove salon from favorites
   */
  removeSalonFromFavorites: async (userId: string, salonId: string) => {
    const response = await api.delete(`/favorites/salon/${salonId}`, {
      params: { userId },
    });
    return response.data;
  },

  /**
   * Get all user favorites
   */
  getUserFavorites: async (userId: string) => {
    const response = await api.get(`/favorites/user/${userId}`);
    return response.data;
  },
};

// =============================================
// Chat API
// =============================================

export const chatApi = {
  /**
   * Get or create a chat for a booking
   */
  getOrCreateChatByBooking: async (bookingId: string): Promise<Chat> => {
    const response = await api.get(`/chat/booking/${bookingId}`);
    return response.data;
  },

  /**
   * Get or create a direct chat (without booking)
   */
  getOrCreateDirectChat: async (
    clientId: string,
    providerId: string,
    providerType: 'therapist' | 'salon',
  ): Promise<Chat> => {
    const response = await api.post('/chat/direct', {
      clientId,
      providerId,
      providerType,
    });
    return response.data;
  },

  /**
   * Get messages for a chat
   */
  getMessages: async (chatId: string, limit?: number, offset?: number): Promise<ChatMessage[]> => {
    const params: any = {};
    if (limit) params.limit = limit;
    if (offset) params.offset = offset;
    const response = await api.get(`/chat/${chatId}/messages`, { params });
    return response.data;
  },

  /**
   * Send a message in a chat
   */
  sendMessage: async (chatId: string, data: SendMessageDto): Promise<ChatMessage> => {
    const response = await api.post(`/chat/${chatId}/messages`, data);
    return response.data;
  },

  /**
   * Mark a message as read
   */
  markAsRead: async (messageId: string): Promise<ChatMessage> => {
    const response = await api.patch(`/chat/messages/${messageId}/read`);
    return response.data;
  },

  /**
   * Get all chats for a user
   */
  getUserChats: async (userId: string): Promise<Chat[]> => {
    const response = await api.get(`/chat/user/${userId}`);
    return response.data;
  },

  /**
   * Create a custom offer (service personnalisé)
   */
  createOffer: async (data: CreateOfferDto): Promise<{ message: ChatMessage; offer: ChatOffer }> => {
    const response = await api.post('/chat/offers', data);
    return response.data;
  },

  /**
   * Get offer details
   */
  getOffer: async (offerId: string): Promise<ChatOffer> => {
    const response = await api.get(`/chat/offers/${offerId}`);
    return response.data;
  },

  /**
   * Respond to an offer (accept or decline)
   */
  respondToOffer: async (
    offerId: string,
    status: 'ACCEPTED' | 'DECLINED',
    clientResponse?: string,
  ): Promise<ChatOffer> => {
    const response = await api.patch(`/chat/offers/${offerId}/respond`, {
      status,
      client_response: clientResponse,
    });
    return response.data;
  },

  /**
   * Get all offers for a chat
   */
  getChatOffers: async (chatId: string): Promise<ChatOffer[]> => {
    const response = await api.get(`/chat/${chatId}/offers`);
    return response.data;
  },
};

// =====================================================
// CONTRACTOR API
// =====================================================

export interface ServiceZone {
  location: {
    lat: number;
    lng: number;
    address: string;
  };
  radius: number;
}

export interface ContractorProfile {
  id: string;
  user_id: string;
  business_name?: string;
  siret_number?: string;
  legal_status?: string;
  qualifications_proof?: string[];
  professional_experience?: string;
  types_of_services?: string[];
  id_card_url?: string;
  insurance_url?: string;
  training_certificates?: string[];
  portfolio_images?: string[];
  confidentiality_accepted?: boolean;
  terms_accepted?: boolean;
  languages_spoken?: string[];
  available_transportation?: string[];
  service_zones?: ServiceZone[];
  total_bookings?: number;
  total_revenue?: number;
  average_rating?: number;
  profile_completed?: boolean;
  is_verified?: boolean;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
  user?: any;
}

export interface ContractorAvailability {
  id: string;
  contractor_id: string;
  day_of_week: number;
  is_working: boolean;
  start_time?: string;
  end_time?: string;
}

export interface ContractorBreak {
  id: string;
  contractor_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
}

export interface ContractorException {
  id: string;
  contractor_id: string;
  exception_date: string;
  is_available: boolean;
  start_time?: string;
  end_time?: string;
  reason?: string;
}

export interface ContractorService {
  id: string;
  contractor_id: string;
  service_id: string;
  price: number;
  duration: number;
  description?: string;
  is_active?: boolean;
  service?: Service;
  created_at?: string;
  updated_at?: string;
}

export interface DashboardStats {
  total_income: number;
  total_proposals: number;
  completed_bookings: number;
  total_clients: number;
  upcoming_appointments: number;
  earnings_chart?: Array<{ date: string; amount: number }>;
  bookings_chart?: Array<{ date: string; count: number }>;
  clients_chart?: Array<{ date: string; count: number }>;
}

export interface Proposal {
  id: string;
  client_id: string;
  contractor_id: string;
  service_name: string;
  description?: string;
  requested_date?: string;
  location?: {
    address: string;
    lat: number;
    lng: number;
  };
  proposed_price?: number;
  estimated_duration?: number;
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'CANCELLED' | 'EXPIRED';
  contractor_response?: string;
  responded_at?: string;
  expires_at?: string;
  created_at?: string;
  updated_at?: string;
  client?: any;
  contractor?: ContractorProfile;
}

export const contractorApi = {
  // Profile
  createProfile: async (data: Partial<ContractorProfile>): Promise<ContractorProfile> => {
    const response = await api.post('/contractors/profile', data);
    return response.data;
  },

  getProfileByUserId: async (userId: string): Promise<ContractorProfile | null> => {
    try {
      const response = await api.get(`/contractors/profile/user/${userId}`);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) return null;
      throw error;
    }
  },

  getProfile: async (contractorId: string): Promise<ContractorProfile> => {
    const response = await api.get(`/contractors/profile/${contractorId}`);
    return response.data;
  },

  updateProfile: async (userId: string, data: Partial<ContractorProfile>): Promise<ContractorProfile> => {
    const response = await api.put(`/contractors/profile/${userId}`, data);
    return response.data;
  },

  listContractors: async (filters?: {
    types_of_services?: string[];
    is_verified?: boolean;
  }): Promise<ContractorProfile[]> => {
    const params: any = {};
    if (filters?.types_of_services) {
      params.types_of_services = filters.types_of_services.join(',');
    }
    if (filters?.is_verified !== undefined) {
      params.is_verified = filters.is_verified.toString();
    }
    const response = await api.get('/contractors', { params });
    return response.data;
  },

  // Availability
  setAvailability: async (data: Partial<ContractorAvailability>): Promise<ContractorAvailability> => {
    const response = await api.post('/contractors/availability', data);
    return response.data;
  },

  getAvailability: async (contractorId: string): Promise<ContractorAvailability[]> => {
    const response = await api.get(`/contractors/${contractorId}/availability`);
    return response.data;
  },

  updateAvailability: async (
    contractorId: string,
    dayOfWeek: number,
    data: Partial<ContractorAvailability>
  ): Promise<ContractorAvailability> => {
    const response = await api.put(`/contractors/${contractorId}/availability/${dayOfWeek}`, data);
    return response.data;
  },

  resetAvailability: async (contractorId: string): Promise<ContractorAvailability[]> => {
    const response = await api.post(`/contractors/${contractorId}/availability/reset`);
    return response.data;
  },

  // Breaks
  addBreak: async (data: Partial<ContractorBreak>): Promise<ContractorBreak> => {
    const response = await api.post('/contractors/breaks', data);
    return response.data;
  },

  getBreaks: async (contractorId: string): Promise<ContractorBreak[]> => {
    const response = await api.get(`/contractors/${contractorId}/breaks`);
    return response.data;
  },

  deleteBreak: async (breakId: string): Promise<{ success: boolean }> => {
    const response = await api.delete(`/contractors/breaks/${breakId}`);
    return response.data;
  },

  // Exceptions
  addException: async (data: Partial<ContractorException>): Promise<ContractorException> => {
    const response = await api.post('/contractors/exceptions', data);
    return response.data;
  },

  getExceptions: async (
    contractorId: string,
    startDate?: string,
    endDate?: string
  ): Promise<ContractorException[]> => {
    const params: any = {};
    if (startDate) params.start_date = startDate;
    if (endDate) params.end_date = endDate;
    const response = await api.get(`/contractors/${contractorId}/exceptions`, { params });
    return response.data;
  },

  deleteException: async (exceptionId: string): Promise<{ success: boolean }> => {
    const response = await api.delete(`/contractors/exceptions/${exceptionId}`);
    return response.data;
  },

  // Services
  addService: async (data: Partial<ContractorService>): Promise<ContractorService> => {
    const response = await api.post('/contractors/services', data);
    return response.data;
  },

  getServices: async (contractorId: string): Promise<ContractorService[]> => {
    const response = await api.get(`/contractors/${contractorId}/services`);
    return response.data;
  },

  updateService: async (
    serviceId: string,
    data: Partial<ContractorService>
  ): Promise<ContractorService> => {
    const response = await api.put(`/contractors/services/${serviceId}`, data);
    return response.data;
  },

  deleteService: async (serviceId: string): Promise<{ success: boolean }> => {
    const response = await api.delete(`/contractors/services/${serviceId}`);
    return response.data;
  },

  // Dashboard
  getDashboard: async (
    contractorId: string,
    startDate?: string,
    endDate?: string
  ): Promise<DashboardStats> => {
    const params: any = {};
    if (startDate) params.start_date = startDate;
    if (endDate) params.end_date = endDate;
    const response = await api.get(`/contractors/${contractorId}/dashboard`, { params });
    return response.data;
  },

  getUpcomingAppointments: async (contractorId: string, day?: string): Promise<Booking[]> => {
    const params: any = {};
    if (day) params.day = day;
    const response = await api.get(`/contractors/${contractorId}/appointments`, { params });
    return response.data;
  },

  getEarnings: async (
    contractorId: string,
    startDate?: string,
    endDate?: string
  ): Promise<any[]> => {
    const params: any = {};
    if (startDate) params.start_date = startDate;
    if (endDate) params.end_date = endDate;
    const response = await api.get(`/contractors/${contractorId}/earnings`, { params });
    return response.data;
  },

  checkAvailability: async (
    contractorId: string,
    dateTime: string,
    duration: number
  ): Promise<{ available: boolean }> => {
    const response = await api.post(`/contractors/${contractorId}/check-availability`, {
      date_time: dateTime,
      duration,
    });
    return response.data;
  },
};

// =====================================================
// PROPOSAL API
// =====================================================

export const proposalApi = {
  create: async (data: Partial<Proposal>): Promise<Proposal> => {
    const response = await api.post('/proposals', data);
    return response.data;
  },

  getById: async (proposalId: string): Promise<Proposal> => {
    const response = await api.get(`/proposals/${proposalId}`);
    return response.data;
  },

  getForClient: async (clientId: string, status?: string): Promise<Proposal[]> => {
    const params: any = {};
    if (status) params.status = status;
    const response = await api.get(`/proposals/client/${clientId}`, { params });
    return response.data;
  },

  getForContractor: async (contractorId: string, status?: string): Promise<Proposal[]> => {
    const params: any = {};
    if (status) params.status = status;
    const response = await api.get(`/proposals/contractor/${contractorId}`, { params });
    return response.data;
  },

  respond: async (
    proposalId: string,
    status: 'ACCEPTED' | 'DECLINED',
    response?: string,
    proposedPrice?: number,
    estimatedDuration?: number
  ): Promise<Proposal> => {
    const data: any = { status };
    if (response) data.contractor_response = response;
    if (proposedPrice !== undefined) data.proposed_price = proposedPrice;
    if (estimatedDuration !== undefined) data.estimated_duration = estimatedDuration;
    const res = await api.patch(`/proposals/${proposalId}/respond`, data);
    return res.data;
  },

  update: async (proposalId: string, data: Partial<Proposal>): Promise<Proposal> => {
    const response = await api.put(`/proposals/${proposalId}`, data);
    return response.data;
  },

  cancel: async (proposalId: string, userId: string): Promise<Proposal> => {
    const response = await api.patch(`/proposals/${proposalId}/cancel`, { user_id: userId });
    return response.data;
  },

  expireOld: async (): Promise<Proposal[]> => {
    const response = await api.post('/proposals/expire-old');
    return response.data;
  },
};

// Export de l'instance axios pour des usages personnalisés
export default api;
