/**
 * BetaTesterModal
 * Modal for beta testers to track and report feature testing
 * Tests are role-based (client/provider) and saved to Supabase for admin reporting
 */

import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
    ScrollView,
    Alert,
    ActivityIndicator,
    TextInput,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

interface TestItem {
    id: string;
    category: string;
    name: string;
    description: string;
    status: 'pending' | 'working' | 'broken';
    comment?: string;
}

interface BetaTesterModalProps {
    visible: boolean;
    onClose: () => void;
}

// Client-specific tests
const CLIENT_TESTS: Omit<TestItem, 'status'>[] = [
    // Authentication
    { id: 'c_auth_signup', category: '🔐 Authentification', name: 'Inscription', description: 'Créer un compte client' },
    { id: 'c_auth_login', category: '🔐 Authentification', name: 'Connexion', description: 'Se connecter à l\'application' },
    { id: 'c_auth_logout', category: '🔐 Authentification', name: 'Déconnexion', description: 'Se déconnecter' },

    // Profile
    { id: 'c_profile_view', category: '👤 Profil', name: 'Voir mon profil', description: 'Afficher les informations du profil' },
    { id: 'c_profile_edit', category: '👤 Profil', name: 'Modifier profil', description: 'Modifier nom, téléphone, photo' },

    // Search & Services
    { id: 'c_search', category: '🔍 Recherche', name: 'Rechercher service', description: 'Chercher un service de beauté' },
    { id: 'c_categories', category: '🔍 Recherche', name: 'Voir catégories', description: 'Parcourir les catégories de services' },
    { id: 'c_service_details', category: '🔍 Recherche', name: 'Détails service', description: 'Voir les détails d\'un service' },

    // Providers
    { id: 'c_providers_list', category: '💅 Prestataires', name: 'Liste prestataires', description: 'Voir les prestataires disponibles' },
    { id: 'c_provider_details', category: '💅 Prestataires', name: 'Détails prestataire', description: 'Voir le profil d\'un prestataire' },
    { id: 'c_provider_salon', category: '💅 Prestataires', name: 'Voir institut', description: 'Voir le profil d\'un institut' },

    // Booking
    { id: 'c_booking_create', category: '📅 Réservation', name: 'Créer réservation', description: 'Réserver un créneau' },
    { id: 'c_booking_list', category: '📅 Réservation', name: 'Mes réservations', description: 'Voir mes réservations' },
    { id: 'c_booking_details', category: '📅 Réservation', name: 'Détails réservation', description: 'Voir les détails d\'une réservation' },
    { id: 'c_booking_cancel', category: '📅 Réservation', name: 'Annuler réservation', description: 'Annuler une réservation' },

    // Chat
    { id: 'c_chat_open', category: '💬 Chat', name: 'Ouvrir chat', description: 'Ouvrir une conversation' },
    { id: 'c_chat_message', category: '💬 Chat', name: 'Envoyer message', description: 'Envoyer un message texte' },
    { id: 'c_chat_image', category: '💬 Chat', name: 'Envoyer image', description: 'Envoyer une photo' },
    { id: 'c_chat_audio', category: '💬 Chat', name: 'Envoyer audio', description: 'Envoyer un message vocal' },

    // Map
    { id: 'c_map_view', category: '🗺️ Carte', name: 'Voir carte', description: 'Afficher la carte des prestataires' },
    { id: 'c_map_location', category: '🗺️ Carte', name: 'Ma position', description: 'Voir ma position sur la carte' },

    // Notifications
    { id: 'c_notif_receive', category: '🔔 Notifications', name: 'Recevoir notification', description: 'Recevoir une notification push' },
];

// Provider-specific tests
const PROVIDER_TESTS: Omit<TestItem, 'status'>[] = [
    // Authentication
    { id: 'p_auth_signup', category: '🔐 Authentification', name: 'Inscription prestataire', description: 'Créer un compte prestataire' },
    { id: 'p_auth_login', category: '🔐 Authentification', name: 'Connexion', description: 'Se connecter' },

    // Profile
    { id: 'p_profile_setup', category: '👤 Profil Pro', name: 'Créer profil pro', description: 'Configurer le profil prestataire' },
    { id: 'p_profile_edit', category: '👤 Profil Pro', name: 'Modifier profil', description: 'Modifier les informations' },
    { id: 'p_profile_photo', category: '👤 Profil Pro', name: 'Photo profil', description: 'Ajouter/modifier photo' },
    { id: 'p_profile_location', category: '👤 Profil Pro', name: 'Localisation', description: 'Définir la zone de service' },

    // Services
    { id: 'p_services_add', category: '💇 Services', name: 'Ajouter service', description: 'Ajouter un nouveau service' },
    { id: 'p_services_edit', category: '💇 Services', name: 'Modifier service', description: 'Modifier un service existant' },
    { id: 'p_services_delete', category: '💇 Services', name: 'Supprimer service', description: 'Supprimer un service' },
    { id: 'p_services_price', category: '💇 Services', name: 'Définir prix', description: 'Définir les tarifs' },

    // Availability
    { id: 'p_availability_set', category: '📅 Disponibilités', name: 'Définir horaires', description: 'Configurer les disponibilités' },
    { id: 'p_availability_break', category: '📅 Disponibilités', name: 'Ajouter pause', description: 'Ajouter une pause/congé' },

    // Bookings
    { id: 'p_bookings_view', category: '📋 Commandes', name: 'Voir demandes', description: 'Voir les demandes de réservation' },
    { id: 'p_bookings_accept', category: '📋 Commandes', name: 'Accepter demande', description: 'Accepter une réservation' },
    { id: 'p_bookings_reject', category: '📋 Commandes', name: 'Refuser demande', description: 'Refuser une réservation' },
    { id: 'p_bookings_complete', category: '📋 Commandes', name: 'Terminer RDV', description: 'Marquer un RDV comme terminé' },

    // Dashboard
    { id: 'p_dashboard_stats', category: '📊 Dashboard', name: 'Voir statistiques', description: 'Consulter les stats du dashboard' },
    { id: 'p_dashboard_earnings', category: '📊 Dashboard', name: 'Voir revenus', description: 'Consulter les revenus' },

    // Credits
    { id: 'p_credits_view', category: '💳 Crédits', name: 'Voir crédits', description: 'Consulter le solde de crédits' },
    { id: 'p_credits_buy', category: '💳 Crédits', name: 'Acheter crédits', description: 'Acheter des crédits' },

    // Chat
    { id: 'p_chat_respond', category: '💬 Chat', name: 'Répondre message', description: 'Répondre à un client' },

    // Notifications
    { id: 'p_notif_receive', category: '🔔 Notifications', name: 'Recevoir notification', description: 'Recevoir une notification' },
];

export const BetaTesterModal: React.FC<BetaTesterModalProps> = ({ visible, onClose }) => {
    const { user, userMode } = useAuth();
    const [tests, setTests] = useState<TestItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [commentModalVisible, setCommentModalVisible] = useState(false);
    const [selectedTestId, setSelectedTestId] = useState<string | null>(null);
    const [commentText, setCommentText] = useState('');

    const isProvider = userMode === 'provider';
    const testsList = isProvider ? PROVIDER_TESTS : CLIENT_TESTS;

    useEffect(() => {
        if (visible && user?.id) {
            loadTestResults();
        }
    }, [visible, user?.id, userMode]);

    const loadTestResults = async () => {
        if (!user?.id) return;

        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('beta_test_results')
                .select('*')
                .eq('user_id', user.id)
                .eq('user_type', isProvider ? 'provider' : 'client');

            if (error) throw error;

            // Merge saved results with test definitions
            const testsWithStatus = testsList.map(test => {
                const savedTest = data?.find(d => d.test_id === test.id);
                return {
                    ...test,
                    status: (savedTest?.status || 'pending') as TestItem['status'],
                    comment: savedTest?.comment || '',
                };
            });

            setTests(testsWithStatus);
        } catch (error) {
            console.error('Error loading test results:', error);
            // Fallback to pending status
            setTests(testsList.map(t => ({ ...t, status: 'pending' as const })));
        } finally {
            setLoading(false);
        }
    };

    const updateTestStatus = async (id: string, status: TestItem['status'], comment?: string) => {
        if (!user?.id) return;

        // Update UI immediately
        const updated = tests.map(t => t.id === id ? { ...t, status, comment: comment || t.comment } : t);
        setTests(updated);

        // Save to database
        try {
            const { error } = await supabase
                .from('beta_test_results')
                .upsert({
                    user_id: user.id,
                    user_type: isProvider ? 'provider' : 'client',
                    test_id: id,
                    status,
                    comment: comment || null,
                    tested_at: new Date().toISOString(),
                    device_info: `${Platform.OS} ${Platform.Version}`,
                }, {
                    onConflict: 'user_id,test_id',
                });

            if (error) throw error;
        } catch (error) {
            console.error('Error saving test result:', error);
            Alert.alert('Erreur', 'Impossible de sauvegarder le résultat');
        }
    };

    const handleBrokenPress = (testId: string) => {
        const test = tests.find(t => t.id === testId);
        setSelectedTestId(testId);
        setCommentText(test?.comment || '');
        setCommentModalVisible(true);
    };

    const submitBrokenTest = () => {
        if (selectedTestId) {
            updateTestStatus(selectedTestId, 'broken', commentText);
        }
        setCommentModalVisible(false);
        setSelectedTestId(null);
        setCommentText('');
    };

    const resetAllTests = () => {
        Alert.alert(
            'Réinitialiser',
            'Êtes-vous sûr de vouloir réinitialiser tous les tests ?',
            [
                { text: 'Annuler', style: 'cancel' },
                {
                    text: 'Réinitialiser',
                    style: 'destructive',
                    onPress: async () => {
                        if (!user?.id) return;

                        try {
                            await supabase
                                .from('beta_test_results')
                                .delete()
                                .eq('user_id', user.id)
                                .eq('user_type', isProvider ? 'provider' : 'client');

                            setTests(testsList.map(t => ({ ...t, status: 'pending' as const })));
                        } catch (error) {
                            console.error('Error resetting tests:', error);
                        }
                    }
                }
            ]
        );
    };

    const getStats = () => {
        const working = tests.filter(t => t.status === 'working').length;
        const broken = tests.filter(t => t.status === 'broken').length;
        const pending = tests.filter(t => t.status === 'pending').length;
        return { working, broken, pending, total: tests.length };
    };

    const stats = getStats();
    const categories = [...new Set(tests.map(t => t.category))];

    return (
        <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
            <View style={styles.container}>
                {/* Header */}
                <View style={styles.header}>
                    <View>
                        <Text style={styles.headerTitle}>🧪 Beta Testing</Text>
                        <Text style={styles.headerSubtitle}>
                            {isProvider ? '👨‍💼 Mode Prestataire' : '👤 Mode Client'}
                        </Text>
                    </View>
                    <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                        <Ionicons name="close" size={24} color="#333" />
                    </TouchableOpacity>
                </View>

                {loading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color="#FF6B6B" />
                        <Text style={styles.loadingText}>Chargement des tests...</Text>
                    </View>
                ) : (
                    <>
                        {/* Stats */}
                        <View style={styles.statsContainer}>
                            <View style={[styles.statBox, { backgroundColor: '#E8F5E9' }]}>
                                <Text style={[styles.statNumber, { color: '#4CAF50' }]}>{stats.working}</Text>
                                <Text style={styles.statLabel}>✅ OK</Text>
                            </View>
                            <View style={[styles.statBox, { backgroundColor: '#FFEBEE' }]}>
                                <Text style={[styles.statNumber, { color: '#F44336' }]}>{stats.broken}</Text>
                                <Text style={styles.statLabel}>❌ KO</Text>
                            </View>
                            <View style={[styles.statBox, { backgroundColor: '#F5F5F5' }]}>
                                <Text style={[styles.statNumber, { color: '#9E9E9E' }]}>{stats.pending}</Text>
                                <Text style={styles.statLabel}>⏳ À tester</Text>
                            </View>
                        </View>

                        {/* Progress */}
                        <View style={styles.progressContainer}>
                            <View style={styles.progressBar}>
                                <View style={[styles.progressFill, styles.progressWorking, { flex: stats.working || 0.001 }]} />
                                <View style={[styles.progressFill, styles.progressBroken, { flex: stats.broken || 0.001 }]} />
                                <View style={[styles.progressFill, styles.progressPending, { flex: stats.pending || 0.001 }]} />
                            </View>
                            <Text style={styles.progressText}>
                                {stats.total > 0 ? Math.round(((stats.working + stats.broken) / stats.total) * 100) : 0}% testé
                            </Text>
                        </View>

                        {/* Test List */}
                        <ScrollView style={styles.testList} showsVerticalScrollIndicator={false}>
                            {categories.map(category => (
                                <View key={category} style={styles.categorySection}>
                                    <Text style={styles.categoryTitle}>{category}</Text>
                                    {tests.filter(t => t.category === category).map(test => (
                                        <View key={test.id} style={styles.testItem}>
                                            <View style={styles.testInfo}>
                                                <Text style={styles.testName}>{test.name}</Text>
                                                <Text style={styles.testDescription}>{test.description}</Text>
                                                {test.status === 'broken' && test.comment && (
                                                    <View style={styles.commentBadge}>
                                                        <Ionicons name="chatbubble" size={12} color="#F44336" />
                                                        <Text style={styles.commentText} numberOfLines={1}>{test.comment}</Text>
                                                    </View>
                                                )}
                                            </View>
                                            <View style={styles.testActions}>
                                                <TouchableOpacity
                                                    onPress={() => updateTestStatus(test.id, 'working')}
                                                    style={[styles.actionButton, test.status === 'working' && styles.actionButtonActive]}
                                                >
                                                    <Ionicons name="checkmark" size={18} color={test.status === 'working' ? '#fff' : '#4CAF50'} />
                                                </TouchableOpacity>
                                                <TouchableOpacity
                                                    onPress={() => handleBrokenPress(test.id)}
                                                    style={[styles.actionButton, styles.actionButtonDanger, test.status === 'broken' && styles.actionButtonDangerActive]}
                                                >
                                                    <Ionicons name="close" size={18} color={test.status === 'broken' ? '#fff' : '#F44336'} />
                                                </TouchableOpacity>
                                            </View>
                                        </View>
                                    ))}
                                </View>
                            ))}
                            <View style={{ height: 100 }} />
                        </ScrollView>

                        {/* Reset Button */}
                        <TouchableOpacity style={styles.resetButton} onPress={resetAllTests}>
                            <Ionicons name="refresh" size={18} color="#666" />
                            <Text style={styles.resetButtonText}>Réinitialiser les tests</Text>
                        </TouchableOpacity>
                    </>
                )}

                {/* Comment Modal */}
                <Modal
                    visible={commentModalVisible}
                    transparent
                    animationType="fade"
                    onRequestClose={() => setCommentModalVisible(false)}
                >
                    <KeyboardAvoidingView
                        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                        style={styles.commentModalOverlay}
                    >
                        <View style={styles.commentModalContent}>
                            <Text style={styles.commentModalTitle}>❌ Signaler un problème</Text>
                            <Text style={styles.commentModalSubtitle}>
                                Décrivez le bug ou le problème rencontré :
                            </Text>
                            <TextInput
                                style={styles.commentInput}
                                placeholder="Ex: L'écran reste blanc, le bouton ne répond pas..."
                                placeholderTextColor="#999"
                                multiline
                                numberOfLines={4}
                                value={commentText}
                                onChangeText={setCommentText}
                                textAlignVertical="top"
                            />
                            <View style={styles.commentModalActions}>
                                <TouchableOpacity
                                    style={styles.commentCancelButton}
                                    onPress={() => {
                                        setCommentModalVisible(false);
                                        setCommentText('');
                                    }}
                                >
                                    <Text style={styles.commentCancelText}>Annuler</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={styles.commentSubmitButton}
                                    onPress={submitBrokenTest}
                                >
                                    <Text style={styles.commentSubmitText}>Envoyer</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </KeyboardAvoidingView>
                </Modal>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 60,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
    },
    headerSubtitle: {
        fontSize: 14,
        color: '#666',
        marginTop: 4,
    },
    closeButton: {
        padding: 8,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
        color: '#666',
    },
    statsContainer: {
        flexDirection: 'row',
        padding: 16,
        gap: 12,
    },
    statBox: {
        flex: 1,
        padding: 12,
        borderRadius: 12,
        alignItems: 'center',
    },
    statNumber: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    statLabel: {
        fontSize: 12,
        color: '#666',
        marginTop: 4,
    },
    progressContainer: {
        paddingHorizontal: 16,
        marginBottom: 16,
    },
    progressBar: {
        flexDirection: 'row',
        height: 8,
        borderRadius: 4,
        overflow: 'hidden',
        backgroundColor: '#F5F5F5',
    },
    progressFill: {
        height: '100%',
    },
    progressWorking: {
        backgroundColor: '#4CAF50',
    },
    progressBroken: {
        backgroundColor: '#F44336',
    },
    progressPending: {
        backgroundColor: '#E0E0E0',
    },
    progressText: {
        fontSize: 12,
        color: '#666',
        textAlign: 'center',
        marginTop: 8,
    },
    testList: {
        flex: 1,
        paddingHorizontal: 16,
    },
    categorySection: {
        marginBottom: 24,
    },
    categoryTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 12,
        paddingBottom: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    testItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f5f5f5',
    },
    testInfo: {
        flex: 1,
        marginRight: 12,
    },
    testName: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
    },
    testDescription: {
        fontSize: 12,
        color: '#888',
        marginTop: 2,
    },
    commentBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 6,
        backgroundColor: '#FFEBEE',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
        gap: 4,
    },
    commentText: {
        fontSize: 11,
        color: '#F44336',
        flex: 1,
    },
    testActions: {
        flexDirection: 'row',
        gap: 8,
    },
    actionButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        borderWidth: 2,
        borderColor: '#4CAF50',
        alignItems: 'center',
        justifyContent: 'center',
    },
    actionButtonActive: {
        backgroundColor: '#4CAF50',
    },
    actionButtonDanger: {
        borderColor: '#F44336',
    },
    actionButtonDangerActive: {
        backgroundColor: '#F44336',
    },
    resetButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        gap: 8,
        borderTopWidth: 1,
        borderTopColor: '#eee',
    },
    resetButtonText: {
        fontSize: 14,
        color: '#666',
    },
    // Comment Modal Styles
    commentModalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    commentModalContent: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 20,
        width: '100%',
        maxWidth: 400,
    },
    commentModalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 8,
    },
    commentModalSubtitle: {
        fontSize: 14,
        color: '#666',
        marginBottom: 16,
    },
    commentInput: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 12,
        padding: 12,
        fontSize: 14,
        minHeight: 100,
        backgroundColor: '#f9f9f9',
    },
    commentModalActions: {
        flexDirection: 'row',
        marginTop: 16,
        gap: 12,
    },
    commentCancelButton: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#ddd',
        alignItems: 'center',
    },
    commentCancelText: {
        fontSize: 14,
        color: '#666',
        fontWeight: '600',
    },
    commentSubmitButton: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 8,
        backgroundColor: '#F44336',
        alignItems: 'center',
    },
    commentSubmitText: {
        fontSize: 14,
        color: '#fff',
        fontWeight: '600',
    },
});

export default BetaTesterModal;
