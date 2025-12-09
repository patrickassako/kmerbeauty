import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    StatusBar,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import * as Linking from 'expo-linking';
import { supabase } from '../lib/supabase';
import { colors } from '../design-system/colors';
import { space as spacing } from '../design-system/spacing';
import { radius } from '../design-system/radius';
import { typography } from '../design-system/typography';

export const ResetPasswordScreen: React.FC = () => {
    const navigation = useNavigation<any>();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [isSessionValid, setIsSessionValid] = useState(false);
    const [checkingSession, setCheckingSession] = useState(true);

    useEffect(() => {
        handleDeepLink();
    }, []);

    const handleDeepLink = async () => {
        try {
            const initialUrl = await Linking.getInitialURL();
            if (initialUrl) {
                processUrl(initialUrl);
            }
        } catch (error) {
            console.error('Error getting initial URL:', error);
            setCheckingSession(false);
        }
    };

    const processUrl = async (url: string) => {
        console.log('🔗 Processing Deep Link:', url);

        // Extract tokens from the URL fragment (hash)
        // Format: kmerservices://reset-password#access_token=...&refresh_token=...&type=recovery
        if (url.includes('access_token') && url.includes('refresh_token')) {
            const params = getQueryParams(url.split('#')[1] || '');
            const accessToken = params.access_token;
            const refreshToken = params.refresh_token;

            if (accessToken && refreshToken) {
                const { error } = await supabase.auth.setSession({
                    access_token: accessToken,
                    refresh_token: refreshToken,
                });

                if (error) {
                    Alert.alert('Erreur', 'Le lien a expiré ou est invalide.');
                    setCheckingSession(false);
                } else {
                    setIsSessionValid(true);
                    setCheckingSession(false);
                }
            } else {
                setCheckingSession(false);
            }
        } else {
            setCheckingSession(false);
        }
    };

    const getQueryParams = (queryString: string) => {
        const params: { [key: string]: string } = {};
        const pairs = queryString.split('&');
        for (const pair of pairs) {
            const [key, value] = pair.split('=');
            if (key) {
                params[key] = decodeURIComponent(value || '');
            }
        }
        return params;
    };

    const handleUpdatePassword = async () => {
        if (password !== confirmPassword) {
            Alert.alert('Erreur', 'Les mots de passe ne correspondent pas');
            return;
        }

        if (password.length < 6) {
            Alert.alert('Erreur', 'Le mot de passe doit contenir au moins 6 caractères');
            return;
        }

        setLoading(true);

        try {
            const { error } = await supabase.auth.updateUser({
                password: password,
            });

            if (error) throw error;

            Alert.alert(
                'Succès',
                'Votre mot de passe a été mis à jour avec succès.',
                [
                    {
                        text: 'Se connecter',
                        onPress: () => navigation.navigate('SignIn'),
                    },
                ]
            );
        } catch (error: any) {
            Alert.alert('Erreur', error.message);
        } finally {
            setLoading(false);
        }
    };

    if (checkingSession) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={styles.loadingText}>Vérification du lien...</Text>
            </View>
        );
    }

    if (!isSessionValid) {
        return (
            <View style={styles.container}>
                <View style={styles.content}>
                    <Text style={styles.title}>Lien invalide</Text>
                    <Text style={styles.text}>
                        Le lien de réinitialisation est invalide ou a expiré. Veuillez faire une nouvelle demande.
                    </Text>
                    <TouchableOpacity
                        style={styles.button}
                        onPress={() => navigation.navigate('ForgotPassword')}
                    >
                        <Text style={styles.buttonText}>Nouvelle demande</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" />
            <View style={styles.content}>
                <Text style={styles.title}>Nouveau mot de passe</Text>
                <Text style={styles.subtitle}>
                    Entrez votre nouveau mot de passe sécurisé.
                </Text>

                <View style={styles.form}>
                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>Nouveau mot de passe</Text>
                        <TextInput
                            style={styles.input}
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry
                            placeholder="******"
                        />
                    </View>

                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>Confirmer le mot de passe</Text>
                        <TextInput
                            style={styles.input}
                            value={confirmPassword}
                            onChangeText={setConfirmPassword}
                            secureTextEntry
                            placeholder="******"
                        />
                    </View>

                    <TouchableOpacity
                        style={styles.button}
                        onPress={handleUpdatePassword}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color={colors.white} />
                        ) : (
                            <Text style={styles.buttonText}>Mettre à jour</Text>
                        )}
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
        padding: spacing.lg,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: colors.background,
    },
    loadingText: {
        marginTop: spacing.md,
        color: colors.textSecondary,
    },
    content: {
        flex: 1,
        justifyContent: 'center',
    },
    title: {
        fontSize: typography.fontSize['2xl'],
        fontWeight: typography.fontWeight.bold,
        color: colors.black,
        marginBottom: spacing.sm,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: typography.fontSize.base,
        color: colors.textSecondary,
        textAlign: 'center',
        marginBottom: spacing.xl,
    },
    text: {
        fontSize: typography.fontSize.base,
        color: colors.textSecondary,
        textAlign: 'center',
        marginBottom: spacing.xl,
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
    button: {
        backgroundColor: colors.black,
        paddingVertical: spacing.md,
        borderRadius: radius.full,
        alignItems: 'center',
        marginTop: spacing.md,
    },
    buttonText: {
        color: colors.white,
        fontWeight: typography.fontWeight.bold,
        fontSize: typography.fontSize.md,
    },
});
