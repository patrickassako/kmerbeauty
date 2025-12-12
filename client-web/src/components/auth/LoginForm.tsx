'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Mail, Phone, Lock, ArrowRight, Loader2 } from 'lucide-react';
import Link from 'next/link';

interface LoginFormProps {
    onSuccess?: () => void;
    redirectTo?: string;
    isModal?: boolean;
    onSwitchToSignup?: () => void;
}

export function LoginForm({ onSuccess, redirectTo, isModal = false, onSwitchToSignup }: LoginFormProps) {
    const [mode, setMode] = useState<'email' | 'phone'>('email');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();
    const supabase = createClient();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            console.log("Attempting login via:", mode);
            let authData: any = null;

            if (mode === 'email') {
                console.log("Signing in with email...");
                const { error, data } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });
                console.log("Email sign in result:", { error, session: !!data.session });
                if (error) throw error;
                authData = data;
            } else {
                // Phone Auth
                let formattedPhone = phone.trim();

                // Basic formatting for Cameroon if it starts with 6 and is 9 digits
                if (/^6\d{8}$/.test(formattedPhone)) {
                    formattedPhone = `237${formattedPhone}`;
                }

                // Add + if missing
                if (!formattedPhone.startsWith('+')) {
                    formattedPhone = `+${formattedPhone}`;
                }

                // Ensure specific update to state isn't strictly necessary for signIn, 
                // but good practice if we were using it for something else
                // We use local var 'formattedPhone' for the call.

                console.log("Signing in with phone:", formattedPhone);

                const { error, data } = await supabase.auth.signInWithPassword({
                    phone: formattedPhone,
                    password,
                });
                console.log("Phone sign in result:", { error, session: !!data.session });
                if (error) throw error;
                authData = data;
            }

            // Success
            console.log("Login successful, checking role...");

            let targetUrl = redirectTo || '/';

            // If no explicit redirect, determine destination based on role
            if (!redirectTo && authData) {
                try {
                    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';
                    const userId = authData.user?.id || authData.session?.user?.id;
                    const textToken = authData.session?.access_token;

                    if (userId && textToken) {
                        const res = await fetch(`${API_URL}/contractors/profile/user/${userId}`, {
                            headers: { 'Authorization': `Bearer ${textToken}` }
                        });
                        if (res.ok) {
                            targetUrl = '/pro/dashboard';
                        } else {
                            targetUrl = '/profile'; // Default for clients
                        }
                    }
                } catch (e) {
                    console.warn("Role check failed, defaulting to profile");
                    targetUrl = '/profile';
                }
            }

            if (onSuccess) {
                onSuccess();
            }

            if (!isModal) {
                router.push(targetUrl);
            }

            router.refresh();
        } catch (err: any) {
            console.error('Login error:', err);
            setError(err.message || "Une erreur est survenue lors de la connexion.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={`w-full ${isModal ? 'p-6' : 'max-w-md bg-white border border-gray-200 rounded-3xl p-8 shadow-sm'}`}>
            <div className="text-center mb-8">
                <h1 className="text-3xl font-bold mb-2 text-gray-900">Bienvenue</h1>
                <p className="text-gray-500">Connectez-vous pour continuer</p>
            </div>

            {/* Auth Mode Toggles */}
            <div className="flex p-1 rounded-xl mb-6 bg-gray-100">
                <button
                    onClick={() => setMode('email')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${mode === 'email'
                        ? 'bg-white text-[#1E3A5F] shadow-sm'
                        : 'text-gray-500 hover:text-gray-900'
                        }`}
                >
                    <Mail className="w-4 h-4" />
                    Email
                </button>
                <button
                    onClick={() => setMode('phone')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${mode === 'phone'
                        ? 'bg-white text-[#1E3A5F] shadow-sm'
                        : 'text-gray-500 hover:text-gray-900'
                        }`}
                >
                    <Phone className="w-4 h-4" />
                    Téléphone
                </button>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
                {error && (
                    <div className="bg-red-50 text-red-600 border border-red-200 text-sm p-3 rounded-lg text-center">
                        {error}
                    </div>
                )}

                {mode === 'email' ? (
                    <div className="space-y-4">
                        <div className="relative">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <Input
                                type="email"
                                placeholder="Votre adresse email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="pl-12 h-12 bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-[#FFB700] focus:ring-[#FFB700]/20"
                                required
                            />
                        </div>
                        <div className="relative">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <Input
                                type="password"
                                placeholder="Votre mot de passe"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="pl-12 h-12 bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-[#FFB700] focus:ring-[#FFB700]/20"
                                required
                            />
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="relative">
                            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <Input
                                type="tel"
                                placeholder="Numéro de téléphone (ex: 699...)"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                className="pl-12 h-12 bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-[#FFB700] focus:ring-[#FFB700]/20"
                                required
                            />
                        </div>
                        <div className="relative">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <Input
                                type="password"
                                placeholder="Mot de passe"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="pl-12 h-12 bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-[#FFB700] focus:ring-[#FFB700]/20"
                                required
                            />
                        </div>
                    </div>
                )}

                <Button
                    type="submit"
                    disabled={loading}
                    className="w-full h-12 bg-[#FFB700] hover:bg-[#FFB700]/90 text-[#1E3A5F] font-bold text-lg rounded-xl transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98]"
                >
                    {loading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                        <span className="flex items-center justify-center gap-2">
                            Se connecter <ArrowRight className="w-5 h-5" />
                        </span>
                    )}
                </Button>
            </form>

            <div className="mt-8 text-center">
                <p className="text-sm text-gray-500">
                    Pas encore de compte ?{' '}
                    {isModal && onSwitchToSignup ? (
                        <button
                            onClick={onSwitchToSignup}
                            className="text-[#FFB700] hover:text-[#FFB700]/80 font-medium hover:underline focus:outline-none"
                        >
                            Créer un compte
                        </button>
                    ) : (
                        <Link href={`/signup${redirectTo ? `?next=${encodeURIComponent(redirectTo)}` : ''}`} className="text-[#FFB700] hover:text-[#FFB700]/80 font-medium hover:underline">
                            Créer un compte
                        </Link>
                    )}
                </p>
            </div>
        </div>
    );
}
