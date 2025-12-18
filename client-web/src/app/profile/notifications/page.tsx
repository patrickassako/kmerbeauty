"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import {
    Bell,
    MessageSquare,
    Calendar,
    CreditCard,
    Megaphone,
    Gift,
    ShoppingBag,
    Loader2,
    ArrowLeft,
    Check,
    Smartphone,
    Monitor
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface NotificationPreferences {
    bookings: boolean;
    messages: boolean;
    reminders: boolean;
    credits: boolean;
    announcements: boolean;
    promotions: boolean;
    marketplace: boolean;
}

const defaultPreferences: NotificationPreferences = {
    bookings: true,
    messages: true,
    reminders: true,
    credits: true,
    announcements: true,
    promotions: true,
    marketplace: true,
};

interface NotificationCategory {
    key: keyof NotificationPreferences;
    icon: React.ReactNode;
    title: string;
    description: string;
    color: string;
}

const categories: NotificationCategory[] = [
    {
        key: 'bookings',
        icon: <Calendar className="w-5 h-5" />,
        title: 'Réservations',
        description: 'Nouvelles réservations, confirmations et mises à jour',
        color: 'bg-blue-500',
    },
    {
        key: 'messages',
        icon: <MessageSquare className="w-5 h-5" />,
        title: 'Messages',
        description: 'Nouveaux messages de vos clients ou prestataires',
        color: 'bg-green-500',
    },
    {
        key: 'reminders',
        icon: <Bell className="w-5 h-5" />,
        title: 'Rappels',
        description: 'Rappels avant vos rendez-vous',
        color: 'bg-amber-500',
    },
    {
        key: 'credits',
        icon: <CreditCard className="w-5 h-5" />,
        title: 'Crédits',
        description: 'Achats de crédits et mises à jour du solde',
        color: 'bg-purple-500',
    },
    {
        key: 'marketplace',
        icon: <ShoppingBag className="w-5 h-5" />,
        title: 'Marketplace',
        description: 'Commandes et messages de la marketplace',
        color: 'bg-pink-500',
    },
    {
        key: 'announcements',
        icon: <Megaphone className="w-5 h-5" />,
        title: 'Annonces',
        description: 'Actualités et mises à jour importantes de l\'application',
        color: 'bg-red-500',
    },
    {
        key: 'promotions',
        icon: <Gift className="w-5 h-5" />,
        title: 'Promotions',
        description: 'Offres spéciales et réductions',
        color: 'bg-orange-500',
    },
];

export default function NotificationsSettingsPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [preferences, setPreferences] = useState<NotificationPreferences>(defaultPreferences);
    const [webPushEnabled, setWebPushEnabled] = useState(false);
    const [webPushSupported, setWebPushSupported] = useState(false);

    useEffect(() => {
        loadPreferences();
        checkWebPushSupport();
    }, []);

    const checkWebPushSupport = () => {
        if (typeof window !== 'undefined' && 'Notification' in window && 'serviceWorker' in navigator) {
            setWebPushSupported(true);
            setWebPushEnabled(Notification.permission === 'granted');
        }
    };

    const loadPreferences = async () => {
        try {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                router.push('/login');
                return;
            }

            const { data, error } = await supabase
                .from('users')
                .select('notification_preferences')
                .eq('id', user.id)
                .single();

            if (error) throw error;

            if (data?.notification_preferences) {
                setPreferences({
                    ...defaultPreferences,
                    ...data.notification_preferences,
                });
            }
        } catch (error) {
            console.error('Error loading preferences:', error);
        } finally {
            setLoading(false);
        }
    };

    const savePreferences = async () => {
        try {
            setSaving(true);
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) return;

            const { error } = await supabase
                .from('users')
                .update({ notification_preferences: preferences })
                .eq('id', user.id);

            if (error) throw error;

            // Show success feedback
            alert('Préférences enregistrées !');
        } catch (error) {
            console.error('Error saving preferences:', error);
            alert('Erreur lors de l\'enregistrement');
        } finally {
            setSaving(false);
        }
    };

    const togglePreference = (key: keyof NotificationPreferences) => {
        setPreferences(prev => ({
            ...prev,
            [key]: !prev[key],
        }));
    };

    const requestWebPushPermission = async () => {
        try {
            const permission = await Notification.requestPermission();
            if (permission === 'granted') {
                setWebPushEnabled(true);
                // TODO: Register service worker and get push token
                alert('Notifications web activées !');
            } else {
                alert('Permission refusée. Vous pouvez l\'activer dans les paramètres de votre navigateur.');
            }
        } catch (error) {
            console.error('Error requesting permission:', error);
        }
    };

    const toggleAll = (enabled: boolean) => {
        const newPrefs = { ...preferences };
        Object.keys(newPrefs).forEach(key => {
            newPrefs[key as keyof NotificationPreferences] = enabled;
        });
        setPreferences(newPrefs);
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b sticky top-0 z-10">
                <div className="max-w-2xl mx-auto px-4 py-4">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => router.back()}
                            className="p-2 hover:bg-gray-100 rounded-full transition"
                        >
                            <ArrowLeft className="w-5 h-5 text-gray-600" />
                        </button>
                        <div>
                            <h1 className="text-xl font-bold text-gray-900">Notifications</h1>
                            <p className="text-sm text-gray-500">Gérez vos préférences de notification</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
                {/* Web Push Section */}
                {webPushSupported && (
                    <div className="bg-white rounded-2xl p-6 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl flex items-center justify-center">
                                    <Monitor className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-900">Notifications Web</h3>
                                    <p className="text-sm text-gray-500">
                                        Recevez des notifications sur ce navigateur
                                    </p>
                                </div>
                            </div>
                            {webPushEnabled ? (
                                <div className="flex items-center gap-2 text-green-600 bg-green-50 px-3 py-1.5 rounded-full">
                                    <Check className="w-4 h-4" />
                                    <span className="text-sm font-medium">Activé</span>
                                </div>
                            ) : (
                                <Button
                                    onClick={requestWebPushPermission}
                                    className="bg-amber-500 hover:bg-amber-600 text-white"
                                >
                                    Activer
                                </Button>
                            )}
                        </div>
                    </div>
                )}

                {/* Mobile App Reminder */}
                <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-2xl p-6 text-white">
                    <div className="flex items-center gap-3 mb-2">
                        <Smartphone className="w-5 h-5 text-amber-400" />
                        <span className="font-semibold">Application Mobile</span>
                    </div>
                    <p className="text-sm text-gray-300">
                        Pour ne jamais manquer une notification, téléchargez notre application mobile
                        et activez les notifications push.
                    </p>
                </div>

                {/* Quick Actions */}
                <div className="flex gap-3">
                    <button
                        onClick={() => toggleAll(true)}
                        className="flex-1 py-2 px-4 bg-green-50 text-green-700 rounded-xl font-medium hover:bg-green-100 transition"
                    >
                        Tout activer
                    </button>
                    <button
                        onClick={() => toggleAll(false)}
                        className="flex-1 py-2 px-4 bg-red-50 text-red-700 rounded-xl font-medium hover:bg-red-100 transition"
                    >
                        Tout désactiver
                    </button>
                </div>

                {/* Categories */}
                <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                    <div className="p-4 border-b bg-gray-50">
                        <h2 className="font-semibold text-gray-900">Catégories de notifications</h2>
                    </div>
                    <div className="divide-y">
                        {categories.map((category) => (
                            <div
                                key={category.key}
                                className="p-4 flex items-center justify-between hover:bg-gray-50 transition"
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`w-10 h-10 ${category.color} rounded-xl flex items-center justify-center text-white`}>
                                        {category.icon}
                                    </div>
                                    <div>
                                        <h3 className="font-medium text-gray-900">{category.title}</h3>
                                        <p className="text-sm text-gray-500">{category.description}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => togglePreference(category.key)}
                                    className={`relative w-12 h-7 rounded-full transition-colors ${preferences[category.key] ? 'bg-amber-500' : 'bg-gray-300'
                                        }`}
                                >
                                    <span
                                        className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-transform ${preferences[category.key] ? 'translate-x-6' : 'translate-x-1'
                                            }`}
                                    />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Save Button */}
                <Button
                    onClick={savePreferences}
                    disabled={saving}
                    className="w-full bg-amber-500 hover:bg-amber-600 text-white py-6 text-lg font-semibold rounded-xl"
                >
                    {saving ? (
                        <>
                            <Loader2 className="w-5 h-5 animate-spin mr-2" />
                            Enregistrement...
                        </>
                    ) : (
                        'Enregistrer les préférences'
                    )}
                </Button>

                {/* Info */}
                <p className="text-center text-sm text-gray-500">
                    Ces paramètres s'appliquent à tous vos appareils connectés à ce compte.
                </p>
            </div>
        </div>
    );
}
