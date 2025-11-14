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
import { useNavigation } from '@react-navigation/native';
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
    profile_picture: null,
    id_card_url: null,
    insurance_url: null,
    training_certificates: [],
    portfolio_images: [],
  });

  // New state for images
  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  const [idCard, setIdCard] = useState<string | null>(null);
  const [portfolioImages, setPortfolioImages] = useState<string[]>([]);

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
        setProfilePicture(existingProfile.profile_picture || null);
        setIdCard(existingProfile.id_card_url || null);
        setPortfolioImages(existingProfile.portfolio_images || []);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const pickImage = async (type: 'profile' | 'id' | 'portfolio') => {
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
          setProfile({ ...profile, profile_picture: imageUri });
        } else if (type === 'id') {
          setIdCard(imageUri);
          setProfile({ ...profile, id_card_url: imageUri });
        } else if (type === 'portfolio') {
          const newImages = result.assets.map(asset => asset.uri);
          const updatedPortfolio = [...portfolioImages, ...newImages].slice(0, 6); // Max 6 images
          setPortfolioImages(updatedPortfolio);
          setProfile({ ...profile, portfolio_images: updatedPortfolio });
        }
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const removePortfolioImage = (index: number) => {
    const updated = portfolioImages.filter((_, i) => i !== index);
    setPortfolioImages(updated);
    setProfile({ ...profile, portfolio_images: updated });
  };

  const saveProfile = async () => {
    try {
      // Validation
      if (!profile.legal_status) {
        Alert.alert(
          language === 'fr' ? 'Erreur' : 'Error',
          language === 'fr' ? 'Veuillez sélectionner votre statut légal' : 'Please select your legal status'
        );
        return;
      }

      if (!profile.confidentiality_accepted || !profile.terms_accepted) {
        Alert.alert(
          language === 'fr' ? 'Erreur' : 'Error',
          language === 'fr' ? 'Veuillez accepter les conditions' : 'Please accept the terms'
        );
        return;
      }

      setSaving(true);

      const profileData = {
        ...profile,
        profile_completed: true,
      };

      if (profile.id) {
        await contractorApi.updateProfile(user?.id || '', profileData);
      } else {
        await contractorApi.createProfile(profileData);
      }

      Alert.alert(
        language === 'fr' ? 'Succès' : 'Success',
        language === 'fr' ? 'Profil enregistré avec succès' : 'Profile saved successfully'
      );

      navigation.goBack();
    } catch (error) {
      console.error('Error saving profile:', error);
      Alert.alert('Error', 'Failed to save profile');
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
    { label: language === 'fr' ? 'Voiture' : 'Car', value: 'car' },
    { label: language === 'fr' ? 'Vélo' : 'Bike', value: 'bike' },
    { label: language === 'fr' ? 'Transport public' : 'Public Transport', value: 'public_transport' },
  ];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { padding: spacing(2.5), paddingTop: spacing(6) }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={{ fontSize: normalizeFontSize(24) }}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { fontSize: normalizeFontSize(18) }]}>
          {language === 'fr' ? 'Modifier le profil' : 'Edit Profile'}
        </Text>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={{ fontSize: normalizeFontSize(18) }}>✕</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView}>
        <View style={{ padding: spacing(2.5) }}>
          {/* Full Name (from user) */}
          <Text style={[styles.sectionTitle, { fontSize: normalizeFontSize(16), marginTop: spacing(2) }]}>
            {language === 'fr' ? 'Nom complet' : 'Full Name'}
          </Text>
          <Text style={[styles.infoText, { fontSize: normalizeFontSize(14), padding: spacing(1.5) }]}>
            {user?.firstName && user?.lastName
              ? `${user.firstName} ${user.lastName}`
              : 'Not set'}
          </Text>

          {/* Profile Picture */}
          <Text style={[styles.sectionTitle, { fontSize: normalizeFontSize(16), marginTop: spacing(2) }]}>
            {language === 'fr' ? 'Photo de profil' : 'Profile Picture'}
          </Text>
          <TouchableOpacity
            style={[styles.imageUpload, { padding: spacing(3) }]}
            onPress={() => pickImage('profile')}
          >
            {profilePicture ? (
              <Image source={{ uri: profilePicture }} style={styles.uploadedImage} />
            ) : (
              <Text style={{ fontSize: normalizeFontSize(14), color: '#666' }}>
                {language === 'fr' ? 'Appuyez pour télécharger' : 'Tap to upload'}
              </Text>
            )}
          </TouchableOpacity>

          {/* Contact Information */}
          <Text style={[styles.sectionTitle, { fontSize: normalizeFontSize(16), marginTop: spacing(3) }]}>
            {language === 'fr' ? 'Informations de contact' : 'Contact Information'}
          </Text>

          <Text style={[styles.label, { fontSize: normalizeFontSize(14), marginTop: spacing(1.5) }]}>
            Email
          </Text>
          <Text style={[styles.infoText, { fontSize: normalizeFontSize(14), padding: spacing(1.5) }]}>
            {user?.email || 'Not set'}
          </Text>

          <Text style={[styles.label, { fontSize: normalizeFontSize(14), marginTop: spacing(1.5) }]}>
            {language === 'fr' ? 'Téléphone' : 'Phone'}
          </Text>
          <Text style={[styles.infoText, { fontSize: normalizeFontSize(14), padding: spacing(1.5) }]}>
            {user?.phone || 'Not set'}
          </Text>

          {/* Legal Status */}
          <Text style={[styles.sectionTitle, { fontSize: normalizeFontSize(16), marginTop: spacing(3) }]}>
            {language === 'fr' ? 'Statut légal' : 'Legal Status'}
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
                {language === 'fr' ? 'Prestataire libre' : 'Independent Provider'}
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

          {/* SIRET / Registre du commerce */}
          <Text style={[styles.label, { fontSize: normalizeFontSize(14), marginTop: spacing(2) }]}>
            {profile.legal_status === 'salon'
              ? (language === 'fr' ? 'Registre du commerce' : 'Business Registration')
              : 'SIRET'}
          </Text>
          <TextInput
            style={[styles.input, { padding: spacing(1.5), fontSize: normalizeFontSize(14) }]}
            placeholder={profile.legal_status === 'salon' ? 'Business registration number' : 'SIRET number'}
            placeholderTextColor="#999"
            value={profile.siret_number}
            onChangeText={(text) => setProfile({ ...profile, siret_number: text })}
          />

          {/* Business Name (for salon) */}
          {profile.legal_status === 'salon' && (
            <>
              <Text style={[styles.label, { fontSize: normalizeFontSize(14), marginTop: spacing(2) }]}>
                {language === 'fr' ? 'Nom de l\'entreprise' : 'Business Name'}
              </Text>
              <TextInput
                style={[styles.input, { padding: spacing(1.5), fontSize: normalizeFontSize(14) }]}
                placeholder={language === 'fr' ? 'Nom du salon' : 'Salon name'}
                placeholderTextColor="#999"
                value={profile.business_name}
                onChangeText={(text) => setProfile({ ...profile, business_name: text })}
              />
            </>
          )}

          {/* Professional Experience */}
          <Text style={[styles.sectionTitle, { fontSize: normalizeFontSize(16), marginTop: spacing(3) }]}>
            {language === 'fr' ? 'Expérience professionnelle' : 'Professional Experience'}
          </Text>
          <TextInput
            style={[styles.textArea, { padding: spacing(1.5), fontSize: normalizeFontSize(14) }]}
            placeholder={language === 'fr' ? 'Décrivez votre expérience...' : 'Describe your experience...'}
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
            {language === 'fr' ? 'Types de services proposés' : 'Type of Services Provided'}
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
            {language === 'fr' ? 'Zones de confiance' : 'Trusted Zones'}
          </Text>
          <TextInput
            style={[styles.input, { padding: spacing(1.5), fontSize: normalizeFontSize(14) }]}
            placeholder={language === 'fr' ? 'Ex: Douala, Akwa, Bonanjo...' : 'E.g: Douala, Akwa, Bonanjo...'}
            placeholderTextColor="#999"
            multiline
          />

          {/* ID Card */}
          <Text style={[styles.sectionTitle, { fontSize: normalizeFontSize(16), marginTop: spacing(3) }]}>
            {profile.legal_status === 'salon'
              ? (language === 'fr' ? 'Carte d\'identité du responsable' : 'Manager\'s ID Card')
              : (language === 'fr' ? 'Carte d\'identité' : 'ID Card')}
          </Text>
          <TouchableOpacity
            style={[styles.imageUpload, { padding: spacing(3) }]}
            onPress={() => pickImage('id')}
          >
            {idCard ? (
              <Image source={{ uri: idCard }} style={styles.uploadedImage} />
            ) : (
              <Text style={{ fontSize: normalizeFontSize(14), color: '#666' }}>
                {language === 'fr' ? 'Appuyez pour télécharger' : 'Tap to upload'}
              </Text>
            )}
          </TouchableOpacity>

          {/* Training Certificates (Optional) */}
          <Text style={[styles.sectionTitle, { fontSize: normalizeFontSize(16), marginTop: spacing(3) }]}>
            {language === 'fr' ? 'Certificats de formation (Optionnel)' : 'Training Certificates (Optional)'}
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
            {language === 'fr' ? 'Langues parlées' : 'Languages Spoken'}
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
            {language === 'fr' ? 'Moyens de transport disponibles' : 'Available Transportation'}
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
              {language === 'fr' ? 'Accord de confidentialité' : 'Confidentiality Agreement'}
            </Text>
            <Switch
              value={profile.confidentiality_accepted}
              onValueChange={(value) => setProfile({ ...profile, confidentiality_accepted: value })}
            />
          </View>

          <View style={[styles.switchRow, { marginTop: spacing(1.5) }]}>
            <Text style={[styles.switchLabel, { fontSize: normalizeFontSize(14), flex: 1 }]}>
              {language === 'fr' ? 'Conditions générales' : 'Terms and Conditions'}
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
                {language === 'fr' ? 'Enregistrer' : 'Save'}
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
});
