import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useResponsive } from '../../hooks/useResponsive';
import { useI18n } from '../../i18n/I18nContext';
import { useAuth } from '../../contexts/AuthContext';
import { proposalApi, contractorApi, type Proposal } from '../../services/api';
import { getFullName } from '../../utils/userHelpers';

export const ContractorProposalsScreen = () => {
  const { normalizeFontSize, spacing } = useResponsive();
  const { t, language } = useI18n();
  const { user } = useAuth();
  const navigation = useNavigation<any>();

  const [loading, setLoading] = useState(true);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [contractorId, setContractorId] = useState<string | null>(null);

  useEffect(() => {
    loadProposals();
  }, []);

  const loadProposals = async () => {
    try {
      setLoading(true);
      const profile = await contractorApi.getProfileByUserId(user?.id || '');
      if (!profile) return;

      setContractorId(profile.id);
      const data = await proposalApi.getForContractor(profile.id);
      setProposals(data);
    } catch (error) {
      console.error('Error loading proposals:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (proposalId: string) => {
    try {
      await proposalApi.respond(proposalId, 'ACCEPTED');
      Alert.alert(
        language === 'fr' ? 'Accepté' : 'Accepted',
        language === 'fr' ? 'Proposition acceptée avec succès' : 'Proposal accepted successfully'
      );
      loadProposals();
    } catch (error) {
      console.error('Error accepting proposal:', error);
      Alert.alert('Error', 'Failed to accept proposal');
    }
  };

  const handleDecline = async (proposalId: string) => {
    try {
      await proposalApi.respond(proposalId, 'DECLINED');
      Alert.alert(
        language === 'fr' ? 'Refusé' : 'Declined',
        language === 'fr' ? 'Proposition refusée' : 'Proposal declined'
      );
      loadProposals();
    } catch (error) {
      console.error('Error declining proposal:', error);
      Alert.alert('Error', 'Failed to decline proposal');
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString(language === 'fr' ? 'fr-FR' : 'en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACCEPTED':
        return '#4CAF50';
      case 'DECLINED':
        return '#F44336';
      case 'EXPIRED':
        return '#999';
      default:
        return '#FF9800';
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
        <Text style={[styles.logo, { fontSize: normalizeFontSize(24) }]}>S</Text>
        <View style={styles.headerCenter}>
          <Text style={[styles.location, { fontSize: normalizeFontSize(14) }]}>
            📍 Notre-Dame - 754 Paris, France
          </Text>
        </View>
        <TouchableOpacity>
          <View style={[styles.avatar, { width: spacing(6), height: spacing(6) }]}>
            <Text style={{ fontSize: normalizeFontSize(20) }}>👤</Text>
          </View>
        </TouchableOpacity>
      </View>

      <Text style={[styles.title, { fontSize: normalizeFontSize(24), padding: spacing(2.5) }]}>
        Proposals
      </Text>

      <ScrollView style={styles.scrollView}>
        {proposals.length === 0 ? (
          <Text style={[styles.emptyText, { fontSize: normalizeFontSize(14) }]}>
            {language === 'fr' ? 'Aucune proposition' : 'No proposals'}
          </Text>
        ) : (
          proposals.map((proposal) => (
            <View
              key={proposal.id}
              style={[styles.proposalCard, { padding: spacing(2.5), margin: spacing(2.5) }]}
            >
              <View style={styles.proposalHeader}>
                <Text style={[styles.serviceName, { fontSize: normalizeFontSize(16) }]}>
                  {proposal.service_name}
                </Text>
                <Text style={[styles.time, { fontSize: normalizeFontSize(12) }]}>
                  {formatTime(proposal.created_at || '')}
                </Text>
              </View>

              <Text
                style={[styles.description, { fontSize: normalizeFontSize(13), marginTop: spacing(1) }]}
                numberOfLines={3}
              >
                {proposal.description}
              </Text>

              {/* Client info */}
              <View style={[styles.clientInfo, { marginTop: spacing(2) }]}>
                <View style={[styles.clientAvatar, { width: spacing(6), height: spacing(6) }]}>
                  <Text style={{ fontSize: normalizeFontSize(20) }}>👤</Text>
                </View>
                <View style={styles.clientDetails}>
                  <Text style={[styles.clientName, { fontSize: normalizeFontSize(14) }]}>
                    {getFullName(proposal.client)}
                  </Text>
                  <View style={styles.rating}>
                    <Text style={[styles.ratingStars, { fontSize: normalizeFontSize(12) }]}>
                      ⭐ (360+)
                    </Text>
                  </View>
                </View>
              </View>

              {/* Action buttons */}
              {proposal.status === 'PENDING' ? (
                <View style={[styles.actions, { marginTop: spacing(2) }]}>
                  <TouchableOpacity
                    style={[
                      styles.actionButton,
                      styles.acceptButton,
                      { padding: spacing(1.5), flex: 1, marginRight: spacing(1) },
                    ]}
                    onPress={() => handleAccept(proposal.id)}
                  >
                    <Text style={[styles.actionButtonText, { fontSize: normalizeFontSize(14) }]}>
                      {language === 'fr' ? 'Accepter' : 'Accept'}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.actionButton,
                      styles.viewButton,
                      { padding: spacing(1.5), flex: 1, marginLeft: spacing(1) },
                    ]}
                    onPress={() =>
                      navigation.navigate('ProposalDetails', { proposalId: proposal.id })
                    }
                  >
                    <Text
                      style={[
                        styles.actionButtonText,
                        styles.viewButtonText,
                        { fontSize: normalizeFontSize(14) },
                      ]}
                    >
                      {language === 'fr' ? 'Voir' : 'View'}
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={[styles.statusBadge, { marginTop: spacing(2) }]}>
                  <Text
                    style={[
                      styles.statusText,
                      { fontSize: normalizeFontSize(14), color: getStatusColor(proposal.status) },
                    ]}
                  >
                    {proposal.status}
                  </Text>
                </View>
              )}
            </View>
          ))
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
  logo: {
    fontWeight: 'bold',
  },
  headerCenter: {
    flex: 1,
    marginLeft: 20,
  },
  location: {},
  avatar: {
    borderRadius: 100,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontWeight: 'bold',
    backgroundColor: '#FFF',
  },
  scrollView: {
    flex: 1,
  },
  emptyText: {
    textAlign: 'center',
    color: '#999',
    padding: 20,
  },
  proposalCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
  },
  proposalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  serviceName: {
    fontWeight: 'bold',
    flex: 1,
  },
  time: {
    color: '#999',
  },
  description: {
    color: '#666',
    lineHeight: 20,
  },
  clientInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  clientAvatar: {
    borderRadius: 100,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  clientDetails: {
    marginLeft: 10,
    flex: 1,
  },
  clientName: {
    fontWeight: '600',
  },
  rating: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
  },
  ratingStars: {
    color: '#FF9800',
  },
  actions: {
    flexDirection: 'row',
  },
  actionButton: {
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  acceptButton: {
    backgroundColor: '#2D2D2D',
  },
  viewButton: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  actionButtonText: {
    color: '#FFF',
    fontWeight: '600',
  },
  viewButtonText: {
    color: '#2D2D2D',
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#F0F0F0',
  },
  statusText: {
    fontWeight: '600',
  },
});
