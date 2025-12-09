import React, { useState, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    Modal,
    Alert,
    Image,
    Animated,
    PanResponder,
    Dimensions,
} from 'react-native';
import { useResponsive } from '../../hooks/useResponsive';

export type PaymentMethod = 'orange_money' | 'mtn_momo' | 'card';

interface PaymentMethodSelectorProps {
    visible: boolean;
    onClose: () => void;
    onConfirm: (method: PaymentMethod, phoneNumber?: string) => void;
    amount: number;
}

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export const PaymentMethodSelector: React.FC<PaymentMethodSelectorProps> = ({
    visible,
    onClose,
    onConfirm,
    amount,
}) => {
    const { normalizeFontSize, spacing } = useResponsive();
    const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
    const [phoneNumber, setPhoneNumber] = useState('');

    const translateY = useRef(new Animated.Value(0)).current;

    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: (_, gestureState) => {
                return Math.abs(gestureState.dy) > 5;
            },
            onPanResponderMove: (_, gestureState) => {
                if (gestureState.dy > 0) {
                    translateY.setValue(gestureState.dy);
                }
            },
            onPanResponderRelease: (_, gestureState) => {
                if (gestureState.dy > 100) {
                    handleClose();
                } else {
                    Animated.spring(translateY, {
                        toValue: 0,
                        useNativeDriver: true,
                    }).start();
                }
            },
        })
    ).current;

    const handleConfirm = () => {
        if (!selectedMethod) {
            Alert.alert('Erreur', 'Veuillez sélectionner un moyen de paiement');
            return;
        }

        if ((selectedMethod === 'orange_money' || selectedMethod === 'mtn_momo') && !phoneNumber) {
            Alert.alert('Erreur', 'Veuillez entrer votre numéro de téléphone');
            return;
        }

        // Validate phone number format (Cameroon)
        if ((selectedMethod === 'orange_money' || selectedMethod === 'mtn_momo')) {
            const cleanNumber = phoneNumber.replace(/\s/g, '');
            if (!/^(237)?6[0-9]{8}$/.test(cleanNumber)) {
                Alert.alert('Erreur', 'Numéro de téléphone invalide. Format: 6XXXXXXXX');
                return;
            }
        }

        onConfirm(selectedMethod, phoneNumber || undefined);
        setSelectedMethod(null);
        setPhoneNumber('');
        translateY.setValue(0);
    };

    const handleClose = () => {
        Animated.timing(translateY, {
            toValue: SCREEN_HEIGHT,
            duration: 300,
            useNativeDriver: true,
        }).start(() => {
            setSelectedMethod(null);
            setPhoneNumber('');
            translateY.setValue(0);
            onClose();
        });
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={handleClose}
        >
            <View style={styles.overlay}>
                <Animated.View
                    style={[
                        styles.container,
                        {
                            padding: spacing(3),
                            transform: [{ translateY }]
                        }
                    ]}
                >
                    {/* Drag Handle */}
                    <View {...panResponder.panHandlers} style={styles.dragHandleContainer}>
                        <View style={styles.dragHandle} />
                    </View>

                    <Text style={[styles.title, { fontSize: normalizeFontSize(20), marginBottom: spacing(2) }]}>
                        Choisir un moyen de paiement
                    </Text>

                    <Text style={[styles.amount, { fontSize: normalizeFontSize(16), marginBottom: spacing(3) }]}>
                        Montant: {amount.toLocaleString()} FCFA
                    </Text>

                    {/* Orange Money */}
                    <TouchableOpacity
                        style={[
                            styles.methodCard,
                            { padding: spacing(2), marginBottom: spacing(2) },
                            selectedMethod === 'orange_money' && styles.methodCardSelected,
                        ]}
                        onPress={() => setSelectedMethod('orange_money')}
                    >
                        <View style={styles.methodHeader}>
                            <Image
                                source={require('../../../assets/images/payment/orange_money.jpg')}
                                style={styles.methodImage}
                                resizeMode="contain"
                            />
                            <Text style={[styles.methodName, { fontSize: normalizeFontSize(16) }]}>
                                Orange Money
                            </Text>
                        </View>
                        {selectedMethod === 'orange_money' && (
                            <View style={{ marginTop: spacing(1.5) }}>
                                <Text style={[styles.inputLabel, { fontSize: normalizeFontSize(13), marginBottom: spacing(0.5) }]}>
                                    Numéro de téléphone
                                </Text>
                                <TextInput
                                    style={[styles.input, { fontSize: normalizeFontSize(14), padding: spacing(1.5) }]}
                                    placeholder="Ex: 655123456"
                                    placeholderTextColor="#999"
                                    keyboardType="phone-pad"
                                    value={phoneNumber}
                                    onChangeText={setPhoneNumber}
                                    maxLength={9}
                                />
                            </View>
                        )}
                    </TouchableOpacity>

                    {/* MTN Mobile Money */}
                    <TouchableOpacity
                        style={[
                            styles.methodCard,
                            { padding: spacing(2), marginBottom: spacing(2) },
                            selectedMethod === 'mtn_momo' && styles.methodCardSelected,
                        ]}
                        onPress={() => setSelectedMethod('mtn_momo')}
                    >
                        <View style={styles.methodHeader}>
                            <Image
                                source={require('../../../assets/images/payment/mtn_momo.jpg')}
                                style={styles.methodImage}
                                resizeMode="contain"
                            />
                            <Text style={[styles.methodName, { fontSize: normalizeFontSize(16) }]}>
                                MTN Mobile Money
                            </Text>
                        </View>
                        {selectedMethod === 'mtn_momo' && (
                            <View style={{ marginTop: spacing(1.5) }}>
                                <Text style={[styles.inputLabel, { fontSize: normalizeFontSize(13), marginBottom: spacing(0.5) }]}>
                                    Numéro de téléphone
                                </Text>
                                <TextInput
                                    style={[styles.input, { fontSize: normalizeFontSize(14), padding: spacing(1.5) }]}
                                    placeholder="Ex: 670123456"
                                    placeholderTextColor="#999"
                                    keyboardType="phone-pad"
                                    value={phoneNumber}
                                    onChangeText={setPhoneNumber}
                                    maxLength={9}
                                />
                            </View>
                        )}
                    </TouchableOpacity>

                    {/* Card Payment (Disabled) */}
                    <TouchableOpacity
                        style={[
                            styles.methodCard,
                            styles.methodCardDisabled,
                            { padding: spacing(2), marginBottom: spacing(2) },
                        ]}
                        disabled
                    >
                        <View style={styles.methodHeader}>
                            <Text style={[styles.methodIcon, { fontSize: normalizeFontSize(24) }]}>💳</Text>
                            <View style={{ flex: 1 }}>
                                <Text style={[styles.methodName, styles.methodNameDisabled, { fontSize: normalizeFontSize(16) }]}>
                                    Carte Bancaire
                                </Text>
                                <Text style={[styles.comingSoon, { fontSize: normalizeFontSize(12), marginTop: spacing(0.5) }]}>
                                    Bientôt disponible
                                </Text>
                            </View>
                        </View>
                    </TouchableOpacity>

                    {/* Buttons */}
                    <View style={styles.buttons}>
                        <TouchableOpacity
                            style={[styles.button, styles.buttonCancel, { padding: spacing(1.5), marginRight: spacing(1.5) }]}
                            onPress={handleClose}
                        >
                            <Text style={[styles.buttonText, styles.buttonTextCancel, { fontSize: normalizeFontSize(14) }]}>
                                Annuler
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.button, styles.buttonConfirm, { padding: spacing(1.5) }]}
                            onPress={handleConfirm}
                        >
                            <Text style={[styles.buttonText, { fontSize: normalizeFontSize(14) }]}>
                                Confirmer
                            </Text>
                        </TouchableOpacity>
                    </View>
                </Animated.View>
            </View>
        </Modal >
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    container: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        maxHeight: '85%',
    },
    dragHandleContainer: {
        alignItems: 'center',
        paddingVertical: 8,
        marginBottom: 8,
    },
    dragHandle: {
        width: 40,
        height: 4,
        backgroundColor: '#D0D0D0',
        borderRadius: 2,
    },
    title: {
        fontWeight: '700',
        color: '#2D2D2D',
        textAlign: 'center',
    },
    amount: {
        fontWeight: '600',
        color: '#666',
        textAlign: 'center',
    },
    methodCard: {
        backgroundColor: '#F5F5F5',
        borderRadius: 12,
        borderWidth: 2,
        borderColor: 'transparent',
    },
    methodCardSelected: {
        borderColor: '#2D2D2D',
        backgroundColor: '#FFFFFF',
    },
    methodCardDisabled: {
        opacity: 0.5,
    },
    methodHeader: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    methodImage: {
        width: 50,
        height: 50,
        marginRight: 12,
        borderRadius: 8,
    },
    methodIcon: {
        marginRight: 12,
    },
    methodName: {
        fontWeight: '600',
        color: '#2D2D2D',
        flex: 1,
    },
    methodNameDisabled: {
        color: '#999',
    },
    comingSoon: {
        color: '#999',
        fontStyle: 'italic',
    },
    inputLabel: {
        color: '#2D2D2D',
        fontWeight: '600',
    },
    input: {
        backgroundColor: '#FFFFFF',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#E0E0E0',
    },
    buttons: {
        flexDirection: 'row',
        marginTop: 8,
    },
    button: {
        flex: 1,
        borderRadius: 12,
        alignItems: 'center',
    },
    buttonCancel: {
        backgroundColor: '#F5F5F5',
    },
    buttonConfirm: {
        backgroundColor: '#2D2D2D',
    },
    buttonText: {
        fontWeight: '600',
        color: '#FFFFFF',
    },
    buttonTextCancel: {
        color: '#2D2D2D',
    },
});
