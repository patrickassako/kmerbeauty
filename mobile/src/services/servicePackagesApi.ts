import api from './api';

export interface ServicePackage {
    id: string;
    nameFr: string;
    nameEn: string;
    descriptionFr?: string;
    descriptionEn?: string;
    category: string;
    images: string[];
    basePrice: number;
    baseDuration: number;
    priority: number;
    isActive: boolean;
    services?: {
        id: string;
        nameFr: string;
        nameEn: string;
        images: string[];
        sequence: number;
    }[];
    // Salon-specific pricing (when applicable)
    salonPrice?: number;
    salonDuration?: number;
}

/**
 * Get all active service packages
 */
export const getAllPackages = async (category?: string): Promise<ServicePackage[]> => {
    const params = category ? { category } : {};
    const { data } = await api.get('/service-packages', { params });
    return data;
};

/**
 * Get featured/special offer packages
 */
export const getFeaturedPackages = async (limit: number = 5): Promise<ServicePackage[]> => {
    const { data } = await api.get('/service-packages/featured', { params: { limit } });
    return data;
};

/**
 * Get package by ID
 */
export const getPackageById = async (id: string): Promise<ServicePackage> => {
    const { data } = await api.get(`/service-packages/${id}`);
    return data;
};

/**
 * Get packages offered by a salon
 */
export const getPackagesBySalon = async (salonId: string): Promise<ServicePackage[]> => {
    const { data } = await api.get(`/service-packages/salon/${salonId}`);
    return data;
};

/**
 * Get packages offered by a therapist
 */
export const getPackagesByTherapist = async (therapistId: string): Promise<ServicePackage[]> => {
    const { data } = await api.get(`/service-packages/therapist/${therapistId}`);
    return data;
};

export default {
    getAllPackages,
    getFeaturedPackages,
    getPackageById,
    getPackagesBySalon,
    getPackagesByTherapist,
};
