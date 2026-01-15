import api from './api';

// Types
export interface Story {
    id: string;
    therapistId?: string;
    salonId?: string;
    mediaType: 'IMAGE' | 'VIDEO' | 'TEXT';
    mediaUrl?: string;
    thumbnailUrl?: string;
    caption?: string;
    // Text-only story fields
    textContent?: string;
    backgroundColor?: string;
    textColor?: string;
    isActive: boolean;
    expiresAt: string;
    viewCount: number;
    createdAt: string;
    isViewed?: boolean;
    provider?: {
        id: string;
        name: string;
        image: string;
        type: 'therapist' | 'salon';
    };
}

export interface CreateStoryDto {
    mediaType: 'IMAGE' | 'VIDEO' | 'TEXT';
    mediaUrl?: string;
    thumbnailUrl?: string;
    caption?: string;
    // Text-only story fields
    textContent?: string;
    backgroundColor?: string;
    textColor?: string;
}

// API Functions
export const storiesApi = {
    /**
     * Get all active stories for home feed
     */
    async getAll(): Promise<Story[]> {
        const response = await api.get<Story[]>('/stories');
        return response.data;
    },

    /**
     * Get story by ID
     */
    async getById(id: string): Promise<Story> {
        const response = await api.get<Story>(`/stories/${id}`);
        return response.data;
    },

    /**
     * Get my stories (for provider)
     */
    async getMine(): Promise<Story[]> {
        const response = await api.get<Story[]>('/stories/my');
        return response.data;
    },

    /**
     * Create a new story (for provider)
     */
    async create(data: CreateStoryDto, providerType: 'therapist' | 'salon' = 'therapist'): Promise<Story> {
        const response = await api.post<Story>('/stories', data, {
            params: { providerType },
        });
        return response.data;
    },

    /**
     * Mark story as viewed
     */
    async markViewed(storyId: string): Promise<void> {
        await api.post(`/stories/${storyId}/view`);
    },

    /**
     * Delete story (owner only)
     */
    async delete(storyId: string): Promise<void> {
        await api.delete(`/stories/${storyId}`);
    },
};

export default storiesApi;
