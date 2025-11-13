import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { HomeScreen } from '../screens/main/HomeScreen';
import { ProviderDetailsScreen } from '../screens/main/ProviderDetailsScreen';
import { SalonDetailsScreen } from '../screens/main/SalonDetailsScreen';
import { ServiceDetailsScreen } from '../screens/main/ServiceDetailsScreen';
import { ServiceProvidersScreen } from '../screens/main/ServiceProvidersScreen';
import { SearchResultsScreen } from '../screens/main/SearchResultsScreen';
import { BookingScreen } from '../screens/main/BookingScreen';
import { BookingDetailsScreen } from '../screens/main/BookingDetailsScreen';
import { ChatScreen } from '../screens/main/ChatScreen';
import type { Service, ServicePackage, Therapist, Salon } from '../types/database.types';
import type { SearchFilters } from '../components/AdvancedSearchModal';

// Type simplifié pour la navigation (avec les données essentielles)
export type PackageWithProviders = ServicePackage & {
  services: Service[];
  providers: Array<{
    type: 'therapist' | 'salon';
    id: string;
    name: string;
    rating: number;
    review_count: number;
    price: number;
    duration: number;
    distance?: number;
    city: string;
    region: string;
  }>;
};

export type HomeStackParamList = {
  HomeMain: undefined;
  SearchResults: {
    filters: SearchFilters;
  };
  ServiceProviders: {
    service: Service; // Changé de ServiceWithProviders à Service car l'écran charge les prestataires lui-même
    sortBy?: 'distance' | 'price';
  };
  PackageProviders: {
    package: PackageWithProviders;
    sortBy?: 'distance' | 'price';
  };
  ProviderDetails: {
    providerId: string;
    providerType: 'therapist' | 'salon';
  };
  SalonDetails: {
    salon: Salon;
  };
  ServiceDetails: {
    service: Service;
    providerId?: string;
    providerType?: 'therapist' | 'salon';
  };
  PackageDetails: {
    package: ServicePackage;
    providerId?: string;
    providerType?: 'therapist' | 'salon';
  };
  Booking: {
    service: Service;
    providerId?: string;
    providerType?: 'therapist' | 'salon';
    providerName?: string;
    providerPrice?: number;
  };
  BookingDetails: {
    bookingId: string;
  };
  Chat: {
    bookingId?: string; // Optional for direct chats
    providerId: string;
    providerName: string;
    providerType: 'therapist' | 'salon';
  };
  BookingManagement: undefined;
};

const Stack = createNativeStackNavigator<HomeStackParamList>();

// Placeholder screens (à créer)
const PackageProvidersScreen = () => null;
const PackageDetailsScreenPlaceholder = () => null;
const BookingManagementScreen = () => null;

export const HomeStackNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="HomeMain" component={HomeScreen} />
      <Stack.Screen name="SearchResults" component={SearchResultsScreen} />
      <Stack.Screen name="ServiceProviders" component={ServiceProvidersScreen} />
      <Stack.Screen name="PackageProviders" component={PackageProvidersScreen} />
      <Stack.Screen name="ProviderDetails" component={ProviderDetailsScreen} />
      <Stack.Screen name="SalonDetails" component={SalonDetailsScreen} />
      <Stack.Screen name="ServiceDetails" component={ServiceDetailsScreen} />
      <Stack.Screen name="PackageDetails" component={PackageDetailsScreenPlaceholder} />
      <Stack.Screen name="Booking" component={BookingScreen} />
      <Stack.Screen name="BookingDetails" component={BookingDetailsScreen} />
      <Stack.Screen name="Chat" component={ChatScreen} />
      <Stack.Screen name="BookingManagement" component={BookingManagementScreen} />
    </Stack.Navigator>
  );
};
