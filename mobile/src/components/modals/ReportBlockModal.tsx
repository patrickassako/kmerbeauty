import React, { useState } from 'react';
import {
    View,
    Text,
    Modal,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    TextInput,
    Alert,
    ActivityIndicator,
    Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useResponsive } from '../../hooks/useResponsive';
import {
    createReport,
    blockUser,
    reportReasons,
    ReportReason,
    ContextType
} from '../../services/reportApi';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface ReportBlockModalProps {
    visible: boolean;
    onClose: () => void;
    targetUserId: string;
    targetUserName: string;
    contextType?: ContextType;
    contextId?: string;
    onReportSuccess?: () => void;
    onBlockSuccess?: () => void;
}

export const ReportBlockModal: React.FC<ReportBlockModalProps> = ({
    visible,
    onClose,
    targetUserId,
    targetUserName,
    contextType,
    contextId,
    onReportSuccess,
    onBlockSuccess,
}) => {
    const { normalizeFontSize, spacing } = useResponsive();
    const [mode, setMode] = useState<'menu' | 'report' | 'block'>('menu');
    const [selectedReason, setSelectedReason] = useState<ReportReason | null>(null);
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(false);

    const resetState = () => {
        setMode('menu');
        setSelectedReason(null);
        setDescription('');
        setLoading(false);
    };

    const handleClose = () => {
        resetState();
        onClose();
    };

    const handleReport = async () => {
        if (!selectedReason) {
            Alert.alert('Erreur', 'Veuillez sélectionner une raison');
            return;
        }

        setLoading(true);
        try {
            await createReport({
                reported_id: targetUserId,
                reason: selectedReason,
                description: description.trim() || undefined,
                context_type: contextType,
                context_id: contextId,
            });

            Alert.alert(
                'Signalement envoyé',
                'Merci pour votre signalement. Notre équipe va examiner ce cas.',
                [{ text: 'OK', onPress: handleClose }]
            );
            onReportSuccess?.();
        } catch (error: any) {
            const message = error.response?.data?.message || 'Erreur lors du signalement';
            Alert.alert('Erreur', message);
        } finally {
            setLoading(false);
        }
    };

    const handleBlock = async () => {
        Alert.alert(
            'Bloquer cet utilisateur ?',
            `Vous ne pourrez plus recevoir de messages de ${targetUserName} et cette personne ne pourra plus vous contacter.`,
            [
                { text: 'Annuler', style: 'cancel' },
                {
                    text: 'Bloquer',
                    style: 'destructive',
                    onPress: async () => {
                        setLoading(true);
                        try {
                            await blockUser(targetUserId, selectedReason || undefined);
                            Alert.alert(
                                'Utilisateur bloqué',
                                `${targetUserName} a été bloqué avec succès.`,
                                [{ text: 'OK', onPress: handleClose }]
                            );
                            onBlockSuccess?.();
                        } catch (error: any) {
                            const message = error.response?.data?.message || 'Erreur lors du blocage';
                            Alert.alert('Erreur', message);
                        } finally {
                            setLoading(false);
                        }
                    },
                },
            ]
        );
    };

    const renderMenu = () => (
        <View style={styles.menuContainer}>
            <Text style={[styles.title, { fontSize: normalizeFontSize(18) }]}>
                Actions pour {targetUserName}
            </Text>

            <TouchableOpacity
                style={[styles.menuItem, { paddingVertical: spacing(2) }]}
                onPress={() => setMode('report')}
            >
                <View style={[styles.menuIcon, { backgroundColor: '#FFF3E6' }]}>
                    <Ionicons name="flag" size={24} color="#F57C00" />
                </View>
                <View style={styles.menuTextContainer}>
                    <Text style={[styles.menuTitle, { fontSize: normalizeFontSize(16) }]}>
                        Signaler
                    </Text>
                    <Text style={[styles.menuSubtitle, { fontSize: normalizeFontSize(13) }]}>
                        Signaler un comportement inapproprié
                    </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#999" />
            </TouchableOpacity>

            <TouchableOpacity
                style={[styles.menuItem, { paddingVertical: spacing(2) }]}
                onPress={() => setMode('block')}
            >
                <View style={[styles.menuIcon, { backgroundColor: '#FFEBEE' }]}>
                    <Ionicons name="ban" size={24} color="#D32F2F" />
                </View>
                <View style={styles.menuTextContainer}>
                    <Text style={[styles.menuTitle, { fontSize: normalizeFontSize(16) }]}>
                        Bloquer
                    </Text>
                    <Text style={[styles.menuSubtitle, { fontSize: normalizeFontSize(13) }]}>
                        Empêcher tout contact futur
                    </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#999" />
            </TouchableOpacity>
        </View>
    );

    const renderReportForm = () => (
        <ScrollView style={styles.formContainer} showsVerticalScrollIndicator={false}>
            <TouchableOpacity
                style={styles.backButton}
                onPress={() => setMode('menu')}
            >
                <Ionicons name="arrow-back" size={24} color="#333" />
                <Text style={[styles.backText, { fontSize: normalizeFontSize(16) }]}>
                    Retour
                </Text>
            </TouchableOpacity>

            <Text style={[styles.title, { fontSize: normalizeFontSize(18) }]}>
                Signaler {targetUserName}
            </Text>
            <Text style={[styles.subtitle, { fontSize: normalizeFontSize(14) }]}>
                Sélectionnez la raison du signalement
            </Text>

            <View style={[styles.reasonsContainer, { marginTop: spacing(2) }]}>
                {reportReasons.map((reason) => (
                    <TouchableOpacity
                        key={reason.value}
                        style={[
                            styles.reasonItem,
                            selectedReason === reason.value && styles.reasonItemSelected,
                            { paddingVertical: spacing(1.5) }
                        ]}
                        onPress={() => setSelectedReason(reason.value)}
                    >
                        <Text style={styles.reasonEmoji}>{reason.emoji}</Text>
                        <Text style={[
                            styles.reasonLabel,
                            { fontSize: normalizeFontSize(15) },
                            selectedReason === reason.value && styles.reasonLabelSelected
                        ]}>
                            {reason.label}
                        </Text>
                        <View style={[
                            styles.radioOuter,
                            selectedReason === reason.value && styles.radioOuterSelected
                        ]}>
                            {selectedReason === reason.value && (
                                <View style={styles.radioInner} />
                            )}
                        </View>
                    </TouchableOpacity>
                ))}
            </View>

            <Text style={[styles.inputLabel, { fontSize: normalizeFontSize(14), marginTop: spacing(2) }]}>
                Description (optionnel)
            </Text>
            <TextInput
                style={[styles.textInput, { fontSize: normalizeFontSize(14) }]}
                placeholder="Décrivez le problème..."
                placeholderTextColor="#999"
                multiline
                numberOfLines={4}
                value={description}
                onChangeText={setDescription}
                textAlignVertical="top"
            />

            <TouchableOpacity
                style={[
                    styles.submitButton,
                    { marginTop: spacing(3), backgroundColor: '#F57C00' },
                    !selectedReason && styles.submitButtonDisabled
                ]}
                onPress={handleReport}
                disabled={!selectedReason || loading}
            >
                {loading ? (
                    <ActivityIndicator color="#FFF" />
                ) : (
                    <>
                        <Ionicons name="flag" size={20} color="#FFF" />
                        <Text style={[styles.submitButtonText, { fontSize: normalizeFontSize(16) }]}>
                            Envoyer le signalement
                        </Text>
                    </>
                )}
            </TouchableOpacity>
        </ScrollView>
    );

    const renderBlockConfirm = () => (
        <View style={styles.formContainer}>
            <TouchableOpacity
                style={styles.backButton}
                onPress={() => setMode('menu')}
            >
                <Ionicons name="arrow-back" size={24} color="#333" />
                <Text style={[styles.backText, { fontSize: normalizeFontSize(16) }]}>
                    Retour
                </Text>
            </TouchableOpacity>

            <View style={styles.blockIconContainer}>
                <Ionicons name="ban" size={60} color="#D32F2F" />
            </View>

            <Text style={[styles.title, { fontSize: normalizeFontSize(18), textAlign: 'center' }]}>
                Bloquer {targetUserName} ?
            </Text>
            <Text style={[styles.blockDescription, { fontSize: normalizeFontSize(14) }]}>
                Une fois bloqué(e), cette personne ne pourra plus :
            </Text>

            <View style={[styles.blockEffects, { marginTop: spacing(2) }]}>
                <View style={styles.blockEffectItem}>
                    <Ionicons name="close-circle" size={20} color="#D32F2F" />
                    <Text style={[styles.blockEffectText, { fontSize: normalizeFontSize(14) }]}>
                        Vous envoyer des messages
                    </Text>
                </View>
                <View style={styles.blockEffectItem}>
                    <Ionicons name="close-circle" size={20} color="#D32F2F" />
                    <Text style={[styles.blockEffectText, { fontSize: normalizeFontSize(14) }]}>
                        Faire de nouvelles réservations avec vous
                    </Text>
                </View>
                <View style={styles.blockEffectItem}>
                    <Ionicons name="close-circle" size={20} color="#D32F2F" />
                    <Text style={[styles.blockEffectText, { fontSize: normalizeFontSize(14) }]}>
                        Voir vos informations de profil
                    </Text>
                </View>
            </View>

            <View style={[styles.buttonRow, { marginTop: spacing(3) }]}>
                <TouchableOpacity
                    style={[styles.cancelButton, { flex: 1, marginRight: spacing(1) }]}
                    onPress={() => setMode('menu')}
                >
                    <Text style={[styles.cancelButtonText, { fontSize: normalizeFontSize(15) }]}>
                        Annuler
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.blockButton, { flex: 1, marginLeft: spacing(1) }]}
                    onPress={handleBlock}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="#FFF" />
                    ) : (
                        <Text style={[styles.blockButtonText, { fontSize: normalizeFontSize(15) }]}>
                            Bloquer
                        </Text>
                    )}
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent
            onRequestClose={handleClose}
        >
            <TouchableOpacity
                style={styles.overlay}
                activeOpacity={1}
                onPress={handleClose}
            >
                <TouchableOpacity
                    style={[styles.container, { maxWidth: SCREEN_WIDTH - 40 }]}
                    activeOpacity={1}
                >
                    <View style={styles.handle} />

                    <TouchableOpacity
                        style={styles.closeButton}
                        onPress={handleClose}
                    >
                        <Ionicons name="close" size={24} color="#666" />
                    </TouchableOpacity>

                    {mode === 'menu' && renderMenu()}
                    {mode === 'report' && renderReportForm()}
                    {mode === 'block' && renderBlockConfirm()}
                </TouchableOpacity>
            </TouchableOpacity>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    container: {
        backgroundColor: '#FFF',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 20,
        paddingBottom: 40,
        maxHeight: '85%',
    },
    handle: {
        width: 40,
        height: 4,
        backgroundColor: '#DDD',
        borderRadius: 2,
        alignSelf: 'center',
        marginBottom: 15,
    },
    closeButton: {
        position: 'absolute',
        top: 15,
        right: 15,
        zIndex: 10,
    },
    menuContainer: {
        marginTop: 10,
    },
    title: {
        fontWeight: '700',
        color: '#1E3A5F',
        marginBottom: 15,
    },
    subtitle: {
        color: '#666',
        marginBottom: 10,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    menuIcon: {
        width: 48,
        height: 48,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    menuTextContainer: {
        flex: 1,
    },
    menuTitle: {
        fontWeight: '600',
        color: '#333',
    },
    menuSubtitle: {
        color: '#888',
        marginTop: 2,
    },
    formContainer: {
        marginTop: 10,
    },
    backButton: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
    },
    backText: {
        marginLeft: 8,
        color: '#333',
        fontWeight: '500',
    },
    reasonsContainer: {
        gap: 8,
    },
    reasonItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 15,
        backgroundColor: '#F8F8F8',
        borderRadius: 12,
        borderWidth: 2,
        borderColor: 'transparent',
    },
    reasonItemSelected: {
        backgroundColor: '#FFF8E6',
        borderColor: '#F57C00',
    },
    reasonEmoji: {
        fontSize: 20,
        marginRight: 12,
    },
    reasonLabel: {
        flex: 1,
        color: '#333',
        fontWeight: '500',
    },
    reasonLabelSelected: {
        color: '#F57C00',
    },
    radioOuter: {
        width: 22,
        height: 22,
        borderRadius: 11,
        borderWidth: 2,
        borderColor: '#DDD',
        justifyContent: 'center',
        alignItems: 'center',
    },
    radioOuterSelected: {
        borderColor: '#F57C00',
    },
    radioInner: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: '#F57C00',
    },
    inputLabel: {
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
    },
    textInput: {
        borderWidth: 1,
        borderColor: '#E0E0E0',
        borderRadius: 12,
        padding: 15,
        minHeight: 100,
        backgroundColor: '#F8F8F8',
    },
    submitButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        borderRadius: 12,
        gap: 8,
    },
    submitButtonDisabled: {
        opacity: 0.5,
    },
    submitButtonText: {
        color: '#FFF',
        fontWeight: '600',
    },
    blockIconContainer: {
        alignItems: 'center',
        marginVertical: 20,
    },
    blockDescription: {
        color: '#666',
        textAlign: 'center',
        marginTop: 10,
    },
    blockEffects: {
        backgroundColor: '#FFF5F5',
        borderRadius: 12,
        padding: 15,
        gap: 12,
    },
    blockEffectItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    blockEffectText: {
        color: '#333',
        flex: 1,
    },
    buttonRow: {
        flexDirection: 'row',
    },
    cancelButton: {
        paddingVertical: 14,
        borderRadius: 12,
        backgroundColor: '#F0F0F0',
        alignItems: 'center',
    },
    cancelButtonText: {
        color: '#666',
        fontWeight: '600',
    },
    blockButton: {
        paddingVertical: 14,
        borderRadius: 12,
        backgroundColor: '#D32F2F',
        alignItems: 'center',
    },
    blockButtonText: {
        color: '#FFF',
        fontWeight: '600',
    },
});

export default ReportBlockModal;
