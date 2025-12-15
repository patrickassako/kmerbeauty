import React, { useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Image,
    Dimensions,
    Linking,
    Platform,
} from 'react-native';
import MapView, { Marker, Region } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { useI18n } from '../i18n/I18nContext';

interface Provider {
    id: string;
    name: string;
    latitude: number;
    longitude: number;
    image?: string | null;
    rating: number;
    review_count: number;
    city: string;
    quarter?: string;
    distance_meters?: number;
    type?: 'salon' | 'therapist';
}

interface SimpleMapProps {
    providers: Provider[];
    userLocation: {
        latitude: number;
        longitude: number;
    } | null;
    onProviderPress: (provider: Provider) => void;
    title?: string;
    mapHeight?: number;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export const SimpleMap: React.FC<SimpleMapProps> = ({
    providers,
    userLocation,
    onProviderPress,
    title,
    mapHeight = 200,
}) => {
    const { language } = useI18n();
    const mapRef = useRef<MapView>(null);
    const [selectedProvider, setSelectedProvider] = React.useState<Provider | null>(null);

    // Initial region centered on user or first provider
    const getInitialRegion = (): Region => {
        if (userLocation) {
            return {
                latitude: userLocation.latitude,
                longitude: userLocation.longitude,
                latitudeDelta: 0.08,
                longitudeDelta: 0.08,
            };
        }
        if (providers.length > 0) {
            return {
                latitude: providers[0].latitude,
                longitude: providers[0].longitude,
                latitudeDelta: 0.08,
                longitudeDelta: 0.08,
            };
        }
        // Default fallback (Douala)
        return {
            latitude: 4.0511,
            longitude: 9.7679,
            latitudeDelta: 0.15,
            longitudeDelta: 0.15,
        };
    };

    const handleMarkerPress = (provider: Provider) => {
        setSelectedProvider(provider);
    };

    const openInMaps = (provider: Provider) => {
        const scheme = Platform.select({ ios: 'maps:0,0?q=', android: 'geo:0,0?q=' });
        const latLng = `${provider.latitude},${provider.longitude}`;
        const label = provider.name;
        const url = Platform.select({
            ios: `${scheme}${label}@${latLng}`,
            android: `${scheme}${latLng}(${label})`
        });

        if (url) {
            Linking.openURL(url);
        }
    };

    // Filter out providers without valid coordinates
    const validProviders = providers.filter(p =>
        p.latitude && p.longitude &&
        !isNaN(p.latitude) && !isNaN(p.longitude) &&
        p.latitude !== 0 && p.longitude !== 0
    );

    if (validProviders.length === 0) {
        return (
            <View style={[styles.container, { height: mapHeight }]}>
                <View style={styles.emptyState}>
                    <Ionicons name="map-outline" size={40} color="#ccc" />
                    <Text style={styles.emptyText}>
                        {language === 'fr' ? 'Aucun prestataire à afficher' : 'No providers to display'}
                    </Text>
                </View>
            </View>
        );
    }

    return (
        <View style={[styles.container, { height: mapHeight }]}>
            {title && (
                <Text style={styles.mapTitle}>{title}</Text>
            )}
            <MapView
                ref={mapRef}
                style={StyleSheet.absoluteFill}
                initialRegion={getInitialRegion()}
                showsUserLocation={true}
                showsMyLocationButton={false}
                showsCompass={false}
                rotateEnabled={false}
                pitchEnabled={false}
            >
                {validProviders.map((provider) => (
                    <Marker
                        key={provider.id}
                        coordinate={{
                            latitude: provider.latitude,
                            longitude: provider.longitude,
                        }}
                        onPress={() => handleMarkerPress(provider)}
                    >
                        <View style={styles.markerContainer}>
                            <View style={[
                                styles.markerCircle,
                                provider.type === 'therapist' ? styles.therapistMarker : styles.salonMarker
                            ]}>
                                {provider.image ? (
                                    <Image
                                        source={{ uri: provider.image }}
                                        style={styles.markerImage}
                                        resizeMode="cover"
                                    />
                                ) : (
                                    <Text style={styles.markerInitial}>
                                        {provider.name.charAt(0).toUpperCase()}
                                    </Text>
                                )}
                            </View>
                            <View style={[
                                styles.markerArrow,
                                provider.type === 'therapist' ? styles.therapistArrow : styles.salonArrow
                            ]} />
                        </View>
                    </Marker>
                ))}
            </MapView>

            {/* Selected Provider Card */}
            {selectedProvider && (
                <View style={styles.providerCard}>
                    <TouchableOpacity
                        style={styles.closeButton}
                        onPress={() => setSelectedProvider(null)}
                    >
                        <Ionicons name="close" size={16} color="#666" />
                    </TouchableOpacity>

                    <View style={styles.providerInfo}>
                        <View style={styles.providerAvatar}>
                            {selectedProvider.image ? (
                                <Image
                                    source={{ uri: selectedProvider.image }}
                                    style={styles.avatarImage}
                                    resizeMode="cover"
                                />
                            ) : (
                                <Text style={styles.avatarInitial}>
                                    {selectedProvider.name.charAt(0)}
                                </Text>
                            )}
                        </View>
                        <View style={styles.providerDetails}>
                            <Text style={styles.providerName} numberOfLines={1}>
                                {selectedProvider.name}
                            </Text>
                            <Text style={styles.providerLocation}>
                                📍 {selectedProvider.city}
                            </Text>
                            <View style={styles.ratingRow}>
                                <Text style={styles.rating}>
                                    ⭐ {selectedProvider.rating || '4.5'}
                                </Text>
                                {selectedProvider.distance_meters && (
                                    <Text style={styles.distance}>
                                        {(selectedProvider.distance_meters / 1000).toFixed(1)} km
                                    </Text>
                                )}
                            </View>
                        </View>
                    </View>

                    <View style={styles.actionButtons}>
                        <TouchableOpacity
                            style={styles.viewButton}
                            onPress={() => {
                                onProviderPress(selectedProvider);
                                setSelectedProvider(null);
                            }}
                        >
                            <Text style={styles.viewButtonText}>
                                {language === 'fr' ? 'Voir' : 'View'}
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.directionsButton}
                            onPress={() => openInMaps(selectedProvider)}
                        >
                            <Ionicons name="navigate" size={14} color="#fff" />
                        </TouchableOpacity>
                    </View>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        borderRadius: 12,
        overflow: 'hidden',
        backgroundColor: '#e5e5e5',
    },
    mapTitle: {
        position: 'absolute',
        top: 8,
        left: 8,
        backgroundColor: 'rgba(255,255,255,0.9)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        fontSize: 12,
        fontWeight: '600',
        color: '#333',
        zIndex: 10,
    },
    emptyState: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyText: {
        marginTop: 8,
        fontSize: 12,
        color: '#999',
    },
    markerContainer: {
        alignItems: 'center',
    },
    markerCircle: {
        width: 36,
        height: 36,
        borderRadius: 18,
        borderWidth: 2,
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
    },
    salonMarker: {
        borderColor: '#FF6B6B',
    },
    therapistMarker: {
        borderColor: '#4A90D9',
    },
    markerImage: {
        width: '100%',
        height: '100%',
    },
    markerInitial: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#333',
    },
    markerArrow: {
        width: 0,
        height: 0,
        backgroundColor: 'transparent',
        borderStyle: 'solid',
        borderLeftWidth: 5,
        borderRightWidth: 5,
        borderBottomWidth: 0,
        borderTopWidth: 6,
        borderLeftColor: 'transparent',
        borderRightColor: 'transparent',
        marginTop: -1,
    },
    salonArrow: {
        borderTopColor: '#FF6B6B',
    },
    therapistArrow: {
        borderTopColor: '#4A90D9',
    },
    providerCard: {
        position: 'absolute',
        bottom: 8,
        left: 8,
        right: 8,
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 12,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
    },
    closeButton: {
        position: 'absolute',
        top: 8,
        right: 8,
        padding: 4,
        zIndex: 1,
    },
    providerInfo: {
        flexDirection: 'row',
        marginBottom: 10,
    },
    providerAvatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#f0f0f0',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
    },
    avatarImage: {
        width: '100%',
        height: '100%',
    },
    avatarInitial: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#666',
    },
    providerDetails: {
        flex: 1,
        marginLeft: 10,
        justifyContent: 'center',
    },
    providerName: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
    },
    providerLocation: {
        fontSize: 11,
        color: '#666',
        marginTop: 2,
    },
    ratingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 2,
    },
    rating: {
        fontSize: 11,
        color: '#333',
    },
    distance: {
        fontSize: 11,
        color: '#666',
        marginLeft: 8,
    },
    actionButtons: {
        flexDirection: 'row',
        gap: 8,
    },
    viewButton: {
        flex: 1,
        backgroundColor: '#2D2D2D',
        paddingVertical: 8,
        borderRadius: 8,
        alignItems: 'center',
    },
    viewButtonText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 12,
    },
    directionsButton: {
        backgroundColor: '#4A90D9',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
});
