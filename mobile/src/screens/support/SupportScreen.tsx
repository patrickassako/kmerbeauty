import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Linking, SafeAreaView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { colors } from '../../design-system/colors';
import { space as spacing } from '../../design-system/spacing';
import { typography } from '../../design-system/typography';
import { radius } from '../../design-system/radius';

export const SupportScreen: React.FC = () => {
    const navigation = useNavigation<any>();
    const { user } = useAuth();
    const [tickets, setTickets] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchTickets();
    }, [user]);

    const fetchTickets = async () => {
        if (!user) return;
        try {
            const { data, error } = await supabase
                .from('support_conversations')
                .select('*')
                .eq('user_id', user.id)
                .order('updated_at', { ascending: false });

            if (error) throw error;
            setTickets(data || []);
        } catch (error) {
            console.error('Error fetching tickets:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCall = () => {
        Linking.openURL('tel:+237681022388');
    };

    const handleEmail = () => {
        Linking.openURL('mailto:suport@kmrbeauty.com');
    };

    const renderTicketItem = ({ item }: { item: any }) => (
        <TouchableOpacity
            style={styles.ticketItem}
            onPress={() => navigation.navigate('SupportChat', { ticketId: item.id })}
        >
            <View style={styles.ticketHeader}>
                <Text style={styles.ticketId}>Ticket #{item.id.slice(0, 8)}</Text>
                <View style={[styles.statusBadge, { backgroundColor: item.status === 'OPEN' ? colors.success + '20' : colors.gray200 }]}>
                    <Text style={[styles.statusText, { color: item.status === 'OPEN' ? colors.success : colors.gray500 }]}>
                        {item.status}
                    </Text>
                </View>
            </View>
            <Text style={styles.ticketDate}>
                {new Date(item.created_at).toLocaleDateString()}
            </Text>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container}>
            {/* Contact Info Section */}
            <View style={styles.contactSection}>
                <Text style={styles.sectionTitle}>Contactez-nous</Text>
                <TouchableOpacity style={styles.contactRow} onPress={handleEmail}>
                    <Ionicons name="mail-outline" size={24} color={colors.black} />
                    <Text style={styles.contactText}>suport@kmrbeauty.com</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.contactRow} onPress={handleCall}>
                    <Ionicons name="call-outline" size={24} color={colors.black} />
                    <Text style={styles.contactText}>+237 681 02 23 88</Text>
                </TouchableOpacity>
            </View>

            {/* Tickets Section */}
            <View style={styles.ticketsSection}>
                <View style={styles.ticketsHeader}>
                    <Text style={styles.sectionTitle}>Mes Tickets</Text>
                    <TouchableOpacity
                        style={styles.newTicketButton}
                        onPress={() => navigation.navigate('NewTicket')}
                    >
                        <Ionicons name="add" size={20} color={colors.white} />
                        <Text style={styles.newTicketText}>Nouveau</Text>
                    </TouchableOpacity>
                </View>

                {loading ? (
                    <ActivityIndicator size="large" color={colors.black} />
                ) : tickets.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>Aucun ticket de support.</Text>
                    </View>
                ) : (
                    <FlatList
                        data={tickets}
                        renderItem={renderTicketItem}
                        keyExtractor={(item) => item.id}
                        contentContainerStyle={styles.ticketsList}
                    />
                )}
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
        padding: spacing.lg,
    },
    contactSection: {
        backgroundColor: colors.white,
        padding: spacing.md,
        borderRadius: radius.md,
        marginBottom: spacing.lg,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    sectionTitle: {
        fontSize: typography.fontSize.lg,
        fontWeight: typography.fontWeight.bold,
        marginBottom: spacing.md,
        color: colors.textPrimary,
    },
    contactRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.sm,
    },
    contactText: {
        marginLeft: spacing.md,
        fontSize: typography.fontSize.base,
        color: colors.textPrimary,
    },
    ticketsSection: {
        flex: 1,
    },
    ticketsHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.md,
    },
    newTicketButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.black,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.xs,
        borderRadius: radius.full,
    },
    newTicketText: {
        color: colors.white,
        marginLeft: spacing.xs,
        fontWeight: typography.fontWeight.medium,
    },
    ticketsList: {
        paddingBottom: spacing.lg,
    },
    ticketItem: {
        backgroundColor: colors.white,
        padding: spacing.md,
        borderRadius: radius.md,
        marginBottom: spacing.md,
        elevation: 1,
    },
    ticketHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.xs,
    },
    ticketId: {
        fontWeight: typography.fontWeight.bold,
        color: colors.textPrimary,
    },
    statusBadge: {
        paddingHorizontal: spacing.xs,
        paddingVertical: 2,
        borderRadius: radius.sm,
    },
    statusText: {
        fontSize: typography.fontSize.xs,
        fontWeight: typography.fontWeight.bold,
    },
    ticketDate: {
        color: colors.gray500,
        fontSize: typography.fontSize.sm,
    },
    emptyContainer: {
        alignItems: 'center',
        padding: spacing.xl,
    },
    emptyText: {
        color: colors.gray400,
    },
});
