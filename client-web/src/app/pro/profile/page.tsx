
"use client";

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
    Camera,
    MapPin,
    X,
    Save,
    ArrowLeft,
    Check,
    Plus,
    Trash2
} from 'lucide-react';
import { createClient } from '@/lib/supabase';
import { contractorApi, categoriesApi } from '@/services/api';
import { useLanguage } from '@/context/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';

export default function ProProfilePage() {
    const router = useRouter();
    const { t, language } = useLanguage();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const portfolioInputRef = useRef<HTMLInputElement>(null);
    const idFrontInputRef = useRef<HTMLInputElement>(null);
    const idBackInputRef = useRef<HTMLInputElement>(null);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [profile, setProfile] = useState<any>({});
    const [categories, setCategories] = useState<any[]>([]);

    // UI State
    const [trustedZones, setTrustedZones] = useState<any[]>([]);
    const [newZoneQuery, setNewZoneQuery] = useState('');
    const [addressSuggestions, setAddressSuggestions] = useState<any[]>([]);
    const [isSearchingAddress, setIsSearchingAddress] = useState(false);

    const [providerAddressQuery, setProviderAddressQuery] = useState('');
    const [providerAddressSuggestions, setProviderAddressSuggestions] = useState<any[]>([]);
    const [isSearchingProviderAddress, setIsSearchingProviderAddress] = useState(false);
    const [providerLocation, setProviderLocation] = useState<any>(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [cats, supabase] = await Promise.all([
                categoriesApi.getAll(),
                createClient()
            ]);
            setCategories(cats);

            const { data: { session } } = await supabase.auth.getSession();
            if (!session?.user) return;

            const userProfile = await contractorApi.getProfileByUserId(session.user.id);
            if (userProfile) {
                setProfile(userProfile);

                // Initialize Zones
                if (userProfile.service_zones) {
                    const zones = userProfile.service_zones.map((z: any) =>
                        typeof z === 'string' ? { city: 'Unknown', district: z } : z
                    );
                    setTrustedZones(zones);
                }

                // Initialize Address
                if (userProfile.city || userProfile.region) {
                    const addr = `${userProfile.city || ''} ${userProfile.region || ''}`.trim();
                    setProviderAddressQuery(addr);
                    setProviderLocation({
                        city: userProfile.city,
                        region: userProfile.region,
                        latitude: userProfile.latitude,
                        longitude: userProfile.longitude
                    });
                }
            } else {
                // Initialize default profile structure
                setProfile({
                    user_id: session.user.id,
                    available_transportation: [],
                    types_of_services: [],
                    languages_spoken: ['fr'],
                    confidentiality_accepted: true,
                    terms_accepted: true
                });
            }
        } catch (error) {
            console.error("Error loading data:", error);
        } finally {
            setLoading(false);
        }
    };

    // --- Image Handling ---

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, type: 'profile' | 'id_front' | 'id_back' | 'portfolio') => {
        if (!e.target.files || e.target.files.length === 0) return;

        try {
            setSaving(true); // Show spinner essentially
            const file = e.target.files[0];
            const userId = profile.user_id;

            if (type === 'portfolio') {
                // Handle multiple files slightly differently if needed, but here simple append
                const result = await contractorApi.uploadFile(file, userId, 'portfolio');
                const newPortfolio = [...(profile.portfolio_images || []), result.url];
                setProfile({ ...profile, portfolio_images: newPortfolio });
            } else if (type === 'profile') {
                const result = await contractorApi.uploadFile(file, userId, 'profile');
                setProfile({ ...profile, profile_image: result.url });
            } else {
                // ID Card
                const result = await contractorApi.uploadFile(file, userId, type);
                const currentIdCard = profile.id_card_url || {};
                const newIdCard = {
                    ...currentIdCard,
                    [type === 'id_front' ? 'front' : 'back']: result.url
                };
                setProfile({ ...profile, id_card_url: newIdCard });
            }
        } catch (error) {
            console.error("Upload error:", error);
            alert("Erreur lors de l'upload");
        } finally {
            setSaving(false);
        }
    };

    // --- Address Handling ---

    const searchAddress = async (query: string, setSuggestions: any, setIsSearching: any) => {
        if (query.length < 3) {
            setSuggestions([]);
            return;
        }
        setIsSearching(true);
        try {
            const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=cm&addressdetails=1&limit=5`);
            const data = await res.json();
            setSuggestions(data);
        } catch (error) {
            console.error(error);
        } finally {
            setIsSearching(false);
        }
    };

    const handleSelectProviderAddress = (item: any) => {
        const addr = item.address || {};
        const city = addr.city || addr.town || addr.village || 'Unknown';
        const region = addr.state || addr.region || 'Unknown';

        setProviderLocation({
            city,
            region,
            latitude: parseFloat(item.lat),
            longitude: parseFloat(item.lon),
            address: item.display_name
        });
        setProviderAddressQuery(item.display_name);
        setProviderAddressSuggestions([]);
    };

    const handleSelectTrustedZone = (item: any) => {
        const addr = item.address || {};
        const city = addr.city || addr.town || addr.village || 'Unknown';
        const district = addr.suburb || addr.neighbourhood || addr.quarter || item.name;

        const newZone = { city, district };
        setTrustedZones([...trustedZones, newZone]);
        setNewZoneQuery('');
        setAddressSuggestions([]);
    };

    // --- Saving ---

    const handleSave = async () => {
        try {
            setSaving(true);

            const dataToSave = {
                ...profile,
                service_zones: trustedZones,
                ...providerLocation
            };

            // If ID needs format adjustment
            if (dataToSave.id_card_url && typeof dataToSave.id_card_url === 'object' && !dataToSave.id_card_url.front && !dataToSave.id_card_url.back) {
                // clean up emptiness
            }

            if (profile.id) {
                await contractorApi.updateProfile(profile.user_id, dataToSave);
            } else {
                await contractorApi.createProfile(dataToSave);
            }
            alert("Profil sauvegardé avec succès !");
            router.back();
        } catch (error) {
            console.error("Save error:", error);
            alert("Erreur lors de la sauvegarde.");
        } finally {
            setSaving(false);
        }
    };

    // --- UI Helpers ---

    const toggleCategory = (cat: string) => {
        const current = profile.types_of_services || [];
        if (current.includes(cat)) {
            setProfile({ ...profile, types_of_services: current.filter((c: string) => c !== cat) });
        } else {
            setProfile({ ...profile, types_of_services: [...current, cat] });
        }
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center">Chargement...</div>;

    return (
        <div className="bg-gray-50 min-h-screen pb-24 max-w-2xl mx-auto">
            {/* Header */}
            <div className="bg-white px-4 py-4 flex items-center justify-between sticky top-0 z-20 border-b border-gray-100 shadow-sm">
                <div className="flex items-center gap-3">
                    <Button variant="ghost" size="icon" onClick={() => router.back()}>
                        <ArrowLeft className="h-6 w-6 text-gray-900" />
                    </Button>
                    <h1 className="text-lg font-bold text-gray-900">Modifier Profil</h1>
                </div>
                <Button onClick={handleSave} disabled={saving} className="bg-gray-900 text-white rounded-full">
                    {saving ? '...' : <Save className="h-4 w-4" />}
                </Button>
            </div>

            <div className="p-4 space-y-8">

                {/* Profile Image */}
                <div className="flex flex-col items-center gap-4">
                    <div className="relative h-28 w-28">
                        <div className="h-full w-full rounded-full overflow-hidden bg-gray-200 border-4 border-white shadow-md">
                            {profile.profile_image ? (
                                <img src={profile.profile_image} className="h-full w-full object-cover" />
                            ) : (
                                <div className="h-full w-full flex items-center justify-center text-gray-400">
                                    <User className="h-12 w-12" />
                                </div>
                            )}
                        </div>
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="absolute bottom-0 right-0 p-2 bg-primary text-primary-foreground rounded-full shadow-lg hover:bg-primary/90 transition-colors"
                        >
                            <Camera className="h-4 w-4 text-white" />
                        </button>
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={(e) => handleFileChange(e, 'profile')}
                            hidden
                            accept="image/*"
                        />
                    </div>
                </div>

                {/* Main Info */}
                <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-4">
                    <h2 className="font-bold text-gray-900">Information Principales</h2>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nom Commercial</label>
                        <Input
                            value={profile.business_name || ''}
                            onChange={(e) => setProfile({ ...profile, business_name: e.target.value })}
                            placeholder="Votre nom d'entreprise"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Biographie</label>
                        <Textarea
                            value={profile.professional_experience || ''}
                            onChange={(e) => setProfile({ ...profile, professional_experience: e.target.value })}
                            placeholder="Décrivez votre expérience..."
                            rows={4}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Années d'expérience</label>
                        <Input
                            type="number"
                            value={profile.experience || ''}
                            onChange={(e) => setProfile({ ...profile, experience: parseInt(e.target.value) })}
                        />
                    </div>
                </section>

                {/* Address */}
                <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-4 relative">
                    <h2 className="font-bold text-gray-900">Adresse Principale</h2>
                    <div>
                        <Input
                            value={providerAddressQuery}
                            onChange={(e) => {
                                setProviderAddressQuery(e.target.value);
                                searchAddress(e.target.value, setProviderAddressSuggestions, setIsSearchingProviderAddress);
                            }}
                            placeholder="Rechercher votre adresse..."
                        />
                        {isSearchingProviderAddress && <p className="text-xs text-gray-400 mt-1">Recherche...</p>}

                        {/* Suggestions List */}
                        {providerAddressSuggestions.length > 0 && (
                            <div className="absolute z-10 w-full left-0 bg-white border border-gray-200 mt-1 rounded-lg shadow-xl max-h-60 overflow-y-auto">
                                {providerAddressSuggestions.map((item, idx) => (
                                    <div
                                        key={idx}
                                        className="p-3 hover:bg-gray-50 cursor-pointer text-sm border-b last:border-0"
                                        onClick={() => handleSelectProviderAddress(item)}
                                    >
                                        {item.display_name}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </section>

                {/* Services */}
                <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-4">
                    <h2 className="font-bold text-gray-900">Types de Services</h2>
                    <div className="grid grid-cols-1 gap-2">
                        {categories.map((cat) => (
                            <div
                                key={cat.category}
                                onClick={() => toggleCategory(cat.category)}
                                className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-colors ${profile.types_of_services?.includes(cat.category)
                                        ? 'bg-gray-900 text-white border-gray-900'
                                        : 'bg-white text-gray-700 border-gray-200'
                                    }`}
                            >
                                <span>{language === 'fr' ? cat.name_fr : cat.name_en}</span>
                                {profile.types_of_services?.includes(cat.category) && <Check className="h-4 w-4" />}
                            </div>
                        ))}
                    </div>
                </section>

                {/* Trusted Zones */}
                <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-4 relative">
                    <h2 className="font-bold text-gray-900">Zones de Confiance (Quartiers)</h2>

                    <div className="flex flex-wrap gap-2 mb-2">
                        {trustedZones.map((zone, idx) => (
                            <div key={idx} className="bg-gray-100 px-3 py-1 rounded-full text-sm flex items-center gap-2">
                                <span>{zone.district}</span>
                                <button onClick={() => setTrustedZones(trustedZones.filter((_, i) => i !== idx))}>
                                    <X className="h-3 w-3 text-gray-500" />
                                </button>
                            </div>
                        ))}
                    </div>

                    <div>
                        <Input
                            value={newZoneQuery}
                            onChange={(e) => {
                                setNewZoneQuery(e.target.value);
                                searchAddress(e.target.value, setAddressSuggestions, setIsSearchingAddress);
                            }}
                            placeholder="Ajouter un quartier..."
                        />
                        {addressSuggestions.length > 0 && (
                            <div className="absolute z-10 w-full left-0 bg-white border border-gray-200 mt-1 rounded-lg shadow-xl max-h-60 overflow-y-auto">
                                {addressSuggestions.map((item, idx) => (
                                    <div
                                        key={idx}
                                        className="p-3 hover:bg-gray-50 cursor-pointer text-sm border-b last:border-0"
                                        onClick={() => handleSelectTrustedZone(item)}
                                    >
                                        {item.display_name}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </section>

                {/* Portfolio */}
                <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-4">
                    <h2 className="font-bold text-gray-900">Portfolio</h2>
                    <div className="grid grid-cols-3 gap-2">
                        {profile.portfolio_images?.map((img: string, idx: number) => (
                            <div key={idx} className="aspect-square bg-gray-100 rounded-lg overflow-hidden relative group">
                                <img src={img} className="w-full h-full object-cover" />
                                <button
                                    onClick={() => {
                                        const newP = profile.portfolio_images.filter((_: any, i: number) => i !== idx);
                                        setProfile({ ...profile, portfolio_images: newP });
                                    }}
                                    className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <X className="h-3 w-3" />
                                </button>
                            </div>
                        ))}
                        <button
                            onClick={() => portfolioInputRef.current?.click()}
                            className="aspect-square rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center hover:bg-gray-50 transition-colors"
                        >
                            <Plus className="h-6 w-6 text-gray-400" />
                        </button>
                    </div>
                    <input type="file" ref={portfolioInputRef} onChange={(e) => handleFileChange(e, 'portfolio')} hidden />
                </section>

            </div>
        </div>
    );
}

function User(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
        </svg>
    )
}
