
"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    Info,
    ArrowLeft,
    Power
} from 'lucide-react';
import { createClient } from '@/lib/supabase';
import { contractorApi } from '@/services/api';
import { useLanguage } from '@/context/LanguageContext';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';

export default function ProAvailabilityPage() {
    const router = useRouter();
    const { t, language } = useLanguage();

    const [loading, setLoading] = useState(true);
    const [isOnline, setIsOnline] = useState(false);
    const [profile, setProfile] = useState<any>(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const supabase = createClient();
            const { data: { session } } = await supabase.auth.getSession();
            if (!session?.user) return;

            const profileData = await contractorApi.getProfileByUserId(session.user.id);
            if (profileData) {
                setProfile(profileData);
                setIsOnline(profileData.is_online || false);
            }
        } catch (error) {
            console.error("Error loading profile:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleToggleOnline = async (value: boolean) => {
        if (!profile) return;

        setIsOnline(value); // Optimistic update

        try {
            await contractorApi.updateProfile(profile.user_id, {
                is_online: value
            });
        } catch (error) {
            console.error("Error updating availability:", error);
            setIsOnline(!value); // Revert
            alert("Erreur lors de la mise à jour du statut");
        }
    };

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center">Chargement...</div>;
    }

    return (
        <div className="bg-gray-50 min-h-screen pb-24 font-sans">
            {/* Header */}
            <div className="bg-white px-4 py-4 flex items-center gap-4 sticky top-0 z-10 border-b border-gray-100">
                <Button variant="ghost" size="icon" onClick={() => router.back()} className="-ml-2">
                    <ArrowLeft className="h-6 w-6 text-gray-900" />
                </Button>
                <h1 className="text-lg font-bold text-gray-900">
                    {language === 'fr' ? 'Mes Disponibilités' : 'My Schedule'}
                </h1>
            </div>

            <div className="p-4 max-w-lg mx-auto space-y-6">

                {/* Status Card */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between">
                        <div className="flex-1 pr-4">
                            <h2 className={`text-lg font-bold mb-1 ${isOnline ? 'text-green-600' : 'text-gray-500'}`}>
                                {isOnline
                                    ? (language === 'fr' ? 'Vous êtes en ligne' : 'You are Online')
                                    : (language === 'fr' ? 'Vous êtes hors ligne' : 'You are Offline')
                                }
                            </h2>
                            <p className="text-sm text-gray-500 leading-relaxed">
                                {isOnline
                                    ? (language === 'fr' ? 'Les clients peuvent vous trouver et réserver vos services.' : 'Clients can find you and book your services.')
                                    : (language === 'fr' ? 'Vous n\'apparaissez pas dans les recherches.' : 'You do not appear in search results.')
                                }
                            </p>
                        </div>
                        <Switch
                            checked={isOnline}
                            onCheckedChange={handleToggleOnline}
                            className="scale-125"
                        />
                    </div>
                </div>

                {/* Info Note */}
                <div className="bg-gray-100/50 p-4 rounded-xl border border-gray-200/50">
                    <div className="flex items-start gap-3">
                        <Info className="h-5 w-5 text-gray-500 mt-0.5 flex-shrink-0" />
                        <div>
                            <h3 className="font-semibold text-gray-900 text-sm mb-1">
                                {language === 'fr' ? 'Note' : 'Note'}
                            </h3>
                            <p className="text-sm text-gray-600 leading-relaxed">
                                {language === 'fr'
                                    ? 'Désactivez votre statut si vous ne souhaitez pas recevoir de nouvelles demandes pour l\'instant.'
                                    : 'Toggle off your status if you do not wish to receive new requests at the moment.'
                                }
                            </p>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
