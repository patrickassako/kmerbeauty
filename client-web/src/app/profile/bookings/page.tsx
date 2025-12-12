'use client';

import { useEffect, useState, Suspense } from 'react';
import { createClient } from '@/lib/supabase';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, MapPin, Loader2, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { format, isPast, isFuture, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import Link from 'next/link';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

function UserBookingsContent() {
    const [bookings, setBookings] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');
    const router = useRouter();
    const supabase = createClient();
    const searchParams = useSearchParams();
    const successBookingId = searchParams.get('booking_success');

    useEffect(() => {
        async function loadBookings() {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push('/login');
                return;
            }

            // 1. Fetch bookings without complex join on services images
            const { data: rawBookings, error } = await supabase
                .from('bookings')
                .select(`
                    *,
                    salon:salons(name_fr, name_en, city),
                    therapist:therapists(business_name, city, user_id),
                    booking_items(*)
                `)
                .eq('user_id', user.id)
                .order('scheduled_at', { ascending: false });

            if (error) {
                console.error("Error fetching bookings:", error);
                setLoading(false);
                return;
            }

            // 2. Fetch images manually & Therapist Names fallback
            let enrichedBookings = rawBookings || [];
            const serviceNames = new Set<string>();
            const therapistUserIds = new Set<string>();

            enrichedBookings.forEach((booking: any) => {
                // Collect Service Names (Fallback since service_id is missing in booking_items)
                booking.booking_items?.forEach((item: any) => {
                    if (item.service_name) serviceNames.add(item.service_name);
                });
                // Collect Therapist User IDs if business name is missing
                if (booking.therapist && !booking.therapist.business_name && booking.therapist.user_id) {
                    therapistUserIds.add(booking.therapist.user_id);
                }
            });

            // Parallel Data Fetching
            // Using sequential awaits to avoid TypeScript Promise incompatibilities with PostgrestBuilder
            let servicesData: any[] | null = [];
            let usersData: any[] | null = [];

            // A. Service Images (Match by Name)
            if (serviceNames.size > 0) {
                // We search primarily by name_fr as it's the main stored name usually
                const { data } = await supabase
                    .from('services')
                    .select('images, name_fr, name_en')
                    .in('name_fr', Array.from(serviceNames));
                servicesData = data;
            }

            // B. Therapist User Names
            if (therapistUserIds.size > 0) {
                const { data } = await supabase
                    .from('users')
                    .select('id, first_name, last_name')
                    .in('id', Array.from(therapistUserIds));
                usersData = data;
            }

            const imagesMap: Record<string, string[]> = {};
            servicesData?.forEach((svc: any) => {
                if (svc.name_fr) imagesMap[svc.name_fr] = svc.images;
                if (svc.name_en) imagesMap[svc.name_en] = svc.images;
            });

            const usersMap: Record<string, string> = {};
            usersData?.forEach((u: any) => {
                usersMap[u.id] = `${u.first_name || ''} ${u.last_name || ''}`.trim();
            });

            // Merge Data
            enrichedBookings = enrichedBookings.map((booking: any) => {
                // Enhance Booking Items with Images
                const enhancedItems = booking.booking_items?.map((item: any) => ({
                    ...item,
                    service: {
                        ...(item.service || {}),
                        // Try to find image by name
                        images: imagesMap[item.service_name] || []
                    }
                }));

                // Enhance Therapist Name
                let enhancedTherapist = booking.therapist;
                if (enhancedTherapist && !enhancedTherapist.business_name && enhancedTherapist.user_id) {
                    const fullName = usersMap[enhancedTherapist.user_id];
                    if (fullName) {
                        enhancedTherapist = { ...enhancedTherapist, business_name: fullName };
                    }
                }

                return {
                    ...booking,
                    booking_items: enhancedItems,
                    therapist: enhancedTherapist
                };
            });

            setBookings(enrichedBookings);
            setLoading(false);
        }
        loadBookings();
    }, [router]);

    const filteredBookings = bookings.filter(booking => {
        const date = new Date(booking.scheduled_at);
        if (activeTab === 'upcoming') {
            return isFuture(date) || booking.status === 'PENDING';
        } else {
            return isPast(date) && booking.status !== 'PENDING';
        }
    });

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'CONFIRMED': return 'bg-green-100 text-green-800 border-green-200';
            case 'PENDING': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case 'CANCELLED': return 'bg-red-100 text-red-800 border-red-200';
            default: return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    if (loading) {
        return (
            <div className="h-full flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Mes Réservations</h1>
                    <p className="text-gray-500">Retrouvez l'historique de vos rendez-vous.</p>
                </div>
            </div>

            {successBookingId && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6 flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                    <div>
                        <h3 className="font-bold text-green-800">Réservation confirmée !</h3>
                        <p className="text-sm text-green-700">Votre demande a été envoyée avec succès.</p>
                    </div>
                </div>
            )}

            <div className="flex border-b mb-6">
                <button
                    onClick={() => setActiveTab('upcoming')}
                    className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors ${activeTab === 'upcoming' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                >
                    À venir
                </button>
                <button
                    onClick={() => setActiveTab('past')}
                    className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors ${activeTab === 'past' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                >
                    Passées
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                {filteredBookings.length === 0 ? (
                    <div className="p-12 text-center text-gray-500 flex flex-col items-center">
                        <Calendar className="h-12 w-12 text-gray-300 mb-4" />
                        <p>Aucune réservation {activeTab === 'upcoming' ? 'à venir' : 'passée'}.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100">
                        {filteredBookings.map((booking) => {
                            const providerName = booking.salon
                                ? (booking.salon.name_fr || booking.salon.name_en)
                                : (booking.therapist?.business_name || "Prestataire inconnu");

                            const providerCity = booking.salon?.city || booking.therapist?.city || booking.city;
                            const isNew = booking.id === successBookingId;
                            const serviceImage = booking.booking_items?.[0]?.service?.images?.[0];

                            return (
                                <div key={booking.id} className="relative">
                                    <Link href={`/profile/bookings/${booking.id}`}>
                                        <div className={`p-6 hover:bg-gray-50 transition-colors cursor-pointer group ${isNew ? 'bg-blue-50/30' : ''} rounded-2xl border border-gray-100 shadow-sm mb-4`}>
                                            <div className="flex flex-col sm:flex-row gap-4 items-start">
                                                {/* Image */}
                                                <div className="h-20 w-20 rounded-xl bg-gray-100 flex-shrink-0 overflow-hidden border border-gray-100 shadow-sm relative">
                                                    {serviceImage ? (
                                                        <img src={serviceImage} alt="Service" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                                                    ) : (
                                                        <div className="h-full w-full flex items-center justify-center text-gray-400 bg-gray-50">
                                                            <Calendar className="h-8 w-8 opacity-50" />
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="flex-1 min-w-0 space-y-1">
                                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                                        <h3 className="font-bold text-lg text-gray-900 group-hover:text-primary transition-colors truncate">
                                                            {providerName}
                                                        </h3>
                                                        <div className="font-bold text-primary text-lg whitespace-nowrap">
                                                            {new Intl.NumberFormat('fr-CM', { style: 'currency', currency: 'XAF' }).format(booking.total)}
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-2 mb-2">
                                                        <p className="text-sm font-medium text-gray-700 truncate">
                                                            {booking.booking_items?.map((i: any) => i.service_name).join(', ')}
                                                        </p>
                                                        <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-wide border ${getStatusColor(booking.status)}`}>
                                                            {booking.status === 'PENDING' ? 'En attente' :
                                                                booking.status === 'CONFIRMED' ? 'Confirmé' :
                                                                    booking.status === 'CANCELLED' ? 'Annulé' : booking.status}
                                                        </span>
                                                    </div>

                                                    <div className="flex flex-wrap gap-4 text-xs text-gray-500 mt-3 pt-2 border-t border-gray-100">
                                                        <div className="flex items-center gap-1.5">
                                                            <Calendar className="h-3.5 w-3.5" />
                                                            {format(new Date(booking.scheduled_at), 'd MMM yyyy', { locale: fr })}
                                                        </div>
                                                        <div className="flex items-center gap-1.5">
                                                            <Clock className="h-3.5 w-3.5" />
                                                            {format(new Date(booking.scheduled_at), 'HH:mm')}
                                                        </div>
                                                        <div className="flex items-center gap-1.5">
                                                            <MapPin className="h-3.5 w-3.5" />
                                                            {providerCity}
                                                        </div>
                                                        <div className="ml-auto text-gray-400">
                                                            #{booking.id.slice(0, 8)}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </Link>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}

export default function UserBookingsPage() {
    return (
        <Suspense fallback={<div className="h-full flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}>
            <UserBookingsContent />
        </Suspense>
    );
}

