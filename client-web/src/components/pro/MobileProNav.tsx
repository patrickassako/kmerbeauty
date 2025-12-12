
"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    Calendar,
    Scissors,
    Store,
    User,
    ShoppingBag
} from 'lucide-react';
import { cn } from '@/lib/utils';

const MENU_ITEMS = [
    { label: 'Accueil', icon: LayoutDashboard, href: '/pro/dashboard' },
    { label: 'Agenda', icon: Calendar, href: '/pro/bookings' },
    { label: 'Services', icon: Scissors, href: '/pro/services' },
    { label: 'Boutique', icon: Store, href: '/pro/marketplace' },
    { label: 'Profil', icon: User, href: '/pro/profile' },
];

export function MobileProNav() {
    const pathname = usePathname();

    return (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 md:hidden z-50 pb-safe">
            <nav className="flex justify-around items-center h-16">
                {MENU_ITEMS.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href || pathname.startsWith(item.href + '/');

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex flex-col items-center justify-center w-full h-full space-y-1",
                                isActive
                                    ? "text-primary"
                                    : "text-gray-500 hover:text-gray-900"
                            )}
                        >
                            <Icon className={cn("h-5 w-5", isActive && "fill-current")} />
                            <span className="text-[10px] font-medium">{item.label}</span>
                        </Link>
                    );
                })}
            </nav>
        </div>
    );
}
