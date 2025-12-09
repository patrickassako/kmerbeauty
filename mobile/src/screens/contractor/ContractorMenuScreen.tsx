import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Image,
    Alert,
    Modal,
    FlatList,
    Switch,
    TextInput,
    Animated,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../contexts/AuthContext';
import { useResponsive } from '../../hooks/useResponsive';
import { contractorApi } from '../../services/api';
import { getFullName, getUserInitials } from '../../utils/userHelpers';
import { Ionicons } from '@expo/vector-icons'; // Assuming Expo, or use another icon lib

import { CAMEROON_LOCATIONS, CityData } from '../../data/cameroon_locations';

export const ContractorMenuScreen = () => {
    const { normalizeFontSize, spacing } = useResponsive();
    const { user, signOut, switchRole } = useAuth();
    const navigation = useNavigation<any>();

    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [showZoneModal, setShowZoneModal] = useState(false);
    const [selectedZones, setSelectedZones] = useState<string[]>([]);
    const [savingZones, setSavingZones] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [filteredLocations, setFilteredLocations] = useState<CityData[]>(CAMEROON_LOCATIONS);

    // Animation values
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(30)).current;
    const menuItemsAnim = useRef([
        new Animated.Value(0),
        new Animated.Value(0),
        new Animated.Value(0),
        new Animated.Value(0),
        new Animated.Value(0),
        new Animated.Value(0),
    ]).current;

    useEffect(() => {
        loadProfile();
    }, []);

    useEffect(() => {
        if (!loading) {
            // Animate header
            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 500,
                    useNativeDriver: true,
                }),
                Animated.spring(slideAnim, {
                    toValue: 0,
                    tension: 50,
                    friction: 7,
                    useNativeDriver: true,
                }),
            ]).start();

            // Stagger menu items
            Animated.stagger(
                80,
                menuItemsAnim.map(anim =>
                    Animated.spring(anim, {
                        toValue: 1,
                        tension: 50,
                        friction: 7,
                        useNativeDriver: true,
                    })
                )
            ).start();
        }
    }, [loading]);

    useEffect(() => {
        if (searchQuery.trim() === '') {
            setFilteredLocations(CAMEROON_LOCATIONS);
        } else {
            const query = searchQuery.toLowerCase();
            const filtered = CAMEROON_LOCATIONS.map(city => {
                // Check if city name matches
                if (city.name.toLowerCase().includes(query)) {
                    return city;
                }
                // Check neighborhoods
                const matchingNeighborhoods = city.neighborhoods.filter(n =>
                    n.toLowerCase().includes(query)
                );
                if (matchingNeighborhoods.length > 0) {
                    return { ...city, neighborhoods: matchingNeighborhoods };
                }
                return null;
            }).filter(Boolean) as CityData[];
            setFilteredLocations(filtered);
        }
    }, [searchQuery]);

    const loadProfile = async () => {
        try {
            if (!user?.id) return;
            const data = await contractorApi.getProfileByUserId(user.id);
            setProfile(data);

            if (data && data.service_zones && Array.isArray(data.service_zones)) {
                // Handle structure: [{ city: "Yaoundé", district: "Biyem-Assi" }]
                const zones = data.service_zones.map((z: any) => {
                    // If it's the object structure { city, district }
                    if (z.district) return z.district;
                    // Fallback for string or other formats
                    return typeof z === 'string' ? z : z.location?.address || '';
                });

                // Normalize and match against known locations
                const allNeighborhoods = CAMEROON_LOCATIONS.flatMap(c => c.neighborhoods);
                const matchedZones = zones.map((z: string) => {
                    const match = allNeighborhoods.find(n =>
                        n.toLowerCase() === z.toLowerCase() ||
                        z.toLowerCase().includes(n.toLowerCase())
                    );
                    return match || z;
                });

                setSelectedZones(matchedZones.filter(Boolean));
            }
        } catch (error) {
            console.error('Error loading profile:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSignOut = async () => {
        Alert.alert(
            'Déconnexion',
            'Êtes-vous sûr de vouloir vous déconnecter ?',
            [
                { text: 'Annuler', style: 'cancel' },
                {
                    text: 'Déconnexion',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await signOut();
                        } catch (error) {
                            console.error('Sign out error:', error);
                        }
                    },
                },
            ]
        );
    };

    const toggleZone = (zone: string) => {
        if (selectedZones.includes(zone)) {
            setSelectedZones(selectedZones.filter(z => z !== zone));
        } else {
            setSelectedZones([...selectedZones, zone]);
        }
    };

    const saveZones = async () => {
        try {
            setSavingZones(true);

            // Convert selected zones (strings) back to object structure { city, district }
            const formattedZones = selectedZones.map(zone => {
                // Find the city for this zone
                const cityData = CAMEROON_LOCATIONS.find(c => c.neighborhoods.includes(zone));
                return {
                    city: cityData?.name || 'Unknown',
                    district: zone
                };
            });

            // Cast to any to bypass strict DTO type check if needed, or update DTO
            await contractorApi.updateProfile(user!.id, {
                service_zones: formattedZones as any
            });

            // Update local profile state
            setProfile({ ...profile, service_zones: formattedZones });
            setShowZoneModal(false);
            Alert.alert('Succès', 'Votre zone de travail a été mise à jour.');
        } catch (error: any) {
            Alert.alert('Erreur', error.message || 'Impossible de mettre à jour la zone.');
        } finally {
            setSavingZones(false);
        }
    };

    const MenuItem = ({ icon, title, onPress, color = '#2D2D2D' }: any) => (
        <TouchableOpacity style={[styles.menuItem, { padding: spacing(2) }]} onPress={onPress}>
            <View style={styles.menuItemLeft}>
                <Text style={{ fontSize: normalizeFontSize(20), marginRight: spacing(2) }}>{icon}</Text>
                <Text style={[styles.menuItemTitle, { fontSize: normalizeFontSize(16), color }]}>{title}</Text>
            </View>
            <Text style={{ fontSize: normalizeFontSize(16), color: '#CCC' }}>→</Text>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            {/* Header Profile */}
            <View style={[styles.header, { padding: spacing(3), paddingTop: spacing(8) }]}>
                <View style={styles.profileRow}>
                    <View style={[styles.avatar, { width: spacing(8), height: spacing(8), borderRadius: spacing(4) }]}>
                        {profile?.profile_image ? (
                            <Image
                                source={{ uri: profile.profile_image }}
                                style={{ width: '100%', height: '100%', borderRadius: spacing(4) }}
                            />
                        ) : (
                            <Text style={{ fontSize: normalizeFontSize(24), color: '#FFF' }}>
                                {getUserInitials(user)}
                            </Text>
                        )}
                    </View>
                    <View style={styles.profileInfo}>
                        <Text style={[styles.userName, { fontSize: normalizeFontSize(20) }]}>
                            {profile?.business_name || getFullName(user)}
                        </Text>
                        <View style={styles.ratingRow}>
                            <Text style={{ fontSize: normalizeFontSize(14) }}>⭐</Text>
                            <Text style={[styles.ratingText, { fontSize: normalizeFontSize(14) }]}>
                                {profile?.rating?.toFixed(1) || 'N/A'} ({profile?.review_count || 0} avis)
                            </Text>
                        </View>
                    </View>
                </View>
            </View>

            <ScrollView style={styles.content}>
                <Animated.View
                    style={[
                        styles.section,
                        {
                            marginTop: spacing(3),
                            opacity: menuItemsAnim[0],
                            transform: [{
                                translateX: menuItemsAnim[0].interpolate({
                                    inputRange: [0, 1],
                                    outputRange: [50, 0],
                                })
                            }]
                        }
                    ]}
                >
                    <MenuItem
                        icon="👤"
                        title="Profil"
                        onPress={() => navigation.navigate('ContractorProfile')}
                    />
                    <MenuItem
                        icon="📅"
                        title="Disponibilité"
                        onPress={() => navigation.navigate('ContractorAvailability')}
                    />
                    <MenuItem
                        icon="🛠️"
                        title="Services"
                        onPress={() => navigation.navigate('ContractorServices')}
                    />
                    <MenuItem
                        icon="🛍️"
                        title="Mes Produits"
                        onPress={() => navigation.navigate('ContractorProducts')}
                    />
                    <MenuItem
                        icon="📦"
                        title="Mes Ventes"
                        onPress={() => navigation.navigate('ContractorSales')}
                    />
                </Animated.View>

                <Animated.View
                    style={[
                        styles.section,
                        {
                            marginTop: spacing(3),
                            opacity: menuItemsAnim[1],
                            transform: [{
                                translateX: menuItemsAnim[1].interpolate({
                                    inputRange: [0, 1],
                                    outputRange: [50, 0],
                                })
                            }]
                        }
                    ]}
                >
                    <MenuItem
                        icon="📍"
                        title="Ma zone de travail"
                        onPress={() => setShowZoneModal(true)}
                    />
                    <MenuItem
                        icon="⚙️"
                        title="Paramètres"
                        onPress={() => navigation.navigate('ContractorSettings')}
                    />
                </Animated.View>

                <Animated.View
                    style={[
                        styles.section,
                        {
                            marginTop: spacing(3),
                            opacity: menuItemsAnim[2],
                            transform: [{
                                translateX: menuItemsAnim[2].interpolate({
                                    inputRange: [0, 1],
                                    outputRange: [50, 0],
                                })
                            }]
                        }
                    ]}
                >
                    <MenuItem
                        icon="🔄"
                        title="Passer en mode Client"
                        onPress={switchRole}
                        color="#2D2D2D"
                    />
                    <MenuItem
                        icon="🚪"
                        title="Se déconnecter"
                        onPress={handleSignOut}
                        color="#FF4444"
                    />
                </Animated.View>

                <Text style={[styles.version, { marginTop: spacing(4), fontSize: normalizeFontSize(12) }]}>
                    Version 1.0.0
                </Text>
            </ScrollView>

            {/* Work Zone Modal */}
            <Modal
                visible={showZoneModal}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowZoneModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { padding: spacing(3), borderRadius: spacing(2) }]}>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { fontSize: normalizeFontSize(18) }]}>Ma zone de travail</Text>
                            <TouchableOpacity onPress={() => setShowZoneModal(false)}>
                                <Text style={{ fontSize: normalizeFontSize(24), color: '#666' }}>×</Text>
                            </TouchableOpacity>
                        </View>

                        <Text style={[styles.modalSubtitle, { fontSize: normalizeFontSize(14), marginBottom: spacing(2) }]}>
                            Sélectionnez les quartiers où vous intervenez.
                        </Text>

                        {/* Search Bar */}
                        <View style={[styles.searchContainer, { marginBottom: spacing(2), padding: spacing(1.5), borderRadius: spacing(1) }]}>
                            <Text style={{ marginRight: spacing(1), fontSize: normalizeFontSize(16) }}>🔍</Text>
                            <TextInput
                                style={[styles.searchInput, { fontSize: normalizeFontSize(16) }]}
                                placeholder="Rechercher un quartier ou une ville..."
                                value={searchQuery}
                                onChangeText={setSearchQuery}
                                placeholderTextColor="#999"
                            />
                        </View>

                        <ScrollView style={{ maxHeight: '65%' }}>
                            {filteredLocations.length === 0 ? (
                                <Text style={{ textAlign: 'center', marginTop: 20, color: '#666' }}>Aucun résultat trouvé</Text>
                            ) : (
                                filteredLocations.map(city => (
                                    <View key={city.name}>
                                        <Text style={[styles.cityHeader, { fontSize: normalizeFontSize(16), marginTop: spacing(1) }]}>
                                            {city.name}
                                        </Text>
                                        {city.neighborhoods.map(zone => (
                                            <TouchableOpacity
                                                key={zone}
                                                style={[styles.zoneItem, { paddingVertical: spacing(1.5) }]}
                                                onPress={() => toggleZone(zone)}
                                            >
                                                <Text style={{ fontSize: normalizeFontSize(16), color: '#2D2D2D' }}>{zone}</Text>
                                                <View style={[
                                                    styles.checkbox,
                                                    selectedZones.includes(zone) && styles.checkboxSelected
                                                ]}>
                                                    {selectedZones.includes(zone) && <Text style={{ color: '#FFF', fontSize: 12 }}>✓</Text>}
                                                </View>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                ))
                            )}
                        </ScrollView>

                        <TouchableOpacity
                            style={[styles.saveButton, { padding: spacing(2), marginTop: spacing(2), borderRadius: spacing(1) }]}
                            onPress={saveZones}
                            disabled={savingZones}
                        >
                            <Text style={[styles.saveButtonText, { fontSize: normalizeFontSize(16) }]}>
                                {savingZones ? 'Enregistrement...' : 'Enregistrer'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
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
        borderBottomColor: '#F0F0F0',
    },
    profileRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 15,
    },
    avatar: {
        backgroundColor: '#2D2D2D',
        justifyContent: 'center',
        alignItems: 'center',
    },
    profileInfo: {
        flex: 1,
    },
    userName: {
        fontWeight: 'bold',
        color: '#2D2D2D',
        marginBottom: 4,
    },
    ratingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    ratingText: {
        color: '#666',
    },
    content: {
        flex: 1,
    },
    section: {
        backgroundColor: '#FFF',
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderColor: '#F0F0F0',
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#FFF',
    },
    menuItemLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    menuItemTitle: {
        fontWeight: '500',
    },
    version: {
        textAlign: 'center',
        color: '#999',
        marginBottom: 30,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#FFF',
        height: '80%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    modalTitle: {
        fontWeight: 'bold',
        color: '#2D2D2D',
    },
    modalSubtitle: {
        color: '#666',
    },
    cityHeader: {
        fontWeight: 'bold',
        color: '#2D2D2D',
        marginBottom: 10,
        backgroundColor: '#F5F5F5',
        padding: 8,
        borderRadius: 4,
    },
    zoneItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    checkbox: {
        width: 20,
        height: 20,
        borderRadius: 4,
        borderWidth: 1,
        borderColor: '#999',
        justifyContent: 'center',
        alignItems: 'center',
    },
    checkboxSelected: {
        backgroundColor: '#2D2D2D',
        borderColor: '#2D2D2D',
    },
    saveButton: {
        backgroundColor: '#2D2D2D',
        alignItems: 'center',
    },
    saveButtonText: {
        color: '#FFF',
        fontWeight: 'bold',
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F5F5F5',
    },
    searchInput: {
        flex: 1,
        color: '#2D2D2D',
    },
});
