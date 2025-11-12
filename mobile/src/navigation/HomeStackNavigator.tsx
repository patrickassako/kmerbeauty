import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { HomeScreen } from '../screens/main/HomeScreen';
import { ProviderDetailsScreen } from '../screens/main/ProviderDetailsScreen';
import { SalonDetailsScreen } from '../screens/main/SalonDetailsScreen';
import { ServiceDetailsScreen } from '../screens/main/ServiceDetailsScreen';

export type Provider = {
  id: string;
  name: string;
  category: string;
  distance?: string;
  rating: string;
  reviews: string;
  salon?: string;
  licensed?: boolean;
  experience?: string;
  bio?: string;
  image?: string;
};

export type Salon = {
  id: string;
  name: string;
  description: string;
  address: string;
  city: string;
  region: string;
  latitude: number;
  longitude: number;
  rating: string;
  reviews: string;
  images?: string[];
  openingHours?: string;
  features?: string[];
};

export type Service = {
  id: string;
  name: string;
  description: string;
  category: string;
  duration: number; // en minutes
  price: number; // en XAF/XOF
  images?: string[];
  components?: string[]; // étapes du service
  idealFor?: string;
  provider?: {
    id: string;
    name: string;
    rating: string;
  };
  salon?: {
    id: string;
    name: string;
    rating: string;
  };
};

export type HomeStackParamList = {
  HomeMain: undefined;
  ProviderDetails: {
    provider: Provider;
  };
  SalonDetails: {
    salon: Salon;
  };
  ServiceDetails: {
    service: Service;
  };
};

const Stack = createNativeStackNavigator<HomeStackParamList>();

export const HomeStackNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="HomeMain" component={HomeScreen} />
      <Stack.Screen name="ProviderDetails" component={ProviderDetailsScreen} />
      <Stack.Screen name="SalonDetails" component={SalonDetailsScreen} />
      <Stack.Screen name="ServiceDetails" component={ServiceDetailsScreen} />
    </Stack.Navigator>
  );
};
