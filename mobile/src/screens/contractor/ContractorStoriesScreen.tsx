import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    FlatList,
    Image,
    Alert,
    ActivityIndicator,
    Modal,
    TextInput,
    ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { Video } from 'expo-av';
import { useAuth } from '../../contexts/AuthContext';
import { useI18n } from '../../i18n/I18nContext';
import { storiesApi, contractorApi, Story, StoryMediaType } from '../../services/api';

const COLORS = ['#FF5733', '#33FF57', '#3357FF', '#F1C40F', '#8E44AD', '#2D2D2D', '#000000', '#E91E63'];

export const ContractorStoriesScreen = () => {
    const navigation = useNavigation();
    const { user } = useAuth();
    const { language } = useI18n();

    const [loading, setLoading] = useState(true);
    const [stories, setStories] = useState<Story[]>([]);

    // Modal State
    const [showAddModal, setShowAddModal] = useState(false);
    const [activeTab, setActiveTab] = useState<StoryMediaType>(StoryMediaType.IMAGE);
    const [uploading, setUploading] = useState(false);

    // Form State
    const [selectedMedia, setSelectedMedia] = useState<string | null>(null); // Uri for Image/Video
    const [caption, setCaption] = useState('');
    const [textContent, setTextContent] = useState('');
    const [selectedColor, setSelectedColor] = useState(COLORS[5]); // Default dark gray

    useEffect(() => {
        loadStories();
    }, []);

    const loadStories = async () => {
        try {
            setLoading(true);
            const myStories = await storiesApi.getMine();
            setStories(myStories);
        } catch (error) {
            console.error('Error loading stories:', error);
            Alert.alert('Error', language === 'fr' ? 'Impossible de charger les stories' : 'Failed to load stories');
        } finally {
            setLoading(false);
        }
    };

    const pickMedia = async (type: 'image' | 'video') => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: type === 'image' ? ImagePicker.MediaTypeOptions.Images : ImagePicker.MediaTypeOptions.Videos,
            allowsEditing: true,
            aspect: [9, 16],
            quality: 0.8,
            videoMaxDuration: 30, // Limit video length
        });

        if (!result.canceled) {
            setSelectedMedia(result.assets[0].uri);
        }
    };

    const handlePublish = async () => {
        if (!user) return;
        if (activeTab !== StoryMediaType.TEXT && !selectedMedia) return;
        if (activeTab === StoryMediaType.TEXT && !textContent) return;

        try {
            setUploading(true);
            let mediaUrl;

            // 1. Upload if needed
            if (activeTab !== StoryMediaType.TEXT && selectedMedia) {
                const type = activeTab === StoryMediaType.VIDEO ? 'video' : 'story'; // 'story' implies image in backend currently or specific bucket
                // Helper to determine file type suffix/mime logic if strictly needed by backend, 
                // but contractorApi.uploadFile usually handles general 'image' or 'video' type strings
                // For this implementation we'll pass 'story' for images and 'video' for videos to match backend expectations if any specific logic exists
                // or just use generic types. Let's use 'story' for image stories and 'video' for video stories.
                const uploadType = activeTab === StoryMediaType.VIDEO ? 'video' : 'story';
                const uploadResp = await contractorApi.uploadFile(selectedMedia, user.id, uploadType);
                mediaUrl = uploadResp.url;
            }

            // 2. Create Story DTO
            const dto: any = {
                mediaType: activeTab,
                caption: caption,
            };

            if (activeTab === StoryMediaType.TEXT) {
                dto.textContent = textContent;
                dto.backgroundColor = selectedColor;
            } else {
                dto.mediaUrl = mediaUrl;
            }

            await storiesApi.create(dto);

            setShowAddModal(false);
            resetForm();
            loadStories();
            Alert.alert('Success', language === 'fr' ? 'Story publiée !' : 'Story published!');
        } catch (error) {
            console.error('Error uploading story:', error);
            Alert.alert('Error', language === 'fr' ? 'Échec de la publication' : 'Failed to publish');
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (storyId: string) => {
        Alert.alert(
            language === 'fr' ? 'Supprimer' : 'Delete',
            language === 'fr' ? 'Supprimer cette story ?' : 'Delete this story?',
            [
                { text: language === 'fr' ? 'Annuler' : 'Cancel', style: 'cancel' },
                {
                    text: language === 'fr' ? 'Supprimer' : 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await storiesApi.delete(storyId);
                            loadStories();
                        } catch (error) {
                            console.error('Error deleting story:', error);
                            Alert.alert('Error', 'Failed to delete');
                        }
                    }
                }
            ]
        );
    };

    const resetForm = () => {
        setSelectedMedia(null);
        setCaption('');
        setTextContent('');
        setSelectedColor(COLORS[5]);
        setActiveTab(StoryMediaType.IMAGE);
    };

    const renderStoryItem = ({ item }: { item: Story }) => (
        <View style={[styles.storyCard, item.mediaType === StoryMediaType.TEXT && { backgroundColor: item.backgroundColor || '#2D2D2D' }]}>
            {item.mediaType === StoryMediaType.IMAGE && item.mediaUrl && (
                <Image source={{ uri: item.mediaUrl }} style={styles.storyImage} resizeMode="cover" />
            )}

            {item.mediaType === StoryMediaType.VIDEO && item.mediaUrl && (
                <View style={styles.videoPlaceholder}>
                    {/* Placeholder for video thumbnail, ideally backend generates one */}
                    <Text style={{ fontSize: 40 }}>🎥</Text>
                    {/* Or use <Video /> component muted and paused if needed, but heavy for list */}
                </View>
            )}

            {item.mediaType === StoryMediaType.TEXT && (
                <View style={styles.textStoryContent}>
                    <Text style={styles.textStoryText} numberOfLines={5}>
                        {item.textContent}
                    </Text>
                </View>
            )}

            <View style={styles.storyOverlay}>
                <Text style={styles.viewCount}>👁 {item.viewCount}</Text>
                <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => handleDelete(item.id)}
                >
                    <Text style={styles.deleteButtonText}>🗑</Text>
                </TouchableOpacity>
            </View>
            {item.caption && item.mediaType !== StoryMediaType.TEXT && (
                <View style={styles.captionContainer}>
                    <Text style={styles.captionText} numberOfLines={1}>{item.caption}</Text>
                </View>
            )}
        </View>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Text style={styles.backIcon}>←</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>
                    {language === 'fr' ? 'Mes Stories' : 'My Stories'}
                </Text>
                <View style={{ width: 40 }} />
            </View>

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color="#2D2D2D" />
                </View>
            ) : (
                <FlatList
                    data={stories}
                    renderItem={renderStoryItem}
                    keyExtractor={(item) => item.id}
                    numColumns={2}
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={
                        <View style={styles.emptyState}>
                            <Text style={styles.emptyText}>
                                {language === 'fr' ? 'Aucune story active' : 'No active stories'}
                            </Text>
                        </View>
                    }
                />
            )}

            {/* FAB */}
            <TouchableOpacity
                style={styles.fab}
                onPress={() => setShowAddModal(true)}
            >
                <Text style={styles.fabText}>+</Text>
            </TouchableOpacity>

            {/* Add Modal */}
            <Modal visible={showAddModal} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>
                                {language === 'fr' ? 'Nouvelle Story' : 'New Story'}
                            </Text>
                            <TouchableOpacity onPress={() => { setShowAddModal(false); resetForm(); }}>
                                <Text style={styles.closeIcon}>✕</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Tabs */}
                        <View style={styles.tabsContainer}>
                            <TouchableOpacity
                                style={[styles.tab, activeTab === StoryMediaType.IMAGE && styles.activeTab]}
                                onPress={() => { setActiveTab(StoryMediaType.IMAGE); setSelectedMedia(null); }}
                            >
                                <Text style={[styles.tabText, activeTab === StoryMediaType.IMAGE && styles.activeTabText]}>Image</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.tab, activeTab === StoryMediaType.VIDEO && styles.activeTab]}
                                onPress={() => { setActiveTab(StoryMediaType.VIDEO); setSelectedMedia(null); }}
                            >
                                <Text style={[styles.tabText, activeTab === StoryMediaType.VIDEO && styles.activeTabText]}>Video</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.tab, activeTab === StoryMediaType.TEXT && styles.activeTab]}
                                onPress={() => { setActiveTab(StoryMediaType.TEXT); setSelectedMedia(null); }}
                            >
                                <Text style={[styles.tabText, activeTab === StoryMediaType.TEXT && styles.activeTabText]}>Text</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Content Area */}
                        <View style={styles.formContainer}>

                            {/* VIDEO / IMAGE PREVIEW OR PICKER */}
                            {(activeTab === StoryMediaType.IMAGE || activeTab === StoryMediaType.VIDEO) && (
                                <View>
                                    {selectedMedia ? (
                                        <View style={styles.previewContainer}>
                                            {activeTab === StoryMediaType.IMAGE ? (
                                                <Image source={{ uri: selectedMedia }} style={styles.previewImage} />
                                            ) : (
                                                <Video
                                                    source={{ uri: selectedMedia }}
                                                    style={styles.previewImage}
                                                    resizeMode="cover"
                                                    shouldPlay={true}
                                                    isLooping
                                                    isMuted
                                                />
                                            )}
                                            <TouchableOpacity
                                                style={styles.changeImageBtn}
                                                onPress={() => pickMedia(activeTab === StoryMediaType.IMAGE ? 'image' : 'video')}
                                            >
                                                <Text style={styles.changeImageText}>
                                                    {language === 'fr' ? 'Changer' : 'Change'}
                                                </Text>
                                            </TouchableOpacity>
                                        </View>
                                    ) : (
                                        <TouchableOpacity
                                            style={styles.uploadPlaceholder}
                                            onPress={() => pickMedia(activeTab === StoryMediaType.IMAGE ? 'image' : 'video')}
                                        >
                                            <Text style={styles.uploadIcon}>
                                                {activeTab === StoryMediaType.IMAGE ? '📷' : '🎥'}
                                            </Text>
                                            <Text style={styles.uploadText}>
                                                {activeTab === StoryMediaType.IMAGE
                                                    ? (language === 'fr' ? 'Sélectionner une photo' : 'Select Photo')
                                                    : (language === 'fr' ? 'Sélectionner une vidéo' : 'Select Video')
                                                }
                                            </Text>
                                        </TouchableOpacity>
                                    )}
                                    <TextInput
                                        style={styles.input}
                                        placeholder={language === 'fr' ? 'Légende (optionnel)' : 'Caption (optional)'}
                                        value={caption}
                                        onChangeText={setCaption}
                                        maxLength={100}
                                    />
                                </View>
                            )}

                            {/* TEXT EDITOR */}
                            {activeTab === StoryMediaType.TEXT && (
                                <View>
                                    <View style={[styles.textPreview, { backgroundColor: selectedColor }]}>
                                        <TextInput
                                            style={styles.textStoryInput}
                                            placeholder={language === 'fr' ? 'Tapez votre texte...' : 'Type your text...'}
                                            placeholderTextColor="rgba(255,255,255,0.6)"
                                            value={textContent}
                                            onChangeText={setTextContent}
                                            multiline
                                            maxLength={300}
                                        />
                                    </View>

                                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.colorPicker}>
                                        {COLORS.map(color => (
                                            <TouchableOpacity
                                                key={color}
                                                style={[
                                                    styles.colorCircle,
                                                    { backgroundColor: color },
                                                    selectedColor === color && styles.selectedColorCircle
                                                ]}
                                                onPress={() => setSelectedColor(color)}
                                            />
                                        ))}
                                    </ScrollView>
                                </View>
                            )}

                            <TouchableOpacity
                                style={[
                                    styles.publishButton,
                                    (
                                        uploading ||
                                        ((activeTab === StoryMediaType.IMAGE || activeTab === StoryMediaType.VIDEO) && !selectedMedia) ||
                                        (activeTab === StoryMediaType.TEXT && !textContent)
                                    ) && styles.disabledButton
                                ]}
                                onPress={handlePublish}
                                disabled={
                                    uploading ||
                                    ((activeTab === StoryMediaType.IMAGE || activeTab === StoryMediaType.VIDEO) && !selectedMedia) ||
                                    (activeTab === StoryMediaType.TEXT && !textContent)
                                }
                            >
                                {uploading ? (
                                    <ActivityIndicator color="#FFF" />
                                ) : (
                                    <Text style={styles.publishButtonText}>
                                        {language === 'fr' ? 'Publier' : 'Publish'}
                                    </Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FFF' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: 50,
        paddingHorizontal: 20,
        paddingBottom: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    headerTitle: { fontSize: 18, fontWeight: '700', color: '#2D2D2D' },
    backButton: { padding: 5 },
    backIcon: { fontSize: 24, color: '#2D2D2D' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    listContent: { padding: 10 },
    storyCard: {
        flex: 1,
        margin: 5,
        aspectRatio: 0.6,
        borderRadius: 12,
        backgroundColor: '#F0F0F0',
        overflow: 'hidden',
        position: 'relative',
        justifyContent: 'center',
        alignItems: 'center',
    },
    storyImage: { width: '100%', height: '100%' },
    videoPlaceholder: { width: '100%', height: '100%', backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' },
    textStoryContent: { width: '100%', height: '100%', padding: 15, justifyContent: 'center', alignItems: 'center' },
    textStoryText: { color: '#FFF', fontSize: 16, fontWeight: '600', textAlign: 'center' },

    storyOverlay: {
        position: 'absolute',
        top: 10,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 10,
    },
    viewCount: {
        color: '#FFF',
        fontSize: 12,
        fontWeight: 'bold',
        textShadowColor: 'rgba(0,0,0,0.5)',
        textShadowRadius: 4,
    },
    deleteButton: {
        backgroundColor: 'rgba(255,255,255,0.3)',
        borderRadius: 12,
        width: 24,
        height: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    deleteButtonText: { fontSize: 12 },
    captionContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        padding: 8,
    },
    captionText: { color: '#FFF', fontSize: 12 },
    emptyState: { padding: 40, alignItems: 'center' },
    emptyText: { color: '#999', fontSize: 16 },

    fab: {
        position: 'absolute',
        bottom: 30,
        right: 30,
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#2D2D2D',
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 3,
    },
    fabText: { color: '#FFF', fontSize: 32, marginTop: -4 },

    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#FFF',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 20,
        height: '85%', // Taller for more content
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    modalTitle: { fontSize: 20, fontWeight: '700' },
    closeIcon: { fontSize: 24, color: '#999' },

    tabsContainer: {
        flexDirection: 'row',
        backgroundColor: '#F5F5F5',
        borderRadius: 12,
        padding: 4,
        marginBottom: 20,
    },
    tab: {
        flex: 1,
        paddingVertical: 10,
        alignItems: 'center',
        borderRadius: 8,
    },
    activeTab: {
        backgroundColor: '#FFF',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    tabText: { fontWeight: '600', color: '#999' },
    activeTabText: { color: '#2D2D2D' },

    formContainer: { flex: 1 },

    uploadPlaceholder: {
        height: 250,
        backgroundColor: '#F9F9F9',
        borderWidth: 2,
        borderColor: '#E0E0E0',
        borderStyle: 'dashed',
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    uploadIcon: { fontSize: 40, marginBottom: 10 },
    uploadText: { color: '#666' },
    previewContainer: {
        height: 350,
        marginBottom: 20,
        alignItems: 'center',
    },
    previewImage: {
        width: '100%',
        height: '100%',
        borderRadius: 12,
        resizeMode: 'contain',
        backgroundColor: '#000',
    },
    changeImageBtn: {
        position: 'absolute',
        bottom: 10,
        right: 10,
        backgroundColor: 'rgba(0,0,0,0.6)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    changeImageText: { color: '#FFF', fontSize: 12, fontWeight: '600' },
    input: {
        backgroundColor: '#F9F9F9',
        padding: 15,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E0E0E0',
        marginBottom: 10,
    },

    textPreview: {
        height: 350,
        borderRadius: 12,
        padding: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    textStoryInput: {
        color: '#FFF',
        fontSize: 24,
        fontWeight: 'bold',
        textAlign: 'center',
        width: '100%',
        height: '100%',
    },
    colorPicker: {
        flexDirection: 'row',
        marginBottom: 20,
        maxHeight: 50,
    },
    colorCircle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginRight: 10,
        borderWidth: 2,
        borderColor: '#FFF',
    },
    selectedColorCircle: {
        borderColor: '#2D2D2D',
        borderWidth: 3,
    },

    publishButton: {
        backgroundColor: '#2D2D2D',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 10,
    },
    disabledButton: { backgroundColor: '#CCC' },
    publishButtonText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
});
