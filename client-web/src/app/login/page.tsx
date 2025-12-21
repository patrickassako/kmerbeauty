'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { LoginForm } from '@/components/auth/LoginForm';
import { CheckCircle2 } from 'lucide-react';

function LoginContent() {
    const searchParams = useSearchParams();
    const nextUrl = searchParams.get('next') || '/';
    const confirmed = searchParams.get('confirmed') === 'true';

    return (
        <div className="w-full max-w-md mx-auto animate-in fade-in zoom-in-95 duration-500">
            {confirmed && (
                <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                    <p className="text-sm text-green-800">
                        Votre email a été confirmé avec succès ! Vous pouvez maintenant vous connecter.
                    </p>
                </div>
            )}
            <LoginForm redirectTo={nextUrl} />
        </div>
    );
}

export default function LoginPage() {
    return (
        <div className="bg-gray-50 py-12 px-4">
            <Suspense fallback={<div className="text-gray-500 text-center">Chargement...</div>}>
                <LoginContent />
            </Suspense>
        </div>
    );
}
