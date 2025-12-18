import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { colors } from '../../design-system/colors';
import { space as spacing } from '../../design-system/spacing';
import { typography } from '../../design-system/typography';
import { radius } from '../../design-system/radius';

export const NewTicketScreen: React.FC = () => {
    const navigation = useNavigation();
    const { user } = useAuth();
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        if (!message.trim()) {
            Alert.alert('Erreur', 'Veuillez entrer un message.');
            return;
        }

        setLoading(true);
        try {
            // 1. Create Conversation
            const { data: conversationData, error: conversationError } = await supabase
                .from('support_conversations')
                .insert([{ user_id: user?.id, status: 'OPEN' }])
                .select()
                .single();

            if (conversationError) throw conversationError;

            // 2. Create Initial Message
            const { error: messageError } = await supabase
                .from('support_messages')
                .insert([
                    {
                        conversation_id: conversationData.id,
                        sender_id: user?.id,
                        content: message,
                    },
                ]);

            if (messageError) throw messageError;

            Alert.alert('Succès', 'Votre ticket a été créé.', [
                { text: 'OK', onPress: () => navigation.goBack() },
            ]);
        } catch (error: any) {
            console.error('Error creating ticket:', error);
            Alert.alert('Erreur', 'Impossible de créer le ticket.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.label}>Décrivez votre problème :</Text>
            <TextInput
                style={styles.input}
                multiline
                numberOfLines={6}
                placeholder="Entrez votre message ici..."
                value={message}
                onChangeText={setMessage}
                textAlignVertical="top"
            />
            <TouchableOpacity
                style={[styles.submitButton, loading && styles.disabledButton]}
                onPress={handleSubmit}
                disabled={loading}
            >
                {loading ? (
                    <ActivityIndicator color={colors.white} />
                ) : (
                    <Text style={styles.submitText}>Envoyer</Text>
                )}
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
        padding: spacing.lg,
    },
    label: {
        fontSize: typography.fontSize.base,
        fontWeight: typography.fontWeight.bold,
        marginBottom: spacing.sm,
        color: colors.textPrimary,
    },
    input: {
        backgroundColor: colors.white,
        borderRadius: radius.md,
        padding: spacing.md,
        marginBottom: spacing.lg,
        fontSize: typography.fontSize.base,
        borderWidth: 1,
        borderColor: colors.gray200,
        minHeight: 150,
    },
    submitButton: {
        backgroundColor: colors.black,
        padding: spacing.md,
        borderRadius: radius.md,
        alignItems: 'center',
    },
    disabledButton: {
        opacity: 0.7,
    },
    submitText: {
        color: colors.white,
        fontSize: typography.fontSize.lg,
        fontWeight: typography.fontWeight.bold,
    },
});
