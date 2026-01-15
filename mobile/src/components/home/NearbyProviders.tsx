import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ProviderCard, type Provider } from './ProviderCard';

interface NearbyProvidersProps {
    providers: Provider[];
    onProviderPress: (provider: Provider) => void;
    onBookPress?: (provider: Provider) => void;
    onSeeAllPress?: () => void;
    title?: string;
    loading?: boolean;
}

export const NearbyProviders: React.FC<NearbyProvidersProps> = ({
    providers,
    onProviderPress,
    onBookPress,
    onSeeAllPress,
    title = 'Prestataires à proximité',
    loading = false,
}) => {
    if (providers.length === 0) return null;

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>{title}</Text>
                {onSeeAllPress && (
                    <TouchableOpacity onPress={onSeeAllPress}>
                        <Text style={styles.seeAll}>Voir tout</Text>
                    </TouchableOpacity>
                )}
            </View>

            <View style={styles.list}>
                {providers.slice(0, 5).map((provider) => (
                    <ProviderCard
                        key={provider.id}
                        provider={provider}
                        onPress={onProviderPress}
                        onBookPress={onBookPress}
                    />
                ))}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: 24,
        marginBottom: 24,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    title: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1A1A1A',
    },
    seeAll: {
        fontSize: 14,
        fontWeight: '500',
        color: '#FF6B6B',
    },
    list: {
        gap: 0,
    },
});
