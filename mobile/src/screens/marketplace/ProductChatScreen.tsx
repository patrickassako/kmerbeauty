import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TextInput,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
    Image,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useResponsive } from '../../hooks/useResponsive';
import { useAuth } from '../../contexts/AuthContext';
import { marketplaceApi } from '../../services/api';
import { Ionicons } from '@expo/vector-icons';

export const ProductChatScreen = () => {
    const { normalizeFontSize, spacing } = useResponsive();
    const { user } = useAuth();
    const navigation = useNavigation<any>();
    const route = useRoute<any>();
    const { productId, sellerId } = route.params;

    const [messages, setMessages] = useState<any[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [product, setProduct] = useState<any>(null);
    const flatListRef = useRef<FlatList>(null);

    useEffect(() => {
        loadProduct();
        loadMessages();
        const interval = setInterval(loadMessages, 5000); // Poll every 5s
        return () => clearInterval(interval);
    }, [productId]);

    const loadProduct = async () => {
        try {
            const data = await marketplaceApi.getProductById(productId);
            setProduct(data);
        } catch (error) {
            console.error('Error loading product:', error);
        }
    };

    const loadMessages = async () => {
        try {
            const data = await marketplaceApi.getConversations(productId);
            setMessages(data.reverse()); // Newest at bottom
        } catch (error) {
            console.error('Error loading messages:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSend = async () => {
        if (!newMessage.trim()) return;

        try {
            setSending(true);
            await marketplaceApi.sendMessage({
                product_id: productId,
                receiver_id: sellerId,
                message: newMessage.trim(),
            });
            setNewMessage('');
            await loadMessages();
            flatListRef.current?.scrollToEnd();
        } catch (error) {
            console.error('Error sending message:', error);
        } finally {
            setSending(false);
        }
    };

    const renderMessage = ({ item }: { item: any }) => {
        const isMe = item.sender_id === user?.id;

        return (
            <View
                style={[
                    styles.messageContainer,
                    isMe ? styles.myMessageContainer : styles.theirMessageContainer,
                ]}
            >
                <View
                    style={[
                        styles.messageBubble,
                        { padding: spacing(1.5) },
                        isMe ? styles.myMessage : styles.theirMessage,
                    ]}
                >
                    <Text
                        style={[
                            styles.messageText,
                            { fontSize: normalizeFontSize(14) },
                            !isMe && { color: '#2D2D2D' },
                        ]}
                    >
                        {item.message}
                    </Text>
                    <Text style={[styles.messageTime, { fontSize: normalizeFontSize(11) }]}>
                        {new Date(item.created_at).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                        })}
                    </Text>
                </View>
            </View>
        );
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
            {/* Header with Product Info */}
            <View style={[styles.header, { paddingTop: spacing(6) }]}>
                <View style={[styles.headerContent, { padding: spacing(2) }]}>
                    <TouchableOpacity onPress={() => navigation.goBack()}>
                        <Ionicons name="arrow-back" size={24} color="#2D2D2D" />
                    </TouchableOpacity>

                    {product && (
                        <View style={styles.productInfo}>
                            {product.images?.[0] && (
                                <Image
                                    source={{ uri: product.images[0] }}
                                    style={styles.productImage}
                                />
                            )}
                            <View style={styles.productTextInfo}>
                                <Text style={[styles.productName, { fontSize: normalizeFontSize(14) }]} numberOfLines={1}>
                                    {product.name}
                                </Text>
                                <Text style={[styles.productPrice, { fontSize: normalizeFontSize(12) }]}>
                                    {product.price?.toLocaleString()} XAF
                                </Text>
                            </View>
                        </View>
                    )}

                    <View style={{ width: 24 }} />
                </View>
            </View>

            {/* Messages */}
            {loading ? (
                <View style={[styles.centered, { flex: 1 }]}>
                    <ActivityIndicator size="large" color="#2D2D2D" />
                </View>
            ) : (
                <FlatList
                    ref={flatListRef}
                    data={messages}
                    renderItem={renderMessage}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={{ padding: spacing(2) }}
                    onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
                />
            )}

            {/* Input */}
            <View style={[styles.inputContainer, { padding: spacing(2) }]}>
                <TextInput
                    style={[styles.input, { fontSize: normalizeFontSize(14), padding: spacing(1.5) }]}
                    placeholder="Votre message..."
                    value={newMessage}
                    onChangeText={setNewMessage}
                    multiline
                    maxLength={500}
                />
                <TouchableOpacity
                    style={[styles.sendButton, { padding: spacing(1.5) }]}
                    onPress={handleSend}
                    disabled={sending || !newMessage.trim()}
                >
                    {sending ? (
                        <ActivityIndicator size="small" color="#FFF" />
                    ) : (
                        <Ionicons name="send" size={20} color="#FFF" />
                    )}
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9F9F9',
    },
    centered: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        backgroundColor: '#FFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    productInfo: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        marginLeft: 12,
    },
    productImage: {
        width: 40,
        height: 40,
        borderRadius: 8,
        backgroundColor: '#E0E0E0',
    },
    productTextInfo: {
        flex: 1,
        marginLeft: 12,
    },
    productName: {
        fontWeight: '600',
        color: '#2D2D2D',
        marginBottom: 2,
    },
    productPrice: {
        color: '#4CAF50',
        fontWeight: '600',
    },
    title: {
        fontWeight: 'bold',
        color: '#2D2D2D',
    },
    messageContainer: {
        marginBottom: 12,
    },
    myMessageContainer: {
        alignItems: 'flex-end',
    },
    theirMessageContainer: {
        alignItems: 'flex-start',
    },
    messageBubble: {
        maxWidth: '75%',
        borderRadius: 16,
    },
    myMessage: {
        backgroundColor: '#2D2D2D',
    },
    theirMessage: {
        backgroundColor: '#FFF',
        borderWidth: 1,
        borderColor: '#E0E0E0',
    },
    messageText: {
        color: '#FFF',
        marginBottom: 4,
    },
    messageTime: {
        color: '#CCC',
        alignSelf: 'flex-end',
    },
    inputContainer: {
        flexDirection: 'row',
        backgroundColor: '#FFF',
        borderTopWidth: 1,
        borderTopColor: '#E0E0E0',
        alignItems: 'flex-end',
    },
    input: {
        flex: 1,
        backgroundColor: '#F5F5F5',
        borderRadius: 20,
        marginRight: 8,
        maxHeight: 100,
    },
    sendButton: {
        backgroundColor: '#2D2D2D',
        borderRadius: 20,
        width: 44,
        height: 44,
        alignItems: 'center',
        justifyContent: 'center',
    },
});
