"use client";

import Link from "next/link";
import { Search, MapPin, Menu, User, Heart, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase";
import { useLanguage } from "@/context/LanguageContext";
import { useUserRole } from "@/hooks/useUserRole";

export function Navbar() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [location, setLocation] = useState<string | null>(null);
    const [user, setUser] = useState<any>(null);
    const { isContractor, loading: roleLoading } = useUserRole();
    const { language, setLanguage, t } = useLanguage();
    const supabase = createClient();

    useEffect(() => {
        // Function to load location
        const loadLocation = () => {
            const saved = localStorage.getItem('userLocation');
            if (saved) {
                const { query } = JSON.parse(saved);
                // Format: "District, City" -> take just City if too long, or keep as is
                setLocation(query);
            }
        };

        loadLocation();

        // Listen for custom event from page.tsx
        const handleLocationUpdate = () => loadLocation();
        window.addEventListener('locationUpdated', handleLocationUpdate);

        return () => window.removeEventListener('locationUpdated', handleLocationUpdate);
    }, []);

    useEffect(() => {
        // Check active session
        const checkUser = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            setUser(session?.user ?? null);
        };
        checkUser();

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
        });

        return () => subscription.unsubscribe();
    }, [supabase.auth]);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        setUser(null);
        window.location.href = '/';
    };

    // Real-time role check when clicking "Mon Compte" button
    const handleMyAccountClick = async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session?.user?.id) {
                window.location.href = '/login';
                return;
            }

            // Check role directly from database at click time
            const { data } = await supabase
                .from('users')
                .select('role')
                .eq('id', session.user.id)
                .single();

            const role = data?.role?.toLowerCase();
            if (role === 'provider' || role === 'contractor') {
                window.location.href = '/pro/dashboard';
            } else {
                window.location.href = '/profile';
            }
        } catch (error) {
            console.error('Error checking role:', error);
            window.location.href = '/profile';
        }
    };

    return (
        <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-md">
            <div className="container flex h-16 items-center justify-between">
                {/* Logo */}
                <Link href="/" className="flex items-center gap-2">
                    <img src="/logo-mobile.png" alt="KMS-BEAUTY" className="h-10 w-auto object-contain md:hidden" />
                    <img src="/logo-desktop.png" alt="KMS-BEAUTY" className="hidden md:block h-10 w-auto object-contain" />
                </Link>

                {/* Desktop Search & Location */}
                <div className="hidden md:flex items-center gap-4 flex-1 max-w-2xl mx-8">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder={t('searchPlaceholder')}
                            className="w-full h-10 rounded-full border bg-muted/50 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                        />
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground cursor-pointer transition-colors bg-muted/30 px-3 py-1.5 rounded-full">
                        <MapPin className="h-4 w-4 text-primary" />
                        <span className="font-medium text-gray-900">{location || t('locationPlaceholder')}</span>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                    {/* Language Switcher */}
                    <Button
                        variant="ghost"
                        size="sm"
                        className="hidden md:flex font-bold"
                        onClick={() => setLanguage(language === 'fr' ? 'en' : 'fr')}
                    >
                        {language === 'fr' ? '🇫🇷 FR' : '🇺🇸 EN'}
                    </Button>

                    <Link href="/marketplace" className="hidden md:block text-sm font-medium text-muted-foreground hover:text-primary transition-colors mr-4">
                        Boutique
                    </Link>

                    <Link href="/pro" className="hidden md:block text-sm font-medium text-muted-foreground hover:text-primary transition-colors mr-4">
                        {t('becomePartner')}
                    </Link>

                    <Link href="/contact" className="hidden md:block text-sm font-medium text-muted-foreground hover:text-primary transition-colors mr-4">
                        Contact
                    </Link>

                    <Button variant="ghost" size="icon" className="hidden md:flex">
                        <Heart className="h-5 w-5" />
                    </Button>

                    <Button variant="ghost" size="icon" className="hidden md:flex">
                        <ShoppingBag className="h-5 w-5" />
                    </Button>

                    {user ? (
                        <div className="flex items-center gap-2">
                            <Button variant="ghost" size="sm" className="hidden md:flex gap-2" onClick={handleLogout}>
                                <span>Se déconnecter</span>
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                className="hidden md:flex gap-2 rounded-full"
                                onClick={handleMyAccountClick}
                            >
                                <User className="h-4 w-4" />
                                <span>Mon Compte</span>
                            </Button>
                        </div>
                    ) : (
                        <Link href="/login">
                            <Button variant="outline" size="sm" className="hidden md:flex gap-2 rounded-full">
                                <User className="h-4 w-4" />
                                <span>{t('login')}</span>
                            </Button>
                        </Link>
                    )}

                    {/* Mobile Menu Toggle */}
                    <Button
                        variant="ghost"
                        size="icon"
                        className="md:hidden"
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                    >
                        <Menu className="h-5 w-5" />
                    </Button>
                </div>
            </div>

            {/* Mobile Menu */}
            {isMenuOpen && (
                <div className="md:hidden border-t p-4 space-y-4 bg-background animate-in slide-in-from-top-5">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Rechercher..."
                            className="w-full h-10 rounded-full border bg-muted/50 pl-10 pr-4 text-sm"
                        />
                    </div>
                    <nav className="flex flex-col gap-2">
                        <Link href="/" className="flex items-center gap-2 py-2 text-sm font-medium">
                            Accueil
                        </Link>
                        <Link href="/search" className="flex items-center gap-2 py-2 text-sm font-medium">
                            Explorer
                        </Link>
                        <Link href="/marketplace" className="flex items-center gap-2 py-2 text-sm font-medium">
                            Boutique
                        </Link>
                        <Link href="/pro" className="flex items-center gap-2 py-2 text-sm font-medium text-primary">
                            Devenir Partenaire
                        </Link>
                        <Link href="/contact" className="flex items-center gap-2 py-2 text-sm font-medium">
                            Contact
                        </Link>
                    </nav>
                    <div className="pt-4 border-t">
                        {user ? (
                            <>
                                <Button
                                    className="w-full rounded-full mb-2"
                                    variant="outline"
                                    onClick={() => {
                                        setIsMenuOpen(false);
                                        handleMyAccountClick();
                                    }}
                                >
                                    Mon Compte
                                </Button>
                                <Button className="w-full rounded-full" variant="destructive" onClick={() => {
                                    handleLogout();
                                    setIsMenuOpen(false);
                                }}>Se déconnecter</Button>
                            </>
                        ) : (
                            <Link href="/login" onClick={() => setIsMenuOpen(false)}>
                                <Button className="w-full rounded-full">Se connecter</Button>
                            </Link>
                        )}
                    </div>
                </div>
            )}
        </header>
    );
}
