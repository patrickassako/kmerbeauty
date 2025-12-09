'use client';

// Removed unused Calendar import

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase';
import { Clock, ShoppingBag, Calendar as CalendarIcon, ArrowRight, Loader2 } from 'lucide-react';
import Link from 'next/link';

import { DashboardCalendar } from '@/components/profile/DashboardCalendar';

export default function DashboardPage() {
    const [stats, setStats] = useState({ upcomingBookings: 0, pendingOrders: 0 });
    const [bookings, setBookings] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        async function loadDashboard() {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // 1. Fetch bookings without complex join on services images
            const { data: rawBookings, error } = await supabase
                .from('bookings')
                .select(`
                    *,
                    salon:salons(name_fr, name_en, city),
                    therapist:therapists(business_name, city),
                    booking_items(*)
                `)
                .eq('user_id', user.id)
                .order('scheduled_at', { ascending: false });

            if (error) {
                console.error("Error fetching bookings:", error);
                setLoading(false);
                return;
            }

            // 2. Fetch images manually for services in booking items
            let enrichedBookings = rawBookings || [];

            // Extract all service IDs
            const serviceIds = new Set<string>();
            enrichedBookings.forEach((booking: any) => {
                booking.booking_items?.forEach((item: any) => {
                    if (item.service_id) serviceIds.add(item.service_id);
                });
            });

            if (serviceIds.size > 0) {
                const { data: servicesData } = await supabase
                    .from('services')
                    .select('id, images')
                    .in('id', Array.from(serviceIds));

                // Create a map for quick access
                const imagesMap: Record<string, string[]> = {};
                servicesData?.forEach((svc: any) => {
                    imagesMap[svc.id] = svc.images;
                });

                // Merge images back into bookings
                enrichedBookings = enrichedBookings.map((booking: any) => ({
                    ...booking,
                    booking_items: booking.booking_items?.map((item: any) => ({
                        ...item,
                        service: {
                            ...(item.service || {}), // Preserve if exists
                            images: imagesMap[item.service_id] || []
                        }
                    }))
                }));
            }

            // Stats
            const upcomingCount = enrichedBookings.filter((b: any) => new Date(b.scheduled_at) >= new Date()).length;

            // Fetch pending orders (if table exists)
            let ordersCount = 0;

            setStats({ upcomingBookings: upcomingCount, pendingOrders: ordersCount });
            setBookings(enrichedBookings);
            setLoading(false);
        }
        loadDashboard();
    }, []);

    if (loading) return <div className="h-full flex items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>;

    const recentBookings = bookings.slice(0, 3);

    return (
        <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Stat Cards */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
                            <CalendarIcon className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-gray-500 text-sm">Rendez-vous à venir</p>
                            <h3 className="text-2xl font-bold">{stats.upcomingBookings}</h3>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center">
                            <ShoppingBag className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-gray-500 text-sm">Commandes en cours</p>
                            <h3 className="text-2xl font-bold">{stats.pendingOrders}</h3>
                        </div>
                    </div>
                </div>

                <div className="bg-primary p-6 rounded-xl shadow-sm border border-transparent text-white">
                    <h3 className="font-bold text-lg mb-2">Besoin d'aide ?</h3>
                    <p className="text-blue-100 text-sm mb-4">Chattez directement avec vos prestataires.</p>
                    <Link href="/profile/chat" className="inline-block bg-white/20 hover:bg-white/30 transition-colors px-4 py-2 rounded-lg text-sm font-bold backdrop-blur-sm">
                        Ouvrir le chat
                    </Link>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Dashboard Calendar */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-lg">Mon Calendrier</h3>
                        <Link href="/profile/bookings" className="text-primary text-sm font-medium hover:underline flex items-center">
                            Voir tout <ArrowRight className="h-4 w-4 ml-1" />
                        </Link>
                    </div>
                    <DashboardCalendar bookings={bookings} />
                </div>

                {/* Recent Activity */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 h-fit">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-bold text-lg">Activités Récentes</h3>
                        {/* Link moved to calendar header usually, but fine here too */}
                    </div>

                    <div className="space-y-4">
                        {recentBookings.map((booking: any) => {
                            const providerName = booking.salon
                                ? (booking.salon.name_fr || booking.salon.name_en)
                                : (booking.therapist?.business_name || "Prestataire");

                            return (
                                <div key={booking.id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors border border-gray-50">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 bg-gray-100 rounded-full flex items-center justify-center overflow-hidden">
                                            {booking.booking_items?.[0]?.service?.images?.[0] ?
                                                <img src={booking.booking_items[0].service.images[0]} className="w-full h-full object-cover" alt="Service thumbnail" />
                                                : <CalendarIcon className="h-5 w-5 text-gray-500" />
                                            }
                                        </div>
                                        <div>
                                            <p className="font-medium text-sm">{providerName}</p>
                                            <p className="text-xs text-gray-500">{new Date(booking.scheduled_at).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                    <span className={`px-2 py-1 rounded text-xs font-bold ${booking.status === 'CONFIRMED' ? 'bg-green-100 text-green-700' :
                                        booking.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-600'
                                        }`}>
                                        {booking.status}
                                    </span>
                                </div>
                            );
                        })}
                        {recentBookings.length === 0 && (
                            <p className="text-center text-gray-400 text-sm py-4">Aucune activité récente.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
