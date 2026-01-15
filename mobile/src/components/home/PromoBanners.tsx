import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ImageBackground } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

export interface PromoBanner {
    id: string;
    badge?: string;
    title: string;
    subtitle?: string;
    image: string;
    ctaText?: string;
    onPress?: () => void;
}

interface PromoBannersProps {
    banners: PromoBanner[];
    onBannerPress?: (banner: PromoBanner) => void;
}

export const PromoBanners: React.FC<PromoBannersProps> = ({ banners, onBannerPress }) => {
    if (banners.length === 0) return null;

    return (
        <View style={styles.container}>
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
                snapToInterval={316} // 300 + 16 gap
                decelerationRate="fast"
            >
                {banners.map((banner) => (
                    <TouchableOpacity
                        key={banner.id}
                        style={styles.banner}
                        onPress={() => {
                            if (banner.onPress) {
                                banner.onPress();
                            } else if (onBannerPress) {
                                onBannerPress(banner);
                            }
                        }}
                        activeOpacity={0.9}
                    >
                        <ImageBackground source={{ uri: banner.image }} style={styles.bannerImage} imageStyle={styles.bannerImageStyle}>
                            <LinearGradient
                                colors={['rgba(0,0,0,0.7)', 'rgba(0,0,0,0.3)', 'transparent']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={styles.gradient}
                            >
                                {banner.badge && (
                                    <Text style={styles.badge}>{banner.badge.toUpperCase()}</Text>
                                )}
                                <Text style={styles.title}>{banner.title}</Text>
                                {banner.subtitle && (
                                    <Text style={styles.subtitle}>{banner.subtitle}</Text>
                                )}
                                <View style={styles.ctaButton}>
                                    <Text style={styles.ctaText}>{banner.ctaText || 'Réserver'}</Text>
                                </View>
                            </LinearGradient>
                        </ImageBackground>
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: 32,
    },
    scrollContent: {
        paddingHorizontal: 24,
        gap: 16,
    },
    banner: {
        width: 300,
        height: 160,
        borderRadius: 24,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 4,
    },
    bannerImage: {
        width: '100%',
        height: '100%',
    },
    bannerImageStyle: {
        borderRadius: 24,
    },
    gradient: {
        flex: 1,
        justifyContent: 'center',
        paddingLeft: 24,
        paddingRight: 80,
    },
    badge: {
        fontSize: 10,
        fontWeight: '600',
        color: 'rgba(255,255,255,0.8)',
        letterSpacing: 1,
        marginBottom: 4,
    },
    title: {
        fontSize: 24,
        fontWeight: '700',
        color: '#FFFFFF',
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 28,
        fontWeight: '700',
        color: '#FF6B6B',
        marginBottom: 12,
    },
    ctaButton: {
        alignSelf: 'flex-start',
        backgroundColor: '#FF6B6B',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 999,
    },
    ctaText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#FFFFFF',
    },
});
