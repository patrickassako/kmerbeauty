import React, { useState, useCallback } from 'react';
import { View, TextInput, StyleSheet, TouchableOpacity, FlatList, Text, Keyboard } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface SearchResult {
    id: string;
    name: string;
    category?: string;
}

interface HomeSearchBarProps {
    onSearch: (query: string) => void;
    onFilterPress: () => void;
    onResultPress: (result: SearchResult) => void;
    searchResults?: SearchResult[];
    placeholder?: string;
    loading?: boolean;
}

export const HomeSearchBar: React.FC<HomeSearchBarProps> = ({
    onSearch,
    onFilterPress,
    onResultPress,
    searchResults = [],
    placeholder = 'Rechercher un service...',
    loading = false,
}) => {
    const [query, setQuery] = useState('');
    const [isFocused, setIsFocused] = useState(false);

    const handleChangeText = useCallback((text: string) => {
        setQuery(text);
        onSearch(text);
    }, [onSearch]);

    const handleResultPress = (result: SearchResult) => {
        setQuery('');
        setIsFocused(false);
        Keyboard.dismiss();
        onResultPress(result);
    };

    const showResults = isFocused && query.length > 0 && searchResults.length > 0;

    return (
        <View style={styles.wrapper}>
            <View style={styles.container}>
                <View style={[styles.searchBar, isFocused && styles.searchBarFocused]}>
                    <Ionicons name="search" size={20} color={isFocused ? '#FF6B6B' : '#9C9C9C'} style={styles.searchIcon} />
                    <TextInput
                        style={styles.input}
                        placeholder={placeholder}
                        placeholderTextColor="#9C9C9C"
                        value={query}
                        onChangeText={handleChangeText}
                        onFocus={() => setIsFocused(true)}
                        onBlur={() => setTimeout(() => setIsFocused(false), 200)}
                        returnKeyType="search"
                        autoCorrect={false}
                        autoCapitalize="none"
                    />
                    {query.length > 0 && (
                        <TouchableOpacity
                            onPress={() => {
                                setQuery('');
                                onSearch('');
                            }}
                            style={styles.clearButton}
                        >
                            <Ionicons name="close-circle" size={18} color="#9C9C9C" />
                        </TouchableOpacity>
                    )}
                    <TouchableOpacity style={styles.filterButton} onPress={onFilterPress}>
                        <Ionicons name="options" size={18} color="#FFFFFF" />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Search Results Dropdown */}
            {showResults && (
                <View style={styles.resultsContainer}>
                    {loading ? (
                        <View style={styles.loadingContainer}>
                            <Text style={styles.loadingText}>Recherche...</Text>
                        </View>
                    ) : (
                        <FlatList
                            data={searchResults.slice(0, 5)}
                            keyExtractor={(item) => item.id}
                            keyboardShouldPersistTaps="handled"
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={styles.resultItem}
                                    onPress={() => handleResultPress(item)}
                                >
                                    <Ionicons name="search-outline" size={16} color="#666" />
                                    <View style={styles.resultTextContainer}>
                                        <Text style={styles.resultName}>{item.name}</Text>
                                        {item.category && (
                                            <Text style={styles.resultCategory}>{item.category}</Text>
                                        )}
                                    </View>
                                    <Ionicons name="arrow-forward" size={16} color="#FF6B6B" />
                                </TouchableOpacity>
                            )}
                        />
                    )}
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    wrapper: {
        position: 'relative',
        zIndex: 100,
    },
    container: {
        paddingHorizontal: 24,
        marginBottom: 24,
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        paddingLeft: 16,
        paddingRight: 8,
        paddingVertical: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
        elevation: 2,
        borderWidth: 2,
        borderColor: 'transparent',
    },
    searchBarFocused: {
        borderColor: '#FF6B6B',
        shadowOpacity: 0.08,
    },
    searchIcon: {
        marginRight: 12,
    },
    input: {
        flex: 1,
        fontSize: 14,
        color: '#1A1A1A',
        paddingVertical: 10,
    },
    clearButton: {
        padding: 4,
        marginRight: 8,
    },
    filterButton: {
        backgroundColor: '#1A1A1A',
        padding: 10,
        borderRadius: 8,
    },
    resultsContainer: {
        position: 'absolute',
        top: 56,
        left: 24,
        right: 24,
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 4,
        maxHeight: 250,
        zIndex: 101,
    },
    loadingContainer: {
        padding: 16,
        alignItems: 'center',
    },
    loadingText: {
        fontSize: 14,
        color: '#666',
    },
    resultItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    resultTextContainer: {
        flex: 1,
        marginLeft: 12,
    },
    resultName: {
        fontSize: 14,
        fontWeight: '500',
        color: '#1A1A1A',
    },
    resultCategory: {
        fontSize: 12,
        color: '#9C9C9C',
        marginTop: 2,
    },
});
