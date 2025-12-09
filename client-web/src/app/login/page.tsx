'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { LoginForm } from '@/components/auth/LoginForm';

function LoginContent() {
    const searchParams = useSearchParams();
    const nextUrl = searchParams.get('next') || '/';

    return (
        <div className="w-full max-w-md animate-in fade-in zoom-in-95 duration-500">
            <LoginForm redirectTo={nextUrl} />
        </div>
    );
}

export default function LoginPage() {
    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <Suspense fallback={<div className="text-gray-500">Chargement...</div>}>
                <LoginContent />
            </Suspense>
        </div>
    );
}
