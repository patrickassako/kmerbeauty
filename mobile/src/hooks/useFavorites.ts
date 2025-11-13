import { useState, useEffect } from 'react';
import { favoritesApi } from '../services/api';

/**
 * Hook pour gérer les favoris d'un thérapeute
 */
export const useTherapistFavorite = (userId: string | undefined, therapistId: string | undefined) => {
  const [isFavorite, setIsFavorite] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Vérifier si le thérapeute est en favoris
  useEffect(() => {
    if (!userId || !therapistId) {
      setIsFavorite(false);
      return;
    }

    const checkFavorite = async () => {
      setLoading(true);
      setError(null);

      try {
        const result = await favoritesApi.checkTherapistFavorite(userId, therapistId);
        setIsFavorite(result);
      } catch (err) {
        console.error('Error checking therapist favorite:', err);
        setError(err instanceof Error ? err.message : 'Failed to check favorite');
        setIsFavorite(false);
      } finally {
        setLoading(false);
      }
    };

    checkFavorite();
  }, [userId, therapistId]);

  // Fonction pour toggle le favori
  const toggleFavorite = async () => {
    if (!userId || !therapistId) return;

    setLoading(true);
    setError(null);

    try {
      if (isFavorite) {
        // Retirer des favoris
        await favoritesApi.removeTherapistFromFavorites(userId, therapistId);
        setIsFavorite(false);
      } else {
        // Ajouter aux favoris
        await favoritesApi.addTherapistToFavorites(userId, therapistId);
        setIsFavorite(true);
      }
    } catch (err) {
      console.error('Error toggling therapist favorite:', err);
      setError(err instanceof Error ? err.message : 'Failed to toggle favorite');
    } finally {
      setLoading(false);
    }
  };

  return { isFavorite, loading, error, toggleFavorite };
};

/**
 * Hook pour gérer les favoris d'un salon
 */
export const useSalonFavorite = (userId: string | undefined, salonId: string | undefined) => {
  const [isFavorite, setIsFavorite] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Vérifier si le salon est en favoris
  useEffect(() => {
    if (!userId || !salonId) {
      setIsFavorite(false);
      return;
    }

    const checkFavorite = async () => {
      setLoading(true);
      setError(null);

      try {
        const result = await favoritesApi.checkSalonFavorite(userId, salonId);
        setIsFavorite(result);
      } catch (err) {
        console.error('Error checking salon favorite:', err);
        setError(err instanceof Error ? err.message : 'Failed to check favorite');
        setIsFavorite(false);
      } finally {
        setLoading(false);
      }
    };

    checkFavorite();
  }, [userId, salonId]);

  // Fonction pour toggle le favori
  const toggleFavorite = async () => {
    if (!userId || !salonId) return;

    setLoading(true);
    setError(null);

    try {
      if (isFavorite) {
        // Retirer des favoris
        await favoritesApi.removeSalonFromFavorites(userId, salonId);
        setIsFavorite(false);
      } else {
        // Ajouter aux favoris
        await favoritesApi.addSalonToFavorites(userId, salonId);
        setIsFavorite(true);
      }
    } catch (err) {
      console.error('Error toggling salon favorite:', err);
      setError(err instanceof Error ? err.message : 'Failed to toggle favorite');
    } finally {
      setLoading(false);
    }
  };

  return { isFavorite, loading, error, toggleFavorite };
};

/**
 * Hook pour récupérer tous les favoris d'un utilisateur
 */
export const useUserFavorites = (userId: string | undefined) => {
  const [favorites, setFavorites] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setFavorites([]);
      return;
    }

    const fetchFavorites = async () => {
      setLoading(true);
      setError(null);

      try {
        const data = await favoritesApi.getUserFavorites(userId);
        setFavorites(data);
      } catch (err) {
        console.error('Error fetching user favorites:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch favorites');
        setFavorites([]);
      } finally {
        setLoading(false);
      }
    };

    fetchFavorites();
  }, [userId]);

  return { favorites, loading, error };
};
