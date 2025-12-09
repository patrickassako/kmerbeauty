
"use client";

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase';

export function useUserRole() {
    const [isContractor, setIsContractor] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkRole = async () => {
            const supabase = createClient();
            const { data: { session } } = await supabase.auth.getSession();

            if (!session) {
                setLoading(false);
                return;
            }

            try {
                // Determine user role directly from DB
                // This avoids API URL issues on mobile (localhost vs IP)
                const { data, error } = await supabase
                    .from('users')
                    .select('role')
                    .eq('id', session.user.id)
                    .single();

                if (data && (data.role === 'PROVIDER' || data.role === 'contractor')) {
                    setIsContractor(true);
                }
            } catch (error) {
                console.error("Error checking role:", error);
            } finally {
                setLoading(false);
            }
        };

        checkRole();
    }, []);

    return { isContractor, loading };
}
