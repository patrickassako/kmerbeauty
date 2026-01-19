import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Image,
  Modal,
  TextInput,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../../contexts/AuthContext';
import { useI18n } from '../../i18n/I18nContext';
import { useResponsive } from '../../hooks/useResponsive';
import { useServices } from '../../hooks/useServices';
import { useSalons } from '../../hooks/useSalons';
import { useGeolocation } from '../../hooks/useGeolocation';
import { formatCurrency, type CountryCode } from '../../utils/currency';
import { HomeStackParamList, PackageWithProviders } from '../../navigation/HomeStackNavigator';
import type { Service, Booking } from '../../types/models';
import { AdvancedSearchModal, SearchFilters } from '../../components/AdvancedSearchModal';
import { bookingsApi } from '../../services/api';
import { SimpleMap } from '../../components/SimpleMap';
import { BetaTesterModal } from '../../components/modals/BetaTesterModal';
import { CopilotStep, walkthroughable, useCopilot, CopilotProvider } from 'react-native-copilot';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { HomeHeader, HomeSearchBar, StoriesSection, PromoBanners, ServicesGrid, ProviderCard, NearbyProviders, SpecialPackagesSection, type PromoBanner, type ServiceItem, type Provider } from '../../components/home';
import { SERVICE_ICON_MAP } from '../../components/home/mockData';
import { useStories } from '../../hooks/useStories';
import { usePacks } from '../../hooks/usePacks';
import { useServicePackages } from '../../hooks/useServicePackages';
import { StoryViewer } from '../../components/StoryViewer';
import type { Story } from '../../services/storiesApi';

// Create walkthroughable components
const WalkthroughableView = walkthroughable(View);
const WalkthroughableTouchable = walkthroughable(TouchableOpacity);

type HomeScreenNavigationProp = NativeStackNavigationProp<HomeStackParamList, 'HomeMain'>;


// Step titles mapping
const STEP_TITLES: Record<string, string> = {
  search: '🔍 Rechercher',
  toggle: '📂 Modes de Vue',
  services: '💅 Services Proches',
  map: '🗺️ Carte des Prestataires',
  booking: '⭐ Réserver un Service',
};

// Custom tooltip for French UI
const CustomTooltip = ({
  isFirstStep,
  isLastStep,
  handleNext,
  handlePrev,
  handleStop,
  currentStep,
}: any) => {
  const stepName = currentStep?.name || '';
  const stepTitle = STEP_TITLES[stepName] || stepName;
  const stepText = currentStep?.text || '';
  const stepOrder = currentStep?.order || 1;

  return (
    <View style={tooltipStyles.container}>
      <View style={tooltipStyles.header}>
        <Text style={tooltipStyles.stepNumber}>Étape {stepOrder}</Text>
      </View>
      <Text style={tooltipStyles.title}>{stepTitle}</Text>
      <Text style={tooltipStyles.description}>{stepText}</Text>
      <View style={tooltipStyles.actions}>
        <TouchableOpacity style={tooltipStyles.skipButton} onPress={handleStop}>
          <Text style={tooltipStyles.skipText}>Passer</Text>
        </TouchableOpacity>
        <View style={tooltipStyles.navButtons}>
          {!isFirstStep && (
            <TouchableOpacity style={tooltipStyles.prevButton} onPress={handlePrev}>
              <Text style={tooltipStyles.prevText}>← Précédent</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={tooltipStyles.nextButton} onPress={isLastStep ? handleStop : handleNext}>
            <Text style={tooltipStyles.nextText}>{isLastStep ? 'Terminer ✓' : 'Suivant →'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const tooltipStyles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    maxWidth: 320,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  header: { marginBottom: 12 },
  stepNumber: { fontSize: 12, color: '#FF6B6B', fontWeight: '600', textTransform: 'uppercase' },
  title: { fontSize: 18, fontWeight: '700', color: '#2D2D2D', marginBottom: 8 },
  description: { fontSize: 14, color: '#666', lineHeight: 20, marginBottom: 20 },
  actions: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  skipButton: { paddingVertical: 8, paddingHorizontal: 12 },
  skipText: { fontSize: 14, color: '#999' },
  navButtons: { flexDirection: 'row', gap: 8 },
  prevButton: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8, borderWidth: 1, borderColor: '#E0E0E0' },
  prevText: { fontSize: 14, color: '#666', fontWeight: '600' },
  nextButton: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8, backgroundColor: '#FF6B6B' },
  nextText: { fontSize: 14, color: '#FFFFFF', fontWeight: '600' },
});

// Inner component that uses useCopilot
const HomeScreenContent: React.FC = () => {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const { user } = useAuth();
  const { language, setLanguage, t } = useI18n();
  const { normalizeFontSize, spacing, isTablet, containerPaddingHorizontal } = useResponsive();

  // Charger les services depuis l'API
  const { services, loading: servicesLoading, error: servicesError, refetch } = useServices();

  // Charger les salons depuis l'API
  const { salons, loading: salonsLoading, error: salonsError, refetch: refetchSalons } = useSalons();

  // Geolocation for nearby providers
  const { nearbyProviders, loading: geoLoading, error: geoError, refresh: refreshGeolocation, city, district, setManualLocation, location } = useGeolocation();

  const [countryCode] = useState<CountryCode>('CM');
  const [refreshing, setRefreshing] = useState(false);
  const [searchModalVisible, setSearchModalVisible] = useState(false);
  const [locationModalVisible, setLocationModalVisible] = useState(false);
  const [manualCity, setManualCity] = useState('');
  const [manualDistrict, setManualDistrict] = useState('');
  const [addressSuggestions, setAddressSuggestions] = useState<any[]>([]);
  const [isSearchingAddress, setIsSearchingAddress] = useState(false);
  const [upcomingBookings, setUpcomingBookings] = useState<any[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [showBetaModal, setShowBetaModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{ id: string; name: string; category?: string }[]>([]);

  // Stories and Packs from API
  const { stories, loading: storiesLoading, markViewed } = useStories();
  const { packs, loading: packsLoading, trackClick } = usePacks(city ?? undefined);
  const { packages: featuredPackages, loading: packagesLoading } = useServicePackages();
  const [storyViewerVisible, setStoryViewerVisible] = useState(false);
  const [selectedStoryIndex, setSelectedStoryIndex] = useState(0);

  // Copilot walkthrough - DISABLED (will be replaced by video tutorials)
  // const { start: startCopilot, copilotEvents } = useCopilot();
  // const [walkthroughStarted, setWalkthroughStarted] = useState(false);

  // Start walkthrough for first-time users - DISABLED
  // React.useEffect(() => {
  //   const checkAndStartWalkthrough = async () => {
  //     try {
  //       const hasSeenWalkthrough = await AsyncStorage.getItem('@client_walkthrough_seen');
  //       if (!hasSeenWalkthrough && user && !walkthroughStarted && !servicesLoading) {
  //         setWalkthroughStarted(true);
  //         setTimeout(() => {
  //           startCopilot();
  //         }, 1500);
  //       }
  //     } catch (error) {
  //       console.log('Error checking walkthrough status:', error);
  //     }
  //   };
  //   checkAndStartWalkthrough();
  // }, [user, servicesLoading]);

  // Mark walkthrough as seen when finished - DISABLED
  // React.useEffect(() => {
  //   const handleStop = async () => {
  //     await AsyncStorage.setItem('@client_walkthrough_seen', 'true');
  //   };
  //   copilotEvents?.on('stop', handleStop);
  //   return () => {
  //     copilotEvents?.off('stop', handleStop);
  //   };
  // }, [copilotEvents]);

  // Load upcoming bookings
  React.useEffect(() => {
    if (user?.id) {
      loadUpcomingBookings();
    }
  }, [user]);

  const loadUpcomingBookings = async () => {
    if (!user?.id) return;

    try {
      setLoadingBookings(true);
      const allBookings = await bookingsApi.getAll(user.id);

      // Filter for upcoming bookings (CONFIRMED, IN_PROGRESS only)
      const upcoming = allBookings
        .filter((b: any) => ['CONFIRMED', 'IN_PROGRESS'].includes(b.status.toUpperCase()))
        .sort((a: any, b: any) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime())
        .slice(0, 5); // Show up to 5 for horizontal scroll

      setUpcomingBookings(upcoming);
    } catch (error) {
      console.error('Error loading upcoming bookings:', error);
    } finally {
      setLoadingBookings(false);
    }
  };

  const toggleLanguage = () => {
    setLanguage(language === 'fr' ? 'en' : 'fr');
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetch(), refetchSalons(), loadUpcomingBookings()]);
    refreshGeolocation();
    setRefreshing(false);
  };

  const handleSalonPress = (provider: any) => {
    // Navigate to provider details
    navigation.navigate('ProviderDetails', {
      providerId: provider.id,
      providerType: provider.type || 'salon',
    });
  };

  // Services à proximité (top 5)
  const nearbyServices = services.slice(0, 5);

  // Compute provider count per service based on user's city
  const providerCountByService = useMemo(() => {
    const counts: Record<string, number> = {};
    // Count how many providers from nearbyProviders match each service
    nearbyProviders.forEach((provider) => {
      // Each provider may be associated with multiple services
      // The match_type contains the service category info
      if (provider.match_type) {
        // For now, we'll count unique providers per service category
        // This is approximate but gives dynamic feedback
      }
    });
    // Since nearbyProviders doesn't have detailed service info per provider,
    // we'll use the salons data filtered by city as a proxy
    return counts;
  }, [nearbyProviders]);

  // Get total provider count in user's city (therapists + salons)
  const cityProviderCount = useMemo(() => {
    return nearbyProviders.length;
  }, [nearbyProviders]);

  // Grouper les services par catégorie
  const servicesByCategory = services.reduce((acc, service) => {
    const category = service.category || 'OTHER';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(service);
    return acc;
  }, {} as Record<string, Service[]>);

  // Noms des catégories en français
  const categoryNames: Record<string, { fr: string; en: string }> = {
    WELLNESS_MASSAGE: { fr: 'Massage & Bien-être', en: 'Massage & Wellness' },
    FACIAL_CARE: { fr: 'Soins du visage', en: 'Facial Care' },
    HAIR_CARE: { fr: 'Coiffure', en: 'Hair Care' },
    NAIL_CARE: { fr: 'Soins des ongles', en: 'Nail Care' },
    BODY_CARE: { fr: 'Soins du corps', en: 'Body Care' },
    MAKEUP: { fr: 'Maquillage', en: 'Makeup' },
    AESTHETIC: { fr: 'Esthétique', en: 'Aesthetic' },
    OTHER: { fr: 'Autres services', en: 'Other Services' },
  };

  // Mock data pour les packages (à implémenter plus tard)
  const servicePackages: PackageWithProviders[] = [];

  const handleServicePress = (service: Service) => {
    navigation.navigate('ServiceDetails', { service });
  };

  const handlePackagePress = (pkg: PackageWithProviders) => {
    navigation.navigate('PackageProviders', { package: pkg });
  };

  const searchAddress = async (query: string) => {
    setManualCity(query);
    if (query.length < 3) {
      setAddressSuggestions([]);
      return;
    }

    try {
      setIsSearchingAddress(true);
      // Use Nominatim for free geocoding (limited to Cameroon)
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=cm&addressdetails=1&limit=5`,
        {
          headers: {
            'User-Agent': 'KMR-Beauty-App/1.0'
          }
        }
      );
      const data = await response.json();
      setAddressSuggestions(data);
    } catch (error) {
      console.error('Error searching address:', error);
    } finally {
      setIsSearchingAddress(false);
    }
  };

  const selectAddress = (item: any) => {
    const lat = parseFloat(item.lat);
    const lon = parseFloat(item.lon);
    const city = item.address?.city || item.address?.town || item.address?.village || item.address?.state;
    const district = item.address?.suburb || item.address?.neighbourhood || item.address?.quarter;

    setManualCity(item.display_name);
    setAddressSuggestions([]);

    setManualLocation(lat, lon, city, district);
    setLocationModalVisible(false);
  };

  const handleSearch = (filters: SearchFilters) => {
    navigation.navigate('SearchResults', { filters });
  };

  // Dynamic search as user types
  const handleDynamicSearch = (query: string) => {
    setSearchQuery(query);
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    // Filter services by name (case-insensitive)
    const filtered = services
      .filter(s =>
        (s.name_fr?.toLowerCase().includes(query.toLowerCase())) ||
        (s.name_en?.toLowerCase().includes(query.toLowerCase()))
      )
      .slice(0, 5)
      .map(s => ({
        id: s.id,
        name: language === 'fr' ? (s.name_fr || s.name_en || '') : (s.name_en || s.name_fr || ''),
        category: s.category,
      }));

    setSearchResults(filtered);
  };

  // Handle search result selection
  const handleSearchResultPress = (result: { id: string; name: string; category?: string }) => {
    const service = services.find(s => s.id === result.id);
    if (service) {
      handleServicePress(service);
    }
  };

  // Group stories by provider for the UI (bubbles) and viewer (sequence)
  const { groupedStories, sortedStories } = useMemo(() => {
    if (!stories.length) return { groupedStories: [], sortedStories: [] };

    const groups: Record<string, typeof stories> = {};

    // 1. Group by provider
    stories.forEach(s => {
      const pid = s.provider?.id || 'unknown';
      if (!groups[pid]) groups[pid] = [];
      groups[pid].push(s);
    });

    // 2. Sort providers by the timestamp of their latest story (Newest first)
    const sortedProviderIds = Object.keys(groups).sort((a, b) => {
      const getLatestDate = (items: typeof stories) =>
        Math.max(...items.map(s => new Date(s.createdAt).getTime()));
      return getLatestDate(groups[b]) - getLatestDate(groups[a]);
    });

    const flatList: typeof stories = [];
    const bubbles: { id: string; name: string; image: string; viewed: boolean }[] = [];

    sortedProviderIds.forEach(pid => {
      const providerStories = groups[pid];
      flatList.push(...providerStories);

      const allViewed = providerStories.every(s => s.isViewed);
      const representativeStory = allViewed
        ? providerStories[0]
        : (providerStories.find(s => !s.isViewed) || providerStories[0]);

      bubbles.push({
        id: representativeStory.id,
        name: representativeStory.provider?.name || 'Provider',
        image: representativeStory.provider?.image || representativeStory.mediaUrl || '',
        viewed: allViewed,
      });
    });

    return { groupedStories: bubbles, sortedStories: flatList };
  }, [stories]);

  return (
    <View style={styles.container}>
      {/* Header with new design */}
      <HomeHeader
        city={city ?? null}
        district={district ?? null}
        onLocationPress={() => setLocationModalVisible(true)}
        onNotificationsPress={() => console.log('Notifications pressed')}
        hasUnreadNotifications={true}
      />

      {/* Search Bar */}
      <HomeSearchBar
        onSearch={handleDynamicSearch}
        onFilterPress={() => setSearchModalVisible(true)}
        onResultPress={handleSearchResultPress}
        searchResults={searchResults}
        placeholder={t.home.searchServices}
        loading={servicesLoading}
      />

      {/* Advanced Search Modal */}
      <AdvancedSearchModal
        visible={searchModalVisible}
        onClose={() => setSearchModalVisible(false)}
        onApply={handleSearch}
      />

      <ScrollView
        style={styles.content}
        contentContainerStyle={{
          paddingBottom: spacing(12),
          flexGrow: 1,
        }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Stories Section */}
        <StoriesSection
          stories={groupedStories}
          onStoryPress={(story) => {
            const index = sortedStories.findIndex(s => s.id === story.id);
            if (index >= 0) {
              setSelectedStoryIndex(index);
              setStoryViewerVisible(true);
            }
          }}
          onAddStoryPress={user?.role === 'provider' ? () => console.log('Add story pressed') : undefined}
        />

        {/* Promo Banners - Only show if there are active promotional packs */}
        {packs.length > 0 && (
          <PromoBanners
            banners={packs.map(p => ({
              id: p.id,
              title: p.title,
              subtitle: p.subtitle,
              image: p.imageUrl,
              badge: p.badge,
            }))}
            onBannerPress={(banner: PromoBanner) => {
              trackClick(banner.id);
              const pack = packs.find(p => p.id === banner.id);

              if (pack?.ctaLink) {
                // Parse ctaLink to determine navigation
                // Format examples: 
                // - "/services/pack-mariage" -> navigate to service
                // - "/provider/salon-id" -> navigate to salon
                // - "/provider/therapist-id" -> navigate to therapist

                if (pack.ctaLink.includes('/services/')) {
                  // Navigate to services list or specific service
                  navigation.navigate('Services');
                } else if (pack.ctaLink.includes('/provider/salon/')) {
                  // Extract salon ID and navigate
                  const salonId = pack.ctaLink.split('/provider/salon/')[1];
                  if (salonId && pack.salon) {
                    navigation.navigate('SalonDetails', {
                      salon: { id: salonId, ...pack.salon }
                    });
                  }
                } else if (pack.ctaLink.includes('/provider/therapist/')) {
                  // Extract therapist ID and navigate
                  const therapistId = pack.ctaLink.split('/provider/therapist/')[1];
                  if (therapistId && pack.therapist) {
                    navigation.navigate('TherapistDetails', {
                      therapist: { id: therapistId, ...pack.therapist }
                    });
                  }
                } else if (pack.serviceId) {
                  // If pack has a serviceId, navigate to booking with that service
                  navigation.navigate('Services');
                } else {
                  // Default: show pack details in a modal or navigate to services
                  navigation.navigate('Services');
                }
              }
            }}
          />
        )}

        {/* Special Packages / Offres Spéciales */}
        <SpecialPackagesSection
          packages={featuredPackages}
          loading={packagesLoading}
          onPackagePress={(pkg) => {
            // Navigate to package details screen
            navigation.navigate('PackageDetails', {
              package: pkg as any,
            });
          }}
        />

        {/* Prestataires à proximité */}
        <NearbyProviders
          providers={nearbyProviders.map(p => ({
            id: p.id,
            name: p.name || 'Prestataire',
            image: p.image ?? undefined,
            rating: p.rating,
            location: p.city || 'Douala',
            distance: undefined,
            services: [],
            verified: false,
          }))}
          onProviderPress={(provider) => {
            const originalProvider = nearbyProviders.find(np => np.id === provider.id);
            if (originalProvider) {
              handleSalonPress(originalProvider);
            }
          }}
          onBookPress={(provider) => {
            const originalProvider = nearbyProviders.find(np => np.id === provider.id);
            if (originalProvider) {
              handleSalonPress(originalProvider);
            }
          }}
          onSeeAllPress={() => console.log('See all providers')}
        />

        {/* Loading State */}
        {servicesLoading && !refreshing && (
          <View style={{ padding: spacing(4), alignItems: 'center' }}>
            <ActivityIndicator size="large" color="#000" />
            <Text style={{ marginTop: spacing(2), fontSize: normalizeFontSize(14), color: '#666' }}>
              {language === 'fr' ? 'Chargement des services...' : 'Loading services...'}
            </Text>
          </View>
        )}

        {/* Error State */}
        {servicesError && (
          <View style={{ padding: spacing(4), alignItems: 'center' }}>
            <Text style={{ fontSize: normalizeFontSize(14), color: '#ff0000', textAlign: 'center' }}>
              {language === 'fr'
                ? 'Erreur lors du chargement des services. Tirez pour actualiser.'
                : 'Error loading services. Pull to refresh.'}
            </Text>
          </View>
        )}

        {/* Upcoming Bookings */}
        {upcomingBookings.length > 0 && (
          <View style={[styles.section, { paddingHorizontal: spacing(2.5), marginBottom: spacing(3) }]}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { fontSize: normalizeFontSize(20) }]}>{t.home.upcomingBookings}</Text>
              <TouchableOpacity onPress={() => navigation.navigate('BookingManagement')}>
                <Text style={[styles.seeAll, { fontSize: normalizeFontSize(14) }]}>{t.home.seeAll}</Text>
              </TouchableOpacity>
            </View>

            {upcomingBookings.length === 1 ? (
              // Single booking - no scroll
              <View>
                {upcomingBookings.map((booking) => {
                  const dateTime = {
                    date: new Date(booking.scheduled_at).toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    }),
                    time: new Date(booking.scheduled_at).toLocaleTimeString(language === 'fr' ? 'fr-FR' : 'en-US', {
                      hour: '2-digit',
                      minute: '2-digit',
                    }),
                  };

                  const serviceName = booking.items?.[0]?.service_name || (language === 'fr' ? 'Service' : 'Service');

                  // Get service image - check service_image field first, then service.images array
                  let serviceImage: string | null = null;
                  if (booking.items && booking.items.length > 0) {
                    const firstItem = booking.items[0];
                    console.log('Single booking - Full item data:', JSON.stringify(firstItem, null, 2));
                    if (firstItem.service_image) {
                      serviceImage = firstItem.service_image;
                      console.log('✅ Using service_image:', serviceImage);
                    } else if (firstItem.service?.images && firstItem.service.images.length > 0) {
                      serviceImage = firstItem.service.images[0];
                      console.log('✅ Using service.images[0]:', serviceImage);
                    } else {
                      console.log('❌ No image found - service_image:', firstItem.service_image, 'service.images:', firstItem.service?.images);
                    }
                  }

                  const providerName = booking.therapist_id
                    ? `${booking.provider?.user?.first_name || ''} ${booking.provider?.user?.last_name || ''}`.trim()
                    : (language === 'fr' ? booking.provider?.name_fr : booking.provider?.name_en) || booking.provider?.name_fr;

                  const getStatusColor = (status: string) => {
                    const upperStatus = status.toUpperCase();
                    switch (upperStatus) {
                      case 'CONFIRMED': return '#2196F3';
                      case 'IN_PROGRESS': return '#FF9800';
                      default: return '#999';
                    }
                  };

                  const getStatusLabel = (status: string) => {
                    const upperStatus = status.toUpperCase();
                    const labels = {
                      CONFIRMED: language === 'fr' ? 'Confirmée' : 'Confirmed',
                      IN_PROGRESS: language === 'fr' ? 'En cours' : 'In Progress',
                    };
                    return labels[upperStatus as keyof typeof labels] || status;
                  };

                  return (
                    <TouchableOpacity
                      key={booking.id}
                      style={[styles.bookingCard, {
                        borderRadius: spacing(2),
                        padding: spacing(1.5),
                      }]}
                      onPress={() => {
                        navigation.navigate('BookingDetails', { bookingId: booking.id } as any);
                      }}
                      activeOpacity={0.7}
                    >
                      {/* Status Badge */}
                      <View
                        style={[
                          styles.statusBadge,
                          { backgroundColor: getStatusColor(booking.status), paddingHorizontal: spacing(1.5), paddingVertical: spacing(0.5), borderRadius: spacing(1.5), position: 'absolute', top: spacing(1.5), right: spacing(1.5), zIndex: 1 }
                        ]}
                      >
                        <Text style={[styles.statusText, { fontSize: normalizeFontSize(10) }]}>
                          {getStatusLabel(booking.status)}
                        </Text>
                      </View>

                      <View style={styles.bookingContent}>
                        {/* Image/Icon */}
                        <View style={[styles.bookingImage, { width: spacing(12), height: spacing(12), borderRadius: spacing(1.5) }]}>
                          {serviceImage ? (
                            <Image
                              source={{ uri: serviceImage }}
                              style={{ width: '100%', height: '100%', borderRadius: spacing(1.5) }}
                              resizeMode="cover"
                              onError={(e) => console.log('❌ Image load error:', e.nativeEvent.error)}
                              onLoad={() => console.log('✅ Image loaded successfully:', serviceImage)}
                            />
                          ) : (
                            <View style={styles.bookingImagePlaceholder}>
                              <Text style={[styles.placeholderText, { fontSize: normalizeFontSize(24) }]}>
                                {booking.therapist_id ? '👤' : '🏢'}
                              </Text>
                            </View>
                          )}
                        </View>

                        {/* Info */}
                        <View style={styles.bookingInfo}>
                          <Text style={[styles.bookingName, { fontSize: normalizeFontSize(14), marginBottom: spacing(0.5), paddingRight: spacing(8) }]} numberOfLines={1}>
                            {serviceName}
                          </Text>
                          <Text style={[styles.bookingPrice, { fontSize: normalizeFontSize(16), marginBottom: spacing(1) }]}>
                            {formatCurrency(booking.total, countryCode)}
                          </Text>
                          <View style={styles.bookingDetails}>
                            <Text style={[styles.bookingDate, { fontSize: normalizeFontSize(12) }]}>📅 {dateTime.date}</Text>
                            <Text style={[styles.bookingTime, { fontSize: normalizeFontSize(12) }]}>⏰ {dateTime.time}</Text>
                          </View>
                          <View style={[styles.bookingFooter, { marginTop: spacing(1) }]}>
                            <Text style={[styles.bookingProvider, { fontSize: normalizeFontSize(12) }]} numberOfLines={1}>
                              {booking.therapist_id ? '👤' : '🏢'} {providerName}
                            </Text>
                            {booking.provider?.rating != null && (
                              <Text style={[styles.bookingRating, { fontSize: normalizeFontSize(12) }]}>
                                ⭐ {booking.provider.rating.toFixed(1)}
                              </Text>
                            )}
                          </View>
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ) : (
              // Multiple bookings - horizontal scroll
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingRight: spacing(2.5) }}
              >
                {upcomingBookings.map((booking) => {
                  const dateTime = {
                    date: new Date(booking.scheduled_at).toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    }),
                    time: new Date(booking.scheduled_at).toLocaleTimeString(language === 'fr' ? 'fr-FR' : 'en-US', {
                      hour: '2-digit',
                      minute: '2-digit',
                    }),
                  };

                  const serviceName = booking.items?.[0]?.service_name || (language === 'fr' ? 'Service' : 'Service');

                  // Get service image - check service_image field first, then service.images array
                  let serviceImage: string | null = null;
                  if (booking.items && booking.items.length > 0) {
                    const firstItem = booking.items[0];
                    if (firstItem.service_image) {
                      serviceImage = firstItem.service_image;
                    } else if (firstItem.service?.images && firstItem.service.images.length > 0) {
                      serviceImage = firstItem.service.images[0];
                    }
                  }

                  const providerName = booking.therapist_id
                    ? `${booking.provider?.user?.first_name || ''} ${booking.provider?.user?.last_name || ''}`.trim()
                    : (language === 'fr' ? booking.provider?.name_fr : booking.provider?.name_en) || booking.provider?.name_fr;

                  const getStatusColor = (status: string) => {
                    const upperStatus = status.toUpperCase();
                    switch (upperStatus) {
                      case 'CONFIRMED': return '#2196F3';
                      case 'IN_PROGRESS': return '#FF9800';
                      default: return '#999';
                    }
                  };

                  const getStatusLabel = (status: string) => {
                    const upperStatus = status.toUpperCase();
                    const labels = {
                      CONFIRMED: language === 'fr' ? 'Confirmée' : 'Confirmed',
                      IN_PROGRESS: language === 'fr' ? 'En cours' : 'In Progress',
                    };
                    return labels[upperStatus as keyof typeof labels] || status;
                  };

                  return (
                    <TouchableOpacity
                      key={booking.id}
                      style={[styles.bookingCard, {
                        borderRadius: spacing(2),
                        padding: spacing(1.5),
                        marginRight: spacing(2),
                        width: spacing(70)
                      }]}
                      onPress={() => {
                        navigation.navigate('BookingDetails', { bookingId: booking.id } as any);
                      }}
                      activeOpacity={0.7}
                    >
                      {/* Status Badge */}
                      <View
                        style={[
                          styles.statusBadge,
                          { backgroundColor: getStatusColor(booking.status), paddingHorizontal: spacing(1.5), paddingVertical: spacing(0.5), borderRadius: spacing(1.5), position: 'absolute', top: spacing(1.5), right: spacing(1.5), zIndex: 1 }
                        ]}
                      >
                        <Text style={[styles.statusText, { fontSize: normalizeFontSize(10) }]}>
                          {getStatusLabel(booking.status)}
                        </Text>
                      </View>

                      <View style={styles.bookingContent}>
                        {/* Image/Icon */}
                        <View style={[styles.bookingImage, { width: spacing(12), height: spacing(12), borderRadius: spacing(1.5) }]}>
                          {serviceImage ? (
                            <Image
                              source={{ uri: serviceImage }}
                              style={{ width: '100%', height: '100%', borderRadius: spacing(1.5) }}
                              resizeMode="cover"
                            />
                          ) : (
                            <View style={styles.bookingImagePlaceholder}>
                              <Text style={[styles.placeholderText, { fontSize: normalizeFontSize(24) }]}>
                                {booking.therapist_id ? '👤' : '🏢'}
                              </Text>
                            </View>
                          )}
                        </View>

                        {/* Info */}
                        <View style={styles.bookingInfo}>
                          <Text style={[styles.bookingName, { fontSize: normalizeFontSize(14), marginBottom: spacing(0.5), paddingRight: spacing(8) }]} numberOfLines={1}>
                            {serviceName}
                          </Text>
                          <Text style={[styles.bookingPrice, { fontSize: normalizeFontSize(16), marginBottom: spacing(1) }]}>
                            {formatCurrency(booking.total, countryCode)}
                          </Text>
                          <View style={styles.bookingDetails}>
                            <Text style={[styles.bookingDate, { fontSize: normalizeFontSize(12) }]}>📅 {dateTime.date}</Text>
                            <Text style={[styles.bookingTime, { fontSize: normalizeFontSize(12) }]}>⏰ {dateTime.time}</Text>
                          </View>
                          <View style={[styles.bookingFooter, { marginTop: spacing(1) }]}>
                            <Text style={[styles.bookingProvider, { fontSize: normalizeFontSize(12) }]} numberOfLines={1}>
                              {booking.therapist_id ? '👤' : '🏢'} {providerName}
                            </Text>
                            {booking.provider?.rating != null && (
                              <Text style={[styles.bookingRating, { fontSize: normalizeFontSize(12) }]}>
                                ⭐ {booking.provider.rating.toFixed(1)}
                              </Text>
                            )}
                          </View>
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            )}
          </View>
        )}

        {/* Near Me (Services) - Step 3 */}
        {(
          <CopilotStep
            text="💅 Découvrez les services de beauté près de chez vous. Appuyez sur un service pour voir les détails et les prestataires disponibles."
            order={3}
            name="services"
          >
            <WalkthroughableView style={[styles.section, { paddingHorizontal: spacing(2.5), marginBottom: spacing(3) }]}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { fontSize: normalizeFontSize(20) }]}>{t.home.nearbyProviders || 'Services Proches'}</Text>
                <TouchableOpacity>
                  <Text style={[styles.seeAll, { fontSize: normalizeFontSize(14) }]}>{t.home.seeAll}</Text>
                </TouchableOpacity>
              </View>

              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -spacing(2.5) }} contentContainerStyle={{ paddingHorizontal: spacing(2.5), gap: spacing(2) }}>
                {nearbyServices.map((service) => (
                  <TouchableOpacity
                    key={service.id}
                    style={[styles.serviceCard, { width: spacing(22), borderRadius: spacing(2), padding: spacing(2) }]}
                    onPress={() => handleServicePress(service)}
                  >
                    <View style={[styles.serviceImage, { height: spacing(12), borderRadius: spacing(1.5), marginBottom: spacing(1.5) }]}>
                      {service.images && service.images.length > 0 && service.images[0] ? (
                        <Image
                          source={{ uri: service.images[0] }}
                          style={styles.serviceImageActual}
                          resizeMode="cover"
                        />
                      ) : (
                        <View style={styles.serviceImagePlaceholder}>
                          <Text style={[styles.placeholderText, { fontSize: normalizeFontSize(12) }]}>Service</Text>
                        </View>
                      )}
                      <View style={[styles.serviceProvidersCount, { position: 'absolute', top: spacing(1), right: spacing(1), paddingHorizontal: spacing(1), paddingVertical: spacing(0.5), borderRadius: spacing(1) }]}>
                        <Text style={[styles.serviceProvidersCountText, { fontSize: normalizeFontSize(10) }]}>
                          📍 {city || (language === 'fr' ? 'Ma position' : 'My location')} • {cityProviderCount} {language === 'fr' ? 'presta.' : 'prov.'}
                        </Text>
                      </View>
                    </View>
                    <Text style={[styles.serviceName, { fontSize: normalizeFontSize(16), marginBottom: spacing(0.5) }]} numberOfLines={1}>
                      {language === 'fr' ? service.name_fr : service.name_en}
                    </Text>
                    <Text style={[styles.servicePrice, { fontSize: normalizeFontSize(14), marginBottom: spacing(1) }]}>
                      À partir de {formatCurrency(service.base_price, countryCode)}
                    </Text>
                    <View style={styles.serviceFooter}>
                      <Text style={[styles.serviceDuration, { fontSize: normalizeFontSize(12) }]}>⏰ {service.duration}min</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </WalkthroughableView>
          </CopilotStep>
        )}

        {/* Nearby Institutes */}
        {nearbyProviders.filter(p => p.type === 'salon').length > 0 && (
          <View style={[styles.section, { paddingHorizontal: spacing(2.5), marginBottom: spacing(3) }]}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { fontSize: normalizeFontSize(20) }]}>Instituts Proches</Text>
              <TouchableOpacity>
                <Text style={[styles.seeAll, { fontSize: normalizeFontSize(14) }]}>{t.home.seeAll}</Text>
              </TouchableOpacity>
            </View>

            {geoLoading && !refreshing ? (
              <View style={{ paddingVertical: spacing(4), alignItems: 'center' }}>
                <ActivityIndicator size="large" color="#000" />
              </View>
            ) : nearbyProviders.length === 0 ? (
              <View style={{ paddingVertical: spacing(4), alignItems: 'center' }}>
                <Text style={{ fontSize: normalizeFontSize(14), color: '#999' }}>
                  Aucun institut disponible
                </Text>
              </View>
            ) : (
              <View>
                {/* Map View */}
                <SimpleMap
                  providers={nearbyProviders.filter(p => p.type === 'salon')}
                  userLocation={location ? { latitude: location.latitude, longitude: location.longitude } : null}
                  onProviderPress={(provider) => handleSalonPress(provider as any)}
                  mapHeight={180}
                />

                {/* List View (Sorted by distance) */}
                <View style={{ gap: spacing(2) }}>
                  {nearbyProviders
                    .filter(p => p.type === 'salon')
                    .sort((a, b) => (a.distance_meters || 0) - (b.distance_meters || 0))
                    .map((salon) => (
                      <TouchableOpacity
                        key={salon.id}
                        style={[styles.instituteCard, {
                          borderRadius: spacing(2),
                          padding: spacing(1.5),
                          flexDirection: 'row',
                          alignItems: 'center'
                        }]}
                        onPress={() => handleSalonPress(salon as any)}
                      >
                        <View style={[styles.instituteImage, { width: spacing(10), height: spacing(10), borderRadius: spacing(1.5) }]}>
                          {salon.image ? (
                            <Image
                              source={{ uri: salon.image }}
                              style={styles.instituteImageActual}
                              resizeMode="cover"
                            />
                          ) : (
                            <View style={styles.instituteImagePlaceholder}>
                              <Text style={[styles.placeholderText, { fontSize: normalizeFontSize(12) }]}>Institut</Text>
                            </View>
                          )}
                        </View>

                        <View style={{ flex: 1, marginLeft: spacing(1.5) }}>
                          <Text style={[styles.instituteName, { fontSize: normalizeFontSize(16), marginBottom: spacing(0.5) }]} numberOfLines={1}>
                            {salon.name}
                          </Text>
                          <Text style={[styles.instituteLocation, { fontSize: normalizeFontSize(12), marginBottom: spacing(0.5), color: '#666' }]} numberOfLines={1}>
                            📍 {salon.city}
                          </Text>
                          <View style={styles.instituteFooter}>
                            <Text style={[styles.instituteRating, { fontSize: normalizeFontSize(12) }]}>
                              ⭐ {salon.rating} ({salon.review_count})
                            </Text>
                            <Text style={[styles.instituteServices, { fontSize: normalizeFontSize(12), color: '#FF6B6B' }]}>
                              Voir services
                            </Text>
                          </View>
                        </View>

                        <View style={{ alignItems: 'flex-end', marginLeft: spacing(1) }}>
                          <Text style={{ fontSize: normalizeFontSize(12), color: '#666', fontWeight: '600' }}>
                            {salon.distance_meters ? `${(salon.distance_meters / 1000).toFixed(1)} km` : ''}
                          </Text>
                          <Ionicons name="chevron-forward" size={20} color="#ccc" style={{ marginTop: spacing(1) }} />
                        </View>
                      </TouchableOpacity>
                    ))}
                </View>
              </View>
            )}
          </View>
        )}

        {/* Nearby Independent Providers - Step 4 */}
        {nearbyProviders.filter(p => p.type === 'therapist').length > 0 && (
          <CopilotStep
            text="🗺️ Visualisez les prestataires indépendants sur la carte. Vous pouvez voir leur distance et les contacter directement."
            order={4}
            name="map"
          >
            <WalkthroughableView style={[styles.section, { paddingHorizontal: spacing(2.5), marginBottom: spacing(3) }]}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { fontSize: normalizeFontSize(20) }]}>
                  {language === 'fr' ? 'Prestataires Indépendants' : 'Freelance Providers'}
                </Text>
              </View>

              {geoLoading && !refreshing ? (
                <View style={{ paddingVertical: spacing(4), alignItems: 'center' }}>
                  <ActivityIndicator size="large" color="#000" />
                </View>
              ) : nearbyProviders.filter(p => p.type === 'therapist').length === 0 ? (
                <View style={{ paddingVertical: spacing(4), alignItems: 'center' }}>
                  <Text style={{ fontSize: normalizeFontSize(14), color: '#999' }}>
                    {language === 'fr' ? 'Aucun prestataire indépendant disponible' : 'No freelance providers available'}
                  </Text>
                </View>
              ) : (
                <View>
                  {/* Map View */}
                  <SimpleMap
                    providers={nearbyProviders.filter(p => p.type === 'therapist')}
                    userLocation={location ? { latitude: location.latitude, longitude: location.longitude } : null}
                    onProviderPress={(provider) => handleSalonPress(provider as any)}
                    mapHeight={180}
                  />
                </View>
              )}
            </WalkthroughableView>
          </CopilotStep>
        )}

        {/* Recommended Service - Step 5 */}
        <CopilotStep
          text="⭐ Voici notre service recommandé ! Appuyez pour voir les détails, choisir un prestataire et réserver votre créneau."
          order={5}
          name="booking"
        >
          <WalkthroughableView style={[styles.section, { paddingHorizontal: spacing(2.5), marginBottom: spacing(3) }]}>
            <Text style={[styles.sectionTitle, { fontSize: normalizeFontSize(20), marginBottom: spacing(2) }]}>{t.home.recommended}</Text>

            {nearbyServices.length > 0 && (
              <TouchableOpacity
                style={[styles.recommendedCard, { borderRadius: spacing(2) }]}
                onPress={() => handleServicePress(nearbyServices[0])}
              >
                <View style={[styles.recommendedImage, { height: spacing(25), borderRadius: spacing(2) }]}>
                  {nearbyServices[0].images && nearbyServices[0].images.length > 0 && nearbyServices[0].images[0] ? (
                    <Image
                      source={{ uri: nearbyServices[0].images[0] }}
                      style={styles.recommendedImageActual}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={[styles.recommendedImagePlaceholder, { height: spacing(25) }]}>
                      <Text style={[styles.placeholderText, { fontSize: normalizeFontSize(12) }]}>Service Image</Text>
                    </View>
                  )}
                  <View style={[styles.recommendedLocation, { paddingHorizontal: spacing(1.5), paddingVertical: spacing(0.5), borderRadius: spacing(2) }]}>
                    <Text style={[styles.recommendedLocationText, { fontSize: normalizeFontSize(10) }]}>
                      📍 {nearbyServices[0].provider_count || 0} prestataires disponibles
                    </Text>
                  </View>
                </View>

                <View style={[styles.recommendedInfo, { padding: spacing(1.5) }]}>
                  <View style={styles.recommendedHeader}>
                    <Text style={[styles.recommendedTitle, { fontSize: normalizeFontSize(16) }]} numberOfLines={1}>
                      {language === 'fr' ? nearbyServices[0].name_fr : nearbyServices[0].name_en}
                    </Text>
                    <View style={styles.recommendedPrice}>
                      <Text style={[styles.recommendedPriceText, { fontSize: normalizeFontSize(16) }]}>
                        {formatCurrency(nearbyServices[0].base_price, countryCode)}
                      </Text>
                      <Text style={[styles.recommendedDuration, { fontSize: normalizeFontSize(12) }]}>⏰ {nearbyServices[0].duration}min</Text>
                    </View>
                  </View>
                  <View style={styles.recommendedFooter}>
                    <Text style={[styles.recommendedDescription, { fontSize: normalizeFontSize(12) }]}>
                      {language === 'fr' ? nearbyServices[0].description_fr : nearbyServices[0].description_en}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            )}
          </WalkthroughableView>
        </CopilotStep>

        {/* Nearby Providers (Proximity-based) */}
        {nearbyProviders && nearbyProviders.length > 0 && (
          <View style={[styles.section, { paddingHorizontal: spacing(2.5), marginBottom: spacing(3) }]}>
            <Text style={[styles.sectionTitle, { fontSize: normalizeFontSize(20), marginBottom: spacing(2) }]}>
              {t.home.nearbyProviders}
            </Text>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={{ marginHorizontal: -spacing(2.5) }}
              contentContainerStyle={{ paddingHorizontal: spacing(2.5), gap: spacing(2) }}
            >
              {nearbyProviders.slice(0, 10).map((provider) => (
                <TouchableOpacity
                  key={provider.id}
                  style={[styles.providerCard, { width: spacing(35), borderRadius: spacing(2), padding: spacing(2) }]}
                  onPress={() => navigation.navigate('ProviderDetails', {
                    providerId: provider.id,
                    providerType: provider.type as 'salon' | 'therapist',
                  })}
                >
                  <View style={[styles.providerImage, { height: spacing(18), borderRadius: spacing(1.5), marginBottom: spacing(1.5) }]}>
                    {provider.image ? (
                      <Image
                        source={{ uri: provider.image }}
                        style={styles.providerImageActual}
                        resizeMode="cover"
                      />
                    ) : (
                      <View style={styles.providerImagePlaceholder}>
                        <Text style={[styles.placeholderText, { fontSize: normalizeFontSize(12) }]}>
                          {provider.name.charAt(0)}
                        </Text>
                      </View>
                    )}
                    <View style={[styles.providerDistance, { paddingHorizontal: spacing(1.5), paddingVertical: spacing(0.5), borderRadius: spacing(2) }]}>
                      <Text style={[styles.providerDistanceText, { fontSize: normalizeFontSize(10) }]}>
                        📍 {(provider.distance_meters / 1000).toFixed(1)} km
                      </Text>
                    </View>
                  </View>
                  <Text style={[styles.providerName, { fontSize: normalizeFontSize(15), marginBottom: spacing(0.5) }]} numberOfLines={1}>
                    {provider.name}
                  </Text>
                  <Text style={[styles.providerLocation, { fontSize: normalizeFontSize(12), marginBottom: spacing(0.5), color: '#666' }]} numberOfLines={1}>
                    📍 {provider.city}
                  </Text>
                  <View style={styles.providerFooter}>
                    <Text style={[styles.providerRating, { fontSize: normalizeFontSize(12) }]}>
                      ⭐ {provider.rating?.toFixed(1) || 'N/A'} ({provider.review_count || 0})
                    </Text>
                    {provider.is_mobile && (
                      <Text style={[styles.providerMobile, { fontSize: normalizeFontSize(11), color: '#4CAF50' }]}>
                        🚗 Mobile
                      </Text>
                    )}
                    {provider.type === 'salon' && (
                      <Text style={[styles.providerMobile, { fontSize: normalizeFontSize(11), color: '#E91E63', marginLeft: spacing(1) }]}>
                        🏢 Institut
                      </Text>
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Services par Catégorie */}
        {Object.entries(servicesByCategory).map(([category, categoryServices]) => (
          categoryServices.length > 0 && (
            <View key={category} style={[styles.section, { paddingHorizontal: spacing(2.5), marginBottom: spacing(3) }]}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { fontSize: normalizeFontSize(20) }]}>
                  {categoryNames[category]?.[language] || category}
                </Text>
                <TouchableOpacity onPress={() => navigation.navigate('CategoryServices', {
                  category,
                  categoryName: categoryNames[category]?.[language] || category
                })}>
                  <Text style={[styles.seeAll, { fontSize: normalizeFontSize(14) }]}>{t.home.seeAll || 'Voir tout'}</Text>
                </TouchableOpacity>
              </View>

              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -spacing(2.5) }} contentContainerStyle={{ paddingHorizontal: spacing(2.5), gap: spacing(2) }}>
                {categoryServices.slice(0, 10).map((service) => (
                  <TouchableOpacity
                    key={service.id}
                    style={[styles.serviceCard, { width: spacing(22), borderRadius: spacing(2), padding: spacing(2) }]}
                    onPress={() => handleServicePress(service)}
                  >
                    <View style={[styles.serviceImage, { height: spacing(12), borderRadius: spacing(1.5), marginBottom: spacing(1.5) }]}>
                      {service.images && service.images.length > 0 && service.images[0] ? (
                        <Image
                          source={{ uri: service.images[0] }}
                          style={styles.serviceImageActual}
                          resizeMode="cover"
                        />
                      ) : (
                        <View style={styles.serviceImagePlaceholder}>
                          <Text style={[styles.placeholderText, { fontSize: normalizeFontSize(12) }]}>Service</Text>
                        </View>
                      )}
                      <View style={[styles.serviceProvidersCount, { position: 'absolute', top: spacing(1), right: spacing(1), paddingHorizontal: spacing(1), paddingVertical: spacing(0.5), borderRadius: spacing(1) }]}>
                        <Text style={[styles.serviceProvidersCountText, { fontSize: normalizeFontSize(10) }]}>
                          {service.provider_count || 0} prestataires
                        </Text>
                      </View>
                    </View>
                    <Text style={[styles.serviceName, { fontSize: normalizeFontSize(16), marginBottom: spacing(0.5) }]} numberOfLines={1}>
                      {language === 'fr' ? service.name_fr : service.name_en}
                    </Text>
                    <Text style={[styles.servicePrice, { fontSize: normalizeFontSize(14), marginBottom: spacing(1) }]}>
                      À partir de {formatCurrency(service.base_price, countryCode)}
                    </Text>
                    <View style={styles.serviceFooter}>
                      <Text style={[styles.serviceDuration, { fontSize: normalizeFontSize(12) }]}>⏰ {service.duration}min</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )
        ))}

        {/* Service Packages */}
        <View style={[styles.section, { paddingHorizontal: spacing(2.5), marginBottom: spacing(3) }]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { fontSize: normalizeFontSize(20) }]}>{t.home.servicePackages}</Text>
            <TouchableOpacity>
              <Text style={[styles.seeAll, { fontSize: normalizeFontSize(14) }]}>{t.home.seeAll}</Text>
            </TouchableOpacity>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -spacing(2.5) }} contentContainerStyle={{ paddingHorizontal: spacing(2.5), gap: spacing(2) }}>
            {servicePackages.map((pkg) => (
              <TouchableOpacity
                key={pkg.id}
                style={[styles.packageCard, { width: spacing(22), borderRadius: spacing(2) }]}
                onPress={() => handlePackagePress(pkg)}
              >
                <View style={[styles.packageImage, { height: spacing(15), borderRadius: spacing(2) }]}>
                  <View style={[styles.packageImagePlaceholder, { height: spacing(15) }]}>
                    <Text style={[styles.placeholderText, { fontSize: normalizeFontSize(12) }]}>Package Image</Text>
                  </View>
                </View>
                <View style={[styles.packageInfo, { padding: spacing(1.5) }]}>
                  <Text style={[styles.packageTitle, { fontSize: normalizeFontSize(14), marginBottom: spacing(1) }]} numberOfLines={2}>
                    {language === 'fr' ? pkg.name_fr : pkg.name_en}
                  </Text>
                  <View style={styles.packageFooter}>
                    <Text style={[styles.packagePrice, { fontSize: normalizeFontSize(16) }]}>
                      {formatCurrency(pkg.base_price, countryCode)}
                    </Text>
                    <Text style={[styles.packageDuration, { fontSize: normalizeFontSize(12) }]}>⏰ {pkg.base_duration}min</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>


        {/* Gift Cards - HIDDEN (feature not implemented yet)
        <View style={[styles.section, { paddingHorizontal: spacing(2.5) }]}>
          <Text style={[styles.sectionTitle, { fontSize: normalizeFontSize(20), marginBottom: spacing(2) }]}>{t.home.giftCards}</Text>

          {giftCards.map((card) => (
            <TouchableOpacity key={card.id} style={[styles.giftCard, { borderRadius: spacing(2), padding: spacing(2.5), marginBottom: spacing(2) }]}>
              <View style={[styles.giftCardIcon, { width: spacing(6), height: spacing(6), borderRadius: spacing(3), marginBottom: spacing(2) }]}>
                <Text style={[styles.giftCardIconText, { fontSize: normalizeFontSize(24) }]}>🎁</Text>
              </View>
              <View style={[styles.giftCardPrice, { marginBottom: spacing(3) }]}>
                <Text style={[styles.giftCardPriceText, { fontSize: normalizeFontSize(40) }]}>
                  {formatCurrency(card.value, countryCode)}
                </Text>
              </View>
              <View>
                <Text style={[styles.giftCardTitle, { fontSize: normalizeFontSize(14), marginBottom: spacing(0.5) }]}>
                  {language === 'fr' ? card.title_fr : card.title_en}
                </Text>
                <Text style={[styles.giftCardSubtitle, { fontSize: normalizeFontSize(16), marginBottom: spacing(0.5) }]}>
                  {language === 'fr' ? card.description_fr : card.description_en}
                </Text>
                <Text style={[styles.giftCardExpiry, { fontSize: normalizeFontSize(12) }]}>
                  Valide jusqu'au {new Date(card.valid_until).toLocaleDateString('fr-FR')}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
        */}
      </ScrollView>

      {/* Story Viewer Modal */}
      <StoryViewer
        stories={sortedStories}
        initialIndex={selectedStoryIndex}
        visible={storyViewerVisible}
        onClose={() => setStoryViewerVisible(false)}
        onStoryViewed={markViewed}
        onBookPress={(story) => {
          setStoryViewerVisible(false);
          // Navigate to provider
          if (story.provider) {
            const providerData = {
              id: story.provider.id,
              name: story.provider.name,
              type: story.provider.type,
            };
            // Could navigate to provider profile here
            console.log('Book with provider:', providerData);
          }
        }}
      />

      {/* Location Selection Modal */}
      <Modal
        visible={locationModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setLocationModalVisible(false)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={{ backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, height: '80%' }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <Text style={{ fontSize: 18, fontWeight: 'bold' }}>Changer de localisation</Text>
                <TouchableOpacity onPress={() => setLocationModalVisible(false)}>
                  <Ionicons name="close" size={24} color="#000" />
                </TouchableOpacity>
              </View>

              <Text style={{ fontSize: 14, color: '#666', marginBottom: 5 }}>Rechercher une adresse</Text>
              <TextInput
                style={{ borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, marginBottom: 10, fontSize: 16 }}
                placeholder="Ex: Akwa, Douala..."
                value={manualCity}
                onChangeText={searchAddress}
                autoFocus={true}
                returnKeyType="done"
              />

              {isSearchingAddress && (
                <ActivityIndicator size="small" color="#000" style={{ marginBottom: 10 }} />
              )}

              <ScrollView style={{ flex: 1 }} keyboardShouldPersistTaps="handled">
                {addressSuggestions.map((item, index) => (
                  <TouchableOpacity
                    key={index}
                    style={{ paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#eee' }}
                    onPress={() => selectAddress(item)}
                  >
                    <Text style={{ fontWeight: '600', marginBottom: 2 }}>
                      {item.name || item.address?.suburb || item.address?.city}
                    </Text>
                    <Text style={{ color: '#666', fontSize: 12 }}>
                      {item.display_name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <TouchableOpacity
                style={{ marginTop: 15, alignItems: 'center', padding: 15, borderTopWidth: 1, borderTopColor: '#eee' }}
                onPress={() => {
                  refreshGeolocation();
                  setManualCity('');
                  setManualDistrict('');
                  setLocationModalVisible(false);
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Ionicons name="locate" size={20} color="#FF6B6B" style={{ marginRight: 8 }} />
                  <Text style={{ color: '#FF6B6B', fontSize: 16, fontWeight: '600' }}>Utiliser ma position actuelle (GPS)</Text>
                </View>
              </TouchableOpacity>
            </View>
          </TouchableWithoutFeedback>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  logo: {
    fontWeight: '700',
    color: '#2D2D2D',
    letterSpacing: 1,
  },
  tagline: {
    color: '#999',
    fontWeight: '400',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  languageToggle: {
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  languageText: {
    fontWeight: '600',
    color: '#2D2D2D',
  },
  profileButton: {
    alignItems: 'center',
  },
  profilePlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  profileInitial: {
    fontWeight: '600',
    color: '#2D2D2D',
  },
  profileName: {
    color: '#666',
    fontWeight: '400',
  },
  searchContainer: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  searchBar: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
  },
  searchPlaceholder: {
    color: '#999',
  },
  searchButton: {
    backgroundColor: '#FF6B6B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchIcon: {},
  content: {
    flex: 1,
  },
  section: {},
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontWeight: '700',
    color: '#2D2D2D',
  },
  seeAll: {
    color: '#FF6B6B',
    fontWeight: '500',
  },
  bookingCard: {
    backgroundColor: '#2D2D2D',
  },
  bookingContent: {
    flexDirection: 'row',
    gap: 12,
  },
  bookingLogo: {
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bookingLogoText: {
    color: '#666',
    fontWeight: '600',
  },
  bookingInfo: {
    flex: 1,
  },
  bookingName: {
    color: '#FFFFFF',
    fontWeight: '600',
    marginBottom: 8,
  },
  bookingDetails: {
    flexDirection: 'row',
    gap: 16,
  },
  bookingTime: {
    color: '#FFFFFF',
  },
  bookingDate: {
    color: '#FFFFFF',
  },
  bookingTitle: {
    fontWeight: '600',
    color: '#2D2D2D',
  },
  statusBadge: {},
  statusText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  bookingImage: {
    backgroundColor: '#F5F5F5',
    overflow: 'hidden',
  },
  bookingImageActual: {
    width: '100%',
    height: '100%',
  },
  bookingImagePlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5F5F5',
  },
  bookingPrice: {
    color: '#FF6B6B',
    fontWeight: '700',
  },
  bookingFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bookingProvider: {
    color: '#666',
    flex: 1,
  },
  bookingRating: {
    color: '#666',
  },
  serviceCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  serviceImage: {
    position: 'relative',
    backgroundColor: '#F5F5F5',
    overflow: 'hidden',
  },
  serviceImageActual: {
    width: '100%',
    height: '100%',
  },
  serviceImagePlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5F5F5',
  },
  serviceProvidersCount: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  serviceProvidersCountText: {
    fontWeight: '600',
    color: '#2D2D2D',
  },
  serviceName: {
    fontWeight: '600',
    color: '#2D2D2D',
  },
  servicePrice: {
    color: '#FF6B6B',
    fontWeight: '700',
  },
  serviceFooter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  serviceDuration: {
    color: '#666',
  },
  recommendedCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    overflow: 'hidden',
  },
  recommendedImage: {
    position: 'relative',
    overflow: 'hidden',
  },
  recommendedImageActual: {
    width: '100%',
    height: '100%',
  },
  recommendedImagePlaceholder: {
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  recommendedLocation: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    backgroundColor: 'rgba(45, 45, 45, 0.8)',
  },
  recommendedLocationText: {
    color: '#FFFFFF',
  },
  recommendedInfo: {},
  recommendedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  recommendedTitle: {
    fontWeight: '600',
    color: '#2D2D2D',
    flex: 1,
  },
  recommendedPrice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  recommendedPriceText: {
    fontWeight: '700',
    color: '#FF6B6B',
  },
  recommendedDuration: {
    color: '#666',
  },
  recommendedFooter: {},
  recommendedDescription: {
    color: '#666',
  },
  categoriesGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  categoryCard: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
  },
  categoryIcon: {},
  categoryName: {
    color: '#2D2D2D',
    fontWeight: '500',
    textAlign: 'center',
  },
  packageCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    overflow: 'hidden',
  },
  packageImage: {},
  packageImagePlaceholder: {
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  packageInfo: {},
  packageTitle: {
    fontWeight: '600',
    color: '#2D2D2D',
  },
  packageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  packagePrice: {
    fontWeight: '700',
    color: '#2D2D2D',
  },
  packageDuration: {
    color: '#666',
  },
  giftCard: {
    backgroundColor: '#2D2D2D',
  },
  giftCardIcon: {
    backgroundColor: 'rgba(255, 107, 107, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  giftCardIconText: {},
  giftCardPrice: {
    alignSelf: 'flex-end',
  },
  giftCardPriceText: {
    fontWeight: '700',
    color: '#FFFFFF',
  },
  giftCardTitle: {
    color: '#999',
    fontWeight: '500',
  },
  giftCardSubtitle: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  providerCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  providerImage: {
    position: 'relative',
    overflow: 'hidden',
  },
  providerImageActual: {
    width: '100%',
    height: '100%',
  },
  providerImagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#2D2D2D',
    alignItems: 'center',
    justifyContent: 'center',
  },
  providerDistance: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(45, 45, 45, 0.8)',
  },
  providerDistanceText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  providerName: {
    fontWeight: '600',
    color: '#2D2D2D',
  },
  providerLocation: {
    color: '#666',
  },
  providerFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  providerRating: {
    color: '#666',
  },
  providerMobile: {
    fontWeight: '600',
  },
  giftCardExpiry: {
    color: '#999',
  },
  placeholderText: {
    color: '#999',
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#F5F5F5',
    borderRadius: 24,
    padding: 4,
  },
  toggleButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleButtonActive: {
    backgroundColor: '#2D2D2D',
  },
  toggleText: {
    fontWeight: '600',
    color: '#666',
  },
  toggleTextActive: {
    color: '#FFFFFF',
  },
  instituteCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  instituteImage: {
    position: 'relative',
    backgroundColor: '#F5F5F5',
    overflow: 'hidden',
  },
  instituteImageActual: {
    width: '100%',
    height: '100%',
  },
  instituteImagePlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5F5F5',
  },
  instituteName: {
    fontWeight: '600',
    color: '#2D2D2D',
  },
  instituteLocation: {
    color: '#666',
  },
  instituteFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  instituteRating: {
    color: '#666',
    fontWeight: '500',
  },
  instituteServices: {
    color: '#FF6B6B',
    fontWeight: '600',
  },
  betaButton: {
    position: 'absolute',
    bottom: 100,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#6B4EFF',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 10,
    zIndex: 9999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  betaButtonText: {
    fontSize: 24,
  },
});

// Wrapper component with CopilotProvider
export const HomeScreen: React.FC = () => {
  return (
    <CopilotProvider
      stepNumberComponent={() => null}
      tooltipComponent={CustomTooltip}
      overlay="svg"
      animated
      backdropColor="rgba(0, 0, 0, 0.75)"
      verticalOffset={0}
    >
      <HomeScreenContent />
    </CopilotProvider>
  );
};
