'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Mail, Phone, Lock, User, ArrowRight, Loader2, Briefcase, UserCircle, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

interface SignupFormProps {
    onSuccess?: () => void;
    redirectTo?: string;
    isModal?: boolean;
    onSwitchToLogin?: () => void;
}

export function SignupForm({ onSuccess, redirectTo, isModal = false, onSwitchToLogin }: SignupFormProps) {
    const [accountType, setAccountType] = useState<'CLIENT' | 'PROVIDER'>('CLIENT');
    const [mode, setMode] = useState<'email' | 'phone'>('email');
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState<'form' | 'verify' | 'email-sent'>('form');
    const [otp, setOtp] = useState('');
    const [timer, setTimer] = useState(60);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();
    const supabase = createClient();

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (step === 'verify' && timer > 0) {
            interval = setInterval(() => {
                setTimer((prev) => prev - 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [step, timer]);

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        if (password !== confirmPassword) {
            setError("Les mots de passe ne correspondent pas.");
            setLoading(false);
            return;
        }

        if (password.length < 6) {
            setError("Le mot de passe doit contenir au moins 6 caractères.");
            setLoading(false);
            return;
        }

        try {
            const metadata = {
                full_name: name,
                account_type: accountType,
            };

            if (mode === 'email') {
                const { data, error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        data: metadata,
                        emailRedirectTo: `${window.location.origin}/auth/callback${redirectTo ? `?next=${redirectTo}` : ''}`,
                    },
                });
                if (error) throw error;

                // If email verification is required (no session), show email-sent step
                if (!data.session) {
                    setStep('email-sent');
                    setLoading(false);
                    return;
                }

                // Manual Profile Creation for Email (if session exists immediately)
                if (data.session?.user) {
                    let formattedPhone = phone?.trim();
                    if (formattedPhone) {
                        if (/^6\d{8}$/.test(formattedPhone)) {
                            formattedPhone = `237${formattedPhone}`;
                        }
                        if (!formattedPhone.startsWith('+')) {
                            formattedPhone = `+${formattedPhone}`;
                        }
                    }

                    const profilePayload = {
                        id: data.session.user.id,
                        email: email,
                        phone: formattedPhone || null,
                        first_name: name.split(' ')[0] || 'User',
                        last_name: name.split(' ').slice(1).join(' ') || '',
                        role: accountType
                    };

                    let { error: profileError } = await supabase
                        .from('users')
                        .upsert(profilePayload, { onConflict: 'id' });

                    if (profileError && profileError.code === '23505' && (profileError.message?.includes('phone') || profileError.details?.includes('phone'))) {
                        console.warn("Phone already in use, creating profile without phone number.");
                        const { error: retryError } = await supabase
                            .from('users')
                            .upsert({
                                ...profilePayload,
                                phone: null
                            }, { onConflict: 'id' });
                        profileError = retryError;
                    }

                    if (profileError) console.error("Error creating profile:", profileError);
                }
            } else {
                // Phone Signup
                let formattedPhone = phone.trim();

                // Basic formatting for Cameroon
                if (/^6\d{8}$/.test(formattedPhone)) {
                    formattedPhone = `237${formattedPhone}`;
                }

                if (!formattedPhone.startsWith('+')) {
                    formattedPhone = `+${formattedPhone}`;
                }

                // Save formatted phone for verification
                setPhone(formattedPhone);

                const { error, data } = await supabase.auth.signUp({
                    phone: formattedPhone,
                    password,
                    options: {
                        data: metadata,
                    },
                });

                if (error) throw error;

                // If phone signup and session is null (which happens if verification is required), 
                // move to verify step
                if (data && !data.session) {
                    setStep('verify');
                    setLoading(false);
                    return;
                }
            }

            if (onSuccess) onSuccess();

            // Redirect based on account type
            let targetUrl = redirectTo || '/';
            if (!redirectTo) {
                // PROVIDER goes to register to complete pro profile first (triggers initial credits)
                targetUrl = accountType === 'PROVIDER' ? '/pro/register' : '/profile';
            }
            router.push(targetUrl);

            router.refresh();

        } catch (err: any) {
            console.error('Signup error:', err);
            setError(err.message || "Une erreur est survenue lors de l'inscription.");
        } finally {
            setLoading(false);
        }
    };
    const handleVerify = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const { error, data } = await supabase.auth.verifyOtp({
                phone,
                token: otp,
                type: 'sms',
            });

            if (error) throw error;

            // Manual Profile Creation (Fallback for missing triggers)
            if (data.session?.user) {
                const { error: profileError } = await supabase
                    .from('users')
                    .upsert({
                        id: data.session.user.id,
                        phone: phone, // Verified phone
                        email: `${phone.replace(/\+/g, '')}@kmrbeauty.temp`, // Placeholder email (can be removed if column is nullable)
                        first_name: name.split(' ')[0] || 'User',
                        last_name: name.split(' ').slice(1).join(' ') || '',
                        role: accountType
                    }, { onConflict: 'id' });

                if (profileError) {
                    console.error("Error creating profile:", profileError);
                    // Don't block flow, but log it
                }
            }

            if (onSuccess) onSuccess();

            // Redirect based on account type
            let targetUrl = redirectTo || '/';
            if (!redirectTo) {
                // PROVIDER goes to register to complete pro profile first (triggers initial credits)
                targetUrl = accountType === 'PROVIDER' ? '/pro/register' : '/profile';
            }
            router.push(targetUrl);

            router.refresh();
        } catch (err: any) {
            console.error('Verification error:', err);
            setError(err.message || "Code de vérification invalide.");
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        if (timer > 0) return;

        setLoading(true);
        setError(null);

        try {
            const { error } = await supabase.auth.resend({
                type: 'sms',
                phone: phone,
            });

            if (error) throw error;

            setTimer(60);

        } catch (err: any) {
            console.error('Resend error:', err);
            setError(err.message || "Erreur lors du renvoi du code.");
        } finally {
            setLoading(false);
        }
    };

    // Email sent confirmation screen
    if (step === 'email-sent') {
        return (
            <div className={`w-full ${isModal ? 'p-6' : 'max-w-md bg-white border border-gray-200 rounded-3xl p-8 shadow-sm'}`}>
                <div className="text-center">
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Mail className="w-10 h-10 text-green-600" />
                    </div>
                    <h1 className="text-2xl font-bold mb-3 text-gray-900">Vérifiez votre email</h1>
                    <p className="text-gray-500 mb-6">
                        Nous avons envoyé un lien de confirmation à
                    </p>
                    <p className="text-[#2D2D2D] font-semibold text-lg mb-8">{email}</p>

                    <div className="bg-gray-50 rounded-xl p-4 mb-6">
                        <p className="text-sm text-gray-600">
                            Cliquez sur le lien dans l'email pour activer votre compte. Vous serez redirigé vers la page de connexion.
                        </p>
                    </div>

                    <div className="space-y-3">
                        <Link href="/login">
                            <Button className="w-full h-12 bg-[#2D2D2D] hover:bg-black text-white font-medium rounded-xl">
                                Aller à la connexion
                            </Button>
                        </Link>

                        <button
                            onClick={() => setStep('form')}
                            className="w-full text-sm text-gray-500 hover:text-gray-900"
                        >
                            Modifier l'adresse email
                        </button>
                    </div>

                    <p className="text-xs text-gray-400 mt-6">
                        Vous n'avez pas reçu l'email ? Vérifiez vos spams ou réessayez.
                    </p>
                </div>
            </div>
        );
    }

    if (step === 'verify') {
        return (
            <div className={`w-full ${isModal ? 'p-6' : 'max-w-md bg-white border border-gray-200 rounded-3xl p-8 shadow-sm'}`}>
                <div className="text-center mb-8">
                    <h1 className="text-2xl font-bold mb-2 text-gray-900">Vérification</h1>
                    <p className="text-gray-500">Entrez le code reçu au {phone}</p>
                </div>

                <form onSubmit={handleVerify} className="space-y-4">
                    {error && (
                        <div className="bg-red-50 text-red-600 border border-red-200 text-sm p-3 rounded-lg text-center">
                            {error}
                        </div>
                    )}

                    <div>
                        <Input
                            type="text"
                            placeholder="Code de vérification (6 chiffres)"
                            value={otp}
                            onChange={(e) => setOtp(e.target.value)}
                            className="h-12 text-center text-lg tracking-widest bg-gray-50 border-gray-200 text-gray-900 focus:border-[#FFB700] focus:ring-[#FFB700]/20"
                            required
                        />
                    </div>

                    <Button
                        type="submit"
                        disabled={loading}
                        className="w-full h-12 bg-[#FFB700] hover:bg-[#FFB700]/90 text-[#1E3A5F] font-bold text-lg rounded-xl transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98]"
                    >
                        {loading ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <span className="flex items-center justify-center gap-2">
                                Vérifier <ArrowRight className="w-5 h-5" />
                            </span>
                        )}
                    </Button>

                    <Button
                        type="button"
                        variant="outline"
                        disabled={timer > 0 || loading}
                        onClick={handleResend}
                        className="w-full h-12 border-gray-200 text-gray-700 font-medium text-lg rounded-xl hover:bg-gray-50"
                    >
                        {timer > 0 ? (
                            <span className="flex items-center gap-2">
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Renvoyer dans {timer}s
                            </span>
                        ) : (
                            "Renvoyer le code"
                        )}
                    </Button>

                    <button
                        type="button"
                        onClick={() => setStep('form')}
                        className="w-full text-sm text-gray-500 hover:text-gray-900 mt-4"
                    >
                        Revenir en arrière
                    </button>
                </form>
            </div>
        );
    }

    return (
        <div className={`w-full ${isModal ? 'p-6' : 'max-w-md bg-white border border-gray-200 rounded-3xl p-8 shadow-sm'}`}>
            <div className="text-center mb-6">
                <h1 className="text-3xl font-bold mb-2 text-gray-900">Créer un compte</h1>
                <p className="text-gray-500">Rejoignez-nous dès aujourd'hui</p>
            </div>

            {/* Account Type Toggle */}
            <div className="mb-6">
                <p className="text-sm font-medium text-gray-700 mb-3 text-center">Type de compte</p>
                <div className="flex p-1 rounded-xl bg-gray-100">
                    <button
                        type="button"
                        onClick={() => setAccountType('CLIENT')}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${accountType === 'CLIENT'
                            ? 'bg-[#FFB700] text-[#1E3A5F] shadow-sm'
                            : 'text-gray-500 hover:text-gray-900'
                            }`}
                    >
                        <UserCircle className="w-5 h-5" />
                        Client
                    </button>
                    <button
                        type="button"
                        onClick={() => setAccountType('PROVIDER')}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${accountType === 'PROVIDER'
                            ? 'bg-[#FFB700] text-[#1E3A5F] shadow-sm'
                            : 'text-gray-500 hover:text-gray-900'
                            }`}
                    >
                        <Briefcase className="w-5 h-5" />
                        Prestataire
                    </button>
                </div>
            </div>

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

            <form onSubmit={handleSignup} className="space-y-4">
                {error && (
                    <div className="bg-red-50 text-red-600 border border-red-200 text-sm p-3 rounded-lg text-center">
                        {error}
                    </div>
                )}

                <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input
                        type="text"
                        placeholder="Nom complet"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="pl-12 h-12 bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-[#FFB700] focus:ring-[#FFB700]/20"
                        required
                    />
                </div>

                {mode === 'email' ? (
                    <>
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
                            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <Input
                                type="tel"
                                placeholder="Numéro de téléphone (Optionnel)"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                className="pl-12 h-12 bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-[#FFB700] focus:ring-[#FFB700]/20"
                            />
                        </div>
                    </>
                ) : (
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
                )}

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

                <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input
                        type="password"
                        placeholder="Confirmer le mot de passe"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="pl-12 h-12 bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-[#FFB700] focus:ring-[#FFB700]/20"
                        required
                    />
                </div>

                <Button
                    type="submit"
                    disabled={loading}
                    className="w-full h-12 bg-[#FFB700] hover:bg-[#FFB700]/90 text-[#1E3A5F] font-bold text-lg rounded-xl transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98]"
                >
                    {loading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                        <span className="flex items-center justify-center gap-2">
                            S'inscrire <ArrowRight className="w-5 h-5" />
                        </span>
                    )}
                </Button>
            </form>

            <div className="mt-8 text-center">
                <p className="text-sm text-gray-500">
                    Déjà un compte ?{' '}
                    {isModal && onSwitchToLogin ? (
                        <button
                            onClick={onSwitchToLogin}
                            className="text-[#FFB700] hover:text-[#FFB700]/80 font-medium hover:underline focus:outline-none"
                        >
                            Se connecter
                        </button>
                    ) : (
                        <Link href={`/login${redirectTo ? `?next=${encodeURIComponent(redirectTo)}` : ''}`} className="text-[#FFB700] hover:text-[#FFB700]/80 font-medium hover:underline">
                            Se connecter
                        </Link>
                    )}
                </p>
            </div>
        </div>
    );

}
