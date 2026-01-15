import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Image,
    Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useI18n } from '../../i18n/I18nContext';
import type { ServicePackage } from '../../services/servicePackagesApi';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH * 0.7;

interface SpecialPackagesSectionProps {
    packages: ServicePackage[];
    onPackagePress: (pkg: ServicePackage) => void;
    loading?: boolean;
}

export const SpecialPackagesSection: React.FC<SpecialPackagesSectionProps> = ({
    packages,
    onPackagePress,
    loading = false,
}) => {
    const { language } = useI18n();

    if (loading) {
        return (
            <View style={styles.container}>
                <View style={styles.header}>
                    <View style={styles.titleRow}>
                        <Ionicons name="gift" size={20} color="#FF6B6B" />
                        <Text style={styles.sectionTitle}>
                            {language === 'fr' ? 'Offres Spéciales' : 'Special Offers'}
                        </Text>
                    </View>
                </View>
                <View style={styles.loadingContainer}>
                    <View style={styles.loadingCard} />
                    <View style={styles.loadingCard} />
                </View>
            </View>
        );
    }

    if (!packages || packages.length === 0) {
        return null;
    }

    const formatDuration = (minutes: number): string => {
        if (minutes >= 60) {
            const hours = Math.floor(minutes / 60);
            const mins = minutes % 60;
            return mins > 0 ? `${hours}h${mins}` : `${hours}h`;
        }
        return `${minutes} min`;
    };

    const formatPrice = (price: number): string => {
        return new Intl.NumberFormat('fr-FR').format(price) + ' FCFA';
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View style={styles.titleRow}>
                    <Ionicons name="gift" size={20} color="#FF6B6B" />
                    <Text style={styles.sectionTitle}>
                        {language === 'fr' ? 'Offres Spéciales' : 'Special Offers'}
                    </Text>
                </View>
                <TouchableOpacity style={styles.seeAllButton}>
                    <Text style={styles.seeAllText}>
                        {language === 'fr' ? 'Voir tout' : 'See all'}
                    </Text>
                    <Ionicons name="chevron-forward" size={16} color="#666" />
                </TouchableOpacity>
            </View>

            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
                decelerationRate="fast"
                snapToInterval={CARD_WIDTH + 12}
            >
                {packages.map((pkg) => {
                    const name = language === 'fr' ? pkg.nameFr : pkg.nameEn;
                    const description = language === 'fr' ? pkg.descriptionFr : pkg.descriptionEn;
                    const image = pkg.images?.[0];
                    const servicesCount = pkg.services?.length || 0;

                    return (
                        <TouchableOpacity
                            key={pkg.id}
                            style={styles.card}
                            onPress={() => onPackagePress(pkg)}
                            activeOpacity={0.9}
                        >
                            <View style={styles.imageContainer}>
                                {image ? (
                                    <Image source={{ uri: image }} style={styles.cardImage} />
                                ) : (
                                    <LinearGradient
                                        colors={['#FF6B6B', '#FF8E53']}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 1 }}
                                        style={styles.gradientPlaceholder}
                                    >
                                        <Ionicons name="gift-outline" size={40} color="#fff" />
                                    </LinearGradient>
                                )}

                                {/* Badge */}
                                <View style={styles.badge}>
                                    <Ionicons name="flash" size={12} color="#fff" />
                                    <Text style={styles.badgeText}>
                                        {language === 'fr' ? 'PACK' : 'BUNDLE'}
                                    </Text>
                                </View>

                                {/* Services count */}
                                {servicesCount > 0 && (
                                    <View style={styles.servicesCountBadge}>
                                        <Text style={styles.servicesCountText}>
                                            {servicesCount} {language === 'fr' ? 'services' : 'services'}
                                        </Text>
                                    </View>
                                )}
                            </View>

                            <View style={styles.cardContent}>
                                <Text style={styles.packageName} numberOfLines={1}>
                                    {name}
                                </Text>

                                {description && (
                                    <Text style={styles.packageDescription} numberOfLines={2}>
                                        {description}
                                    </Text>
                                )}

                                <View style={styles.packageMeta}>
                                    <View style={styles.durationContainer}>
                                        <Ionicons name="time-outline" size={14} color="#666" />
                                        <Text style={styles.durationText}>
                                            {formatDuration(pkg.salonDuration || pkg.baseDuration)}
                                        </Text>
                                    </View>

                                    <Text style={styles.priceText}>
                                        {formatPrice(pkg.salonPrice || pkg.basePrice)}
                                    </Text>
                                </View>

                                {/* Services preview */}
                                {pkg.services && pkg.services.length > 0 && (
                                    <View style={styles.servicesPreview}>
                                        {pkg.services.slice(0, 3).map((service, idx) => (
                                            <View key={service.id} style={styles.serviceTag}>
                                                <Text style={styles.serviceTagText} numberOfLines={1}>
                                                    {language === 'fr' ? service.nameFr : service.nameEn}
                                                </Text>
                                            </View>
                                        ))}
                                        {pkg.services.length > 3 && (
                                            <View style={styles.moreTag}>
                                                <Text style={styles.moreTagText}>
                                                    +{pkg.services.length - 3}
                                                </Text>
                                            </View>
                                        )}
                                    </View>
                                )}
                            </View>
                        </TouchableOpacity>
                    );
                })}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: 24,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 24,
        marginBottom: 16,
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1A1A1A',
    },
    seeAllButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    seeAllText: {
        fontSize: 14,
        color: '#666',
    },
    scrollContent: {
        paddingHorizontal: 24,
        gap: 12,
    },
    loadingContainer: {
        flexDirection: 'row',
        paddingHorizontal: 24,
        gap: 12,
    },
    loadingCard: {
        width: CARD_WIDTH,
        height: 200,
        borderRadius: 16,
        backgroundColor: '#F0F0F0',
    },
    card: {
        width: CARD_WIDTH,
        backgroundColor: '#fff',
        borderRadius: 16,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius: 12,
        elevation: 6,
    },
    imageContainer: {
        height: 140,
        position: 'relative',
    },
    cardImage: {
        width: '100%',
        height: '100%',
    },
    gradientPlaceholder: {
        width: '100%',
        height: '100%',
        alignItems: 'center',
        justifyContent: 'center',
    },
    badge: {
        position: 'absolute',
        top: 12,
        left: 12,
        backgroundColor: '#FF6B6B',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 20,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    badgeText: {
        color: '#fff',
        fontSize: 11,
        fontWeight: '700',
    },
    servicesCountBadge: {
        position: 'absolute',
        bottom: 12,
        right: 12,
        backgroundColor: 'rgba(0,0,0,0.7)',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 12,
    },
    servicesCountText: {
        color: '#fff',
        fontSize: 11,
        fontWeight: '600',
    },
    cardContent: {
        padding: 16,
    },
    packageName: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1A1A1A',
        marginBottom: 4,
    },
    packageDescription: {
        fontSize: 13,
        color: '#666',
        lineHeight: 18,
        marginBottom: 12,
    },
    packageMeta: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    durationContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    durationText: {
        fontSize: 13,
        color: '#666',
    },
    priceText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#FF6B6B',
    },
    servicesPreview: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
    },
    serviceTag: {
        backgroundColor: '#F5F5F5',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        maxWidth: 100,
    },
    serviceTagText: {
        fontSize: 11,
        color: '#666',
    },
    moreTag: {
        backgroundColor: '#E0E0E0',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    moreTagText: {
        fontSize: 11,
        fontWeight: '600',
        color: '#333',
    },
});
