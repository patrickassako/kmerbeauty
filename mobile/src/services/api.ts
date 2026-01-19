import axios, { InternalAxiosRequestConfig } from 'axios';
import * as SecureStore from 'expo-secure-store';

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
  async (config: InternalAxiosRequestConfig) => {
    // Ajouter le token d'authentification depuis le store
    const token = await SecureStore.getItemAsync('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
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

// Types re-exported from models
export * from '../types/models';

import {
  Service,
  Therapist,
  TherapistService,
  Salon,
  SalonService,
  CategoryTranslation,
  Booking,
  BookingItem,
  CreateBookingDto,
  Chat,
  ChatMessage,
  SendMessageDto,
  ChatOffer,
  CreateOfferDto,
  Review,
  CreateReviewDto,
  ContractorProfile,
  ContractorAvailability,
  ContractorBreak,
  ContractorException,
  ContractorService,
  ServiceZone,
  IdCardUrls,
  DashboardStats,
  Proposal,
} from '../types/models';

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

  /**
   * Récupérer les prestataires à proximité pour un service
   */
  getNearbyProviders: async (
    serviceId: string,
    params: {
      lat: number;
      lng: number;
      radius?: number;
      city?: string;
      district?: string;
    }
  ): Promise<any[]> => {
    const response = await api.get(`/services/${serviceId}/providers/nearby`, { params });
    return response.data;
  },

  getAllNearbyProviders: async (
    params: {
      lat: number;
      lng: number;
      radius?: number;
      city?: string;
      district?: string;
    }
  ): Promise<any[]> => {
    const response = await api.get('/services/nearby-providers', { params });
    return response.data;
  },
};

// =============================================
// Service Packages API
// =============================================

export const servicePackagesApi = {
  /**
   * Récupérer tous les packages
   */
  getAll: async (): Promise<any[]> => {
    const response = await api.get('/service-packages');
    return response.data;
  },

  getById: async (id: string): Promise<any> => {
    const response = await api.get(`/service-packages/${id}`);
    return response.data;
  },
};

// =============================================

export const reviewsApi = {
  /**
   * Récupérer les avis d'un thérapeute
   */
  getTherapistReviews: async (therapistId: string): Promise<Review[]> => {
    const response = await api.get(`/reviews/therapist/${therapistId}`);
    return response.data;
  },

  /**
   * Récupérer les avis d'un salon
   */
  getSalonReviews: async (salonId: string): Promise<Review[]> => {
    const response = await api.get(`/reviews/salon/${salonId}`);
    return response.data;
  },

  /**
   * Créer un nouvel avis
   */
  create: async (data: CreateReviewDto): Promise<Review> => {
    const response = await api.post('/reviews', data);
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

  /**
   * Récupérer les disponibilités d'un thérapeute
   */
  getAvailability: async (id: string, date: string): Promise<string[]> => {
    const response = await api.get(`/therapists/${id}/availability`, {
      params: { date },
    });
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

  /**
   * Récupérer les disponibilités d'un salon
   */
  getAvailability: async (id: string, date: string): Promise<string[]> => {
    const response = await api.get(`/salons/${id}/availability`, {
      params: { date },
    });
    return response.data;
  },
};

// =============================================
// Categories API
// =============================================

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

  /**
   * Récupérer les réservations d'un prestataire
   */
  getForContractor: async (contractorId: string, status?: string): Promise<Booking[]> => {
    const params = status ? { status } : undefined;
    const response = await api.get(`/bookings/contractor/${contractorId}`, { params });
    return response.data;
  },

  /**
   * Confirmer une réservation
   */
  confirm: async (id: string): Promise<Booking> => {
    const response = await api.patch(`/bookings/${id}/confirm`);
    return response.data;
  },

  /**
   * Décliner une réservation
   */
  decline: async (id: string, reason: string): Promise<Booking> => {
    const response = await api.patch(`/bookings/${id}/decline`, { reason });
    return response.data;
  },

  /**
   * Marquer une réservation comme terminée
   */
  complete: async (id: string): Promise<Booking> => {
    const response = await api.patch(`/bookings/${id}/complete`);
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
   * Get chat details by ID
   */
  getChatById: async (chatId: string): Promise<Chat> => {
    const response = await api.get(`/chat/details/${chatId}`);
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

  uploadFile: async (fileUri: string, userId: string, fileType: string): Promise<{ url: string }> => {
    const formData = new FormData();

    // Convert file URI to blob for React Native
    const filename = fileUri.split('/').pop() || 'file';
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : 'image/jpeg';

    formData.append('file', {
      uri: fileUri,
      name: filename,
      type,
    } as any);
    formData.append('userId', userId);
    formData.append('fileType', fileType);

    const response = await api.post('/contractors/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
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

  // Packages
  addPackage: async (data: { contractor_id: string; package_id: string; price: number; duration: number }): Promise<any> => {
    const response = await api.post('/contractors/packages', data);
    return response.data;
  },

  getPackages: async (contractorId: string): Promise<any[]> => {
    const response = await api.get(`/contractors/${contractorId}/packages`);
    return response.data;
  },

  updatePackage: async (packageId: string, data: { price?: number; duration?: number }): Promise<any> => {
    const response = await api.put(`/contractors/packages/${packageId}`, data);
    return response.data;
  },

  deletePackage: async (packageId: string): Promise<{ success: boolean }> => {
    const response = await api.delete(`/contractors/packages/${packageId}`);
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

// =====================================================
// CREDITS API
// =====================================================

export interface CreditPack {
  id: string;
  name: string;
  credits: number;
  bonus_credits: number;
  price_fcfa: number;
  discount_percentage: number;
  display_order: number;
  active: boolean;
}

export interface CreditBalance {
  id: string;
  provider_id: string;
  provider_type: 'therapist' | 'salon';
  balance: number;
  total_earned: number;
  total_spent: number;
  monthly_credits_last_given: string;
  created_at: string;
  updated_at: string;
}

export interface CreditTransaction {
  id: string;
  provider_id: string;
  provider_type: 'therapist' | 'salon';
  amount: number;
  transaction_type: string;
  reference_id?: string;
  balance_before: number;
  balance_after: number;
  metadata?: any;
  created_at: string;
}

export const creditsApi = {
  getBalance: async (providerId: string, providerType: 'therapist' | 'salon'): Promise<CreditBalance> => {
    const response = await api.get(`/credits/balance/${providerId}`, {
      params: { type: providerType },
    });
    return response.data;
  },

  getPacks: async (): Promise<CreditPack[]> => {
    const response = await api.get('/credits/packs');
    return response.data;
  },

  getTransactions: async (
    providerId: string,
    providerType: 'therapist' | 'salon',
    page: number = 1,
    limit: number = 20
  ): Promise<{ data: CreditTransaction[]; count: number }> => {
    const response = await api.get(`/credits/transactions/${providerId}`, {
      params: { type: providerType, page, limit },
    });
    return response.data;
  },

  initiatePurchase: async (params: {
    amount: number;
    currency: string;
    email: string;
    phoneNumber: string;
    name: string;
    providerId: string;
    providerType: 'therapist' | 'salon';
    packId: string;
    redirectUrl: string;
    paymentMethod?: 'orange_money' | 'mtn_momo' | 'card';
  }): Promise<{ link?: string; transactionId?: string; status?: string; message?: string }> => {
    const response = await api.post('/payments/initiate', params);
    return response.data;
  },
};

// =============================================
// Marketplace API
// =============================================
export const marketplaceApi = {
  // Products
  getProducts: async (filters?: {
    category?: string;
    city?: string;
    min_price?: number;
    max_price?: number;
    search?: string;
    page?: number;
    limit?: number;
  }) => {
    const response = await api.get('/marketplace/products', { params: filters });
    return response.data;
  },

  getProductById: async (id: string) => {
    const response = await api.get(`/marketplace/products/${id}`);
    return response.data;
  },

  getMyProducts: async () => {
    const response = await api.get('/marketplace/my-products');
    return response.data;
  },

  createProduct: async (data: {
    name: string;
    description?: string;
    category: string;
    price: number;
    stock_quantity: number;
    images?: string[];
    video_url?: string;
    city?: string;
  }) => {
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

  // Orders
  createOrder: async (data: {
    product_id: string;
    quantity: number;
    delivery_method: 'delivery' | 'pickup';
    payment_method?: 'cash_on_delivery' | 'cash_on_pickup';
    delivery_address?: string;
    delivery_phone?: string;
    delivery_notes?: string;
  }) => {
    const response = await api.post('/marketplace/orders', data);
    return response.data;
  },

  getOrders: async (role: 'buyer' | 'seller' = 'buyer') => {
    const response = await api.get('/marketplace/orders', { params: { role } });
    return response.data;
  },

  getOrderById: async (id: string) => {
    const response = await api.get(`/marketplace/orders/${id}`);
    return response.data;
  },

  updateOrderStatus: async (id: string, data: { status?: string; payment_status?: string }) => {
    const response = await api.patch(`/marketplace/orders/${id}/status`, data);
    return response.data;
  },

  // Comments
  getComments: async (productId: string) => {
    const response = await api.get(`/marketplace/products/${productId}/comments`);
    return response.data;
  },

  getProductComments: async (productId: string) => {
    const response = await api.get(`/marketplace/products/${productId}/comments`);
    return response.data;
  },

  createComment: async (productId: string, comment: string) => {
    const response = await api.post(`/marketplace/products/${productId}/comments`, { comment });
    return response.data;
  },

  // Reviews
  getProductReviews: async (productId: string) => {
    const response = await api.get(`/marketplace/products/${productId}/reviews`);
    return response.data;
  },

  replyToComment: async (commentId: string, seller_reply: string) => {
    const response = await api.patch(`/marketplace/comments/${commentId}/reply`, { seller_reply });
    return response.data;
  },

  // Reviews
  getReviews: async (productId: string) => {
    const response = await api.get(`/marketplace/products/${productId}/reviews`);
    return response.data;
  },

  createReview: async (productId: string, data: { order_id: string; rating: number; review_text?: string }) => {
    const response = await api.post(`/marketplace/products/${productId}/reviews`, data);
    return response.data;
  },

  replyToReview: async (reviewId: string, seller_reply: string) => {
    const response = await api.patch(`/marketplace/reviews/${reviewId}/reply`, { seller_reply });
    return response.data;
  },

  // Messages
  getConversations: async (productId?: string) => {
    const response = await api.get('/marketplace/messages', { params: { product_id: productId } });
    return response.data;
  },

  sendMessage: async (data: { product_id: string; receiver_id: string; message: string }) => {
    const response = await api.post('/marketplace/messages', data);
    return response.data;
  },

  markAsRead: async (messageId: string) => {
    const response = await api.patch(`/marketplace/messages/${messageId}/read`);
    return response.data;
  },

  // Upload file to Supabase Storage
  uploadFile: async (fileUri: string, userId: string, fileType: 'product' | 'video'): Promise<{ url: string }> => {
    const formData = new FormData();

    const filename = fileUri.split('/').pop() || 'file';
    const match = /\.(\w+)$/.exec(filename);
    const type = fileType === 'video' ? `video/${match?.[1] || 'mp4'}` : `image/${match?.[1] || 'jpeg'}`;

    formData.append('file', {
      uri: fileUri,
      name: filename,
      type,
    } as any);
    formData.append('userId', userId);
    formData.append('fileType', fileType);

    const response = await api.post('/marketplace/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
};

// Export de l'instance axios pour des usages personnalisés
export default api;
