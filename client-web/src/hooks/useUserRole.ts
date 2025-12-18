
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

                console.log('🔍 useUserRole - data:', data, 'error:', error);

                if (data) {
                    const role = data.role?.toLowerCase();
                    console.log('🔍 useUserRole - role:', role);
                    if (role === 'provider' || role === 'contractor') {
                        console.log('✅ useUserRole - Setting isContractor to TRUE');
                        setIsContractor(true);
                    }
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
