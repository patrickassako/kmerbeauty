import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
    Alert,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    StatusBar,
    Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../design-system/colors';
import { space as spacing } from '../../design-system/spacing';
import { radius } from '../../design-system/radius';
import { typography } from '../../design-system/typography';
import { shadows } from '../../design-system/shadows';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

interface BecomeProviderScreenProps {
    navigation: any;
}

const BecomeProviderScreen: React.FC<BecomeProviderScreenProps> = ({ navigation }) => {
    const { user, refreshUser } = useAuth();
    const [loading, setLoading] = useState(false);

    const [businessName, setBusinessName] = useState('');
    const [bio, setBio] = useState('');
    const [experience, setExperience] = useState('');
    const [isMobile, setIsMobile] = useState(true);
    const [city, setCity] = useState(user?.city || '');
    const [region, setRegion] = useState(user?.region || '');

    const handleSubmit = async () => {
        if (!businessName || !bio || !experience || !city) {
            Alert.alert('Erreur', 'Veuillez remplir tous les champs obligatoires');
            return;
        }

        setLoading(true);

        try {
            const { error } = await supabase.from('therapists').insert({
                user_id: user?.id,
                business_name: businessName,
                bio: bio,
                experience: parseInt(experience) || 0,
                is_mobile: isMobile,
                city: city,
                region: region,
                is_active: false, // Pending validation
                profile_completed: true,
                latitude: 0, // Placeholder
                longitude: 0, // Placeholder
                location: `POINT(0 0)`, // Placeholder
            });

            if (error) throw error;

            Alert.alert(
                'Demande envoyée',
                'Votre demande pour devenir prestataire a été envoyée avec succès. Elle sera examinée par notre équipe.',
                [
                    {
                        text: 'OK',
                        onPress: () => {
                            refreshUser(); // Refresh to get the therapist record
                            navigation.goBack();
                        },
                    },
                ]
            );
        } catch (error: any) {
            console.error('Error submitting application:', error);
            Alert.alert('Erreur', 'Impossible d\'envoyer la demande: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    style={styles.headerButton}
                >
                    <Ionicons name="arrow-back" size={24} color={colors.black} />
                </TouchableOpacity>

                <Text style={styles.headerTitle}>Devenir Prestataire</Text>

                <View style={{ width: 40 }} />
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                style={{ flex: 1 }}
            >
                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    <View style={styles.introCard}>
                        <Ionicons name="briefcase-outline" size={32} color={colors.black} />
                        <Text style={styles.introTitle}>Rejoignez notre réseau</Text>
                        <Text style={styles.introText}>
                            Offrez vos services à des milliers de clients. Remplissez ce formulaire pour soumettre votre candidature.
                        </Text>
                    </View>

                    {/* Business Info */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Informations Professionnelles</Text>
                        <View style={styles.card}>
                            <View style={styles.formGroup}>
                                <Text style={styles.label}>Nom de l'activité / Business</Text>
                                <TextInput
                                    style={styles.input}
                                    value={businessName}
                                    onChangeText={setBusinessName}
                                    placeholder="Ex: Salon Beauté Plus"
                                    placeholderTextColor={colors.gray400}
                                />
                            </View>
                            <View style={styles.divider} />
                            <View style={styles.formGroup}>
                                <Text style={styles.label}>Années d'expérience</Text>
                                <TextInput
                                    style={styles.input}
                                    value={experience}
                                    onChangeText={setExperience}
                                    placeholder="Ex: 5"
                                    keyboardType="numeric"
                                    placeholderTextColor={colors.gray400}
                                />
                            </View>
                            <View style={styles.divider} />
                            <View style={styles.formGroup}>
                                <Text style={styles.label}>Bio / Description</Text>
                                <TextInput
                                    style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
                                    value={bio}
                                    onChangeText={setBio}
                                    placeholder="Décrivez vos services et votre expertise..."
                                    placeholderTextColor={colors.gray400}
                                    multiline
                                    numberOfLines={4}
                                />
                            </View>
                        </View>
                    </View>

                    {/* Location & Mobility */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Localisation & Mobilité</Text>
                        <View style={styles.card}>
                            <View style={styles.formGroup}>
                                <Text style={styles.label}>Ville</Text>
                                <TextInput
                                    style={styles.input}
                                    value={city}
                                    onChangeText={setCity}
                                    placeholder="Votre ville"
                                    placeholderTextColor={colors.gray400}
                                />
                            </View>
                            <View style={styles.divider} />
                            <View style={styles.formGroup}>
                                <Text style={styles.label}>Région</Text>
                                <TextInput
                                    style={styles.input}
                                    value={region}
                                    onChangeText={setRegion}
                                    placeholder="Votre région"
                                    placeholderTextColor={colors.gray400}
                                />
                            </View>
                            <View style={styles.divider} />
                            <View style={[styles.formGroup, styles.switchRow]}>
                                <View>
                                    <Text style={styles.label}>Service à domicile</Text>
                                    <Text style={styles.helperText}>Acceptez-vous de vous déplacer ?</Text>
                                </View>
                                <Switch
                                    value={isMobile}
                                    onValueChange={setIsMobile}
                                    trackColor={{ false: colors.gray200, true: colors.black }}
                                    thumbColor={colors.white}
                                />
                            </View>
                        </View>
                    </View>

                    <TouchableOpacity
                        style={styles.submitButton}
                        onPress={handleSubmit}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color={colors.white} />
                        ) : (
                            <Text style={styles.submitButtonText}>Envoyer la demande</Text>
                        )}
                    </TouchableOpacity>

                    <View style={{ height: 40 }} />
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.backgroundSecondary,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: Platform.OS === 'ios' ? 60 : 40,
        paddingBottom: spacing.md,
        paddingHorizontal: spacing.lg,
        backgroundColor: colors.white,
        borderBottomWidth: 1,
        borderBottomColor: colors.borderLight,
    },
    headerButton: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: radius.full,
        backgroundColor: colors.gray50,
    },
    headerTitle: {
        fontSize: typography.fontSize.lg,
        fontWeight: typography.fontWeight.bold,
        color: colors.black,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: spacing.lg,
    },
    introCard: {
        backgroundColor: colors.white,
        padding: spacing.lg,
        borderRadius: radius.lg,
        alignItems: 'center',
        marginBottom: spacing.xl,
        ...shadows.sm,
    },
    introTitle: {
        fontSize: typography.fontSize.lg,
        fontWeight: typography.fontWeight.bold,
        color: colors.black,
        marginTop: spacing.md,
        marginBottom: spacing.xs,
    },
    introText: {
        fontSize: typography.fontSize.sm,
        color: colors.textSecondary,
        textAlign: 'center',
        lineHeight: 20,
    },
    section: {
        marginBottom: spacing.xl,
    },
    sectionTitle: {
        fontSize: typography.fontSize.sm,
        fontWeight: typography.fontWeight.bold,
        color: colors.textSecondary,
        marginBottom: spacing.sm,
        marginLeft: spacing.xs,
        textTransform: 'uppercase',
    },
    card: {
        backgroundColor: colors.white,
        borderRadius: radius.lg,
        overflow: 'hidden',
        ...shadows.sm,
    },
    formGroup: {
        padding: spacing.md,
    },
    label: {
        fontSize: typography.fontSize.xs,
        fontWeight: typography.fontWeight.bold,
        color: colors.textTertiary,
        marginBottom: spacing.xs,
        textTransform: 'uppercase',
    },
    input: {
        fontSize: typography.fontSize.base,
        color: colors.black,
        paddingVertical: spacing.xs,
    },
    divider: {
        height: 1,
        backgroundColor: colors.borderLight,
        marginLeft: spacing.md,
    },
    helperText: {
        fontSize: typography.fontSize.xs,
        color: colors.textTertiary,
        marginTop: 2,
    },
    switchRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    submitButton: {
        backgroundColor: colors.black,
        paddingVertical: spacing.md,
        borderRadius: radius.full,
        alignItems: 'center',
        marginTop: spacing.sm,
        ...shadows.md,
    },
    submitButtonText: {
        fontSize: typography.fontSize.base,
        fontWeight: typography.fontWeight.bold,
        color: colors.white,
    },
});

export default BecomeProviderScreen;
