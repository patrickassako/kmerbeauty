import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useResponsive } from '../../hooks/useResponsive';

export const ContractorAppointmentsScreen = () => {
  const { normalizeFontSize, spacing } = useResponsive();
  const navigation = useNavigation<any>();

  return (
    <View style={styles.container}>
      <View style={[styles.header, { padding: spacing(2.5), paddingTop: spacing(6) }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={{ fontSize: normalizeFontSize(24) }}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { fontSize: normalizeFontSize(18) }]}>Appointments</Text>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={{ fontSize: normalizeFontSize(18) }}>✕</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.centered}>
        <Text style={{ fontSize: normalizeFontSize(16) }}>Appointments Management - Coming Soon</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9F9F9' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#FFF' },
  title: { fontWeight: 'bold' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});
