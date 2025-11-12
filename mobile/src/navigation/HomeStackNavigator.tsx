import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { HomeScreen } from '../screens/main/HomeScreen';
import { ProviderDetailsScreen } from '../screens/main/ProviderDetailsScreen';

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

export type HomeStackParamList = {
  HomeMain: undefined;
  ProviderDetails: {
    provider: Provider;
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
    </Stack.Navigator>
  );
};
