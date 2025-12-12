"use client";

import { useState, useEffect, Suspense } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Calendar, Clock, MapPin, CheckCircle, CreditCard, User, Mail, Phone } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { Modal } from "@/components/ui/Modal";
import { LoginForm } from "@/components/auth/LoginForm";
import { SignupForm } from "@/components/auth/SignupForm";
import Link from "next/link";
import { useInteractionTracking } from "@/hooks/useInteractionTracking";

function BookingContent() {
    const { id } = useParams();
    const router = useRouter();
    const searchParams = useSearchParams();
    const { t, language } = useLanguage();
    const supabase = createClient();
    const { trackInteraction } = useInteractionTracking();

    const [salon, setSalon] = useState<any>(null);
    const [services, setServices] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [authChecking, setAuthChecking] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);
    const [providerType, setProviderType] = useState<'salon' | 'individual'>('salon');
    const [showLoginModal, setShowLoginModal] = useState(false);
    const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
    const [pendingBooking, setPendingBooking] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        name: "",
        phone: "",
        description: "",
        date: "",
        time: ""
    });

    // Generate next 14 days
    const generateDates = () => {
        const dates = [];
        const today = new Date();
        for (let i = 0; i < 14; i++) {
            const date = new Date(today);
            date.setDate(today.getDate() + i);
            dates.push(date);
        }
        return dates;
    };

    // Generate time slots
    const generateTimeSlots = () => {
        const slots = [];
        for (let i = 8; i <= 20; i++) {
            slots.push(`${i.toString().padStart(2, '0')}:00`);
            slots.push(`${i.toString().padStart(2, '0')}:30`);
        }
        return slots;
    };

    const dates = generateDates();
    const timeSlots = generateTimeSlots();

    const handleDateSelect = (date: Date) => {
        setFormData(prev => ({ ...prev, date: date.toISOString().split('T')[0] }));
    };

    const handleTimeSelect = (time: string) => {
        setFormData(prev => ({ ...prev, time }));
    };

    useEffect(() => {
        async function checkAuth() {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                // User is logged in, we can pre-fill info if needed
            }
            setAuthChecking(false);
        }
        checkAuth();
    }, [id, searchParams, router]);

    useEffect(() => {
        async function fetchData() {
            if (!id) return;

            const pType = searchParams.get('type'); // 'salon' or 'individual'
            setProviderType(pType === 'individual' ? 'individual' : 'salon');

            let providerData = null;

            if (pType === 'individual') {
                // Fetch Therapist
                const { data: therapistData, error: therapistError } = await supabase
                    .from('therapists')
                    .select('*')
                    .eq('id', id)
                    .single();

                if (therapistError) {
                    console.error("Error fetching therapist:", therapistError);
                } else {
                    // Normalize to match "salon" structure for this page
                    // We might need user name if business_name is empty
                    let displayName = therapistData.business_name || therapistData.name;

                    if (!displayName && therapistData.user_id) {
                        const { data: uData } = await supabase
                            .from('users')
                            .select('first_name, last_name, phone')
                            .eq('id', therapistData.user_id)
                            .maybeSingle();
                        if (uData) {
                            displayName = `${uData.first_name} ${uData.last_name}`;
                            // Use user's phone if therapist phone is missing
                            if (!therapistData.phone) {
                                therapistData.phone = uData.phone;
                            }
                        }
                    }

                    providerData = {
                        ...therapistData,
                        name_fr: displayName || "Prestataire", // Map to name_fr used in UI
                        cover_image: therapistData.profile_image, // Map image
                        address: therapistData.city, // Map address
                        phone: therapistData.phone // Ensure phone is passed
                    };
                }
            } else {
                // Fetch Salon (Default)
                const { data: salonData, error: salonError } = await supabase
                    .from('salons')
                    .select('*')
                    .eq('id', id)
                    .single();

                if (salonError) {
                    console.error("Error fetching salon:", salonError);
                } else {
                    providerData = salonData;
                }
            }

            setSalon(providerData);

            // Fetch Selected Services
            const serviceIds = searchParams.get('serviceIds')?.split(',') || [];
            const singleServiceId = searchParams.get('serviceId');
            if (singleServiceId && !serviceIds.includes(singleServiceId)) {
                serviceIds.push(singleServiceId);
            }

            if (serviceIds.length > 0) {
                let fetchedServices: any[] = [];

                if (pType === 'individual') {
                    // Fetch from therapist_services to get specific price
                    const { data: tsData, error: tsError } = await supabase
                        .from('therapist_services')
                        .select(`
                            price,
                            duration,
                            service:services (*)
                        `)
                        .eq('therapist_id', id)
                        .in('service_id', serviceIds);

                    if (tsData) {
                        fetchedServices = tsData.map((item: any) => ({
                            ...item.service,
                            price: item.price, // Override with specific price
                            duration: item.duration || item.service.duration // Override duration if present
                        }));
                    }
                } else {
                    // Fetch from salon_services
                    const { data: ssData, error: ssError } = await supabase
                        .from('salon_services')
                        .select(`
                            price,
                            duration,
                            service:services (*)
                        `)
                        .eq('salon_id', id)
                        .in('service_id', serviceIds);

                    if (ssData) {
                        fetchedServices = ssData.map((item: any) => ({
                            ...item.service,
                            price: item.price,
                            duration: item.duration || item.service.duration
                        }));
                    }
                }

                // Fallback: If no specific services found (e.g. not linked), fetch base services
                // This handles cases where a service might be booked but not explicitly linked in the join table yet
                if (fetchedServices.length === 0) {
                    console.log("No specific pricing found, fetching base services...");
                    const { data: baseServices, error: baseError } = await supabase
                        .from('services')
                        .select('*')
                        .in('id', serviceIds);

                    if (baseServices) {
                        fetchedServices = baseServices;
                    }
                }

                console.log("Final Fetched Services:", fetchedServices);
                setServices(fetchedServices);
            }

            setLoading(false);
        }

        fetchData();
    }, [id, searchParams]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const calculateTotal = () => {
        return services.reduce((acc, curr) => acc + (curr.price || 0), 0);
    };

    const calculateDuration = () => {
        return services.reduce((acc, curr) => acc + (curr.duration || 0), 0);
    };

    const handleSubmit = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        setSubmitting(true);

        try {
            // 1. Create Booking
            // Note: We are using customer_email to store description for now if no notes column exists, 
            // or we can try to add a notes column. 
            // Let's assume we can pass it as 'notes' if the table supports it, otherwise we might need a migration.
            // 0. Get Current User (Required by Schema)
            console.log("Checking auth status...");
            const { data: { user } } = await supabase.auth.getUser();
            console.log("Auth check result:", user ? "Logged in" : "Not logged in");

            if (!user) {
                console.log("User not logged in, showing modal...");
                // Show Login Modal instead of redirecting
                setPendingBooking(true);
                setShowLoginModal(true);
                setSubmitting(false);
                return;
            }

            // Fix: Ensure date is in ISO format for Supabase timestamptz
            const bookingDateTime = new Date(`${formData.date}T${formData.time}:00`);
            const total = Number(calculateTotal());
            const duration = Number(calculateDuration());

            // Construct Payload matching the provided Schema
            const bookingPayload: any = {
                user_id: user.id,
                salon_id: providerType === 'salon' ? id : null,
                therapist_id: providerType === 'individual' ? id : null,
                scheduled_at: bookingDateTime.toISOString(),
                duration: duration,
                location_type: providerType === 'salon' ? 'SALON' : 'HOME', // Default to HOME/MOBILE for individuals
                city: salon?.city || 'Yaoundé',
                region: salon?.region || 'Centre', // Fallback
                subtotal: total,
                total: total,
                notes: formData.description,
                status: 'PENDING',
                // Optional/Defaulted fields
                // travel_fee: 0,
                // tip: 0,
                // instructions: null
            };

            console.log("Sending Booking Payload:", bookingPayload);

            const { data: bookingData, error: bookingError } = await supabase
                .from('bookings')
                .insert(bookingPayload)
                .select()
                .single();

            if (bookingError) {
                console.error("Supabase Booking Error:", bookingError);
                alert(`Erreur détaillée: ${bookingError.message || JSON.stringify(bookingError)}`);
                throw bookingError;
            }

            // 2. Create Booking Items (instead of booking_services)
            if (services.length > 0 && bookingData) {
                const bookingItems = services.map(service => ({
                    booking_id: bookingData.id,
                    service_name: service.name_fr || service.name_en || "Service",
                    price: service.price,
                    duration: service.duration || 30 // Default duration if missing
                }));

                const { error: itemsError } = await supabase
                    .from('booking_items')
                    .insert(bookingItems);

                if (itemsError) {
                    console.error("Supabase Booking Items Error:", itemsError);
                    alert(`Erreur lors de l'ajout des services: ${itemsError.message}`);
                    // Optional: Delete the booking if items fail? 
                    // For now, just throw to stop success state.
                    throw itemsError;
                }
            }

            // TRACKING: Debit credits for Booking Confirmed
            // Reference ID is the Booking ID
            await trackInteraction(
                id as string,
                providerType === 'individual' ? 'therapist' : 'salon',
                'booking_confirmed',
                user.id,
                bookingData.id // Reference ID
            );

            setSuccess(true);
            router.push(`/profile?booking_success=${bookingData.id}`); // Redirect to Back Office (Profile)
        } catch (error) {
            console.error("Error creating booking:", error);
            alert("Une erreur est survenue lors de la réservation. Veuillez réessayer.");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading || authChecking) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (success) {
        const whatsappMessage = encodeURIComponent(`Bonjour, je viens de réserver pour le ${formData.date} à ${formData.time}.`);
        const providerPhone = salon?.phone || ""; // Ensure salon object has phone, or fallback to empty
        // Clean phone for WhatsApp link (remove +, spaces, etc if needed, but wa.me usually handles international format without + or with)
        const waLink = providerPhone ? `https://wa.me/${providerPhone.replace('+', '')}?text=${whatsappMessage}` : "#";

        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-xl p-6 max-w-md w-full">
                    <div className="text-center mb-6">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <CheckCircle className="h-8 w-8 text-green-600" />
                        </div>
                        <h1 className="text-2xl font-bold mb-1">Réservation Confirmée !</h1>
                        <p className="text-gray-500 text-sm">Votre demande a été envoyée avec succès.</p>
                    </div>

                    {/* Status Badge */}
                    <div className="flex justify-center mb-6">
                        <span className="bg-orange-100 text-orange-700 px-4 py-1.5 rounded-full text-sm font-medium flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            En attente de confirmation
                        </span>
                    </div>

                    {/* Recap Card */}
                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 mb-6 space-y-3">
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-500">Date & Heure</span>
                            <span className="font-medium text-gray-900">{formData.date} à {formData.time}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-500">Lieu</span>
                            <span className="font-medium text-gray-900 text-right truncate max-w-[200px]">{salon?.name_fr}</span>
                        </div>
                        <div className="border-t border-gray-200 my-2"></div>
                        {services.map((s, i) => (
                            <div key={i} className="flex justify-between items-center text-sm">
                                <span className="text-gray-500 truncate max-w-[200px]">{s.name_fr || s.name_en}</span>
                                <span className="font-medium">{s.price?.toLocaleString('fr-FR')} XAF</span>
                            </div>
                        ))}
                        <div className="border-t border-gray-200 my-2"></div>
                        <div className="flex justify-between items-center text-base font-bold">
                            <span className="text-gray-900">Total</span>
                            <span className="text-[#FFB700]">{calculateTotal().toLocaleString('fr-FR')} XAF</span>
                        </div>
                    </div>

                    <div className="space-y-3">
                        {/* WhatsApp Button */}
                        {providerPhone && (
                            <a
                                href={waLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-center gap-2 w-full py-3 bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold rounded-xl transition-all"
                                onClick={() => {
                                    trackInteraction(
                                        id as string,
                                        providerType === 'individual' ? 'therapist' : 'salon',
                                        'chat_started',
                                        // We don't have user object easily here in render, need to store it or use guestId
                                        // But this view is only shown after submission where we checked auth.
                                        undefined, // use default/guestId logic (or capture user.id in state if needed)
                                        'whatsapp_click' // use whatsapp_click as ref or meta?
                                    );
                                }}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                                </svg>
                                Discuter avec le prestataire
                            </a>
                        )}

                        <Button variant="outline" className="w-full" onClick={() => router.push('/')}>
                            Retour à l'accueil
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* Header */}
            <div className="bg-white shadow-sm sticky top-0 z-10">
                <div className="container mx-auto px-4 h-16 flex items-center gap-4 justify-between">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" onClick={() => router.back()}>
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                        <h1 className="font-bold text-lg">Finaliser la réservation</h1>
                    </div>

                </div>
            </div>

            <div className="container mx-auto px-4 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Booking Form */}
                    <div className="lg:col-span-2 space-y-6">

                        {/* Date Selection */}
                        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                            <h2 className="text-lg font-bold mb-4 flex items-center">
                                <Calendar className="h-5 w-5 mr-2 text-primary" />
                                Choisir une date
                            </h2>
                            <div className="flex overflow-x-auto pb-4 gap-3 no-scrollbar">
                                {dates.map((date, index) => {
                                    const isSelected = formData.date === date.toISOString().split('T')[0];
                                    const days = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
                                    const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];

                                    return (
                                        <button
                                            key={index}
                                            onClick={() => handleDateSelect(date)}
                                            className={`flex-shrink-0 w-20 h-24 rounded-xl flex flex-col items-center justify-center border-2 transition-all ${isSelected
                                                ? 'border-primary bg-primary text-white shadow-md scale-105'
                                                : 'border-gray-100 bg-white text-gray-600 hover:border-primary/50'
                                                }`}
                                        >
                                            <span className="text-sm font-medium mb-1">{days[date.getDay()]}</span>
                                            <span className="text-2xl font-bold mb-1">{date.getDate()}</span>
                                            <span className="text-xs opacity-80">{months[date.getMonth()]}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Time Selection */}
                        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                            <h2 className="text-lg font-bold mb-4 flex items-center">
                                <Clock className="h-5 w-5 mr-2 text-primary" />
                                Choisir une heure
                            </h2>
                            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                                {timeSlots.map((time, index) => {
                                    const isSelected = formData.time === time;

                                    // Filter past times if today
                                    if (formData.date) {
                                        const now = new Date();
                                        const selectedDate = new Date(formData.date);
                                        const isToday = selectedDate.getDate() === now.getDate() &&
                                            selectedDate.getMonth() === now.getMonth() &&
                                            selectedDate.getFullYear() === now.getFullYear();

                                        if (isToday) {
                                            const [hours, minutes] = time.split(':').map(Number);
                                            const slotTime = new Date(now);
                                            slotTime.setHours(hours, minutes, 0, 0);

                                            if (slotTime < now) return null;
                                        }
                                    }

                                    return (
                                        <button
                                            key={index}
                                            onClick={() => handleTimeSelect(time)}
                                            className={`py-2 px-4 rounded-lg text-sm font-medium border transition-all ${isSelected
                                                ? 'border-primary bg-primary text-white shadow-sm'
                                                : 'border-gray-200 bg-white text-gray-700 hover:border-primary/50 hover:bg-gray-50'
                                                }`}
                                        >
                                            {time}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Personal Details */}
                        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                            <h2 className="text-lg font-bold mb-4 flex items-center">
                                <User className="h-5 w-5 mr-2 text-primary" />
                                Vos Coordonnées
                            </h2>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Nom complet</label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                        <Input
                                            className="pl-10"
                                            placeholder="John Doe"
                                            name="name"
                                            required
                                            value={formData.name}
                                            onChange={handleInputChange}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
                                    <div className="relative">
                                        <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                        <Input
                                            className="pl-10"
                                            type="tel"
                                            placeholder="+237 6..."
                                            name="phone"
                                            required
                                            value={formData.phone}
                                            onChange={handleInputChange}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Indication du lieu / Description</label>
                                    <textarea
                                        className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                        placeholder="Précisez le lieu exact ou ajoutez des détails pour le prestataire..."
                                        name="description"
                                        value={formData.description}
                                        onChange={handleInputChange}
                                    />
                                </div>
                            </div>
                        </div>

                    </div>

                    {/* Summary Sidebar */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 sticky top-24">
                            <h3 className="font-bold text-lg mb-4">Récapitulatif</h3>

                            {/* Salon Info */}
                            <div className="flex items-start gap-3 mb-6 pb-6 border-b">
                                <div className="h-12 w-12 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0">
                                    {salon?.cover_image ? (
                                        <img src={salon.cover_image} alt={salon.name_fr} className="w-full h-full object-cover" />
                                    ) : (
                                        <MapPin className="h-6 w-6 m-3 text-gray-400" />
                                    )}
                                </div>
                                <div>
                                    <p className="font-bold">{salon?.name_fr}</p>
                                    <p className="text-sm text-gray-500">{salon?.address}, {salon?.city}</p>
                                </div>
                            </div>

                            {/* Services List */}
                            <div className="space-y-3 mb-6">
                                {services.map((service) => (
                                    <div key={service.id} className="flex justify-between text-sm">
                                        <span className="text-gray-600 flex-1 pr-4">{language === 'en' ? service.name_en : service.name_fr}</span>
                                        <span className="font-medium">
                                            {new Intl.NumberFormat('fr-CM', { style: 'currency', currency: 'XAF' }).format(service.price)}
                                        </span>
                                    </div>
                                ))}
                            </div>

                            <div className="border-t pt-4 mb-6">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-gray-600">Durée totale</span>
                                    <span className="font-medium flex items-center">
                                        <Clock className="h-4 w-4 mr-1 text-gray-400" />
                                        {calculateDuration()} min
                                    </span>
                                </div>
                                <div className="flex justify-between items-center text-lg font-bold text-primary">
                                    <span>Total à payer</span>
                                    <span>
                                        {new Intl.NumberFormat('fr-CM', { style: 'currency', currency: 'XAF' }).format(calculateTotal())}
                                    </span>
                                </div>
                            </div>

                            <Button
                                className="w-full h-12 text-lg font-bold"
                                onClick={handleSubmit}
                                disabled={submitting || !formData.date || !formData.time || !formData.name || !formData.phone}
                            >
                                {submitting ? "Traitement..." : "Confirmer la réservation"}
                            </Button>

                            <p className="text-xs text-center text-gray-400 mt-4">
                                Paiement sur place. Annulation gratuite jusqu'à 24h avant.
                            </p>
                        </div>
                    </div>

                </div>
            </div>
            {/* Login/Signup Modal */}
            <Modal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)}>
                {authMode === 'login' ? (
                    <LoginForm
                        isModal={true}
                        onSuccess={() => {
                            setShowLoginModal(false);
                            if (pendingBooking) {
                                handleSubmit();
                                setPendingBooking(false);
                            }
                        }}
                        onSwitchToSignup={() => setAuthMode('signup')}
                    />
                ) : (
                    <SignupForm
                        isModal={true}
                        onSuccess={() => {
                            setShowLoginModal(false);
                            if (pendingBooking) {
                                handleSubmit();
                                setPendingBooking(false);
                            }
                        }}
                        onSwitchToLogin={() => setAuthMode('login')}
                    />
                )}
            </Modal>
        </div>
    );
}

export default function BookingPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <BookingContent />
        </Suspense>
    );
}
