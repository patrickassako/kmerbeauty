/**
 * FilterModal
 * Modal de filtres avancés pour la recherche de services
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../design-system/colors';
import { spacing } from '../design-system/spacing';
import { radius } from '../design-system/radius';
import { shadows } from '../design-system/shadows';
import { typography } from '../design-system/typography';

interface FilterModalProps {
  visible: boolean;
  onClose: () => void;
  onApplyFilters: (filters: Filters) => void;
  initialFilters?: Filters;
}

export interface Filters {
  sortBy?: 'price_low_high' | 'price_high_low' | 'rating' | 'distance';
  categories?: string[];
  distance?: number; // in km
  minRating?: number;
  priceRange?: {
    min: number;
    max: number;
  };
  serviceType?: 'home' | 'salon' | 'all';
}

const CATEGORIES = [
  { id: 'hairdressing', label: 'Coiffure', icon: 'cut' },
  { id: 'eye_care', label: 'Soins des yeux', icon: 'eye' },
  { id: 'wellness', label: 'Massage', icon: 'hand-left' },
  { id: 'facial', label: 'Soins du visage', icon: 'sparkles' },
  { id: 'nail_care', label: 'Ongles', icon: 'hand-right' },
  { id: 'makeup', label: 'Maquillage', icon: 'brush' },
  { id: 'waxing', label: 'Épilation', icon: 'water' },
  { id: 'barber', label: 'Barbier', icon: 'cut-outline' },
];

const DISTANCE_OPTIONS = [
  { value: 1, label: 'Dans 1 km' },
  { value: 3, label: 'Dans 3 km' },
  { value: 5, label: 'Dans 5 km' },
  { value: 10, label: 'Dans 10 km' },
  { value: 20, label: 'Dans 20 km' },
];

const RATING_OPTIONS = [
  { value: 3.0, label: '3.0+' },
  { value: 3.5, label: '3.5+' },
  { value: 4.0, label: '4.0+' },
  { value: 4.5, label: '4.5+' },
  { value: 5.0, label: '5.0' },
];

const FilterModal: React.FC<FilterModalProps> = ({
  visible,
  onClose,
  onApplyFilters,
  initialFilters,
}) => {
  const [sortBy, setSortBy] = useState<Filters['sortBy']>(
    initialFilters?.sortBy || 'distance'
  );
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    initialFilters?.categories || []
  );
  const [distance, setDistance] = useState<number>(initialFilters?.distance || 5);
  const [minRating, setMinRating] = useState<number>(initialFilters?.minRating || 0);
  const [serviceType, setServiceType] = useState<'home' | 'salon' | 'all'>(
    initialFilters?.serviceType || 'all'
  );

  const toggleCategory = (categoryId: string) => {
    if (selectedCategories.includes(categoryId)) {
      setSelectedCategories(selectedCategories.filter((id) => id !== categoryId));
    } else {
      setSelectedCategories([...selectedCategories, categoryId]);
    }
  };

  const handleReset = () => {
    setSortBy('distance');
    setSelectedCategories([]);
    setDistance(5);
    setMinRating(0);
    setServiceType('all');
  };

  const handleApply = () => {
    onApplyFilters({
      sortBy,
      categories: selectedCategories,
      distance,
      minRating,
      serviceType,
    });
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true}>
      <View style={styles.modalOverlay}>
        <Pressable style={styles.modalBackdrop} onPress={onClose} />

        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Filtres</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={colors.black} />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Sort By */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Trier par</Text>
              <View style={styles.optionsGrid}>
                <TouchableOpacity
                  style={[
                    styles.sortOption,
                    sortBy === 'distance' && styles.sortOptionActive,
                  ]}
                  onPress={() => setSortBy('distance')}
                >
                  <Ionicons
                    name="location"
                    size={16}
                    color={sortBy === 'distance' ? colors.white : colors.textSecondary}
                  />
                  <Text
                    style={[
                      styles.sortOptionText,
                      sortBy === 'distance' && styles.sortOptionTextActive,
                    ]}
                  >
                    Proximité
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.sortOption,
                    sortBy === 'price_low_high' && styles.sortOptionActive,
                  ]}
                  onPress={() => setSortBy('price_low_high')}
                >
                  <Ionicons
                    name="arrow-up"
                    size={16}
                    color={sortBy === 'price_low_high' ? colors.white : colors.textSecondary}
                  />
                  <Text
                    style={[
                      styles.sortOptionText,
                      sortBy === 'price_low_high' && styles.sortOptionTextActive,
                    ]}
                  >
                    Prix croissant
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.sortOption,
                    sortBy === 'price_high_low' && styles.sortOptionActive,
                  ]}
                  onPress={() => setSortBy('price_high_low')}
                >
                  <Ionicons
                    name="arrow-down"
                    size={16}
                    color={sortBy === 'price_high_low' ? colors.white : colors.textSecondary}
                  />
                  <Text
                    style={[
                      styles.sortOptionText,
                      sortBy === 'price_high_low' && styles.sortOptionTextActive,
                    ]}
                  >
                    Prix décroissant
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.sortOption,
                    sortBy === 'rating' && styles.sortOptionActive,
                  ]}
                  onPress={() => setSortBy('rating')}
                >
                  <Ionicons
                    name="star"
                    size={16}
                    color={sortBy === 'rating' ? colors.white : colors.textSecondary}
                  />
                  <Text
                    style={[
                      styles.sortOptionText,
                      sortBy === 'rating' && styles.sortOptionTextActive,
                    ]}
                  >
                    Mieux notés
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Service Type */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Type de service</Text>
              <View style={styles.serviceTypeContainer}>
                <TouchableOpacity
                  style={[
                    styles.serviceTypeButton,
                    serviceType === 'all' && styles.serviceTypeButtonActive,
                  ]}
                  onPress={() => setServiceType('all')}
                >
                  <Text
                    style={[
                      styles.serviceTypeText,
                      serviceType === 'all' && styles.serviceTypeTextActive,
                    ]}
                  >
                    Tous
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.serviceTypeButton,
                    serviceType === 'home' && styles.serviceTypeButtonActive,
                  ]}
                  onPress={() => setServiceType('home')}
                >
                  <Ionicons
                    name="home"
                    size={16}
                    color={serviceType === 'home' ? colors.white : colors.textSecondary}
                  />
                  <Text
                    style={[
                      styles.serviceTypeText,
                      serviceType === 'home' && styles.serviceTypeTextActive,
                    ]}
                  >
                    À domicile
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.serviceTypeButton,
                    serviceType === 'salon' && styles.serviceTypeButtonActive,
                  ]}
                  onPress={() => setServiceType('salon')}
                >
                  <Ionicons
                    name="business"
                    size={16}
                    color={serviceType === 'salon' ? colors.white : colors.textSecondary}
                  />
                  <Text
                    style={[
                      styles.serviceTypeText,
                      serviceType === 'salon' && styles.serviceTypeTextActive,
                    ]}
                  >
                    En salon
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Categories */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Catégories</Text>
              <View style={styles.categoriesGrid}>
                {CATEGORIES.map((category) => (
                  <TouchableOpacity
                    key={category.id}
                    style={[
                      styles.categoryChip,
                      selectedCategories.includes(category.id) && styles.categoryChipActive,
                    ]}
                    onPress={() => toggleCategory(category.id)}
                  >
                    <Ionicons
                      name={category.icon as any}
                      size={16}
                      color={
                        selectedCategories.includes(category.id)
                          ? colors.white
                          : colors.textSecondary
                      }
                    />
                    <Text
                      style={[
                        styles.categoryChipText,
                        selectedCategories.includes(category.id) &&
                          styles.categoryChipTextActive,
                      ]}
                    >
                      {category.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Distance */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Distance maximum</Text>
              <View style={styles.distanceOptions}>
                {DISTANCE_OPTIONS.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.distanceOption,
                      distance === option.value && styles.distanceOptionActive,
                    ]}
                    onPress={() => setDistance(option.value)}
                  >
                    <Text
                      style={[
                        styles.distanceOptionText,
                        distance === option.value && styles.distanceOptionTextActive,
                      ]}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Rating */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Note minimum</Text>
              <View style={styles.ratingOptions}>
                {RATING_OPTIONS.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.ratingOption,
                      minRating === option.value && styles.ratingOptionActive,
                    ]}
                    onPress={() => setMinRating(option.value)}
                  >
                    <Ionicons
                      name="star"
                      size={16}
                      color={minRating === option.value ? colors.white : colors.gold}
                    />
                    <Text
                      style={[
                        styles.ratingOptionText,
                        minRating === option.value && styles.ratingOptionTextActive,
                      ]}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Bottom Spacing */}
            <View style={{ height: 100 }} />
          </ScrollView>

          {/* Bottom Actions */}
          <View style={styles.bottomActions}>
            <TouchableOpacity style={styles.resetButton} onPress={handleReset}>
              <Text style={styles.resetButtonText}>Réinitialiser</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.applyButton} onPress={handleApply}>
              <Text style={styles.applyButtonText}>Appliquer</Text>
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
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.overlay,
  },
  modalContent: {
    backgroundColor: colors.white,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  modalTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.semibold,
    color: colors.black,
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  section: {
    marginBottom: spacing['3xl'],
  },
  sectionTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.black,
    marginBottom: spacing.md,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  sortOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radius.pill,
    backgroundColor: colors.gray50,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sortOptionActive: {
    backgroundColor: colors.charcoal,
    borderColor: colors.charcoal,
  },
  sortOptionText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.textSecondary,
  },
  sortOptionTextActive: {
    color: colors.white,
  },
  serviceTypeContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  serviceTypeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.md,
    borderRadius: radius.sm,
    backgroundColor: colors.gray50,
    borderWidth: 1,
    borderColor: colors.border,
  },
  serviceTypeButtonActive: {
    backgroundColor: colors.charcoal,
    borderColor: colors.charcoal,
  },
  serviceTypeText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.textSecondary,
  },
  serviceTypeTextActive: {
    color: colors.white,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.gray50,
    borderWidth: 1,
    borderColor: colors.border,
  },
  categoryChipActive: {
    backgroundColor: colors.coral,
    borderColor: colors.coral,
  },
  categoryChipText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
    color: colors.textSecondary,
  },
  categoryChipTextActive: {
    color: colors.white,
  },
  distanceOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  distanceOption: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radius.pill,
    backgroundColor: colors.gray50,
    borderWidth: 1,
    borderColor: colors.border,
  },
  distanceOptionActive: {
    backgroundColor: colors.charcoal,
    borderColor: colors.charcoal,
  },
  distanceOptionText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.textSecondary,
  },
  distanceOptionTextActive: {
    color: colors.white,
  },
  ratingOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  ratingOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radius.pill,
    backgroundColor: colors.gray50,
    borderWidth: 1,
    borderColor: colors.border,
  },
  ratingOptionActive: {
    backgroundColor: colors.charcoal,
    borderColor: colors.charcoal,
  },
  ratingOptionText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.textSecondary,
  },
  ratingOptionTextActive: {
    color: colors.white,
  },
  bottomActions: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  resetButton: {
    flex: 1,
    paddingVertical: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
  },
  resetButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.black,
  },
  applyButton: {
    flex: 2,
    paddingVertical: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.pill,
    backgroundColor: colors.charcoal,
    ...shadows.sm,
  },
  applyButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.white,
  },
});

export default FilterModal;
