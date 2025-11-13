import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useResponsive } from '../../hooks/useResponsive';
import { useI18n } from '../../i18n/I18nContext';
import { formatCurrency } from '../../utils/currency';
import type { ChatMessage, ChatOffer } from '../../services/api';

interface OfferMessageProps {
  message: ChatMessage;
  offer?: ChatOffer;
  isMyMessage: boolean;
  onAccept?: (offerId: string) => void;
  onDecline?: (offerId: string) => void;
}

export const OfferMessage: React.FC<OfferMessageProps> = ({
  message,
  offer,
  isMyMessage,
  onAccept,
  onDecline,
}) => {
  const { normalizeFontSize, spacing } = useResponsive();
  const { language } = useI18n();

  if (!message.offer_data && !offer) return null;

  const offerData = message.offer_data || offer;
  const status = offer?.status || 'PENDING';

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString(language === 'fr' ? 'fr-FR' : 'en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = () => {
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

  const getStatusText = () => {
    switch (status) {
      case 'ACCEPTED':
        return language === 'fr' ? 'Acceptée' : 'Accepted';
      case 'DECLINED':
        return language === 'fr' ? 'Refusée' : 'Declined';
      case 'EXPIRED':
        return language === 'fr' ? 'Expirée' : 'Expired';
      default:
        return language === 'fr' ? 'En attente' : 'Pending';
    }
  };

  const isExpired = offer?.expires_at && new Date(offer.expires_at) < new Date();
  const canRespond = !isMyMessage && status === 'PENDING' && !isExpired;

  return (
    <View
      style={[
        styles.offerContainer,
        { marginVertical: spacing(1), marginHorizontal: spacing(2) },
      ]}
    >
      <View
        style={[
          styles.offerCard,
          {
            padding: spacing(2),
            borderRadius: spacing(2),
            borderLeftWidth: 4,
            borderLeftColor: getStatusColor(),
          },
        ]}
      >
        {/* Header */}
        <View style={[styles.offerHeader, { marginBottom: spacing(1.5) }]}>
          <View style={styles.offerTitleContainer}>
            <Text
              style={[
                styles.offerBadge,
                {
                  fontSize: normalizeFontSize(11),
                  paddingHorizontal: spacing(1.5),
                  paddingVertical: spacing(0.5),
                  borderRadius: spacing(1),
                  backgroundColor: getStatusColor() + '20',
                },
              ]}
            >
              💼 {language === 'fr' ? 'Offre Personnalisée' : 'Custom Offer'}
            </Text>
            <View
              style={[
                styles.statusBadge,
                {
                  paddingHorizontal: spacing(1.5),
                  paddingVertical: spacing(0.5),
                  borderRadius: spacing(1),
                  backgroundColor: getStatusColor(),
                  marginLeft: spacing(1),
                },
              ]}
            >
              <Text style={[styles.statusText, { fontSize: normalizeFontSize(10) }]}>
                {getStatusText()}
              </Text>
            </View>
          </View>
        </View>

        {/* Service Name */}
        <Text
          style={[
            styles.serviceName,
            { fontSize: normalizeFontSize(18), marginBottom: spacing(1) },
          ]}
        >
          {offerData.service_name}
        </Text>

        {/* Description */}
        {offerData.description && (
          <Text
            style={[
              styles.description,
              {
                fontSize: normalizeFontSize(14),
                marginBottom: spacing(1.5),
                lineHeight: normalizeFontSize(20),
              },
            ]}
          >
            {offerData.description}
          </Text>
        )}

        {/* Price and Duration */}
        <View style={[styles.detailsRow, { marginBottom: spacing(1.5) }]}>
          <View style={styles.detailItem}>
            <Text style={[styles.detailLabel, { fontSize: normalizeFontSize(12) }]}>
              {language === 'fr' ? 'Prix' : 'Price'}
            </Text>
            <Text
              style={[
                styles.detailValue,
                styles.price,
                { fontSize: normalizeFontSize(20) },
              ]}
            >
              {formatCurrency(offerData.price, 'CM')}
            </Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={[styles.detailLabel, { fontSize: normalizeFontSize(12) }]}>
              {language === 'fr' ? 'Durée' : 'Duration'}
            </Text>
            <Text style={[styles.detailValue, { fontSize: normalizeFontSize(16) }]}>
              {offerData.duration} min
            </Text>
          </View>
        </View>

        {/* Expiration */}
        {offer?.expires_at && (
          <Text
            style={[
              styles.expirationText,
              {
                fontSize: normalizeFontSize(11),
                marginBottom: spacing(1.5),
                color: isExpired ? '#F44336' : '#999',
              },
            ]}
          >
            {isExpired
              ? language === 'fr'
                ? '⚠️ Cette offre a expiré'
                : '⚠️ This offer has expired'
              : language === 'fr'
                ? `Expire le ${new Date(offer.expires_at).toLocaleDateString('fr-FR')}`
                : `Expires on ${new Date(offer.expires_at).toLocaleDateString('en-US')}`}
          </Text>
        )}

        {/* Client Response */}
        {offer?.client_response && (
          <View
            style={[
              styles.responseContainer,
              {
                padding: spacing(1.5),
                marginBottom: spacing(1.5),
                borderRadius: spacing(1),
              },
            ]}
          >
            <Text style={[styles.responseLabel, { fontSize: normalizeFontSize(11) }]}>
              {language === 'fr' ? 'Réponse du client:' : 'Client response:'}
            </Text>
            <Text style={[styles.responseText, { fontSize: normalizeFontSize(13) }]}>
              {offer.client_response}
            </Text>
          </View>
        )}

        {/* Action Buttons (for client only) */}
        {canRespond && (
          <View style={[styles.actionsContainer, { marginTop: spacing(1) }]}>
            <TouchableOpacity
              style={[
                styles.declineButton,
                {
                  flex: 1,
                  paddingVertical: spacing(1.5),
                  borderRadius: spacing(1.5),
                  marginRight: spacing(1),
                },
              ]}
              onPress={() => offer?.id && onDecline?.(offer.id)}
            >
              <Text style={[styles.declineButtonText, { fontSize: normalizeFontSize(14) }]}>
                {language === 'fr' ? 'Refuser' : 'Decline'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.acceptButton,
                { flex: 1, paddingVertical: spacing(1.5), borderRadius: spacing(1.5) },
              ]}
              onPress={() => offer?.id && onAccept?.(offer.id)}
            >
              <Text style={[styles.acceptButtonText, { fontSize: normalizeFontSize(14) }]}>
                {language === 'fr' ? 'Accepter' : 'Accept'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Timestamp */}
        <Text style={[styles.timestamp, { fontSize: normalizeFontSize(11), marginTop: spacing(1) }]}>
          {formatTime(message.created_at)}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  offerContainer: {},
  offerCard: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  offerHeader: {},
  offerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  offerBadge: {
    color: '#FF9800',
    fontWeight: '600',
  },
  statusBadge: {},
  statusText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  serviceName: {
    fontWeight: '700',
    color: '#2D2D2D',
  },
  description: {
    color: '#666',
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    backgroundColor: '#F9F9F9',
    borderRadius: 8,
  },
  detailItem: {
    alignItems: 'center',
  },
  detailLabel: {
    color: '#999',
    marginBottom: 4,
  },
  detailValue: {
    fontWeight: '600',
    color: '#2D2D2D',
  },
  price: {
    color: '#4CAF50',
    fontWeight: '700',
  },
  expirationText: {
    fontStyle: 'italic',
  },
  responseContainer: {
    backgroundColor: '#F5F5F5',
  },
  responseLabel: {
    color: '#666',
    marginBottom: 4,
  },
  responseText: {
    color: '#2D2D2D',
  },
  actionsContainer: {
    flexDirection: 'row',
  },
  declineButton: {
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  declineButtonText: {
    color: '#666',
    fontWeight: '600',
  },
  acceptButton: {
    backgroundColor: '#4CAF50',
    alignItems: 'center',
    justifyContent: 'center',
  },
  acceptButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  timestamp: {
    color: '#999',
    textAlign: 'right',
  },
});
