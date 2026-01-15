import { useState, useEffect, useCallback } from 'react';
import { packsApi, type PromotionalPack } from '../services/packsApi';

interface UsePacksResult {
    packs: PromotionalPack[];
    loading: boolean;
    error: string | null;
    refetch: () => Promise<void>;
    trackClick: (packId: string) => Promise<void>;
}

export const usePacks = (city?: string): UsePacksResult => {
    const [packs, setPacks] = useState<PromotionalPack[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchPacks = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await packsApi.getAll(city);
            setPacks(data);
        } catch (err) {
            console.error('Error fetching packs:', err);
            setError('Failed to load promotional packs');
        } finally {
            setLoading(false);
        }
    }, [city]);

    const trackClick = useCallback(async (packId: string) => {
        try {
            await packsApi.trackClick(packId);
        } catch (err) {
            console.error('Error tracking pack click:', err);
        }
    }, []);

    useEffect(() => {
        fetchPacks();
    }, [fetchPacks]);

    return {
        packs,
        loading,
        error,
        refetch: fetchPacks,
        trackClick,
    };
};

export default usePacks;
