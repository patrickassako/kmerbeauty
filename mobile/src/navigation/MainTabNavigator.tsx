import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { HomeStackNavigator } from './HomeStackNavigator';
import { ServiceScreen } from '../screens/main/ServiceScreen';
import { SalonScreen } from '../screens/main/SalonScreen';
import { BookingsScreen } from '../screens/main/BookingsScreen';
import { ProfileScreen } from '../screens/main/ProfileScreen';
import EditProfileScreen from '../screens/main/EditProfileScreen';
import BecomeProviderScreen from '../screens/main/BecomeProviderScreen';
import { ConversationsScreen } from '../screens/main/ConversationsScreen';
import { ChatScreen } from '../screens/main/ChatScreen';
import { BookingDetailsScreen } from '../screens/main/BookingDetailsScreen';
import { SupportScreen } from '../screens/support/SupportScreen';
import { NewTicketScreen } from '../screens/support/NewTicketScreen';
import { SupportChatScreen } from '../screens/support/SupportChatScreen';
import {
  MarketplaceBrowseScreen,
  ProductDetailsScreen,
  CheckoutScreen,
  ClientOrdersScreen,
  ProductChatScreen,
} from '../screens/marketplace';
import { NotificationSettingsScreen } from '../screens/settings/NotificationSettingsScreen';
import { useNotifications } from '../hooks/useNotifications';

export type MainTabParamList = {
  Home: undefined;
  Service: undefined;
  Market: undefined;
  Bookings: undefined;
  Conversations: undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();
const ChatStack = createNativeStackNavigator();
const MarketStack = createNativeStackNavigator();

// Chat Stack Navigator
const ChatStackNavigator = () => (
  <ChatStack.Navigator screenOptions={{ headerShown: false }}>
    <ChatStack.Screen name="ConversationsList" component={ConversationsScreen} />
    <ChatStack.Screen name="ConversationDetails" component={ChatScreen} />
    <ChatStack.Screen name="BookingDetails" component={BookingDetailsScreen} />
  </ChatStack.Navigator>
);

// Marketplace Stack Navigator
const MarketStackNavigator = () => (
  <MarketStack.Navigator screenOptions={{ headerShown: false }}>
    <MarketStack.Screen name="MarketplaceBrowse" component={MarketplaceBrowseScreen} />
    <MarketStack.Screen name="ProductDetails" component={ProductDetailsScreen} />
    <MarketStack.Screen name="Checkout" component={CheckoutScreen} />
    <MarketStack.Screen name="ClientOrders" component={ClientOrdersScreen} />
    <MarketStack.Screen name="ProductChat" component={ProductChatScreen} />
  </MarketStack.Navigator>
);

// Profile Stack Navigator
const ProfileStack = createNativeStackNavigator();

const ProfileStackNavigator = () => (
  <ProfileStack.Navigator screenOptions={{ headerShown: false }}>
    <ProfileStack.Screen name="ProfileMain" component={ProfileScreen} />
    <ProfileStack.Screen name="EditProfile" component={EditProfileScreen} />
    <ProfileStack.Screen name="BecomeProvider" component={BecomeProviderScreen} />
    <ProfileStack.Screen name="Settings" component={ProfileScreen} />
    <ProfileStack.Screen name="Notifications" component={NotificationSettingsScreen} />
    <ProfileStack.Screen name="Support" component={SupportScreen} />
    <ProfileStack.Screen name="NewTicket" component={NewTicketScreen} />
    <ProfileStack.Screen name="SupportChat" component={SupportChatScreen} />
  </ProfileStack.Navigator>
);

export const MainTabNavigator: React.FC = () => {
  // Initialize push notifications for client users
  useNotifications();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#2D2D2D',
        tabBarInactiveTintColor: '#999',
        tabBarStyle: {
          borderTopWidth: 1,
          borderTopColor: '#F0F0F0',
          paddingTop: 8,
          paddingBottom: 8,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeStackNavigator}
        options={{
          tabBarLabel: 'HOME',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Service"
        component={ServiceScreen}
        options={{
          tabBarLabel: 'SERVICE',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="list-outline" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Market"
        component={MarketStackNavigator}
        options={{
          tabBarLabel: 'MARKET',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="cart-outline" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Bookings"
        component={BookingsScreen}
        options={{
          tabBarLabel: 'BOOKINGS',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="calendar-outline" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Conversations"
        component={ChatStackNavigator}
        options={{
          tabBarLabel: 'CHAT',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="chatbubble-outline" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileStackNavigator}
        options={{
          tabBarLabel: 'PROFILE',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};
