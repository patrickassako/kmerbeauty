import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useResponsive } from '../../hooks/useResponsive';
import { useAuth } from '../../contexts/AuthContext';
import { contractorApi } from '../../services/api';
import { getFullName, getUserInitials } from '../../utils/userHelpers';

interface Earning {
  id: string;
  contractor_id: string;
  booking_id: string;
  amount: number;
  commission: number;
  net_amount: number;
  payment_status: string;
  payment_method?: string;
  created_at: string;
  booking?: {
    id: string;
    client?: {
      first_name?: string;
      last_name?: string;
      email?: string;
    };
    service?: {
      name: string;
    };
    total_price: number;
  };
}

export const ContractorEarningsScreen = () => {
  const { normalizeFontSize, spacing } = useResponsive();
  const { user } = useAuth();
  const navigation = useNavigation<any>();

  const [earnings, setEarnings] = useState<Earning[]>([]);
  const [loading, setLoading] = useState(true);
  const [contractorId, setContractorId] = useState<string | null>(null);

  useEffect(() => {
    loadContractorProfile();
  }, []);

  useEffect(() => {
    if (contractorId) {
      loadEarnings();
    }
  }, [contractorId]);

  const loadContractorProfile = async () => {
    try {
      if (!user?.id) return;
      const profile = await contractorApi.getProfileByUserId(user.id);
      setContractorId(profile.id);
    } catch (error: any) {
      console.error('Error loading contractor profile:', error);
      Alert.alert('Error', error.message || 'Failed to load profile');
    }
  };

  const loadEarnings = async () => {
    try {
      if (!contractorId) return;
      setLoading(true);
      const data = await contractorApi.getEarnings(contractorId);
      setEarnings(data);
    } catch (error: any) {
      console.error('Error loading earnings:', error);
      Alert.alert('Error', error.message || 'Failed to load earnings');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (datetime: string) => {
    const date = new Date(datetime);
    return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const formatTime = (datetime: string) => {
    const date = new Date(datetime);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  const getCommissionPercentage = (earning: Earning) => {
    if (earning.amount === 0) return 0;
    return Math.round((earning.commission / earning.amount) * 100);
  };

  const getPaymentMethodIcon = (method?: string) => {
    switch (method?.toLowerCase()) {
      case 'apple_pay':
        return '🍎';
      case 'google_pay':
        return '💳';
      case 'card':
        return '💳';
      case 'cash':
        return '💵';
      default:
        return '💳';
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { padding: spacing(2.5), paddingTop: spacing(6) }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={{ fontSize: normalizeFontSize(24) }}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.locationText, { fontSize: normalizeFontSize(12) }]}>
            📍 Notre-Dame - 754 Paris, France
          </Text>
        </View>
        <View
          style={[
            styles.avatarSmall,
            { width: spacing(4), height: spacing(4), borderRadius: spacing(2) },
          ]}
        >
          <Text style={{ fontSize: normalizeFontSize(16), color: '#FFF' }}>
            {getUserInitials(user)}
          </Text>
        </View>
      </View>

      {/* Title */}
      <View style={{ paddingHorizontal: spacing(2), paddingTop: spacing(2), paddingBottom: spacing(1) }}>
        <Text style={[styles.title, { fontSize: normalizeFontSize(24) }]}>Transaction</Text>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: spacing(10) }}>
        {loading ? (
          <View style={{ padding: spacing(4), alignItems: 'center' }}>
            <ActivityIndicator size="large" color="#2D2D2D" />
          </View>
        ) : earnings.length === 0 ? (
          <View style={{ padding: spacing(4), alignItems: 'center' }}>
            <Text style={{ fontSize: normalizeFontSize(16), color: '#999' }}>No transactions found</Text>
          </View>
        ) : (
          <View style={{ paddingHorizontal: spacing(2), gap: spacing(2) }}>
            {earnings.map((earning) => (
              <View
                key={earning.id}
                style={[
                  styles.transactionCard,
                  {
                    padding: spacing(2),
                    borderRadius: spacing(1.5),
                    gap: spacing(1.5),
                  },
                ]}
              >
                {/* Header Row */}
                <View style={styles.transactionHeader}>
                  <View style={styles.paymentMethodSection}>
                    <View
                      style={[
                        styles.paymentIcon,
                        {
                          width: spacing(5),
                          height: spacing(5),
                          borderRadius: spacing(1),
                        },
                      ]}
                    >
                      <Text style={{ fontSize: normalizeFontSize(20) }}>
                        {getPaymentMethodIcon(earning.payment_method)}
                      </Text>
                    </View>
                    <View>
                      <Text style={[styles.paymentType, { fontSize: normalizeFontSize(16) }]}>
                        Cash-in
                      </Text>
                      <Text style={[styles.transactionId, { fontSize: normalizeFontSize(11) }]}>
                        Transaction ID
                      </Text>
                      <Text style={[styles.transactionId, { fontSize: normalizeFontSize(11) }]}>
                        {earning.id.substring(0, 13)}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.amountSection}>
                    <Text style={[styles.amount, { fontSize: normalizeFontSize(24) }]}>
                      ${earning.net_amount}
                    </Text>
                    {earning.commission > 0 && (
                      <Text style={[styles.commission, { fontSize: normalizeFontSize(11) }]}>
                        {getCommissionPercentage(earning)}% Commission
                      </Text>
                    )}
                    <Text style={[styles.dateTime, { fontSize: normalizeFontSize(11) }]}>
                      {formatDate(earning.created_at)}
                    </Text>
                    <Text style={[styles.dateTime, { fontSize: normalizeFontSize(11) }]}>
                      {formatTime(earning.created_at)}
                    </Text>
                  </View>
                </View>

                {/* Details Row */}
                <View style={styles.transactionDetails}>
                  <View style={styles.detailItem}>
                    <Text style={[styles.detailLabel, { fontSize: normalizeFontSize(12) }]}>Client</Text>
                    <Text style={[styles.detailValue, { fontSize: normalizeFontSize(13) }]}>
                      {getFullName(earning.booking?.client)}
                    </Text>
                  </View>
                  <View style={[styles.detailItem, { alignItems: 'flex-end' }]}>
                    <Text style={[styles.detailLabel, { fontSize: normalizeFontSize(12) }]}>Service</Text>
                    <Text style={[styles.detailValue, { fontSize: normalizeFontSize(13) }]}>
                      {earning.booking?.service?.name || 'Service'}
                    </Text>
                  </View>
                </View>

                {/* Tip Badge (if applicable) */}
                {earning.amount > (earning.booking?.total_price || 0) && (
                  <View style={styles.tipBadge}>
                    <Text style={[styles.tipText, { fontSize: normalizeFontSize(11) }]}>
                      ${(earning.amount - (earning.booking?.total_price || 0)).toFixed(0)} Tipped
                    </Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
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
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  locationText: {
    color: '#666',
  },
  avatarSmall: {
    backgroundColor: '#999',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontWeight: 'bold',
    color: '#2D2D2D',
  },
  transactionCard: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  transactionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  paymentMethodSection: {
    flexDirection: 'row',
    gap: 12,
    flex: 1,
  },
  paymentIcon: {
    backgroundColor: '#2D2D2D',
    justifyContent: 'center',
    alignItems: 'center',
  },
  paymentType: {
    fontWeight: '600',
    color: '#2D2D2D',
  },
  transactionId: {
    color: '#999',
  },
  amountSection: {
    alignItems: 'flex-end',
  },
  amount: {
    fontWeight: 'bold',
    color: '#FF4444',
  },
  commission: {
    color: '#999',
  },
  dateTime: {
    color: '#999',
  },
  transactionDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  detailItem: {
    flex: 1,
  },
  detailLabel: {
    color: '#999',
    marginBottom: 4,
  },
  detailValue: {
    color: '#2D2D2D',
    fontWeight: '500',
  },
  tipBadge: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  tipText: {
    color: '#4CAF50',
    fontWeight: '600',
  },
});
