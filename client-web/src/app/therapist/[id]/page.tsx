'use client';

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { MapPin, Star, Phone, Clock, Globe, ArrowLeft, Share2, Heart, CheckCircle, Mail, User, Shield, Award, Pin } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { useInteractionTracking } from "@/hooks/useInteractionTracking";
import { Modal } from "@/components/ui/Modal";
import { LoginForm } from "@/components/auth/LoginForm";

export default function TherapistProfilePage() {
    const { id } = useParams();
    const router = useRouter();
    // ... params

    // Tracking
    const { trackInteraction } = useInteractionTracking();
    const [hasTracked, setHasTracked] = useState(false);

    // Auth & Chat State
    const supabase = createClient();
    const [showLoginModal, setShowLoginModal] = useState(false);
    const [pendingChat, setPendingChat] = useState(false);

    // ... existing code

    // Track View on Mount (once id is available)
    useEffect(() => {
        if (id && !hasTracked) {
            // We can try to get current user here if we want precise tracking
            // For now, let the hook handle guestId logic. 
            // If we really want auth user, we can fetch session.
            // Given typical flow, profile view is often anonymous or pre-login.
            trackInteraction(id as string, 'therapist', 'profile_view');
            setHasTracked(true);
        }
    }, [id, hasTracked, trackInteraction]);

    // ... existing code
    const searchParams = useSearchParams();
    const pinnedServiceId = searchParams.get('serviceId');
    const userLat = searchParams.get('lat');
    const userLon = searchParams.get('lon');
    const locationStr = searchParams.get('location');

    const { language, t } = useLanguage();
    const [therapist, setTherapist] = useState<any>(null);
    const [services, setServices] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("services");
    const [selectedServices, setSelectedServices] = useState<string[]>([]);

    const toggleService = (serviceId: string) => {
        setSelectedServices(prev =>
            prev.includes(serviceId)
                ? prev.filter(id => id !== serviceId)
                : [...prev, serviceId]
        );
    };

    const handleChatClick = async () => {
        // 1. Check Auth
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            setPendingChat(true);
            setShowLoginModal(true);
            return;
        }

        try {
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

            // 2. Get or Create Chat via Backend
            const response = await fetch(`${API_URL}/chat/direct`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    clientId: user.id,
                    providerId: id,
                    providerType: 'therapist'
                }),
            });

            if (!response.ok) {
                console.error('Failed to get/create chat');
                return;
            }

            const chat = await response.json();

            // 3. Check if new (no messages) and debit
            if (!chat.last_message_at) {
                await trackInteraction(id as string, 'therapist', 'chat_started', user.id);
            }

            router.push(`/profile/chat/${chat.id}`);

        } catch (e) {
            console.error("Chat error", e);
        }
    };

    useEffect(() => {
        async function fetchTherapistData() {
            // Fetch Therapist
            const { data: therapistData, error: therapistError } = await supabase
                .from('therapists')
                .select('*')
                .eq('id', id)
                .single();

            if (therapistError) {
                console.error("Error fetching therapist:", therapistError);
                setLoading(false);
                return;
            }

            // Fetch User details if linked
            let userData = null;
            if (therapistData.user_id) {
                const { data: uData } = await supabase
                    .from('users')
                    .select('first_name, last_name')
                    .eq('id', therapistData.user_id)
                    .single();
                userData = uData;
            }

            setTherapist({ ...therapistData, user: userData });

            // Fetch Services offered by this therapist
            const { data: servicesData, error: servicesError } = await supabase
                .from('therapist_services')
                .select(`
                    price,
                    duration,
                    service:services (
                        id,
                        name_fr,
                        name_en,
                        description_fr,
                        description_en,
                        images,
                        duration
                    )
                `)
                .eq('therapist_id', id)
                .eq('is_active', true);

            if (servicesData) {
                let formattedServices = servicesData.map((item: any) => ({
                    ...item.service,
                    price: item.price,
                    duration: item.duration || item.service.duration,
                    isPinned: item.service.id === pinnedServiceId
                }));

                // Sort to put pinned service first
                if (pinnedServiceId) {
                    formattedServices = formattedServices.sort((a: any, b: any) => {
                        if (a.id === pinnedServiceId) return -1;
                        if (b.id === pinnedServiceId) return 1;
                        return 0;
                    });
                }

                setServices(formattedServices);
            } else {
                console.log("No specific services found or table missing.");
            }

            setLoading(false);
        }

        if (id) {
            fetchTherapistData();
        }
    }, [id, pinnedServiceId]);

    // Construct booking URL with all context
    const getBookingUrl = (serviceId?: string) => {
        const params = new URLSearchParams();
        params.set('type', 'individual');
        if (serviceId) params.set('serviceId', serviceId);
        if (selectedServices.length > 0) params.set('serviceIds', selectedServices.join(','));
        if (userLat) params.set('lat', userLat);
        if (userLon) params.set('lon', userLon);
        if (locationStr) params.set('location', locationStr);

        if (!therapist) return '';
        return `/booking/${therapist.id}?${params.toString()}`;
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!therapist) {
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
                <h1 className="text-2xl font-bold mb-4">Prestataire non trouvé</h1>
                <Button onClick={() => router.back()}>Retour</Button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* Header / Cover */}
            <div className="relative h-[300px] w-full bg-[#1E3A5F]">
                <div className="absolute inset-0 bg-black/20"></div>

                <div className="absolute top-4 left-4 z-10">
                    <Button variant="secondary" size="icon" className="rounded-full bg-white/10 hover:bg-white/20 text-white border-none" onClick={() => router.back()}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                </div>

                <div className="absolute bottom-0 left-0 w-full px-4 md:px-8 pb-8 z-20">
                    <div className="container mx-auto flex flex-col md:flex-row items-end gap-6">
                        {/* Profile Image */}
                        <div className="h-32 w-32 md:h-40 md:w-40 rounded-full border-4 border-white bg-gray-200 overflow-hidden shadow-lg flex-shrink-0">
                            {therapist.profile_image ? (
                                <img src={therapist.profile_image} alt={therapist.business_name} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-gray-300">
                                    <User className="h-16 w-16 text-gray-500" />
                                </div>
                            )}
                        </div>

                        {/* Basic Info */}
                        <div className="flex-1 pb-2">
                            <h1 className="text-3xl md:text-5xl font-bold text-white mb-2 drop-shadow-md">
                                {therapist.business_name || (therapist.user ? `${therapist.user.first_name} ${therapist.user.last_name}` : null) || therapist.name || "Prestataire"}
                            </h1>
                            <div className="flex flex-wrap items-center gap-4 text-white/90 text-sm md:text-base">
                                <span className="flex items-center bg-black/30 px-3 py-1 rounded-full backdrop-blur-sm">
                                    <MapPin className="h-4 w-4 mr-2" />
                                    {therapist.city || "Cameroun"}
                                </span>
                                {therapist.rating && (
                                    <span className="flex items-center bg-yellow-500/90 px-3 py-1 rounded-full text-black font-bold backdrop-blur-sm">
                                        <Star className="h-4 w-4 mr-1 fill-black" />
                                        {therapist.rating}
                                    </span>
                                )}
                                {therapist.is_mobile && (
                                    <span className="flex items-center bg-blue-500/80 px-3 py-1 rounded-full backdrop-blur-sm">
                                        <Globe className="h-4 w-4 mr-2" />
                                        Service Mobile
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2 pb-2">
                            <Button
                                variant="secondary"
                                className="rounded-full px-6 font-bold text-[#1E3A5F] bg-white hover:bg-gray-100"
                                onClick={handleChatClick}
                            >
                                Discuter
                            </Button>
                            <Button className="rounded-full px-6 font-bold shadow-lg bg-[#FFB700] hover:bg-[#FFB700]/90 text-[#1E3A5F]" onClick={() => router.push(getBookingUrl())}>
                                Réserver
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 pt-8 pb-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-8">

                        {/* Bio Section */}
                        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                            <h2 className="text-xl font-bold mb-4">À propos</h2>
                            <p className="text-gray-600 leading-relaxed">
                                {language === 'en'
                                    ? (therapist.bio_en || therapist.bio_fr || "No bio available.")
                                    : (therapist.bio_fr || "Aucune description disponible.")}
                            </p>

                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-6">
                                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                                    <Shield className="h-5 w-5 text-green-600" />
                                    <div>
                                        <p className="text-xs text-gray-500">Identité</p>
                                        <p className="font-medium text-sm">Vérifiée</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                                    <Award className="h-5 w-5 text-primary" />
                                    <div>
                                        <p className="text-xs text-gray-500">Expérience</p>
                                        <p className="font-medium text-sm">{therapist.years_experience || "N/A"} ans</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Services Section */}
                        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                            <h2 className="text-xl font-bold mb-6">Services proposés</h2>
                            {services.length > 0 ? (
                                <div className="space-y-4">
                                    {services.map((service) => (
                                        <div
                                            key={service.id}
                                            className={`flex items-center justify-between p-4 rounded-xl border transition-all group relative overflow-hidden ${service.isPinned
                                                ? 'border-[#FFB700] bg-[#FFB700]/5 ring-1 ring-[#FFB700] shadow-sm'
                                                : 'hover:border-primary/50 hover:bg-gray-50'
                                                }`}
                                        >
                                            {service.isPinned && (
                                                <div className="absolute top-0 right-0 bg-[#FFB700] text-[#1E3A5F] text-[10px] font-bold px-2 py-0.5 rounded-bl-lg z-10">
                                                    SÉLECTIONNÉ
                                                </div>
                                            )}
                                            <div className="flex items-center gap-4">
                                                <div className="flex items-center justify-center h-12 w-8">
                                                    <input
                                                        type="checkbox"
                                                        className="h-5 w-5 rounded border-gray-300 text-primary focus:ring-primary"
                                                        checked={selectedServices.includes(service.id)}
                                                        onChange={() => toggleService(service.id)}
                                                    />
                                                </div>
                                                <div className={`h-12 w-12 rounded-lg flex items-center justify-center text-2xl ${service.isPinned ? 'bg-white' : 'bg-gray-100'}`}>
                                                    {service.isPinned ? '📌' : '✂️'}
                                                </div>
                                                <div>
                                                    <h3 className={`font-bold transition-colors ${service.isPinned ? 'text-[#1E3A5F]' : 'text-gray-900 group-hover:text-primary'}`}>
                                                        {language === 'en' ? (service.name_en || service.name_fr) : service.name_fr}
                                                    </h3>
                                                    <p className="text-sm text-gray-500 flex items-center">
                                                        <Clock className="h-3 w-3 mr-1" />
                                                        {service.duration} min
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-bold text-primary text-lg">
                                                    {new Intl.NumberFormat('fr-CM', { style: 'currency', currency: 'XAF' }).format(service.price)}
                                                </p>
                                                <Button
                                                    size="sm"
                                                    variant={service.isPinned ? "default" : "ghost"}
                                                    className={service.isPinned ? "bg-[#FFB700] text-[#1E3A5F] hover:bg-[#FFB700]/90 font-bold" : "text-xs"}
                                                    onClick={() => router.push(getBookingUrl(service.id))}
                                                >
                                                    {service.isPinned ? "Continuer" : "Réserver"}
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8 text-gray-500">
                                    Aucun service spécifique listé.
                                    <div className="mt-4">
                                        <Button onClick={() => router.push(getBookingUrl())}>
                                            Faire une demande de réservation
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>

                    </div>

                    {/* Sidebar */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sticky top-24">
                            <h3 className="font-bold text-lg mb-4">Contact & Dispo</h3>

                            <div className="space-y-4 mb-6">
                                {therapist.phone && (
                                    <div className="flex items-center text-sm text-gray-600">
                                        <Phone className="h-4 w-4 mr-3 text-primary" />
                                        <span>{therapist.phone}</span>
                                    </div>
                                )}
                                {therapist.email && (
                                    <div className="flex items-center text-sm text-gray-600">
                                        <Mail className="h-4 w-4 mr-3 text-primary" />
                                        <span>{therapist.email}</span>
                                    </div>
                                )}
                            </div>

                            {selectedServices.length > 0 && (
                                <Button
                                    className="w-full font-bold text-lg h-12 rounded-xl mb-4 animate-in fade-in slide-in-from-bottom-2"
                                    onClick={() => router.push(getBookingUrl())}
                                >
                                    Réserver ({selectedServices.length})
                                </Button>
                            )}

                            <p className="text-xs text-center text-gray-400">
                                Réponse généralement en moins d'une heure
                            </p>
                        </div>
                    </div>
                </div>
            </div>
            <Modal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)}>
                <LoginForm
                    isModal={true}
                    onSuccess={() => {
                        setShowLoginModal(false);
                        if (pendingChat) {
                            handleChatClick();
                            setPendingChat(false);
                        }
                    }}
                />
            </Modal>
        </div>
    );
}
