
"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    Clock,
    Calendar,
    User,
    MapPin,
    Filter,
    ArrowRight
} from 'lucide-react';
import { createClient } from '@/lib/supabase';
import { bookingsApi, contractorApi, Booking } from '@/services/api';
import { useLanguage } from '@/context/LanguageContext';
import { Button } from '@/components/ui/button';

export default function ProBookingsPage() {
    const router = useRouter();
    const { t, language } = useLanguage();

    const [loading, setLoading] = useState(true);
    const [contractorId, setContractorId] = useState<string | null>(null);
    const [allBookings, setAllBookings] = useState<Booking[]>([]);
    const [filteredBookings, setFilteredBookings] = useState<Booking[]>([]);
    const [filter, setFilter] = useState<'all' | 'upcoming' | 'completed' | 'cancelled'>('all');

    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        applyFilter();
    }, [filter, allBookings]);

    const loadData = async () => {
        try {
            setLoading(true);
            const supabase = createClient();
            const { data: { session } } = await supabase.auth.getSession();
            if (!session?.user) return;

            const profile = await contractorApi.getProfileByUserId(session.user.id);
            if (!profile) return;
            setContractorId(profile.id);

            const bookings = await bookingsApi.getForContractor(profile.id);
            setAllBookings(bookings || []);

        } catch (error) {
            console.error("Error loading bookings:", error);
        } finally {
            setLoading(false);
        }
    };

    const applyFilter = () => {
        const now = new Date();
        let filtered = [];

        switch (filter) {
            case 'upcoming':
                filtered = allBookings.filter(b => {
                    const scheduledDate = new Date(b.scheduled_at);
                    return (b.status === 'PENDING' || b.status === 'CONFIRMED') && scheduledDate >= now;
                });
                break;
            case 'completed':
                filtered = allBookings.filter(b => b.status === 'COMPLETED');
                break;
            case 'cancelled':
                filtered = allBookings.filter(b => b.status === 'CANCELLED');
                break;
            case 'all':
            default:
                filtered = allBookings;
                break;
        }
        setFilteredBookings(filtered);
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'CONFIRMED': return 'bg-green-100 text-green-700';
            case 'COMPLETED': return 'bg-blue-100 text-blue-700';
            case 'CANCELLED': return 'bg-red-100 text-red-700';
            case 'PENDING': default: return 'bg-orange-100 text-orange-700';
        }
    };

    const getStatusLabel = (status: string) => {
        const labels: any = {
            PENDING: 'En attente',
            CONFIRMED: 'Confirmée',
            COMPLETED: 'Terminée',
            CANCELLED: 'Annulée'
        };
        return labels[status] || status;
    };

    return (
        <div className="bg-gray-50 min-h-screen pb-24">
            <div className="bg-white px-4 py-6 border-b border-gray-100 sticky top-0 z-10">
                <h1 className="text-2xl font-bold text-gray-900">Commandes</h1>
                <p className="text-gray-500 text-sm">Gérez toutes vos demandes de services.</p>
            </div>

            {/* Filters */}
            <div className="bg-white border-b border-gray-100 px-4 py-3 sticky top-[88px] z-10 overflow-x-auto whitespace-nowrap scrollbar-hide">
                <div className="flex gap-2">
                    {[
                        { id: 'all', label: 'Toutes' },
                        { id: 'upcoming', label: 'À venir' },
                        { id: 'completed', label: 'Terminées' },
                        { id: 'cancelled', label: 'Annulées' }
                    ].map((f) => (
                        <button
                            key={f.id}
                            onClick={() => setFilter(f.id as any)}
                            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors border ${filter === f.id
                                    ? 'bg-gray-900 text-white border-gray-900'
                                    : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                                }`}
                        >
                            {f.label}
                            {f.id === 'all' && ` (${allBookings.length})`}
                        </button>
                    ))}
                </div>
            </div>

            {/* List */}
            <div className="p-4 space-y-4 max-w-2xl mx-auto">
                {loading ? (
                    <div className="text-center py-12 text-gray-500">Chargement...</div>
                ) : filteredBookings.length === 0 ? (
                    <div className="text-center py-12">
                        <p className="text-gray-500">Aucune commande trouvée.</p>
                    </div>
                ) : (
                    filteredBookings.map((booking) => (
                        <div
                            key={booking.id}
                            onClick={() => router.push(`/pro/appointments/${booking.id}`)}
                            className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer active:scale-[0.99]"
                        >
                            <div className="flex gap-4">
                                {/* Image */}
                                <div className="h-20 w-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                                    {booking.items?.[0]?.service_image ? (
                                        <img src={booking.items[0].service_image} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-gray-300">
                                            <span className="text-2xl">💅</span>
                                        </div>
                                    )}
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0 flex flex-col justify-between">
                                    <div>
                                        <div className="flex justify-between items-start gap-2">
                                            <h3 className="font-bold text-gray-900 truncate">
                                                {booking.items?.[0]?.service_name || "Service Inconnu"}
                                            </h3>
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide ${getStatusColor(booking.status)}`}>
                                                {getStatusLabel(booking.status)}
                                            </span>
                                        </div>

                                        {/* Location & Client */}
                                        <div className="mt-1 space-y-0.5">
                                            {booking.quarter && (
                                                <div className="flex items-center gap-1 text-xs text-gray-500">
                                                    <MapPin className="h-3 w-3" />
                                                    <span className="truncate">{booking.quarter}</span>
                                                </div>
                                            )}
                                            {booking.client && (
                                                <div className="flex items-center gap-1 text-xs text-gray-500">
                                                    <User className="h-3 w-3" />
                                                    <span className="truncate">{booking.client.first_name} {booking.client.last_name}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Footer: Price & Time */}
                                    <div className="flex justify-between items-end mt-2">
                                        <span className="font-bold text-gray-900 text-lg">
                                            {new Intl.NumberFormat('fr-CM', { style: 'currency', currency: 'XAF' }).format(booking.total)}
                                        </span>
                                        <span className="text-xs text-gray-400 flex items-center gap-1">
                                            <Clock className="h-3 w-3" />
                                            {new Date(booking.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
