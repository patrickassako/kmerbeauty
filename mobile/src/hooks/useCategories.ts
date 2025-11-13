import { useState, useEffect } from 'react';
import { categoriesApi, type CategoryTranslation } from '../services/api';

export const useCategories = () => {
  const [categories, setCategories] = useState<CategoryTranslation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await categoriesApi.getAll();
        setCategories(data);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch categories'));
        console.error('Error fetching categories:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  const refetch = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await categoriesApi.getAll();
      setCategories(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch categories'));
      console.error('Error fetching categories:', err);
    } finally {
      setLoading(false);
    }
  };

  return { categories, loading, error, refetch };
};
