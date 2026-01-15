import { useState, useEffect, useCallback } from 'react';
import { getFeaturedPackages, ServicePackage } from '../services/servicePackagesApi';

export function useServicePackages() {
    const [packages, setPackages] = useState<ServicePackage[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchPackages = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await getFeaturedPackages(6);
            setPackages(data);
        } catch (err: any) {
            console.error('Error fetching packages:', err);
            setError(err.message || 'Failed to fetch packages');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchPackages();
    }, [fetchPackages]);

    return {
        packages,
        loading,
        error,
        refresh: fetchPackages,
    };
}
