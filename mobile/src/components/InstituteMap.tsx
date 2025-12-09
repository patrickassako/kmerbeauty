import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Image,
    Modal,
    Dimensions,
    Linking,
    Platform,
    TextInput,
    ActivityIndicator,
    ScrollView,
    Keyboard,
    TouchableWithoutFeedback,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE, Region } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { useResponsive } from '../hooks/useResponsive';
import { useI18n } from '../i18n/I18nContext';

interface Salon {
    id: string;
    name_fr?: string;
    name_en?: string;
    name?: string; // Fallback for NearbyProvider
    latitude: number;
    longitude: number;
    logo?: string | null;
    cover_image?: string | null;
    image?: string | null; // Fallback for NearbyProvider
    rating: number;
    review_count: number;
    city: string;
    quarter?: string; // Optional
    distance_meters?: number;
}

interface InstituteMapProps {
    salons: Salon[];
    userLocation: {
        latitude: number;
        longitude: number;
    } | null;
    onSalonPress: (salon: Salon) => void;
    onLocationSelect?: (lat: number, lon: number, city: string, district: string) => void;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export const InstituteMap: React.FC<InstituteMapProps> = ({
    salons,
    userLocation,
    onSalonPress,
    onLocationSelect,
}) => {
    const { spacing, normalizeFontSize } = useResponsive();
    const { language } = useI18n();
    const mapRef = useRef<MapView>(null);

    const [isFullScreen, setIsFullScreen] = useState(false);
    const [selectedSalon, setSelectedSalon] = useState<Salon | null>(null);

    // Search State
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [suggestions, setSuggestions] = useState<any[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);

    const searchAddress = async (text: string) => {
        setSearchQuery(text);
        if (text.length < 3) {
            setSuggestions([]);
            setShowSuggestions(false);
            return;
        }

        setIsSearching(true);
        try {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(text)}&countrycodes=cm&addressdetails=1&limit=5`,
                {
                    headers: {
                        'User-Agent': 'KmerServices/1.0'
                    }
                }
            );
            const data = await response.json();
            setSuggestions(data);
            setShowSuggestions(true);
        } catch (error) {
            console.error('Error searching address:', error);
        } finally {
            setIsSearching(false);
        }
    };

    const selectAddress = (item: any) => {
        const lat = parseFloat(item.lat);
        const lon = parseFloat(item.lon);
        const city = item.address?.city || item.address?.town || item.address?.village || item.address?.state || '';
        const district = item.address?.suburb || item.address?.neighbourhood || item.address?.quarter || '';

        setSearchQuery(item.display_name);
        setSuggestions([]);
        setShowSuggestions(false);
        Keyboard.dismiss();

        // Update map region
        if (mapRef.current) {
            mapRef.current.animateToRegion({
                latitude: lat,
                longitude: lon,
                latitudeDelta: 0.02,
                longitudeDelta: 0.02,
            }, 1000);
        }

        // Notify parent
        if (onLocationSelect) {
            onLocationSelect(lat, lon, city, district);
        }
    };

    // Initial region centered on user or first salon
    const getInitialRegion = (): Region => {
        if (userLocation) {
            return {
                latitude: userLocation.latitude,
                longitude: userLocation.longitude,
                latitudeDelta: 0.05,
                longitudeDelta: 0.05,
            };
        }
        if (salons.length > 0) {
            return {
                latitude: salons[0].latitude,
                longitude: salons[0].longitude,
                latitudeDelta: 0.05,
                longitudeDelta: 0.05,
            };
        }
        // Default fallback (Douala)
        return {
            latitude: 4.0511,
            longitude: 9.7679,
            latitudeDelta: 0.1,
            longitudeDelta: 0.1,
        };
    };

    const handleMarkerPress = (salon: Salon) => {
        setSelectedSalon(salon);
    };

    const closeSalonModal = () => {
        setSelectedSalon(null);
    };

    const toggleFullScreen = () => {
        setIsFullScreen(!isFullScreen);
    };

    const openItinerary = (salon: Salon) => {
        const scheme = Platform.select({ ios: 'maps:0,0?q=', android: 'geo:0,0?q=' });
        const latLng = `${salon.latitude},${salon.longitude}`;
        const label = language === 'fr' ? salon.name_fr : salon.name_en;
        const url = Platform.select({
            ios: `${scheme}${label}@${latLng}`,
            android: `${scheme}${latLng}(${label})`
        });

        if (url) {
            Linking.openURL(url);
        }
    };

    const getTravelTime = (distanceMeters: number | undefined) => {
        if (!distanceMeters) return 'N/A';
        // Rough estimate: 30km/h average speed in city -> 500m/min
        const minutes = Math.round(distanceMeters / 500);
        return `${minutes} min`;
    };

    const renderMapContent = () => (
        <View style={{ flex: 1 }}>
            <MapView
                ref={mapRef}
                provider={PROVIDER_GOOGLE}
                style={StyleSheet.absoluteFill}
                initialRegion={getInitialRegion()}
                showsUserLocation={true}
                showsMyLocationButton={true}
            >
                {salons.map((salon) => (
                    <Marker
                        key={salon.id}
                        coordinate={{
                            latitude: salon.latitude,
                            longitude: salon.longitude,
                        }}
                        onPress={() => handleMarkerPress(salon)}
                    >
                        <View style={styles.markerContainer}>
                            <View style={styles.markerImageContainer}>
                                {salon.logo || salon.cover_image ? (
                                    <Image
                                        source={{ uri: salon.logo || salon.cover_image || '' }}
                                        style={styles.markerImage}
                                        resizeMode="cover"
                                    />
                                ) : (
                                    <View style={[styles.markerImage, { backgroundColor: '#2D2D2D', alignItems: 'center', justifyContent: 'center' }]}>
                                        <Text style={{ color: '#fff', fontSize: 10, fontWeight: 'bold' }}>
                                            {(language === 'fr' ? salon.name_fr : salon.name_en).charAt(0)}
                                        </Text>
                                    </View>
                                )}
                            </View>
                            <View style={styles.markerArrow} />
                        </View>
                    </Marker>
                ))}
            </MapView>

            {/* Search Bar Overlay */}
            <View style={[styles.searchContainer, { top: spacing(2), left: spacing(2), right: spacing(8) }]}>
                <View style={styles.searchInputContainer}>
                    <Ionicons name="search" size={20} color="#666" style={{ marginRight: 8 }} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder={language === 'fr' ? "Rechercher une zone..." : "Search area..."}
                        value={searchQuery}
                        onChangeText={searchAddress}
                        returnKeyType="search"
                        onFocus={() => setShowSuggestions(true)}
                    />
                    {isSearching && <ActivityIndicator size="small" color="#000" />}
                    {searchQuery.length > 0 && (
                        <TouchableOpacity onPress={() => {
                            setSearchQuery('');
                            setSuggestions([]);
                            setShowSuggestions(false);
                        }}>
                            <Ionicons name="close-circle" size={18} color="#999" />
                        </TouchableOpacity>
                    )}
                </View>

                {/* Suggestions List */}
                {showSuggestions && suggestions.length > 0 && (
                    <View style={styles.suggestionsContainer}>
                        <ScrollView keyboardShouldPersistTaps="handled" style={{ maxHeight: 200 }}>
                            {suggestions.map((item, index) => (
                                <TouchableOpacity
                                    key={index}
                                    style={styles.suggestionItem}
                                    onPress={() => selectAddress(item)}
                                >
                                    <Text style={styles.suggestionText} numberOfLines={2}>
                                        {item.display_name}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                )}
            </View>

            {/* Full Screen Toggle */}
            <TouchableOpacity
                style={[styles.fullScreenButton, { top: spacing(6), right: spacing(2) }]}
                onPress={toggleFullScreen}
            >
                <Ionicons
                    name={isFullScreen ? "contract" : "expand"}
                    size={24}
                    color="#000"
                />
            </TouchableOpacity>

            {/* Quick Info Modal (Absolute positioned) */}
            {selectedSalon && (
                <View style={[styles.salonCard, { bottom: spacing(4), left: spacing(2), right: spacing(2) }]}>
                    <View style={{ flexDirection: 'row', marginBottom: spacing(1.5) }}>
                        <View style={[styles.salonImage, { width: spacing(8), height: spacing(8), borderRadius: spacing(1) }]}>
                            {selectedSalon.logo || selectedSalon.cover_image ? (
                                <Image
                                    source={{ uri: selectedSalon.logo || selectedSalon.cover_image || '' }}
                                    style={{ width: '100%', height: '100%' }}
                                    resizeMode="cover"
                                />
                            ) : (
                                <View style={{ flex: 1, backgroundColor: '#eee' }} />
                            )}
                        </View>
                        <View style={{ flex: 1, marginLeft: spacing(1.5), justifyContent: 'center' }}>
                            <Text style={{ fontSize: normalizeFontSize(16), fontWeight: 'bold', color: '#2D2D2D' }} numberOfLines={1}>
                                {language === 'fr' ? selectedSalon.name_fr : selectedSalon.name_en}
                            </Text>
                            <Text style={{ fontSize: normalizeFontSize(12), color: '#666', marginTop: 2 }}>
                                📍 {selectedSalon.city}, {selectedSalon.quarter}
                            </Text>
                            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                                <Text style={{ fontSize: normalizeFontSize(12), fontWeight: '600', color: '#2D2D2D' }}>
                                    ⭐ {selectedSalon.rating} ({selectedSalon.review_count})
                                </Text>
                                <Text style={{ fontSize: normalizeFontSize(12), color: '#666', marginLeft: 8 }}>
                                    🚗 ~{getTravelTime(selectedSalon.distance_meters)}
                                </Text>
                            </View>
                        </View>
                        <TouchableOpacity onPress={closeSalonModal} style={{ padding: 4 }}>
                            <Ionicons name="close" size={20} color="#999" />
                        </TouchableOpacity>
                    </View>

                    <View style={{ flexDirection: 'row', gap: spacing(1.5) }}>
                        <TouchableOpacity
                            style={[styles.actionButton, { backgroundColor: '#2D2D2D', flex: 1 }]}
                            onPress={() => onSalonPress(selectedSalon)}
                        >
                            <Text style={{ color: '#fff', fontWeight: '600', fontSize: normalizeFontSize(12) }}>
                                Voir la fiche
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.actionButton, { backgroundColor: '#FF6B6B', flex: 1 }]}
                            onPress={() => openItinerary(selectedSalon)}
                        >
                            <Ionicons name="navigate" size={16} color="#fff" style={{ marginRight: 4 }} />
                            <Text style={{ color: '#fff', fontWeight: '600', fontSize: normalizeFontSize(12) }}>
                                Itinéraire
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}
        </View>
    );

    if (isFullScreen) {
        return (
            <Modal visible={true} animationType="fade">
                <View style={{ flex: 1 }}>
                    {renderMapContent()}
                </View>
            </Modal>
        );
    }

    return (
        <View style={styles.container}>
            {renderMapContent()}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        height: 300,
        borderRadius: 16,
        overflow: 'hidden',
        marginBottom: 16,
        backgroundColor: '#f5f5f5',
    },
    markerContainer: {
        alignItems: 'center',
    },
    markerImageContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        borderWidth: 2,
        borderColor: '#fff',
        backgroundColor: '#fff',
        overflow: 'hidden',
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
    },
    markerImage: {
        width: '100%',
        height: '100%',
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
        borderTopColor: '#fff',
        marginTop: -2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    fullScreenButton: {
        position: 'absolute',
        backgroundColor: '#fff',
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
    },
    salonCard: {
        position: 'absolute',
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    salonImage: {
        backgroundColor: '#f5f5f5',
        overflow: 'hidden',
    },
    actionButton: {
        paddingVertical: 10,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
    },
    searchContainer: {
        position: 'absolute',
        zIndex: 10,
    },
    searchInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 8,
        paddingHorizontal: 10,
        paddingVertical: 8,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
    },
    searchInput: {
        flex: 1,
        fontSize: 14,
        color: '#000',
        paddingVertical: 0,
    },
    suggestionsContainer: {
        marginTop: 5,
        backgroundColor: '#fff',
        borderRadius: 8,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        overflow: 'hidden',
    },
    suggestionItem: {
        padding: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    suggestionText: {
        fontSize: 12,
        color: '#333',
    },
});
