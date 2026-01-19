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
  servicesApi,
  servicePackagesApi,
  categoriesApi,
  type ContractorService,
  type Service,
  type CategoryTranslation as Category,
} from '../../services/api';

// TODO: Move to models
interface Package {
  id: string;
  nameFr: string; // CamelCase from API
  nameEn: string;
  name_fr?: string; // SnakeCase fallback
  name_en?: string;
  basePrice: number;
  baseDuration: number;
  images?: string[];
  descriptionFr?: string;
  descriptionEn?: string;
}

interface ContractorPackage {
  id: string; // row id
  package_id: string; // or packageId depending on API
  price: number;
  duration: number;
  is_active: boolean;
}

interface ContractorServicesScreenProps {
  onServiceAdded?: () => void;
  hideHeader?: boolean;
}

export const ContractorServicesScreen: React.FC<ContractorServicesScreenProps> = ({
  onServiceAdded,
  hideHeader = false,
}) => {
  const { normalizeFontSize, spacing } = useResponsive();
  const { language } = useI18n();
  const { user } = useAuth();
  const navigation = useNavigation<any>();

  const [loading, setLoading] = useState(true);
  const [contractorId, setContractorId] = useState<string | null>(null);
  const [contractorServices, setContractorServices] = useState<ContractorService[]>([]);
  const [allServices, setAllServices] = useState<Service[]>([]);

  // Package States
  const [allPackages, setAllPackages] = useState<Package[]>([]);
  const [contractorPackages, setContractorPackages] = useState<any[]>([]); // Using any for now as structure varies
  const [activeTab, setActiveTab] = useState<'services' | 'packages'>('services');

  const [categories, setCategories] = useState<Category[]>([]);

  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCustomizeModal, setShowCustomizeModal] = useState(false);

  // Selection State (Generic for both Service and Package)
  const [selectedItemForCustomization, setSelectedItemForCustomization] = useState<Service | Package | null>(null);
  const [existingContractorItem, setExistingContractorItem] = useState<ContractorService | any | null>(null);

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

      const [contractorServicesData, allServicesData, categoriesData, allPackagesData, contractorPackagesData] = await Promise.all([
        contractorApi.getServices(profile.id),
        servicesApi.getAll(),
        categoriesApi.getAll(),
        servicePackagesApi.getAll(),
        contractorApi.getPackages(profile.id),
      ]);

      setContractorServices(contractorServicesData);
      setAllServices(allServicesData);
      setCategories(categoriesData);
      setAllPackages(allPackagesData);
      setContractorPackages(contractorPackagesData);
    } catch (error) {
      console.error('Error loading data:', error);
      Alert.alert('Error', 'Failed to load services');
    } finally {
      setLoading(false);
    }
  };

  // Helpers
  const isServiceSelected = (serviceId: string): boolean => {
    return contractorServices.some((cs) => cs.service_id === serviceId);
  };

  const isPackageSelected = (packageId: string): boolean => {
    // Structure might be package_id or packageId based on API
    return contractorPackages.some((cp) => (cp.package_id || cp.packageId) === packageId);
  }

  const getContractorService = (serviceId: string): ContractorService | undefined => {
    return contractorServices.find((cs) => cs.service_id === serviceId);
  };

  const getContractorPackage = (packageId: string): ContractorPackage | undefined => {
    return contractorPackages.find((cp) => (cp.package_id || cp.packageId) === packageId);
  }

  const handleItemPress = (item: Service | Package) => {
    let existing;
    let basePrice;
    let baseDuration;

    // Determine type by checking if it has 'category' (Service) or 'services' list (Package) 
    // Or simply use activeTab
    if (activeTab === 'services') {
      const service = item as Service;
      existing = getContractorService(service.id);
      basePrice = service.base_price;
      baseDuration = service.duration;
    } else {
      const pkg = item as Package;
      existing = getContractorPackage(pkg.id);
      basePrice = pkg.basePrice;
      baseDuration = pkg.baseDuration;
    }

    if (existing) {
      setExistingContractorItem(existing);
      setCustomization({
        price: existing.price.toString(),
        duration: existing.duration.toString(),
      });
    } else {
      setExistingContractorItem(null);
      setCustomization({
        price: basePrice.toString(),
        duration: baseDuration.toString(),
      });
    }

    setSelectedItemForCustomization(item);
    setShowCustomizeModal(true);
  };

  const handleSaveCustomization = async () => {
    if (!contractorId || !selectedItemForCustomization) return;
    if (!customization.price || !customization.duration) {
      Alert.alert('Error', language === 'fr' ? 'Veuillez remplir tous les champs' : 'Please fill all fields');
      return;
    }

    try {
      if (activeTab === 'services') {
        // Service Logic
        if (existingContractorItem) {
          await contractorApi.updateService(existingContractorItem.id, {
            price: parseFloat(customization.price),
            duration: parseInt(customization.duration),
          });
        } else {
          await contractorApi.addService({
            contractor_id: contractorId,
            service_id: selectedItemForCustomization.id,
            price: parseFloat(customization.price),
            duration: parseInt(customization.duration),
          });
          if (onServiceAdded) onServiceAdded();
        }
      } else {
        // Package Logic
        if (existingContractorItem) {
          // Update Package
          // Assuming updatePackage takes id and dto
          await contractorApi.updatePackage(existingContractorItem.id, {
            price: parseFloat(customization.price),
            duration: parseInt(customization.duration),
          });
        } else {
          // Add Package
          await contractorApi.addPackage({
            contractor_id: contractorId,
            package_id: selectedItemForCustomization.id,
            price: parseFloat(customization.price),
            duration: parseInt(customization.duration),
          });
        }
      }

      setShowCustomizeModal(false);
      setSelectedItemForCustomization(null);
      setExistingContractorItem(null);
      setCustomization({ price: '', duration: '' });
      loadData();
    } catch (error) {
      console.error('Error saving item:', error);
      Alert.alert('Error', language === 'fr' ? 'Échec de la sauvegarde' : 'Failed to save');
    }
  };

  const handleRemoveItem = async () => {
    if (!existingContractorItem) return;

    Alert.alert(
      language === 'fr' ? 'Supprimer' : 'Remove',
      language === 'fr' ? 'Supprimer cet élément?' : 'Remove this item?',
      [
        { text: language === 'fr' ? 'Annuler' : 'Cancel', style: 'cancel' },
        {
          text: language === 'fr' ? 'Supprimer' : 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              if (activeTab === 'services') {
                await contractorApi.deleteService(existingContractorItem.id);
              } else {
                await contractorApi.deletePackage(existingContractorItem.id);
              }

              setShowCustomizeModal(false);
              setSelectedItemForCustomization(null);
              setExistingContractorItem(null);
              setCustomization({ price: '', duration: '' });
              loadData();
            } catch (error) {
              console.error('Error deleting item:', error);
            }
          },
        },
      ]
    );
  };

  const getFilteredItems = (): (Service | Package)[] => {
    if (activeTab === 'services') {
      let filtered = allServices;
      if (selectedCategory !== 'ALL') {
        filtered = filtered.filter((service) => service.category === selectedCategory);
      }
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        filtered = filtered.filter((service) => {
          const name = language === 'fr' ? service.name_fr : service.name_en;
          return name.toLowerCase().includes(query);
        });
      }
      return filtered;
    } else {
      let filtered = allPackages;
      // Packages might have categories too, but let's assume ALL for now or filter if needed
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        filtered = filtered.filter((pkg) => {
          // Handle mixed case API
          const nameFr = pkg.nameFr || pkg.name_fr || '';
          const nameEn = pkg.nameEn || pkg.name_en || '';
          const name = language === 'fr' ? nameFr : nameEn;
          return name.toLowerCase().includes(query);
        });
      }
      return filtered;
    }
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

  const filteredItems = getFilteredItems();
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
            {language === 'fr' ? 'Offres' : 'Offerings'}
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
                  ? 'Gérer vos services et packages'
                  : 'Manage your services and packages'}
              </Text>
            </View>
          )}

          <View style={styles.titleSection}>
            {/* Tabs */}
            <View style={styles.tabsContainer}>
              <TouchableOpacity
                style={[styles.tabButton, activeTab === 'services' && styles.tabMenuActive]}
                onPress={() => setActiveTab('services')}
              >
                <Text style={[styles.tabText, activeTab === 'services' && styles.tabTextActive]}>
                  {language === 'fr' ? 'Services' : 'Services'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tabButton, activeTab === 'packages' && styles.tabMenuActive]}
                onPress={() => setActiveTab('packages')}
              >
                <Text style={[styles.tabText, activeTab === 'packages' && styles.tabTextActive]}>
                  {language === 'fr' ? 'Packages' : 'Packages'}
                </Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.subtitleText}>
              {language === 'fr'
                ? 'Appuyez pour ajouter ou modifier'
                : 'Tap to add or edit'}
            </Text>
          </View>
        </View>

        {/* Search Bar (Sticky) */}
        <View style={styles.stickySearchContainer}>
          <View style={styles.searchContainer}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              style={styles.searchInput}
              placeholder={language === 'fr' ? 'Rechercher...' : 'Search...'}
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
          {/* Category Filters (Only for Services for now) */}
          {activeTab === 'services' && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.categoriesScroll}
              contentContainerStyle={styles.categoriesContent}
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
                    {language === 'fr' ? (category.name_fr || '') : (category.name_en || '')}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}

          {/* Grid */}
          <View style={styles.servicesContent}>
            {filteredItems.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>
                  {language === 'fr' ? 'Aucun élément trouvé' : 'No items found'}
                </Text>
              </View>
            ) : (
              // @ts-ignore
              filteredItems.map((item) => {
                const isService = activeTab === 'services';
                const isSelected = isService
                  ? isServiceSelected(item.id)
                  : isPackageSelected(item.id);

                const contractorItem = isService
                  ? getContractorService(item.id)
                  : getContractorPackage(item.id);

                // Name handling
                let name = '';
                let basePrice = 0;
                let duration = 0;
                let imageUri = 'https://via.placeholder.com/150';

                if (isService) {
                  const s = item as Service;
                  name = language === 'fr' ? s.name_fr : s.name_en;
                  basePrice = s.base_price;
                  duration = s.duration;
                  imageUri = s.images?.[0] || imageUri;
                } else {
                  const p = item as Package;
                  const nameFr = p.nameFr || p.name_fr;
                  const nameEn = p.nameEn || p.name_en;
                  name = language === 'fr' ? nameFr : nameEn;
                  basePrice = p.basePrice || 0; // Assuming basePrice exists on P
                  duration = p.baseDuration || 0;
                  imageUri = p.images?.[0] || imageUri;
                }

                return (
                  <TouchableOpacity
                    key={item.id}
                    style={styles.serviceCard}
                    onPress={() => handleItemPress(item)}
                    activeOpacity={0.7}
                  >
                    {/* Image */}
                    <View style={styles.imageContainer}>
                      <Image
                        source={{ uri: imageUri }}
                        style={styles.serviceImage}
                        resizeMode="cover"
                      />
                      {isSelected && (
                        <View style={styles.checkmarkBadge}>
                          <Text style={styles.checkmark}>✓</Text>
                        </View>
                      )}
                    </View>

                    {/* Info */}
                    <View style={styles.serviceInfo}>
                      <Text style={styles.serviceName} numberOfLines={2}>
                        {name}
                      </Text>

                      <View style={styles.serviceDetails}>
                        <Text style={styles.servicePrice}>
                          {isSelected && contractorItem
                            ? formatCurrency(contractorItem.price)
                            : formatCurrency(basePrice)}
                        </Text>
                        <View style={styles.serviceMeta}>
                          <Text style={styles.serviceMetaText}>
                            ⏱ {isSelected && contractorItem
                              ? formatDuration(contractorItem.duration)
                              : formatDuration(duration)}
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
                {existingContractorItem
                  ? (language === 'fr' ? 'Modifier' : 'Edit')
                  : (language === 'fr' ? 'Ajouter' : 'Add')}
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
              {selectedItemForCustomization && (
                <>
                  {/* Preview */}
                  <View style={styles.servicePreview}>
                    {/* Need to safely access props based on type */}
                    {(() => {
                      const isService = activeTab === 'services';
                      let name = '';
                      let basePrice = 0;
                      let duration = 0;
                      let imageUri = 'https://via.placeholder.com/150';

                      if (isService) {
                        const s = selectedItemForCustomization as Service;
                        name = language === 'fr' ? s.name_fr : s.name_en;
                        basePrice = s.base_price;
                        duration = s.duration;
                        imageUri = s.images?.[0] || imageUri;
                      } else {
                        const p = selectedItemForCustomization as Package;
                        const nameFr = p.nameFr || p.name_fr;
                        const nameEn = p.nameEn || p.name_en;
                        name = language === 'fr' ? nameFr : nameEn;
                        basePrice = p.basePrice || 0;
                        duration = p.baseDuration || 0;
                        imageUri = p.images?.[0] || imageUri;
                      }

                      return (
                        <>
                          <Image
                            source={{ uri: imageUri }}
                            style={styles.servicePreviewImage}
                            resizeMode="cover"
                          />
                          <View style={styles.servicePreviewInfo}>
                            <Text style={styles.servicePreviewName}>{name}</Text>
                            <Text style={styles.servicePreviewBase}>
                              {language === 'fr' ? 'Prix de base: ' : 'Base price: '}
                              {formatCurrency(basePrice)}
                            </Text>
                            <Text style={styles.servicePreviewBase}>
                              {language === 'fr' ? 'Durée de base: ' : 'Base duration: '}
                              {formatDuration(duration)}
                            </Text>
                          </View>
                        </>
                      );
                    })()}
                  </View>

                  {/* Customization Form */}
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

            {/* Modal Actions */}
            <View style={styles.modalActions}>
              {existingContractorItem && (
                <TouchableOpacity style={styles.removeButton} onPress={handleRemoveItem}>
                  <Text style={styles.removeButtonText}>
                    {language === 'fr' ? 'Supprimer' : 'Remove'}
                  </Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={[styles.saveButton, existingContractorItem && { flex: 1, marginLeft: 12 }]}
                onPress={handleSaveCustomization}
              >
                <Text style={styles.saveButtonText}>
                  {existingContractorItem
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
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#F0F0F0',
    borderRadius: 8,
    padding: 4,
    marginBottom: 16,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 6,
  },
  tabMenuActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  tabTextActive: {
    color: '#2D2D2D',
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
