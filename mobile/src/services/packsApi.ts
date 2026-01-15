import api from './api';

// Types
export interface PromotionalPack {
    id: string;
    therapistId?: string;
    salonId?: string;
    title: string;
    subtitle?: string;
    description?: string;
    imageUrl: string;
    badge?: string;
    ctaText: string;
    ctaLink?: string;
    serviceId?: string;
    discountType?: 'PERCENTAGE' | 'FIXED_AMOUNT';
    discountValue?: number;
    startDate: string;
    endDate?: string;
    isActive: boolean;
    targetCities: string[];
    viewCount: number;
    clickCount: number;
    createdAt: string;
    provider?: {
        id: string;
        name: string;
        image: string;
        type: 'therapist' | 'salon';
    };
}

export interface CreatePackDto {
    title: string;
    subtitle?: string;
    description?: string;
    imageUrl: string;
    badge?: string;
    ctaText?: string;
    ctaLink?: string;
    serviceId?: string;
    discountType?: 'PERCENTAGE' | 'FIXED_AMOUNT';
    discountValue?: number;
    endDate?: string;
    targetCities?: string[];
}

export interface UpdatePackDto extends Partial<CreatePackDto> {
    isActive?: boolean;
}

// API Functions
export const packsApi = {
    /**
     * Get all active promotional packs
     */
    async getAll(city?: string): Promise<PromotionalPack[]> {
        const response = await api.get<PromotionalPack[]>('/packs', {
            params: city ? { city } : undefined,
        });
        return response.data;
    },

    /**
     * Get pack by ID
     */
    async getById(id: string): Promise<PromotionalPack> {
        const response = await api.get<PromotionalPack>(`/packs/${id}`);
        return response.data;
    },

    /**
     * Get my packs (for provider)
     */
    async getMine(): Promise<PromotionalPack[]> {
        const response = await api.get<PromotionalPack[]>('/packs/my');
        return response.data;
    },

    /**
     * Create a new pack (for provider)
     */
    async create(data: CreatePackDto, providerType: 'therapist' | 'salon' = 'therapist'): Promise<PromotionalPack> {
        const response = await api.post<PromotionalPack>('/packs', data, {
            params: { providerType },
        });
        return response.data;
    },

    /**
     * Update pack
     */
    async update(id: string, data: UpdatePackDto): Promise<PromotionalPack> {
        const response = await api.put<PromotionalPack>(`/packs/${id}`, data);
        return response.data;
    },

    /**
     * Track pack click
     */
    async trackClick(id: string): Promise<void> {
        await api.post(`/packs/${id}/click`);
    },

    /**
     * Delete pack (owner only)
     */
    async delete(id: string): Promise<void> {
        await api.delete(`/packs/${id}`);
    },
};

export default packsApi;
