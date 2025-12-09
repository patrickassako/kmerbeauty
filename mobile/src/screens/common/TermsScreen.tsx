import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useResponsive } from '../../hooks/useResponsive';

export const TermsScreen = () => {
    const { normalizeFontSize, spacing } = useResponsive();
    const navigation = useNavigation();

    return (
        <View style={styles.container}>
            <View style={[styles.header, { padding: spacing(2), paddingTop: spacing(6) }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: spacing(1) }}>
                    <Text style={{ fontSize: normalizeFontSize(24), color: '#2D2D2D' }}>←</Text>
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { fontSize: normalizeFontSize(20) }]}>Conditions d'Utilisation</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView style={[styles.content, { padding: spacing(3) }]}>
                <Text style={[styles.title, { fontSize: normalizeFontSize(18), marginBottom: spacing(2) }]}>
                    Conditions Générales d'Utilisation (CGU)
                </Text>

                <View style={styles.section}>
                    <Text style={styles.paragraph}>
                        Bienvenue sur KMR-BEAUTY. En utilisant notre application, vous acceptez les conditions suivantes :
                    </Text>
                </View>
                <Text style={[styles.subtitle, { fontSize: normalizeFontSize(16), marginBottom: spacing(1) }]}>
                    1. Acceptation des conditions
                </Text>
                <Text style={[styles.paragraph, { fontSize: normalizeFontSize(14), marginBottom: spacing(2) }]}>
                    L'accès et l'utilisation de l'application sont soumis à l'acceptation et au respect des présentes Conditions Générales d'Utilisation.
                </Text>

                <Text style={[styles.subtitle, { fontSize: normalizeFontSize(16), marginBottom: spacing(1) }]}>
                    2. Services proposés
                </Text>
                <Text style={[styles.paragraph, { fontSize: normalizeFontSize(14), marginBottom: spacing(2) }]}>
                    L'application permet la mise en relation entre des prestataires de services (coiffure, beauté, etc.) et des clients.
                </Text>

                <Text style={[styles.subtitle, { fontSize: normalizeFontSize(16), marginBottom: spacing(1) }]}>
                    3. Responsabilités
                </Text>
                <Text style={[styles.paragraph, { fontSize: normalizeFontSize(14), marginBottom: spacing(2) }]}>
                    Nous ne sommes pas responsables de la qualité des prestations fournies par les prestataires, ni des paiements effectués en dehors de la plateforme.
                </Text>

                <Text style={[styles.subtitle, { fontSize: normalizeFontSize(16), marginBottom: spacing(1) }]}>
                    4. Données personnelles
                </Text>
                <Text style={[styles.paragraph, { fontSize: normalizeFontSize(14), marginBottom: spacing(2) }]}>
                    Vos données sont collectées et traitées conformément à notre politique de confidentialité. Vous disposez d'un droit d'accès, de modification et de suppression de vos données.
                </Text>

                <Text style={[styles.subtitle, { fontSize: normalizeFontSize(16), marginBottom: spacing(1) }]}>
                    5. Suppression de compte
                </Text>
                <Text style={[styles.paragraph, { fontSize: normalizeFontSize(14), marginBottom: spacing(4) }]}>
                    Vous pouvez à tout moment supprimer votre compte via les paramètres de l'application. Cette action est irréversible.
                </Text>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFF',
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
    title: {
        fontWeight: 'bold',
        color: '#2D2D2D',
    },
    subtitle: {
        fontWeight: '600',
        color: '#2D2D2D',
        marginTop: 10,
    },
    paragraph: {
        color: '#444',
        lineHeight: 22,
    },
});
