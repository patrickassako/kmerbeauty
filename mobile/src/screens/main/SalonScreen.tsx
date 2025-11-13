import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Image,
  TextInput,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useResponsive } from '../../hooks/useResponsive';
import { useI18n } from '../../i18n/I18nContext';
import { useSalons } from '../../hooks/useSalons';

export const SalonScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { normalizeFontSize, spacing } = useResponsive();
  const { language } = useI18n();
  const { salons, loading, refetch } = useSalons();
  const [refreshing, setRefreshing] = useState(false);
  const [searchText, setSearchText] = useState('');

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  // Filtrer les salons
  const filteredSalons = salons.filter((salon) => {
    const searchLower = searchText.toLowerCase();
    const salonName = (language === 'fr' ? salon.name_fr : salon.name_en) || '';
    const matchesSearch = !searchText || salonName.toLowerCase().includes(searchLower) || salon.city?.toLowerCase().includes(searchLower);
    return matchesSearch;
  });

  const handleSalonPress = (salon: typeof salons[0]) => {
    // Navigate to Home tab, then to ProviderDetails
    navigation.navigate('Home', {
      screen: 'ProviderDetails',
      params: {
        providerId: salon.id,
        providerType: 'salon',
      },
    });
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingHorizontal: spacing(2.5), paddingTop: spacing(6), paddingBottom: spacing(2) }]}>
        <Text style={[styles.title, { fontSize: normalizeFontSize(24) }]}>Instituts</Text>
        <Text style={[styles.subtitle, { fontSize: normalizeFontSize(12) }]}>
          {filteredSalons.length} institut{filteredSalons.length > 1 ? 's' : ''}
        </Text>
      </View>

      {/* Search */}
      <View style={[styles.searchContainer, { paddingHorizontal: spacing(2.5), marginBottom: spacing(2) }]}>
        <View style={[styles.searchBar, { height: spacing(6), borderRadius: spacing(1.5), paddingHorizontal: spacing(2) }]}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={[styles.searchInput, { fontSize: normalizeFontSize(14) }]}
            placeholder="Rechercher un institut..."
            value={searchText}
            onChangeText={setSearchText}
            placeholderTextColor="#999"
          />
        </View>
      </View>

      {/* Salons List */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={{ paddingHorizontal: spacing(2.5), paddingBottom: spacing(10) }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {loading && !refreshing ? (
          <ActivityIndicator size="large" color="#2D2D2D" style={{ marginTop: spacing(4) }} />
        ) : filteredSalons.length === 0 ? (
          <Text style={{ textAlign: 'center', marginTop: spacing(4), color: '#666' }}>Aucun institut trouvé</Text>
        ) : (
          filteredSalons.map((salon) => (
            <TouchableOpacity
              key={salon.id}
              style={[styles.salonCard, { borderRadius: spacing(2), padding: spacing(1.5), marginBottom: spacing(2) }]}
              onPress={() => handleSalonPress(salon)}
            >
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <View style={[styles.salonImage, { width: spacing(12), height: spacing(12), borderRadius: spacing(1.5) }]}>
                  {salon.logo || salon.cover_image ? (
                    <Image
                      source={{ uri: salon.logo || salon.cover_image }}
                      style={{ width: '100%', height: '100%', borderRadius: spacing(1.5) }}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={styles.salonImagePlaceholder}>
                      <Text style={{ fontSize: normalizeFontSize(24) }}>🏪</Text>
                    </View>
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.salonName, { fontSize: normalizeFontSize(14), marginBottom: 4 }]} numberOfLines={2}>
                    {language === 'fr' ? salon.name_fr : salon.name_en}
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    <Text style={{ fontSize: normalizeFontSize(12), color: '#FFB800', fontWeight: '600' }}>
                      ⭐ {salon.rating ? salon.rating.toFixed(1) : '5.0'}
                    </Text>
                    <Text style={{ color: '#CCC' }}>•</Text>
                    <Text style={{ fontSize: normalizeFontSize(12), color: '#666' }}>
                      ({salon.review_count || 0} avis)
                    </Text>
                  </View>
                  <Text style={{ fontSize: normalizeFontSize(12), color: '#666' }} numberOfLines={1}>
                    📍 {salon.city}, {salon.region}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: { borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  title: { fontWeight: '700', color: '#2D2D2D' },
  subtitle: { color: '#999', marginTop: 4 },
  searchContainer: {},
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F5F5F5', borderWidth: 1, borderColor: '#E0E0E0' },
  searchIcon: { fontSize: 16, marginRight: 8 },
  searchInput: { flex: 1, color: '#2D2D2D' },
  content: { flex: 1 },
  salonCard: { backgroundColor: '#F5F5F5', borderWidth: 1, borderColor: '#E0E0E0' },
  salonImage: { backgroundColor: '#E0E0E0', overflow: 'hidden' },
  salonImagePlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F5F5F5' },
  salonName: { fontWeight: '600', color: '#2D2D2D' },
});
