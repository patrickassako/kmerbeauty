import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export interface ServiceItem {
    id: string;
    name: string;
    icon: keyof typeof Ionicons.glyphMap;
    category: string;
}

interface ServicesGridProps {
    services: ServiceItem[];
    onServicePress: (service: ServiceItem) => void;
    title?: string;
    onSeeAllPress?: () => void;
}

export const ServicesGrid: React.FC<ServicesGridProps> = ({
    services,
    onServicePress,
    title = 'Services',
    onSeeAllPress,
}) => {
    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>{title}</Text>
                {onSeeAllPress && (
                    <TouchableOpacity onPress={onSeeAllPress}>
                        <Text style={styles.seeAll}>Voir tout</Text>
                    </TouchableOpacity>
                )}
            </View>

            <View style={styles.grid}>
                {services.map((service) => (
                    <TouchableOpacity
                        key={service.id}
                        style={styles.serviceItem}
                        onPress={() => onServicePress(service)}
                        activeOpacity={0.7}
                    >
                        <View style={styles.serviceCircle}>
                            <Ionicons name={service.icon} size={32} color="#FF6B6B" />
                        </View>
                        <Text style={styles.serviceName} numberOfLines={1}>
                            {service.name}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: 24,
        marginBottom: 32,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    title: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1A1A1A',
    },
    seeAll: {
        fontSize: 14,
        fontWeight: '500',
        color: '#FF6B6B',
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 16,
    },
    serviceItem: {
        width: '22%',
        alignItems: 'center',
    },
    serviceCircle: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#F0F0F0',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 1,
    },
    serviceName: {
        fontSize: 12,
        fontWeight: '500',
        color: '#666',
        textAlign: 'center',
    },
});
