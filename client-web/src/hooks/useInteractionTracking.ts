import { useEffect, useState, useCallback } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

export function useInteractionTracking() {
    // Initialize synchronously if possible to avoid race conditions on mount
    const [guestId, setGuestId] = useState<string | null>(() => {
        if (typeof window !== 'undefined') {
            const stored = localStorage.getItem('guest_id');
            if (stored) return stored;

            const newId = crypto.randomUUID
                ? crypto.randomUUID()
                : `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            localStorage.setItem('guest_id', newId);
            return newId;
        }
        return null;
    });

    useEffect(() => {
        // Ensure it's set if hydration mismatch or first render empty
        if (!guestId && typeof window !== 'undefined') {
            const stored = localStorage.getItem('guest_id');
            if (stored) {
                setGuestId(stored);
            } else {
                const newId = crypto.randomUUID
                    ? crypto.randomUUID()
                    : `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                localStorage.setItem('guest_id', newId);
                setGuestId(newId);
            }
        }
    }, [guestId]);

    const trackInteraction = useCallback(async (
        providerId: string,
        providerType: 'therapist' | 'salon',
        interactionType: string,
        userIdOverride?: string,
        referenceId?: string,
        metadata: any = {}
    ) => {
        // Double check localStorage in case state is stale or not yet hydrated
        let effectiveUserId = userIdOverride || guestId;

        if (!effectiveUserId && typeof window !== 'undefined') {
            effectiveUserId = localStorage.getItem('guest_id');
        }

        if (!effectiveUserId) {
            console.warn("Skipping tracking: No user or guest ID available");
            return;
        }

        console.log(`[InteractionTracking] Tracking ${interactionType} for ${providerId} by ${effectiveUserId}`);

        try {
            const payload = {
                providerId,
                providerType,
                interactionType,
                userId: effectiveUserId,
                referenceId,
                metadata
            };

            await fetch(`${API_URL}/credits/track`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

        } catch (error) {
            console.error('Interaction tracking failed:', error);
        }
    }, [guestId]);

    return { trackInteraction, guestId };
}
