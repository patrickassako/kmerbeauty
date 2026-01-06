import axios, { AxiosInstance } from 'axios';
import { config } from './config.js';

class ApiClient {
    private client: AxiosInstance;

    constructor() {
        this.client = axios.create({
            baseURL: config.apiBaseUrl,
            headers: {
                'Content-Type': 'application/json',
                'x-agent-key': config.agentKey,
            },
            timeout: 30000,
        });
    }

    // ============ SERVICES ============

    async searchServices(query: string) {
        const response = await this.client.get('/services/search', {
            params: { q: query },
        });
        return response.data;
    }

    async listServices(category?: string) {
        const response = await this.client.get('/services', {
            params: category ? { category } : {},
        });
        return response.data;
    }

    // ============ THERAPISTS ============

    async listTherapists(city?: string, quarter?: string, serviceId?: string) {
        const response = await this.client.get('/therapists', {
            params: { city, quarter, serviceId },
        });
        return response.data;
    }

    async getTherapist(id: string) {
        const response = await this.client.get(`/therapists/${id}`);
        return response.data;
    }

    async checkAvailability(therapistId: string) {
        const response = await this.client.get(`/therapists/${therapistId}/availability`);
        return response.data;
    }

    async getTherapistServices(therapistId: string) {
        const response = await this.client.get(`/therapists/${therapistId}/services`);
        return response.data;
    }

    // ============ BOOKINGS ============

    async createBooking(data: {
        customerPhone: string;
        customerName?: string;
        serviceIds: string[];
        therapistId?: string;
        salonId?: string;
        scheduledAt: string;
        city: string;
        quarter?: string;
        street?: string;
        notes?: string;
    }) {
        const response = await this.client.post('/bookings/agent', data);
        return response.data;
    }

    async getClientBookings(phone: string) {
        const response = await this.client.get(`/bookings/agent/client/${encodeURIComponent(phone)}`);
        return response.data;
    }

    async modifyBooking(bookingId: string, data: {
        scheduledAt?: string;
        notes?: string;
        quarter?: string;
        street?: string;
    }) {
        const response = await this.client.patch(`/bookings/agent/${bookingId}`, data);
        return response.data;
    }

    async cancelBooking(bookingId: string, reason?: string) {
        const response = await this.client.patch(`/bookings/agent/${bookingId}/cancel`, {
            reason: reason || 'Annulé via WhatsApp',
        });
        return response.data;
    }
}

export const apiClient = new ApiClient();
