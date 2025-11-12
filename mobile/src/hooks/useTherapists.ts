import { useState, useEffect } from 'react';
import { therapistsApi, type Therapist, type TherapistService } from '../services/api';

interface UseTherapistsParams {
  city?: string;
  serviceId?: string;
}

export const useTherapists = (params?: UseTherapistsParams) => {
  const [therapists, setTherapists] = useState<Therapist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchTherapists = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await therapistsApi.getAll(params);
        setTherapists(data);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch therapists'));
        console.error('Error fetching therapists:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchTherapists();
  }, [params?.city, params?.serviceId]);

  const refetch = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await therapistsApi.getAll(params);
      setTherapists(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch therapists'));
      console.error('Error fetching therapists:', err);
    } finally {
      setLoading(false);
    }
  };

  return { therapists, loading, error, refetch };
};

export const useTherapist = (id?: string) => {
  const [therapist, setTherapist] = useState<Therapist | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }

    const fetchTherapist = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await therapistsApi.getById(id);
        setTherapist(data);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch therapist'));
        console.error('Error fetching therapist:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchTherapist();
  }, [id]);

  return { therapist, loading, error };
};

export const useTherapistServices = (therapistId?: string) => {
  const [services, setServices] = useState<TherapistService[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!therapistId) {
      setLoading(false);
      return;
    }

    const fetchServices = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await therapistsApi.getServices(therapistId);
        setServices(data);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch therapist services'));
        console.error('Error fetching therapist services:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchServices();
  }, [therapistId]);

  return { services, loading, error };
};
