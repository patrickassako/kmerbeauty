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
  FlatList,
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
  type Category,
} from '../../services/api';

export const ContractorServicesScreen = () => {
  const { normalizeFontSize, spacing } = useResponsive();
  const { language } = useI18n();
  const { user } = useAuth();
  const navigation = useNavigation<any>();

  const [loading, setLoading] = useState(true);
  const [contractorId, setContractorId] = useState<string | null>(null);
  const [contractorServices, setContractorServices] = useState<ContractorService[]>([]);
  const [allServices, setAllServices] = useState<Service[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  const [showAddServiceModal, setShowAddServiceModal] = useState(false);
  const [showEditServiceModal, setShowEditServiceModal] = useState(false);
  const [selectedService, setSelectedService] = useState<ContractorService | null>(null);

  const [newService, setNewService] = useState({
    service_id: '',
    price: '',
    duration: '',
    description: '',
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
        servicesApi.getAllServices(),
        categoriesApi.getCategories(),
      ]);

      setContractorServices(contractorServicesData);
      setAllServices(allServicesData);
      setCategories(categoriesData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddService = async () => {
    if (!contractorId) return;
    if (!newService.service_id || !newService.price || !newService.duration) {
      Alert.alert('Error', 'Please fill all required fields');
      return;
    }

    try {
      await contractorApi.addService({
        contractor_id: contractorId,
        service_id: newService.service_id,
        price: parseFloat(newService.price),
        duration: parseInt(newService.duration),
        description: newService.description,
      });

      setShowAddServiceModal(false);
      setNewService({ service_id: '', price: '', duration: '', description: '' });
      loadData();
    } catch (error) {
      console.error('Error adding service:', error);
      Alert.alert('Error', 'Failed to add service');
    }
  };

  const handleEditService = async () => {
    if (!selectedService) return;
    if (!newService.price || !newService.duration) {
      Alert.alert('Error', 'Please fill all required fields');
      return;
    }

    try {
      await contractorApi.updateService(selectedService.id, {
        price: parseFloat(newService.price),
        duration: parseInt(newService.duration),
        description: newService.description,
      });

      setShowEditServiceModal(false);
      setSelectedService(null);
      setNewService({ service_id: '', price: '', duration: '', description: '' });
      loadData();
    } catch (error) {
      console.error('Error updating service:', error);
      Alert.alert('Error', 'Failed to update service');
    }
  };

  const handleDeleteService = async (serviceId: string) => {
    Alert.alert(
      language === 'fr' ? 'Supprimer' : 'Delete',
      language === 'fr' ? 'Supprimer ce service?' : 'Delete this service?',
      [
        { text: language === 'fr' ? 'Annuler' : 'Cancel', style: 'cancel' },
        {
          text: language === 'fr' ? 'Supprimer' : 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await contractorApi.deleteService(serviceId);
              loadData();
            } catch (error) {
              console.error('Error deleting service:', error);
            }
          },
        },
      ]
    );
  };

  const handleToggleActive = async (service: ContractorService) => {
    try {
      await contractorApi.updateService(service.id, {
        is_active: !service.is_active,
      });
      loadData();
    } catch (error) {
      console.error('Error toggling service:', error);
    }
  };

  const openEditModal = (service: ContractorService) => {
    setSelectedService(service);
    setNewService({
      service_id: service.service_id,
      price: service.price.toString(),
      duration: service.duration.toString(),
      description: service.description || '',
    });
    setShowEditServiceModal(true);
  };

  const getServicesGroupedByCategory = () => {
    const grouped: { [key: string]: ContractorService[] } = {};

    contractorServices.forEach((contractorService) => {
      // Get category string from service
      const categoryString = contractorService.service?.category || 'OTHER';

      // Find category details from categories array
      const category = categories.find((cat) => cat.category === categoryString);

      const categoryName = category
        ? (language === 'fr' ? category.name_fr : category.name_en)
        : 'Other';

      if (!grouped[categoryName]) {
        grouped[categoryName] = [];
      }

      grouped[categoryName].push(contractorService);
    });

    return grouped;
  };

  const getAvailableServices = () => {
    const addedServiceIds = contractorServices.map((cs) => cs.service_id);
    return allServices.filter((service) => !addedServiceIds.includes(service.id));
  };

  const formatCurrency = (amount: number) => {
    return `${amount.toLocaleString('fr-FR')} FCFA`;
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#2D2D2D" />
      </View>
    );
  }

  const groupedServices = getServicesGroupedByCategory();

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { padding: spacing(2.5), paddingTop: spacing(6) }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={{ fontSize: normalizeFontSize(24) }}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { fontSize: normalizeFontSize(18) }]}>
          Services Provided by Me
        </Text>
        <TouchableOpacity onPress={() => setShowAddServiceModal(true)}>
          <Text style={[styles.addIcon, { fontSize: normalizeFontSize(24) }]}>+</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView}>
        {contractorServices.length === 0 ? (
          <View style={[styles.empty, { padding: spacing(4) }]}>
            <Text style={[styles.emptyText, { fontSize: normalizeFontSize(16) }]}>
              {language === 'fr'
                ? 'Aucun service ajouté. Appuyez sur + pour ajouter.'
                : 'No services added. Tap + to add.'}
            </Text>
          </View>
        ) : (
          Object.entries(groupedServices).map(([categoryName, services]) => (
            <View key={categoryName} style={[styles.categorySection, { padding: spacing(2.5) }]}>
              <Text style={[styles.categoryTitle, { fontSize: normalizeFontSize(18) }]}>
                {categoryName}
              </Text>

              {services.map((service) => (
                <TouchableOpacity
                  key={service.id}
                  style={[
                    styles.serviceCard,
                    { padding: spacing(2), marginTop: spacing(1.5) },
                    !service.is_active && styles.serviceCardInactive,
                  ]}
                  onPress={() => openEditModal(service)}
                  onLongPress={() => handleDeleteService(service.id)}
                >
                  <View style={styles.serviceHeader}>
                    <View style={{ flex: 1 }}>
                      <Text
                        style={[
                          styles.serviceName,
                          { fontSize: normalizeFontSize(16) },
                          !service.is_active && styles.textInactive,
                        ]}
                      >
                        {language === 'fr' ? service.service?.name_fr : service.service?.name_en}
                      </Text>
                      <View style={[styles.serviceInfo, { marginTop: spacing(1) }]}>
                        <Text
                          style={[
                            styles.servicePrice,
                            { fontSize: normalizeFontSize(14) },
                            !service.is_active && styles.textInactive,
                          ]}
                        >
                          {formatCurrency(service.price)}
                        </Text>
                        <Text
                          style={[
                            styles.serviceDuration,
                            { fontSize: normalizeFontSize(14), marginLeft: spacing(2) },
                            !service.is_active && styles.textInactive,
                          ]}
                        >
                          ⏱ {service.duration}h
                        </Text>
                      </View>
                      {service.description && (
                        <Text
                          style={[
                            styles.serviceDescription,
                            { fontSize: normalizeFontSize(12), marginTop: spacing(0.5) },
                          ]}
                          numberOfLines={2}
                        >
                          {service.description}
                        </Text>
                      )}
                    </View>

                    <TouchableOpacity
                      style={[styles.toggleButton, { padding: spacing(0.5) }]}
                      onPress={() => handleToggleActive(service)}
                    >
                      <Text style={{ fontSize: normalizeFontSize(12) }}>
                        {service.is_active ? '✅' : '⭕'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          ))
        )}
      </ScrollView>

      {/* Add Service Modal */}
      <Modal visible={showAddServiceModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <ScrollView contentContainerStyle={{ flex: 1, justifyContent: 'center' }}>
            <View style={[styles.modalContent, { padding: spacing(3), margin: spacing(2) }]}>
              <Text style={[styles.modalTitle, { fontSize: normalizeFontSize(18) }]}>
                Add Service
              </Text>

              <Text style={[styles.label, { fontSize: normalizeFontSize(14), marginTop: spacing(2) }]}>
                Select Service *
              </Text>
              <ScrollView
                style={[styles.serviceList, { maxHeight: 200 }]}
                nestedScrollEnabled
              >
                {getAvailableServices().map((service) => (
                  <TouchableOpacity
                    key={service.id}
                    style={[
                      styles.serviceOption,
                      { padding: spacing(1.5) },
                      newService.service_id === service.id && styles.serviceOptionSelected,
                    ]}
                    onPress={() => setNewService({ ...newService, service_id: service.id })}
                  >
                    <Text
                      style={[
                        styles.serviceOptionText,
                        { fontSize: normalizeFontSize(14) },
                        newService.service_id === service.id && styles.serviceOptionTextSelected,
                      ]}
                    >
                      {language === 'fr' ? service.name_fr : service.name_en}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <Text style={[styles.label, { fontSize: normalizeFontSize(14), marginTop: spacing(2) }]}>
                Price (FCFA) *
              </Text>
              <TextInput
                style={[styles.input, { padding: spacing(1.5), fontSize: normalizeFontSize(14) }]}
                value={newService.price}
                onChangeText={(text) => setNewService({ ...newService, price: text })}
                placeholder="10000"
                keyboardType="numeric"
              />

              <Text style={[styles.label, { fontSize: normalizeFontSize(14), marginTop: spacing(2) }]}>
                Duration (hours) *
              </Text>
              <TextInput
                style={[styles.input, { padding: spacing(1.5), fontSize: normalizeFontSize(14) }]}
                value={newService.duration}
                onChangeText={(text) => setNewService({ ...newService, duration: text })}
                placeholder="2"
                keyboardType="numeric"
              />

              <Text style={[styles.label, { fontSize: normalizeFontSize(14), marginTop: spacing(2) }]}>
                Description (optional)
              </Text>
              <TextInput
                style={[
                  styles.input,
                  styles.textArea,
                  { padding: spacing(1.5), fontSize: normalizeFontSize(14) },
                ]}
                value={newService.description}
                onChangeText={(text) => setNewService({ ...newService, description: text })}
                placeholder="Additional details..."
                multiline
                numberOfLines={3}
              />

              <View style={[styles.modalButtons, { marginTop: spacing(3) }]}>
                <TouchableOpacity
                  style={[styles.modalButton, { padding: spacing(1.5), flex: 1, marginRight: spacing(1) }]}
                  onPress={() => {
                    setShowAddServiceModal(false);
                    setNewService({ service_id: '', price: '', duration: '', description: '' });
                  }}
                >
                  <Text style={[styles.modalButtonText, { fontSize: normalizeFontSize(14) }]}>
                    Cancel
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.modalButton,
                    styles.modalButtonPrimary,
                    { padding: spacing(1.5), flex: 1, marginLeft: spacing(1) },
                  ]}
                  onPress={handleAddService}
                >
                  <Text
                    style={[
                      styles.modalButtonText,
                      styles.modalButtonTextPrimary,
                      { fontSize: normalizeFontSize(14) },
                    ]}
                  >
                    Add
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* Edit Service Modal */}
      <Modal visible={showEditServiceModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { padding: spacing(3), margin: spacing(2) }]}>
            <Text style={[styles.modalTitle, { fontSize: normalizeFontSize(18) }]}>
              Edit Service
            </Text>

            <Text style={[styles.label, { fontSize: normalizeFontSize(14), marginTop: spacing(2) }]}>
              Service
            </Text>
            <Text style={[styles.serviceNameDisplay, { fontSize: normalizeFontSize(16), padding: spacing(1.5) }]}>
              {selectedService &&
                (language === 'fr'
                  ? selectedService.service?.name_fr
                  : selectedService.service?.name_en)}
            </Text>

            <Text style={[styles.label, { fontSize: normalizeFontSize(14), marginTop: spacing(2) }]}>
              Price (FCFA) *
            </Text>
            <TextInput
              style={[styles.input, { padding: spacing(1.5), fontSize: normalizeFontSize(14) }]}
              value={newService.price}
              onChangeText={(text) => setNewService({ ...newService, price: text })}
              placeholder="10000"
              keyboardType="numeric"
            />

            <Text style={[styles.label, { fontSize: normalizeFontSize(14), marginTop: spacing(2) }]}>
              Duration (hours) *
            </Text>
            <TextInput
              style={[styles.input, { padding: spacing(1.5), fontSize: normalizeFontSize(14) }]}
              value={newService.duration}
              onChangeText={(text) => setNewService({ ...newService, duration: text })}
              placeholder="2"
              keyboardType="numeric"
            />

            <Text style={[styles.label, { fontSize: normalizeFontSize(14), marginTop: spacing(2) }]}>
              Description (optional)
            </Text>
            <TextInput
              style={[
                styles.input,
                styles.textArea,
                { padding: spacing(1.5), fontSize: normalizeFontSize(14) },
              ]}
              value={newService.description}
              onChangeText={(text) => setNewService({ ...newService, description: text })}
              placeholder="Additional details..."
              multiline
              numberOfLines={3}
            />

            <View style={[styles.modalButtons, { marginTop: spacing(3) }]}>
              <TouchableOpacity
                style={[styles.modalButton, { padding: spacing(1.5), flex: 1, marginRight: spacing(1) }]}
                onPress={() => {
                  setShowEditServiceModal(false);
                  setSelectedService(null);
                  setNewService({ service_id: '', price: '', duration: '', description: '' });
                }}
              >
                <Text style={[styles.modalButtonText, { fontSize: normalizeFontSize(14) }]}>
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalButton,
                  styles.modalButtonPrimary,
                  { padding: spacing(1.5), flex: 1, marginLeft: spacing(1) },
                ]}
                onPress={handleEditService}
              >
                <Text
                  style={[
                    styles.modalButtonText,
                    styles.modalButtonTextPrimary,
                    { fontSize: normalizeFontSize(14) },
                  ]}
                >
                  Save
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
    backgroundColor: '#F9F9F9',
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFF',
  },
  title: {
    fontWeight: 'bold',
    flex: 1,
    marginLeft: 15,
  },
  addIcon: {
    fontWeight: 'bold',
    color: '#2D2D2D',
  },
  scrollView: {
    flex: 1,
  },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    color: '#999',
    textAlign: 'center',
  },
  categorySection: {
    backgroundColor: '#FFF',
    marginBottom: 15,
  },
  categoryTitle: {
    fontWeight: 'bold',
    color: '#2D2D2D',
  },
  serviceCard: {
    backgroundColor: '#F9F9F9',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  serviceCardInactive: {
    opacity: 0.5,
  },
  serviceHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  serviceName: {
    fontWeight: '600',
    color: '#2D2D2D',
  },
  serviceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  servicePrice: {
    fontWeight: 'bold',
    color: '#FF6B6B',
  },
  serviceDuration: {
    color: '#666',
  },
  serviceDescription: {
    color: '#999',
    lineHeight: 18,
  },
  textInactive: {
    color: '#999',
  },
  toggleButton: {
    marginLeft: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    maxHeight: '90%',
  },
  modalTitle: {
    fontWeight: 'bold',
    textAlign: 'center',
  },
  label: {
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F9F9F9',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  serviceList: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
  },
  serviceOption: {
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  serviceOptionSelected: {
    backgroundColor: '#2D2D2D',
  },
  serviceOptionText: {
    color: '#2D2D2D',
  },
  serviceOptionTextSelected: {
    color: '#FFF',
  },
  serviceNameDisplay: {
    fontWeight: '600',
    color: '#2D2D2D',
    backgroundColor: '#F9F9F9',
    borderRadius: 8,
  },
  modalButtons: {
    flexDirection: 'row',
  },
  modalButton: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    alignItems: 'center',
  },
  modalButtonPrimary: {
    backgroundColor: '#2D2D2D',
    borderColor: '#2D2D2D',
  },
  modalButtonText: {
    color: '#2D2D2D',
    fontWeight: '600',
  },
  modalButtonTextPrimary: {
    color: '#FFF',
  },
});
