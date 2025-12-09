
"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    Clock,
    Calendar,
    User,
    ArrowRight
} from 'lucide-react';
import { createClient } from '@/lib/supabase';
import { contractorApi, Booking } from '@/services/api';
import { useLanguage } from '@/context/LanguageContext';

export default function ProAppointmentsPage() {
    const router = useRouter();
    const { t, language } = useLanguage();

    const [loading, setLoading] = useState(true);
    const [appointments, setAppointments] = useState<Booking[]>([]);
    const [selectedDay, setSelectedDay] = useState('All');
    const [contractorId, setContractorId] = useState<string | null>(null);

    const days = ['All', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    useEffect(() => {
        loadProfile();
    }, []);

    useEffect(() => {
        if (contractorId) {
            loadAppointments();
        }
    }, [contractorId, selectedDay]);

    const loadProfile = async () => {
        try {
            const supabase = createClient();
            const { data: { session } } = await supabase.auth.getSession();
            if (!session?.user) return;

            const profile = await contractorApi.getProfileByUserId(session.user.id);
            if (profile) {
                setContractorId(profile.id);
            }
        } catch (error) {
            console.error("Error loading profile:", error);
        }
    };

    const loadAppointments = async () => {
        if (!contractorId) return;
        try {
            setLoading(true);
            const day = selectedDay === 'All' ? undefined : selectedDay.toLowerCase();
            const data = await contractorApi.getUpcomingAppointments(contractorId, day);
            setAppointments(data);
        } catch (error) {
            console.error("Error loading appointments:", error);
        } finally {
            setLoading(false);
        }
    };

    const formatTime = (dateString: string) => {
        return new Date(dateString).toLocaleTimeString(language === 'fr' ? 'fr-FR' : 'en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    };

    return (
        <div className="space-y-6 max-w-3xl mx-auto pb-24">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900">
                    {language === 'fr' ? 'Rendez-vous' : 'Appointments'}
                </h1>
                <p className="text-gray-500 text-sm mt-1">
                    {language === 'fr' ? 'Gérez vos réservations à venir.' : 'Manage your upcoming bookings.'}
                </p>
            </div>

            {/* Day Filter */}
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {days.map((day) => (
                    <button
                        key={day}
                        onClick={() => setSelectedDay(day)}
                        className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors border ${selectedDay === day
                                ? 'bg-gray-900 text-white border-gray-900'
                                : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                            }`}
                    >
                        {day}
                    </button>
                ))}
            </div>

            {/* List */}
            {loading ? (
                <div className="py-20 text-center text-gray-500">Chargement...</div>
            ) : appointments.length === 0 ? (
                <div className="py-20 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                    <Calendar className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">Aucun rendez-vous trouvé.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {appointments.map((apt, idx) => (
                        <div
                            key={apt.id}
                            onClick={() => router.push(`/pro/appointments/${apt.id}`)}
                            className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer flex items-center gap-4 animate-in slide-in-from-bottom duration-500"
                            style={{ animationDelay: `${idx * 50}ms`, animationFillMode: 'both' }}
                        >
                            {/* Avatar */}
                            <div className="h-14 w-14 bg-gray-100 rounded-xl overflow-hidden flex-shrink-0 relative">
                                {apt.client?.profile_picture ? (
                                    <img src={apt.client.profile_picture} alt="" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-400">
                                        <User className="h-6 w-6" />
                                    </div>
                                )}
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                                <h3 className="font-bold text-gray-900 truncate">
                                    {apt.service?.name || "Service Inconnu"}
                                </h3>
                                <p className="text-sm text-gray-500 truncate mb-1">
                                    {apt.client ? `${apt.client.first_name} ${apt.client.last_name}` : 'Client inconnu'}
                                </p>
                                <div className="flex items-center gap-4 text-xs text-gray-600 font-medium">
                                    <span className="flex items-center gap-1">
                                        <Clock className="h-3.5 w-3.5 text-primary" />
                                        {formatTime(apt.scheduled_at)}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <Calendar className="h-3.5 w-3.5 text-primary" />
                                        {formatDate(apt.scheduled_at)}
                                    </span>
                                </div>
                            </div>

                            {/* Arrow */}
                            <div className="h-10 w-10 bg-gray-50 rounded-full flex items-center justify-center text-gray-400 group-hover:bg-primary group-hover:text-white transition-colors">
                                <ArrowRight className="h-5 w-5" />
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
