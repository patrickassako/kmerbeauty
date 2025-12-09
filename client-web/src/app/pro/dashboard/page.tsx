
"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    DollarSign,
    Calendar,
    Users,
    TrendingUp,
    Scissors,
    User,
    BarChart,
    ClipboardList,
    CheckCircle,
    MapPin,
    Clock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase';
import { contractorApi, creditsApi, DashboardStats, Booking } from '@/services/api';
import { useLanguage } from '@/context/LanguageContext'; // Assuming context exists

export default function ContractorDashboard() {
    const router = useRouter();
    const { t, language } = useLanguage();

    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<any>(null);
    const [profile, setProfile] = useState<any>(null);
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [upcomingAppointments, setUpcomingAppointments] = useState<Booking[]>([]);
    const [credits, setCredits] = useState<number>(0);
    const [selectedDay, setSelectedDay] = useState('All');

    const days = ['All', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    useEffect(() => {
        loadDashboard();
    }, []);

    const loadDashboard = async () => {
        try {
            setLoading(true);
            const supabase = createClient();
            const { data: { session } } = await supabase.auth.getSession();

            if (!session?.user) return;
            setUser(session.user);

            // Get contractor profile using shared API
            // We pass user ID, the API helper handles auth header via interceptor if session is active
            // But interceptor gets session async.
            const profileData = await contractorApi.getProfileByUserId(session.user.id);

            if (!profileData) {
                // Redirect to profile setup if not found?
                // router.push('/pro/register'); 
                return;
            }

            setProfile(profileData);

            // Parallel fetch for dashboard data
            try {
                const [dashboardData, creditData, appointmentsData] = await Promise.all([
                    contractorApi.getDashboard(profileData.id),
                    creditsApi.getBalance(profileData.id, 'therapist'), // Adjust 'therapist'/'salon' based on profile type if needed
                    contractorApi.getUpcomingAppointments(profileData.id, selectedDay === 'All' ? undefined : selectedDay.toLowerCase())
                ]);

                setStats(dashboardData);
                setCredits(creditData.balance || 0);
                setUpcomingAppointments(appointmentsData);
            } catch (innerErr) {
                console.error("Partial data load error", innerErr);
            }

        } catch (error) {
            console.error('Error loading dashboard:', error);
        } finally {
            setLoading(false);
        }
    };

    // Reload appointments when day changes
    useEffect(() => {
        if (profile?.id) {
            const fetchAppointments = async () => {
                const day = selectedDay === 'All' ? undefined : selectedDay.toLowerCase();
                const data = await contractorApi.getUpcomingAppointments(profile.id, day);
                setUpcomingAppointments(data);
            };
            fetchAppointments();
        }
    }, [selectedDay]);


    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('fr-CM', { style: 'currency', currency: 'XAF' }).format(amount);
    };

    const formatTime = (dateString: string) => {
        return new Date(dateString).toLocaleTimeString(language === 'fr' ? 'fr-FR' : 'en-US', {
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        });
    };

    if (loading) {
        return <div className="flex h-screen items-center justify-center">Chargement...</div>;
    }

    return (
        <div className="space-y-6 max-w-7xl mx-auto pb-4 md:pb-8">
            {/* Header / Greeting */}
            <div className="flex justify-between items-center bg-white p-4 md:p-6 rounded-2xl border border-gray-100 shadow-sm">
                <div>
                    <h1 className="text-xl md:text-2xl font-bold text-gray-900">
                        {user?.user_metadata?.first_name ? `${user.user_metadata.first_name} ${user.user_metadata.last_name}` : 'Bonjour!'}
                    </h1>
                    <div className="flex items-center text-gray-500 mt-1 text-sm">
                        <MapPin className="h-3 w-3 md:h-4 md:w-4 mr-1" />
                        <span>{profile?.city || 'Cameroun'}</span>
                    </div>
                </div>
                <div className="h-10 w-10 md:h-12 md:w-12 bg-gray-100 rounded-full flex items-center justify-center">
                    {profile?.profile_picture ? (
                        <img src={profile.profile_picture} alt="Profile" className="h-full w-full rounded-full object-cover" />
                    ) : (
                        <User className="h-5 w-5 md:h-6 md:w-6 text-gray-500" />
                    )}
                </div>
            </div>

            {/* Inactive Warning */}
            {profile && !profile.is_active && (
                <div className="bg-orange-50 border-l-4 border-orange-500 p-4 rounded-r-xl">
                    <h3 className="text-orange-800 font-bold text-sm md:text-base">⚠️ Compte en attente de validation</h3>
                    <p className="text-orange-700 text-xs md:text-sm mt-1">
                        Votre profil est complet mais doit être validé par un administrateur avant d'être visible par les clients.
                    </p>
                </div>
            )}

            {/* Credits Card */}
            <div className="bg-gray-900 text-white p-5 md:p-6 rounded-2xl shadow-lg relative overflow-hidden group hover:scale-[1.01] transition-transform">
                <div className="absolute top-0 right-0 p-8 opacity-10 transform translate-x-4 -translate-y-4">
                    <DollarSign className="w-24 h-24 md:w-32 md:h-32" />
                </div>
                <div className="relative z-10 flex justify-between items-center">
                    <div>
                        <p className="text-gray-400 text-xs md:text-sm font-medium mb-1">Vos Crédits</p>
                        <h2 className="text-3xl md:text-4xl font-bold">{credits.toFixed(1)}</h2>
                    </div>
                    <Button
                        onClick={() => router.push('/pro/credits')}
                        className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-4 py-2 text-sm md:px-6 md:text-base rounded-xl"
                    >
                        Recharger
                    </Button>
                </div>
            </div>

            {/* Quick Actions */}
            <div>
                <h2 className="text-lg md:text-xl font-bold mb-3 md:mb-4">Actions Rapides</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                    <div
                        onClick={() => router.push('/pro/services')}
                        className="bg-white p-4 md:p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col items-center text-center gap-2 md:gap-3"
                    >
                        <div className="h-10 w-10 md:h-12 md:w-12 bg-purple-50 rounded-full flex items-center justify-center text-purple-600">
                            <Scissors className="h-5 w-5 md:h-6 md:w-6" />
                        </div>
                        <span className="font-medium text-sm md:text-base">Services</span>
                    </div>

                    <div
                        onClick={() => router.push('/pro/availability')}
                        className="bg-white p-4 md:p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col items-center text-center gap-2 md:gap-3"
                    >
                        <div className="h-10 w-10 md:h-12 md:w-12 bg-blue-50 rounded-full flex items-center justify-center text-blue-600">
                            <Calendar className="h-5 w-5 md:h-6 md:w-6" />
                        </div>
                        <span className="font-medium text-sm md:text-base">Disponibilités</span>
                    </div>

                    <div
                        onClick={() => router.push('/pro/profile')}
                        className="bg-white p-4 md:p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col items-center text-center gap-2 md:gap-3"
                    >
                        <div className="h-10 w-10 md:h-12 md:w-12 bg-orange-50 rounded-full flex items-center justify-center text-orange-600">
                            <User className="h-5 w-5 md:h-6 md:w-6" />
                        </div>
                        <span className="font-medium text-sm md:text-base">Modifier Profil</span>
                    </div>

                    <div
                        onClick={() => router.push('/pro/earnings')}
                        className="bg-white p-4 md:p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col items-center text-center gap-2 md:gap-3"
                    >
                        <div className="h-10 w-10 md:h-12 md:w-12 bg-green-50 rounded-full flex items-center justify-center text-green-600">
                            <BarChart className="h-5 w-5 md:h-6 md:w-6" />
                        </div>
                        <span className="font-medium text-sm md:text-base">Revenus</span>
                    </div>
                </div>
            </div>

            {/* Reports */}
            <div>
                <div className="flex justify-between items-center mb-3">
                    <h2 className="text-lg md:text-xl font-bold">Rapports</h2>
                    <Button variant="ghost" className="text-primary text-sm h-8" onClick={() => router.push('/pro/earnings')}>Voir tout</Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
                    <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
                        <div>
                            <p className="text-gray-500 text-xs md:text-sm">Revenus</p>
                            <p className="text-lg md:text-xl font-bold mt-1 text-gray-900">{formatCurrency(stats?.total_income || 0)}</p>
                        </div>
                        <div className="h-8 w-8 md:h-10 md:w-10 bg-green-50 rounded-lg flex items-center justify-center text-green-600">
                            <DollarSign className="h-4 w-4 md:h-5 md:w-5" />
                        </div>
                    </div>

                    <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
                        <div>
                            <p className="text-gray-500 text-xs md:text-sm">Commandes</p>
                            <p className="text-lg md:text-xl font-bold mt-1 text-gray-900">{stats?.total_proposals || 0}</p>
                        </div>
                        <div className="h-8 w-8 md:h-10 md:w-10 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600">
                            <ClipboardList className="h-4 w-4 md:h-5 md:w-5" />
                        </div>
                    </div>

                    <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
                        <div>
                            <p className="text-gray-500 text-xs md:text-sm">Terminés</p>
                            <p className="text-lg md:text-xl font-bold mt-1 text-gray-900">{stats?.completed_bookings || 0}</p>
                        </div>
                        <div className="h-8 w-8 md:h-10 md:w-10 bg-gray-100 rounded-lg flex items-center justify-center text-gray-600">
                            <CheckCircle className="h-4 w-4 md:h-5 md:w-5" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Upcoming Appointments */}
            <div>
                <h2 className="text-xl font-bold mb-4">Rendez-vous à venir</h2>

                {/* Day Filter */}
                <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide">
                    {days.map((day) => (
                        <button
                            key={day}
                            onClick={() => setSelectedDay(day)}
                            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${selectedDay === day
                                ? 'bg-gray-900 text-white'
                                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                                }`}
                        >
                            {day}
                        </button>
                    ))}
                </div>

                <div className="space-y-3 mt-2">
                    {upcomingAppointments.length === 0 ? (
                        <div className="text-center py-10 text-gray-400 bg-gray-50 rounded-xl border border-dashed">
                            Aucun rendez-vous à venir
                        </div>
                    ) : (
                        upcomingAppointments.slice(0, 3).map((appointment) => (
                            <div
                                key={appointment.id}
                                onClick={() => router.push(`/pro/appointments/${appointment.id}`)}
                                className="bg-gray-900 text-white p-4 rounded-xl flex items-center gap-4 cursor-pointer hover:bg-gray-800 transition-colors"
                            >
                                <div className="h-12 w-12 bg-gray-700 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
                                    {appointment.client?.profile_picture ? (
                                        <img src={appointment.client.profile_picture} alt="" className="h-full w-full object-cover" />
                                    ) : (
                                        <User className="h-6 w-6 text-gray-400" />
                                    )}
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-bold">{appointment.service?.name || 'Service'}</h3>
                                    <div className="flex items-center gap-4 mt-1 text-gray-300 text-sm">
                                        <span className="flex items-center gap-1">
                                            <Clock className="h-3 w-3" />
                                            {formatTime(appointment.scheduled_at)}
                                        </span>
                                        <span>
                                            {formatDate(appointment.scheduled_at)}
                                        </span>
                                    </div>
                                </div>
                                <div className="text-gray-400">→</div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Earnings Chart (Simplified for Web) */}
            <div>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold">Revenus Totaux</h2>
                    <span className="text-sm text-gray-500">Mensuel ▼</span>
                </div>

                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm h-64 flex items-end justify-between gap-2">
                    {stats?.earnings_chart?.slice(-7).map((item, index) => {
                        const maxAmount = Math.max(...(stats.earnings_chart?.map((i) => i.amount) || [1]));
                        const heightPercentage = Math.max(10, (item.amount / maxAmount) * 100); // Min 10% height
                        const isEven = index % 2 === 0;

                        return (
                            <div key={index} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                                <div
                                    className={`w-full max-w-[40px] rounded-t-lg transition-all duration-500 ${isEven ? 'bg-gray-800' : 'bg-[#FF6B6B]'}`}
                                    style={{ height: `${heightPercentage}%` }}
                                />
                                <span className="text-xs text-gray-500 font-medium">
                                    {new Date(item.date).getDate()}
                                </span>
                            </div>
                        );
                    })}
                    {(!stats?.earnings_chart || stats.earnings_chart.length === 0) && (
                        <div className="w-full text-center text-gray-400 flex items-center justify-center h-full">
                            Pas de données disponibles
                        </div>
                    )}
                </div>
            </div>

            {/* Total Clients Footer */}
            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm mt-4 text-center">
                <p className="text-gray-500 text-sm mb-1">Total Clients</p>
                <p className="text-3xl font-bold text-gray-900">{stats?.total_clients || 0}</p>
            </div>
        </div>
    );
}
