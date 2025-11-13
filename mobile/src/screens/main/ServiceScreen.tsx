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
import { useServices } from '../../hooks/useServices';
import { useCategories } from '../../hooks/useCategories';
import { formatCurrency, type CountryCode } from '../../utils/currency';

export const ServiceScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { normalizeFontSize, spacing } = useResponsive();
  const { language } = useI18n();
  const { services, loading, refetch } = useServices();
  const { categories } = useCategories();
  const [countryCode] = useState<CountryCode>('CM');
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchText, setSearchText] = useState('');

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  // Icônes pour les catégories
  const categoryIcons: Record<string, string> = {
    'HAIRDRESSING': '💇',
    'EYE_CARE': '👁️',
    'WELLNESS_MASSAGE': '💆',
    'FACIAL': '🧖',
    'NAIL_CARE': '💅',
    'MAKEUP': '💄',
    'WAXING': '✨',
    'BARBER': '💈',
    'OTHER': '🌟',
  };

  // Filtrer les services
  const filteredServices = services.filter((service) => {
    const matchesCategory = selectedCategory === 'all' || service.category === selectedCategory;
    const searchLower = searchText.toLowerCase();
    const serviceName = (language === 'fr' ? service.name_fr : service.name_en) || '';
    const matchesSearch = !searchText || serviceName.toLowerCase().includes(searchLower);
    return matchesCategory && matchesSearch;
  });

  const handleServicePress = (service: typeof services[0]) => {
    // Navigate to Home tab, then to ServiceDetails
    navigation.navigate('Home', {
      screen: 'ServiceDetails',
      params: {
        service: service,
      },
    });
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingHorizontal: spacing(2.5), paddingTop: spacing(6), paddingBottom: spacing(2) }]}>
        <Text style={[styles.title, { fontSize: normalizeFontSize(24) }]}>Services</Text>
        <Text style={[styles.subtitle, { fontSize: normalizeFontSize(12) }]}>
          {filteredServices.length} service{filteredServices.length > 1 ? 's' : ''}
        </Text>
      </View>

      {/* Search */}
      <View style={[styles.searchContainer, { paddingHorizontal: spacing(2.5), marginBottom: spacing(2) }]}>
        <View style={[styles.searchBar, { height: spacing(6), borderRadius: spacing(1.5), paddingHorizontal: spacing(2) }]}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={[styles.searchInput, { fontSize: normalizeFontSize(14) }]}
            placeholder="Rechercher..."
            value={searchText}
            onChangeText={setSearchText}
            placeholderTextColor="#999"
          />
        </View>
      </View>

      {/* Categories */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={[{ paddingLeft: spacing(2.5), marginBottom: spacing(1.5), maxHeight: spacing(5) }]}
        contentContainerStyle={{ paddingRight: spacing(2.5), alignItems: 'center' }}
      >
        <TouchableOpacity
          style={[styles.categoryChip, selectedCategory === 'all' && styles.categoryChipActive, { paddingHorizontal: spacing(1.5), paddingVertical: spacing(0.75), borderRadius: spacing(2), marginRight: spacing(1) }]}
          onPress={() => setSelectedCategory('all')}
        >
          <Text style={[styles.categoryChipText, selectedCategory === 'all' && styles.categoryChipTextActive, { fontSize: normalizeFontSize(11) }]}>
            Tout
          </Text>
        </TouchableOpacity>
        {categories.map((cat) => (
          <TouchableOpacity
            key={cat.category}
            style={[styles.categoryChip, selectedCategory === cat.category && styles.categoryChipActive, { paddingHorizontal: spacing(1.5), paddingVertical: spacing(0.75), borderRadius: spacing(2), marginRight: spacing(1) }]}
            onPress={() => setSelectedCategory(cat.category)}
          >
            <Text style={[styles.categoryChipText, selectedCategory === cat.category && styles.categoryChipTextActive, { fontSize: normalizeFontSize(11) }]}>
              {categoryIcons[cat.category]} {language === 'fr' ? cat.name_fr : cat.name_en}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Services List */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={{ paddingHorizontal: spacing(2.5), paddingBottom: spacing(10) }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {loading && !refreshing ? (
          <ActivityIndicator size="large" color="#2D2D2D" style={{ marginTop: spacing(4) }} />
        ) : filteredServices.length === 0 ? (
          <Text style={{ textAlign: 'center', marginTop: spacing(4), color: '#666' }}>Aucun service trouvé</Text>
        ) : (
          filteredServices.map((service) => (
            <TouchableOpacity
              key={service.id}
              style={[styles.serviceCard, { borderRadius: spacing(2), padding: spacing(1.5), marginBottom: spacing(2) }]}
              onPress={() => handleServicePress(service)}
            >
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <View style={[styles.serviceImage, { width: spacing(12), height: spacing(12), borderRadius: spacing(1.5) }]}>
                  {service.images?.[0] ? (
                    <Image source={{ uri: service.images[0] }} style={{ width: '100%', height: '100%', borderRadius: spacing(1.5) }} resizeMode="cover" />
                  ) : (
                    <View style={styles.serviceImagePlaceholder}>
                      <Text style={{ fontSize: normalizeFontSize(24) }}>{categoryIcons[service.category || 'OTHER']}</Text>
                    </View>
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.serviceName, { fontSize: normalizeFontSize(14) }]} numberOfLines={2}>
                    {language === 'fr' ? service.name_fr : service.name_en}
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
                    <Text style={[styles.servicePrice, { fontSize: normalizeFontSize(14) }]}>
                      {formatCurrency(service.base_price, countryCode)}
                    </Text>
                    <Text style={{ color: '#CCC' }}>•</Text>
                    <Text style={{ fontSize: normalizeFontSize(12), color: '#666' }}>{service.duration}min</Text>
                  </View>
                  {service.provider_count !== undefined && service.provider_count > 0 && (
                    <Text style={{ fontSize: normalizeFontSize(11), color: '#999', marginTop: 2 }}>
                      {service.provider_count} prestataire{service.provider_count > 1 ? 's' : ''}
                    </Text>
                  )}
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
  categoryChip: { backgroundColor: '#F5F5F5', borderWidth: 1, borderColor: '#E0E0E0' },
  categoryChipActive: { backgroundColor: '#2D2D2D', borderColor: '#2D2D2D' },
  categoryChipText: { color: '#666', fontWeight: '600' },
  categoryChipTextActive: { color: '#FFFFFF' },
  content: { flex: 1 },
  serviceCard: { backgroundColor: '#F5F5F5', borderWidth: 1, borderColor: '#E0E0E0' },
  serviceImage: { backgroundColor: '#E0E0E0', overflow: 'hidden' },
  serviceImagePlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F5F5F5' },
  serviceName: { fontWeight: '600', color: '#2D2D2D' },
  servicePrice: { fontWeight: '700', color: '#FF6B6B' },
});
