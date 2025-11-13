import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useResponsive } from '../../hooks/useResponsive';
import { useI18n } from '../../i18n/I18nContext';

interface CreateOfferModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (offer: {
    service_name: string;
    description: string;
    price: number;
    duration: number;
  }) => void;
}

export const CreateOfferModal: React.FC<CreateOfferModalProps> = ({
  visible,
  onClose,
  onSubmit,
}) => {
  const { normalizeFontSize, spacing } = useResponsive();
  const { language } = useI18n();

  const [serviceName, setServiceName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [duration, setDuration] = useState('');

  const resetForm = () => {
    setServiceName('');
    setDescription('');
    setPrice('');
    setDuration('');
  };

  const handleSubmit = () => {
    if (!serviceName.trim() || !price || !duration) {
      return;
    }

    onSubmit({
      service_name: serviceName.trim(),
      description: description.trim(),
      price: parseFloat(price),
      duration: parseInt(duration, 10),
    });

    resetForm();
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const isValid = serviceName.trim() && price && duration && parseFloat(price) > 0 && parseInt(duration, 10) > 0;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        style={styles.modalContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.modalBackground}>
          <View
            style={[
              styles.modalContent,
              {
                padding: spacing(3),
                borderRadius: spacing(3),
                maxHeight: '90%',
              },
            ]}
          >
            {/* Header */}
            <View style={[styles.header, { marginBottom: spacing(2) }]}>
              <Text style={[styles.title, { fontSize: normalizeFontSize(22) }]}>
                {language === 'fr' ? 'Créer une Offre' : 'Create Offer'}
              </Text>
              <TouchableOpacity
                style={[styles.closeButton, { width: spacing(4), height: spacing(4) }]}
                onPress={handleClose}
              >
                <Text style={[styles.closeButtonText, { fontSize: normalizeFontSize(20) }]}>
                  ✕
                </Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Service Name */}
              <View style={[styles.inputGroup, { marginBottom: spacing(2) }]}>
                <Text style={[styles.label, { fontSize: normalizeFontSize(14), marginBottom: spacing(1) }]}>
                  {language === 'fr' ? 'Nom du Service' : 'Service Name'} *
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      padding: spacing(1.5),
                      borderRadius: spacing(1.5),
                      fontSize: normalizeFontSize(14),
                    },
                  ]}
                  placeholder={
                    language === 'fr'
                      ? 'Ex: Massage Relaxant Personnalisé'
                      : 'Ex: Custom Relaxation Massage'
                  }
                  placeholderTextColor="#999"
                  value={serviceName}
                  onChangeText={setServiceName}
                  maxLength={100}
                />
              </View>

              {/* Description */}
              <View style={[styles.inputGroup, { marginBottom: spacing(2) }]}>
                <Text style={[styles.label, { fontSize: normalizeFontSize(14), marginBottom: spacing(1) }]}>
                  {language === 'fr' ? 'Description' : 'Description'}
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    styles.textArea,
                    {
                      padding: spacing(1.5),
                      borderRadius: spacing(1.5),
                      fontSize: normalizeFontSize(14),
                      height: spacing(15),
                    },
                  ]}
                  placeholder={
                    language === 'fr'
                      ? 'Décrivez votre offre personnalisée...'
                      : 'Describe your custom offer...'
                  }
                  placeholderTextColor="#999"
                  value={description}
                  onChangeText={setDescription}
                  multiline
                  numberOfLines={4}
                  maxLength={500}
                  textAlignVertical="top"
                />
                <Text style={[styles.charCount, { fontSize: normalizeFontSize(11), marginTop: spacing(0.5) }]}>
                  {description.length}/500
                </Text>
              </View>

              {/* Price and Duration Row */}
              <View style={[styles.row, { marginBottom: spacing(2) }]}>
                {/* Price */}
                <View style={[styles.inputGroup, { flex: 1, marginRight: spacing(1) }]}>
                  <Text style={[styles.label, { fontSize: normalizeFontSize(14), marginBottom: spacing(1) }]}>
                    {language === 'fr' ? 'Prix (FCFA)' : 'Price (FCFA)'} *
                  </Text>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        padding: spacing(1.5),
                        borderRadius: spacing(1.5),
                        fontSize: normalizeFontSize(14),
                      },
                    ]}
                    placeholder="10000"
                    placeholderTextColor="#999"
                    value={price}
                    onChangeText={(text) => {
                      // Only allow numbers
                      const numericValue = text.replace(/[^0-9]/g, '');
                      setPrice(numericValue);
                    }}
                    keyboardType="numeric"
                    maxLength={10}
                  />
                </View>

                {/* Duration */}
                <View style={[styles.inputGroup, { flex: 1, marginLeft: spacing(1) }]}>
                  <Text style={[styles.label, { fontSize: normalizeFontSize(14), marginBottom: spacing(1) }]}>
                    {language === 'fr' ? 'Durée (min)' : 'Duration (min)'} *
                  </Text>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        padding: spacing(1.5),
                        borderRadius: spacing(1.5),
                        fontSize: normalizeFontSize(14),
                      },
                    ]}
                    placeholder="60"
                    placeholderTextColor="#999"
                    value={duration}
                    onChangeText={(text) => {
                      // Only allow numbers
                      const numericValue = text.replace(/[^0-9]/g, '');
                      setDuration(numericValue);
                    }}
                    keyboardType="numeric"
                    maxLength={4}
                  />
                </View>
              </View>

              {/* Info Box */}
              <View
                style={[
                  styles.infoBox,
                  {
                    padding: spacing(1.5),
                    borderRadius: spacing(1.5),
                    marginBottom: spacing(2),
                  },
                ]}
              >
                <Text style={[styles.infoText, { fontSize: normalizeFontSize(12) }]}>
                  💡{' '}
                  {language === 'fr'
                    ? "Cette offre sera envoyée au client et sera valable pendant 48 heures. Le client pourra l'accepter ou la refuser."
                    : 'This offer will be sent to the client and will be valid for 48 hours. The client can accept or decline it.'}
                </Text>
              </View>

              {/* Action Buttons */}
              <View style={[styles.actions, { marginTop: spacing(2) }]}>
                <TouchableOpacity
                  style={[
                    styles.cancelButton,
                    {
                      flex: 1,
                      paddingVertical: spacing(2),
                      borderRadius: spacing(2),
                      marginRight: spacing(1.5),
                    },
                  ]}
                  onPress={handleClose}
                >
                  <Text style={[styles.cancelButtonText, { fontSize: normalizeFontSize(16) }]}>
                    {language === 'fr' ? 'Annuler' : 'Cancel'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.submitButton,
                    { flex: 1, paddingVertical: spacing(2), borderRadius: spacing(2) },
                    !isValid && styles.submitButtonDisabled,
                  ]}
                  onPress={handleSubmit}
                  disabled={!isValid}
                >
                  <Text style={[styles.submitButtonText, { fontSize: normalizeFontSize(16) }]}>
                    {language === 'fr' ? 'Envoyer l\'Offre' : 'Send Offer'}
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
  },
  modalBackground: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    width: '100%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontWeight: '700',
    color: '#2D2D2D',
  },
  closeButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    color: '#666',
  },
  inputGroup: {},
  label: {
    fontWeight: '600',
    color: '#2D2D2D',
  },
  input: {
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    color: '#2D2D2D',
  },
  textArea: {
    textAlignVertical: 'top',
  },
  charCount: {
    color: '#999',
    textAlign: 'right',
  },
  row: {
    flexDirection: 'row',
  },
  infoBox: {
    backgroundColor: '#E3F2FD',
    borderLeftWidth: 3,
    borderLeftColor: '#2196F3',
  },
  infoText: {
    color: '#1565C0',
    lineHeight: 18,
  },
  actions: {
    flexDirection: 'row',
  },
  cancelButton: {
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  cancelButtonText: {
    color: '#666',
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: '#4CAF50',
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#CCC',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
