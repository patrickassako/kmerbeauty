import React from 'react';
import { SafeAreaView, ScrollView, View, Text, StyleSheet, StatusBar } from 'react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

// Create a client
const queryClient = new QueryClient();

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <SafeAreaView style={styles.container}>
          <StatusBar barStyle="dark-content" />
          <ScrollView style={styles.content}>
            <View style={styles.header}>
              <Text style={styles.title}>KMERSERVICES</Text>
              <Text style={styles.subtitle}>Services de Beauté à la Demande 🇨🇲</Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Bienvenue sur KmerServices</Text>
              <Text style={styles.bodyText}>
                Votre plateforme de services de beauté à domicile au Cameroun
              </Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.bodyText}>✅ Expo SDK 54</Text>
              <Text style={styles.bodyText}>✅ React 19.1.0</Text>
              <Text style={styles.bodyText}>✅ React Native 0.81.5</Text>
              <Text style={styles.bodyText}>✅ Supabase configuré</Text>
            </View>

            <View style={styles.footer}>
              <Text style={styles.caption}>KmerServices v1.0.0</Text>
              <Text style={styles.caption}>Cameroun 🇨🇲 | XAF</Text>
            </View>
          </ScrollView>
        </SafeAreaView>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
    padding: 24,
  },
  header: {
    marginBottom: 32,
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 12,
  },
  bodyText: {
    fontSize: 16,
    color: '#374151',
    lineHeight: 24,
    marginBottom: 8,
  },
  footer: {
    marginTop: 48,
    alignItems: 'center',
  },
  caption: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
    marginBottom: 4,
  },
});
