
"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { ProSidebar } from '@/components/pro/ProSidebar';
import { Loader2 } from 'lucide-react';
import { MobileProNav } from '@/components/pro/MobileProNav';

export default function ProLayout({ children }: { children: React.ReactNode }) {
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const checkAuth = async () => {
            const supabase = createClient();
            const { data: { session } } = await supabase.auth.getSession();

            if (!session) {
                router.replace('/login?redirect=/pro/dashboard');
                return;
            }

            // Check if provider has completed their profile using API
            const currentPath = window.location.pathname;

            // Skip check if already on register page
            if (currentPath === '/pro/register') {
                setLoading(false);
                return;
            }

            try {
                const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';
                const response = await fetch(`${API_URL}/contractors/profile/user/${session.user.id}`, {
                    headers: {
                        'Authorization': `Bearer ${session.access_token}`,
                        'Content-Type': 'application/json',
                    },
                });

                if (!response.ok) {
                    // No profile found
                    router.replace('/pro/register');
                    return;
                }

                const profile = await response.json();

                // If profile not completed, redirect to register
                if (!profile || !profile.profile_completed) {
                    router.replace('/pro/register');
                    return;
                }
            } catch (error) {
                // API error - redirect to register
                console.error('Error checking profile:', error);
                router.replace('/pro/register');
                return;
            }

            setLoading(false);
        };

        checkAuth();
    }, [router]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
            <ProSidebar />
            <main className="flex-1 p-4 md:p-8 overflow-y-auto pb-24 md:pb-8">
                <div className="max-w-6xl mx-auto">
                    {children}
                </div>
            </main>
            <MobileProNav />
        </div>
    );
}
