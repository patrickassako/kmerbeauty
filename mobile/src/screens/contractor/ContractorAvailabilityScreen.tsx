import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useResponsive } from '../../hooks/useResponsive';
import { useI18n } from '../../i18n/I18nContext';
import { useAuth } from '../../contexts/AuthContext';
import { contractorApi } from '../../services/api';

export const ContractorAvailabilityScreen = () => {
  const { normalizeFontSize, spacing } = useResponsive();
  const { t } = useI18n();
  const { user } = useAuth();
  const navigation = useNavigation<any>();

  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(false);
  const [profileId, setProfileId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const profile = await contractorApi.getProfileByUserId(user?.id || '');
      if (profile) {
        setProfileId(profile.id);
        setIsOnline(profile.is_online || false);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      Alert.alert('Error', 'Failed to load profile settings');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleOnline = async (value: boolean) => {
    if (!user?.id) return;

    // Optimistic update
    setIsOnline(value);

    try {
      await contractorApi.updateProfile(user.id, {
        is_online: value,
      });
    } catch (error) {
      console.error('Error updating availability:', error);
      // Revert on error
      setIsOnline(!value);
      Alert.alert('Error', 'Failed to update availability status');
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#2D2D2D" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { padding: spacing(2.5), paddingTop: spacing(6) }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={{ fontSize: normalizeFontSize(24) }}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { fontSize: normalizeFontSize(18) }]}>{t.availability.mySchedule}</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={[styles.content, { padding: spacing(3) }]}>
        <View style={[styles.card, { padding: spacing(3) }]}>
          <View style={styles.row}>
            <View style={styles.textContainer}>
              <Text style={[styles.statusTitle, { fontSize: normalizeFontSize(18) }]}>
                {isOnline ? t.availability.online : t.availability.offline}
              </Text>
              <Text style={[styles.statusDescription, { fontSize: normalizeFontSize(14), marginTop: spacing(1) }]}>
                {isOnline
                  ? t.availability.onlineDescription
                  : t.availability.offlineDescription}
              </Text>
            </View>
            <Switch
              value={isOnline}
              onValueChange={handleToggleOnline}
              trackColor={{ false: '#E0E0E0', true: '#4CAF50' }}
              thumbColor={'#FFFFFF'}
              ios_backgroundColor="#E0E0E0"
              style={{ transform: [{ scaleX: 1.2 }, { scaleY: 1.2 }] }}
            />
          </View>
        </View>

        <View style={[styles.infoCard, { padding: spacing(2.5), marginTop: spacing(3) }]}>
          <Text style={[styles.infoTitle, { fontSize: normalizeFontSize(16) }]}>ℹ️ {t.common.note}</Text>
          <Text style={[styles.infoText, { fontSize: normalizeFontSize(14), marginTop: spacing(1) }]}>
            {t.availability.toggleNote}
          </Text>
        </View>
      </View>
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
    borderBottomColor: '#F0F0F0',
  },
  title: {
    fontWeight: 'bold',
    color: '#2D2D2D',
  },
  content: {
    flex: 1,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  textContainer: {
    flex: 1,
    paddingRight: 20,
  },
  statusTitle: {
    fontWeight: 'bold',
    color: '#2D2D2D',
    marginBottom: 4,
  },
  statusDescription: {
    color: '#666',
    lineHeight: 20,
  },
  infoCard: {
    backgroundColor: 'rgba(45, 45, 45, 0.05)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(45, 45, 45, 0.1)',
  },
  infoTitle: {
    fontWeight: '600',
    color: '#2D2D2D',
  },
  infoText: {
    color: '#555',
    lineHeight: 20,
  },
});
