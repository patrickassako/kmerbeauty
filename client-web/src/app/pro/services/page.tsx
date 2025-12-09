
"use client";

import { useEffect, useState } from 'react';
import {
    Search,
    X,
    Check,
    Plus,
    Clock,
    Trash2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase';
import {
    contractorApi,
    servicesApi,
    categoriesApi,
    ContractorService,
    Service,
    CategoryTranslation
} from '@/services/api';
import { useLanguage } from '@/context/LanguageContext';

export default function ServicesPage() {
    const { t, language } = useLanguage();

    // Data State
    const [loading, setLoading] = useState(true);
    const [contractorId, setContractorId] = useState<string | null>(null);
    const [contractorServices, setContractorServices] = useState<ContractorService[]>([]);
    const [allServices, setAllServices] = useState<Service[]>([]);
    const [categories, setCategories] = useState<CategoryTranslation[]>([]);

    // UI State
    const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
    const [searchQuery, setSearchQuery] = useState('');

    // Modal State
    const [showModal, setShowModal] = useState(false);
    const [selectedService, setSelectedService] = useState<Service | null>(null);
    const [existingService, setExistingService] = useState<ContractorService | null>(null); // For edit mode

    // Form State
    const [customPrice, setCustomPrice] = useState('');
    const [customDuration, setCustomDuration] = useState('');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const supabase = createClient();
            const { data: { session } } = await supabase.auth.getSession();

            if (!session?.user) return;

            // Get profile first
            const profile = await contractorApi.getProfileByUserId(session.user.id);
            if (!profile) return;
            setContractorId(profile.id);

            // Fetch all data
            const [myServices, services, cats] = await Promise.all([
                contractorApi.getServices(profile.id),
                servicesApi.getAll(),
                categoriesApi.getAll()
            ]);

            setContractorServices(myServices);
            setAllServices(services);
            setCategories(cats);

        } catch (error) {
            console.error("Error loading services data:", error);
        } finally {
            setLoading(false);
        }
    };

    // Filter Logic
    const getFilteredServices = () => {
        let filtered = allServices;

        if (selectedCategory !== 'ALL') {
            filtered = filtered.filter((s) => s.category === selectedCategory);
        }

        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter((s) => {
                const name = language === 'fr' ? s.name_fr : s.name_en;
                return name.toLowerCase().includes(query);
            });
        }

        return filtered;
    };

    // Handlers
    const handleServiceClick = (service: Service) => {
        const existing = contractorServices.find(cs => cs.service_id === service.id);

        setSelectedService(service);
        setExistingService(existing || null);

        if (existing) {
            setCustomPrice(existing.price.toString());
            setCustomDuration(existing.duration.toString());
        } else {
            setCustomPrice(service.base_price.toString());
            setCustomDuration(service.duration.toString());
        }

        setShowModal(true);
    };

    const handleSave = async () => {
        if (!contractorId || !selectedService) return;

        try {
            const price = parseFloat(customPrice);
            const duration = parseInt(customDuration);

            if (existingService) {
                // Update
                await contractorApi.updateService(existingService.id, { price, duration });
            } else {
                // Add
                await contractorApi.addService({
                    contractor_id: contractorId,
                    service_id: selectedService.id,
                    price,
                    duration
                });
            }

            // Reload data and close modal
            await loadData();
            setShowModal(false);
        } catch (error) {
            console.error("Error saving service:", error);
            alert("Une erreur est survenue lors de la sauvegarde.");
        }
    };

    const handleRemove = async () => {
        if (!existingService) return;

        if (confirm("Êtes-vous sûr de vouloir supprimer ce service ?")) {
            try {
                await contractorApi.deleteService(existingService.id);
                await loadData();
                setShowModal(false);
            } catch (error) {
                console.error("Error removing service:", error);
            }
        }
    };

    // Helpers
    const formatCurrency = (val: number) => new Intl.NumberFormat('fr-CM', { style: 'currency', currency: 'XAF' }).format(val);
    const formatDuration = (mins: number) => {
        const h = Math.floor(mins / 60);
        const m = mins % 60;
        if (h > 0 && m > 0) return `${h}h ${m}m`;
        if (h > 0) return `${h}h`;
        return `${m}m`;
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Chargement...</div>;

    const filteredServices = getFilteredServices();

    return (
        <div className="space-y-6 pb-20">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Mes Services</h1>
                <p className="text-gray-500 text-sm mt-1">
                    Ajoutez, modifiez ou supprimez les services que vous proposez.
                </p>
            </div>

            {/* Controls */}
            <div className="space-y-4">
                {/* Search */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder={language === 'fr' ? 'Rechercher un service...' : 'Search services...'}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:border-gray-900 focus:ring-0 outline-none transition-colors"
                    />
                    {searchQuery && (
                        <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                            <X className="h-4 w-4" />
                        </button>
                    )}
                </div>

                {/* Categories */}
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                    <button
                        onClick={() => setSelectedCategory('ALL')}
                        className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${selectedCategory === 'ALL'
                                ? 'bg-gray-900 text-white'
                                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                            }`}
                    >
                        Tous
                    </button>
                    {categories.map((cat) => (
                        <button
                            key={cat.category}
                            onClick={() => setSelectedCategory(cat.category)}
                            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${selectedCategory === cat.category
                                    ? 'bg-gray-900 text-white'
                                    : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                                }`}
                        >
                            {language === 'fr' ? cat.name_fr : cat.name_en}
                        </button>
                    ))}
                </div>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredServices.map(service => {
                    const isAdded = contractorServices.some(cs => cs.service_id === service.id);
                    // Get 'my' version if added to show MY price
                    const myVersion = contractorServices.find(cs => cs.service_id === service.id);

                    return (
                        <div
                            key={service.id}
                            onClick={() => handleServiceClick(service)}
                            className={`group relative bg-white rounded-xl border cursor-pointer hover:shadow-md transition-all overflow-hidden ${isAdded ? 'border-green-500 ring-1 ring-green-500' : 'border-gray-200'
                                }`}
                        >
                            {/* Image Placeholder */}
                            <div className="h-32 bg-gray-100 relative">
                                {service.images?.[0] ? (
                                    <img src={service.images[0]} alt="" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-300">
                                        <Search className="h-8 w-8" />
                                    </div>
                                )}

                                {isAdded && (
                                    <div className="absolute top-2 right-2 h-8 w-8 bg-green-500 rounded-full flex items-center justify-center shadow-lg">
                                        <Check className="h-5 w-5 text-white stroke-[3]" />
                                    </div>
                                )}
                            </div>

                            <div className="p-4">
                                <h3 className="font-bold text-gray-900 line-clamp-1">
                                    {language === 'fr' ? service.name_fr : service.name_en}
                                </h3>

                                <div className="flex justify-between items-center mt-2">
                                    <span className={`font-bold ${isAdded ? 'text-green-600' : 'text-gray-900'}`}>
                                        {formatCurrency(myVersion ? myVersion.price : service.base_price)}
                                    </span>
                                    <span className="text-xs text-gray-500 flex items-center gap-1">
                                        <Clock className="h-3 w-3" />
                                        {formatDuration(myVersion ? myVersion.duration : service.duration)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Modal */}
            {showModal && selectedService && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                        {/* Modal Header */}
                        <div className="p-4 border-b flex justify-between items-center bg-gray-50">
                            <h3 className="font-bold text-lg">
                                {existingService ? 'Modifier le service' : 'Ajouter un service'}
                            </h3>
                            <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                                <X className="h-6 w-6" />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6 space-y-6">
                            {/* Service Preview */}
                            <div className="flex gap-4">
                                <div className="h-16 w-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                                    {selectedService.images?.[0] && (
                                        <img src={selectedService.images[0]} className="w-full h-full object-cover" />
                                    )}
                                </div>
                                <div>
                                    <p className="font-bold text-gray-900">
                                        {language === 'fr' ? selectedService.name_fr : selectedService.name_en}
                                    </p>
                                    <p className="text-sm text-gray-500">
                                        Prix de base: {formatCurrency(selectedService.base_price)}
                                    </p>
                                </div>
                            </div>

                            {/* Inputs */}
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-900 mb-1">Votre Prix (XAF)</label>
                                    <input
                                        type="number"
                                        value={customPrice}
                                        onChange={(e) => setCustomPrice(e.target.value)}
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-black focus:ring-0 outline-none bg-gray-50"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-900 mb-1">Durée (minutes)</label>
                                    <input
                                        type="number"
                                        value={customDuration}
                                        onChange={(e) => setCustomDuration(e.target.value)}
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-black focus:ring-0 outline-none bg-gray-50"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="p-4 border-t flex gap-3">
                            {existingService && (
                                <button
                                    onClick={handleRemove}
                                    className="px-4 py-3 rounded-xl border border-red-200 text-red-600 font-medium hover:bg-red-50 transition-colors"
                                >
                                    Supprimer
                                </button>
                            )}
                            <button
                                onClick={handleSave}
                                className="flex-1 bg-gray-900 text-white font-bold py-3 rounded-xl hover:bg-black transition-colors"
                            >
                                {existingService ? 'Enregistrer les modifications' : 'Ajouter ce service'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
