"use client";

import { Button } from "@/components/ui/button";
import { Search, MapPin, Star, ArrowRight, Scissors, Sparkles, User, Heart, Palette } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/context/LanguageContext";
import dynamic from 'next/dynamic';

const categories = [
  { id: "hair", name_fr: "Coiffure", name_en: "Hair", icon: Scissors, color: "bg-purple-100 text-purple-600" },
  { id: "barber", name_fr: "Barbier", name_en: "Barber", icon: User, color: "bg-blue-100 text-blue-600" },
  { id: "nails", name_fr: "Onglerie", name_en: "Nails", icon: Sparkles, color: "bg-pink-100 text-pink-600" },
  { id: "makeup", name_fr: "Maquillage", name_en: "Makeup", icon: Palette, color: "bg-orange-100 text-orange-600" },
  { id: "massage", name_fr: "Massage", name_en: "Massage", icon: Heart, color: "bg-green-100 text-green-600" },
  { id: "skincare", name_fr: "Soins Visage", name_en: "Skincare", icon: User, color: "bg-teal-100 text-teal-600" },
];

// Dynamically import Map component to avoid SSR issues with Leaflet
const LeafletMap = dynamic(() => import('@/components/Map'), {
  ssr: false,
  loading: () => (
    <div className="h-[500px] w-full rounded-xl bg-gray-100 animate-pulse flex items-center justify-center text-gray-400">
      Chargement de la carte...
    </div>
  )
});

export default function Home() {
  const { language, t } = useLanguage();
  const [services, setServices] = useState<any[]>([]);
  const [allServices, setAllServices] = useState<any[]>([]);
  const [salons, setSalons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [locationQuery, setLocationQuery] = useState("");
  const [coordinates, setCoordinates] = useState<{ lat: number, lon: number } | null>(null);

  // Helper to build service link with location
  const getServiceLink = (serviceId: string) => {
    const params = new URLSearchParams();
    if (coordinates) {
      params.set('lat', coordinates.lat.toString());
      params.set('lon', coordinates.lon.toString());
    }
    if (locationQuery) params.set('location', locationQuery);
    return `/service/${serviceId}?${params.toString()}`;
  };

  // Service Autocomplete State
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Location Autocomplete State
  const [locationSuggestions, setLocationSuggestions] = useState<any[]>([]);
  const [showLocationSuggestions, setShowLocationSuggestions] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  const router = useRouter();

  useEffect(() => {
    async function fetchData() {
      const supabase = createClient();

      // Fetch featured services
      const { data: featuredData } = await supabase
        .from('services')
        .select('*')
        .limit(8);

      if (featuredData) {
        setServices(featuredData);
      }

      // Fetch all services for autocomplete
      const { data: allData } = await supabase
        .from('services')
        .select('id, name_fr, category, images');

      if (allData) {
        setAllServices(allData);
      }

      // Fetch Therapists (Providers) - Active AND Online
      const { data: therapistsData } = await supabase
        .from('therapists')
        .select(`
          id, 
          business_name, 
          bio_fr, 
          bio_en, 
          latitude, 
          longitude, 
          profile_image, 
          rating, 
          city, 
          service_zones, 
          salon_id,
          street: location, 
          is_mobile
        `)
        .eq('is_active', true)
        .eq('is_online', true) // Only show online therapists
        .limit(100);

      // Fetch Salons - Active
      const { data: salonsData } = await supabase
        .from('salons')
        .select('id, name_fr, name_en, latitude, longitude, cover_image, rating, address:street, quarter, city')
        .eq('is_active', true)
        .limit(50);

      let allProviders: any[] = [];

      // Process Therapists
      if (therapistsData) {
        // Filter out invalid coordinates for main location OR ensure they have service zones
        const validProviders = therapistsData.filter(p =>
          (p.latitude && p.longitude) ||
          (p.service_zones && Array.isArray(p.service_zones) && p.service_zones.length > 0)
        );

        // Map therapists without expensive geocoding
        const mappedTherapists = validProviders.map(provider => {
          // Build service areas from zone data without geocoding
          let serviceAreas: any[] = [];
          if (provider.service_zones && Array.isArray(provider.service_zones)) {
            serviceAreas = provider.service_zones.slice(0, 5).map((zone: any) => {
              if (!zone.city) return null;
              const city = zone.city.trim();
              const district = zone.district ? zone.district.trim() : null;
              const displayName = district ? `${district}, ${city}` : city;
              // Use provider's main coordinates as fallback for display
              return {
                name: displayName,
                latitude: provider.latitude || 0,
                longitude: provider.longitude || 0
              };
            }).filter(Boolean);
          }

          return {
            id: provider.id,
            name_fr: provider.business_name || "Prestataire Indépendant",
            name_en: provider.business_name || "Independent Provider",
            latitude: provider.latitude || 0,
            longitude: provider.longitude || 0,
            cover_image: provider.profile_image,
            rating: provider.rating,
            address: provider.is_mobile ? "Service Mobile" : (provider.city || "Cameroun"),
            city: provider.city,
            service_areas: serviceAreas,
            type: 'therapist'
          };
        });

        allProviders = [...allProviders, ...mappedTherapists];
      }

      // Process Salons
      if (salonsData) {
        const mappedSalons = salonsData.map(salon => ({
          id: salon.id,
          name_fr: salon.name_fr,
          name_en: salon.name_en || salon.name_fr,
          latitude: salon.latitude,
          longitude: salon.longitude,
          cover_image: salon.cover_image,
          rating: salon.rating,
          address: salon.address,
          city: salon.city,
          service_areas: [], // Salons usually have a fixed location
          type: 'salon'
        })).filter(s => s.latitude && s.longitude); // Ensure salons have coordinates

        allProviders = [...allProviders, ...mappedSalons];
      }

      setSalons(allProviders);

      setLoading(false);
    }

    fetchData();

    // Load saved location on mount
    const savedLocation = localStorage.getItem('userLocation');
    if (savedLocation) {
      const { query, coords } = JSON.parse(savedLocation);
      setLocationQuery(query);
      setCoordinates(coords);
    } else {
      getUserLocation();
    }
  }, []);

  // Save location preference when changed
  useEffect(() => {
    if (locationQuery && coordinates) {
      localStorage.setItem('userLocation', JSON.stringify({
        query: locationQuery,
        coords: coordinates
      }));
      window.dispatchEvent(new Event('locationUpdated'));
    }
  }, [locationQuery, coordinates]);

  const getUserLocation = () => {
    if ("geolocation" in navigator) {
      // Check for secure context (HTTPS or localhost)
      if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
        console.warn("Geolocation requires a secure context (HTTPS).");
        setLocationError("Géolocalisation indisponible (connexion non sécurisée). Veuillez saisir votre adresse.");
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const { latitude, longitude } = position.coords;
            setCoordinates({ lat: latitude, lon: longitude });

            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`
            );
            const data = await response.json();

            if (data && data.address) {
              const city = data.address.city || data.address.town || data.address.village || data.address.state;
              const district = data.address.suburb || data.address.neighbourhood || data.address.quarter;
              const formattedLocation = district ? `${district}, ${city}` : city;

              const newLocation = formattedLocation || "Ma position";
              setLocationQuery(newLocation);
              setLocationError(null);

              localStorage.setItem('userLocation', JSON.stringify({
                query: newLocation,
                coords: { lat: latitude, lon: longitude }
              }));
            }
          } catch (error) {
            console.error("Error reverse geocoding:", error);
          }
        },
        (error) => {
          console.warn("Geolocation error:", error.message, error.code);
          let errorMessage = "Impossible de récupérer votre position.";

          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = "Veuillez autoriser la géolocalisation ou saisir votre adresse.";
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = "Position indisponible. Veuillez vérifier votre GPS.";
              break;
            case error.TIMEOUT:
              errorMessage = "Délai d'attente dépassé. Veuillez réessayer.";
              break;
          }
          setLocationError(errorMessage);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else {
      setLocationError("Géolocalisation non supportée par ce navigateur.");
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.trim().length > 0) {
      const filtered = allServices.filter(service =>
        service.name_fr?.toLowerCase().includes(query.toLowerCase()) ||
        service.category?.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 5);
      setSuggestions(filtered);
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleLocationSearch = async (query: string) => {
    setLocationQuery(query);
    if (query.trim().length < 3) {
      setLocationSuggestions([]);
      setShowLocationSuggestions(false);
      return;
    }

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=cm&limit=5&addressdetails=1`
      );
      const data = await response.json();
      setLocationSuggestions(data);
      setShowLocationSuggestions(true);
    } catch (error) {
      console.error("Error fetching location suggestions:", error);
    }
  };

  const handleLocationSelect = (place: any) => {
    const lat = parseFloat(place.lat);
    const lon = parseFloat(place.lon);
    setCoordinates({ lat, lon });

    const address = place.address;
    const city = address.city || address.town || address.village || address.state;
    const district = address.suburb || address.neighbourhood || address.quarter;
    let formatted = place.display_name.split(',')[0];

    if (district && city) {
      formatted = `${district}, ${city}`;
    } else if (city) {
      formatted = city;
    }

    setLocationQuery(formatted);
    setLocationSuggestions([]);
    setShowLocationSuggestions(false);
    setLocationError(null);
  };

  const handleSearchSubmit = () => {
    setShowSuggestions(false);
    setShowLocationSuggestions(false);
    const params = new URLSearchParams();
    if (searchQuery.trim()) params.set('q', searchQuery);
    if (locationQuery.trim()) params.set('location', locationQuery);
    if (coordinates) {
      params.set('lat', coordinates.lat.toString());
      params.set('lon', coordinates.lon.toString());
    }

    router.push(params.toString() ? `/search?${params.toString()}` : '/search');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearchSubmit();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="relative h-[600px] flex items-center justify-center text-white overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&q=80&w=2070"
            alt="Salon de beauté"
            className="w-full h-full object-cover brightness-[0.3]"
          />
        </div>

        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight animate-in fade-in slide-in-from-bottom-4 duration-1000">
            {t('heroTitle')}
          </h1>
          <p className="text-xl md:text-2xl mb-8 text-gray-200 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200">
            {t('heroSubtitle')}
          </p>

          {/* Search Bar */}
          <div className="bg-white/10 backdrop-blur-md p-2 rounded-3xl md:rounded-full border border-white/20 max-w-2xl mx-auto flex flex-col md:flex-row items-stretch md:items-center gap-2 md:gap-0 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-300">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-300" />
              <input
                type="text"
                placeholder={t('searchPlaceholder')}
                className="w-full h-12 bg-transparent border-none pl-12 pr-4 text-white placeholder:text-gray-300 focus:ring-0 text-lg"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                onFocus={() => {
                  if (searchQuery.trim().length > 0) setShowSuggestions(true);
                }}
                onBlur={() => {
                  setTimeout(() => setShowSuggestions(false), 200);
                }}
                onKeyDown={handleKeyDown}
              />
              {/* Suggestions Dropdown */}
              {showSuggestions && (searchQuery.length > 0 || suggestions.length > 0) && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl overflow-hidden text-left z-50 animate-in fade-in zoom-in-95 duration-200">
                  {suggestions.length > 0 ? (
                    suggestions.map((service) => (
                      <div
                        key={service.id}
                        className="p-3 hover:bg-gray-50 cursor-pointer flex items-center gap-3 border-b last:border-0 transition-colors"
                        onClick={() => {
                          router.push(getServiceLink(service.id));
                          setShowSuggestions(false);
                        }}
                      >
                        <div className="h-10 w-10 rounded-md bg-gray-100 overflow-hidden flex-shrink-0">
                          <img src={service.images?.[0] || "https://via.placeholder.com/40"} alt={service.name_fr} className="h-full w-full object-cover" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{service.name_fr}</p>
                          <p className="text-xs text-gray-500">{service.category}</p>
                        </div>
                      </div>
                    ))
                  ) : searchQuery.length > 2 ? (
                    <div className="p-4 text-center text-gray-500">Aucun résultat trouvé</div>
                  ) : null}
                </div>
              )}
            </div>
            <div className="h-8 w-px bg-white/20 mx-2 hidden md:block"></div>
            <div className="flex-1 relative border-t border-white/10 md:border-t-0 pt-2 md:pt-0">
              <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-300" />
              <input
                type="text"
                placeholder={t('locationPlaceholder')}
                className="w-full h-12 bg-transparent border-none pl-12 pr-4 text-white placeholder:text-gray-300 focus:ring-0 text-lg"
                value={locationQuery}
                onChange={(e) => handleLocationSearch(e.target.value)}
                onFocus={() => setShowLocationSuggestions(true)}
              />
              {/* Location Suggestions Dropdown */}
              {showLocationSuggestions && locationSuggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl overflow-hidden text-left z-50 animate-in fade-in zoom-in-95 duration-200">
                  {locationSuggestions.map((loc, index) => (
                    <div
                      key={index}
                      className="p-3 hover:bg-gray-50 cursor-pointer flex items-center gap-3 border-b last:border-0 transition-colors"
                      onClick={() => handleLocationSelect(loc)}
                    >
                      <MapPin className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-700 text-sm">{loc.display_name}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <Button
              size="lg"
              className="rounded-full px-8 bg-primary hover:bg-primary/90 text-primary-foreground font-bold w-full md:w-auto mt-2 md:mt-0 ml-0 md:ml-2"
              onClick={handleSearchSubmit}
            >
              {t('findButton')}
            </Button>
          </div>
        </div>
      </section>

      {/* Salons Near Me Map Section */}
      <section className="py-16 bg-white">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col md:flex-row justify-between items-end mb-10 gap-4">
            <div>
              <h2 className="text-3xl font-bold tracking-tight text-gray-900 mb-2">
                {t('salonsNearMe') || "Salons et Prestataires à proximité"}
              </h2>
              <p className="text-gray-500 text-lg">
                {t('salonsNearMeSubtitle')}
              </p>
            </div>
            {coordinates && (
              <div className="flex items-center text-primary font-medium bg-primary/5 px-4 py-2 rounded-full">
                <MapPin className="h-4 w-4 mr-2" />
                {t('aroundYou')}
              </div>
            )}
          </div>

          <LeafletMap salons={salons} userLocation={coordinates} language={language} />
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-16 bg-background">
        <div className="container">
          <h2 className="text-3xl font-bold tracking-tight mb-10 text-center">{t('categories')}</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {categories.map((category) => (
              <Link
                key={category.id}
                href={`/search?category=${category.id}`}
                className="group flex flex-col items-center p-6 bg-white rounded-2xl shadow-sm hover:shadow-md transition-all hover:-translate-y-1 border border-gray-100"
              >
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary group-hover:text-white transition-colors text-primary">
                  <category.icon className="h-8 w-8" />
                </div>
                <span className="font-medium text-center group-hover:text-primary transition-colors">
                  {language === 'en' ? category.name_en : category.name_fr}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Services */}
      <section className="py-16 bg-white">
        <div className="container">
          <h2 className="text-3xl font-bold tracking-tight mb-10">{t('featuredServices')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {services.map((service) => (
              <div key={service.id} className="group rounded-xl border bg-card text-card-foreground shadow-sm hover:shadow-md transition-all overflow-hidden">
                <div className="aspect-[4/3] relative overflow-hidden">
                  <img
                    src={service.images?.[0] || "https://images.unsplash.com/photo-1600948836101-f9ffda59d250?auto=format&fit=crop&q=80&w=800"}
                    alt={service.name_fr}
                    className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-md text-xs font-bold shadow-sm">
                    {service.category}
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-lg mb-2 line-clamp-1 group-hover:text-primary transition-colors">{service.name_fr}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-4">{service.description_fr}</p>
                  <div className="flex items-center justify-between mt-auto">
                    <span className="font-bold text-lg text-primary">
                      {new Intl.NumberFormat('fr-CM', { style: 'currency', currency: 'XAF' }).format(service.base_price || service.price)}
                    </span>
                    <Button size="sm" variant="outline" className="rounded-full" onClick={() => router.push(getServiceLink(service.id))}>
                      {t('book')}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Become a Partner CTA */}
      <section className="py-20 bg-gray-900 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <img src="https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?auto=format&fit=crop&w=1920&q=80" className="w-full h-full object-cover" />
        </div>
        <div className="container px-4 text-center relative z-10">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Vous êtes un professionnel ?</h2>
          <p className="text-xl mb-10 max-w-2xl mx-auto text-gray-300">
            Rejoignez le réseau KMS pour gérer vos rendez-vous, vendre vos produits et développer votre clientèle rapidement.
          </p>
          <div className="flex justify-center gap-4">
            <Link href="/pro">
              <Button size="lg" className="bg-white text-gray-900 hover:bg-gray-100 font-bold text-lg px-8 h-14 rounded-full">
                Devenir Prestataire
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
