/**
 * AddressManagementScreen
 * Gestion des adresses multiples de l'utilisateur (Domicile, Bureau, etc.)
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../design-system/colors';
import { spacing } from '../../design-system/spacing';
import { radius } from '../../design-system/radius';
import { shadows } from '../../design-system/shadows';
import { typography } from '../../design-system/typography';

interface AddressManagementScreenProps {
  navigation: any;
}

interface Address {
  id: string;
  label: string;
  quarter: string;
  landmark: string;
  city: string;
  region: string;
  instructions?: string;
  isPrimary: boolean;
}

const AddressManagementScreen: React.FC<AddressManagementScreenProps> = ({
  navigation,
}) => {
  const [addresses, setAddresses] = useState<Address[]>([
    {
      id: '1',
      label: 'Domicile',
      quarter: 'Akwa',
      landmark: 'Près de la pharmacie du rond-point',
      city: 'Douala',
      region: 'Littoral',
      instructions: 'Bâtiment bleu, 2ème étage',
      isPrimary: true,
    },
    {
      id: '2',
      label: 'Bureau',
      quarter: 'Bonanjo',
      landmark: 'En face du marché central',
      city: 'Douala',
      region: 'Littoral',
      isPrimary: false,
    },
    {
      id: '3',
      label: 'Chez maman',
      quarter: 'Bonabéri',
      landmark: 'Derrière l\'école publique',
      city: 'Douala',
      region: 'Littoral',
      isPrimary: false,
    },
  ]);

  const handleSetPrimary = (addressId: string) => {
    setAddresses(
      addresses.map((addr) => ({
        ...addr,
        isPrimary: addr.id === addressId,
      }))
    );
  };

  const handleDelete = (addressId: string) => {
    const address = addresses.find((a) => a.id === addressId);

    if (address?.isPrimary) {
      Alert.alert(
        'Impossible de supprimer',
        'Vous ne pouvez pas supprimer votre adresse principale. Définissez d\'abord une autre adresse comme principale.'
      );
      return;
    }

    Alert.alert(
      'Supprimer l\'adresse',
      'Êtes-vous sûr de vouloir supprimer cette adresse ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: () => {
            setAddresses(addresses.filter((a) => a.id !== addressId));
          },
        },
      ]
    );
  };

  const handleAddNew = () => {
    navigation.navigate('AddAddress');
  };

  const handleEdit = (address: Address) => {
    navigation.navigate('EditAddress', { address });
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.headerButton}
        >
          <Ionicons name="arrow-back" size={24} color={colors.black} />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Mes adresses</Text>

        <View style={styles.headerButton} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Info Banner */}
        <View style={styles.infoBanner}>
          <Ionicons name="information-circle" size={20} color={colors.coral} />
          <Text style={styles.infoBannerText}>
            Ces adresses seront utilisées pour vos réservations à domicile
          </Text>
        </View>

        {/* Addresses List */}
        {addresses.map((address) => (
          <View key={address.id} style={styles.addressCard}>
            <View style={styles.addressHeader}>
              <View style={styles.addressLabelContainer}>
                <Ionicons
                  name={address.isPrimary ? 'home' : 'location'}
                  size={20}
                  color={address.isPrimary ? colors.coral : colors.textSecondary}
                />
                <Text style={styles.addressLabel}>{address.label}</Text>
                {address.isPrimary && (
                  <View style={styles.primaryBadge}>
                    <Text style={styles.primaryBadgeText}>Principal</Text>
                  </View>
                )}
              </View>

              <View style={styles.addressActions}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => handleEdit(address)}
                >
                  <Ionicons name="create-outline" size={20} color={colors.textSecondary} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => handleDelete(address.id)}
                >
                  <Ionicons name="trash-outline" size={20} color={colors.error} />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.addressContent}>
              <View style={styles.addressRow}>
                <Ionicons name="business-outline" size={16} color={colors.textSecondary} />
                <Text style={styles.addressText}>
                  Quartier {address.quarter}, {address.city}
                </Text>
              </View>

              <View style={styles.addressRow}>
                <Ionicons name="navigate-outline" size={16} color={colors.textSecondary} />
                <Text style={styles.addressText}>{address.landmark}</Text>
              </View>

              {address.instructions && (
                <View style={styles.addressRow}>
                  <Ionicons
                    name="information-circle-outline"
                    size={16}
                    color={colors.textSecondary}
                  />
                  <Text style={styles.addressText}>{address.instructions}</Text>
                </View>
              )}
            </View>

            {!address.isPrimary && (
              <TouchableOpacity
                style={styles.setPrimaryButton}
                onPress={() => handleSetPrimary(address.id)}
              >
                <Ionicons name="checkmark-circle-outline" size={16} color={colors.coral} />
                <Text style={styles.setPrimaryButtonText}>
                  Définir comme adresse principale
                </Text>
              </TouchableOpacity>
            )}
          </View>
        ))}

        {/* Add New Address Button */}
        <TouchableOpacity style={styles.addButton} onPress={handleAddNew}>
          <View style={styles.addButtonIcon}>
            <Ionicons name="add" size={24} color={colors.white} />
          </View>
          <Text style={styles.addButtonText}>Ajouter une nouvelle adresse</Text>
        </TouchableOpacity>

        {/* Bottom Spacing */}
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  headerButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.black,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.coral + '10',
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.xl,
    gap: spacing.md,
  },
  infoBannerText: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    color: colors.coral,
    lineHeight: typography.lineHeight.relaxed * typography.fontSize.sm,
  },
  addressCard: {
    backgroundColor: colors.white,
    borderRadius: radius.md,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },
  addressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  addressLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  addressLabel: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.black,
  },
  primaryBadge: {
    backgroundColor: colors.coral,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.sm,
  },
  primaryBadgeText: {
    fontSize: typography.fontSize['2xs'],
    fontWeight: typography.fontWeight.semibold,
    color: colors.white,
    textTransform: 'uppercase',
  },
  addressActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addressContent: {
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  addressText: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    lineHeight: typography.lineHeight.relaxed * typography.fontSize.sm,
  },
  setPrimaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    marginTop: spacing.sm,
  },
  setPrimaryButtonText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.coral,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    backgroundColor: colors.charcoal,
    borderRadius: radius.md,
    paddingVertical: spacing.lg,
    ...shadows.sm,
  },
  addButtonIcon: {
    width: 32,
    height: 32,
    borderRadius: radius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.white,
  },
});

export default AddressManagementScreen;
