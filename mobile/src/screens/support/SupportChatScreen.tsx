import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { colors } from '../../design-system/colors';
import { space as spacing } from '../../design-system/spacing';
import { typography } from '../../design-system/typography';
import { radius } from '../../design-system/radius';

export const SupportChatScreen: React.FC = () => {
    const route = useRoute<any>();
    const { ticketId } = route.params;
    const { user } = useAuth();
    const [messages, setMessages] = useState<any[]>([]);
    const [inputText, setInputText] = useState('');
    const [sending, setSending] = useState(false);
    const flatListRef = useRef<FlatList>(null);

    useEffect(() => {
        fetchMessages();

        // Realtime subscription
        const channel = supabase
            .channel('support_messages')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'support_messages',
                    filter: `conversation_id=eq.${ticketId}`,
                },
                (payload) => {
                    setMessages((prev) => [...prev, payload.new]);
                    flatListRef.current?.scrollToEnd({ animated: true });
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [ticketId]);

    const fetchMessages = async () => {
        const { data } = await supabase
            .from('support_messages')
            .select('*')
            .eq('conversation_id', ticketId)
            .order('created_at', { ascending: true });

        if (data) setMessages(data);
    };

    const handleSend = async () => {
        if (!inputText.trim()) return;

        setSending(true);
        try {
            const { error } = await supabase
                .from('support_messages')
                .insert([
                    {
                        conversation_id: ticketId,
                        sender_id: user?.id,
                        content: inputText.trim(),
                    },
                ]);

            if (error) throw error;
            setInputText('');
        } catch (error) {
            console.error('Error sending message:', error);
        } finally {
            setSending(false);
        }
    };

    const renderMessage = ({ item }: { item: any }) => {
        const isMe = item.sender_id === user?.id;
        return (
            <View style={[styles.messageBubble, isMe ? styles.myMessage : styles.theirMessage]}>
                <Text style={[styles.messageText, isMe ? styles.myMessageText : styles.theirMessageText]}>
                    {item.content}
                </Text>
                <Text style={[styles.messageTime, isMe ? styles.myMessageTime : styles.theirMessageTime]}>
                    {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <FlatList
                ref={flatListRef}
                data={messages}
                renderItem={renderMessage}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.messagesList}
                onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
            />

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
            >
                <View style={styles.inputContainer}>
                    <TextInput
                        style={styles.input}
                        value={inputText}
                        onChangeText={setInputText}
                        placeholder="Écrivez un message..."
                        multiline
                    />
                    <TouchableOpacity
                        style={[styles.sendButton, !inputText.trim() && styles.disabledSendButton]}
                        onPress={handleSend}
                        disabled={!inputText.trim() || sending}
                    >
                        {sending ? (
                            <ActivityIndicator size="small" color={colors.white} />
                        ) : (
                            <Ionicons name="send" size={20} color={colors.white} />
                        )}
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    messagesList: {
        padding: spacing.md,
    },
    messageBubble: {
        maxWidth: '80%',
        padding: spacing.sm,
        borderRadius: radius.md,
        marginBottom: spacing.sm,
    },
    myMessage: {
        alignSelf: 'flex-end',
        backgroundColor: colors.black,
        borderBottomRightRadius: 0,
    },
    theirMessage: {
        alignSelf: 'flex-start',
        backgroundColor: colors.white,
        borderBottomLeftRadius: 0,
        borderWidth: 1,
        borderColor: colors.gray200,
    },
    messageText: {
        fontSize: typography.fontSize.base,
        marginBottom: 2,
    },
    myMessageText: {
        color: colors.white,
    },
    theirMessageText: {
        color: colors.textPrimary,
    },
    messageTime: {
        fontSize: 10,
        alignSelf: 'flex-end',
    },
    myMessageTime: {
        color: 'rgba(255, 255, 255, 0.7)',
    },
    theirMessageTime: {
        color: colors.gray400,
    },
    inputContainer: {
        flexDirection: 'row',
        padding: spacing.md,
        backgroundColor: colors.white,
        borderTopWidth: 1,
        borderTopColor: colors.gray200,
        alignItems: 'center',
    },
    input: {
        flex: 1,
        backgroundColor: colors.gray50,
        borderRadius: radius.full,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        maxHeight: 100,
        marginRight: spacing.sm,
    },
    sendButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: colors.black,
        alignItems: 'center',
        justifyContent: 'center',
    },
    disabledSendButton: {
        backgroundColor: colors.gray300,
    },
});
