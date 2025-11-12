import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { useResponsive } from '../../hooks/useResponsive';

export const SalonScreen: React.FC = () => {
  const { normalizeFontSize, spacing } = useResponsive();

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingHorizontal: spacing(2.5), paddingTop: spacing(6), paddingBottom: spacing(2) }]}>
        <Text style={[styles.title, { fontSize: normalizeFontSize(20) }]}>Salons</Text>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={[styles.contentContainer, { paddingHorizontal: spacing(2.5), paddingTop: spacing(3) }]}
      >
        <Text style={[styles.comingSoon, { fontSize: normalizeFontSize(16) }]}>
          🔜 Salons screen coming soon...
        </Text>
        <Text style={[styles.description, { fontSize: normalizeFontSize(14), marginTop: spacing(2) }]}>
          Here you'll be able to browse all beauty salons and institutes
        </Text>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  title: {
    fontWeight: '700',
    color: '#2D2D2D',
  },
  content: {
    flex: 1,
  },
  contentContainer: {},
  comingSoon: {
    color: '#2D2D2D',
    fontWeight: '600',
    textAlign: 'center',
  },
  description: {
    color: '#666',
    textAlign: 'center',
  },
});
