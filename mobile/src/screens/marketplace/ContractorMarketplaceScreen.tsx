import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useResponsive } from '../../hooks/useResponsive';

export const ContractorMarketplaceScreen = () => {
    const { normalizeFontSize, spacing } = useResponsive();
    const navigation = useNavigation<any>();

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={[styles.header, { padding: spacing(2.5), paddingTop: spacing(6) }]}>
                <Text style={[styles.title, { fontSize: normalizeFontSize(20) }]}>Marketplace</Text>
            </View>

            <ScrollView contentContainerStyle={{ padding: spacing(2.5) }}>
                {/* My Products Section */}
                <TouchableOpacity
                    style={[styles.card, { padding: spacing(3), marginBottom: spacing(2) }]}
                    onPress={() => navigation.navigate('ContractorProducts')}
                >
                    <Text style={[styles.cardIcon, { fontSize: normalizeFontSize(40) }]}>🛍️</Text>
                    <Text style={[styles.cardTitle, { fontSize: normalizeFontSize(18) }]}>
                        Mes Produits
                    </Text>
                    <Text style={[styles.cardDescription, { fontSize: normalizeFontSize(14) }]}>
                        Gérer mes produits en vente
                    </Text>
                </TouchableOpacity>

                {/* My Sales Section */}
                <TouchableOpacity
                    style={[styles.card, { padding: spacing(3), marginBottom: spacing(2) }]}
                    onPress={() => navigation.navigate('ContractorSales')}
                >
                    <Text style={[styles.cardIcon, { fontSize: normalizeFontSize(40) }]}>📦</Text>
                    <Text style={[styles.cardTitle, { fontSize: normalizeFontSize(18) }]}>
                        Mes Ventes
                    </Text>
                    <Text style={[styles.cardDescription, { fontSize: normalizeFontSize(14) }]}>
                        Suivre mes commandes et ventes
                    </Text>
                </TouchableOpacity>

                {/* Messages Section */}
                <TouchableOpacity
                    style={[styles.card, { padding: spacing(3), marginBottom: spacing(2) }]}
                    onPress={() => navigation.navigate('ContractorMessages')}
                >
                    <Text style={[styles.cardIcon, { fontSize: normalizeFontSize(40) }]}>💬</Text>
                    <Text style={[styles.cardTitle, { fontSize: normalizeFontSize(18) }]}>
                        Messages
                    </Text>
                    <Text style={[styles.cardDescription, { fontSize: normalizeFontSize(14) }]}>
                        Discuter avec les clients
                    </Text>
                </TouchableOpacity>

                {/* Browse All Products */}
                <TouchableOpacity
                    style={[styles.card, styles.browseCard, { padding: spacing(3) }]}
                    onPress={() => navigation.navigate('MarketplaceBrowse')}
                >
                    <Text style={[styles.cardIcon, { fontSize: normalizeFontSize(40) }]}>🛒</Text>
                    <Text style={[styles.cardTitle, styles.browseCardText, { fontSize: normalizeFontSize(18) }]}>
                        Parcourir la Marketplace
                    </Text>
                    <Text style={[styles.cardDescription, styles.browseCardText, { fontSize: normalizeFontSize(14) }]}>
                        Voir tous les produits disponibles
                    </Text>
                </TouchableOpacity>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9F9F9',
    },
    header: {
        backgroundColor: '#FFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
    },
    title: {
        fontWeight: 'bold',
        color: '#2D2D2D',
        textAlign: 'center',
    },
    card: {
        backgroundColor: '#FFF',
        borderRadius: 12,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    browseCard: {
        backgroundColor: '#2D2D2D',
    },
    browseCardText: {
        color: '#FFF',
    },
    cardIcon: {
        marginBottom: 12,
    },
    cardTitle: {
        fontWeight: 'bold',
        color: '#2D2D2D',
        marginBottom: 8,
    },
    cardDescription: {
        color: '#666',
        textAlign: 'center',
    },
});
