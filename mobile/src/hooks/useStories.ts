import { useState, useEffect, useCallback } from 'react';
import { storiesApi, type Story } from '../services/storiesApi';

interface UseStoriesResult {
    stories: Story[];
    loading: boolean;
    error: string | null;
    refetch: () => Promise<void>;
    markViewed: (storyId: string) => Promise<void>;
}

export const useStories = (): UseStoriesResult => {
    const [stories, setStories] = useState<Story[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchStories = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await storiesApi.getAll();
            setStories(data);
        } catch (err) {
            console.error('Error fetching stories:', err);
            setError('Failed to load stories');
        } finally {
            setLoading(false);
        }
    }, []);

    const markViewed = useCallback(async (storyId: string) => {
        try {
            await storiesApi.markViewed(storyId);
            // Update local state to reflect viewed status
            setStories(prev =>
                prev.map(story =>
                    story.id === storyId ? { ...story, isViewed: true } : story
                )
            );
        } catch (err) {
            console.error('Error marking story as viewed:', err);
        }
    }, []);

    useEffect(() => {
        fetchStories();
    }, [fetchStories]);

    return {
        stories,
        loading,
        error,
        refetch: fetchStories,
        markViewed,
    };
};

export default useStories;
