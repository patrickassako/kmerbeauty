
"use client";

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { ProSidebar } from '@/components/pro/ProSidebar';
import { Loader2 } from 'lucide-react';
import { MobileProNav } from '@/components/pro/MobileProNav';

export default function ProLayout({ children }: { children: React.ReactNode }) {
    const [loading, setLoading] = useState(true);
    const [isRegisterPage, setIsRegisterPage] = useState(false);
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        // Check if we're on the register page
        const onRegister = pathname === '/pro/register';
        setIsRegisterPage(onRegister);

        const checkAuth = async () => {
            const supabase = createClient();
            const { data: { session } } = await supabase.auth.getSession();

            if (!session) {
                router.replace('/login?redirect=/pro/dashboard');
                return;
            }

            // Skip profile check if already on register page
            if (onRegister) {
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
                    // No profile found - redirect to register
                    router.replace('/pro/register');
                    // Don't return - let loading stay, the redirect will trigger re-render
                    return;
                }

                const profile = await response.json();

                // If profile not completed, redirect to register
                if (!profile || !profile.profile_completed) {
                    router.replace('/pro/register');
                    return;
                }

                // Profile exists and is complete
                setLoading(false);
            } catch (error) {
                // API error - redirect to register
                console.error('Error checking profile:', error);
                router.replace('/pro/register');
            }
        };

        checkAuth();
    }, [router, pathname]);

    // Loading spinner
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
            </div>
        );
    }

    // Register page gets simple layout (no sidebar)
    if (isRegisterPage) {
        return <>{children}</>;
    }

    // Full pro layout with sidebar
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
