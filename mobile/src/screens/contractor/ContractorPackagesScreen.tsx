import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    Modal,
    TextInput,
    Alert,
    Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useResponsive } from '../../hooks/useResponsive';
import { useI18n } from '../../i18n/I18nContext';
import { useAuth } from '../../contexts/AuthContext';
import {
    contractorApi,
    servicePackagesApi,
    categoriesApi,
    type CategoryTranslation as Category,
} from '../../services/api';

// Define Package interface locally if not available yet in models
interface ServicePackage {
    id: string;
    name_en: string;
    name_fr: string;
    description_en: string;
    description_fr: string;
    base_price: number;
    duration: number;
    image_url: string;
    category: string;
    included_services: any[];
}

interface ContractorPackage {
    id: string; // The ID of the therapist_package record
    package_id: string;
    price: number;
    duration: number;
    is_active: boolean;
    package?: ServicePackage;
}

interface ContractorPackagesScreenProps {
    onPackageAdded?: () => void;
    hideHeader?: boolean;
}

export const ContractorPackagesScreen: React.FC<ContractorPackagesScreenProps> = ({
    onPackageAdded,
    hideHeader = false,
}) => {
    const { normalizeFontSize, spacing } = useResponsive();
    const { language } = useI18n();
    const { user } = useAuth();
    const navigation = useNavigation<any>();

    const [loading, setLoading] = useState(true);
    const [contractorId, setContractorId] = useState<string | null>(null);
    const [contractorPackages, setContractorPackages] = useState<ContractorPackage[]>([]);
    const [allPackages, setAllPackages] = useState<ServicePackage[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);

    const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
    const [searchQuery, setSearchQuery] = useState('');
    const [showCustomizeModal, setShowCustomizeModal] = useState(false);
    const [selectedPackageForCustomization, setSelectedPackageForCustomization] = useState<ServicePackage | null>(null);
    const [existingContractorPackage, setExistingContractorPackage] = useState<ContractorPackage | null>(null);

    const [customization, setCustomization] = useState({
        price: '',
        duration: '',
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const profile = await contractorApi.getProfileByUserId(user?.id || '');
            if (!profile) return;

            setContractorId(profile.id);

            const [contractorPackagesData, allPackagesData, categoriesData] = await Promise.all([
                contractorApi.getPackages(profile.id),
                servicePackagesApi.getAll(),
                categoriesApi.getAll(),
            ]);

            setContractorPackages(contractorPackagesData);
            setAllPackages(allPackagesData);
            setCategories(categoriesData);
        } catch (error) {
            console.error('Error loading data:', error);
            Alert.alert('Error', 'Failed to load packages');
        } finally {
            setLoading(false);
        }
    };

    const isPackageSelected = (packageId: string): boolean => {
        return contractorPackages.some((cp) => cp.package_id === packageId);
    };

    const getContractorPackage = (packageId: string): ContractorPackage | undefined => {
        return contractorPackages.find((cp) => cp.package_id === packageId);
    };

    const handlePackagePress = (pkg: ServicePackage) => {
        const existing = getContractorPackage(pkg.id);

        if (existing) {
            // Package already added, open for editing
            setExistingContractorPackage(existing);
            setCustomization({
                price: existing.price.toString(),
                duration: existing.duration.toString(),
            });
        } else {
            // New package, show with base price
            setExistingContractorPackage(null);
            setCustomization({
                price: pkg.base_price.toString(),
                duration: pkg.duration.toString(),
            });
        }

        setSelectedPackageForCustomization(pkg);
        setShowCustomizeModal(true);
    };

    const handleSaveCustomization = async () => {
        if (!contractorId || !selectedPackageForCustomization) return;
        if (!customization.price || !customization.duration) {
            Alert.alert('Error', language === 'fr' ? 'Veuillez remplir tous les champs' : 'Please fill all fields');
            return;
        }

        try {
            if (existingContractorPackage) {
                // Update existing package
                await contractorApi.updatePackage(existingContractorPackage.id, {
                    price: parseFloat(customization.price),
                    duration: parseInt(customization.duration),
                });
            } else {
                // Add new package
                await contractorApi.addPackage({
                    contractor_id: contractorId,
                    package_id: selectedPackageForCustomization.id,
                    price: parseFloat(customization.price),
                    duration: parseInt(customization.duration),
                });

                if (onPackageAdded) {
                    onPackageAdded();
                }
            }

            setShowCustomizeModal(false);
            setSelectedPackageForCustomization(null);
            setExistingContractorPackage(null);
            setCustomization({ price: '', duration: '' });
            loadData();
        } catch (error) {
            console.error('Error saving package:', error);
            Alert.alert('Error', language === 'fr' ? 'Échec de la sauvegarde' : 'Failed to save');
        }
    };

    const handleRemovePackage = async () => {
        if (!existingContractorPackage) return;

        Alert.alert(
            language === 'fr' ? 'Supprimer' : 'Remove',
            language === 'fr' ? 'Supprimer ce package?' : 'Remove this package?',
            [
                { text: language === 'fr' ? 'Annuler' : 'Cancel', style: 'cancel' },
                {
                    text: language === 'fr' ? 'Supprimer' : 'Remove',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await contractorApi.deletePackage(existingContractorPackage.id);
                            setShowCustomizeModal(false);
                            setSelectedPackageForCustomization(null);
                            setExistingContractorPackage(null);
                            setCustomization({ price: '', duration: '' });
                            loadData();
                        } catch (error) {
                            console.error('Error deleting package:', error);
                        }
                    },
                },
            ]
        );
    };

    const getFilteredPackages = (): ServicePackage[] => {
        let filtered = allPackages;

        if (selectedCategory !== 'ALL') {
            filtered = filtered.filter((pkg) => pkg.category === selectedCategory);
        }

        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter((pkg) => {
                const name = language === 'fr' ? pkg.name_fr : pkg.name_en;
                return name.toLowerCase().includes(query);
            });
        }

        return filtered;
    };

    const formatCurrency = (amount: number) => {
        return `${amount.toLocaleString('fr-FR')} FCFA`;
    };

    const formatDuration = (minutes: number) => {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        if (hours > 0 && mins > 0) {
            return `${hours}h ${mins}m`;
        } else if (hours > 0) {
            return `${hours}h`;
        } else {
            return `${mins}m`;
        }
    };

    if (loading) {
        return (
            <View style={[styles.container, styles.centered]}>
                <ActivityIndicator size="large" color="#FF6B6B" />
            </View>
        );
    }

    const filteredPackages = getFilteredPackages();
    const stickyHeaderIndex = !hideHeader ? 1 : 0;

    return (
        <View style={styles.container}>
            {/* Fixed Header */}
            {!hideHeader && (
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Text style={styles.backIcon}>←</Text>
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>
                        {language === 'fr' ? 'Mes Packages' : 'My Packages'}
                    </Text>
                    <View style={{ width: 40 }} />
                </View>
            )}

            <ScrollView
                style={styles.mainScrollView}
                stickyHeaderIndices={[stickyHeaderIndex]}
                showsVerticalScrollIndicator={false}
            >
                {/* Top Content (Scrolls away) */}
                <View>
                    {!hideHeader && (
                        <View style={styles.descriptionContainer}>
                            <Text style={styles.descriptionText}>
                                {language === 'fr'
                                    ? 'Gérer vos offres de packages'
                                    : 'Manage your package offers'}
                            </Text>
                        </View>
                    )}

                    <View style={styles.titleSection}>
                        <Text style={styles.titleText}>
                            {language === 'fr'
                                ? '📦 Sélectionnez les packages que vous proposez'
                                : '📦 Select the packages you offer'}
                        </Text>
                        <Text style={styles.subtitleText}>
                            {language === 'fr'
                                ? 'Appuyez pour ajouter ou personnaliser'
                                : 'Tap to add or customize'}
                        </Text>
                    </View>
                </View>

                {/* Search Bar (Sticky) */}
                <View style={styles.stickySearchContainer}>
                    <View style={styles.searchContainer}>
                        <Text style={styles.searchIcon}>🔍</Text>
                        <TextInput
                            style={styles.searchInput}
                            placeholder={language === 'fr' ? 'Rechercher un package...' : 'Search for a package...'}
                            placeholderTextColor="#999"
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                        />
                        {searchQuery.length > 0 && (
                            <TouchableOpacity onPress={() => setSearchQuery('')}>
                                <Text style={styles.clearIcon}>✕</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </View>

                {/* Content below sticky header */}
                <View style={styles.contentContainer}>
                    {/* Category Filters */}
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.categoriesContent}
                        style={styles.categoriesScroll}
                    >
                        <TouchableOpacity
                            style={[styles.categoryChip, selectedCategory === 'ALL' && styles.categoryChipActive]}
                            onPress={() => setSelectedCategory('ALL')}
                        >
                            <Text style={[styles.categoryChipText, selectedCategory === 'ALL' && styles.categoryChipTextActive]}>
                                {language === 'fr' ? 'Tous' : 'All'}
                            </Text>
                        </TouchableOpacity>
                        {categories.map((category) => (
                            <TouchableOpacity
                                key={category.category}
                                style={[styles.categoryChip, selectedCategory === category.category && styles.categoryChipActive]}
                                onPress={() => setSelectedCategory(category.category)}
                            >
                                <Text
                                    style={[
                                        styles.categoryChipText,
                                        selectedCategory === category.category && styles.categoryChipTextActive,
                                    ]}
                                >
                                    {language === 'fr' ? category.name_fr : category.name_en}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>

                    {/* Packages Grid */}
                    <View style={styles.servicesContent}>
                        {filteredPackages.length === 0 ? (
                            <View style={styles.emptyState}>
                                <Text style={styles.emptyText}>
                                    {language === 'fr' ? 'Aucun package trouvé' : 'No packages found'}
                                </Text>
                            </View>
                        ) : (
                            filteredPackages.map((pkg) => {
                                const isSelected = isPackageSelected(pkg.id);
                                const contractorPackage = getContractorPackage(pkg.id);

                                return (
                                    <TouchableOpacity
                                        key={pkg.id}
                                        style={styles.serviceCard}
                                        onPress={() => handlePackagePress(pkg)}
                                        activeOpacity={0.7}
                                    >
                                        <View style={styles.imageContainer}>
                                            <Image
                                                source={{ uri: pkg.image_url || 'https://via.placeholder.com/150' }}
                                                style={styles.serviceImage}
                                                resizeMode="cover"
                                            />
                                            {isSelected && (
                                                <View style={styles.checkmarkBadge}>
                                                    <Text style={styles.checkmark}>✓</Text>
                                                </View>
                                            )}
                                            <View style={styles.categoryBadge}>
                                                <Text style={styles.categoryBadgeText}>
                                                    {pkg.category}
                                                </Text>
                                            </View>
                                        </View>

                                        <View style={styles.serviceInfo}>
                                            <Text style={styles.serviceName} numberOfLines={2}>
                                                {language === 'fr' ? pkg.name_fr : pkg.name_en}
                                            </Text>

                                            <Text style={styles.serviceDescription} numberOfLines={2}>
                                                {language === 'fr' ? pkg.description_fr : pkg.description_en}
                                            </Text>

                                            <View style={styles.serviceDetails}>
                                                <Text style={styles.servicePrice}>
                                                    {isSelected && contractorPackage
                                                        ? formatCurrency(contractorPackage.price)
                                                        : formatCurrency(pkg.base_price)}
                                                </Text>
                                                <View style={styles.serviceMeta}>
                                                    <Text style={styles.serviceMetaText}>
                                                        ⏱ {isSelected && contractorPackage
                                                            ? formatDuration(contractorPackage.duration)
                                                            : formatDuration(pkg.duration)}
                                                    </Text>
                                                </View>
                                            </View>

                                            {isSelected && (
                                                <View style={styles.selectedBadge}>
                                                    <Text style={styles.selectedBadgeText}>
                                                        {language === 'fr' ? 'Activé' : 'Active'}
                                                    </Text>
                                                </View>
                                            )}
                                        </View>
                                    </TouchableOpacity>
                                );
                            })
                        )}
                    </View>
                </View>
            </ScrollView>

            {/* Customization Modal */}
            <Modal visible={showCustomizeModal} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>
                                {existingContractorPackage
                                    ? (language === 'fr' ? 'Modifier le package' : 'Edit Package')
                                    : (language === 'fr' ? 'Ajouter le package' : 'Add Package')}
                            </Text>
                            <TouchableOpacity onPress={() => setShowCustomizeModal(false)}>
                                <Text style={styles.closeButton}>✕</Text>
                            </TouchableOpacity>
                        </View>

                        <ScrollView
                            style={styles.modalBody}
                            contentContainerStyle={styles.modalBodyContent}
                            showsVerticalScrollIndicator={true}
                        >
                            {selectedPackageForCustomization && (
                                <>
                                    <View style={styles.servicePreview}>
                                        <Image
                                            source={{
                                                uri: selectedPackageForCustomization.image_url || 'https://via.placeholder.com/150',
                                            }}
                                            style={styles.servicePreviewImage}
                                            resizeMode="cover"
                                        />
                                        <View style={styles.servicePreviewInfo}>
                                            <Text style={styles.servicePreviewName}>
                                                {language === 'fr'
                                                    ? selectedPackageForCustomization.name_fr
                                                    : selectedPackageForCustomization.name_en}
                                            </Text>
                                            <Text style={styles.servicePreviewBase}>
                                                {language === 'fr' ? 'Prix de base: ' : 'Base price: '}
                                                {formatCurrency(selectedPackageForCustomization.base_price)}
                                            </Text>
                                            <Text style={styles.servicePreviewBase}>
                                                {language === 'fr' ? 'Durée de base: ' : 'Base duration: '}
                                                {formatDuration(selectedPackageForCustomization.duration)}
                                            </Text>
                                        </View>
                                    </View>

                                    <View style={styles.formGroup}>
                                        <Text style={styles.label}>
                                            {language === 'fr' ? 'Votre prix (FCFA)' : 'Your Price (FCFA)'} *
                                        </Text>
                                        <TextInput
                                            style={styles.input}
                                            value={customization.price}
                                            onChangeText={(text) => setCustomization({ ...customization, price: text })}
                                            placeholder="25000"
                                            keyboardType="numeric"
                                        />
                                    </View>

                                    <View style={styles.formGroup}>
                                        <Text style={styles.label}>
                                            {language === 'fr' ? 'Durée (minutes)' : 'Duration (minutes)'} *
                                        </Text>
                                        <TextInput
                                            style={styles.input}
                                            value={customization.duration}
                                            onChangeText={(text) => setCustomization({ ...customization, duration: text })}
                                            placeholder="60"
                                            keyboardType="numeric"
                                        />
                                    </View>
                                </>
                            )}
                        </ScrollView>

                        <View style={styles.modalActions}>
                            {existingContractorPackage && (
                                <TouchableOpacity style={styles.removeButton} onPress={handleRemovePackage}>
                                    <Text style={styles.removeButtonText}>
                                        {language === 'fr' ? 'Supprimer' : 'Remove'}
                                    </Text>
                                </TouchableOpacity>
                            )}
                            <TouchableOpacity
                                style={[styles.saveButton, existingContractorPackage && { flex: 1, marginLeft: 12 }]}
                                onPress={handleSaveCustomization}
                            >
                                <Text style={styles.saveButtonText}>
                                    {existingContractorPackage
                                        ? (language === 'fr' ? 'Enregistrer' : 'Save')
                                        : (language === 'fr' ? 'Ajouter' : 'Add')}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    mainScrollView: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    centered: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 50,
        paddingBottom: 15,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    backButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    backIcon: {
        fontSize: 24,
        color: '#2D2D2D',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#2D2D2D',
    },
    descriptionContainer: {
        paddingHorizontal: 20,
        paddingVertical: 12,
        backgroundColor: '#F9F9F9',
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
    },
    descriptionText: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
    },
    titleSection: {
        paddingHorizontal: 20,
        paddingVertical: 15,
    },
    titleText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#2D2D2D',
        marginBottom: 4,
    },
    subtitleText: {
        fontSize: 14,
        color: '#666',
    },
    stickySearchContainer: {
        backgroundColor: '#FFFFFF',
        zIndex: 10,
        paddingTop: 10,
        paddingBottom: 5,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F9F9F9',
        marginHorizontal: 20,
        paddingHorizontal: 15,
        paddingVertical: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E0E0E0',
    },
    searchIcon: {
        fontSize: 18,
        marginRight: 10,
    },
    searchInput: {
        flex: 1,
        fontSize: 15,
        color: '#2D2D2D',
    },
    clearIcon: {
        fontSize: 18,
        color: '#999',
        padding: 5,
    },
    contentContainer: {
        paddingBottom: 40,
    },
    categoriesScroll: {
        paddingVertical: 10,
    },
    categoriesContent: {
        paddingHorizontal: 20,
    },
    categoryChip: {
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 25,
        backgroundColor: '#F9F9F9',
        marginRight: 12,
        borderWidth: 1,
        borderColor: '#E0E0E0',
    },
    categoryChipActive: {
        backgroundColor: '#2D2D2D',
        borderColor: '#2D2D2D',
    },
    categoryChipText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#666',
    },
    categoryChipTextActive: {
        color: '#FFFFFF',
    },
    servicesContent: {
        padding: 20,
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
    },
    emptyText: {
        fontSize: 16,
        color: '#999',
    },
    serviceCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        marginBottom: 16,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#E0E0E0',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    imageContainer: {
        position: 'relative',
        width: '100%',
        height: 180,
        backgroundColor: '#F0F0F0',
    },
    serviceImage: {
        width: '100%',
        height: '100%',
    },
    checkmarkBadge: {
        position: 'absolute',
        top: 12,
        right: 12,
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#4CAF50',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
        elevation: 3,
    },
    checkmark: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: 'bold',
    },
    categoryBadge: {
        position: 'absolute',
        top: 12,
        left: 12,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 15,
        backgroundColor: 'rgba(0,0,0,0.6)',
    },
    categoryBadgeText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '600',
    },
    serviceInfo: {
        padding: 12,
    },
    serviceName: {
        fontSize: 15,
        fontWeight: '600',
        color: '#2D2D2D',
        marginBottom: 4,
        lineHeight: 20,
    },
    serviceDescription: {
        fontSize: 13,
        color: '#666',
        marginBottom: 8,
        lineHeight: 18,
    },
    serviceDetails: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    servicePrice: {
        fontSize: 16,
        fontWeight: '700',
        color: '#FF6B6B',
    },
    serviceMeta: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    serviceMetaText: {
        fontSize: 13,
        color: '#666',
        marginLeft: 4,
    },
    selectedBadge: {
        marginTop: 8,
        paddingHorizontal: 8,
        paddingVertical: 4,
        backgroundColor: '#E8F5E9',
        borderRadius: 6,
        alignSelf: 'flex-start',
    },
    selectedBadgeText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#4CAF50',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        maxHeight: '80%',
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#2D2D2D',
    },
    closeButton: {
        fontSize: 24,
        color: '#999',
        padding: 5,
    },
    modalBody: {
        maxHeight: 350,
    },
    modalBodyContent: {
        paddingHorizontal: 20,
        paddingBottom: 20,
    },
    servicePreview: {
        flexDirection: 'row',
        backgroundColor: '#F9F9F9',
        borderRadius: 12,
        padding: 12,
        marginTop: 20,
        marginBottom: 24,
    },
    servicePreviewImage: {
        width: 80,
        height: 80,
        borderRadius: 8,
        backgroundColor: '#E0E0E0',
    },
    servicePreviewInfo: {
        flex: 1,
        marginLeft: 12,
        justifyContent: 'center',
    },
    servicePreviewName: {
        fontSize: 15,
        fontWeight: '600',
        color: '#2D2D2D',
        marginBottom: 4,
    },
    servicePreviewBase: {
        fontSize: 13,
        color: '#666',
        marginBottom: 2,
    },
    formGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#2D2D2D',
        marginBottom: 8,
    },
    input: {
        backgroundColor: '#F9F9F9',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E0E0E0',
        paddingHorizontal: 16,
        paddingVertical: 14,
        fontSize: 15,
        color: '#2D2D2D',
    },
    modalActions: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 30,
        gap: 12,
        backgroundColor: '#FFFFFF',
    },
    removeButton: {
        flex: 1,
        backgroundColor: '#FFEBEE',
        borderRadius: 12,
        paddingVertical: 16,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#FF6B6B',
    },
    removeButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FF6B6B',
    },
    saveButton: {
        flex: 2,
        backgroundColor: '#2D2D2D',
        borderRadius: 12,
        paddingVertical: 16,
        alignItems: 'center',
    },
    saveButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFFFFF',
    },
});
