import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface HomeHeaderProps {
    city: string | null;
    district: string | null;
    onLocationPress: () => void;
    onNotificationsPress: () => void;
    hasUnreadNotifications?: boolean;
}

export const HomeHeader: React.FC<HomeHeaderProps> = ({
    city,
    district,
    onLocationPress,
    onNotificationsPress,
    hasUnreadNotifications = false,
}) => {
    return (
        <View style={styles.header}>
            <View style={styles.leftSection}>
                {/* Logo */}
                <Image
                    source={require('../../../assets/logo-kmr.png')}
                    style={styles.logo}
                    resizeMode="contain"
                />

                {/* Location */}
                <View style={styles.locationContainer}>
                    <Text style={styles.locationLabel}>Localisation actuelle</Text>
                    <TouchableOpacity style={styles.locationButton} onPress={onLocationPress}>
                        <Ionicons name="location" size={16} color="#FF6B6B" />
                        <Text style={styles.locationText}>
                            {city ? `${city}${district ? `, ${district}` : ''}` : 'Douala, Akwa'}
                        </Text>
                        <Ionicons name="chevron-down" size={14} color="#666" />
                    </TouchableOpacity>
                </View>
            </View>

            <TouchableOpacity style={styles.notificationButton} onPress={onNotificationsPress}>
                <Ionicons name="notifications-outline" size={26} color="#1A1A1A" />
                {hasUnreadNotifications && <View style={styles.notificationBadge} />}
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingTop: 48,
        paddingBottom: 16,
        backgroundColor: '#F9F9F9',
    },
    leftSection: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    logo: {
        width: 40,
        height: 40,
        marginRight: 12,
    },
    locationContainer: {
        flex: 1,
    },
    locationLabel: {
        fontSize: 10,
        color: '#9C9C9C',
        fontWeight: '500',
        marginBottom: 2,
    },
    locationButton: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    locationText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#1A1A1A',
        marginLeft: 4,
        marginRight: 4,
    },
    notificationButton: {
        position: 'relative',
        padding: 8,
        borderRadius: 999,
    },
    notificationBadge: {
        position: 'absolute',
        top: 8,
        right: 10,
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#FF6B6B',
        borderWidth: 2,
        borderColor: '#F9F9F9',
    },
});
