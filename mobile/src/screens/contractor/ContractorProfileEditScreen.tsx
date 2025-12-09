import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Switch,
  Image,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { useResponsive } from '../../hooks/useResponsive';
import { useI18n } from '../../i18n/I18nContext';
import { useAuth } from '../../contexts/AuthContext';
import { contractorApi, categoriesApi, type ContractorProfile } from '../../services/api';

interface Category {
  category: string;
  name_fr: string;
  name_en: string;
}

export const ContractorProfileEditScreen = () => {
  const { normalizeFontSize, spacing } = useResponsive();
  const { language, t } = useI18n();
  const { user } = useAuth();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);

  const [profile, setProfile] = useState<Partial<ContractorProfile>>({
    user_id: user?.id,
    business_name: '',
    siret_number: '',
    legal_status: 'independant', // 'independant' or 'salon'
    professional_experience: '',
    types_of_services: [],
    languages_spoken: ['fr'],
    available_transportation: [],
    service_zones: [],
    confidentiality_accepted: false,
    terms_accepted: false,
    profile_image: undefined,
    id_card_url: undefined,
    insurance_url: undefined,
    training_certificates: [],
    portfolio_images: [],
  });

  // New state for images
  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  const [idCardFront, setIdCardFront] = useState<string | null>(null);
  const [idCardBack, setIdCardBack] = useState<string | null>(null);
  const [portfolioImages, setPortfolioImages] = useState<string[]>([]);

  // New state for trusted zones
  const [trustedZones, setTrustedZones] = useState<{ city: string; district: string }[]>([]);
  const [newZone, setNewZone] = useState('');
  const [addressSuggestions, setAddressSuggestions] = useState<any[]>([]);
  const [isSearchingAddress, setIsSearchingAddress] = useState(false);

  // New state for Provider Address
  const [providerAddressQuery, setProviderAddressQuery] = useState('');
  const [providerLocation, setProviderLocation] = useState<{
    latitude: number;
    longitude: number;
    city: string;
    region: string;
    address: string;
  } | null>(null);
  const [providerAddressSuggestions, setProviderAddressSuggestions] = useState<any[]>([]);
  const [isSearchingProviderAddress, setIsSearchingProviderAddress] = useState(false);

  useEffect(() => {
    loadProfile();
    loadCategories();
    requestPermissions();
  }, []);

  const requestPermissions = async () => {
    try {
      await ImagePicker.requestMediaLibraryPermissionsAsync();
      await ImagePicker.requestCameraPermissionsAsync();
    } catch (error) {
      console.error('Error requesting permissions:', error);
    }
  };

  const loadCategories = async () => {
    try {
      const cats = await categoriesApi.getAll();
      setCategories(cats);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const loadProfile = async () => {
    try {
      setLoading(true);
      const existingProfile = await contractorApi.getProfileByUserId(user?.id || '');
      if (existingProfile) {
        setProfile(existingProfile);
        setProfilePicture(existingProfile.profile_image || null);
        // Handle ID card (could be object with front/back or just string)
        if (typeof existingProfile.id_card_url === 'object') {
          setIdCardFront(existingProfile.id_card_url?.front || null);
          setIdCardBack(existingProfile.id_card_url?.back || null);
        } else {
          setIdCardFront(existingProfile.id_card_url || null);
        }
        setPortfolioImages(existingProfile.portfolio_images || []);

        // Handle service_zones (could be array of strings or array of objects)
        if (existingProfile.service_zones && existingProfile.service_zones.length > 0) {
          const firstZone = existingProfile.service_zones[0];
          if (typeof firstZone === 'string') {
            // Legacy: array of strings
            const zones = (existingProfile.service_zones as string[]).map(z => ({ city: 'Unknown', district: z }));
            setTrustedZones(zones);
          } else {
            // Objects: could be new format {city, district} or old ServiceZone {location, radius}
            const zones = (existingProfile.service_zones as any[]).map((zone: any) => {
              if (zone.city && zone.district) {
                return { city: zone.city, district: zone.district };
              }
              // Try to extract from location address if available
              const address = zone.location?.address || '';
              return { city: 'Unknown', district: address || 'Unknown' };
            });
            setTrustedZones(zones);
          }
        }

        // Handle provider location
        if (existingProfile.latitude && existingProfile.longitude) {
          setProviderLocation({
            latitude: existingProfile.latitude,
            longitude: existingProfile.longitude,
            city: existingProfile.city || 'Unknown',
            region: existingProfile.region || 'Unknown',
            address: `${existingProfile.city || ''} ${existingProfile.region || ''}`.trim(),
          });
          setProviderAddressQuery(`${existingProfile.city || ''} ${existingProfile.region || ''}`.trim());
        }
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const pickImage = async (type: 'profile' | 'id_front' | 'id_back' | 'portfolio') => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'images',
        allowsEditing: type !== 'portfolio',
        quality: 0.8,
        allowsMultipleSelection: type === 'portfolio',
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const imageUri = result.assets[0].uri;

        if (type === 'profile') {
          setProfilePicture(imageUri);
          setProfile({ ...profile, profile_image: imageUri });
        } else if (type === 'id_front') {
          setIdCardFront(imageUri);
          const updatedIdCard = { front: imageUri, back: idCardBack };
          setProfile({ ...profile, id_card_url: updatedIdCard as any });
        } else if (type === 'id_back') {
          setIdCardBack(imageUri);
          const updatedIdCard = { front: idCardFront, back: imageUri };
          setProfile({ ...profile, id_card_url: updatedIdCard as any });
        } else if (type === 'portfolio') {
          const newImages = result.assets.map(asset => asset.uri);
          const updatedPortfolio = [...portfolioImages, ...newImages].slice(0, 6); // Max 6 images
          setPortfolioImages(updatedPortfolio);
          setProfile({ ...profile, portfolio_images: updatedPortfolio });
        }
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert(t.common.error, 'Failed to pick image');
    }
  };

  const removePortfolioImage = (index: number) => {
    const updated = portfolioImages.filter((_, i) => i !== index);
    setPortfolioImages(updated);
    setProfile({ ...profile, portfolio_images: updated });
  };

  const searchAddress = async (query: string) => {
    setNewZone(query);
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
    const city = item.address?.city || item.address?.town || item.address?.village || item.address?.state || 'Unknown';
    const district = item.address?.suburb || item.address?.neighbourhood || item.address?.quarter || item.name;

    if (city && district) {
      const newZoneObj = { city, district };
      // Check for duplicates
      const exists = trustedZones.some(z => z.city === newZoneObj.city && z.district === newZoneObj.district);
      if (!exists) {
        const updated = [...trustedZones, newZoneObj];
        setTrustedZones(updated);
        setProfile({ ...profile, service_zones: updated as any });
      }
    }

    setNewZone('');
    setAddressSuggestions([]);
  };

  const removeTrustedZone = (index: number) => {
    const updated = trustedZones.filter((_, i) => i !== index);
    setTrustedZones(updated);
    setProfile({ ...profile, service_zones: updated as any });
  };

  const searchProviderAddress = async (query: string) => {
    setProviderAddressQuery(query);
    if (query.length < 3) {
      setProviderAddressSuggestions([]);
      return;
    }

    try {
      setIsSearchingProviderAddress(true);
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=cm&addressdetails=1&limit=5`,
        {
          headers: {
            'User-Agent': 'KMR-Beauty-App/1.0'
          }
        }
      );
      const data = await response.json();
      setProviderAddressSuggestions(data);
    } catch (error) {
      console.error('Error searching provider address:', error);
    } finally {
      setIsSearchingProviderAddress(false);
    }
  };

  const selectProviderAddress = (item: any) => {
    console.log('📍 Selected Address Item:', JSON.stringify(item, null, 2));

    const addr = item.address || {};
    // More robust extraction
    const city = addr.city || addr.town || addr.village || addr.municipality || addr.hamlet || addr.county || 'Unknown';
    const region = addr.state || addr.region || addr.province || addr['ISO3166-2-lvl4'] || 'Unknown';

    const lat = parseFloat(item.lat);
    const lon = parseFloat(item.lon);

    console.log('✅ Extracted Location:', { lat, lon, city, region });

    setProviderLocation({
      latitude: lat,
      longitude: lon,
      city,
      region,
      address: item.display_name,
    });
    setProviderAddressQuery(item.display_name);
    setProviderAddressSuggestions([]);
  };

  const saveProfile = async () => {
    try {
      // Validation
      if (!profile.business_name) {
        Alert.alert(t.common.error, 'Veuillez entrer le nom de votre entreprise ou votre nom commercial');
        return;
      }

      if (!profile.professional_experience) {
        Alert.alert(t.common.error, 'Veuillez décrire votre expérience professionnelle');
        return;
      }

      if (!profile.legal_status) {
        Alert.alert(
          t.common.error,
          t.contractorProfile.selectLegalStatus
        );
        return;
      }

      if (!profile.confidentiality_accepted || !profile.terms_accepted) {
        Alert.alert(
          t.common.error,
          t.contractorProfile.acceptTerms
        );
        return;
      }

      // Mandatory fields validation
      if (!profilePicture && !profile.profile_image) {
        Alert.alert(
          t.common.error,
          t.contractorProfile.requiredFields
        );
        return;
      }

      if (!profile.types_of_services || profile.types_of_services.length === 0) {
        Alert.alert(
          t.common.error,
          t.contractorProfile.requiredFields
        );
        return;
      }

      if (!trustedZones || trustedZones.length === 0) {
        Alert.alert(
          t.common.error,
          t.contractorProfile.requiredFields
        );
        return;
      }

      if (!providerLocation) {
        Alert.alert(
          t.common.error,
          'Veuillez définir votre adresse principale'
        );
        return;
      }

      setSaving(true);

      // Upload images if they are local URIs
      const profileData = { ...profile };

      // Upload profile picture
      if (profilePicture && profilePicture.startsWith('file://')) {
        const result = await contractorApi.uploadFile(profilePicture, user?.id || '', 'profile');
        profileData.profile_image = result.url;
      } else if (profilePicture) {
        profileData.profile_image = profilePicture;
      }

      // Upload ID card front and back
      const idCardUrls: any = {};
      if (idCardFront && idCardFront.startsWith('file://')) {
        const result = await contractorApi.uploadFile(idCardFront, user?.id || '', 'id_front');
        idCardUrls.front = result.url;
      } else if (idCardFront) {
        idCardUrls.front = idCardFront;
      }

      if (idCardBack && idCardBack.startsWith('file://')) {
        const result = await contractorApi.uploadFile(idCardBack, user?.id || '', 'id_back');
        idCardUrls.back = result.url;
      } else if (idCardBack) {
        idCardUrls.back = idCardBack;
      }

      if (idCardUrls.front || idCardUrls.back) {
        profileData.id_card_url = idCardUrls as any;
      }

      // Upload portfolio images
      const uploadedPortfolio: string[] = [];
      for (const img of portfolioImages) {
        if (img.startsWith('file://')) {
          const result = await contractorApi.uploadFile(img, user?.id || '', 'portfolio');
          uploadedPortfolio.push(result.url);
        } else {
          uploadedPortfolio.push(img);
        }
      }
      if (uploadedPortfolio.length > 0) {
        profileData.portfolio_images = uploadedPortfolio;
      }

      if (uploadedPortfolio.length > 0) {
        profileData.portfolio_images = uploadedPortfolio;
      }

      // Add location data
      if (providerLocation) {
        profileData.latitude = providerLocation.latitude;
        profileData.longitude = providerLocation.longitude;
        profileData.city = providerLocation.city;
        profileData.region = providerLocation.region;
      }

      profileData.profile_completed = true;

      // Ensure user_id is set
      if (!profileData.user_id && user?.id) {
        profileData.user_id = user.id;
      }

      const isNewProfile = !profile.id;

      if (profile.id) {
        await contractorApi.updateProfile(user?.id || '', profileData);
      } else {
        await contractorApi.createProfile(profileData);
      }

      Alert.alert(
        t.common.success,
        t.contractorProfile.profileSaved,
        [
          {
            text: 'OK',
            onPress: () => {
              // @ts-ignore
              const isSetupFlow = route.params?.isSetupFlow;

              if (isNewProfile || isSetupFlow) {
                // Navigate to services screen for new profiles or setup flow
                navigation.navigate('ContractorServices');
              } else {
                navigation.goBack();
              }
            },
          },
        ]
      );

      // Don't auto-navigate - let user click OK first
    } catch (error: any) {
      console.error('Error saving profile:', error);
      Alert.alert(
        t.common.error,
        error.message || 'Failed to save profile'
      );
    } finally {
      setSaving(false);
    }
  };

  const toggleCategory = (categoryId: string) => {
    const current = profile.types_of_services || [];
    const updated = current.includes(categoryId)
      ? current.filter((t) => t !== categoryId)
      : [...current, categoryId];
    setProfile({ ...profile, types_of_services: updated });
  };

  const toggleLanguage = (lang: string) => {
    const current = profile.languages_spoken || [];
    const updated = current.includes(lang)
      ? current.filter((l) => l !== lang)
      : [...current, lang];
    setProfile({ ...profile, languages_spoken: updated });
  };

  const toggleTransportation = (transport: string) => {
    const current = profile.available_transportation || [];
    const updated = current.includes(transport)
      ? current.filter((t) => t !== transport)
      : [...current, transport];
    setProfile({ ...profile, available_transportation: updated });
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#2D2D2D" />
      </View>
    );
  }

  const languages = [
    { label: 'English', value: 'en' },
    { label: 'Français', value: 'fr' },
    { label: 'Italiano', value: 'it' },
    { label: 'العربية', value: 'ar' },
  ];

  const transportOptions = [
    { label: t.contractorProfile.car, value: 'car' },
    { label: t.contractorProfile.bike, value: 'bike' },
    { label: t.contractorProfile.publicTransport, value: 'public_transport' },
  ];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { padding: spacing(2.5), paddingTop: spacing(6) }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={{ fontSize: normalizeFontSize(24) }}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { fontSize: normalizeFontSize(18) }]}>
          {t.contractorProfile.editProfile}
        </Text>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={{ fontSize: normalizeFontSize(18) }}>✕</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView}>
        <View style={{ padding: spacing(2.5) }}>
          {/* Full Name (from user) */}
          <Text style={[styles.sectionTitle, { fontSize: normalizeFontSize(16), marginTop: spacing(2) }]}>
            {t.contractorProfile.fullName}
          </Text>
          <Text style={[styles.infoText, { fontSize: normalizeFontSize(14), padding: spacing(1.5) }]}>
            {user?.firstName && user?.lastName
              ? `${user.firstName} ${user.lastName}`
              : 'Not set'}
          </Text>

          {/* Profile Picture */}
          <Text style={[styles.sectionTitle, { fontSize: normalizeFontSize(16), marginTop: spacing(2) }]}>
            {t.contractorProfile.profilePicture}
          </Text>
          <TouchableOpacity
            style={[styles.imageUpload, { padding: spacing(3) }]}
            onPress={() => pickImage('profile')}
          >
            {profilePicture ? (
              <Image source={{ uri: profilePicture }} style={styles.uploadedImage} />
            ) : (
              <Text style={{ fontSize: normalizeFontSize(14), color: '#666' }}>
                {t.contractorProfile.tapToUpload}
              </Text>
            )}
          </TouchableOpacity>

          {/* Contact Information */}
          <Text style={[styles.sectionTitle, { fontSize: normalizeFontSize(16), marginTop: spacing(3) }]}>
            {t.contractorProfile.contactInfo}
          </Text>

          <Text style={[styles.label, { fontSize: normalizeFontSize(14), marginTop: spacing(1.5) }]}>
            Email
          </Text>
          <Text style={[styles.infoText, { fontSize: normalizeFontSize(14), padding: spacing(1.5) }]}>
            {user?.email || 'Not set'}
          </Text>

          <Text style={[styles.label, { fontSize: normalizeFontSize(14), marginTop: spacing(1.5) }]}>
            {t.auth.phone}
          </Text>
          <Text style={[styles.infoText, { fontSize: normalizeFontSize(14), padding: spacing(1.5) }]}>
            {user?.phone || 'Not set'}
          </Text>

          {/* Provider Address */}
          <Text style={[styles.sectionTitle, { fontSize: normalizeFontSize(16), marginTop: spacing(3) }]}>
            {t.contractorProfile.address || 'Adresse Principale'}
          </Text>
          <View style={[styles.addZoneContainer, { marginTop: spacing(1), flexDirection: 'column', alignItems: 'stretch' }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <TextInput
                style={[styles.zoneInput, { padding: spacing(1.5), fontSize: normalizeFontSize(14), flex: 1 }]}
                placeholder="Rechercher votre adresse..."
                placeholderTextColor="#999"
                value={providerAddressQuery}
                onChangeText={searchProviderAddress}
              />
              {isSearchingProviderAddress && (
                <ActivityIndicator size="small" color="#2D2D2D" style={{ marginLeft: spacing(1) }} />
              )}
            </View>

            {/* Address Suggestions */}
            {providerAddressSuggestions.length > 0 && (
              <View style={styles.suggestionsContainer}>
                {providerAddressSuggestions.map((item, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.suggestionItem}
                    onPress={() => selectProviderAddress(item)}
                  >
                    <Text style={styles.suggestionText}>{item.display_name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Business Name */}
          <Text style={[styles.sectionTitle, { fontSize: normalizeFontSize(16), marginTop: spacing(3) }]}>
            {t.auth.businessName || 'Nom Commercial / Entreprise'}
          </Text>
          <TextInput
            style={[styles.zoneInput, { padding: spacing(1.5), fontSize: normalizeFontSize(14), marginTop: spacing(1) }]}
            placeholder={t.auth.businessNamePlaceholder || 'Votre nom commercial'}
            value={profile.business_name}
            onChangeText={(text) => setProfile({ ...profile, business_name: text })}
          />

          {/* Bio / Professional Experience */}
          <Text style={[styles.sectionTitle, { fontSize: normalizeFontSize(16), marginTop: spacing(3) }]}>
            {t.auth.bio || 'Biographie / Expérience'}
          </Text>
          <TextInput
            style={[styles.zoneInput, { padding: spacing(1.5), marginTop: spacing(1), height: 100, textAlignVertical: 'top' }]}
            placeholder={t.auth.bioPlaceholder || 'Décrivez votre expérience et vos services...'}
            value={profile.professional_experience}
            onChangeText={(text) => setProfile({ ...profile, professional_experience: text })}
            multiline
            numberOfLines={4}
          />

          {/* Years of Experience */}
          <Text style={[styles.sectionTitle, { fontSize: normalizeFontSize(16), marginTop: spacing(3) }]}>
            {t.auth.experience || "Années d'expérience"}
          </Text>
          <TextInput
            style={[styles.zoneInput, { padding: spacing(1.5), fontSize: normalizeFontSize(14), marginTop: spacing(1) }]}
            placeholder="Ex: 5"
            value={profile.experience?.toString()}
            onChangeText={(text) => setProfile({ ...profile, experience: parseInt(text) || 0 })}
            keyboardType="numeric"
          />

          {/* Legal Status */}
          <Text style={[styles.sectionTitle, { fontSize: normalizeFontSize(16), marginTop: spacing(3) }]}>
            {t.contractorProfile.legalStatus}
          </Text>
          <View style={[styles.radioGroup, { marginTop: spacing(1) }]}>
            <TouchableOpacity
              style={[styles.radioOption, { padding: spacing(1.5) }]}
              onPress={() => setProfile({ ...profile, legal_status: 'independant' })}
            >
              <View style={styles.radio}>
                {profile.legal_status === 'independant' && <View style={styles.radioSelected} />}
              </View>
              <Text style={[styles.radioLabel, { fontSize: normalizeFontSize(14) }]}>
                {t.contractorProfile.independent}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.radioOption, { padding: spacing(1.5) }]}
              onPress={() => setProfile({ ...profile, legal_status: 'salon' })}
            >
              <View style={styles.radio}>
                {profile.legal_status === 'salon' && <View style={styles.radioSelected} />}
              </View>
              <Text style={[styles.radioLabel, { fontSize: normalizeFontSize(14) }]}>
                Salon
              </Text>
            </TouchableOpacity>
          </View>

          {/* SIRET / Registre du commerce (for salon only) */}
          {profile.legal_status === 'salon' && (
            <>
              <Text style={[styles.label, { fontSize: normalizeFontSize(14), marginTop: spacing(2) }]}>
                {t.contractorProfile.businessRegistration}
              </Text>
              <TextInput
                style={[styles.input, { padding: spacing(1.5), fontSize: normalizeFontSize(14) }]}
                placeholder={t.contractorProfile.businessRegistrationNumber}
                placeholderTextColor="#999"
                value={profile.siret_number}
                onChangeText={(text) => setProfile({ ...profile, siret_number: text })}
              />

              <Text style={[styles.label, { fontSize: normalizeFontSize(14), marginTop: spacing(2) }]}>
                {t.contractorProfile.businessName}
              </Text>
              <TextInput
                style={[styles.input, { padding: spacing(1.5), fontSize: normalizeFontSize(14) }]}
                placeholder={t.contractorProfile.salonName}
                placeholderTextColor="#999"
                value={profile.business_name}
                onChangeText={(text) => setProfile({ ...profile, business_name: text })}
              />
            </>
          )}

          {/* Professional Experience */}
          <Text style={[styles.sectionTitle, { fontSize: normalizeFontSize(16), marginTop: spacing(3) }]}>
            {t.contractorProfile.professionalExperience}
          </Text>
          <TextInput
            style={[styles.textArea, { padding: spacing(1.5), fontSize: normalizeFontSize(14) }]}
            placeholder={t.contractorProfile.describeExperience}
            placeholderTextColor="#999"
            multiline
            numberOfLines={4}
            maxLength={500}
            value={profile.professional_experience}
            onChangeText={(text) => setProfile({ ...profile, professional_experience: text })}
          />
          <Text style={[styles.charCount, { fontSize: normalizeFontSize(12) }]}>
            {profile.professional_experience?.length || 0}/500
          </Text>

          {/* Type of Services */}
          <Text style={[styles.sectionTitle, { fontSize: normalizeFontSize(16), marginTop: spacing(3) }]}>
            {t.contractorProfile.servicesProvided}
          </Text>
          <View style={{ marginTop: spacing(1) }}>
            {categories.map((cat) => (
              <TouchableOpacity
                key={cat.category}
                style={[styles.checkbox, { paddingVertical: spacing(1.5) }]}
                onPress={() => toggleCategory(cat.category)}
              >
                <View style={styles.checkboxBox}>
                  {profile.types_of_services?.includes(cat.category) && (
                    <Text style={styles.checkboxTick}>✓</Text>
                  )}
                </View>
                <Text style={[styles.checkboxLabel, { fontSize: normalizeFontSize(14) }]}>
                  {language === 'fr' ? cat.name_fr : cat.name_en}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Trusted Zones */}
          <Text style={[styles.sectionTitle, { fontSize: normalizeFontSize(16), marginTop: spacing(3) }]}>
            {t.contractorProfile.trustedZones}
          </Text>

          {/* Add Zone Input */}
          <View style={[styles.addZoneContainer, { marginTop: spacing(1), flexDirection: 'column', alignItems: 'stretch' }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <TextInput
                style={[styles.zoneInput, { padding: spacing(1.5), fontSize: normalizeFontSize(14), flex: 1 }]}
                placeholder={t.contractorProfile.searchNeighborhood}
                placeholderTextColor="#999"
                value={newZone}
                onChangeText={searchAddress}
              />
              {isSearchingAddress && (
                <ActivityIndicator size="small" color="#2D2D2D" style={{ marginLeft: spacing(1) }} />
              )}
            </View>

            {/* Address Suggestions */}
            {addressSuggestions.length > 0 && (
              <View style={styles.suggestionsContainer}>
                {addressSuggestions.map((item, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.suggestionItem}
                    onPress={() => selectAddress(item)}
                  >
                    <Text style={styles.suggestionText}>{item.display_name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* List of Zones */}
          <View style={[styles.zonesList, { marginTop: spacing(1.5) }]}>
            {trustedZones.map((zone, index) => (
              <View key={index} style={[styles.zoneChip, { padding: spacing(1), marginBottom: spacing(1) }]}>
                <Text style={[styles.zoneText, { fontSize: normalizeFontSize(14) }]}>
                  {zone.district}{zone.city !== 'Unknown' ? `, ${zone.city}` : ''}
                </Text>
                <TouchableOpacity onPress={() => removeTrustedZone(index)}>
                  <Text style={[styles.zoneRemove, { fontSize: normalizeFontSize(16) }]}>✕</Text>
                </TouchableOpacity>
              </View>
            ))}
            {trustedZones.length === 0 && (
              <Text style={[styles.emptyText, { fontSize: normalizeFontSize(12), color: '#999' }]}>
                {t.contractorProfile.noZonesAdded}
              </Text>
            )}
          </View>

          {/* ID Card Recto/Verso */}
          <Text style={[styles.sectionTitle, { fontSize: normalizeFontSize(16), marginTop: spacing(3) }]}>
            {profile.legal_status === 'salon'
              ? t.contractorProfile.managerIdCard
              : t.contractorProfile.idCard}
          </Text>

          {/* ID Card Front */}
          <Text style={[styles.label, { fontSize: normalizeFontSize(14), marginTop: spacing(1.5) }]}>
            {t.contractorProfile.front}
          </Text>
          <TouchableOpacity
            style={[styles.imageUpload, { padding: spacing(3) }]}
            onPress={() => pickImage('id_front')}
          >
            {idCardFront ? (
              <Image source={{ uri: idCardFront }} style={styles.uploadedImage} />
            ) : (
              <Text style={{ fontSize: normalizeFontSize(14), color: '#666' }}>
                {t.contractorProfile.tapToUploadFront}
              </Text>
            )}
          </TouchableOpacity>

          {/* ID Card Back */}
          <Text style={[styles.label, { fontSize: normalizeFontSize(14), marginTop: spacing(1.5) }]}>
            {t.contractorProfile.back}
          </Text>
          <TouchableOpacity
            style={[styles.imageUpload, { padding: spacing(3) }]}
            onPress={() => pickImage('id_back')}
          >
            {idCardBack ? (
              <Image source={{ uri: idCardBack }} style={styles.uploadedImage} />
            ) : (
              <Text style={{ fontSize: normalizeFontSize(14), color: '#666' }}>
                {t.contractorProfile.tapToUploadBack}
              </Text>
            )}
          </TouchableOpacity>

          {/* Training Certificates (Optional) */}
          <Text style={[styles.sectionTitle, { fontSize: normalizeFontSize(16), marginTop: spacing(3) }]}>
            {t.contractorProfile.trainingCertificates}
          </Text>
          <TouchableOpacity style={[styles.imageUpload, { padding: spacing(3) }]}>
            <Text style={{ fontSize: normalizeFontSize(14), color: '#666' }}>
              {language === 'fr' ? 'Appuyez pour télécharger' : 'Tap to upload'}
            </Text>
          </TouchableOpacity>

          {/* Portfolio */}
          <Text style={[styles.sectionTitle, { fontSize: normalizeFontSize(16), marginTop: spacing(3) }]}>
            Portfolio
          </Text>
          <View style={styles.portfolioGrid}>
            {portfolioImages.map((img, index) => (
              <View key={index} style={[styles.portfolioItem, { width: spacing(12), height: spacing(12) }]}>
                <Image source={{ uri: img }} style={styles.portfolioImage} />
                <TouchableOpacity
                  style={styles.portfolioRemove}
                  onPress={() => removePortfolioImage(index)}
                >
                  <Text style={styles.portfolioRemoveText}>✕</Text>
                </TouchableOpacity>
              </View>
            ))}
            {portfolioImages.length < 6 && (
              <TouchableOpacity
                style={[styles.portfolioItem, styles.portfolioAdd, { width: spacing(12), height: spacing(12) }]}
                onPress={() => pickImage('portfolio')}
              >
                <Text style={{ fontSize: normalizeFontSize(24), color: '#666' }}>+</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Languages */}
          <Text style={[styles.sectionTitle, { fontSize: normalizeFontSize(16), marginTop: spacing(3) }]}>
            {t.contractorProfile.languagesSpoken}
          </Text>
          <View style={{ marginTop: spacing(1) }}>
            {languages.map((lang) => (
              <TouchableOpacity
                key={lang.value}
                style={[styles.checkbox, { paddingVertical: spacing(1.5) }]}
                onPress={() => toggleLanguage(lang.value)}
              >
                <View style={styles.checkboxBox}>
                  {profile.languages_spoken?.includes(lang.value) && (
                    <Text style={styles.checkboxTick}>✓</Text>
                  )}
                </View>
                <Text style={[styles.checkboxLabel, { fontSize: normalizeFontSize(14) }]}>
                  {lang.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Transportation */}
          <Text style={[styles.sectionTitle, { fontSize: normalizeFontSize(16), marginTop: spacing(3) }]}>
            {t.contractorProfile.availableTransportation}
          </Text>
          <View style={{ marginTop: spacing(1) }}>
            {transportOptions.map((trans) => (
              <TouchableOpacity
                key={trans.value}
                style={[styles.checkbox, { paddingVertical: spacing(1.5) }]}
                onPress={() => toggleTransportation(trans.value)}
              >
                <View style={styles.checkboxBox}>
                  {profile.available_transportation?.includes(trans.value) && (
                    <Text style={styles.checkboxTick}>✓</Text>
                  )}
                </View>
                <Text style={[styles.checkboxLabel, { fontSize: normalizeFontSize(14) }]}>
                  {trans.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Legal Agreements */}
          <View style={[styles.switchRow, { marginTop: spacing(3) }]}>
            <Text style={[styles.switchLabel, { fontSize: normalizeFontSize(14), flex: 1 }]}>
              {t.contractorProfile.confidentialityAgreement}
            </Text>
            <Switch
              value={profile.confidentiality_accepted}
              onValueChange={(value) => setProfile({ ...profile, confidentiality_accepted: value })}
            />
          </View>

          <View style={[styles.switchRow, { marginTop: spacing(1.5) }]}>
            <Text style={[styles.switchLabel, { fontSize: normalizeFontSize(14), flex: 1 }]}>
              {t.contractorProfile.termsAndConditions}
            </Text>
            <Switch
              value={profile.terms_accepted}
              onValueChange={(value) => setProfile({ ...profile, terms_accepted: value })}
            />
          </View>

          {/* Save Button */}
          <TouchableOpacity
            style={[styles.saveButton, { padding: spacing(2), marginTop: spacing(4), marginBottom: spacing(4) }]}
            onPress={saveProfile}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={[styles.saveButtonText, { fontSize: normalizeFontSize(16) }]}>
                {t.contractorProfile.save}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
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
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  title: {
    fontWeight: 'bold',
  },
  scrollView: {
    flex: 1,
  },
  sectionTitle: {
    fontWeight: '600',
    color: '#2D2D2D',
  },
  label: {
    color: '#666',
  },
  infoText: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    color: '#2D2D2D',
  },
  input: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    marginTop: 8,
  },
  textArea: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    marginTop: 8,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  charCount: {
    textAlign: 'right',
    color: '#999',
    marginTop: 4,
  },
  imageUpload: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    marginTop: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 100,
  },
  uploadedImage: {
    width: '100%',
    height: 100,
    borderRadius: 8,
  },
  radioGroup: {
    gap: 8,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#2D2D2D',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  radioSelected: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#2D2D2D',
  },
  radioLabel: {
    color: '#2D2D2D',
  },
  checkbox: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkboxBox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: '#2D2D2D',
    borderRadius: 4,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxTick: {
    fontSize: 14,
    color: '#2D2D2D',
    fontWeight: 'bold',
  },
  checkboxLabel: {
    color: '#2D2D2D',
  },
  portfolioGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  portfolioItem: {
    position: 'relative',
    borderRadius: 8,
    overflow: 'hidden',
  },
  portfolioImage: {
    width: '100%',
    height: '100%',
  },
  portfolioRemove: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(0,0,0,0.6)',
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  portfolioRemoveText: {
    color: '#FFF',
    fontSize: 16,
  },
  portfolioAdd: {
    backgroundColor: '#FFF',
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  switchLabel: {
    color: '#2D2D2D',
  },
  saveButton: {
    backgroundColor: '#2D2D2D',
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#FFF',
    fontWeight: '600',
  },
  addZoneContainer: {
    flexDirection: 'column',
    gap: 8,
  },
  zoneInput: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
  },
  suggestionsContainer: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    marginTop: 4,
    maxHeight: 200,
    zIndex: 1000,
  },
  suggestionItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  suggestionText: {
    fontSize: 14,
    color: '#333',
  },
  zonesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 10,
    gap: 8,
  },
  zoneChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F0F0',
    borderRadius: 20,
    paddingHorizontal: 12,
  },
  zoneText: {
    color: '#2D2D2D',
  },
  zoneRemove: {
    color: '#FF4444',
    fontWeight: 'bold',
    marginLeft: 8,
  },
  emptyText: {
    fontStyle: 'italic',
    color: '#999',
  },
});
