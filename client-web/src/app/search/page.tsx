"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, MapPin, Star, Heart, Filter, SlidersHorizontal } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

// Reusing categories from Home page for consistency
const categories = [
    { id: "hair", name: "Coiffure" },
    { id: "barber", name: "Barbier" },
    { id: "nails", name: "Onglerie" },
    { id: "makeup", name: "Maquillage" },
    { id: "massage", name: "Massage" },
    { id: "skincare", name: "Soins Visage" },
];

const CATEGORY_MAPPING: Record<string, string> = {
    "hair": "HAIRDRESSING",
    "barber": "BARBER",
    "nails": "NAIL_CARE",
    "makeup": "MAKEUP",
    "massage": "WELLNESS_MASSAGE",
    "skincare": "FACIAL",
};

function SearchContent() {
    const searchParams = useSearchParams();
    const initialCategory = searchParams.get("category");
    const initialQuery = searchParams.get("q");
    const lat = searchParams.get("lat");
    const lon = searchParams.get("lon");
    const location = searchParams.get("location");

    const [services, setServices] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState(initialQuery || "");
    const [selectedCategory, setSelectedCategory] = useState(initialCategory || "all");

    useEffect(() => {
        fetchServices();
    }, [searchParams, selectedCategory, searchTerm]);

    async function fetchServices() {
        setLoading(true);
        const supabase = createClient();

        let query = supabase.from("services").select("*");

        // Apply Category Filter
        if (selectedCategory && selectedCategory !== "all") {
            const dbCategory = CATEGORY_MAPPING[selectedCategory];
            if (dbCategory) {
                query = query.eq("category", dbCategory);
            }
        }

        // Apply Search Term
        if (searchTerm) {
            query = query.ilike("name_fr", `%${searchTerm}%`);
        }

        const { data, error } = await query;

        if (!error && data) {
            setServices(data);
        } else {
            console.error("Error fetching services:", error);
            setServices([]);
        }
        setLoading(false);
    }

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        fetchServices();
    };

    const getServiceLink = (serviceId: string) => {
        const params = new URLSearchParams();
        if (lat) params.set('lat', lat);
        if (lon) params.set('lon', lon);
        if (location) params.set('location', location);
        return `/service/${serviceId}?${params.toString()}`;
    };

    return (
        <div className="min-h-screen bg-background flex flex-col">
            {/* Search Header */}
            <div className="bg-white border-b sticky top-[72px] z-30 shadow-sm">
                <div className="container py-4">
                    <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                            <Input
                                placeholder="Rechercher un service (ex: Coupe, Massage)..."
                                className="pl-10 h-11 bg-gray-50 border-gray-200 text-base md:text-sm"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <Button type="submit" size="lg" className="h-11 px-8 font-bold">
                            Rechercher
                        </Button>
                    </form>

                    {/* Filters Row */}
                    <div className="flex items-center gap-2 mt-4 overflow-x-auto pb-2 scrollbar-hide">
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-9 rounded-full border-dashed"
                        >
                            <SlidersHorizontal className="mr-2 h-4 w-4" />
                            Filtres
                        </Button>
                        <div className="h-6 w-px bg-gray-200 mx-2" />
                        <Button
                            variant={selectedCategory === "all" ? "default" : "outline"}
                            size="sm"
                            className="h-9 rounded-full"
                            onClick={() => setSelectedCategory("all")}
                        >
                            Tout
                        </Button>
                        {categories.map((cat) => (
                            <Button
                                key={cat.id}
                                variant={selectedCategory === cat.id ? "default" : "outline"}
                                size="sm"
                                className="h-9 rounded-full whitespace-nowrap"
                                onClick={() => setSelectedCategory(cat.id)}
                            >
                                {cat.name}
                            </Button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Results Section */}
            <div className="flex-1 container py-8">
                <div className="flex items-center justify-between mb-6">
                    <h1 className="text-xl font-bold text-gray-900">
                        {loading ? "Recherche..." : `${services.length} services trouvés`}
                    </h1>
                    {location && (
                        <div className="flex items-center text-sm text-primary bg-primary/10 px-3 py-1 rounded-full">
                            <MapPin className="h-3 w-3 mr-1" />
                            Proche de : {location}
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {loading ? (
                        // Loading Skeletons
                        Array.from({ length: 8 }).map((_, i) => (
                            <div key={i} className="bg-card rounded-xl h-80 animate-pulse border" />
                        ))
                    ) : services.length > 0 ? (
                        services.map((service) => (
                            <Link key={service.id} href={getServiceLink(service.id)} className="group block">
                                <div className="bg-card rounded-xl overflow-hidden border shadow-sm hover:shadow-lg transition-all duration-300 h-full flex flex-col">
                                    <div className="relative h-48 overflow-hidden bg-muted">
                                        <img
                                            src={service.images?.[0] || "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&q=80&w=800"}
                                            alt={service.name_fr}
                                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                        />
                                        <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded text-xs font-semibold text-gray-900">
                                            {service.category || "Service"}
                                        </div>
                                    </div>
                                    <div className="p-4 flex-1 flex flex-col">
                                        <div className="flex items-start justify-between mb-2">
                                            <h3 className="font-bold text-lg group-hover:text-primary transition-colors line-clamp-1">{service.name_fr}</h3>
                                        </div>
                                        <div className="flex items-center text-muted-foreground text-sm mb-4 line-clamp-2">
                                            {service.description_fr || "Aucune description"}
                                        </div>
                                        <div className="mt-auto pt-4 border-t flex items-center justify-between text-sm">
                                            <span className="font-bold text-lg text-primary">
                                                {new Intl.NumberFormat('fr-CM', { style: 'currency', currency: 'XAF' }).format(service.base_price)}
                                            </span>
                                            <span className="text-muted-foreground flex items-center">
                                                <span className="mr-1">⏰</span> {service.duration} min
                                            </span>
                                        </div>
                                        <div className="mt-3 w-full bg-black text-white py-2 rounded-lg text-center font-medium text-sm group-hover:bg-gray-800 transition-colors">
                                            Voir les prestataires ({service.provider_count || 0})
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        ))
                    ) : (
                        <div className="col-span-full flex flex-col items-center justify-center py-20 text-center">
                            <div className="h-20 w-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                                <Search className="h-10 w-10 text-gray-400" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 mb-2">Aucun service trouvé</h3>
                            <p className="text-gray-500 max-w-md">
                                Nous n'avons trouvé aucun service correspondant à votre recherche. Essayez d'autres mots-clés ou changez de catégorie.
                            </p>
                            <Button
                                variant="outline"
                                className="mt-6"
                                onClick={() => {
                                    setSearchTerm("");
                                    setSelectedCategory("all");
                                }}
                            >
                                Effacer les filtres
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function SearchPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Chargement...</div>}>
            <SearchContent />
        </Suspense>
    );
}
