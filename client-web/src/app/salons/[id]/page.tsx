"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { MapPin, Star, Phone, Clock, Globe, ArrowLeft, Share2, Heart, Calendar, CheckCircle, Mail, User, X, Info } from "lucide-react";
import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";
import { useInteractionTracking } from "@/hooks/useInteractionTracking";
import { Modal } from "@/components/ui/Modal";
import { LoginForm } from "@/components/auth/LoginForm";

export default function SalonDetailsPage() {
    const { id } = useParams();
    const router = useRouter();
    const { language, t } = useLanguage();
    const [salon, setSalon] = useState<any>(null);
    const [services, setServices] = useState<any[]>([]);
    const [therapists, setTherapists] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("services");
    const [selectedServices, setSelectedServices] = useState<Set<string>>(new Set());
    const [viewingService, setViewingService] = useState<any>(null);

    // Tracking
    const { trackInteraction } = useInteractionTracking();
    const [hasTracked, setHasTracked] = useState(false);

    useEffect(() => {
        if (id && !hasTracked) {
            trackInteraction(id as string, 'salon', 'profile_view');
            setHasTracked(true);
        }
    }, [id, hasTracked, trackInteraction]);

    useEffect(() => {
        async function fetchSalonData() {
            const supabase = createClient();

            // Fetch Salon
            const { data: salonData, error: salonError } = await supabase
                .from('salons')
                .select('*')
                .eq('id', id)
                .single();

            if (salonError) {
                console.error("Error fetching salon:", salonError);
                setLoading(false);
                return;
            }

            setSalon(salonData);

            // Fetch Services via salon_services join
            const { data: servicesData, error: servicesError } = await supabase
                .from('salon_services')
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
                .eq('salon_id', id)
                .eq('is_active', true);

            if (servicesError) {
                console.error("Error fetching services:", servicesError);
            } else if (servicesData) {
                // Map the joined data to the expected structure
                const formattedServices = servicesData.map((item: any) => ({
                    ...item.service,
                    price: item.price, // Override base price with salon specific price
                    duration: item.duration || item.service.duration // Use salon duration if set
                }));
                setServices(formattedServices);
            }

            // Fetch Therapists (mock or real)
            // For now, let's assume we might have a therapists table or just mock it if empty
            const { data: therapistsData } = await supabase
                .from('therapists')
                .select('*')
                .eq('salon_id', id);

            if (therapistsData) setTherapists(therapistsData);

            setLoading(false);
        }

        if (id) {
            fetchSalonData();
        }
    }, [id]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!salon) {
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
                <h1 className="text-2xl font-bold mb-4">Salon non trouvé</h1>
                <Button onClick={() => router.back()}>Retour</Button>
            </div>
        );
    }

    // Tracking and Auth State
    const [showLoginModal, setShowLoginModal] = useState(false);
    const [pendingChat, setPendingChat] = useState(false);

    // Handle Chat Click
    const handleChatClick = async () => {
        const supabase = createClient();
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
                    providerType: 'salon'
                }),
            });

            if (!response.ok) {
                console.error('Failed to get/create chat');
                return;
            }

            const chat = await response.json();

            // 3. Check if new (no messages) and debit
            // If last_message_at is null, it's likely a new empty conversation
            if (!chat.last_message_at) {
                await trackInteraction(id as string, 'salon', 'chat_started', user.id);
            }

            router.push(`/profile/chat/${chat.id}`);
        } catch (e) {
            console.error("Chat error", e);
        }
    };

    const toggleService = (serviceId: string, e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        const newSelected = new Set(selectedServices);
        if (newSelected.has(serviceId)) {
            newSelected.delete(serviceId);
        } else {
            newSelected.add(serviceId);
        }
        setSelectedServices(newSelected);
    };

    const handleBook = () => {
        const servicesToBook = selectedServices.size > 0
            ? Array.from(selectedServices)
            : []; // If nothing selected, maybe just go to booking page or warn? 
        // Actually, if nothing selected, we might want to prevent booking or just pass nothing.
        // But usually "Book" on sidebar implies booking the salon. 
        // Let's assume if nothing selected, we can't book specific services yet, 
        // OR we just go to booking flow and let them select there.
        // For now, let's pass the selected ones.

        if (servicesToBook.length === 0) {
            // If no services selected, maybe just redirect to booking with salonId
            router.push(`/booking/${salon.id}?type=salon`);
            return;
        }

        const queryParams = new URLSearchParams();
        queryParams.set('serviceIds', servicesToBook.join(','));
        queryParams.set('type', 'salon');
        router.push(`/booking/${salon.id}?${queryParams.toString()}`);
    };

    const formatOpeningHours = (hours: any) => {
        if (!hours) return null;
        if (typeof hours === 'string') return hours;

        // If it's an object, try to find today's hours or return a summary
        const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        const today = days[new Date().getDay()];

        if (hours[today]) {
            return `Aujourd'hui: ${hours[today]}`;
        }

        // Fallback to first available day or generic message
        return "Horaires disponibles";
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* Service Details Modal */}
            {viewingService && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setViewingService(null)}>
                    <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                        <div className="relative h-48 bg-gray-100">
                            {viewingService.images?.[0] ? (
                                <img
                                    src={viewingService.images[0]}
                                    alt={language === 'en' ? (viewingService.name_en || viewingService.name_fr) : viewingService.name_fr}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-400">
                                    <MapPin className="h-12 w-12 opacity-20" />
                                </div>
                            )}
                            <button
                                onClick={() => setViewingService(null)}
                                className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                        <div className="p-6">
                            <h3 className="text-xl font-bold mb-2">
                                {language === 'en' ? (viewingService.name_en || viewingService.name_fr) : viewingService.name_fr}
                            </h3>
                            <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                                <span className="flex items-center">
                                    <Clock className="h-4 w-4 mr-1" />
                                    {viewingService.duration} min
                                </span>
                                <span className="font-bold text-primary text-lg">
                                    {new Intl.NumberFormat('fr-CM', { style: 'currency', currency: 'XAF' }).format(viewingService.price)}
                                </span>
                            </div>

                            <div className="prose prose-sm text-gray-600 mb-6">
                                <p>
                                    {language === 'en'
                                        ? (viewingService.description_en || viewingService.description_fr || "No description available.")
                                        : (viewingService.description_fr || "Aucune description disponible.")}
                                </p>
                            </div>

                            <Button
                                className="w-full"
                                variant={selectedServices.has(viewingService.id) ? "secondary" : "default"}
                                onClick={() => {
                                    toggleService(viewingService.id);
                                    setViewingService(null);
                                }}
                            >
                                {selectedServices.has(viewingService.id) ? "Retirer de la sélection" : "Ajouter à la sélection"}
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Header Image */}
            <div className="relative h-[300px] md:h-[400px] w-full bg-gray-200">
                {salon.cover_image ? (
                    <img
                        src={salon.cover_image}
                        alt={language === 'en' ? (salon.name_en || salon.name_fr) : salon.name_fr}
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <MapPin className="h-12 w-12 opacity-20" />
                    </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>

                <div className="absolute top-4 left-4">
                    <Button variant="secondary" size="icon" className="rounded-full" onClick={() => router.back()}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                </div>

                <div className="absolute bottom-0 left-0 w-full p-4 md:p-8 text-white">
                    <div className="container mx-auto">
                        <div className="flex flex-col md:flex-row justify-between items-end gap-4">
                            <div>
                                <h1 className="text-3xl md:text-5xl font-bold mb-2">{language === 'en' ? (salon.name_en || salon.name_fr) : salon.name_fr}</h1>
                                <div className="flex items-center gap-2 text-gray-200 mb-2">
                                    <MapPin className="h-4 w-4" />
                                    <span>{salon.street || salon.address}, {salon.city}</span>
                                </div>
                                <div className="flex items-center gap-4">
                                    {salon.rating && (
                                        <div className="flex items-center bg-white/20 backdrop-blur-md px-2 py-1 rounded-md">
                                            <Star className="h-4 w-4 text-yellow-400 fill-yellow-400 mr-1" />
                                            <span className="font-bold">{salon.rating}</span>
                                            {salon.review_count && <span className="text-xs ml-1 opacity-80">({salon.review_count} avis)</span>}
                                        </div>
                                    )}
                                    {salon.opening_hours && (
                                        <span className="bg-green-500/80 backdrop-blur-md px-2 py-1 rounded-md text-xs font-bold">
                                            {t('hours')} : {formatOpeningHours(salon.opening_hours)}
                                        </span>
                                    )}
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <Button variant="secondary" size="icon" className="rounded-full">
                                    <Share2 className="h-5 w-5" />
                                </Button>
                                <Button variant="secondary" size="icon" className="rounded-full">
                                    <Heart className="h-5 w-5" />
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-8">

                        {/* Tabs */}
                        <div className="flex border-b overflow-x-auto">
                            <button
                                onClick={() => setActiveTab("services")}
                                className={`px-6 py-3 font-medium text-sm whitespace-nowrap border-b-2 transition-colors ${activeTab === "services" ? "border-primary text-primary" : "border-transparent text-gray-500 hover:text-gray-700"}`}
                            >
                                {t('services')}
                            </button>
                            <button
                                onClick={() => setActiveTab("about")}
                                className={`px-6 py-3 font-medium text-sm whitespace-nowrap border-b-2 transition-colors ${activeTab === "about" ? "border-primary text-primary" : "border-transparent text-gray-500 hover:text-gray-700"}`}
                            >
                                {t('about')}
                            </button>
                            <button
                                onClick={() => setActiveTab("gallery")}
                                className={`px-6 py-3 font-medium text-sm whitespace-nowrap border-b-2 transition-colors ${activeTab === "gallery" ? "border-primary text-primary" : "border-transparent text-gray-500 hover:text-gray-700"}`}
                            >
                                {t('gallery')}
                            </button>
                            {salon.review_count > 0 && (
                                <button
                                    onClick={() => setActiveTab("reviews")}
                                    className={`px-6 py-3 font-medium text-sm whitespace-nowrap border-b-2 transition-colors ${activeTab === "reviews" ? "border-primary text-primary" : "border-transparent text-gray-500 hover:text-gray-700"}`}
                                >
                                    Avis ({salon.review_count})
                                </button>
                            )}
                        </div>

                        {/* Tab Content */}
                        <div className="min-h-[300px]">
                            {activeTab === "services" && (
                                <div className="space-y-6">
                                    <h2 className="text-xl font-bold">{t('services')}</h2>
                                    <div className="space-y-4">
                                        {services.map((service) => (
                                            <div
                                                key={service.id}
                                                className={`flex items-center justify-between p-4 rounded-lg border transition-all cursor-pointer ${selectedServices.has(service.id) ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'hover:border-primary/50 hover:bg-gray-50'}`}
                                                onClick={() => setViewingService(service)}
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div onClick={(e) => toggleService(service.id, e)} className="cursor-pointer">
                                                        <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${selectedServices.has(service.id) ? 'bg-primary border-primary' : 'border-gray-300 bg-white'}`}>
                                                            {selectedServices.has(service.id) && <CheckCircle className="h-3.5 w-3.5 text-white" />}
                                                        </div>
                                                    </div>

                                                    {service.images?.[0] && (
                                                        <div className="h-12 w-12 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0">
                                                            <img
                                                                src={service.images[0]}
                                                                alt={language === 'en' ? (service.name_en || service.name_fr) : service.name_fr}
                                                                className="w-full h-full object-cover"
                                                            />
                                                        </div>
                                                    )}
                                                    <div>
                                                        <h3 className="font-bold text-gray-900">{language === 'en' ? (service.name_en || service.name_fr) : service.name_fr}</h3>
                                                        <p className="text-sm text-gray-500 flex items-center">
                                                            <Clock className="h-3 w-3 mr-1" />
                                                            {service.duration} min
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-bold text-primary mb-1">
                                                        {new Intl.NumberFormat('fr-CM', { style: 'currency', currency: 'XAF' }).format(service.price)}
                                                    </p>
                                                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={(e) => {
                                                        e.stopPropagation();
                                                        setViewingService(service);
                                                    }}>
                                                        <Info className="h-4 w-4 text-gray-400" />
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                        {services.length === 0 && (
                                            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 text-center text-gray-500">
                                                {t('noServices')}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {activeTab === "about" && (
                                <div className="space-y-6">
                                    <h2 className="text-xl font-bold">{t('about')}</h2>
                                    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 prose max-w-none">
                                        <p>
                                            {language === 'en'
                                                ? (salon.description_en || salon.description_fr || "No description available.")
                                                : (salon.description_fr || "Aucune description disponible.")}
                                        </p>
                                    </div>

                                    {/* Contact Info */}
                                    <div className="space-y-3">
                                        {salon.phone && (
                                            <div className="flex items-center text-gray-600">
                                                <Phone className="h-4 w-4 mr-2 text-primary" />
                                                <span>{salon.phone}</span>
                                            </div>
                                        )}
                                        {salon.email && (
                                            <div className="flex items-center text-gray-600">
                                                <Mail className="h-4 w-4 mr-2 text-primary" />
                                                <span>{salon.email}</span>
                                            </div>
                                        )}
                                        {salon.website && (
                                            <div className="flex items-center text-gray-600">
                                                <Globe className="h-4 w-4 mr-2 text-primary" />
                                                <a href={salon.website} target="_blank" rel="noopener noreferrer" className="hover:underline text-primary">
                                                    Site web
                                                </a>
                                            </div>
                                        )}
                                    </div>

                                    <h3 className="text-lg font-bold mt-8 mb-4">{t('team')}</h3>
                                    {therapists.length > 0 ? (
                                        <div className="flex gap-4 overflow-x-auto pb-4">
                                            {therapists.map((therapist) => (
                                                <div key={therapist.id} className="flex-shrink-0 w-32 text-center">
                                                    <div className="h-20 w-20 rounded-full bg-gray-200 mx-auto mb-2 overflow-hidden">
                                                        {therapist.photo_url ? (
                                                            <img src={therapist.photo_url} alt="Team" className="h-full w-full object-cover" />
                                                        ) : (
                                                            <div className="h-full w-full flex items-center justify-center bg-gray-300">
                                                                <User className="h-8 w-8 text-gray-500" />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <p className="font-medium text-sm">{therapist.name}</p>
                                                    <p className="text-xs text-gray-500">{therapist.specialty}</p>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-gray-500">Aucun membre d'équipe listé.</p>
                                    )}
                                </div>
                            )}

                            {activeTab === "gallery" && (
                                <div className="space-y-6">
                                    <h2 className="text-xl font-bold">{t('gallery')}</h2>
                                    {salon.ambiance_images && salon.ambiance_images.length > 0 ? (
                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                            {salon.ambiance_images.map((img: string, index: number) => (
                                                <div key={index} className="aspect-square rounded-xl overflow-hidden bg-gray-100">
                                                    <img src={img} alt={`Gallery ${index}`} className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 text-center text-gray-500">
                                            {t('noPhotos')}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sticky top-24">
                            <h3 className="font-bold text-lg mb-4">{t('book')}</h3>
                            <div className="space-y-4 mb-6">
                                {salon.opening_hours && (
                                    <div className="flex items-center text-sm text-gray-600">
                                        <Clock className="h-4 w-4 mr-3 text-primary" />
                                        <span>{formatOpeningHours(salon.opening_hours)}</span>
                                    </div>
                                )}
                                {salon.phone && (
                                    <div className="flex items-center text-sm text-gray-600">
                                        <Phone className="h-4 w-4 mr-3 text-primary" />
                                        <span>{salon.phone}</span>
                                    </div>
                                )}
                                {salon.website && (
                                    <div className="flex items-center text-sm text-gray-600">
                                        <Globe className="h-4 w-4 mr-3 text-primary" />
                                        <span>{salon.website}</span>
                                    </div>
                                )}
                            </div>

                            <Button
                                className="w-full font-bold text-lg h-12 rounded-xl mb-3 bg-white border-2 border-[#1E3A5F] text-[#1E3A5F] hover:bg-gray-50"
                                onClick={handleChatClick}
                            >
                                Discuter
                            </Button>

                            <Button className="w-full font-bold text-lg h-12 rounded-xl mb-4" onClick={handleBook}>
                                {selectedServices.size > 0
                                    ? `Réserver (${selectedServices.size})`
                                    : t('book')}
                            </Button>

                            <p className="text-xs text-center text-gray-400">
                                {t('immediateConfirm')}
                            </p>

                            <hr className="my-6" />

                            <div className="space-y-3">
                                <div className="flex items-center text-sm text-gray-500">
                                    <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                                    <span>{t('verifiedPros')}</span>
                                </div>
                                <div className="flex items-center text-sm text-gray-500">
                                    <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                                    <span>{t('securePayment')}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
