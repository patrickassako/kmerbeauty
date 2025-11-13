import { useState, useEffect } from 'react';
import { reviewsApi, Review } from '../services/api';

/**
 * Hook pour récupérer les avis d'un thérapeute
 */
export const useTherapistReviews = (therapistId?: string) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!therapistId) {
      setReviews([]);
      return;
    }

    const fetchReviews = async () => {
      setLoading(true);
      setError(null);

      try {
        const data = await reviewsApi.getTherapistReviews(therapistId);
        setReviews(data);
      } catch (err) {
        console.error('Error fetching therapist reviews:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch reviews');
        setReviews([]);
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, [therapistId]);

  return { reviews, loading, error };
};

/**
 * Hook pour récupérer les avis d'un salon
 */
export const useSalonReviews = (salonId?: string) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!salonId) {
      setReviews([]);
      return;
    }

    const fetchReviews = async () => {
      setLoading(true);
      setError(null);

      try {
        const data = await reviewsApi.getSalonReviews(salonId);
        setReviews(data);
      } catch (err) {
        console.error('Error fetching salon reviews:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch reviews');
        setReviews([]);
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, [salonId]);

  return { reviews, loading, error };
};

/**
 * Hook pour créer un nouvel avis
 */
export const useCreateReview = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createReview = async (reviewData: {
    user_id: string;
    therapist_id?: string;
    salon_id?: string;
    rating: number;
    comment?: string;
    cleanliness?: number;
    professionalism?: number;
    value?: number;
  }) => {
    setLoading(true);
    setError(null);

    try {
      const data = await reviewsApi.createReview(reviewData);
      return data;
    } catch (err) {
      console.error('Error creating review:', err);
      setError(err instanceof Error ? err.message : 'Failed to create review');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { createReview, loading, error };
};
