import { useState, useEffect } from 'react';
import { servicesApi, type Service } from '../services/api';

export const useServices = (category?: string) => {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await servicesApi.getAll(category);
        setServices(data);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch services'));
        console.error('Error fetching services:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchServices();
  }, [category]);

  const refetch = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await servicesApi.getAll(category);
      setServices(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch services'));
      console.error('Error fetching services:', err);
    } finally {
      setLoading(false);
    }
  };

  return { services, loading, error, refetch };
};

export const useService = (id?: string) => {
  const [service, setService] = useState<Service | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }

    const fetchService = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await servicesApi.getById(id);
        setService(data);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch service'));
        console.error('Error fetching service:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchService();
  }, [id]);

  return { service, loading, error };
};
