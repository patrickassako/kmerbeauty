import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { useResponsive } from '../hooks/useResponsive';
import { useI18n } from '../i18n/I18nContext';
import { useCategories } from '../hooks/useCategories';

export interface SearchFilters {
  searchText?: string;
  category?: string;
  city?: string;
  quarter?: string;
  maxDistance?: number;
  providerType?: 'all' | 'therapist' | 'salon';
  sortBy?: 'price_asc' | 'price_desc' | 'rating' | 'distance';
}

interface AdvancedSearchModalProps {
  visible: boolean;
  onClose: () => void;
  onApply: (filters: SearchFilters) => void;
  initialFilters?: SearchFilters;
}

export const AdvancedSearchModal: React.FC<AdvancedSearchModalProps> = ({
  visible,
  onClose,
  onApply,
  initialFilters,
}) => {
  const { normalizeFontSize, spacing } = useResponsive();
  const { language } = useI18n();
  const { categories: dbCategories, loading: categoriesLoading } = useCategories();

  const [searchText, setSearchText] = useState(initialFilters?.searchText || '');
  const [category, setCategory] = useState(initialFilters?.category || '');
  const [city, setCity] = useState(initialFilters?.city || '');
  const [quarter, setQuarter] = useState(initialFilters?.quarter || '');
  const [maxDistance, setMaxDistance] = useState(initialFilters?.maxDistance?.toString() || '');
  const [providerType, setProviderType] = useState<'all' | 'therapist' | 'salon'>(
    initialFilters?.providerType || 'all'
  );
  const [sortBy, setSortBy] = useState<SearchFilters['sortBy']>(
    initialFilters?.sortBy || 'rating'
  );

  const cities = ['Douala', 'Yaoundé', 'Bafoussam', 'Garoua', 'Bamenda'];
  const quarters = ['Akwa', 'Bonanjo', 'Bali', 'Bonapriso', 'Deido', 'Logpom', 'New Bell'];

  // Icônes pour les catégories
  const categoryIcons: Record<string, string> = {
    'WELLNESS_MASSAGE': '💆',
    'FACIAL_CARE': '🧖',
    'HAIR_CARE': '💇',
    'NAIL_CARE': '💅',
    'BODY_CARE': '🧴',
    'MAKEUP': '💄',
    'AESTHETIC': '✨',
    'OTHER': '🌟',
  };

  const providerTypes: Array<{ value: 'all' | 'therapist' | 'salon'; label: string }> = [
    { value: 'all', label: language === 'fr' ? 'Tous' : 'All' },
    { value: 'therapist', label: language === 'fr' ? 'Thérapeutes' : 'Therapists' },
    { value: 'salon', label: language === 'fr' ? 'Instituts' : 'Salons' },
  ];

  const sortOptions: Array<{ value: SearchFilters['sortBy']; label: string }> = [
    { value: 'rating', label: language === 'fr' ? 'Mieux notés' : 'Best rated' },
    { value: 'price_asc', label: language === 'fr' ? 'Prix croissant' : 'Price ascending' },
    { value: 'price_desc', label: language === 'fr' ? 'Prix décroissant' : 'Price descending' },
    { value: 'distance', label: language === 'fr' ? 'Proximité' : 'Distance' },
  ];

  const handleApply = () => {
    const filters: SearchFilters = {
      searchText: searchText || undefined,
      category: category || undefined,
      city: city || undefined,
      quarter: quarter || undefined,
      maxDistance: maxDistance ? parseFloat(maxDistance) : undefined,
      providerType,
      sortBy,
    };
    onApply(filters);
    onClose();
  };

  const handleReset = () => {
    setSearchText('');
    setCategory('');
    setCity('');
    setQuarter('');
    setMaxDistance('');
    setProviderType('all');
    setSortBy('rating');
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { borderTopLeftRadius: spacing(3), borderTopRightRadius: spacing(3), paddingTop: spacing(3) }]}>
          {/* Header */}
          <View style={[styles.modalHeader, { paddingHorizontal: spacing(2.5), marginBottom: spacing(2) }]}>
            <Text style={[styles.modalTitle, { fontSize: normalizeFontSize(20) }]}>
              {language === 'fr' ? 'Recherche avancée' : 'Advanced Search'}
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={[styles.closeButton, { fontSize: normalizeFontSize(28) }]}>×</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.modalBody}
            contentContainerStyle={{ paddingHorizontal: spacing(2.5), paddingBottom: spacing(3) }}
            showsVerticalScrollIndicator={false}
          >
            {/* Recherche Texte */}
            <View style={[styles.filterSection, { marginBottom: spacing(3) }]}>
              <Text style={[styles.filterLabel, { fontSize: normalizeFontSize(14), marginBottom: spacing(1) }]}>
                {language === 'fr' ? 'Rechercher un service' : 'Search for a service'}
              </Text>
              <TextInput
                style={[
                  styles.input,
                  { paddingHorizontal: spacing(2), paddingVertical: spacing(1.5), borderRadius: spacing(1.5), fontSize: normalizeFontSize(14) },
                ]}
                placeholder={language === 'fr' ? 'Ex: Massage, Coiffure...' : 'E.g: Massage, Hair...'}
                value={searchText}
                onChangeText={setSearchText}
                autoCapitalize="none"
              />
            </View>

            {/* Catégorie */}
            <View style={[styles.filterSection, { marginBottom: spacing(3) }]}>
              <Text style={[styles.filterLabel, { fontSize: normalizeFontSize(14), marginBottom: spacing(1) }]}>
                {language === 'fr' ? 'Catégorie' : 'Category'}
              </Text>
              {categoriesLoading ? (
                <ActivityIndicator size="small" color="#000" />
              ) : (
                <View style={styles.chipContainer}>
                  {dbCategories.map((cat) => (
                    <TouchableOpacity
                      key={cat.category}
                      style={[
                        styles.chip,
                        category === cat.category && styles.chipSelected,
                        { paddingHorizontal: spacing(2), paddingVertical: spacing(1), borderRadius: spacing(2.5), marginRight: spacing(1), marginBottom: spacing(1) },
                      ]}
                      onPress={() => setCategory(category === cat.category ? '' : cat.category)}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          category === cat.category && styles.chipTextSelected,
                          { fontSize: normalizeFontSize(12) },
                        ]}
                      >
                        {categoryIcons[cat.category] || '🌟'} {language === 'fr' ? cat.name_fr : cat.name_en}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            {/* Ville */}
            <View style={[styles.filterSection, { marginBottom: spacing(3) }]}>
              <Text style={[styles.filterLabel, { fontSize: normalizeFontSize(14), marginBottom: spacing(1) }]}>
                {language === 'fr' ? 'Ville' : 'City'}
              </Text>
              <View style={styles.chipContainer}>
                {cities.map((cityOption) => (
                  <TouchableOpacity
                    key={cityOption}
                    style={[
                      styles.chip,
                      city === cityOption && styles.chipSelected,
                      { paddingHorizontal: spacing(2), paddingVertical: spacing(1), borderRadius: spacing(2.5), marginRight: spacing(1), marginBottom: spacing(1) },
                    ]}
                    onPress={() => setCity(city === cityOption ? '' : cityOption)}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        city === cityOption && styles.chipTextSelected,
                        { fontSize: normalizeFontSize(12) },
                      ]}
                    >
                      {cityOption}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Quartier */}
            <View style={[styles.filterSection, { marginBottom: spacing(3) }]}>
              <Text style={[styles.filterLabel, { fontSize: normalizeFontSize(14), marginBottom: spacing(1) }]}>
                {language === 'fr' ? 'Quartier' : 'Quarter'}
              </Text>
              <View style={styles.chipContainer}>
                {quarters.map((quarterOption) => (
                  <TouchableOpacity
                    key={quarterOption}
                    style={[
                      styles.chip,
                      quarter === quarterOption && styles.chipSelected,
                      { paddingHorizontal: spacing(2), paddingVertical: spacing(1), borderRadius: spacing(2.5), marginRight: spacing(1), marginBottom: spacing(1) },
                    ]}
                    onPress={() => setQuarter(quarter === quarterOption ? '' : quarterOption)}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        quarter === quarterOption && styles.chipTextSelected,
                        { fontSize: normalizeFontSize(12) },
                      ]}
                    >
                      {quarterOption}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Distance maximale */}
            <View style={[styles.filterSection, { marginBottom: spacing(3) }]}>
              <Text style={[styles.filterLabel, { fontSize: normalizeFontSize(14), marginBottom: spacing(1) }]}>
                {language === 'fr' ? 'Distance maximale (km)' : 'Max distance (km)'}
              </Text>
              <TextInput
                style={[
                  styles.input,
                  { paddingHorizontal: spacing(2), paddingVertical: spacing(1.5), borderRadius: spacing(1.5), fontSize: normalizeFontSize(14) },
                ]}
                placeholder={language === 'fr' ? 'Ex: 5' : 'E.g: 5'}
                keyboardType="numeric"
                value={maxDistance}
                onChangeText={setMaxDistance}
              />
            </View>

            {/* Type de prestataire */}
            <View style={[styles.filterSection, { marginBottom: spacing(3) }]}>
              <Text style={[styles.filterLabel, { fontSize: normalizeFontSize(14), marginBottom: spacing(1) }]}>
                {language === 'fr' ? 'Type de prestataire' : 'Provider type'}
              </Text>
              <View style={styles.chipContainer}>
                {providerTypes.map((type) => (
                  <TouchableOpacity
                    key={type.value}
                    style={[
                      styles.chip,
                      providerType === type.value && styles.chipSelected,
                      { paddingHorizontal: spacing(2), paddingVertical: spacing(1), borderRadius: spacing(2.5), marginRight: spacing(1), marginBottom: spacing(1) },
                    ]}
                    onPress={() => setProviderType(type.value)}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        providerType === type.value && styles.chipTextSelected,
                        { fontSize: normalizeFontSize(12) },
                      ]}
                    >
                      {type.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Tri */}
            <View style={[styles.filterSection, { marginBottom: spacing(2) }]}>
              <Text style={[styles.filterLabel, { fontSize: normalizeFontSize(14), marginBottom: spacing(1) }]}>
                {language === 'fr' ? 'Trier par' : 'Sort by'}
              </Text>
              {sortOptions.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.radioOption,
                    { paddingVertical: spacing(1.5), borderBottomWidth: 1 },
                  ]}
                  onPress={() => setSortBy(option.value)}
                >
                  <View style={[styles.radioCircle, { width: spacing(2.5), height: spacing(2.5), borderRadius: spacing(1.25) }]}>
                    {sortBy === option.value && <View style={[styles.radioSelected, { width: spacing(1.5), height: spacing(1.5), borderRadius: spacing(0.75) }]} />}
                  </View>
                  <Text style={[styles.radioText, { fontSize: normalizeFontSize(14) }]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          {/* Footer buttons */}
          <View style={[styles.modalFooter, { padding: spacing(2.5), flexDirection: 'row', gap: spacing(1.5) }]}>
            <TouchableOpacity
              style={[styles.resetButton, { flex: 1, paddingVertical: spacing(1.5), borderRadius: spacing(3) }]}
              onPress={handleReset}
            >
              <Text style={[styles.resetButtonText, { fontSize: normalizeFontSize(14) }]}>
                {language === 'fr' ? 'Réinitialiser' : 'Reset'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.applyButton, { flex: 1, paddingVertical: spacing(1.5), borderRadius: spacing(3) }]}
              onPress={handleApply}
            >
              <Text style={[styles.applyButtonText, { fontSize: normalizeFontSize(14) }]}>
                {language === 'fr' ? 'Appliquer' : 'Apply'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    height: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalTitle: {
    fontWeight: '700',
    color: '#2D2D2D',
  },
  closeButton: {
    color: '#666',
    fontWeight: '300',
  },
  modalBody: {
    flex: 1,
  },
  filterSection: {},
  filterLabel: {
    fontWeight: '600',
    color: '#2D2D2D',
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  chip: {
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  chipSelected: {
    backgroundColor: '#2D2D2D',
    borderColor: '#2D2D2D',
  },
  chipText: {
    color: '#666',
    fontWeight: '500',
  },
  chipTextSelected: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  input: {
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    color: '#2D2D2D',
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomColor: '#F0F0F0',
  },
  radioCircle: {
    borderWidth: 2,
    borderColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  radioSelected: {
    backgroundColor: '#2D2D2D',
  },
  radioText: {
    color: '#2D2D2D',
  },
  modalFooter: {
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  resetButton: {
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  resetButtonText: {
    color: '#666',
    fontWeight: '600',
  },
  applyButton: {
    backgroundColor: '#2D2D2D',
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
