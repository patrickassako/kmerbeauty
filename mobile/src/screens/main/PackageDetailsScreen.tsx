import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Image,
    SafeAreaView,
    Dimensions,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { HomeStackParamList } from '../../navigation/HomeStackNavigator';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useI18n } from '../../i18n/I18nContext';

type Props = NativeStackScreenProps<HomeStackParamList, 'PackageDetails'>;

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export const PackageDetailsScreen: React.FC<Props> = ({ navigation, route }) => {
    const { package: pkg, providerId, providerType } = route.params;
    const { language } = useI18n();
    const [selectedImageIndex, setSelectedImageIndex] = useState(0);
    const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);

    const name = language === 'fr' ? pkg.nameFr : pkg.nameEn;
    const description = language === 'fr' ? pkg.descriptionFr : pkg.descriptionEn;
    const images = pkg.images || [];

    const formatPrice = (price: number): string => {
        return new Intl.NumberFormat('fr-FR').format(price) + ' FCFA';
    };

    const formatDuration = (minutes: number): string => {
        if (minutes >= 60) {
            const hours = Math.floor(minutes / 60);
            const mins = minutes % 60;
            return mins > 0 ? `${hours}h${mins}` : `${hours}h`;
        }
        return `${minutes} min`;
    };

    const handleBookNow = () => {
        // Navigate to booking or provider selection
        if (providerId && providerType) {
            // Direct booking with specific provider
            navigation.navigate('Booking', {
                service: pkg as any, // Package can be treated as service for booking
                providerId,
                providerType,
            });
        } else {
            // Show provider selection screen
            navigation.navigate('PackageProviders', {
                package: pkg as any,
            });
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>
                    {language === 'fr' ? 'Détails du Pack' : 'Package Details'}
                </Text>
                <View style={styles.headerRight} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Image Gallery */}
                {images.length > 0 ? (
                    <View style={styles.imageSection}>
                        <Image
                            source={{ uri: images[selectedImageIndex] }}
                            style={styles.mainImage}
                            resizeMode="cover"
                        />

                        {/* Image Indicators */}
                        {images.length > 1 && (
                            <View style={styles.imageIndicators}>
                                {images.map((_: string, index: number) => (
                                    <TouchableOpacity
                                        key={index}
                                        style={[
                                            styles.indicator,
                                            selectedImageIndex === index && styles.activeIndicator,
                                        ]}
                                        onPress={() => setSelectedImageIndex(index)}
                                    />
                                ))}
                            </View>
                        )}

                        {/* Badge */}
                        <View style={styles.packageBadge}>
                            <Ionicons name="gift" size={16} color="#fff" />
                            <Text style={styles.badgeText}>
                                {language === 'fr' ? 'PACK' : 'BUNDLE'}
                            </Text>
                        </View>
                    </View>
                ) : (
                    <LinearGradient
                        colors={['#FF6B6B', '#FF8E53']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.placeholderImage}
                    >
                        <Ionicons name="gift-outline" size={60} color="#fff" />
                    </LinearGradient>
                )}

                {/* Package Info */}
                <View style={styles.content}>
                    <Text style={styles.packageName}>{name}</Text>

                    {/* Price & Duration */}
                    <View style={styles.metaRow}>
                        <View style={styles.metaItem}>
                            <Ionicons name="pricetag" size={20} color="#FF6B6B" />
                            <Text style={styles.priceText}>{formatPrice(pkg.basePrice)}</Text>
                        </View>
                        <View style={styles.metaItem}>
                            <Ionicons name="time-outline" size={20} color="#666" />
                            <Text style={styles.durationText}>
                                {formatDuration(pkg.baseDuration)}
                            </Text>
                        </View>
                    </View>

                    {/* Description */}
                    {description && (
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>
                                {language === 'fr' ? 'Description' : 'Description'}
                            </Text>
                            <Text style={styles.descriptionText}>
                                {isDescriptionExpanded
                                    ? description
                                    : description.length > 200
                                        ? `${description.substring(0, 200)}...`
                                        : description
                                }
                            </Text>
                            {description.length > 200 && (
                                <TouchableOpacity
                                    onPress={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                                    style={styles.seeMoreButton}
                                >
                                    <Text style={styles.seeMoreText}>
                                        {isDescriptionExpanded
                                            ? (language === 'fr' ? 'Voir moins' : 'See less')
                                            : (language === 'fr' ? 'Voir plus' : 'See more')
                                        }
                                    </Text>
                                    <Ionicons
                                        name={isDescriptionExpanded ? 'chevron-up' : 'chevron-down'}
                                        size={16}
                                        color="#FF6B6B"
                                    />
                                </TouchableOpacity>
                            )}
                        </View>
                    )}

                    {/* Services Included */}
                    {pkg.services && pkg.services.length > 0 && (
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>
                                {language === 'fr' ? 'Services Inclus' : 'Included Services'}
                            </Text>
                            {pkg.services.map((service: any, index: number) => (
                                <View key={service.id} style={styles.serviceItem}>
                                    <View style={styles.serviceNumber}>
                                        <Text style={styles.serviceNumberText}>{index + 1}</Text>
                                    </View>
                                    <View style={styles.serviceInfo}>
                                        <Text style={styles.serviceName}>
                                            {language === 'fr' ? service.nameFr : service.nameEn}
                                        </Text>
                                        {service.images && service.images.length > 0 && (
                                            <Image
                                                source={{ uri: service.images[0] }}
                                                style={styles.serviceImage}
                                            />
                                        )}
                                    </View>
                                </View>
                            ))}
                        </View>
                    )}

                    {/* Category */}
                    <View style={styles.categoryBadge}>
                        <Text style={styles.categoryText}>
                            {pkg.category}
                        </Text>
                    </View>
                </View>
            </ScrollView>

            {/* Book Now Button */}
            <View style={styles.footer}>
                <TouchableOpacity
                    style={styles.bookButton}
                    onPress={handleBookNow}
                    activeOpacity={0.8}
                >
                    <Text style={styles.bookButtonText}>
                        {language === 'fr' ? 'Réserver Maintenant' : 'Book Now'}
                    </Text>
                    <Ionicons name="arrow-forward" size={20} color="#fff" />
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#F5F5F5',
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1A1A1A',
    },
    headerRight: {
        width: 40,
    },
    imageSection: {
        position: 'relative',
    },
    mainImage: {
        width: SCREEN_WIDTH,
        height: 300,
        backgroundColor: '#F0F0F0',
    },
    placeholderImage: {
        width: SCREEN_WIDTH,
        height: 300,
        alignItems: 'center',
        justifyContent: 'center',
    },
    imageIndicators: {
        position: 'absolute',
        bottom: 16,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 8,
    },
    indicator: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: 'rgba(255,255,255,0.5)',
    },
    activeIndicator: {
        backgroundColor: '#fff',
        width: 24,
    },
    packageBadge: {
        position: 'absolute',
        top: 16,
        left: 16,
        backgroundColor: '#FF6B6B',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    badgeText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '700',
    },
    content: {
        padding: 20,
    },
    packageName: {
        fontSize: 24,
        fontWeight: '700',
        color: '#1A1A1A',
        marginBottom: 16,
    },
    metaRow: {
        flexDirection: 'row',
        gap: 24,
        marginBottom: 24,
    },
    metaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    priceText: {
        fontSize: 20,
        fontWeight: '700',
        color: '#FF6B6B',
    },
    durationText: {
        fontSize: 16,
        color: '#666',
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1A1A1A',
        marginBottom: 12,
    },
    descriptionText: {
        fontSize: 15,
        lineHeight: 24,
        color: '#666',
    },
    seeMoreButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginTop: 8,
    },
    seeMoreText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#FF6B6B',
    },
    serviceItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 12,
        padding: 12,
        backgroundColor: '#F8F8F8',
        borderRadius: 12,
    },
    serviceNumber: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#FF6B6B',
        alignItems: 'center',
        justifyContent: 'center',
    },
    serviceNumberText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '700',
    },
    serviceInfo: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    serviceName: {
        flex: 1,
        fontSize: 15,
        fontWeight: '600',
        color: '#1A1A1A',
    },
    serviceImage: {
        width: 50,
        height: 50,
        borderRadius: 8,
        backgroundColor: '#E0E0E0',
    },
    categoryBadge: {
        alignSelf: 'flex-start',
        backgroundColor: '#F0F0F0',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
    },
    categoryText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#666',
    },
    footer: {
        padding: 20,
        paddingBottom: 90, // Extra padding to avoid tab bar
        borderTopWidth: 1,
        borderTopColor: '#F0F0F0',
        backgroundColor: '#fff',
    },
    bookButton: {
        backgroundColor: '#FF6B6B',
        paddingVertical: 16,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    bookButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    },
});
