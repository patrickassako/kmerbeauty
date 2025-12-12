"use client";

import { useEffect, useState, Suspense } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { ArrowLeft, MapPin, Star, Clock, Calendar, Check, Shield, Info, Loader2 } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

function ServiceDetailsContent() {
    const params = useParams();
    const searchParams = useSearchParams();
    const router = useRouter();
    const id = params.id as string;

    const userLat = parseFloat(searchParams.get("lat") || "0");
    const userLon = parseFloat(searchParams.get("lon") || "0");
    const locationStr = searchParams.get("location") || "";

    // Simple parsing of location string "District, City"
    const [district, city] = locationStr.includes(",")
        ? locationStr.split(",").map(s => s.trim())
        : [null, locationStr.trim() || null];

    const [service, setService] = useState<any>(null);
    const [providers, setProviders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'all' | 'salon' | 'individual'>('all');

    useEffect(() => {
        async function fetchData() {
            if (!id) return;
            const supabase = createClient();

            try {
                // 1. Fetch Service Details
                const { data: serviceData, error: serviceError } = await supabase
                    .from("services")
                    .select("*")
                    .eq("id", id)
                    .single();

                if (serviceError) throw serviceError;
                setService(serviceData);

                // 2. Fetch Providers using Backend RPC
                let lat = userLat;
                let lng = userLon;
                let locCity = city;
                let locDistrict = district;

                // Fallback to localStorage if params are missing
                if (!lat && !lng && typeof window !== 'undefined') {
                    const saved = localStorage.getItem('userLocation');
                    if (saved) {
                        try {
                            const { query, coords } = JSON.parse(saved);
                            if (coords) {
                                lat = coords.lat;
                                lng = coords.lon;
                            }
                            if (query) {
                                // Simple parse again
                                const parts = query.split(',').map((s: string) => s.trim());
                                if (parts.length > 1) {
                                    locDistrict = parts[0];
                                    locCity = parts[1];
                                } else {
                                    locCity = parts[0];
                                }
                            }
                        } catch (e) {
                            console.error("Error parsing saved location", e);
                        }
                    }
                }

                console.log("Fetching providers with params:", {
                    lat: lat || null,
                    lng: lng || null,
                    radius_meters: 30000,
                    client_city: locCity,
                    client_district: locDistrict,
                    filter_service_id: id
                });

                // Ensure empty strings are converted to null for proper fallback behavior in RPC
                const effectiveCity = locCity && locCity.trim() !== '' ? locCity : null;
                const effectiveDistrict = locDistrict && locDistrict.trim() !== '' ? locDistrict : null;

                const { data: rpcData, error: rpcError } = await supabase.rpc('get_nearby_providers', {
                    lat: lat || null,
                    lng: lng || null,
                    radius_meters: 30000, // 30km radius
                    client_city: effectiveCity,
                    client_district: effectiveDistrict,
                    filter_service_id: id
                });

                console.log("RPC Response:", { rpcData, rpcError });

                if (rpcError) throw rpcError;

                // 3. Fetch full details for the returned providers to get accurate address/quarter
                const salonIds = rpcData?.filter((p: any) => p.type === 'salon').map((p: any) => p.id) || [];
                const therapistIds = rpcData?.filter((p: any) => p.type === 'therapist').map((p: any) => p.id) || [];

                let salonsDetails: any[] = [];
                let therapistsDetails: any[] = [];

                if (salonIds.length > 0) {
                    const { data: sData } = await supabase
                        .from('salons')
                        .select('id, address, quarter, city, street')
                        .in('id', salonIds);
                    salonsDetails = sData || [];
                }

                if (therapistIds.length > 0) {
                    const { data: tData } = await supabase
                        .from('therapists')
                        .select('id, city, region')
                        .in('id', therapistIds);
                    therapistsDetails = tData || [];
                }

                // Map RPC result to component state, merging with full details
                const formattedProviders = (rpcData || []).map((item: any) => {
                    let address = item.city; // Default fallback

                    if (item.type === 'salon') {
                        const details = salonsDetails.find(s => s.id === item.id);
                        if (details) {
                            // Construct detailed address: Quarter, City or Address
                            if (details.quarter) address = `${details.quarter}, ${details.city}`;
                            else if (details.address) address = details.address;
                        }
                    } else {
                        const details = therapistsDetails.find(t => t.id === item.id);
                        if (details) {
                            address = "À domicile / Mobile"; // Keep generic for mobile therapists unless specific location needed
                            if (!item.is_mobile) {
                                address = `${details.city}`;
                            }
                        }
                    }

                    return {
                        id: item.id,
                        type: item.type === 'therapist' ? 'individual' : 'salon',
                        name: item.name,
                        address: address,
                        rating: item.rating,
                        reviewCount: item.review_count,
                        image: item.image,
                        price: item.service_price,
                        duration: 60,
                        distance: item.distance_meters ? item.distance_meters / 1000 : null,
                        lat: item.latitude,
                        lon: item.longitude,
                        matchType: item.match_type, // 'district_match', 'city_match', 'proximity_or_fallback'
                        isMobile: item.is_mobile
                    };
                });

                // Re-sort if needed (though backend mostly handles it)
                // Prioritize district matches if we have a district
                if (effectiveDistrict) {
                    formattedProviders.sort((a: any, b: any) => {
                        if (a.matchType === 'district_match' && b.matchType !== 'district_match') return -1;
                        if (b.matchType === 'district_match' && a.matchType !== 'district_match') return 1;
                        return (a.distance || 9999) - (b.distance || 9999);
                    });
                }

                console.log("Formatted Providers:", formattedProviders);
                setProviders(formattedProviders);

            } catch (error) {
                console.error("Error fetching data:", error);
            } finally {
                setLoading(false);
            }
        }

        fetchData();
    }, [id, userLat, userLon, city, district]);

    const filteredProviders = activeTab === 'all'
        ? providers
        : providers.filter(p => p.type === activeTab);

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!service) {
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
                <h1 className="text-2xl font-bold mb-4">Service non trouvé</h1>
                <Button onClick={() => router.back()}>Retour</Button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* Header Image */}
            <div className="relative h-[300px] md:h-[400px]">
                <img
                    src={service.images?.[0] || "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&q=80&w=800"}
                    alt={service.name_fr}
                    className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/40" />
                <div className="absolute top-4 left-4 z-10">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="text-white hover:bg-white/20 rounded-full"
                        onClick={() => router.back()}
                    >
                        <ArrowLeft className="h-6 w-6" />
                    </Button>
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10 text-white bg-gradient-to-t from-black/80 to-transparent">
                    <div className="container">
                        <span className="px-3 py-1 rounded-full bg-primary text-white text-xs font-bold mb-3 inline-block">
                            {service.category}
                        </span>
                        <h1 className="text-3xl md:text-5xl font-bold mb-2">{service.name_fr}</h1>
                        <p className="text-gray-200 text-lg max-w-2xl line-clamp-2">
                            {service.description_fr}
                        </p>
                    </div>
                </div>
            </div>

            <div className="container py-8 -mt-8 relative z-10">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Main Content - Provider List */}
                    <div className="lg:col-span-2 space-y-6">

                        {/* Filters */}
                        <div className="bg-white rounded-xl p-4 shadow-sm flex items-center justify-between sticky top-20 z-20">
                            <div className="flex gap-2">
                                <Button
                                    variant={activeTab === 'all' ? 'default' : 'ghost'}
                                    size="sm"
                                    onClick={() => setActiveTab('all')}
                                    className="rounded-full"
                                >
                                    Tous
                                </Button>
                                <Button
                                    variant={activeTab === 'salon' ? 'default' : 'ghost'}
                                    size="sm"
                                    onClick={() => setActiveTab('salon')}
                                    className="rounded-full"
                                >
                                    Salons
                                </Button>
                                <Button
                                    variant={activeTab === 'individual' ? 'default' : 'ghost'}
                                    size="sm"
                                    onClick={() => setActiveTab('individual')}
                                    className="rounded-full"
                                >
                                    Indépendants
                                </Button>
                            </div>
                            <span className="text-sm text-gray-500 font-medium">
                                {filteredProviders.length} résultats
                            </span>
                        </div>

                        {/* Providers List */}
                        <div className="space-y-4">
                            {filteredProviders.map((provider) => (
                                <div key={`${provider.type}-${provider.id}`} className="bg-white rounded-xl p-4 shadow-sm border hover:shadow-md transition-all flex flex-col md:flex-row gap-4 relative overflow-hidden">

                                    {/* Match Badge */}
                                    {provider.matchType === 'district_match' && (
                                        <div className="absolute top-0 right-0 bg-green-500 text-white text-[10px] font-bold px-2 py-1 rounded-bl-lg z-10">
                                            QUARTIER
                                        </div>
                                    )}

                                    {/* Provider Image */}
                                    <div className="w-full md:w-32 h-32 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0">
                                        <img
                                            src={provider.image || "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&q=80&w=800"}
                                            alt={provider.name}
                                            className="w-full h-full object-cover"
                                        />
                                    </div>

                                    {/* Provider Details */}
                                    <div className="flex-1 flex flex-col justify-between">
                                        <div>
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <h3 className="font-bold text-lg text-gray-900 flex items-center gap-2">
                                                        {provider.name}
                                                        {provider.type === 'individual' && provider.isMobile && (
                                                            <span className="bg-blue-50 text-blue-600 text-[10px] px-1.5 py-0.5 rounded border border-blue-100">Mobile</span>
                                                        )}
                                                    </h3>
                                                    <p className="text-sm text-gray-500 flex items-center mt-1">
                                                        <MapPin className="h-3.5 w-3.5 mr-1" />
                                                        {provider.address}

                                                        {/* Distance / Zone Logic */}
                                                        {provider.type === 'salon' && provider.distance !== null && (
                                                            <span className="ml-2 text-primary font-medium bg-primary/10 px-2 py-0.5 rounded-full text-xs">
                                                                {provider.distance.toFixed(1)} km
                                                            </span>
                                                        )}
                                                        {provider.type === 'individual' && (provider.matchType === 'district_match' || provider.matchType === 'city_match') && (
                                                            <span className="ml-2 text-green-600 font-medium bg-green-50 px-2 py-0.5 rounded-full text-xs flex items-center">
                                                                <Check className="h-3 w-3 mr-1" />
                                                                Couvre votre zone
                                                            </span>
                                                        )}
                                                    </p>
                                                </div>
                                                <div className="flex items-center bg-green-50 px-2 py-1 rounded text-green-700 text-xs font-bold">
                                                    <Star className="h-3 w-3 mr-1 fill-current" />
                                                    {provider.rating || "N/A"}
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-4 mt-3 text-sm">
                                                <div className="flex items-center text-gray-600">
                                                    <Clock className="h-4 w-4 mr-1.5 text-primary" />
                                                    {provider.duration} min
                                                </div>
                                                <div className="flex items-center text-gray-600">
                                                    <Check className="h-4 w-4 mr-1.5 text-green-600" />
                                                    Dispo aujourd'hui
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                                            <div>
                                                <span className="text-xs text-gray-500 uppercase font-semibold">Prix du service</span>
                                                <p className="text-xl font-bold text-primary">
                                                    {new Intl.NumberFormat('fr-CM', { style: 'currency', currency: 'XAF' }).format(provider.price)}
                                                </p>
                                            </div>
                                            <div className="flex gap-2">
                                                <Button
                                                    variant="outline"
                                                    onClick={() => {
                                                        if (provider.type === 'salon') {
                                                            router.push(`/salons/${provider.id}?serviceId=${id}`);
                                                        } else {
                                                            router.push(`/therapist/${provider.id}?serviceId=${id}&lat=${userLat}&lon=${userLon}&location=${encodeURIComponent(locationStr)}`);
                                                        }
                                                    }}
                                                >
                                                    Voir le profil
                                                </Button>
                                                <Button onClick={() => router.push(`/booking/${provider.id}?serviceId=${id}&type=${provider.type}&lat=${userLat}&lon=${userLon}&location=${encodeURIComponent(locationStr)}`)}>
                                                    Réserver
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {filteredProviders.length === 0 && (
                                <div className="text-center py-12 bg-white rounded-xl border border-dashed">
                                    <p className="text-gray-500">Aucun prestataire trouvé pour ce filtre.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Sidebar Info */}
                    <div className="space-y-6">
                        <div className="bg-white rounded-xl p-6 shadow-sm border sticky top-24">
                            <h3 className="font-bold text-lg mb-4 flex items-center">
                                <Info className="h-5 w-5 mr-2 text-primary" />
                                À propos du service
                            </h3>
                            <p className="text-gray-600 text-sm leading-relaxed mb-6">
                                {service.description_fr || "Aucune description détaillée disponible pour ce service."}
                            </p>

                            <div className="space-y-3">
                                <div className="flex items-start gap-3">
                                    <Shield className="h-5 w-5 text-green-600 mt-0.5" />
                                    <div>
                                        <h4 className="font-medium text-sm">Paiement sécurisé</h4>
                                        <p className="text-xs text-gray-500">Votre paiement est retenu jusqu'à la fin du service.</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <Calendar className="h-5 w-5 text-blue-600 mt-0.5" />
                                    <div>
                                        <h4 className="font-medium text-sm">Annulation flexible</h4>
                                        <p className="text-xs text-gray-500">Annulez jusqu'à 24h avant le rendez-vous.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}

export default function ServiceDetailsPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>}>
            <ServiceDetailsContent />
        </Suspense>
    );
}

