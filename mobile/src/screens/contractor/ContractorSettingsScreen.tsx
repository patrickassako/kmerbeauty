import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Alert,
    Switch,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../contexts/AuthContext';
import { useResponsive } from '../../hooks/useResponsive';
import { authApi } from '../../services/api';

export const ContractorSettingsScreen = () => {
    const { normalizeFontSize, spacing } = useResponsive();
    const { signOut } = useAuth();
    const navigation = useNavigation<any>();

    const [notificationsEnabled, setNotificationsEnabled] = useState(true);
    const [language, setLanguage] = useState('Français');

    const handleDeleteAccount = () => {
        Alert.alert(
            'Supprimer le compte',
            'Êtes-vous sûr de vouloir supprimer définitivement votre compte ? Cette action est irréversible et toutes vos données seront perdues.',
            [
                { text: 'Annuler', style: 'cancel' },
                {
                    text: 'Supprimer',
                    style: 'destructive',
                    onPress: confirmDelete,
                },
            ]
        );
    };

    const confirmDelete = async () => {
        try {
            await authApi.deleteAccount();
            Alert.alert('Compte supprimé', 'Votre compte a été supprimé avec succès.');
            await signOut();
        } catch (error: any) {
            console.error('Error deleting account:', error);
            Alert.alert('Erreur', error.message || 'Impossible de supprimer le compte.');
        }
    };

    const SettingItem = ({ title, value, onPress, type = 'arrow' }: any) => (
        <TouchableOpacity
            style={[styles.item, { padding: spacing(2) }]}
            onPress={onPress}
            disabled={type === 'switch'}
        >
            <Text style={[styles.itemTitle, { fontSize: normalizeFontSize(16) }]}>{title}</Text>
            <View style={styles.itemRight}>
                {type === 'text' && (
                    <Text style={[styles.itemValue, { fontSize: normalizeFontSize(14) }]}>{value}</Text>
                )}
                {type === 'arrow' && (
                    <Text style={{ fontSize: normalizeFontSize(16), color: '#CCC' }}>→</Text>
                )}
                {type === 'switch' && (
                    <Switch
                        value={value}
                        onValueChange={onPress}
                        trackColor={{ false: '#767577', true: '#2D2D2D' }}
                        thumbColor={value ? '#FFF' : '#f4f3f4'}
                    />
                )}
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <View style={[styles.header, { padding: spacing(2), paddingTop: spacing(6) }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: spacing(1) }}>
                    <Text style={{ fontSize: normalizeFontSize(24), color: '#2D2D2D' }}>←</Text>
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { fontSize: normalizeFontSize(20) }]}>Paramètres</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView style={styles.content}>
                <Text style={[styles.sectionTitle, { fontSize: normalizeFontSize(14), margin: spacing(2) }]}>
                    GÉNÉRAL
                </Text>
                <View style={styles.section}>
                    <SettingItem
                        title="Notifications"
                        value={notificationsEnabled}
                        type="switch"
                        onPress={() => setNotificationsEnabled(!notificationsEnabled)}
                    />
                    <SettingItem
                        title="Langue"
                        value={language}
                        type="text"
                        onPress={() => Alert.alert('Info', 'Le changement de langue arrive bientôt !')}
                    />
                </View>

                <Text style={[styles.sectionTitle, { fontSize: normalizeFontSize(14), margin: spacing(2) }]}>
                    LÉGAL
                </Text>
                <View style={styles.section}>
                    <SettingItem
                        title="Conditions Générales d'Utilisation"
                        onPress={() => navigation.navigate('Terms')}
                    />
                    <SettingItem
                        title="Politique de Confidentialité"
                        onPress={() => navigation.navigate('Terms')}
                    />
                </View>

                <View style={[styles.section, { marginTop: spacing(4) }]}>
                    <TouchableOpacity
                        style={[styles.deleteButton, { padding: spacing(2) }]}
                        onPress={handleDeleteAccount}
                    >
                        <Text style={[styles.deleteText, { fontSize: normalizeFontSize(16) }]}>
                            Supprimer mon compte
                        </Text>
                    </TouchableOpacity>
                </View>

                <Text style={[styles.version, { marginTop: spacing(4), fontSize: normalizeFontSize(12) }]}>
                    Version 1.0.0
                </Text>
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
        borderBottomColor: '#F0F0F0',
    },
    headerTitle: {
        fontWeight: 'bold',
        color: '#2D2D2D',
    },
    content: {
        flex: 1,
    },
    sectionTitle: {
        color: '#666',
        fontWeight: '600',
    },
    section: {
        backgroundColor: '#FFF',
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderColor: '#F0F0F0',
    },
    item: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#FFF',
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    itemTitle: {
        color: '#2D2D2D',
    },
    itemRight: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    itemValue: {
        color: '#999',
        marginRight: 10,
    },
    deleteButton: {
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FFF',
    },
    deleteText: {
        color: '#FF4444',
        fontWeight: '600',
    },
    version: {
        textAlign: 'center',
        color: '#999',
        marginBottom: 30,
    },
});
