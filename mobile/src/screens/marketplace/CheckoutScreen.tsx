import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TextInput,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useResponsive } from '../../hooks/useResponsive';
import { useAuth } from '../../contexts/AuthContext';
import { marketplaceApi } from '../../services/api';
import { Ionicons } from '@expo/vector-icons';

export const CheckoutScreen = () => {
    const { normalizeFontSize, spacing } = useResponsive();
    const { user } = useAuth();
    const navigation = useNavigation<any>();
    const route = useRoute<any>();
    const product = route.params?.product;

    const [quantity, setQuantity] = useState(1);
    const [paymentMethod, setPaymentMethod] = useState<'cash_on_delivery' | 'cash_on_pickup'>('cash_on_delivery');
    const [deliveryAddress, setDeliveryAddress] = useState('');
    const [loading, setLoading] = useState(false);

    const total = product ? product.price * quantity : 0;

    const handlePlaceOrder = async () => {
        if (!deliveryAddress && paymentMethod === 'cash_on_delivery') {
            Alert.alert('Erreur', 'Veuillez entrer votre adresse de livraison');
            return;
        }

        if (quantity > product.stock_quantity) {
            Alert.alert('Erreur', 'Quantité non disponible en stock');
            return;
        }

        try {
            setLoading(true);
            await marketplaceApi.createOrder({
                product_id: product.id,
                quantity,
                payment_method: paymentMethod,
                delivery_method: paymentMethod === 'cash_on_delivery' ? 'delivery' : 'pickup',
                delivery_address: deliveryAddress || undefined,
            });

            Alert.alert(
                'Commande confirmée !',
                'Votre commande a été enregistrée. Le vendeur va la traiter.',
                [
                    {
                        text: 'OK',
                        onPress: () => navigation.navigate('ClientOrders'),
                    },
                ]
            );
        } catch (error: any) {
            Alert.alert('Erreur', error.message || 'Impossible de passer la commande');
        } finally {
            setLoading(false);
        }
    };

    if (!product) {
        navigation.goBack();
        return null;
    }

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={[styles.header, { padding: spacing(2.5), paddingTop: spacing(6) }]}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color="#2D2D2D" />
                </TouchableOpacity>
                <Text style={[styles.title, { fontSize: normalizeFontSize(18) }]}>Commander</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView contentContainerStyle={{ padding: spacing(2.5) }}>
                {/* Product Summary */}
                <View style={[styles.section, { padding: spacing(2), marginBottom: spacing(2) }]}>
                    <Text style={[styles.sectionTitle, { fontSize: normalizeFontSize(16) }]}>Produit</Text>
                    <Text style={[styles.productName, { fontSize: normalizeFontSize(16) }]}>
                        {product.name}
                    </Text>
                    <Text style={[styles.productPrice, { fontSize: normalizeFontSize(14) }]}>
                        {product.price.toLocaleString()} XAF / unité
                    </Text>
                </View>

                {/* Quantity */}
                <View style={[styles.section, { padding: spacing(2), marginBottom: spacing(2) }]}>
                    <Text style={[styles.sectionTitle, { fontSize: normalizeFontSize(16) }]}>Quantité</Text>
                    <View style={styles.quantityRow}>
                        <TouchableOpacity
                            style={[styles.quantityButton, { padding: spacing(1) }]}
                            onPress={() => setQuantity(Math.max(1, quantity - 1))}
                        >
                            <Ionicons name="remove" size={20} color="#2D2D2D" />
                        </TouchableOpacity>
                        <Text style={[styles.quantityText, { fontSize: normalizeFontSize(18) }]}>
                            {quantity}
                        </Text>
                        <TouchableOpacity
                            style={[styles.quantityButton, { padding: spacing(1) }]}
                            onPress={() => setQuantity(Math.min(product.stock_quantity, quantity + 1))}
                        >
                            <Ionicons name="add" size={20} color="#2D2D2D" />
                        </TouchableOpacity>
                    </View>
                    <Text style={[styles.stockInfo, { fontSize: normalizeFontSize(12) }]}>
                        Stock disponible: {product.stock_quantity}
                    </Text>
                </View>

                {/* Payment Method */}
                <View style={[styles.section, { padding: spacing(2), marginBottom: spacing(2) }]}>
                    <Text style={[styles.sectionTitle, { fontSize: normalizeFontSize(16) }]}>
                        Mode de paiement
                    </Text>
                    <TouchableOpacity
                        style={[styles.radioOption, { padding: spacing(1.5) }]}
                        onPress={() => setPaymentMethod('cash_on_delivery')}
                    >
                        <View style={styles.radio}>
                            {paymentMethod === 'cash_on_delivery' && <View style={styles.radioSelected} />}
                        </View>
                        <Text style={[styles.radioLabel, { fontSize: normalizeFontSize(14) }]}>
                            💵 Paiement à la livraison
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.radioOption, { padding: spacing(1.5) }]}
                        onPress={() => setPaymentMethod('cash_on_pickup')}
                    >
                        <View style={styles.radio}>
                            {paymentMethod === 'cash_on_pickup' && <View style={styles.radioSelected} />}
                        </View>
                        <Text style={[styles.radioLabel, { fontSize: normalizeFontSize(14) }]}>
                            🏪 Paiement au retrait
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Delivery Address */}
                {paymentMethod === 'cash_on_delivery' && (
                    <View style={[styles.section, { padding: spacing(2), marginBottom: spacing(2) }]}>
                        <Text style={[styles.sectionTitle, { fontSize: normalizeFontSize(16) }]}>
                            Adresse de livraison
                        </Text>
                        <TextInput
                            style={[styles.input, { padding: spacing(1.5), fontSize: normalizeFontSize(14) }]}
                            placeholder="Entrez votre adresse complète"
                            value={deliveryAddress}
                            onChangeText={setDeliveryAddress}
                            multiline
                            numberOfLines={3}
                        />
                    </View>
                )}

                {/* Total */}
                <View style={[styles.totalSection, { padding: spacing(2) }]}>
                    <Text style={[styles.totalLabel, { fontSize: normalizeFontSize(16) }]}>Total</Text>
                    <Text style={[styles.totalAmount, { fontSize: normalizeFontSize(24) }]}>
                        {total.toLocaleString()} XAF
                    </Text>
                </View>

                {/* Place Order Button */}
                <TouchableOpacity
                    style={[styles.orderButton, { padding: spacing(2), marginTop: spacing(3) }]}
                    onPress={handlePlaceOrder}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="#FFF" />
                    ) : (
                        <Text style={[styles.orderButtonText, { fontSize: normalizeFontSize(16) }]}>
                            Confirmer la commande
                        </Text>
                    )}
                </TouchableOpacity>
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
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
    },
    title: {
        fontWeight: 'bold',
        color: '#2D2D2D',
    },
    section: {
        backgroundColor: '#FFF',
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    sectionTitle: {
        fontWeight: '600',
        color: '#2D2D2D',
        marginBottom: 12,
    },
    productName: {
        fontWeight: '600',
        color: '#2D2D2D',
        marginBottom: 4,
    },
    productPrice: {
        color: '#666',
    },
    quantityRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 8,
    },
    quantityButton: {
        backgroundColor: '#F5F5F5',
        borderRadius: 8,
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    quantityText: {
        fontWeight: 'bold',
        color: '#2D2D2D',
        marginHorizontal: 24,
    },
    stockInfo: {
        color: '#666',
        textAlign: 'center',
    },
    radioOption: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    radio: {
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: '#2D2D2D',
        marginRight: 12,
        alignItems: 'center',
        justifyContent: 'center',
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
    input: {
        backgroundColor: '#F5F5F5',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#E0E0E0',
        textAlignVertical: 'top',
    },
    totalSection: {
        backgroundColor: '#2D2D2D',
        borderRadius: 12,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    totalLabel: {
        color: '#FFF',
        fontWeight: '600',
    },
    totalAmount: {
        color: '#4CAF50',
        fontWeight: 'bold',
    },
    orderButton: {
        backgroundColor: '#4CAF50',
        borderRadius: 12,
        alignItems: 'center',
    },
    orderButtonText: {
        color: '#FFF',
        fontWeight: 'bold',
    },
});
