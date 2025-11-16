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
  categoriesApi,
  type ContractorService,
  type Service,
  type CategoryTranslation as Category,
} from '../../services/api';

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
  const [categories, setCategories] = useState<Category[]>([]);

  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCustomizeModal, setShowCustomizeModal] = useState(false);
  const [selectedServiceForCustomization, setSelectedServiceForCustomization] = useState<Service | null>(null);
  const [existingContractorService, setExistingContractorService] = useState<ContractorService | null>(null);

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

      const [contractorServicesData, allServicesData, categoriesData] = await Promise.all([
        contractorApi.getServices(profile.id),
        servicesApi.getAll(),
        categoriesApi.getAll(),
      ]);

      setContractorServices(contractorServicesData);
      setAllServices(allServicesData);
      setCategories(categoriesData);
    } catch (error) {
      console.error('Error loading data:', error);
      Alert.alert('Error', 'Failed to load services');
    } finally {
      setLoading(false);
    }
  };

  const isServiceSelected = (serviceId: string): boolean => {
    return contractorServices.some((cs) => cs.service_id === serviceId);
  };

  const getContractorService = (serviceId: string): ContractorService | undefined => {
    return contractorServices.find((cs) => cs.service_id === serviceId);
  };

  const handleServicePress = (service: Service) => {
    const existing = getContractorService(service.id);

    if (existing) {
      // Service already added, open for editing
      setExistingContractorService(existing);
      setCustomization({
        price: existing.price.toString(),
        duration: existing.duration.toString(),
      });
    } else {
      // New service, show with base price
      setExistingContractorService(null);
      setCustomization({
        price: service.base_price.toString(),
        duration: service.duration.toString(),
      });
    }

    setSelectedServiceForCustomization(service);
    setShowCustomizeModal(true);
  };

  const handleSaveCustomization = async () => {
    if (!contractorId || !selectedServiceForCustomization) return;
    if (!customization.price || !customization.duration) {
      Alert.alert('Error', language === 'fr' ? 'Veuillez remplir tous les champs' : 'Please fill all fields');
      return;
    }

    try {
      if (existingContractorService) {
        // Update existing service
        await contractorApi.updateService(existingContractorService.id, {
          price: parseFloat(customization.price),
          duration: parseInt(customization.duration),
        });
      } else {
        // Add new service
        await contractorApi.addService({
          contractor_id: contractorId,
          service_id: selectedServiceForCustomization.id,
          price: parseFloat(customization.price),
          duration: parseInt(customization.duration),
        });

        // Call the callback if provided (for first-time service addition)
        if (onServiceAdded) {
          onServiceAdded();
        }
      }

      setShowCustomizeModal(false);
      setSelectedServiceForCustomization(null);
      setExistingContractorService(null);
      setCustomization({ price: '', duration: '' });
      loadData();
    } catch (error) {
      console.error('Error saving service:', error);
      Alert.alert('Error', language === 'fr' ? 'Échec de la sauvegarde' : 'Failed to save');
    }
  };

  const handleRemoveService = async () => {
    if (!existingContractorService) return;

    Alert.alert(
      language === 'fr' ? 'Supprimer' : 'Remove',
      language === 'fr' ? 'Supprimer ce service?' : 'Remove this service?',
      [
        { text: language === 'fr' ? 'Annuler' : 'Cancel', style: 'cancel' },
        {
          text: language === 'fr' ? 'Supprimer' : 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await contractorApi.deleteService(existingContractorService.id);
              setShowCustomizeModal(false);
              setSelectedServiceForCustomization(null);
              setExistingContractorService(null);
              setCustomization({ price: '', duration: '' });
              loadData();
            } catch (error) {
              console.error('Error deleting service:', error);
            }
          },
        },
      ]
    );
  };

  const getFilteredServices = (): Service[] => {
    let filtered = allServices;

    // Filter by category
    if (selectedCategory !== 'ALL') {
      filtered = filtered.filter((service) => service.category === selectedCategory);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((service) => {
        const name = language === 'fr' ? service.name_fr : service.name_en;
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

  const filteredServices = getFilteredServices();

  return (
    <View style={styles.container}>
      {/* Header */}
      {!hideHeader && (
        <>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <Text style={styles.backIcon}>←</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>
              {language === 'fr' ? 'Mes Services' : 'My Services'}
            </Text>
            <View style={{ width: 40 }} />
          </View>

          {/* Description */}
          <View style={styles.descriptionContainer}>
            <Text style={styles.descriptionText}>
              {language === 'fr'
                ? 'Ajouter, modifier ou supprimer vos services'
                : 'Add, edit or remove your services'}
            </Text>
          </View>
        </>
      )}

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder={language === 'fr' ? 'Rechercher un service...' : 'Search for a service...'}
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

      {/* Category Filters */}
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
            {language === 'fr' ? 'Tous' : 'All Services'}
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

      {/* Services Grid */}
      <ScrollView style={styles.servicesScroll} contentContainerStyle={styles.servicesContent}>
        {filteredServices.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>
              {language === 'fr' ? 'Aucun service trouvé' : 'No services found'}
            </Text>
          </View>
        ) : (
          filteredServices.map((service) => {
            const isSelected = isServiceSelected(service.id);
            const contractorService = getContractorService(service.id);

            return (
              <TouchableOpacity
                key={service.id}
                style={styles.serviceCard}
                onPress={() => handleServicePress(service)}
                activeOpacity={0.7}
              >
                {/* Service Image */}
                <View style={styles.imageContainer}>
                  <Image
                    source={{ uri: service.images?.[0] || 'https://via.placeholder.com/150' }}
                    style={styles.serviceImage}
                    resizeMode="cover"
                  />
                  {isSelected && (
                    <View style={styles.checkmarkBadge}>
                      <Text style={styles.checkmark}>✓</Text>
                    </View>
                  )}
                </View>

                {/* Service Info */}
                <View style={styles.serviceInfo}>
                  <Text style={styles.serviceName} numberOfLines={2}>
                    {language === 'fr' ? service.name_fr : service.name_en}
                  </Text>

                  <View style={styles.serviceDetails}>
                    <Text style={styles.servicePrice}>
                      {isSelected && contractorService
                        ? formatCurrency(contractorService.price)
                        : formatCurrency(service.base_price)}
                    </Text>
                    <View style={styles.serviceMeta}>
                      <Text style={styles.serviceMetaText}>
                        ⏱ {isSelected && contractorService
                          ? formatDuration(contractorService.duration)
                          : formatDuration(service.duration)}
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
      </ScrollView>

      {/* Customization Modal */}
      <Modal visible={showCustomizeModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {existingContractorService
                  ? (language === 'fr' ? 'Modifier le service' : 'Edit Service')
                  : (language === 'fr' ? 'Ajouter le service' : 'Add Service')}
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
              {selectedServiceForCustomization && (
                <>
                  {/* Service Preview */}
                  <View style={styles.servicePreview}>
                    <Image
                      source={{
                        uri: selectedServiceForCustomization.images?.[0] || 'https://via.placeholder.com/150',
                      }}
                      style={styles.servicePreviewImage}
                      resizeMode="cover"
                    />
                    <View style={styles.servicePreviewInfo}>
                      <Text style={styles.servicePreviewName}>
                        {language === 'fr'
                          ? selectedServiceForCustomization.name_fr
                          : selectedServiceForCustomization.name_en}
                      </Text>
                      <Text style={styles.servicePreviewBase}>
                        {language === 'fr' ? 'Prix de base: ' : 'Base price: '}
                        {formatCurrency(selectedServiceForCustomization.base_price)}
                      </Text>
                      <Text style={styles.servicePreviewBase}>
                        {language === 'fr' ? 'Durée de base: ' : 'Base duration: '}
                        {formatDuration(selectedServiceForCustomization.duration)}
                      </Text>
                    </View>
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
              {existingContractorService && (
                <TouchableOpacity style={styles.removeButton} onPress={handleRemoveService}>
                  <Text style={styles.removeButtonText}>
                    {language === 'fr' ? 'Supprimer' : 'Remove'}
                  </Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={[styles.saveButton, existingContractorService && { flex: 1, marginLeft: 12 }]}
                onPress={handleSaveCustomization}
              >
                <Text style={styles.saveButtonText}>
                  {existingContractorService
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9F9F9',
    marginHorizontal: 20,
    marginVertical: 15,
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
  categoriesScroll: {
    maxHeight: 50,
  },
  categoriesContent: {
    paddingHorizontal: 20,
    paddingBottom: 15,
  },
  categoryChip: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#F9F9F9',
    marginRight: 10,
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
  servicesScroll: {
    flex: 1,
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
  serviceInfo: {
    padding: 12,
  },
  serviceName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2D2D2D',
    marginBottom: 8,
    lineHeight: 20,
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
    fontSize: 15,
    fontWeight: '700',
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
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
