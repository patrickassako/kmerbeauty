import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native';
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

  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<Partial<ContractorProfile>>({
    user_id: user?.id,
    business_name: '',
    siret_number: '',
    professional_experience: '',
    types_of_services: [],
  });

  const saveProfile = async () => {
    try {
      setLoading(true);
      await contractorApi.updateProfile(user?.id || '', profile);
      navigation.goBack();
    } catch (error) {
      console.error('Error saving profile:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={[styles.header, { padding: spacing(2.5), paddingTop: spacing(6) }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={{ fontSize: normalizeFontSize(24) }}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { fontSize: normalizeFontSize(18) }]}>Edit Profile</Text>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={{ fontSize: normalizeFontSize(18) }}>✕</Text>
        </TouchableOpacity>
      </View>

      <View style={{ padding: spacing(2.5) }}>
        <Text style={[styles.label, { fontSize: normalizeFontSize(14) }]}>Business Name</Text>
        <TextInput
          style={[styles.input, { padding: spacing(1.5), fontSize: normalizeFontSize(14) }]}
          value={profile.business_name}
          onChangeText={(text) => setProfile({ ...profile, business_name: text })}
          placeholder="Enter business name"
        />

        <Text style={[styles.label, { fontSize: normalizeFontSize(14), marginTop: spacing(2) }]}>
          SIRET Number
        </Text>
        <TextInput
          style={[styles.input, { padding: spacing(1.5), fontSize: normalizeFontSize(14) }]}
          value={profile.siret_number}
          onChangeText={(text) => setProfile({ ...profile, siret_number: text })}
          placeholder="Enter SIRET number"
        />

        <Text style={[styles.label, { fontSize: normalizeFontSize(14), marginTop: spacing(2) }]}>
          Professional Experience
        </Text>
        <TextInput
          style={[styles.input, styles.textArea, { padding: spacing(1.5), fontSize: normalizeFontSize(14) }]}
          value={profile.professional_experience}
          onChangeText={(text) => setProfile({ ...profile, professional_experience: text })}
          placeholder="Describe your experience"
          multiline
          numberOfLines={4}
        />

        <TouchableOpacity
          style={[styles.saveButton, { padding: spacing(2), marginTop: spacing(3) }]}
          onPress={saveProfile}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={[styles.saveButtonText, { fontSize: normalizeFontSize(16) }]}>
              {language === 'fr' ? 'Enregistrer' : 'Save'}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9F9F9',
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
  label: {
    fontWeight: '600',
    marginBottom: 8,
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
