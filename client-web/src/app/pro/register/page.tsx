"use client";

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase';
import { categoriesApi, contractorApi } from '@/services/api';
import {
    Loader2,
    Upload,
    User,
    Building2,
    MapPin,
    Languages,
    Briefcase,
    CheckCircle2,
    Camera,
    Car,
    Bike,
    Bus,
    X,
    Plus,
    CreditCard,
    Image as ImageIcon
} from 'lucide-react';

interface Category {
    category: string;
    name_fr: string;
    name_en: string;
}

interface ServiceZone {
    city: string;
    district: string;
}

export default function RegisterProPage() {
    const router = useRouter();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const idFrontInputRef = useRef<HTMLInputElement>(null);
    const idBackInputRef = useRef<HTMLInputElement>(null);
    const portfolioInputRef = useRef<HTMLInputElement>(null);

    const [loading, setLoading] = useState(false);
    const [categories, setCategories] = useState<Category[]>([]);

    // Images
    const [profileImage, setProfileImage] = useState<string | null>(null);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [idCardFront, setIdCardFront] = useState<string | null>(null);
    const [idCardFrontFile, setIdCardFrontFile] = useState<File | null>(null);
    const [idCardBack, setIdCardBack] = useState<string | null>(null);
    const [idCardBackFile, setIdCardBackFile] = useState<File | null>(null);
    const [portfolioImages, setPortfolioImages] = useState<string[]>([]);
    const [portfolioFiles, setPortfolioFiles] = useState<File[]>([]);

    // Service Zones
    const [serviceZones, setServiceZones] = useState<ServiceZone[]>([]);
    const [zoneSearch, setZoneSearch] = useState('');
    const [zoneSuggestions, setZoneSuggestions] = useState<any[]>([]);
    const [searchingZones, setSearchingZones] = useState(false);

    // Provider Main Address
    const [addressSearch, setAddressSearch] = useState('');
    const [addressSuggestions, setAddressSuggestions] = useState<any[]>([]);
    const [searchingAddress, setSearchingAddress] = useState(false);
    const [providerLocation, setProviderLocation] = useState<{
        latitude: number;
        longitude: number;
        city: string;
        region: string;
        address: string;
    } | null>(null);

    const [formData, setFormData] = useState({
        business_name: '',
        legal_status: 'independant' as 'independant' | 'salon',
        professional_experience: '',
        experience_years: '1',
        city: 'Douala',
        siret_number: '', // Registre de commerce for salons
        types_of_services: [] as string[],
        languages_spoken: ['fr'] as string[],
        available_transportation: [] as string[],
        terms_accepted: false,
        confidentiality_accepted: false,
    });

    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        loadCategories();
    }, []);

    const loadCategories = async () => {
        try {
            const cats = await categoriesApi.getAll();
            setCategories(cats);
        } catch (error) {
            console.error('Error loading categories:', error);
        }
    };

    // Image handlers
    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>, type: 'profile' | 'id_front' | 'id_back' | 'portfolio') => {
        const files = e.target.files;
        if (!files) return;

        if (type === 'portfolio') {
            const newFiles = Array.from(files).slice(0, 6 - portfolioImages.length);
            newFiles.forEach(file => {
                const reader = new FileReader();
                reader.onload = (e) => {
                    setPortfolioImages(prev => [...prev, e.target?.result as string]);
                    setPortfolioFiles(prev => [...prev, file]);
                };
                reader.readAsDataURL(file);
            });
        } else {
            const file = files[0];
            const reader = new FileReader();
            reader.onload = (e) => {
                const imageData = e.target?.result as string;
                if (type === 'profile') {
                    setProfileImage(imageData);
                    setImageFile(file);
                } else if (type === 'id_front') {
                    setIdCardFront(imageData);
                    setIdCardFrontFile(file);
                } else if (type === 'id_back') {
                    setIdCardBack(imageData);
                    setIdCardBackFile(file);
                }
            };
            reader.readAsDataURL(file);
        }
    };

    const removePortfolioImage = (index: number) => {
        setPortfolioImages(prev => prev.filter((_, i) => i !== index));
        setPortfolioFiles(prev => prev.filter((_, i) => i !== index));
    };

    // Zone search
    const searchZones = async (query: string) => {
        setZoneSearch(query);
        if (query.length < 3) {
            setZoneSuggestions([]);
            return;
        }

        try {
            setSearchingZones(true);
            const response = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=cm&addressdetails=1&limit=5`,
                { headers: { 'User-Agent': 'KMR-Beauty-Web/1.0' } }
            );
            const data = await response.json();
            setZoneSuggestions(data);
        } catch (error) {
            console.error('Error searching zones:', error);
        } finally {
            setSearchingZones(false);
        }
    };

    const selectZone = (item: any) => {
        const city = item.address?.city || item.address?.town || item.address?.village || item.address?.state || 'Unknown';
        const district = item.address?.suburb || item.address?.neighbourhood || item.address?.quarter || item.name || 'Unknown';

        const newZone = { city, district };
        if (!serviceZones.some(z => z.city === city && z.district === district)) {
            setServiceZones(prev => [...prev, newZone]);
        }
        setZoneSearch('');
        setZoneSuggestions([]);
    };

    const removeZone = (index: number) => {
        setServiceZones(prev => prev.filter((_, i) => i !== index));
    };

    // Address search for main location
    const searchAddress = async (query: string) => {
        setAddressSearch(query);
        if (query.length < 3) {
            setAddressSuggestions([]);
            return;
        }

        try {
            setSearchingAddress(true);
            const response = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=cm&addressdetails=1&limit=5`,
                { headers: { 'User-Agent': 'KMR-Beauty-Web/1.0' } }
            );
            const data = await response.json();
            setAddressSuggestions(data);
        } catch (error) {
            console.error('Error searching address:', error);
        } finally {
            setSearchingAddress(false);
        }
    };

    const selectAddress = (item: any) => {
        const addr = item.address || {};
        const city = addr.city || addr.town || addr.village || addr.municipality || 'Unknown';
        const region = addr.state || addr.region || 'Unknown';

        setProviderLocation({
            latitude: parseFloat(item.lat),
            longitude: parseFloat(item.lon),
            city,
            region,
            address: item.display_name,
        });
        setAddressSearch(item.display_name);
        setAddressSuggestions([]);
        setFormData(prev => ({ ...prev, city }));
    };

    // Toggle functions
    const toggleCategory = (categoryId: string) => {
        setFormData(prev => ({
            ...prev,
            types_of_services: prev.types_of_services.includes(categoryId)
                ? prev.types_of_services.filter(c => c !== categoryId)
                : [...prev.types_of_services, categoryId]
        }));
    };

    const toggleLanguage = (lang: string) => {
        setFormData(prev => ({
            ...prev,
            languages_spoken: prev.languages_spoken.includes(lang)
                ? prev.languages_spoken.filter(l => l !== lang)
                : [...prev.languages_spoken, lang]
        }));
    };

    const toggleTransport = (transport: string) => {
        setFormData(prev => ({
            ...prev,
            available_transportation: prev.available_transportation.includes(transport)
                ? prev.available_transportation.filter(t => t !== transport)
                : [...prev.available_transportation, transport]
        }));
    };

    const validate = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!formData.business_name.trim()) {
            newErrors.business_name = 'Le nom commercial est requis';
        }

        if (!formData.professional_experience.trim()) {
            newErrors.professional_experience = 'Veuillez décrire votre expérience';
        }

        if (formData.types_of_services.length === 0) {
            newErrors.types_of_services = 'Sélectionnez au moins une catégorie';
        }

        if (serviceZones.length === 0) {
            newErrors.service_zones = 'Ajoutez au moins une zone de service';
        }

        if (!providerLocation) {
            newErrors.address = 'Veuillez sélectionner votre adresse principale';
        }

        if (formData.legal_status === 'salon' && !formData.siret_number.trim()) {
            newErrors.siret_number = 'Le registre de commerce est requis pour les salons';
        }

        if (!formData.terms_accepted || !formData.confidentiality_accepted) {
            newErrors.terms = 'Vous devez accepter les conditions';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const uploadImage = async (file: File, path: string, supabase: any) => {
        const { error } = await supabase.storage.from('avatars').upload(path, file, { upsert: true });
        if (error) throw error;
        const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path);
        return publicUrl;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validate()) return;

        setLoading(true);

        try {
            const supabase = createClient();
            const { data: { session } } = await supabase.auth.getSession();

            if (!session) {
                router.push('/login?redirect=/pro/register');
                return;
            }

            const userId = session.user.id;
            let profileImageUrl = null;
            let idCardUrls: any = {};
            let portfolioUrls: string[] = [];

            // Upload images
            if (imageFile) {
                profileImageUrl = await uploadImage(imageFile, `${userId}/profile.${imageFile.name.split('.').pop()}`, supabase);
            }

            if (idCardFrontFile) {
                idCardUrls.front = await uploadImage(idCardFrontFile, `${userId}/id_front.${idCardFrontFile.name.split('.').pop()}`, supabase);
            }

            if (idCardBackFile) {
                idCardUrls.back = await uploadImage(idCardBackFile, `${userId}/id_back.${idCardBackFile.name.split('.').pop()}`, supabase);
            }

            for (let i = 0; i < portfolioFiles.length; i++) {
                const url = await uploadImage(portfolioFiles[i], `${userId}/portfolio_${i}.${portfolioFiles[i].name.split('.').pop()}`, supabase);
                portfolioUrls.push(url);
            }

            // Create contractor profile
            const profileData = {
                user_id: userId,
                business_name: formData.business_name,
                legal_status: formData.legal_status,
                professional_experience: formData.professional_experience,
                experience: parseInt(formData.experience_years),
                city: providerLocation?.city || formData.city,
                region: providerLocation?.region || '',
                latitude: providerLocation?.latitude,
                longitude: providerLocation?.longitude,
                siret_number: formData.siret_number || null,
                types_of_services: formData.types_of_services,
                languages_spoken: formData.languages_spoken,
                available_transportation: formData.available_transportation,
                service_zones: serviceZones,
                terms_accepted: formData.terms_accepted,
                confidentiality_accepted: formData.confidentiality_accepted,
                profile_image: profileImageUrl,
                id_card_url: Object.keys(idCardUrls).length > 0 ? idCardUrls : null,
                portfolio_images: portfolioUrls,
                is_mobile: true,
                travel_radius: 10,
                profile_completed: true,
            };

            await contractorApi.createProfile(profileData);

            // Redirect to services page
            router.push('/pro/services');

        } catch (error: any) {
            console.error("Error:", error);
            setErrors({ submit: error.message || 'Une erreur est survenue' });
        } finally {
            setLoading(false);
        }
    };

    const languages = [
        { code: 'fr', name: 'Français' },
        { code: 'en', name: 'English' },
        { code: 'de', name: 'Deutsch' },
        { code: 'es', name: 'Español' },
    ];

    const transportOptions = [
        { code: 'car', name: 'Voiture', icon: Car },
        { code: 'bike', name: 'Moto/Vélo', icon: Bike },
        { code: 'public_transport', name: 'Transport en commun', icon: Bus },
    ];

    const cities = ['Douala', 'Yaoundé', 'Bafoussam', 'Bamenda', 'Garoua', 'Maroua', 'Ngaoundéré', 'Bertoua', 'Ebolowa', 'Kribi'];

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4">
            <div className="max-w-3xl mx-auto">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-amber-400 to-amber-600 rounded-2xl mb-4">
                        <Briefcase className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        Créer votre profil Pro
                    </h1>
                    <p className="text-gray-600">
                        Complétez votre profil pour commencer à proposer vos services
                    </p>
                </div>

                {/* Progress */}
                <div className="flex items-center justify-center gap-4 mb-8">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-amber-500 text-white flex items-center justify-center font-bold text-sm">1</div>
                        <span className="text-sm font-medium text-gray-900">Profil</span>
                    </div>
                    <div className="w-12 h-0.5 bg-gray-300"></div>
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-gray-300 text-gray-600 flex items-center justify-center font-bold text-sm">2</div>
                        <span className="text-sm font-medium text-gray-500">Services</span>
                    </div>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-xl p-6 md:p-8 space-y-8">

                    {/* Profile Photo */}
                    <div className="flex flex-col items-center">
                        <div
                            onClick={() => fileInputRef.current?.click()}
                            className="relative w-28 h-28 rounded-full bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center cursor-pointer hover:border-amber-500 hover:bg-amber-50 transition-colors overflow-hidden group"
                        >
                            {profileImage ? (
                                <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                                <Camera className="w-8 h-8 text-gray-400 group-hover:text-amber-500" />
                            )}
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                <Upload className="w-6 h-6 text-white" />
                            </div>
                        </div>
                        <input ref={fileInputRef} type="file" accept="image/*" onChange={(e) => handleImageSelect(e, 'profile')} className="hidden" />
                        <p className="text-sm text-gray-500 mt-2">Photo de profil *</p>
                    </div>

                    {/* Business Name */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-2">
                            <User className="w-4 h-4 inline mr-2" />
                            Nom commercial / Marque *
                        </label>
                        <input
                            className={`w-full p-3 rounded-xl border ${errors.business_name ? 'border-red-500' : 'border-gray-200'} focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none transition-all`}
                            placeholder="Ex: Beauty by Marie"
                            value={formData.business_name}
                            onChange={e => setFormData({ ...formData, business_name: e.target.value })}
                        />
                        {errors.business_name && <p className="text-red-500 text-sm mt-1">{errors.business_name}</p>}
                    </div>

                    {/* Legal Status */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-2">
                            <Building2 className="w-4 h-4 inline mr-2" />
                            Statut *
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                            {[
                                { value: 'independant', label: 'Indépendant(e)', icon: User },
                                { value: 'salon', label: 'Salon / Institut', icon: Building2 },
                            ].map(option => (
                                <button
                                    key={option.value}
                                    type="button"
                                    onClick={() => setFormData({ ...formData, legal_status: option.value as any })}
                                    className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${formData.legal_status === option.value
                                        ? 'border-amber-500 bg-amber-50 text-amber-700'
                                        : 'border-gray-200 hover:border-gray-300'
                                        }`}
                                >
                                    <option.icon className="w-6 h-6" />
                                    <span className="font-medium text-sm">{option.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Registre de commerce (for salons only) */}
                    {formData.legal_status === 'salon' && (
                        <div>
                            <label className="block text-sm font-semibold text-gray-900 mb-2">
                                <Building2 className="w-4 h-4 inline mr-2" />
                                Registre de Commerce / SIRET *
                            </label>
                            <input
                                className="w-full p-3 rounded-xl border border-gray-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none"
                                placeholder="Numéro de registre de commerce"
                                value={formData.siret_number}
                                onChange={e => setFormData({ ...formData, siret_number: e.target.value })}
                            />
                        </div>
                    )}

                    {/* Main Address */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-2">
                            <MapPin className="w-4 h-4 inline mr-2" />
                            {formData.legal_status === 'salon' ? 'Adresse du Salon *' : 'Votre Adresse Principale *'}
                        </label>
                        <div className="relative">
                            <input
                                className={`w-full p-3 rounded-xl border ${errors.address ? 'border-red-500' : 'border-gray-200'} focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none`}
                                placeholder="Rechercher votre adresse..."
                                value={addressSearch}
                                onChange={e => searchAddress(e.target.value)}
                            />
                            {searchingAddress && <Loader2 className="w-5 h-5 animate-spin absolute right-3 top-3.5 text-gray-400" />}

                            {addressSuggestions.length > 0 && (
                                <div className="absolute z-10 w-full mt-1 bg-white rounded-xl shadow-lg border max-h-60 overflow-y-auto">
                                    {addressSuggestions.map((item, i) => (
                                        <button
                                            key={i}
                                            type="button"
                                            onClick={() => selectAddress(item)}
                                            className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b last:border-0 text-sm"
                                        >
                                            {item.display_name}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                        {errors.address && <p className="text-red-500 text-sm mt-1">{errors.address}</p>}

                        {/* Map Preview */}
                        {providerLocation && (
                            <div className="mt-4 rounded-xl overflow-hidden border border-gray-200">
                                <iframe
                                    width="100%"
                                    height="200"
                                    frameBorder="0"
                                    style={{ border: 0 }}
                                    src={`https://www.openstreetmap.org/export/embed.html?bbox=${providerLocation.longitude - 0.01}%2C${providerLocation.latitude - 0.01}%2C${providerLocation.longitude + 0.01}%2C${providerLocation.latitude + 0.01}&layer=mapnik&marker=${providerLocation.latitude}%2C${providerLocation.longitude}`}
                                    allowFullScreen
                                />
                                <div className="p-3 bg-gray-50 text-sm text-gray-600">
                                    📍 {providerLocation.city}, {providerLocation.region}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Experience Years */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-2">
                            Années d'expérience *
                        </label>
                        <input
                            type="number"
                            min="0"
                            max="50"
                            className="w-full p-3 rounded-xl border border-gray-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none"
                            value={formData.experience_years}
                            onChange={e => setFormData({ ...formData, experience_years: e.target.value })}
                        />
                    </div>

                    {/* Bio */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-2">
                            Biographie / Expérience professionnelle *
                        </label>
                        <textarea
                            className={`w-full p-3 rounded-xl border ${errors.professional_experience ? 'border-red-500' : 'border-gray-200'} focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none h-32 resize-none`}
                            placeholder="Décrivez votre parcours, vos spécialités et ce qui vous distingue..."
                            value={formData.professional_experience}
                            onChange={e => setFormData({ ...formData, professional_experience: e.target.value })}
                        />
                        {errors.professional_experience && <p className="text-red-500 text-sm mt-1">{errors.professional_experience}</p>}
                    </div>

                    {/* Service Categories */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-2">
                            Catégories de services *
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {categories.map(cat => (
                                <button
                                    key={cat.category}
                                    type="button"
                                    onClick={() => toggleCategory(cat.category)}
                                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${formData.types_of_services.includes(cat.category)
                                        ? 'bg-amber-500 text-white'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        }`}
                                >
                                    {formData.types_of_services.includes(cat.category) && <CheckCircle2 className="w-4 h-4 inline mr-1" />}
                                    {cat.name_fr}
                                </button>
                            ))}
                        </div>
                        {errors.types_of_services && <p className="text-red-500 text-sm mt-1">{errors.types_of_services}</p>}
                    </div>

                    {/* Service Zones */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-2">
                            <MapPin className="w-4 h-4 inline mr-2" />
                            Zones de service (quartiers) *
                        </label>
                        <div className="relative">
                            <input
                                className="w-full p-3 rounded-xl border border-gray-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none"
                                placeholder="Rechercher un quartier..."
                                value={zoneSearch}
                                onChange={e => searchZones(e.target.value)}
                            />
                            {searchingZones && <Loader2 className="w-5 h-5 animate-spin absolute right-3 top-3.5 text-gray-400" />}

                            {zoneSuggestions.length > 0 && (
                                <div className="absolute z-10 w-full mt-1 bg-white rounded-xl shadow-lg border max-h-60 overflow-y-auto">
                                    {zoneSuggestions.map((item, i) => (
                                        <button
                                            key={i}
                                            type="button"
                                            onClick={() => selectZone(item)}
                                            className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b last:border-0 text-sm"
                                        >
                                            {item.display_name}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="flex flex-wrap gap-2 mt-3">
                            {serviceZones.map((zone, i) => (
                                <div key={i} className="flex items-center gap-2 bg-amber-100 text-amber-800 px-3 py-1.5 rounded-full text-sm">
                                    <span>{zone.district}, {zone.city}</span>
                                    <button type="button" onClick={() => removeZone(i)} className="hover:text-amber-900">
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                        {errors.service_zones && <p className="text-red-500 text-sm mt-1">{errors.service_zones}</p>}
                    </div>

                    {/* ID Card */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-2">
                            <CreditCard className="w-4 h-4 inline mr-2" />
                            Pièce d'identité (optionnel)
                        </label>
                        <div className="grid grid-cols-2 gap-4">
                            <div
                                onClick={() => idFrontInputRef.current?.click()}
                                className="h-32 rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:border-amber-500 hover:bg-amber-50 transition-colors overflow-hidden"
                            >
                                {idCardFront ? (
                                    <img src={idCardFront} alt="ID Front" className="w-full h-full object-cover" />
                                ) : (
                                    <>
                                        <Upload className="w-6 h-6 text-gray-400" />
                                        <span className="text-sm text-gray-500 mt-1">Recto</span>
                                    </>
                                )}
                            </div>
                            <div
                                onClick={() => idBackInputRef.current?.click()}
                                className="h-32 rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:border-amber-500 hover:bg-amber-50 transition-colors overflow-hidden"
                            >
                                {idCardBack ? (
                                    <img src={idCardBack} alt="ID Back" className="w-full h-full object-cover" />
                                ) : (
                                    <>
                                        <Upload className="w-6 h-6 text-gray-400" />
                                        <span className="text-sm text-gray-500 mt-1">Verso</span>
                                    </>
                                )}
                            </div>
                        </div>
                        <input ref={idFrontInputRef} type="file" accept="image/*" onChange={(e) => handleImageSelect(e, 'id_front')} className="hidden" />
                        <input ref={idBackInputRef} type="file" accept="image/*" onChange={(e) => handleImageSelect(e, 'id_back')} className="hidden" />
                    </div>

                    {/* Portfolio */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-2">
                            <ImageIcon className="w-4 h-4 inline mr-2" />
                            Portfolio (optionnel - max 6 images)
                        </label>
                        <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                            {portfolioImages.map((img, i) => (
                                <div key={i} className="relative aspect-square rounded-xl overflow-hidden">
                                    <img src={img} alt={`Portfolio ${i}`} className="w-full h-full object-cover" />
                                    <button
                                        type="button"
                                        onClick={() => removePortfolioImage(i)}
                                        className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                            {portfolioImages.length < 6 && (
                                <div
                                    onClick={() => portfolioInputRef.current?.click()}
                                    className="aspect-square rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center cursor-pointer hover:border-amber-500 hover:bg-amber-50 transition-colors"
                                >
                                    <Plus className="w-8 h-8 text-gray-400" />
                                </div>
                            )}
                        </div>
                        <input ref={portfolioInputRef} type="file" accept="image/*" multiple onChange={(e) => handleImageSelect(e, 'portfolio')} className="hidden" />
                    </div>

                    {/* Languages */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-2">
                            <Languages className="w-4 h-4 inline mr-2" />
                            Langues parlées
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {languages.map(lang => (
                                <button
                                    key={lang.code}
                                    type="button"
                                    onClick={() => toggleLanguage(lang.code)}
                                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${formData.languages_spoken.includes(lang.code)
                                        ? 'bg-blue-500 text-white'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        }`}
                                >
                                    {lang.name}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Transportation */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-2">
                            Moyens de transport disponibles
                        </label>
                        <div className="flex flex-wrap gap-3">
                            {transportOptions.map(option => (
                                <button
                                    key={option.code}
                                    type="button"
                                    onClick={() => toggleTransport(option.code)}
                                    className={`px-4 py-3 rounded-xl border-2 transition-all flex items-center gap-2 ${formData.available_transportation.includes(option.code)
                                        ? 'border-green-500 bg-green-50 text-green-700'
                                        : 'border-gray-200 hover:border-gray-300'
                                        }`}
                                >
                                    <option.icon className="w-5 h-5" />
                                    <span className="font-medium text-sm">{option.name}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Terms */}
                    <div className="space-y-3 pt-4 border-t">
                        <label className="flex items-start gap-3 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={formData.terms_accepted}
                                onChange={e => setFormData({ ...formData, terms_accepted: e.target.checked })}
                                className="mt-1 w-5 h-5 rounded border-gray-300 text-amber-500 focus:ring-amber-500"
                            />
                            <span className="text-sm text-gray-600">
                                J'accepte les <a href="/terms" className="text-amber-600 hover:underline">conditions générales</a>
                            </span>
                        </label>
                        <label className="flex items-start gap-3 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={formData.confidentiality_accepted}
                                onChange={e => setFormData({ ...formData, confidentiality_accepted: e.target.checked })}
                                className="mt-1 w-5 h-5 rounded border-gray-300 text-amber-500 focus:ring-amber-500"
                            />
                            <span className="text-sm text-gray-600">
                                J'accepte la <a href="/privacy" className="text-amber-600 hover:underline">politique de confidentialité</a>
                            </span>
                        </label>
                        {errors.terms && <p className="text-red-500 text-sm">{errors.terms}</p>}
                    </div>

                    {/* Error Message */}
                    {errors.submit && (
                        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
                            {errors.submit}
                        </div>
                    )}

                    {/* Submit */}
                    <Button
                        type="submit"
                        className="w-full h-14 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold text-lg rounded-xl shadow-lg hover:shadow-xl transition-all"
                        disabled={loading}
                    >
                        {loading ? (
                            <>
                                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                Création en cours...
                            </>
                        ) : (
                            <>
                                Continuer vers les services
                                <span className="ml-2">→</span>
                            </>
                        )}
                    </Button>
                </form>
            </div>
        </div>
    );
}
