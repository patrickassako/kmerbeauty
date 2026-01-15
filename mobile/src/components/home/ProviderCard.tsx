import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export interface Provider {
    id: string;
    name: string;
    image?: string;
    rating?: number;
    location: string;
    distance?: string;
    services: string[];
    verified?: boolean;
}

interface ProviderCardProps {
    provider: Provider;
    onPress: (provider: Provider) => void;
    onBookPress?: (provider: Provider) => void;
}

export const ProviderCard: React.FC<ProviderCardProps> = ({
    provider,
    onPress,
    onBookPress,
}) => {
    return (
        <TouchableOpacity
            style={styles.card}
            onPress={() => onPress(provider)}
            activeOpacity={0.7}
        >
            <View style={styles.imageContainer}>
                {provider.image ? (
                    <Image source={{ uri: provider.image }} style={styles.image} />
                ) : (
                    <View style={[styles.image, styles.imagePlaceholder]}>
                        <Ionicons name="business" size={32} color="#CCC" />
                    </View>
                )}
                {provider.verified && (
                    <View style={styles.verifiedBadge}>
                        <Ionicons name="checkmark-circle" size={20} color="#FF6B6B" />
                    </View>
                )}
            </View>

            <View style={styles.content}>
                <View style={styles.header}>
                    <Text style={styles.name} numberOfLines={1}>
                        {provider.name}
                    </Text>
                    {provider.rating != null && (
                        <View style={styles.ratingContainer}>
                            <Ionicons name="star" size={12} color="#FFD700" />
                            <Text style={styles.rating}>{provider.rating.toFixed(1)}</Text>
                        </View>
                    )}
                </View>

                <View style={styles.locationRow}>
                    <Ionicons name="location" size={12} color="#9C9C9C" />
                    <Text style={styles.location} numberOfLines={1}>
                        {provider.location}
                        {provider.distance && ` • ${provider.distance}`}
                    </Text>
                </View>

                <View style={styles.footer}>
                    <View style={styles.tags}>
                        {provider.services.slice(0, 2).map((service, index) => (
                            <View key={index} style={styles.tag}>
                                <Text style={styles.tagText} numberOfLines={1}>
                                    {service}
                                </Text>
                            </View>
                        ))}
                    </View>
                    {onBookPress && (
                        <TouchableOpacity
                            style={styles.bookButton}
                            onPress={(e) => {
                                e.stopPropagation();
                                onBookPress(provider);
                            }}
                        >
                            <Text style={styles.bookButtonText}>RÉSERVER</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    card: {
        flexDirection: 'row',
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 12,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
        elevation: 2,
    },
    imageContainer: {
        position: 'relative',
        marginRight: 16,
    },
    image: {
        width: 80,
        height: 80,
        borderRadius: 8,
    },
    imagePlaceholder: {
        backgroundColor: '#F5F5F5',
        justifyContent: 'center',
        alignItems: 'center',
    },
    verifiedBadge: {
        position: 'absolute',
        bottom: -8,
        right: -8,
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    content: {
        flex: 1,
        justifyContent: 'space-between',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 4,
    },
    name: {
        fontSize: 14,
        fontWeight: '700',
        color: '#1A1A1A',
        flex: 1,
        marginRight: 8,
    },
    ratingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F5F5F5',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
        gap: 2,
    },
    rating: {
        fontSize: 12,
        fontWeight: '600',
        color: '#1A1A1A',
    },
    locationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
        gap: 4,
    },
    location: {
        fontSize: 12,
        color: '#9C9C9C',
        flex: 1,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
    },
    tags: {
        flexDirection: 'row',
        gap: 4,
        flex: 1,
        marginRight: 8,
    },
    tag: {
        backgroundColor: '#FFF0F0',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
        maxWidth: 80,
    },
    tagText: {
        fontSize: 10,
        fontWeight: '500',
        color: '#FF6B6B',
    },
    bookButton: {
        backgroundColor: '#FF6B6B',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
        shadowColor: '#FF6B6B',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 2,
    },
    bookButtonText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#FFFFFF',
    },
});
