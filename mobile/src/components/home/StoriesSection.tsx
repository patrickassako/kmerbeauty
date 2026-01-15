import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export interface Story {
    id: string;
    name: string;
    image: string;
    viewed: boolean;
}

interface StoriesSectionProps {
    stories: Story[];
    onStoryPress: (story: Story) => void;
    onAddStoryPress?: () => void;
}

export const StoriesSection: React.FC<StoriesSectionProps> = ({
    stories,
    onStoryPress,
    onAddStoryPress,
}) => {
    return (
        <View style={styles.container}>
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {/* Add Story Button */}
                {onAddStoryPress && (
                    <TouchableOpacity style={styles.storyItem} onPress={onAddStoryPress}>
                        <View style={[styles.storyCircle, styles.addStoryCircle]}>
                            <Ionicons name="add" size={24} color="#9C9C9C" />
                        </View>
                        <Text style={styles.storyName}>Ajouter</Text>
                    </TouchableOpacity>
                )}

                {/* Stories */}
                {stories.map((story) => (
                    <TouchableOpacity
                        key={story.id}
                        style={styles.storyItem}
                        onPress={() => onStoryPress(story)}
                    >
                        <View style={[styles.storyCircle, story.viewed && styles.storyCircleViewed]}>
                            <Image source={{ uri: story.image }} style={styles.storyImage} />
                        </View>
                        <Text style={styles.storyName} numberOfLines={1}>
                            {story.name}
                        </Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: 24,
    },
    scrollContent: {
        paddingHorizontal: 24,
        gap: 20,
    },
    storyItem: {
        alignItems: 'center',
        width: 64,
    },
    storyCircle: {
        width: 64,
        height: 64,
        borderRadius: 32,
        borderWidth: 2,
        borderColor: '#FF6B6B',
        padding: 2,
        marginBottom: 6,
    },
    storyCircleViewed: {
        borderColor: '#D0D0D0',
    },
    addStoryCircle: {
        borderStyle: 'dashed',
        borderColor: '#D0D0D0',
        backgroundColor: '#F5F5F5',
        justifyContent: 'center',
        alignItems: 'center',
    },
    storyImage: {
        width: '100%',
        height: '100%',
        borderRadius: 28,
        backgroundColor: '#F0F0F0',
    },
    storyName: {
        fontSize: 10,
        fontWeight: '500',
        color: '#1A1A1A',
        textAlign: 'center',
    },
});
