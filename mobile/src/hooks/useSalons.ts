import { useState, useEffect } from 'react';
import { salonsApi, type Salon, type SalonService, type Therapist } from '../services/api';

interface UseSalonsParams {
  city?: string;
  serviceId?: string;
}

export const useSalons = (params?: UseSalonsParams) => {
  const [salons, setSalons] = useState<Salon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchSalons = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await salonsApi.getAll(params);
        setSalons(data);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch salons'));
        console.error('Error fetching salons:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchSalons();
  }, [params?.city, params?.serviceId]);

  const refetch = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await salonsApi.getAll(params);
      setSalons(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch salons'));
      console.error('Error fetching salons:', err);
    } finally {
      setLoading(false);
    }
  };

  return { salons, loading, error, refetch };
};

export const useSalon = (id?: string) => {
  const [salon, setSalon] = useState<Salon | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }

    const fetchSalon = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await salonsApi.getById(id);
        setSalon(data);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch salon'));
        console.error('Error fetching salon:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchSalon();
  }, [id]);

  return { salon, loading, error };
};

export const useSalonServices = (salonId?: string) => {
  const [services, setServices] = useState<SalonService[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!salonId) {
      setLoading(false);
      return;
    }

    const fetchServices = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await salonsApi.getServices(salonId);
        setServices(data);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch salon services'));
        console.error('Error fetching salon services:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchServices();
  }, [salonId]);

  return { services, loading, error };
};

export const useSalonTherapists = (salonId?: string) => {
  const [therapists, setTherapists] = useState<Therapist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!salonId) {
      setLoading(false);
      return;
    }

    const fetchTherapists = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await salonsApi.getTherapists(salonId);
        setTherapists(data);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch salon therapists'));
        console.error('Error fetching salon therapists:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchTherapists();
  }, [salonId]);

  return { therapists, loading, error };
};
