
"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    Calendar,
    Scissors,
    Store,
    User,
    Settings,
    LogOut,
    ShoppingBag
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase';
import { Button } from '@/components/ui/button';

const MENU_ITEMS = [
    { label: 'Tableau de bord', icon: LayoutDashboard, href: '/pro/dashboard' },
    { label: 'Rendez-vous', icon: Calendar, href: '/pro/bookings' },
    { label: 'Mes Services', icon: Scissors, href: '/pro/services' },
    { label: 'Disponibilités', icon: Clock, href: '/pro/availability' },
    { label: 'Ma Boutique', icon: Store, href: '/pro/marketplace' },
    { label: 'Mes Ventes', icon: ShoppingBag, href: '/pro/marketplace/sales' },
    { label: 'Profil Pro', icon: User, href: '/pro/profile' },
];

import { Clock } from 'lucide-react';

export function ProSidebar() {
    const pathname = usePathname();
    const supabase = createClient();

    const handleLogout = async () => {
        await supabase.auth.signOut();
        window.location.href = '/';
    };

    return (
        <aside className="w-64 bg-white border-r border-gray-100 flex-shrink-0 hidden md:flex flex-col h-[calc(100vh-64px)] sticky top-16">
            <div className="p-6">
                <div className="flex items-center gap-3 px-2 mb-6">
                    <div className="h-8 w-8 bg-primary/10 rounded-lg flex items-center justify-center">
                        <Scissors className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                        <h2 className="font-bold text-gray-900">Espace Pro</h2>
                        <p className="text-xs text-gray-500">Gérez votre activité</p>
                    </div>
                </div>

                <nav className="space-y-1">
                    {MENU_ITEMS.map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname === item.href || pathname.startsWith(item.href + '/');

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                                    isActive
                                        ? "bg-primary/5 text-primary"
                                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                                )}
                            >
                                <Icon className={cn("h-4 w-4", isActive ? "text-primary" : "text-gray-400")} />
                                {item.label}
                            </Link>
                        );
                    })}
                </nav>
            </div>

            <div className="mt-auto p-4 border-t border-gray-100">
                <Button
                    variant="ghost"
                    className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 gap-3"
                    onClick={handleLogout}
                >
                    <LogOut className="h-4 w-4" />
                    Déconnexion
                </Button>
            </div>
        </aside>
    );
}
