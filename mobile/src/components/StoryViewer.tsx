import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
    Image,
    Dimensions,
    Animated,
    StatusBar,
    TouchableWithoutFeedback,
    SafeAreaView,
} from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { type Story, storiesApi } from '../services/api';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const STORY_DURATION = 5000; // 5 seconds for images

interface StoryViewerProps {
    stories: Story[];
    initialIndex?: number;
    visible: boolean;
    onClose: () => void;
    onStoryViewed: (storyId: string) => void;
    onBookPress?: (story: Story) => void;
}

export const StoryViewer: React.FC<StoryViewerProps> = ({
    stories,
    initialIndex = 0,
    visible,
    onClose,
    onStoryViewed,
    onBookPress,
}) => {
    const [currentIndex, setCurrentIndex] = useState(initialIndex);
    const progressAnim = useRef(new Animated.Value(0)).current;
    const animationRef = useRef<Animated.CompositeAnimation | null>(null);
    const isMounted = useRef(true);

    const currentStory = stories[currentIndex];

    // Go to next story
    const goToNext = useCallback(() => {
        if (currentIndex < stories.length - 1) {
            setCurrentIndex(prev => prev + 1);
        } else {
            onClose();
        }
    }, [currentIndex, stories.length, onClose]);

    // Go to previous story
    const goToPrev = useCallback(() => {
        if (currentIndex > 0) {
            setCurrentIndex(prev => prev - 1);
        }
    }, [currentIndex]);

    // Start progress animation
    const startProgress = useCallback((duration: number = STORY_DURATION) => {
        // Stop any existing animation
        if (animationRef.current) {
            animationRef.current.stop();
        }

        progressAnim.setValue(0);

        animationRef.current = Animated.timing(progressAnim, {
            toValue: 1,
            duration,
            useNativeDriver: false,
        });

        animationRef.current.start(({ finished }) => {
            if (finished && isMounted.current) {
                // Go to next or close
                if (currentIndex < stories.length - 1) {
                    setCurrentIndex(prev => prev + 1);
                } else {
                    onClose();
                }
            }
        });
    }, [progressAnim, currentIndex, stories.length, onClose]);

    // Handle tap on left/right side
    const handleTap = useCallback((event: any) => {
        const x = event.nativeEvent.locationX;

        if (x < SCREEN_WIDTH / 3) {
            goToPrev();
        } else if (x > (SCREEN_WIDTH * 2) / 3) {
            goToNext();
        }
    }, [goToPrev, goToNext]);

    // Mark story as viewed and start progress when story changes
    useEffect(() => {
        if (visible && currentStory) {
            onStoryViewed(currentStory.id);

            // Stop previous animation
            if (animationRef.current) {
                animationRef.current.stop();
            }
            progressAnim.setValue(0);

            // Start new animation
            animationRef.current = Animated.timing(progressAnim, {
                toValue: 1,
                duration: STORY_DURATION,
                useNativeDriver: false,
            });

            animationRef.current.start(({ finished }) => {
                if (finished && isMounted.current && visible) {
                    if (currentIndex < stories.length - 1) {
                        setCurrentIndex(prev => prev + 1);
                    } else {
                        onClose();
                    }
                }
            });
        }

        return () => {
            if (animationRef.current) {
                animationRef.current.stop();
            }
        };
    }, [visible, currentIndex]);

    // Reset index when modal opens
    useEffect(() => {
        if (visible) {
            setCurrentIndex(initialIndex);
        }
    }, [visible, initialIndex]);

    // Track mounted state
    useEffect(() => {
        isMounted.current = true;
        return () => {
            isMounted.current = false;
        };
    }, []);

    // Local state for likes to update UI immediately
    const [isLiked, setIsLiked] = useState(false);
    const [likeCount, setLikeCount] = useState(0);

    // Update local state when story changes
    useEffect(() => {
        if (currentStory) {
            setIsLiked(!!currentStory.isLiked);
            setLikeCount(currentStory.likeCount || 0);
        }
    }, [currentStory]);

    const handleLike = async () => {
        if (!currentStory) return;

        const newIsLiked = !isLiked;
        const newCount = newIsLiked ? likeCount + 1 : Math.max(0, likeCount - 1);

        // Optimistic update
        setIsLiked(newIsLiked);
        setLikeCount(newCount);

        try {
            if (newIsLiked) {
                await storiesApi.like(currentStory.id);
            } else {
                await storiesApi.unlike(currentStory.id);
            }
        } catch (error) {
            // Revert on error
            setIsLiked(!newIsLiked);
            setLikeCount(likeCount);
            console.error('Error toggling like:', error);
        }
    };

    if (!currentStory) return null;

    return (
        <Modal
            visible={visible}
            transparent={false}
            animationType="fade"
            onRequestClose={onClose}
        >
            <StatusBar barStyle="light-content" />
            <View style={styles.container}>
                {/* Story Content */}
                <TouchableWithoutFeedback onPress={handleTap}>
                    <View style={styles.storyContainer}>
                        {currentStory.mediaType === 'IMAGE' && currentStory.mediaUrl ? (
                            <Image
                                source={{ uri: currentStory.mediaUrl }}
                                style={styles.storyImage}
                                resizeMode="cover"
                            />
                        ) : currentStory.mediaType === 'VIDEO' && currentStory.mediaUrl ? (
                            <Video
                                source={{ uri: currentStory.mediaUrl }}
                                style={styles.storyVideo}
                                resizeMode={ResizeMode.COVER}
                                shouldPlay
                                isLooping={false}
                                onPlaybackStatusUpdate={(status) => {
                                    if (status.isLoaded && status.durationMillis) {
                                        // Restart progress with video duration
                                        if (animationRef.current) {
                                            animationRef.current.stop();
                                        }
                                        startProgress(status.durationMillis);
                                    }
                                }}
                            />
                        ) : currentStory.mediaType === 'TEXT' ? (
                            <View style={[
                                styles.textStoryContainer,
                                { backgroundColor: currentStory.backgroundColor || '#000000' }
                            ]}>
                                <Text style={[
                                    styles.textStoryContent,
                                    { color: currentStory.textColor || '#FFFFFF' }
                                ]}>
                                    {currentStory.textContent || currentStory.caption}
                                </Text>
                            </View>
                        ) : null}

                        {/* Gradient Overlay Top */}
                        <LinearGradient
                            colors={['rgba(0,0,0,0.6)', 'transparent']}
                            style={styles.gradientTop}
                        />

                        {/* Gradient Overlay Bottom */}
                        <LinearGradient
                            colors={['transparent', 'rgba(0,0,0,0.6)']}
                            style={styles.gradientBottom}
                        />
                    </View>
                </TouchableWithoutFeedback>

                {/* Header */}
                <SafeAreaView style={styles.header}>
                    {/* Progress Bars */}
                    <View style={styles.progressContainer}>
                        {stories.map((_, index) => (
                            <View key={index} style={styles.progressBarBackground}>
                                <Animated.View
                                    style={[
                                        styles.progressBar,
                                        {
                                            width:
                                                index < currentIndex
                                                    ? '100%'
                                                    : index === currentIndex
                                                        ? progressAnim.interpolate({
                                                            inputRange: [0, 1],
                                                            outputRange: ['0%', '100%'],
                                                        })
                                                        : '0%',
                                        },
                                    ]}
                                />
                            </View>
                        ))}
                    </View>

                    {/* Provider Info */}
                    <View style={styles.providerRow}>
                        <View style={styles.providerInfo}>
                            {currentStory.provider?.image ? (
                                <Image
                                    source={{ uri: currentStory.provider.image }}
                                    style={styles.providerAvatar}
                                />
                            ) : (
                                <View style={[styles.providerAvatar, styles.avatarPlaceholder]}>
                                    <Ionicons name="person" size={16} color="#FFF" />
                                </View>
                            )}
                            <View>
                                <Text style={styles.providerName}>
                                    {currentStory.provider?.name || 'Provider'}
                                </Text>
                                <Text style={styles.storyTime}>
                                    {getTimeAgo(currentStory.createdAt)}
                                </Text>
                            </View>
                        </View>
                        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                            <Ionicons name="close" size={28} color="#FFF" />
                        </TouchableOpacity>
                    </View>
                </SafeAreaView>

                {/* Right Side Stats (Likes & Views) */}
                <SafeAreaView style={[
                    styles.statsContainer,
                    onBookPress ? { bottom: 110 } : undefined
                ]}>
                    {/* Views */}
                    <View style={styles.statItem}>
                        <Ionicons name="eye" size={28} color="#FFF" />
                        <Text style={styles.statText}>{currentStory.viewCount || 0}</Text>
                    </View>

                    {/* Like Button */}
                    <TouchableOpacity onPress={handleLike} style={styles.statItem}>
                        <Ionicons
                            name={isLiked ? "heart" : "heart-outline"}
                            size={28}
                            color={isLiked ? "#FF4444" : "#FFF"}
                        />
                        <Text style={styles.statText}>{likeCount}</Text>
                    </TouchableOpacity>
                </SafeAreaView>

                {/* Caption */}
                {currentStory.caption && (
                    <View style={styles.captionContainer}>
                        <Text style={styles.caption}>{currentStory.caption}</Text>
                    </View>
                )}

                {/* CTA Button */}
                {onBookPress && (
                    <SafeAreaView style={styles.footer}>
                        <TouchableOpacity
                            style={styles.bookButton}
                            onPress={() => onBookPress(currentStory)}
                        >
                            <Text style={styles.bookButtonText}>RÉSERVER</Text>
                            <Ionicons name="arrow-forward" size={18} color="#FFF" />
                        </TouchableOpacity>
                    </SafeAreaView>
                )}
            </View>
        </Modal>
    );
};

// Helper function
const getTimeAgo = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);

    if (diffMins < 60) {
        return `Il y a ${diffMins}m`;
    } else {
        return `Il y a ${diffHours}h`;
    }
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    storyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    storyImage: {
        width: SCREEN_WIDTH,
        height: SCREEN_HEIGHT,
    },
    storyVideo: {
        width: SCREEN_WIDTH,
        height: SCREEN_HEIGHT,
    },
    textStoryContainer: {
        width: SCREEN_WIDTH,
        height: SCREEN_HEIGHT,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 32,
    },
    textStoryContent: {
        fontSize: 28,
        fontWeight: '700',
        textAlign: 'center',
        lineHeight: 40,
    },
    gradientTop: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 150,
    },
    gradientBottom: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 200,
    },
    header: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        paddingTop: 8,
        paddingHorizontal: 20,
    },
    progressContainer: {
        flexDirection: 'row',
        gap: 4,
        marginBottom: 12,
    },
    progressBarBackground: {
        flex: 1,
        height: 2,
        backgroundColor: 'rgba(255,255,255,0.3)',
        borderRadius: 1,
        overflow: 'hidden',
    },
    progressBar: {
        height: '100%',
        backgroundColor: '#FFF',
        borderRadius: 1,
    },
    providerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    providerInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    providerAvatar: {
        width: 36,
        height: 36,
        borderRadius: 18,
        borderWidth: 2,
        borderColor: '#FF6B6B',
    },
    avatarPlaceholder: {
        backgroundColor: '#333',
        justifyContent: 'center',
        alignItems: 'center',
    },
    providerName: {
        fontSize: 14,
        fontWeight: '600',
        color: '#FFF',
    },
    storyTime: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.7)',
    },
    closeButton: {
        padding: 4,
    },
    captionContainer: {
        position: 'absolute',
        bottom: 120,
        left: 16,
        right: 16,
    },
    caption: {
        fontSize: 16,
        color: '#FFF',
        textShadowColor: 'rgba(0,0,0,0.5)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 4,
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        paddingHorizontal: 24,
        paddingBottom: 24,
    },
    bookButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FF6B6B',
        paddingVertical: 14,
        borderRadius: 12,
        gap: 8,
    },
    bookButtonText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#FFF',
    },
    statsContainer: {
        position: 'absolute',
        bottom: 40,
        right: 16,
        alignItems: 'center',
        gap: 20,
    },
    statItem: {
        alignItems: 'center',
        gap: 4,
    },
    statText: {
        color: '#FFF',
        fontSize: 12,
        fontWeight: '600',
        textShadowColor: 'rgba(0,0,0,0.5)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 4,
    },
});

export default StoryViewer;
