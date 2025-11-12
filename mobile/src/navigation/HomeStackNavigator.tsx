import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { HomeScreen } from '../screens/main/HomeScreen';
import { ProviderDetailsScreen } from '../screens/main/ProviderDetailsScreen';
import { SalonDetailsScreen } from '../screens/main/SalonDetailsScreen';
import { ServiceDetailsScreen } from '../screens/main/ServiceDetailsScreen';
import { ServiceProvidersScreen } from '../screens/main/ServiceProvidersScreen';
import type { Service, ServicePackage, Therapist, Salon } from '../types/database.types';

// Type simplifié pour la navigation (avec les données essentielles)
export type ServiceWithProviders = Service & {
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
  ServiceProviders: {
    service: ServiceWithProviders;
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
  Chat: {
    providerId: string;
    providerType: 'therapist' | 'salon';
    bookingId?: string;
  };
  BookingManagement: undefined;
};

const Stack = createNativeStackNavigator<HomeStackParamList>();

// Placeholder screens (à créer)
const PackageProvidersScreen = () => null;
const PackageDetailsScreenPlaceholder = () => null;
const ChatScreen = () => null;
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
      <Stack.Screen name="ServiceProviders" component={ServiceProvidersScreen} />
      <Stack.Screen name="PackageProviders" component={PackageProvidersScreen} />
      <Stack.Screen name="ProviderDetails" component={ProviderDetailsScreen} />
      <Stack.Screen name="SalonDetails" component={SalonDetailsScreen} />
      <Stack.Screen name="ServiceDetails" component={ServiceDetailsScreen} />
      <Stack.Screen name="PackageDetails" component={PackageDetailsScreenPlaceholder} />
      <Stack.Screen name="Chat" component={ChatScreen} />
      <Stack.Screen name="BookingManagement" component={BookingManagementScreen} />
    </Stack.Navigator>
  );
};
