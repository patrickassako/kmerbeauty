'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { SignupForm } from '@/components/auth/SignupForm';

function SignupContent() {
    const searchParams = useSearchParams();
    const nextUrl = searchParams.get('next') || '/';

    return (
        <div className="w-full max-w-md mx-auto animate-in fade-in zoom-in-95 duration-500">
            <SignupForm redirectTo={nextUrl} />
        </div>
    );
}

export default function SignupPage() {
    return (
        <div className="bg-gray-50 py-12 px-4">
            <Suspense fallback={<div className="text-gray-500 text-center">Chargement...</div>}>
                <SignupContent />
            </Suspense>
        </div>
    );
}
