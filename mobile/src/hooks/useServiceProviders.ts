import { useState, useEffect } from 'react';
import { servicesApi } from '../services/api';

interface UseServiceProvidersParams {
    serviceId: string;
    lat?: number;
    lng?: number;
    city?: string;
    district?: string;
    radius?: number;
}

export const useServiceProviders = (params: UseServiceProvidersParams) => {
    const [providers, setProviders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const fetchProviders = async () => {
        try {
            setLoading(true);
            setError(null);

            // Even if lat/lng are missing, we pass them (as 0 or undefined) 
            // because the backend RPC handles nulls gracefully for city/district matching
            const data = await servicesApi.getNearbyProviders(params.serviceId, {
                lat: params.lat || 0,
                lng: params.lng || 0,
                radius: params.radius,
                city: params.city,
                district: params.district,
            });
            setProviders(data);
        } catch (err) {
            setError(err instanceof Error ? err : new Error('Failed to fetch providers'));
            console.error('Error fetching providers:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProviders();
    }, [params.serviceId, params.lat, params.lng, params.city, params.district]);

    return { providers, loading, error, refetch: fetchProviders };
};
