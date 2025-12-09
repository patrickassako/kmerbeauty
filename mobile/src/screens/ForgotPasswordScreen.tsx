import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StatusBar,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../design-system/colors';
import { space as spacing } from '../design-system/spacing';
import { radius } from '../design-system/radius';
import { typography } from '../design-system/typography';
import { shadows } from '../design-system/shadows';
import { api } from '../services/api';

export const ForgotPasswordScreen: React.FC = () => {
    const navigation = useNavigation<any>();
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = async () => {
        if (!email) {
            Alert.alert('Erreur', 'Veuillez entrer votre email');
            return;
        }

        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            Alert.alert('Erreur', 'Veuillez entrer un email valide');
            return;
        }

        setLoading(true);

        try {
            await api.post('/auth/forgot-password', { email });
            setSubmitted(true);
        } catch (error: any) {
            console.error('Forgot password error:', error);
            Alert.alert(
                'Erreur',
                error.response?.data?.message || 'Impossible d\'envoyer le lien de réinitialisation. Veuillez réessayer.'
            );
        } finally {
            setLoading(false);
        }
    };

    if (submitted) {
        return (
            <View style={styles.container}>
                <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
                <View style={styles.successContent}>
                    <View style={styles.iconContainer}>
                        <Ionicons name="mail-open-outline" size={64} color={colors.primary} />
                    </View>
                    <Text style={styles.successTitle}>Email envoyé !</Text>
                    <Text style={styles.successText}>
                        Si un compte existe avec l'adresse {email}, vous recevrez un lien pour réinitialiser votre mot de passe.
                    </Text>
                    <Text style={styles.successSubText}>
                        Pensez à vérifier vos spams.
                    </Text>

                    <TouchableOpacity
                        style={styles.primaryButton}
                        onPress={() => navigation.navigate('SignIn')}
                    >
                        <Text style={styles.primaryButtonText}>Retour à la connexion</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    style={styles.backButton}
                >
                    <Ionicons name="arrow-back" size={24} color={colors.black} />
                </TouchableOpacity>
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
                    <View style={styles.titleContainer}>
                        <Text style={styles.title}>Mot de passe oublié ?</Text>
                        <Text style={styles.subtitle}>
                            Entrez votre adresse email pour recevoir un lien de réinitialisation.
                        </Text>
                    </View>

                    <View style={styles.form}>
                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>Email</Text>
                            <TextInput
                                style={styles.input}
                                value={email}
                                onChangeText={setEmail}
                                placeholder="exemple@email.com"
                                placeholderTextColor={colors.gray400}
                                keyboardType="email-address"
                                autoCapitalize="none"
                                autoCorrect={false}
                            />
                        </View>

                        <TouchableOpacity
                            style={styles.primaryButton}
                            onPress={handleSubmit}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator color={colors.white} />
                            ) : (
                                <Text style={styles.primaryButtonText}>Envoyer le lien</Text>
                            )}
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.secondaryButton}
                            onPress={() => navigation.goBack()}
                        >
                            <Text style={styles.secondaryButtonText}>Annuler</Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    header: {
        paddingTop: Platform.OS === 'ios' ? 60 : 40,
        paddingHorizontal: spacing.lg,
        paddingBottom: spacing.md,
    },
    backButton: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: radius.full,
        backgroundColor: colors.gray50,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: spacing.lg,
    },
    titleContainer: {
        marginBottom: spacing.xl,
    },
    title: {
        fontSize: typography.fontSize['3xl'],
        fontWeight: typography.fontWeight.bold,
        color: colors.black,
        marginBottom: spacing.sm,
    },
    subtitle: {
        fontSize: typography.fontSize.base,
        color: colors.textSecondary,
        lineHeight: 24,
    },
    form: {
        gap: spacing.lg,
    },
    inputContainer: {
        gap: spacing.xs,
    },
    label: {
        fontSize: typography.fontSize.sm,
        fontWeight: typography.fontWeight.bold,
        color: colors.textSecondary,
        textTransform: 'uppercase',
    },
    input: {
        backgroundColor: colors.white,
        borderWidth: 1,
        borderColor: colors.borderLight,
        borderRadius: radius.lg,
        padding: spacing.md,
        fontSize: typography.fontSize.base,
        color: colors.black,
    },
    primaryButton: {
        backgroundColor: colors.black,
        paddingVertical: spacing.md,
        borderRadius: radius.full,
        alignItems: 'center',
        ...shadows.md,
    },
    primaryButtonText: {
        fontSize: typography.fontSize.md,
        fontWeight: typography.fontWeight.bold,
        color: colors.white,
    },
    secondaryButton: {
        paddingVertical: spacing.md,
        alignItems: 'center',
    },
    secondaryButtonText: {
        fontSize: typography.fontSize.md,
        fontWeight: typography.fontWeight.medium,
        color: colors.textSecondary,
    },
    successContent: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: spacing.xl,
    },
    iconContainer: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: colors.primary + '10', // 10% opacity
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing.xl,
    },
    successTitle: {
        fontSize: typography.fontSize['2xl'],
        fontWeight: typography.fontWeight.bold,
        color: colors.black,
        marginBottom: spacing.md,
        textAlign: 'center',
    },
    successText: {
        fontSize: typography.fontSize.base,
        color: colors.textSecondary,
        textAlign: 'center',
        marginBottom: spacing.sm,
        lineHeight: 24,
    },
    successSubText: {
        fontSize: typography.fontSize.sm,
        color: colors.textTertiary,
        textAlign: 'center',
        marginBottom: spacing.xl,
    },
});
