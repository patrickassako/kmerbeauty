
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

            // TODO: Strictly check if user is a contractor via API or Metadata
            // For now, we allow access to initialize the flow

            setLoading(false);
        };

        checkAuth();
    }, []);

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
