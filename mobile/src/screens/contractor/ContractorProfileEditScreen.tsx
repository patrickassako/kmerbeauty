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
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useResponsive } from '../../hooks/useResponsive';
import { useI18n } from '../../i18n/I18nContext';
import { useAuth } from '../../contexts/AuthContext';
import { contractorApi, type ContractorProfile } from '../../services/api';

export const ContractorProfileEditScreen = () => {
  const { normalizeFontSize, spacing } = useResponsive();
  const { language } = useI18n();
  const { user } = useAuth();
  const navigation = useNavigation<any>();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<Partial<ContractorProfile>>({
    user_id: user?.id,
    business_name: '',
    siret_number: '',
    legal_status: '',
    professional_experience: '',
    types_of_services: [],
    languages_spoken: ['fr'],
    available_transportation: [],
    confidentiality_accepted: false,
    terms_accepted: false,
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const existingProfile = await contractorApi.getProfileByUserId(user?.id || '');
      if (existingProfile) {
        setProfile(existingProfile);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveProfile = async () => {
    try {
      setSaving(true);

      const profileData = {
        ...profile,
        profile_completed: true, // Mark as completed when saving
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

  const toggleServiceType = (serviceType: string) => {
    const current = profile.types_of_services || [];
    const updated = current.includes(serviceType)
      ? current.filter((t) => t !== serviceType)
      : [...current, serviceType];
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

  const serviceTypes = [
    { label: 'Hairdressing', value: 'hairdressing' },
    { label: 'Beauty', value: 'beauty' },
    { label: 'Massage', value: 'massage' },
    { label: 'Nail Care', value: 'nails' },
  ];

  const languages = [
    { label: 'English', value: 'en' },
    { label: 'Français', value: 'fr' },
    { label: 'Italiano', value: 'it' },
    { label: 'العربية', value: 'ar' },
  ];

  const transportOptions = [
    { label: 'Car', value: 'car' },
    { label: 'Bike', value: 'bike' },
    { label: 'Public Transport', value: 'public_transport' },
  ];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { padding: spacing(2.5), paddingTop: spacing(6) }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={{ fontSize: normalizeFontSize(24) }}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { fontSize: normalizeFontSize(18) }]}>Edit Profile</Text>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={{ fontSize: normalizeFontSize(18) }}>✕</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView}>
        <View style={{ padding: spacing(2.5) }}>
          {/* Full Name (from user) */}
          <Text style={[styles.sectionTitle, { fontSize: normalizeFontSize(16), marginTop: spacing(2) }]}>
            Full Name
          </Text>
          <Text style={[styles.infoText, { fontSize: normalizeFontSize(14), padding: spacing(1.5) }]}>
            {user?.full_name || 'Not set'}
          </Text>

          {/* Date of Birth */}
          <Text style={[styles.sectionTitle, { fontSize: normalizeFontSize(16), marginTop: spacing(2) }]}>
            Date of Birth
          </Text>
          <TextInput
            style={[styles.input, { padding: spacing(1.5), fontSize: normalizeFontSize(14) }]}
            placeholder="YYYY-MM-DD"
            placeholderTextColor="#999"
          />

          {/* Profile Picture */}
          <Text style={[styles.sectionTitle, { fontSize: normalizeFontSize(16), marginTop: spacing(2) }]}>
            Profile Picture
          </Text>
          <View style={[styles.imageUpload, { padding: spacing(3) }]}>
            <Text style={{ fontSize: normalizeFontSize(14), color: '#666' }}>
              Tap to upload profile picture
            </Text>
          </View>

          {/* Contact Information */}
          <Text style={[styles.sectionTitle, { fontSize: normalizeFontSize(16), marginTop: spacing(3) }]}>
            Contact Information
          </Text>

          <Text style={[styles.label, { fontSize: normalizeFontSize(14), marginTop: spacing(1.5) }]}>
            Email
          </Text>
          <Text style={[styles.infoText, { fontSize: normalizeFontSize(14), padding: spacing(1.5) }]}>
            {user?.email || 'Not set'}
          </Text>

          <Text style={[styles.label, { fontSize: normalizeFontSize(14), marginTop: spacing(1.5) }]}>
            Phone
          </Text>
          <Text style={[styles.infoText, { fontSize: normalizeFontSize(14), padding: spacing(1.5) }]}>
            {user?.phone || 'Not set'}
          </Text>

          {/* Legal Status */}
          <Text style={[styles.sectionTitle, { fontSize: normalizeFontSize(16), marginTop: spacing(3) }]}>
            Legal Status
          </Text>
          <TextInput
            style={[styles.input, { padding: spacing(1.5), fontSize: normalizeFontSize(14), marginTop: spacing(1) }]}
            value={profile.legal_status}
            onChangeText={(text) => setProfile({ ...profile, legal_status: text })}
            placeholder="Auto-entrepreneur, SARL, etc."
            placeholderTextColor="#999"
          />

          {/* SIRET Number */}
          <Text style={[styles.sectionTitle, { fontSize: normalizeFontSize(16), marginTop: spacing(2) }]}>
            SIRET Number
          </Text>
          <TextInput
            style={[styles.input, { padding: spacing(1.5), fontSize: normalizeFontSize(14), marginTop: spacing(1) }]}
            value={profile.siret_number}
            onChangeText={(text) => setProfile({ ...profile, siret_number: text })}
            placeholder="Enter SIRET number"
            placeholderTextColor="#999"
          />

          {/* Business Name */}
          <Text style={[styles.sectionTitle, { fontSize: normalizeFontSize(16), marginTop: spacing(2) }]}>
            Business Name
          </Text>
          <TextInput
            style={[styles.input, { padding: spacing(1.5), fontSize: normalizeFontSize(14), marginTop: spacing(1) }]}
            value={profile.business_name}
            onChangeText={(text) => setProfile({ ...profile, business_name: text })}
            placeholder="Enter business name"
            placeholderTextColor="#999"
          />

          {/* Qualifications Proof */}
          <Text style={[styles.sectionTitle, { fontSize: normalizeFontSize(16), marginTop: spacing(3) }]}>
            Qualifications Proof
          </Text>
          <View style={[styles.uploadSection, { padding: spacing(2), marginTop: spacing(1) }]}>
            <Text style={{ fontSize: normalizeFontSize(13), color: '#666' }}>
              Upload certificates and diplomas
            </Text>
          </View>

          {/* Professional Experience */}
          <Text style={[styles.sectionTitle, { fontSize: normalizeFontSize(16), marginTop: spacing(2) }]}>
            Professional Experience
          </Text>
          <TextInput
            style={[
              styles.input,
              styles.textArea,
              { padding: spacing(1.5), fontSize: normalizeFontSize(14), marginTop: spacing(1) },
            ]}
            value={profile.professional_experience}
            onChangeText={(text) => setProfile({ ...profile, professional_experience: text })}
            placeholder="Describe your experience"
            placeholderTextColor="#999"
            multiline
            numberOfLines={4}
          />
          <Text style={[styles.charCount, { fontSize: normalizeFontSize(12) }]}>
            {profile.professional_experience?.length || 0}/500
          </Text>

          {/* Type of services provided */}
          <Text style={[styles.sectionTitle, { fontSize: normalizeFontSize(16), marginTop: spacing(3) }]}>
            Type of services provided
          </Text>
          {serviceTypes.map((type) => (
            <TouchableOpacity
              key={type.value}
              style={[styles.checkboxRow, { marginTop: spacing(1.5) }]}
              onPress={() => toggleServiceType(type.value)}
            >
              <View style={styles.checkbox}>
                {profile.types_of_services?.includes(type.value) && (
                  <Text style={{ fontSize: normalizeFontSize(14) }}>✓</Text>
                )}
              </View>
              <Text style={[styles.checkboxLabel, { fontSize: normalizeFontSize(14) }]}>
                {type.label}
              </Text>
            </TouchableOpacity>
          ))}

          {/* Service Descriptions */}
          <Text style={[styles.sectionTitle, { fontSize: normalizeFontSize(16), marginTop: spacing(3) }]}>
            Service Descriptions
          </Text>
          <TextInput
            style={[
              styles.input,
              styles.textArea,
              { padding: spacing(1.5), fontSize: normalizeFontSize(14), marginTop: spacing(1) },
            ]}
            placeholder="Describe the services you provide..."
            placeholderTextColor="#999"
            multiline
            numberOfLines={4}
          />

          {/* Trusted zones */}
          <Text style={[styles.sectionTitle, { fontSize: normalizeFontSize(16), marginTop: spacing(3) }]}>
            Trusted zones
          </Text>
          <Text style={[styles.sectionDescription, { fontSize: normalizeFontSize(13), marginTop: spacing(0.5) }]}>
            Set your service area
          </Text>
          <View style={[styles.mapPlaceholder, { height: spacing(25), marginTop: spacing(1) }]}>
            <Text style={{ fontSize: normalizeFontSize(14), color: '#666' }}>
              Map view (Coming soon)
            </Text>
          </View>

          {/* Identification Card */}
          <Text style={[styles.sectionTitle, { fontSize: normalizeFontSize(16), marginTop: spacing(3) }]}>
            Identification Card
          </Text>
          <View style={[styles.uploadSection, { padding: spacing(2), marginTop: spacing(1) }]}>
            <Text style={{ fontSize: normalizeFontSize(13), color: '#666' }}>
              Upload ID card
            </Text>
          </View>

          {/* Professional Liability Insurance */}
          <Text style={[styles.sectionTitle, { fontSize: normalizeFontSize(16), marginTop: spacing(2) }]}>
            Professional Liability Insurance
          </Text>
          <View style={[styles.uploadSection, { padding: spacing(2), marginTop: spacing(1) }]}>
            <Text style={{ fontSize: normalizeFontSize(13), color: '#666' }}>
              Upload insurance document
            </Text>
          </View>

          {/* Training certificates */}
          <Text style={[styles.sectionTitle, { fontSize: normalizeFontSize(16), marginTop: spacing(2) }]}>
            Training certificates
          </Text>
          <View style={[styles.uploadSection, { padding: spacing(2), marginTop: spacing(1) }]}>
            <Text style={{ fontSize: normalizeFontSize(13), color: '#666' }}>
              Upload training certificates
            </Text>
          </View>

          {/* Portfolio */}
          <Text style={[styles.sectionTitle, { fontSize: normalizeFontSize(16), marginTop: spacing(3) }]}>
            Portfolio
          </Text>
          <Text style={[styles.sectionDescription, { fontSize: normalizeFontSize(13), marginTop: spacing(0.5) }]}>
            Add your previous works
          </Text>
          <View style={[styles.portfolioGrid, { marginTop: spacing(1) }]}>
            {[1, 2, 3, 4].map((i) => (
              <View
                key={i}
                style={[styles.portfolioItem, { width: spacing(12), height: spacing(12) }]}
              >
                <Text style={{ fontSize: normalizeFontSize(24) }}>+</Text>
              </View>
            ))}
          </View>

          {/* Confidentiality Agreement */}
          <View style={[styles.agreementSection, { padding: spacing(2), marginTop: spacing(3) }]}>
            <Text style={[styles.agreementTitle, { fontSize: normalizeFontSize(14) }]}>
              Confidentiality Agreement
            </Text>
            <Text style={[styles.agreementText, { fontSize: normalizeFontSize(12), marginTop: spacing(1) }]}>
              I agree to maintain confidentiality regarding client information and services provided.
            </Text>
            <TouchableOpacity
              style={[styles.checkboxRow, { marginTop: spacing(1.5) }]}
              onPress={() =>
                setProfile({ ...profile, confidentiality_accepted: !profile.confidentiality_accepted })
              }
            >
              <View style={styles.checkbox}>
                {profile.confidentiality_accepted && <Text style={{ fontSize: normalizeFontSize(14) }}>✓</Text>}
              </View>
              <Text style={[styles.checkboxLabel, { fontSize: normalizeFontSize(13) }]}>
                I agree to the terms and conditions
              </Text>
            </TouchableOpacity>
          </View>

          {/* Acceptance of Terms and Conditions */}
          <View style={[styles.agreementSection, { padding: spacing(2), marginTop: spacing(2) }]}>
            <Text style={[styles.agreementTitle, { fontSize: normalizeFontSize(14) }]}>
              Acceptance of Terms and Conditions
            </Text>
            <Text style={[styles.agreementText, { fontSize: normalizeFontSize(12), marginTop: spacing(1) }]}>
              I accept the terms and conditions of use
            </Text>
            <TouchableOpacity
              style={[styles.checkboxRow, { marginTop: spacing(1.5) }]}
              onPress={() => setProfile({ ...profile, terms_accepted: !profile.terms_accepted })}
            >
              <View style={styles.checkbox}>
                {profile.terms_accepted && <Text style={{ fontSize: normalizeFontSize(14) }}>✓</Text>}
              </View>
              <Text style={[styles.checkboxLabel, { fontSize: normalizeFontSize(13) }]}>
                I accept the terms
              </Text>
            </TouchableOpacity>
          </View>

          {/* Language System */}
          <Text style={[styles.sectionTitle, { fontSize: normalizeFontSize(16), marginTop: spacing(3) }]}>
            Language System
          </Text>
          {languages.map((lang) => (
            <TouchableOpacity
              key={lang.value}
              style={[styles.checkboxRow, { marginTop: spacing(1.5) }]}
              onPress={() => toggleLanguage(lang.value)}
            >
              <View style={[styles.radio, profile.languages_spoken?.includes(lang.value) && styles.radioSelected]}>
                {profile.languages_spoken?.includes(lang.value) && (
                  <View style={styles.radioDot} />
                )}
              </View>
              <Text style={[styles.checkboxLabel, { fontSize: normalizeFontSize(14) }]}>
                {lang.label}
              </Text>
            </TouchableOpacity>
          ))}

          {/* Available Transportation */}
          <Text style={[styles.sectionTitle, { fontSize: normalizeFontSize(16), marginTop: spacing(3) }]}>
            Available Transportation
          </Text>
          {transportOptions.map((transport) => (
            <TouchableOpacity
              key={transport.value}
              style={[styles.checkboxRow, { marginTop: spacing(1.5) }]}
              onPress={() => toggleTransportation(transport.value)}
            >
              <View style={[styles.radio, profile.available_transportation?.includes(transport.value) && styles.radioSelected]}>
                {profile.available_transportation?.includes(transport.value) && (
                  <View style={styles.radioDot} />
                )}
              </View>
              <Text style={[styles.checkboxLabel, { fontSize: normalizeFontSize(14) }]}>
                {transport.label}
              </Text>
            </TouchableOpacity>
          ))}

          {/* Save Button */}
          <TouchableOpacity
            style={[styles.saveButton, { padding: spacing(2), marginTop: spacing(4), marginBottom: spacing(10) }]}
            onPress={saveProfile}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={[styles.saveButtonText, { fontSize: normalizeFontSize(16) }]}>
                {language === 'fr' ? 'Enregistrer' : 'Save Profile'}
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
  },
  title: {
    fontWeight: 'bold',
  },
  scrollView: {
    flex: 1,
  },
  sectionTitle: {
    fontWeight: 'bold',
    color: '#2D2D2D',
  },
  sectionDescription: {
    color: '#666',
  },
  label: {
    fontWeight: '600',
    color: '#666',
  },
  infoText: {
    backgroundColor: '#F0F0F0',
    borderRadius: 8,
    color: '#666',
  },
  input: {
    backgroundColor: '#FFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  charCount: {
    color: '#999',
    textAlign: 'right',
    marginTop: 5,
  },
  imageUpload: {
    backgroundColor: '#F0F0F0',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  uploadSection: {
    backgroundColor: '#F0F0F0',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: '#2D2D2D',
    borderRadius: 4,
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxLabel: {
    flex: 1,
    color: '#2D2D2D',
  },
  radio: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderRadius: 10,
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioSelected: {
    borderColor: '#2D2D2D',
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#2D2D2D',
  },
  mapPlaceholder: {
    backgroundColor: '#F0F0F0',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  portfolioGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  portfolioItem: {
    backgroundColor: '#F0F0F0',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  agreementSection: {
    backgroundColor: '#FFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  agreementTitle: {
    fontWeight: '600',
    color: '#2D2D2D',
  },
  agreementText: {
    color: '#666',
    lineHeight: 18,
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
