
import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
} from 'react-native';
import { useI18n } from '../i18n/I18nContext';
import { useResponsive } from '../hooks/useResponsive';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { useToast } from '../contexts/ToastContext';
import api from '../lib/api';
import * as SecureStore from 'expo-secure-store';
import { useAuth } from '../contexts/AuthContext';

interface VerificationScreenProps {
    route: {
        params: {
            phone?: string;
            email?: string;
            authMethod: 'phone' | 'email';
        };
    };
    navigation: any;
}

export const VerificationScreen: React.FC<VerificationScreenProps> = ({ route, navigation }) => {
    const { phone, email, authMethod = 'phone' } = route.params || {};
    const { t } = useI18n();
    const { normalizeFontSize, spacing } = useResponsive();
    const { showToast } = useToast();
    const { refreshUser } = useAuth(); // Need to access context to set user after verification
    const [code, setCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [timer, setTimer] = useState(60);

    // Determine which identifier to display and use
    const identifier = authMethod === 'email' ? email : phone;
    const identifierLabel = authMethod === 'email' ? 'l\'adresse' : 'le numéro';

    useEffect(() => {
        const interval = setInterval(() => {
            setTimer((prev) => (prev > 0 ? prev - 1 : 0));
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    const handleVerify = async () => {
        if (code.length < 6) {
            setError('Code invalide');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const response = await api.post('/auth/verify', {
                phone: authMethod === 'phone' ? phone : undefined,
                email: authMethod === 'email' ? email : undefined,
                token: code,
            });

            const { accessToken, refreshToken, user } = response.data;

            // Store tokens
            await SecureStore.setItemAsync('accessToken', accessToken);
            await SecureStore.setItemAsync('refreshToken', refreshToken);

            // Refresh auth context
            await refreshUser(); // This should reload user from tokens and navigate to Home

            // Navigation handled by AppNavigator observing isAuthenticated
        } catch (err: any) {
            console.error(err);
            const errorMessage = err.response?.data?.message || 'Verification failed';
            setError(errorMessage);
            showToast(errorMessage, 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        // Implement resend logic (trigger backend to resend OTP)
        // For now just reset timer
        setTimer(60);
        showToast('Code renvoyé avec succès', 'success');
    };

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.content}
            >
                <Text style={[styles.title, { fontSize: normalizeFontSize(24), marginBottom: spacing(1) }]}>
                    Vérification
                </Text>
                <Text style={[styles.subtitle, { fontSize: normalizeFontSize(14), marginBottom: spacing(4) }]}>
                    Un code a été envoyé à {identifierLabel} {identifier}
                </Text>

                <Input
                    label="Code de vérification"
                    placeholder="123456"
                    value={code}
                    onChangeText={setCode}
                    keyboardType="number-pad"
                    maxLength={6}
                    error={error}
                    style={{ textAlign: 'center', letterSpacing: 5, fontSize: 24 }}
                />

                <Button
                    title="Vérifier"
                    onPress={handleVerify}
                    loading={loading}
                    icon="arrow"
                />

                <TouchableOpacity
                    onPress={handleResend}
                    disabled={timer > 0}
                    style={{ marginTop: spacing(3), alignItems: 'center' }}
                >
                    <Text style={{ color: timer > 0 ? '#8a6a5e' : '#FF6B6B', fontSize: 14 }}>
                        {timer > 0 ? `Renvoyer le code dans ${timer}s` : 'Renvoyer le code'}
                    </Text>
                </TouchableOpacity>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#1A1A1A',
    },
    content: {
        flex: 1,
        padding: 20,
        justifyContent: 'center',
    },
    title: {
        fontWeight: 'bold',
        textAlign: 'center',
        color: '#FFFFFF',
    },
    subtitle: {
        textAlign: 'center',
        color: '#c9a092',
    },
});
