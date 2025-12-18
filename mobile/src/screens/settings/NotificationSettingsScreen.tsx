import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Switch,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { useResponsive } from '../../hooks/useResponsive';

interface NotificationPreferences {
    bookings: boolean;
    messages: boolean;
    reminders: boolean;
    credits: boolean;
    announcements: boolean;
    promotions: boolean;
    marketplace: boolean;
}

interface NotificationCategory {
    key: keyof NotificationPreferences;
    icon: string;
    title: string;
    description: string;
    color: string;
}

const categories: NotificationCategory[] = [
    {
        key: 'bookings',
        icon: 'calendar',
        title: 'Réservations',
        description: 'Nouvelles réservations, confirmations et mises à jour',
        color: '#3B82F6',
    },
    {
        key: 'messages',
        icon: 'chatbubble',
        title: 'Messages',
        description: 'Nouveaux messages de vos clients ou prestataires',
        color: '#22C55E',
    },
    {
        key: 'reminders',
        icon: 'alarm',
        title: 'Rappels',
        description: 'Rappels avant vos rendez-vous',
        color: '#F59E0B',
    },
    {
        key: 'credits',
        icon: 'card',
        title: 'Crédits',
        description: 'Achats de crédits et mises à jour du solde',
        color: '#8B5CF6',
    },
    {
        key: 'marketplace',
        icon: 'bag',
        title: 'Marketplace',
        description: 'Commandes et messages de la marketplace',
        color: '#EC4899',
    },
    {
        key: 'announcements',
        icon: 'megaphone',
        title: 'Annonces',
        description: "Actualités et mises à jour de l'application",
        color: '#EF4444',
    },
    {
        key: 'promotions',
        icon: 'gift',
        title: 'Promotions',
        description: 'Offres spéciales et réductions',
        color: '#F97316',
    },
];

const defaultPreferences: NotificationPreferences = {
    bookings: true,
    messages: true,
    reminders: true,
    credits: true,
    announcements: true,
    promotions: true,
    marketplace: true,
};

export const NotificationSettingsScreen: React.FC = () => {
    const navigation = useNavigation<any>();
    const { user } = useAuth();
    const { normalizeFontSize, spacing } = useResponsive();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [preferences, setPreferences] = useState<NotificationPreferences>(defaultPreferences);

    useEffect(() => {
        loadPreferences();
    }, []);

    const loadPreferences = async () => {
        try {
            if (!user?.id) return;

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
            if (!user?.id) return;

            const { error } = await supabase
                .from('users')
                .update({ notification_preferences: preferences })
                .eq('id', user.id);

            if (error) throw error;

            Alert.alert('Succès', 'Préférences enregistrées !');
        } catch (error) {
            console.error('Error saving preferences:', error);
            Alert.alert('Erreur', "Impossible d'enregistrer les préférences");
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

    const toggleAll = (enabled: boolean) => {
        const newPrefs = { ...preferences };
        Object.keys(newPrefs).forEach(key => {
            newPrefs[key as keyof NotificationPreferences] = enabled;
        });
        setPreferences(newPrefs);
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#2D2D2D" />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <Ionicons name="arrow-back" size={24} color="#2D2D2D" />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { fontSize: normalizeFontSize(20) }]}>
                    Notifications
                </Text>
                <TouchableOpacity
                    style={styles.saveButton}
                    onPress={savePreferences}
                    disabled={saving}
                >
                    {saving ? (
                        <ActivityIndicator size="small" color="#2D2D2D" />
                    ) : (
                        <Text style={[styles.saveButtonText, { fontSize: normalizeFontSize(14) }]}>
                            Enregistrer
                        </Text>
                    )}
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ paddingBottom: spacing(4) }}>
                {/* Quick Actions */}
                <View style={[styles.quickActions, { padding: spacing(2), marginHorizontal: spacing(2), marginTop: spacing(2) }]}>
                    <TouchableOpacity
                        style={[styles.quickButton, styles.quickButtonEnable, { padding: spacing(2) }]}
                        onPress={() => toggleAll(true)}
                    >
                        <Text style={[styles.quickButtonText, styles.quickButtonTextEnable, { fontSize: normalizeFontSize(14) }]}>
                            Tout activer
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.quickButton, styles.quickButtonDisable, { padding: spacing(2) }]}
                        onPress={() => toggleAll(false)}
                    >
                        <Text style={[styles.quickButtonText, styles.quickButtonTextDisable, { fontSize: normalizeFontSize(14) }]}>
                            Tout désactiver
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Categories */}
                <View style={[styles.card, { marginHorizontal: spacing(2), marginTop: spacing(3) }]}>
                    <Text style={[styles.cardTitle, { fontSize: normalizeFontSize(16), padding: spacing(2) }]}>
                        Catégories de notifications
                    </Text>

                    {categories.map((category, index) => (
                        <View
                            key={category.key}
                            style={[
                                styles.categoryItem,
                                { padding: spacing(2) },
                                index < categories.length - 1 && styles.categoryItemBorder,
                            ]}
                        >
                            <View style={styles.categoryLeft}>
                                <View style={[styles.categoryIcon, { backgroundColor: category.color }]}>
                                    <Ionicons name={category.icon as any} size={20} color="#FFFFFF" />
                                </View>
                                <View style={styles.categoryInfo}>
                                    <Text style={[styles.categoryTitle, { fontSize: normalizeFontSize(15) }]}>
                                        {category.title}
                                    </Text>
                                    <Text style={[styles.categoryDescription, { fontSize: normalizeFontSize(12) }]}>
                                        {category.description}
                                    </Text>
                                </View>
                            </View>
                            <Switch
                                value={preferences[category.key]}
                                onValueChange={() => togglePreference(category.key)}
                                trackColor={{ false: '#D1D5DB', true: '#FCD34D' }}
                                thumbColor={preferences[category.key] ? '#F59E0B' : '#9CA3AF'}
                            />
                        </View>
                    ))}
                </View>

                {/* Info */}
                <Text style={[styles.infoText, { fontSize: normalizeFontSize(12), marginHorizontal: spacing(2), marginTop: spacing(3) }]}>
                    Ces paramètres s'appliquent à tous vos appareils connectés à ce compte.
                </Text>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F5F5',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F5F5F5',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    backButton: {
        padding: 8,
    },
    headerTitle: {
        fontWeight: '700',
        color: '#2D2D2D',
    },
    saveButton: {
        padding: 8,
    },
    saveButtonText: {
        fontWeight: '600',
        color: '#F59E0B',
    },
    quickActions: {
        flexDirection: 'row',
        gap: 12,
    },
    quickButton: {
        flex: 1,
        borderRadius: 12,
        alignItems: 'center',
    },
    quickButtonEnable: {
        backgroundColor: '#DCFCE7',
    },
    quickButtonDisable: {
        backgroundColor: '#FEE2E2',
    },
    quickButtonText: {
        fontWeight: '600',
    },
    quickButtonTextEnable: {
        color: '#16A34A',
    },
    quickButtonTextDisable: {
        color: '#DC2626',
    },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        overflow: 'hidden',
    },
    cardTitle: {
        fontWeight: '600',
        color: '#2D2D2D',
        backgroundColor: '#F9FAFB',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    categoryItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    categoryItemBorder: {
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    categoryLeft: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    categoryIcon: {
        width: 40,
        height: 40,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    categoryInfo: {
        flex: 1,
    },
    categoryTitle: {
        fontWeight: '600',
        color: '#2D2D2D',
        marginBottom: 2,
    },
    categoryDescription: {
        color: '#6B7280',
    },
    infoText: {
        color: '#9CA3AF',
        textAlign: 'center',
    },
});
