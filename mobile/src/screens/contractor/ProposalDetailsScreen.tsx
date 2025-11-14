import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useResponsive } from '../../hooks/useResponsive';
import { proposalApi, Proposal } from '../../services/api';

export const ProposalDetailsScreen = () => {
  const { normalizeFontSize, spacing } = useResponsive();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();

  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [loading, setLoading] = useState(true);

  const proposalId = route.params?.proposalId;

  useEffect(() => {
    loadProposal();
  }, [proposalId]);

  const loadProposal = async () => {
    try {
      if (!proposalId) return;
      setLoading(true);
      const data = await proposalApi.getById(proposalId);
      setProposal(data);
    } catch (error: any) {
      console.error('Error loading proposal:', error);
      Alert.alert('Error', error.message || 'Failed to load proposal');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (datetime?: string) => {
    if (!datetime) return 'TBD';
    const date = new Date(datetime);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  const formatDate = (datetime?: string) => {
    if (!datetime) return 'TBD';
    const date = new Date(datetime);
    return date.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  const handleAcceptProposal = () => {
    Alert.alert(
      'Accept Proposal',
      'Do you want to accept this proposal?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Accept',
          onPress: async () => {
            try {
              await proposalApi.respond(proposalId, 'ACCEPTED');
              Alert.alert('Success', 'Proposal accepted successfully');
              navigation.goBack();
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to accept proposal');
            }
          },
        },
      ]
    );
  };

  const handleDeclineProposal = () => {
    Alert.alert(
      'Decline Proposal',
      'Do you want to decline this proposal?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Decline',
          style: 'destructive',
          onPress: async () => {
            try {
              await proposalApi.respond(proposalId, 'DECLINED', 'Not available at this time');
              Alert.alert('Success', 'Proposal declined');
              navigation.goBack();
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to decline proposal');
            }
          },
        },
      ]
    );
  };

  const handleChatWithClient = () => {
    if (proposal?.client) {
      navigation.navigate('Chat', { userId: proposal.client.id });
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#2D2D2D" />
      </View>
    );
  }

  if (!proposal) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ fontSize: normalizeFontSize(16) }}>Proposal not found</Text>
      </View>
    );
  }

  const isActionable = proposal.status === 'PENDING';

  return (
    <View style={styles.container}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: spacing(10) }}>
        {/* Header Image Gallery */}
        <View style={[styles.imageGallery, { height: spacing(30) }]}>
          {/* Main Image - Using a placeholder for now */}
          <View style={[styles.mainImage, styles.placeholderImage]}>
            <Text style={{ fontSize: normalizeFontSize(40), color: '#999' }}>📷</Text>
          </View>

          {/* Close Button */}
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={[
              styles.closeButton,
              { top: spacing(5), right: spacing(2), width: spacing(4), height: spacing(4) },
            ]}
          >
            <Text style={{ fontSize: normalizeFontSize(20), color: '#2D2D2D' }}>✕</Text>
          </TouchableOpacity>

          {/* Thumbnail Strip */}
          <View style={[styles.thumbnailStrip, { bottom: spacing(2), left: spacing(2), gap: spacing(1) }]}>
            <View style={[styles.thumbnail, { width: spacing(8), height: spacing(8) }]}>
              <View style={[styles.placeholderImage, { width: '100%', height: '100%', borderRadius: spacing(1) }]}>
                <Text style={{ fontSize: normalizeFontSize(20), color: '#999' }}>📷</Text>
              </View>
            </View>
            <View style={[styles.thumbnail, { width: spacing(8), height: spacing(8) }]}>
              <View style={styles.moreThumbnail}>
                <Text style={{ fontSize: normalizeFontSize(14), color: '#FFF', fontWeight: '600' }}>
                  +12
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Info Banner */}
        <View
          style={[
            styles.infoBanner,
            { padding: spacing(2), gap: spacing(1.5), marginTop: -spacing(3), marginHorizontal: spacing(2) },
          ]}
        >
          <View style={styles.infoBannerRow}>
            <Text style={[styles.infoBannerText, { fontSize: normalizeFontSize(14) }]}>
              🏠 {proposal.location?.type || 'Home'}
            </Text>
            <Text style={[styles.infoBannerText, { fontSize: normalizeFontSize(14) }]}>
              🕐 {formatTime(proposal.requested_date)}
            </Text>
            <Text style={[styles.infoBannerText, { fontSize: normalizeFontSize(14) }]}>
              📅 {formatDate(proposal.requested_date)}
            </Text>
          </View>
        </View>

        {/* Price and Client Info */}
        <View style={[styles.section, { padding: spacing(2), gap: spacing(1) }]}>
          <View style={styles.priceRow}>
            <Text style={[styles.price, { fontSize: normalizeFontSize(24) }]}>
              ${proposal.proposed_price || 'TBD'}
            </Text>
            <Text style={[styles.duration, { fontSize: normalizeFontSize(14) }]}>
              🕐 {proposal.estimated_duration || 60} min
            </Text>
            <View style={styles.clientBadge}>
              <Text style={[styles.clientName, { fontSize: normalizeFontSize(14) }]}>
                👤 {proposal.client?.full_name || 'Client'}
              </Text>
              <Text style={{ fontSize: normalizeFontSize(14) }}>⭐ (3.9k+)</Text>
            </View>
          </View>
        </View>

        {/* Service Title */}
        <View style={[styles.section, { paddingHorizontal: spacing(2), paddingBottom: spacing(1) }]}>
          <Text style={[styles.serviceTitle, { fontSize: normalizeFontSize(22) }]}>
            {proposal.service_name}
          </Text>
        </View>

        {/* Location */}
        <View style={[styles.section, { paddingHorizontal: spacing(2), paddingBottom: spacing(2) }]}>
          <View style={styles.locationRow}>
            <Text style={{ fontSize: normalizeFontSize(18) }}>📍</Text>
            <Text style={[styles.locationText, { fontSize: normalizeFontSize(14) }]}>
              {proposal.location?.address || '6 Parvis Notre-Dame - 754 Paris, France (1km away)'}
            </Text>
          </View>
        </View>

        {/* Description */}
        <View style={[styles.section, { paddingHorizontal: spacing(2), paddingBottom: spacing(2) }]}>
          <Text style={[styles.description, { fontSize: normalizeFontSize(14), lineHeight: 22 }]}>
            {proposal.description ||
              'Facial is specifically designed to address and manage acne-prone skin, reducing breakouts, and improving overall skin health'}
          </Text>
        </View>

        {/* Client Details Card */}
        <View
          style={[
            styles.clientCard,
            {
              marginHorizontal: spacing(2),
              padding: spacing(2),
              borderRadius: spacing(1.5),
              marginBottom: spacing(2),
            },
          ]}
        >
          <View style={styles.clientCardHeader}>
            <View style={styles.clientInfo}>
              <View
                style={[
                  styles.clientAvatar,
                  { width: spacing(6), height: spacing(6), borderRadius: spacing(3) },
                ]}
              >
                {proposal.client?.profile_picture ? (
                  <Image
                    source={{ uri: proposal.client.profile_picture }}
                    style={{ width: '100%', height: '100%', borderRadius: spacing(3) }}
                  />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <Text style={{ fontSize: normalizeFontSize(20), color: '#FFF' }}>
                      {proposal.client?.full_name?.charAt(0) || '?'}
                    </Text>
                  </View>
                )}
              </View>
              <View>
                <Text style={[styles.clientCardName, { fontSize: normalizeFontSize(16) }]}>
                  {proposal.client?.full_name || 'Client'} {proposal.client?.is_verified && '✓'}
                </Text>
                <Text style={[styles.userBadge, { fontSize: normalizeFontSize(12) }]}>Diamond User</Text>
              </View>
            </View>
            <TouchableOpacity onPress={handleChatWithClient} style={styles.chatButton}>
              <Text style={{ fontSize: normalizeFontSize(24) }}>💬</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Details Section */}
        <View style={[styles.detailsSection, { paddingHorizontal: spacing(2), gap: spacing(1.5) }]}>
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { fontSize: normalizeFontSize(14) }]}>Skin Type</Text>
            <Text style={[styles.detailValue, { fontSize: normalizeFontSize(14) }]}>
              Dry Skin
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { fontSize: normalizeFontSize(14) }]}>Notes</Text>
            <Text style={[styles.detailValue, { fontSize: normalizeFontSize(14) }]}>
              {proposal.description || 'No medical conditions'}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { fontSize: normalizeFontSize(14) }]}>Service Type</Text>
            <Text style={[styles.detailValue, { fontSize: normalizeFontSize(14) }]}>
              Hairdressing
            </Text>
          </View>
        </View>

        {/* Action Buttons */}
        {isActionable && (
          <View style={{ paddingHorizontal: spacing(2), paddingTop: spacing(3), gap: spacing(1.5) }}>
            <TouchableOpacity
              onPress={handleDeclineProposal}
              style={[
                styles.declineButton,
                {
                  padding: spacing(2),
                  borderRadius: spacing(1.5),
                },
              ]}
            >
              <Text style={{ fontSize: normalizeFontSize(18) }}>✕</Text>
              <Text style={[styles.declineButtonText, { fontSize: normalizeFontSize(16) }]}>
                Decline Proposal
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleAcceptProposal}
              style={[
                styles.acceptButton,
                {
                  padding: spacing(2),
                  borderRadius: spacing(1.5),
                },
              ]}
            >
              <Text style={{ fontSize: normalizeFontSize(20) }}>📅</Text>
              <Text style={[styles.acceptButtonText, { fontSize: normalizeFontSize(16) }]}>
                Accept Proposal
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Status Badge for non-pending proposals */}
        {!isActionable && (
          <View style={{ paddingHorizontal: spacing(2), paddingTop: spacing(3) }}>
            <View style={[styles.statusBadge, { padding: spacing(2), borderRadius: spacing(1.5) }]}>
              <Text style={[styles.statusText, { fontSize: normalizeFontSize(16) }]}>
                Status: {proposal.status}
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Go to Homepage Button */}
      <View style={[styles.footer, { padding: spacing(2) }]}>
        <TouchableOpacity
          onPress={() => navigation.navigate('ContractorDashboard')}
          style={[
            styles.homepageButton,
            {
              padding: spacing(2),
              borderRadius: spacing(1.5),
              gap: spacing(1),
            },
          ]}
        >
          <Text style={{ fontSize: normalizeFontSize(20) }}>→</Text>
          <Text style={[styles.homepageButtonText, { fontSize: normalizeFontSize(16) }]}>
            Go to Homepage
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9F9F9',
  },
  imageGallery: {
    position: 'relative',
    backgroundColor: '#DDD',
  },
  mainImage: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    backgroundColor: '#DDD',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    backgroundColor: '#FFF',
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  thumbnailStrip: {
    position: 'absolute',
    flexDirection: 'row',
  },
  thumbnail: {
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#999',
  },
  moreThumbnail: {
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoBanner: {
    backgroundColor: '#2D2D2D',
    borderRadius: 12,
    zIndex: 1,
  },
  infoBannerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoBannerText: {
    color: '#FFF',
  },
  section: {
    backgroundColor: '#FFF',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  price: {
    fontWeight: 'bold',
    color: '#2D2D2D',
  },
  duration: {
    color: '#666',
  },
  clientBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    flex: 1,
    justifyContent: 'flex-end',
  },
  clientName: {
    color: '#2D2D2D',
  },
  serviceTitle: {
    fontWeight: 'bold',
    color: '#2D2D2D',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  locationText: {
    color: '#666',
    flex: 1,
  },
  description: {
    color: '#666',
  },
  clientCard: {
    backgroundColor: '#FFF',
  },
  clientCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  clientInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  clientAvatar: {
    backgroundColor: '#DDD',
    overflow: 'hidden',
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#999',
    justifyContent: 'center',
    alignItems: 'center',
  },
  clientCardName: {
    fontWeight: '600',
    color: '#2D2D2D',
  },
  userBadge: {
    color: '#FF6B6B',
  },
  chatButton: {
    padding: 8,
  },
  detailsSection: {
    backgroundColor: '#FFF',
    padding: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  detailLabel: {
    color: '#666',
  },
  detailValue: {
    color: '#2D2D2D',
    fontWeight: '500',
  },
  declineButton: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  declineButtonText: {
    color: '#2D2D2D',
    fontWeight: '600',
  },
  acceptButton: {
    backgroundColor: '#2D2D2D',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  acceptButtonText: {
    color: '#FFF',
    fontWeight: '600',
  },
  statusBadge: {
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
  },
  statusText: {
    color: '#666',
    fontWeight: '600',
  },
  footer: {
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  homepageButton: {
    backgroundColor: '#2D2D2D',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  homepageButtonText: {
    color: '#FFF',
    fontWeight: '600',
  },
});
