import React, { useRef, useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Image,
    Dimensions,
    Linking,
    Platform,
    Animated,
} from 'react-native';
import MapView, { Marker, Region, PROVIDER_GOOGLE } from 'react-native-maps';
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
    service_areas?: {
        name: string;
        latitude: number;
        longitude: number;
    }[];
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
    liteMode?: boolean;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export const SimpleMap: React.FC<SimpleMapProps> = ({
    providers,
    userLocation,
    onProviderPress,
    title,
    mapHeight = 200,
    liteMode = true,
}) => {
    const { language } = useI18n();
    const mapRef = useRef<MapView>(null);
    const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);
    const slideAnim = useRef(new Animated.Value(100)).current;

    // Initial region centered on user or first provider
    const getInitialRegion = (): Region => {
        if (userLocation) {
            return {
                latitude: userLocation.latitude,
                longitude: userLocation.longitude,
                latitudeDelta: 0.06,
                longitudeDelta: 0.06,
            };
        }
        if (providers.length > 0) {
            return {
                latitude: providers[0].latitude,
                longitude: providers[0].longitude,
                latitudeDelta: 0.06,
                longitudeDelta: 0.06,
            };
        }
        // Default fallback (Douala)
        return {
            latitude: 4.0511,
            longitude: 9.7679,
            latitudeDelta: 0.12,
            longitudeDelta: 0.12,
        };
    };

    const showCard = useCallback(() => {
        Animated.spring(slideAnim, {
            toValue: 0,
            useNativeDriver: true,
            friction: 8,
        }).start();
    }, [slideAnim]);

    const hideCard = useCallback(() => {
        Animated.timing(slideAnim, {
            toValue: 100,
            duration: 200,
            useNativeDriver: true,
        }).start();
    }, [slideAnim]);

    const handleMarkerPress = (provider: Provider) => {
        if (selectedProvider?.id === provider.id) {
            // Deselect if same provider
            setSelectedProvider(null);
            hideCard();
        } else {
            setSelectedProvider(provider);
            showCard();
            // Animate map to center on provider
            mapRef.current?.animateToRegion({
                latitude: provider.latitude,
                longitude: provider.longitude,
                latitudeDelta: 0.03,
                longitudeDelta: 0.03,
            }, 300);
        }
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

    // Create all markers including service areas
    const allMarkers: { provider: Provider; lat: number; lng: number; isServiceArea: boolean; areaName?: string }[] = [];

    validProviders.forEach(provider => {
        // Main location
        allMarkers.push({
            provider,
            lat: provider.latitude,
            lng: provider.longitude,
            isServiceArea: false,
        });

        // Service areas (if any)
        if (provider.service_areas && provider.service_areas.length > 0) {
            provider.service_areas.forEach(area => {
                if (area.latitude && area.longitude) {
                    allMarkers.push({
                        provider,
                        lat: area.latitude,
                        lng: area.longitude,
                        isServiceArea: true,
                        areaName: area.name,
                    });
                }
            });
        }
    });

    return (
        <View style={[styles.container, { height: mapHeight }]}>
            {title && (
                <View style={styles.titleContainer}>
                    <Text style={styles.mapTitle}>{title}</Text>
                </View>
            )}

            <MapView
                ref={mapRef}
                provider={PROVIDER_GOOGLE}
                style={StyleSheet.absoluteFill}
                initialRegion={getInitialRegion()}
                showsUserLocation={true}
                showsMyLocationButton={false}
                showsCompass={false}
                rotateEnabled={false}
                pitchEnabled={false}
                liteMode={liteMode}
                toolbarEnabled={false}
                onPress={() => {
                    setSelectedProvider(null);
                    hideCard();
                }}
            >
                {allMarkers.map((marker, index) => {
                    const isSelected = selectedProvider?.id === marker.provider.id;
                    const isSalon = marker.provider.type === 'salon';

                    return (
                        <Marker
                            key={`${marker.provider.id}-${index}`}
                            coordinate={{
                                latitude: marker.lat,
                                longitude: marker.lng,
                            }}
                            onPress={() => handleMarkerPress(marker.provider)}
                            tracksViewChanges={false}
                        >
                            <View style={styles.markerContainer}>
                                <View style={[
                                    styles.markerCircle,
                                    isSalon ? styles.salonMarker : styles.therapistMarker,
                                    marker.isServiceArea && styles.serviceAreaMarker,
                                    isSelected && styles.selectedMarker,
                                ]}>
                                    {marker.provider.image ? (
                                        <Image
                                            source={{ uri: marker.provider.image }}
                                            style={styles.markerImage}
                                            resizeMode="cover"
                                        />
                                    ) : (
                                        <Text style={styles.markerInitial}>
                                            {marker.provider.name.charAt(0).toUpperCase()}
                                        </Text>
                                    )}
                                </View>
                                <View style={[
                                    styles.markerArrow,
                                    isSalon ? styles.salonArrow : styles.therapistArrow,
                                    marker.isServiceArea && styles.serviceAreaArrow,
                                ]} />
                                {marker.isServiceArea && (
                                    <View style={styles.serviceAreaBadge}>
                                        <Ionicons name="location" size={8} color="#fff" />
                                    </View>
                                )}
                            </View>
                        </Marker>
                    );
                })}
            </MapView>

            {/* Selected Provider Card - Like client-web popup */}
            {selectedProvider && (
                <Animated.View
                    style={[
                        styles.providerCard,
                        { transform: [{ translateY: slideAnim }] }
                    ]}
                >
                    <TouchableOpacity
                        style={styles.closeButton}
                        onPress={() => {
                            setSelectedProvider(null);
                            hideCard();
                        }}
                    >
                        <Ionicons name="close" size={18} color="#666" />
                    </TouchableOpacity>

                    {/* Large Preview Image */}
                    <View style={styles.cardImageContainer}>
                        {selectedProvider.image ? (
                            <Image
                                source={{ uri: selectedProvider.image }}
                                style={styles.cardImage}
                                resizeMode="cover"
                            />
                        ) : (
                            <View style={styles.cardImagePlaceholder}>
                                <Ionicons
                                    name={selectedProvider.type === 'salon' ? 'business' : 'person'}
                                    size={40}
                                    color="#ccc"
                                />
                            </View>
                        )}

                        {/* Rating Badge */}
                        <View style={styles.ratingBadge}>
                            <Ionicons name="star" size={12} color="#FFB800" />
                            <Text style={styles.ratingBadgeText}>
                                {selectedProvider.rating?.toFixed(1) || '4.8'}
                            </Text>
                        </View>

                        {/* Type Badge */}
                        <View style={[
                            styles.typeBadge,
                            selectedProvider.type === 'therapist' ? styles.therapistBadge : styles.salonBadge
                        ]}>
                            <Text style={styles.typeBadgeText}>
                                {selectedProvider.type === 'therapist'
                                    ? (language === 'fr' ? 'Indépendant' : 'Freelance')
                                    : 'Institut'
                                }
                            </Text>
                        </View>
                    </View>

                    {/* Provider Info */}
                    <View style={styles.cardContent}>
                        <Text style={styles.providerName} numberOfLines={1}>
                            {selectedProvider.name}
                        </Text>

                        <View style={styles.locationRow}>
                            <Ionicons name="location" size={14} color="#666" />
                            <Text style={styles.providerLocation} numberOfLines={1}>
                                {selectedProvider.quarter
                                    ? `${selectedProvider.quarter}, ${selectedProvider.city}`
                                    : selectedProvider.city || 'Cameroun'
                                }
                            </Text>
                            {selectedProvider.distance_meters && selectedProvider.distance_meters < 999999 && (
                                <Text style={styles.distanceText}>
                                    ({(selectedProvider.distance_meters / 1000).toFixed(1)} km)
                                </Text>
                            )}
                        </View>

                        {/* Action Buttons */}
                        <View style={styles.actionButtons}>
                            <TouchableOpacity
                                style={styles.viewButton}
                                onPress={() => {
                                    onProviderPress(selectedProvider);
                                    setSelectedProvider(null);
                                    hideCard();
                                }}
                            >
                                <Text style={styles.viewButtonText}>
                                    {language === 'fr' ? 'Voir détails' : 'View Details'}
                                </Text>
                                <Ionicons name="arrow-forward" size={14} color="#fff" />
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.directionsButton}
                                onPress={() => openInMaps(selectedProvider)}
                            >
                                <Ionicons name="navigate" size={16} color="#fff" />
                            </TouchableOpacity>
                        </View>
                    </View>
                </Animated.View>
            )}

            {/* Provider Count Badge */}
            <View style={styles.countBadge}>
                <Ionicons name="people" size={12} color="#666" />
                <Text style={styles.countText}>
                    {validProviders.length}
                </Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        borderRadius: 16,
        overflow: 'hidden',
        backgroundColor: '#e5e5e5',
        marginBottom: 12,
    },
    titleContainer: {
        position: 'absolute',
        top: 10,
        left: 10,
        zIndex: 10,
    },
    mapTitle: {
        backgroundColor: 'rgba(255,255,255,0.95)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        fontSize: 13,
        fontWeight: '600',
        color: '#333',
        overflow: 'hidden',
    },
    emptyState: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyText: {
        marginTop: 8,
        fontSize: 13,
        color: '#999',
    },
    markerContainer: {
        alignItems: 'center',
    },
    markerCircle: {
        width: 44,
        height: 44,
        borderRadius: 22,
        borderWidth: 3,
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
    },
    salonMarker: {
        borderColor: '#FF6B6B',
    },
    therapistMarker: {
        borderColor: '#4A90D9',
    },
    serviceAreaMarker: {
        width: 36,
        height: 36,
        borderRadius: 18,
        opacity: 0.9,
    },
    selectedMarker: {
        borderWidth: 4,
        transform: [{ scale: 1.15 }],
    },
    markerImage: {
        width: '100%',
        height: '100%',
    },
    markerInitial: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
    },
    markerArrow: {
        width: 0,
        height: 0,
        backgroundColor: 'transparent',
        borderStyle: 'solid',
        borderLeftWidth: 6,
        borderRightWidth: 6,
        borderBottomWidth: 0,
        borderTopWidth: 8,
        borderLeftColor: 'transparent',
        borderRightColor: 'transparent',
        marginTop: -2,
    },
    salonArrow: {
        borderTopColor: '#FF6B6B',
    },
    therapistArrow: {
        borderTopColor: '#4A90D9',
    },
    serviceAreaArrow: {
        borderTopWidth: 6,
        borderLeftWidth: 4,
        borderRightWidth: 4,
    },
    serviceAreaBadge: {
        position: 'absolute',
        bottom: 8,
        right: -4,
        backgroundColor: '#3b82f6',
        borderRadius: 6,
        padding: 2,
    },
    providerCard: {
        position: 'absolute',
        bottom: 10,
        left: 10,
        right: 10,
        backgroundColor: '#fff',
        borderRadius: 16,
        elevation: 6,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
        overflow: 'hidden',
    },
    closeButton: {
        position: 'absolute',
        top: 8,
        right: 8,
        backgroundColor: 'rgba(255,255,255,0.9)',
        borderRadius: 12,
        padding: 4,
        zIndex: 10,
    },
    cardImageContainer: {
        height: 100,
        backgroundColor: '#f0f0f0',
    },
    cardImage: {
        width: '100%',
        height: '100%',
    },
    cardImagePlaceholder: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f5f5f5',
    },
    ratingBadge: {
        position: 'absolute',
        top: 8,
        right: 8,
        backgroundColor: 'rgba(255,255,255,0.95)',
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        gap: 4,
    },
    ratingBadgeText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#333',
    },
    typeBadge: {
        position: 'absolute',
        bottom: 8,
        left: 8,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 10,
    },
    salonBadge: {
        backgroundColor: 'rgba(255, 107, 107, 0.9)',
    },
    therapistBadge: {
        backgroundColor: 'rgba(74, 144, 217, 0.9)',
    },
    typeBadgeText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#fff',
    },
    cardContent: {
        padding: 12,
    },
    providerName: {
        fontSize: 16,
        fontWeight: '700',
        color: '#2D2D2D',
        marginBottom: 6,
    },
    locationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        gap: 4,
    },
    providerLocation: {
        flex: 1,
        fontSize: 12,
        color: '#666',
    },
    distanceText: {
        fontSize: 11,
        color: '#999',
    },
    actionButtons: {
        flexDirection: 'row',
        gap: 10,
    },
    viewButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#2D2D2D',
        paddingVertical: 10,
        borderRadius: 10,
        gap: 6,
    },
    viewButtonText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 13,
    },
    directionsButton: {
        backgroundColor: '#4A90D9',
        paddingVertical: 10,
        paddingHorizontal: 14,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    countBadge: {
        position: 'absolute',
        top: 10,
        right: 10,
        backgroundColor: 'rgba(255,255,255,0.95)',
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 15,
        gap: 4,
    },
    countText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#666',
    },
});
