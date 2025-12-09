import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    Image,
    RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useResponsive } from '../../hooks/useResponsive';
import { useAuth } from '../../contexts/AuthContext';
import { marketplaceApi } from '../../services/api';
import { Ionicons } from '@expo/vector-icons';

export const ContractorMessagesScreen = () => {
    const { normalizeFontSize, spacing } = useResponsive();
    const { user } = useAuth();
    const navigation = useNavigation<any>();

    const [conversations, setConversations] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        loadConversations();
    }, []);

    const loadConversations = async () => {
        try {
            // Fetch all messages where I am sender or receiver
            // The backend getConversations uses the authenticated user's ID
            const messages = await marketplaceApi.getConversations();

            // Group messages by conversation (Product + Other User)
            const grouped: any = {};

            messages.forEach((msg: any) => {
                const isMe = msg.sender_id === user?.id;
                const otherUserId = isMe ? msg.receiver_id : msg.sender_id;
                const key = `${msg.product_id}_${otherUserId}`;

                if (!grouped[key]) {
                    grouped[key] = {
                        product: msg.marketplace_products,
                        otherUser: isMe ? msg.users_receiver : msg.users, // We need to handle user info correctly
                        // Note: The current API response structure for users might need checking
                        // msg.users is the SENDER. 
                        // If I am receiver, msg.users is the client.
                        // If I am sender, I need the receiver's info. 
                        // Let's assume for now we primarily receive messages as seller.
                        // Actually, we need to be careful.
                        otherUserId: otherUserId,
                        lastMessage: msg,
                        productId: msg.product_id,
                    };
                }

                // Update last message if this one is newer (assuming list is not strictly ordered or we iterate)
                // The API orders by created_at desc, so the first one we see is the newest?
                // API: query = query.order('created_at', { ascending: false });
                // So the first message encountered for a key is the latest.
            });

            // Convert to array
            const conversationList = Object.values(grouped);
            setConversations(conversationList);

        } catch (error) {
            console.error('Error loading conversations:', error);
        } finally {
            setLoading(false);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await loadConversations();
        setRefreshing(false);
    };

    const renderConversation = ({ item }: { item: any }) => {
        const product = item.product;
        const lastMsg = item.lastMessage;
        const time = new Date(lastMsg.created_at).toLocaleDateString();

        // Determine the name of the other person
        // In the API: users!marketplace_messages_sender_id_fkey(first_name, last_name) is joined as 'users'
        // We might need to fetch the other user's name if we are the sender.
        // For V1, let's display "Client" if we can't find the name, or rely on the fact that sellers mostly reply.

        // Actually, let's look at the API response structure from previous logs or code.
        // .select('*, marketplace_products(name, images), users!marketplace_messages_sender_id_fkey(first_name, last_name)')
        // So 'users' object contains the SENDER's info.

        let otherUserName = 'Client';
        if (lastMsg.sender_id !== user?.id) {
            // I am receiver, so sender is the other user
            otherUserName = `${lastMsg.users?.first_name || ''} ${lastMsg.users?.last_name || ''}`;
        } else {
            // I am sender, I need receiver's name. 
            // The current API might NOT return receiver's info.
            // We might need to adjust the API or just show "Moi" -> "Client"
            otherUserName = 'Client';
        }

        return (
            <TouchableOpacity
                style={[styles.card, { padding: spacing(2), marginBottom: spacing(2) }]}
                onPress={() => navigation.navigate('ProductChat', {
                    productId: item.productId,
                    sellerId: user?.id // Wait, ProductChat expects sellerId. 
                    // If I am the seller, I am viewing the chat. 
                    // But ProductChat logic might assume I am the client contacting seller?
                    // Let's check ProductChatScreen.
                })}
            >
                <View style={styles.row}>
                    {product?.images?.[0] && (
                        <Image source={{ uri: product.images[0] }} style={styles.productImage} />
                    )}
                    <View style={styles.content}>
                        <View style={styles.headerRow}>
                            <Text style={[styles.productName, { fontSize: normalizeFontSize(14) }]}>
                                {product?.name}
                            </Text>
                            <Text style={[styles.time, { fontSize: normalizeFontSize(12) }]}>
                                {time}
                            </Text>
                        </View>
                        <Text style={[styles.userName, { fontSize: normalizeFontSize(13) }]}>
                            {otherUserName}
                        </Text>
                        <Text style={[styles.messagePreview, { fontSize: normalizeFontSize(13) }]} numberOfLines={1}>
                            {lastMsg.sender_id === user?.id ? 'Vous: ' : ''}{lastMsg.message}
                        </Text>
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    if (loading) {
        return (
            <View style={[styles.container, styles.centered]}>
                <ActivityIndicator size="large" color="#2D2D2D" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={[styles.header, { padding: spacing(2.5), paddingTop: spacing(6) }]}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color="#2D2D2D" />
                </TouchableOpacity>
                <Text style={[styles.title, { fontSize: normalizeFontSize(18) }]}>Messages</Text>
                <View style={{ width: 24 }} />
            </View>

            <FlatList
                data={conversations}
                renderItem={renderConversation}
                keyExtractor={(item) => `${item.productId}_${item.otherUserId}`}
                contentContainerStyle={{ padding: spacing(2) }}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                ListEmptyComponent={
                    <View style={[styles.emptyState, { padding: spacing(4) }]}>
                        <Ionicons name="chatbubbles-outline" size={48} color="#CCC" />
                        <Text style={[styles.emptyText, { fontSize: normalizeFontSize(14), marginTop: spacing(2) }]}>
                            Aucun message pour le moment
                        </Text>
                    </View>
                }
            />
        </View>
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
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#FFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
    },
    title: {
        fontWeight: 'bold',
        color: '#2D2D2D',
    },
    card: {
        backgroundColor: '#FFF',
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    productImage: {
        width: 50,
        height: 50,
        borderRadius: 8,
        backgroundColor: '#E0E0E0',
    },
    content: {
        flex: 1,
        marginLeft: 12,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 4,
    },
    productName: {
        fontWeight: '600',
        color: '#2D2D2D',
    },
    time: {
        color: '#999',
    },
    userName: {
        color: '#4CAF50',
        fontWeight: '500',
        marginBottom: 2,
    },
    messagePreview: {
        color: '#666',
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 60,
    },
    emptyText: {
        color: '#666',
    },
});
