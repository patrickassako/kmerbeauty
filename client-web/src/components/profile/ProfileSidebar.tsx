"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Calendar, ShoppingBag, MessageSquare, User, LogOut } from 'lucide-react';
import { createClient } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const navigation = [
    { name: 'Tableau de bord', href: '/profile', icon: LayoutDashboard },
    { name: 'Réservations', href: '/profile/bookings', icon: Calendar },
    { name: 'Commandes', href: '/profile/orders', icon: ShoppingBag },
    { name: 'Messages', href: '/profile/chat', icon: MessageSquare },
    { name: 'Mon Profil', href: '/profile/settings', icon: User },
];

export function ProfileSidebar() {
    const pathname = usePathname();
    const router = useRouter();
    const supabase = createClient();

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push('/');
    };

    return (
        <div className="w-full md:w-64 bg-white border-b md:border-b-0 md:border-r border-gray-100 md:min-h-screen p-4 flex flex-col gap-4 md:gap-0 sticky top-16 md:top-0 z-20">
            <div className="px-2 md:mb-8 flex justify-between items-center md:block">
                <h2 className="text-xl font-bold text-primary">Mon Espace</h2>
                <Button variant="ghost" size="sm" className="md:hidden text-red-500" onClick={handleLogout}>
                    <LogOut className="h-5 w-5" />
                </Button>
            </div>

            <nav className="flex md:flex-col gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-hide md:space-y-1 md:flex-1">
                {navigation.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={cn(
                                "flex items-center px-4 py-2 md:py-3 text-sm font-medium rounded-xl transition-colors whitespace-nowrap min-w-fit",
                                isActive
                                    ? "bg-primary/10 text-primary"
                                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900 border md:border-none border-gray-100"
                            )}
                        >
                            <item.icon className="mr-2 md:mr-3 h-4 w-4 md:h-5 md:w-5" />
                            {item.name}
                        </Link>
                    );
                })}
            </nav>

            <div className="hidden md:block pt-4 border-t border-gray-100 mt-4">
                <Button
                    variant="ghost"
                    className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-50"
                    onClick={handleLogout}
                >
                    <LogOut className="mr-3 h-5 w-5" />
                    Déconnexion
                </Button>
            </div>
        </div>
    );
}
