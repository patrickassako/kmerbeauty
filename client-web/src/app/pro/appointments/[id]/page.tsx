
"use client";

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
    Clock,
    Calendar,
    User,
    MapPin,
    ArrowLeft,
    MessageCircle,
    Check,
    X,
    Camera
} from 'lucide-react';
import { bookingsApi, Booking } from '@/services/api';
import { useLanguage } from '@/context/LanguageContext';
import { Button } from '@/components/ui/button';

export default function AppointmentDetailsPage() {
    const router = useRouter();
    const params = useParams();
    const { t, language } = useLanguage();

    const [loading, setLoading] = useState(true);
    const [appointment, setAppointment] = useState<Booking | null>(null);

    const id = params?.id as string;

    useEffect(() => {
        if (id) {
            loadAppointment();
        }
    }, [id]);

    const loadAppointment = async () => {
        try {
            setLoading(true);
            const data = await bookingsApi.getById(id);
            setAppointment(data);
        } catch (error) {
            console.error("Error loading appointment:", error);
            // alert("Erreur lors du chargement du rendez-vous"); // Avoid alert in render, maybe toast
        } finally {
            setLoading(false);
        }
    };

    const [statusUpdating, setStatusUpdating] = useState(false);

    const handleAction = async (action: 'CONFIRM' | 'START' | 'COMPLETE' | 'CANCEL') => {
        if (!process.env.NEXT_PUBLIC_API_URL) console.warn("API URL not set"); // debug

        const prompts = {
            CONFIRM: "Confirmer ce rendez-vous ?",
            START: "Commencer le service ?",
            COMPLETE: "Marquer comme terminé ?",
            CANCEL: "Annuler le rendez-vous ?"
        };

        if (!confirm(prompts[action])) return;

        try {
            setStatusUpdating(true);
            if (action === 'CONFIRM') {
                // Assuming confirm endpoint exists or using update
                // Mobile uses confirm: async (id) => patch(...)
                await bookingsApi.confirm(id);
            } else if (action === 'START') {
                // Mobile has no explicit start, but user might want it.
                // We can treat it as logic or just visual.
                // If backend supports it, great. If not, maybe skip or use confirm.
                // Let's stick to what Mobile API had: confirm (PENDING->CONFIRMED) and complete (->COMPLETED).
                // If "Start" is needed, it might be a status update to IN_PROGRESS.
                // I'll assume a generic updateStatus if specific endpoints don't exist, OR add `start` to api.
                await bookingsApi.start(id);
            } else if (action === 'COMPLETE') {
                await bookingsApi.complete(id);
            } else if (action === 'CANCEL') {
                await bookingsApi.cancel(id, 'Cancelled by contractor');
            }
            await loadAppointment();
        } catch (error) {
            console.error(`Error ${action}:`, error);
            alert("Une erreur est survenue.");
        } finally {
            setStatusUpdating(false);
        }
    };

    const handleChat = () => {
        // Navigate to chat
        router.push(`/pro/chat?bookingId=${id}&userId=${appointment?.client?.id}`);
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('fr-CM', { style: 'currency', currency: 'XAF' }).format(amount);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center">Chargement...</div>;
    if (!appointment) return <div className="min-h-screen flex items-center justify-center">Rendez-vous introuvable</div>;

    const statusColors = {
        COMPLETED: 'bg-green-500',
        CONFIRMED: 'bg-blue-500',
        IN_PROGRESS: 'bg-orange-500',
        PENDING: 'bg-yellow-500',
        CANCELLED: 'bg-red-500'
    };

    return (
        <div className="bg-gray-50 min-h-screen pb-24">
            {/* Header Image Gallery */}
            <div className="relative h-64 md:h-80 bg-gray-200">
                {appointment.items?.[0]?.service_image || (appointment.service as any)?.images?.[0] ? (
                    <img
                        src={appointment.items?.[0]?.service_image || (appointment.service as any)?.images?.[0]}
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <Camera className="h-16 w-16" />
                    </div>
                )}

                <button
                    onClick={() => router.back()}
                    className="absolute top-4 left-4 p-2 bg-white rounded-full shadow-lg hover:bg-gray-100"
                >
                    <ArrowLeft className="h-6 w-6 text-gray-900" />
                </button>
            </div>

            <div className="max-w-3xl mx-auto -mt-8 relative px-4 text-center sm:text-left">
                {/* Info Banner */}
                <div className="bg-gray-900 text-white p-4 rounded-xl shadow-lg flex flex-col sm:flex-row justify-between items-center gap-2">
                    <div className="flex items-center gap-2">
                        <MapPin className="h-5 w-5 text-gray-400" />
                        <span>{appointment.location_type === 'HOME' ? 'À Domicile' : 'En Salon'}</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1">
                            <Clock className="h-4 w-4 text-gray-400" />
                            {new Date(appointment.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <span className="flex items-center gap-1">
                            <Calendar className="h-4 w-4 text-gray-400" />
                            {new Date(appointment.scheduled_at).toLocaleDateString()}
                        </span>
                    </div>
                </div>

                {/* Content */}
                <div className="mt-6 space-y-6">

                    {/* Status Box */}
                    <div className="flex justify-between items-start">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">
                                {appointment.items?.[0]?.service_name || appointment.service?.name || "Service"}
                            </h1>
                            <div className={`mt-2 inline-flex px-3 py-1 rounded-full text-white text-sm font-bold ${statusColors[appointment.status] || 'bg-gray-500'}`}>
                                {appointment.status}
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-2xl font-bold text-gray-900">{formatCurrency(appointment.total)}</p>
                            <p className="text-sm text-gray-500">{appointment.duration} min</p>
                        </div>
                    </div>

                    {/* Services Included List */}
                    {appointment.items && appointment.items.length > 0 && (
                        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm space-y-4">
                            <h3 className="font-bold text-gray-900 border-b pb-2">Services Commandés</h3>
                            <div className="space-y-3">
                                {appointment.items.map((item, idx) => (
                                    <div key={idx} className="flex justify-between items-center">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 bg-gray-100 rounded-lg overflow-hidden">
                                                {item.service_image && <img src={item.service_image} className="w-full h-full object-cover" />}
                                            </div>
                                            <div>
                                                <p className="font-medium text-gray-900">{item.service_name}</p>
                                                <p className="text-xs text-gray-500">{item.duration} min</p>
                                            </div>
                                        </div>
                                        <p className="font-medium text-gray-700">{formatCurrency(item.price)}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Dimensions / Details */}
                    <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm space-y-4">
                        <div className="flex justify-between border-b pb-4">
                            <span className="text-gray-500">Adresse</span>
                            <span className="font-medium max-w-[50%] text-right">{appointment.quarter || appointment.city || "N/A"}</span>
                        </div>
                        <div className="flex justify-between border-b pb-4">
                            <span className="text-gray-500">Notes</span>
                            <span className="font-medium max-w-[50%] text-right">{appointment.notes || "Aucune note"}</span>
                        </div>
                    </div>

                    {/* Client Card */}
                    <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="h-12 w-12 bg-gray-100 rounded-full overflow-hidden border border-gray-200">
                                <img
                                    src={appointment.client?.profile_picture || '/logo.png'}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                        // Fallback if logo.png fails or client image fails
                                        (e.target as HTMLImageElement).src = '/logo.png';
                                    }}
                                />
                            </div>
                            <div>
                                <p className="font-bold text-gray-900">{appointment.client ? `${appointment.client.first_name} ${appointment.client.last_name}` : 'Client'}</p>
                                <p className="text-sm text-gray-500">Client Vérifié</p>
                            </div>
                        </div>
                        <Button onClick={handleChat} variant="outline" size="icon" className="rounded-full h-12 w-12 bg-gray-50 hover:bg-gray-100 border-gray-200">
                            <MessageCircle className="h-6 w-6 text-gray-700" />
                        </Button>
                    </div>

                    {/* Actions */}
                    <div className="space-y-3 pt-4">
                        {appointment.status === 'PENDING' && (
                            <Button
                                onClick={() => handleAction('CONFIRM')}
                                disabled={statusUpdating}
                                className="w-full py-6 text-lg bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md"
                            >
                                <Check className="mr-2 h-6 w-6" /> Confirmer le rendez-vous
                            </Button>
                        )}

                        {appointment.status === 'CONFIRMED' && (
                            <Button
                                onClick={() => handleAction('START')}
                                disabled={statusUpdating}
                                className="w-full py-6 text-lg bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-md"
                            >
                                <Clock className="mr-2 h-6 w-6" /> Commencer le service
                            </Button>
                        )}

                        {appointment.status === 'IN_PROGRESS' && (
                            <Button
                                onClick={() => handleAction('COMPLETE')}
                                disabled={statusUpdating}
                                className="w-full py-6 text-lg bg-green-600 hover:bg-green-700 text-white rounded-xl shadow-md transition-transform active:scale-[0.98]"
                            >
                                <Check className="mr-2 h-6 w-6" /> Marquer comme terminé
                            </Button>
                        )}

                        {['PENDING', 'CONFIRMED'].includes(appointment.status) && (
                            <Button
                                onClick={() => handleAction('CANCEL')}
                                disabled={statusUpdating}
                                variant="outline"
                                className="w-full py-6 text-lg border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 rounded-xl"
                            >
                                <X className="mr-2 h-6 w-6" /> Annuler le rendez-vous
                            </Button>
                        )}

                        <Button
                            onClick={() => router.push('/pro/dashboard')}
                            variant="ghost"
                            className="w-full text-gray-500"
                        >
                            Retour au tableau de bord
                        </Button>
                    </div>

                </div>
            </div>
        </div>
    );
}
