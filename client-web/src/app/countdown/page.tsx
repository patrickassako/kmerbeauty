"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import Link from "next/link";
import Image from "next/image";

// Launch date: 14 days from now (set this to your actual launch date)
const LAUNCH_DATE = new Date("2025-01-02T00:00:00");

interface TimeLeft {
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
}

function calculateTimeLeft(): TimeLeft {
    const difference = +LAUNCH_DATE - +new Date();

    if (difference <= 0) {
        return { days: 0, hours: 0, minutes: 0, seconds: 0 };
    }

    return {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
    };
}

export default function CountdownPage() {
    const [timeLeft, setTimeLeft] = useState<TimeLeft>(calculateTimeLeft());
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();
    const supabase = createClientComponentClient();

    // Check auth status
    useEffect(() => {
        const checkAuth = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            setIsLoggedIn(!!session);
            setIsLoading(false);

            // If logged in, redirect to main app
            if (session) {
                router.push("/");
            }
        };

        checkAuth();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            setIsLoggedIn(!!session);
            if (session) {
                router.push("/");
            }
        });

        return () => subscription.unsubscribe();
    }, [supabase, router]);

    // Countdown timer
    useEffect(() => {
        const timer = setInterval(() => {
            setTimeLeft(calculateTimeLeft());
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    // Loading state
    if (isLoading) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-gray-200 border-t-[#2D2D2D] rounded-full animate-spin" />
            </div>
        );
    }

    // Check if countdown is over
    const isLaunched = timeLeft.days === 0 && timeLeft.hours === 0 &&
        timeLeft.minutes === 0 && timeLeft.seconds === 0;

    return (
        <div className="min-h-screen bg-white">
            {/* Header */}
            <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-100">
                <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
                    <Image src="/logo.png" alt="KMR-Beauty" width={120} height={32} className="h-8 w-auto" />
                    <Link
                        href="/login"
                        className="text-sm font-medium text-[#2D2D2D] hover:underline"
                    >
                        Connexion
                    </Link>
                </div>
            </header>

            {/* Main Content */}
            <main className="min-h-screen flex flex-col items-center justify-center px-6 pt-20">
                <div className="text-center max-w-2xl">
                    {/* Icon */}
                    <div className="w-16 h-16 bg-[#2D2D2D] rounded-2xl flex items-center justify-center mx-auto mb-8">
                        <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>

                    {/* Title */}
                    <h1 className="text-4xl md:text-5xl font-light text-[#2D2D2D] mb-4">
                        {isLaunched ? "C'est parti !" : "Lancement imminent"}
                    </h1>

                    <p className="text-gray-500 text-lg mb-12 max-w-md mx-auto">
                        {isLaunched
                            ? "L'application est maintenant disponible. Connectez-vous pour commencer."
                            : "KMR-Beauty arrive bientôt. Préparez-vous à révolutionner votre expérience beauté."
                        }
                    </p>

                    {/* Countdown */}
                    {!isLaunched && (
                        <div className="flex justify-center gap-4 md:gap-8 mb-12">
                            <div className="text-center">
                                <div className="w-20 h-20 md:w-24 md:h-24 bg-gray-50 rounded-2xl flex items-center justify-center mb-2">
                                    <span className="text-3xl md:text-4xl font-light text-[#2D2D2D]">
                                        {String(timeLeft.days).padStart(2, "0")}
                                    </span>
                                </div>
                                <span className="text-xs text-gray-400 uppercase tracking-wider">Jours</span>
                            </div>

                            <div className="text-center">
                                <div className="w-20 h-20 md:w-24 md:h-24 bg-gray-50 rounded-2xl flex items-center justify-center mb-2">
                                    <span className="text-3xl md:text-4xl font-light text-[#2D2D2D]">
                                        {String(timeLeft.hours).padStart(2, "0")}
                                    </span>
                                </div>
                                <span className="text-xs text-gray-400 uppercase tracking-wider">Heures</span>
                            </div>

                            <div className="text-center">
                                <div className="w-20 h-20 md:w-24 md:h-24 bg-gray-50 rounded-2xl flex items-center justify-center mb-2">
                                    <span className="text-3xl md:text-4xl font-light text-[#2D2D2D]">
                                        {String(timeLeft.minutes).padStart(2, "0")}
                                    </span>
                                </div>
                                <span className="text-xs text-gray-400 uppercase tracking-wider">Minutes</span>
                            </div>

                            <div className="text-center">
                                <div className="w-20 h-20 md:w-24 md:h-24 bg-gray-50 rounded-2xl flex items-center justify-center mb-2">
                                    <span className="text-3xl md:text-4xl font-light text-[#2D2D2D]">
                                        {String(timeLeft.seconds).padStart(2, "0")}
                                    </span>
                                </div>
                                <span className="text-xs text-gray-400 uppercase tracking-wider">Secondes</span>
                            </div>
                        </div>
                    )}

                    {/* CTA Button */}
                    <Link
                        href="/login"
                        className="inline-flex items-center gap-2 bg-[#2D2D2D] text-white px-8 py-4 rounded-full font-medium hover:bg-black transition-colors"
                    >
                        {isLaunched ? "Se connecter" : "Accès anticipé"}
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                        </svg>
                    </Link>

                    {/* Beta tester link */}
                    {!isLaunched && (
                        <p className="mt-8 text-sm text-gray-400">
                            Pas encore inscrit ?{" "}
                            <a
                                href="https://tester.kmrbeauty.com"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[#2D2D2D] underline hover:no-underline"
                            >
                                Devenir beta testeur
                            </a>
                        </p>
                    )}
                </div>
            </main>

            {/* Footer */}
            <footer className="absolute bottom-0 left-0 right-0 py-6 text-center">
                <div className="flex justify-center gap-6 text-sm text-gray-400">
                    <a
                        href="https://web.facebook.com/profile.php?viewas=100000686899395&id=61585229070539"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-[#2D2D2D]"
                    >
                        Facebook
                    </a>
                    <a
                        href="https://www.tiktok.com/@kmr.beauty.app"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-[#2D2D2D]"
                    >
                        TikTok
                    </a>
                </div>
            </footer>
        </div>
    );
}
