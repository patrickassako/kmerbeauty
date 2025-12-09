import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Image,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    Dimensions,
    Modal,
    TouchableWithoutFeedback,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useResponsive } from '../../hooks/useResponsive';
import { marketplaceApi } from '../../services/api';
import { Ionicons } from '@expo/vector-icons';
import { Video, ResizeMode } from 'expo-av';

const { width, height } = Dimensions.get('window');

export const ProductDetailsScreen = () => {
    const { normalizeFontSize, spacing } = useResponsive();
    const navigation = useNavigation<any>();
    const route = useRoute<any>();
    const productId = route.params?.productId;

    const [product, setProduct] = useState<any>(null);
    const [comments, setComments] = useState<any[]>([]);
    const [reviews, setReviews] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [fullscreenVisible, setFullscreenVisible] = useState(false);
    const [fullscreenIndex, setFullscreenIndex] = useState(0);

    // Combine images and video into media array
    const mediaItems = product ? [
        ...(product.images || []).map((uri: string) => ({ type: 'image', uri })),
        ...(product.video_url ? [{ type: 'video', uri: product.video_url }] : []),
    ] : [];

    useEffect(() => {
        if (productId) {
            loadProduct();
            loadComments();
            loadReviews();
        }
    }, [productId]);

    const loadProduct = async () => {
        try {
            setLoading(true);
            const data = await marketplaceApi.getProductById(productId);
            setProduct(data);
        } catch (error) {
            Alert.alert('Erreur', 'Impossible de charger le produit');
            navigation.goBack();
        } finally {
            setLoading(false);
        }
    };

    const loadComments = async () => {
        try {
            const data = await marketplaceApi.getProductComments(productId);
            setComments(data);
        } catch (error) {
            console.error('Error loading comments:', error);
        }
    };

    const loadReviews = async () => {
        try {
            const data = await marketplaceApi.getProductReviews(productId);
            setReviews(data);
        } catch (error) {
            console.error('Error loading reviews:', error);
        }
    };

    const handleOrderNow = () => {
        if (!product || product.stock_quantity <= 0) {
            Alert.alert('Rupture de stock', 'Ce produit n\'est plus disponible');
            return;
        }
        navigation.navigate('Checkout', { product });
    };

    const handleContactSeller = () => {
        // Use the therapist's user_id, not the therapist id
        const sellerUserId = product.therapists?.user_id || product.seller_id;
        navigation.navigate('ProductChat', { productId, sellerId: sellerUserId });
    };

    if (loading) {
        return (
            <View style={[styles.container, styles.centered]}>
                <ActivityIndicator size="large" color="#2D2D2D" />
            </View>
        );
    }

    if (!product) {
        return null;
    }

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={[styles.header, { padding: spacing(2.5), paddingTop: spacing(6) }]}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color="#2D2D2D" />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { fontSize: normalizeFontSize(16) }]}>Détails</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView>
                {/* Media Carousel (Images + Video) */}
                {mediaItems.length > 0 && (
                    <View>
                        <ScrollView
                            horizontal
                            pagingEnabled
                            showsHorizontalScrollIndicator={false}
                            onMomentumScrollEnd={(e) => {
                                const index = Math.round(e.nativeEvent.contentOffset.x / width);
                                setCurrentImageIndex(index);
                            }}
                        >
                            {mediaItems.map((item: any, index: number) => (
                                <TouchableOpacity
                                    key={index}
                                    activeOpacity={0.9}
                                    onPress={() => {
                                        if (item.type === 'image') {
                                            setFullscreenIndex(index);
                                            setFullscreenVisible(true);
                                        }
                                    }}
                                >
                                    {item.type === 'image' ? (
                                        <Image
                                            source={{ uri: item.uri }}
                                            style={[styles.productImage, { width }]}
                                        />
                                    ) : (
                                        <Video
                                            source={{ uri: item.uri }}
                                            style={[styles.productImage, { width }]}
                                            useNativeControls
                                            resizeMode={ResizeMode.CONTAIN}
                                            shouldPlay={false}
                                        />
                                    )}
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                        {mediaItems.length > 1 && (
                            <View style={styles.pagination}>
                                {mediaItems.map((_: any, index: number) => (
                                    <View
                                        key={index}
                                        style={[
                                            styles.paginationDot,
                                            currentImageIndex === index && styles.paginationDotActive,
                                        ]}
                                    />
                                ))}
                            </View>
                        )}
                    </View>
                )}

                {/* Product Info */}
                <View style={[styles.infoSection, { padding: spacing(2.5) }]}>
                    <Text style={[styles.productName, { fontSize: normalizeFontSize(22) }]}>
                        {product.name}
                    </Text>

                    <View style={styles.metaRow}>
                        <Text style={[styles.viewCount, { fontSize: normalizeFontSize(13) }]}>
                            👁️ {product.views_count || 0} vues
                        </Text>
                        <Text style={[styles.stock, { fontSize: normalizeFontSize(13) }]}>
                            📦 {product.stock_quantity} en stock
                        </Text>
                    </View>

                    <Text style={[styles.price, { fontSize: normalizeFontSize(28) }]}>
                        {product.price.toLocaleString()} XAF
                    </Text>

                    {product.description && (
                        <View style={{ marginTop: spacing(2) }}>
                            <Text style={[styles.sectionTitle, { fontSize: normalizeFontSize(16) }]}>
                                Description
                            </Text>
                            <Text style={[styles.description, { fontSize: normalizeFontSize(14) }]}>
                                {product.description}
                            </Text>
                        </View>
                    )}

                    {product.city && (
                        <View style={{ marginTop: spacing(2) }}>
                            <Text style={[styles.sectionTitle, { fontSize: normalizeFontSize(16) }]}>
                                Localisation
                            </Text>
                            <Text style={[styles.location, { fontSize: normalizeFontSize(14) }]}>
                                📍 {product.city}
                            </Text>
                        </View>
                    )}
                </View>

                {/* Comments Section */}
                {comments.length > 0 && (
                    <View style={[styles.section, { padding: spacing(2.5) }]}>
                        <Text style={[styles.sectionTitle, { fontSize: normalizeFontSize(16) }]}>
                            Commentaires ({comments.length})
                        </Text>
                        {comments.slice(0, 3).map((comment) => (
                            <View key={comment.id} style={[styles.commentCard, { padding: spacing(1.5), marginTop: spacing(1) }]}>
                                <Text style={[styles.commentText, { fontSize: normalizeFontSize(13) }]}>
                                    {comment.comment_text}
                                </Text>
                            </View>
                        ))}
                    </View>
                )}

                {/* Reviews Section */}
                {reviews.length > 0 && (
                    <View style={[styles.section, { padding: spacing(2.5) }]}>
                        <Text style={[styles.sectionTitle, { fontSize: normalizeFontSize(16) }]}>
                            Avis ({reviews.length})
                        </Text>
                        {reviews.slice(0, 3).map((review) => (
                            <View key={review.id} style={[styles.reviewCard, { padding: spacing(1.5), marginTop: spacing(1) }]}>
                                <View style={styles.reviewHeader}>
                                    <Text style={[styles.rating, { fontSize: normalizeFontSize(14) }]}>
                                        {'⭐'.repeat(review.rating)}
                                    </Text>
                                </View>
                                {review.review_text && (
                                    <Text style={[styles.reviewText, { fontSize: normalizeFontSize(13) }]}>
                                        {review.review_text}
                                    </Text>
                                )}
                            </View>
                        ))}
                    </View>
                )}

                <View style={{ height: 100 }} />
            </ScrollView>

            {/* Fullscreen Image Modal */}
            <Modal
                visible={fullscreenVisible}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setFullscreenVisible(false)}
            >
                <View style={styles.fullscreenContainer}>
                    <TouchableOpacity
                        style={styles.closeButton}
                        onPress={() => setFullscreenVisible(false)}
                    >
                        <Ionicons name="close" size={32} color="#FFF" />
                    </TouchableOpacity>

                    <ScrollView
                        horizontal
                        pagingEnabled
                        showsHorizontalScrollIndicator={false}
                        contentOffset={{ x: fullscreenIndex * width, y: 0 }}
                    >
                        {mediaItems
                            .filter((item: any) => item.type === 'image')
                            .map((item: any, index: number) => (
                                <TouchableWithoutFeedback key={index}>
                                    <View style={{ width, height, justifyContent: 'center', alignItems: 'center' }}>
                                        <Image
                                            source={{ uri: item.uri }}
                                            style={styles.fullscreenImage}
                                            resizeMode="contain"
                                        />
                                    </View>
                                </TouchableWithoutFeedback>
                            ))}
                    </ScrollView>
                </View>
            </Modal>

            {/* Bottom Actions */}
            <View style={[styles.bottomBar, { padding: spacing(2) }]}>
                <TouchableOpacity
                    style={[styles.contactButton, { padding: spacing(1.5), marginRight: spacing(1) }]}
                    onPress={handleContactSeller}
                >
                    <Ionicons name="chatbubble-outline" size={20} color="#2D2D2D" />
                    <Text style={[styles.contactButtonText, { fontSize: normalizeFontSize(14) }]}>
                        Contacter
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.orderButton, { padding: spacing(1.5), flex: 1 }]}
                    onPress={handleOrderNow}
                    disabled={product.stock_quantity <= 0}
                >
                    <Text style={[styles.orderButtonText, { fontSize: normalizeFontSize(16) }]}>
                        {product.stock_quantity > 0 ? 'Commander' : 'Rupture de stock'}
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
    headerTitle: {
        fontWeight: 'bold',
        color: '#2D2D2D',
    },
    productImage: {
        height: 300,
        backgroundColor: '#E0E0E0',
    },
    pagination: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 12,
        backgroundColor: '#FFF',
    },
    paginationDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#CCC',
        marginHorizontal: 4,
    },
    paginationDotActive: {
        backgroundColor: '#2D2D2D',
        width: 24,
    },
    infoSection: {
        backgroundColor: '#FFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
    },
    productName: {
        fontWeight: 'bold',
        color: '#2D2D2D',
        marginBottom: 8,
    },
    metaRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    viewCount: {
        color: '#666',
    },
    stock: {
        color: '#666',
    },
    price: {
        color: '#4CAF50',
        fontWeight: 'bold',
        marginBottom: 8,
    },
    sectionTitle: {
        fontWeight: '600',
        color: '#2D2D2D',
        marginBottom: 8,
    },
    description: {
        color: '#666',
        lineHeight: 22,
    },
    location: {
        color: '#666',
    },
    section: {
        backgroundColor: '#FFF',
        marginTop: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
    },
    commentCard: {
        backgroundColor: '#F5F5F5',
        borderRadius: 8,
    },
    commentText: {
        color: '#666',
    },
    reviewCard: {
        backgroundColor: '#F5F5F5',
        borderRadius: 8,
    },
    reviewHeader: {
        marginBottom: 4,
    },
    rating: {
        color: '#FFB700',
    },
    reviewText: {
        color: '#666',
    },
    bottomBar: {
        flexDirection: 'row',
        backgroundColor: '#FFF',
        borderTopWidth: 1,
        borderTopColor: '#E0E0E0',
    },
    contactButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F5F5F5',
        borderRadius: 8,
        paddingHorizontal: 20,
    },
    contactButtonText: {
        color: '#2D2D2D',
        fontWeight: '600',
        marginLeft: 8,
    },
    orderButton: {
        backgroundColor: '#2D2D2D',
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    orderButtonText: {
        color: '#FFF',
        fontWeight: 'bold',
    },
    fullscreenContainer: {
        flex: 1,
        backgroundColor: '#000',
        justifyContent: 'center',
        alignItems: 'center',
    },
    closeButton: {
        position: 'absolute',
        top: 50,
        right: 20,
        zIndex: 10,
        backgroundColor: 'rgba(0,0,0,0.5)',
        borderRadius: 20,
        padding: 8,
    },
    fullscreenImage: {
        width: width,
        height: height,
    },
});
