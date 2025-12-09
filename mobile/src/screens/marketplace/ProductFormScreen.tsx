import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TextInput,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
    Image,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useResponsive } from '../../hooks/useResponsive';
import { useAuth } from '../../contexts/AuthContext';
import { marketplaceApi } from '../../services/api';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

const CATEGORIES = [
    { label: 'Équipement', value: 'equipment' },
    { label: 'Produit de beauté', value: 'beauty_product' },
    { label: 'Accessoire', value: 'accessory' },
    { label: 'Autre', value: 'other' },
];

export const ProductFormScreen = () => {
    const { normalizeFontSize, spacing } = useResponsive();
    const { user } = useAuth();
    const navigation = useNavigation<any>();
    const route = useRoute<any>();
    const productId = route.params?.productId;

    const [loading, setLoading] = useState(false);
    const [images, setImages] = useState<string[]>([]);
    const [videoUrl, setVideoUrl] = useState<string>('');
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        category: 'beauty_product',
        price: '',
        stock_quantity: '',
        city: '',
    });

    useEffect(() => {
        if (productId) {
            loadProduct();
        }
    }, [productId]);

    const loadProduct = async () => {
        try {
            setLoading(true);
            const product = await marketplaceApi.getProductById(productId);
            setFormData({
                name: product.name,
                description: product.description || '',
                category: product.category,
                price: product.price.toString(),
                stock_quantity: product.stock_quantity.toString(),
                city: product.city || '',
            });
            setImages(product.images || []);
            setVideoUrl(product.video_url || '');
        } catch (error) {
            Alert.alert('Erreur', 'Impossible de charger le produit');
            navigation.goBack();
        } finally {
            setLoading(false);
        }
    };

    const pickImages = async () => {
        if (images.length >= 5) {
            Alert.alert('Limite atteinte', 'Maximum 5 images');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsMultipleSelection: true,
            quality: 0.8,
            selectionLimit: 5 - images.length,
        });

        if (!result.canceled) {
            const newImages = result.assets.map(asset => asset.uri);
            setImages([...images, ...newImages].slice(0, 5));
        }
    };

    const pickVideo = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Videos,
            quality: 0.8,
        });

        if (!result.canceled) {
            setVideoUrl(result.assets[0].uri);
        }
    };

    const removeImage = (index: number) => {
        setImages(images.filter((_, i) => i !== index));
    };

    const handleSubmit = async () => {
        if (!formData.name || !formData.price || !formData.stock_quantity) {
            Alert.alert('Erreur', 'Veuillez remplir tous les champs obligatoires');
            return;
        }

        try {
            setLoading(true);

            // Upload images to Supabase if they are local URIs
            const uploadedImages: string[] = [];
            for (const img of images) {
                if (img.startsWith('file://')) {
                    const result = await marketplaceApi.uploadFile(img, user?.id || '', 'product');
                    uploadedImages.push(result.url);
                } else {
                    uploadedImages.push(img);
                }
            }

            // Upload video if it's a local URI
            let uploadedVideoUrl = videoUrl;
            if (videoUrl && videoUrl.startsWith('file://')) {
                const result = await marketplaceApi.uploadFile(videoUrl, user?.id || '', 'video');
                uploadedVideoUrl = result.url;
            }

            const data = {
                ...formData,
                price: parseFloat(formData.price),
                stock_quantity: parseInt(formData.stock_quantity),
                images: uploadedImages,
                video_url: uploadedVideoUrl || undefined,
            };

            if (productId) {
                await marketplaceApi.updateProduct(productId, data);
                Alert.alert('Succès', 'Produit mis à jour');
            } else {
                await marketplaceApi.createProduct(data);
                Alert.alert('Succès', 'Produit créé (en attente d\'approbation)');
            }
            navigation.goBack();
        } catch (error: any) {
            Alert.alert('Erreur', error.message || 'Impossible de sauvegarder le produit');
        } finally {
            setLoading(false);
        }
    };

    if (loading && productId) {
        return (
            <View style={[styles.container, styles.centered]}>
                <ActivityIndicator size="large" color="#2D2D2D" />
            </View>
        );
    }

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
            {/* Header */}
            <View style={[styles.header, { padding: spacing(2.5), paddingTop: spacing(6) }]}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color="#2D2D2D" />
                </TouchableOpacity>
                <Text style={[styles.title, { fontSize: normalizeFontSize(18) }]}>
                    {productId ? 'Modifier le produit' : 'Nouveau produit'}
                </Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={{ padding: spacing(2.5), paddingBottom: spacing(10) }}
                keyboardShouldPersistTaps="handled"
            >
                {/* Images */}
                <View style={{ marginBottom: spacing(2) }}>
                    <Text style={[styles.label, { fontSize: normalizeFontSize(14) }]}>
                        Images (max 5)
                    </Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
                        {images.map((uri, index) => (
                            <View key={index} style={[styles.imagePreview, { marginRight: spacing(1) }]}>
                                <Image source={{ uri }} style={styles.previewImage} />
                                <TouchableOpacity
                                    style={styles.removeButton}
                                    onPress={() => removeImage(index)}
                                >
                                    <Ionicons name="close-circle" size={24} color="#FF4444" />
                                </TouchableOpacity>
                            </View>
                        ))}
                        {images.length < 5 && (
                            <TouchableOpacity
                                style={[styles.addImageButton, { width: spacing(10), height: spacing(10) }]}
                                onPress={pickImages}
                            >
                                <Ionicons name="camera" size={32} color="#666" />
                                <Text style={{ fontSize: normalizeFontSize(12), color: '#666', marginTop: 4 }}>
                                    Ajouter
                                </Text>
                            </TouchableOpacity>
                        )}
                    </ScrollView>
                </View>

                {/* Video */}
                <View style={{ marginBottom: spacing(2) }}>
                    <Text style={[styles.label, { fontSize: normalizeFontSize(14) }]}>
                        Vidéo (optionnel)
                    </Text>
                    {videoUrl ? (
                        <View style={styles.videoPreview}>
                            <Ionicons name="videocam" size={32} color="#4CAF50" />
                            <Text style={{ fontSize: normalizeFontSize(12), color: '#666', marginTop: 4 }}>
                                Vidéo ajoutée
                            </Text>
                            <TouchableOpacity
                                style={styles.removeVideoButton}
                                onPress={() => setVideoUrl('')}
                            >
                                <Ionicons name="close-circle" size={24} color="#FF4444" />
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <TouchableOpacity style={styles.addVideoButton} onPress={pickVideo}>
                            <Ionicons name="videocam-outline" size={24} color="#666" />
                            <Text style={{ fontSize: normalizeFontSize(14), color: '#666', marginLeft: 8 }}>
                                Ajouter une vidéo
                            </Text>
                        </TouchableOpacity>
                    )}
                </View>

                {/* Name */}
                <View style={{ marginBottom: spacing(2) }}>
                    <Text style={[styles.label, { fontSize: normalizeFontSize(14) }]}>Nom *</Text>
                    <TextInput
                        style={[styles.input, { fontSize: normalizeFontSize(16), padding: spacing(1.5) }]}
                        value={formData.name}
                        onChangeText={(text) => setFormData({ ...formData, name: text })}
                        placeholder="Ex: Sèche-cheveux professionnel"
                    />
                </View>

                {/* Description */}
                <View style={{ marginBottom: spacing(2) }}>
                    <Text style={[styles.label, { fontSize: normalizeFontSize(14) }]}>Description</Text>
                    <TextInput
                        style={[styles.input, styles.textArea, { fontSize: normalizeFontSize(16), padding: spacing(1.5) }]}
                        value={formData.description}
                        onChangeText={(text) => setFormData({ ...formData, description: text })}
                        placeholder="Décrivez votre produit..."
                        multiline
                        numberOfLines={4}
                    />
                </View>

                {/* Category */}
                <View style={{ marginBottom: spacing(2) }}>
                    <Text style={[styles.label, { fontSize: normalizeFontSize(14) }]}>Catégorie *</Text>
                    <View style={styles.categoryGrid}>
                        {CATEGORIES.map((cat) => (
                            <TouchableOpacity
                                key={cat.value}
                                style={[
                                    styles.categoryButton,
                                    { padding: spacing(1.5) },
                                    formData.category === cat.value && styles.categoryButtonActive,
                                ]}
                                onPress={() => setFormData({ ...formData, category: cat.value })}
                            >
                                <Text
                                    style={[
                                        styles.categoryText,
                                        { fontSize: normalizeFontSize(14) },
                                        formData.category === cat.value && styles.categoryTextActive,
                                    ]}
                                >
                                    {cat.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Price */}
                <View style={{ marginBottom: spacing(2) }}>
                    <Text style={[styles.label, { fontSize: normalizeFontSize(14) }]}>Prix (XAF) *</Text>
                    <TextInput
                        style={[styles.input, { fontSize: normalizeFontSize(16), padding: spacing(1.5) }]}
                        value={formData.price}
                        onChangeText={(text) => setFormData({ ...formData, price: text })}
                        placeholder="Ex: 25000"
                        keyboardType="numeric"
                    />
                </View>

                {/* Stock */}
                <View style={{ marginBottom: spacing(2) }}>
                    <Text style={[styles.label, { fontSize: normalizeFontSize(14) }]}>Stock *</Text>
                    <TextInput
                        style={[styles.input, { fontSize: normalizeFontSize(16), padding: spacing(1.5) }]}
                        value={formData.stock_quantity}
                        onChangeText={(text) => setFormData({ ...formData, stock_quantity: text })}
                        placeholder="Ex: 10"
                        keyboardType="numeric"
                    />
                </View>

                {/* City */}
                <View style={{ marginBottom: spacing(3) }}>
                    <Text style={[styles.label, { fontSize: normalizeFontSize(14) }]}>Ville</Text>
                    <TextInput
                        style={[styles.input, { fontSize: normalizeFontSize(16), padding: spacing(1.5) }]}
                        value={formData.city}
                        onChangeText={(text) => setFormData({ ...formData, city: text })}
                        placeholder="Ex: Yaoundé"
                    />
                </View>

                {/* Submit Button */}
                <TouchableOpacity
                    style={[styles.submitButton, { padding: spacing(2), marginBottom: spacing(2) }]}
                    onPress={handleSubmit}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="#FFF" />
                    ) : (
                        <Text style={[styles.submitButtonText, { fontSize: normalizeFontSize(16) }]}>
                            {productId ? 'Mettre à jour' : 'Créer le produit'}
                        </Text>
                    )}
                </TouchableOpacity>

                <Text style={[styles.note, { fontSize: normalizeFontSize(12) }]}>
                    * Champs obligatoires{'\n'}
                    Note: Votre produit sera soumis à validation avant d'être visible.
                </Text>
            </ScrollView>
        </KeyboardAvoidingView>
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
        borderBottomColor: '#E0E0E0',
    },
    title: {
        fontWeight: 'bold',
        color: '#2D2D2D',
    },
    label: {
        fontWeight: '600',
        color: '#2D2D2D',
        marginBottom: 8,
    },
    input: {
        backgroundColor: '#FFF',
        borderWidth: 1,
        borderColor: '#E0E0E0',
        borderRadius: 8,
    },
    textArea: {
        height: 100,
        textAlignVertical: 'top',
    },
    imagePreview: {
        position: 'relative',
    },
    previewImage: {
        width: 80,
        height: 80,
        borderRadius: 8,
        backgroundColor: '#E0E0E0',
    },
    removeButton: {
        position: 'absolute',
        top: -8,
        right: -8,
        backgroundColor: '#FFF',
        borderRadius: 12,
    },
    addImageButton: {
        backgroundColor: '#FFF',
        borderWidth: 2,
        borderColor: '#E0E0E0',
        borderStyle: 'dashed',
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    videoPreview: {
        backgroundColor: '#FFF',
        borderWidth: 1,
        borderColor: '#E0E0E0',
        borderRadius: 8,
        padding: 16,
        alignItems: 'center',
        position: 'relative',
    },
    removeVideoButton: {
        position: 'absolute',
        top: 8,
        right: 8,
    },
    addVideoButton: {
        backgroundColor: '#FFF',
        borderWidth: 1,
        borderColor: '#E0E0E0',
        borderRadius: 8,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    categoryGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    categoryButton: {
        flex: 1,
        minWidth: '45%',
        backgroundColor: '#FFF',
        borderWidth: 1,
        borderColor: '#E0E0E0',
        borderRadius: 8,
        alignItems: 'center',
    },
    categoryButtonActive: {
        backgroundColor: '#2D2D2D',
        borderColor: '#2D2D2D',
    },
    categoryText: {
        color: '#666',
    },
    categoryTextActive: {
        color: '#FFF',
        fontWeight: '600',
    },
    submitButton: {
        backgroundColor: '#2D2D2D',
        borderRadius: 8,
        alignItems: 'center',
    },
    submitButtonText: {
        color: '#FFF',
        fontWeight: '600',
    },
    note: {
        color: '#666',
        textAlign: 'center',
        fontStyle: 'italic',
    },
});
