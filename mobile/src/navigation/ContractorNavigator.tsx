import React, { useState, useEffect } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, Text, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { API_URL } from '../config/constants';
import {
  ContractorDashboardScreen,
  ContractorProposalsScreen,
  ContractorProfileEditScreen,
  ContractorAvailabilityScreen,
  ContractorServicesScreen,
  ContractorPackagesScreen,
  ContractorStoriesScreen,
  ContractorAppointmentsScreen,
  ContractorEarningsScreen,
  AppointmentDetailsScreen,

  ProposalDetailsScreen,
  ContractorMenuScreen,
  ContractorSettingsScreen,
} from '../screens/contractor';
import { TermsScreen } from '../screens/common/TermsScreen';
import { NotificationSettingsScreen } from '../screens/settings/NotificationSettingsScreen';
import {
  ContractorProductsScreen,
  ProductFormScreen,
  ContractorSalesScreen,
  ContractorMarketplaceScreen,
  MarketplaceBrowseScreen,
  ProductDetailsScreen,
  CheckoutScreen,
  ClientOrdersScreen,
  ProductChatScreen,
  ContractorMessagesScreen,
} from '../screens/marketplace';
import { ChatScreen } from '../screens/main/ChatScreen';
import { ConversationsScreen } from '../screens/main/ConversationsScreen';
import { PurchaseCreditsScreen } from '../screens/credits/PurchaseCreditsScreen';
import { PaymentVerificationScreen } from '../screens/credits/PaymentVerificationScreen';
import { useNotifications } from '../hooks/useNotifications';

// Stack navigators for each tab
const HomeStack = createNativeStackNavigator();
const ProposalStack = createNativeStackNavigator();
const ChatStack = createNativeStackNavigator();
const MarketplaceStack = createNativeStackNavigator();
const MoreStack = createNativeStackNavigator();

// Home Stack
const HomeStackNavigator = () => (
  <HomeStack.Navigator screenOptions={{ headerShown: false }}>
    <HomeStack.Screen name="ContractorDashboard" component={ContractorDashboardScreen} />
    <HomeStack.Screen name="ContractorEarnings" component={ContractorEarningsScreen} />
    <HomeStack.Screen name="ContractorProfileEdit" component={ContractorProfileEditScreen} />
    <HomeStack.Screen name="ContractorServices" component={ContractorServicesScreen} />
    <HomeStack.Screen name="ContractorPackages" component={ContractorPackagesScreen} />
    <HomeStack.Screen name="ContractorStories" component={ContractorStoriesScreen} />
    <HomeStack.Screen name="ContractorAvailability" component={ContractorAvailabilityScreen} />
    <HomeStack.Screen name="PurchaseCredits" component={PurchaseCreditsScreen} />
    <HomeStack.Screen name="PaymentVerification" component={PaymentVerificationScreen} />
  </HomeStack.Navigator>
);

// Proposal Stack
const ProposalStackNavigator = () => (
  <ProposalStack.Navigator screenOptions={{ headerShown: false }}>
    <ProposalStack.Screen name="ContractorProposalsList" component={ContractorProposalsScreen} />
    <ProposalStack.Screen name="ProposalDetails" component={ProposalDetailsScreen} />
    <ProposalStack.Screen name="ConversationDetails" component={ChatScreen} />
  </ProposalStack.Navigator>
);

// Chat Stack
const ChatStackNavigator = () => (
  <ChatStack.Navigator screenOptions={{ headerShown: false }}>
    <ChatStack.Screen name="ConversationsList" component={ConversationsScreen} />
    <ChatStack.Screen name="ConversationDetails" component={ChatScreen} />
  </ChatStack.Navigator>
);

// Marketplace Stack
const MarketplaceStackNavigator = () => (
  <MarketplaceStack.Navigator screenOptions={{ headerShown: false }}>
    <MarketplaceStack.Screen name="ContractorMarketplace" component={ContractorMarketplaceScreen} />
    <MarketplaceStack.Screen name="ContractorMessages" component={ContractorMessagesScreen} />
    <MarketplaceStack.Screen name="MarketplaceBrowse" component={MarketplaceBrowseScreen} />
    <MarketplaceStack.Screen name="ProductDetails" component={ProductDetailsScreen} />
    <MarketplaceStack.Screen name="Checkout" component={CheckoutScreen} />
    <MarketplaceStack.Screen name="ClientOrders" component={ClientOrdersScreen} />
    <MarketplaceStack.Screen name="ProductChat" component={ProductChatScreen} />
    <MarketplaceStack.Screen name="ContractorProducts" component={ContractorProductsScreen} />
    <MarketplaceStack.Screen name="ProductForm" component={ProductFormScreen} />
    <MarketplaceStack.Screen name="ContractorSales" component={ContractorSalesScreen} />
  </MarketplaceStack.Navigator>
);

// More Stack (Settings, Profile, etc.)
const MoreStackNavigator = () => (
  <MoreStack.Navigator screenOptions={{ headerShown: false }}>
    <MoreStack.Screen name="ContractorMenu" component={ContractorMenuScreen} />
    <MoreStack.Screen name="ContractorAvailability" component={ContractorAvailabilityScreen} />
    <MoreStack.Screen name="ContractorServices" component={ContractorServicesScreen} />
    <MoreStack.Screen name="ContractorPackages" component={ContractorPackagesScreen} />
    <MoreStack.Screen name="ContractorStories" component={ContractorStoriesScreen} />
    <MoreStack.Screen name="ContractorProfile" component={ContractorProfileEditScreen} />
    <MoreStack.Screen name="ContractorSettings" component={ContractorSettingsScreen} />
    <MoreStack.Screen name="NotificationSettings" component={NotificationSettingsScreen} />
    <MoreStack.Screen name="Terms" component={TermsScreen} />
    <MoreStack.Screen name="ContractorProducts" component={ContractorProductsScreen} />
    <MoreStack.Screen name="ProductForm" component={ProductFormScreen} />
    <MoreStack.Screen name="ContractorSales" component={ContractorSalesScreen} />
  </MoreStack.Navigator>
);

const MenuButton = ({ title, onPress }: { title: string; onPress: () => void }) => (
  <Text style={styles.menuButton} onPress={onPress}>
    {title} →
  </Text>
);

// Bottom Tab Navigator
const Tab = createBottomTabNavigator();

const ContractorTabNavigator = () => {
  // Initialize push notifications for provider users
  useNotifications();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: '#2D2D2D',
        tabBarInactiveTintColor: '#999',
        tabBarStyle: {
          height: 80,
          paddingBottom: 10,
          paddingTop: 10,
          borderTopWidth: 1,
          borderTopColor: '#E0E0E0',
        },
        tabBarLabelStyle: {
          fontSize: 12,
        },
        tabBarIcon: ({ focused, color }) => {
          let iconText = '';

          if (route.name === 'Home') {
            iconText = '🏠';
          } else if (route.name === 'Proposal') {
            iconText = '📋';
          } else if (route.name === 'Chat') {
            iconText = '💬';
          } else if (route.name === 'Marketplace') {
            iconText = '🛍️';
          } else if (route.name === 'More') {
            iconText = '☰';
          }

          return <Text style={{ fontSize: 24 }}>{iconText}</Text>;
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeStackNavigator} options={{ tabBarLabel: 'HOME' }} />
      <Tab.Screen
        name="Proposal"
        component={ProposalStackNavigator}
        options={{ tabBarLabel: 'BOOKING' }}
      />
      <Tab.Screen name="Chat" component={ChatStackNavigator} options={{ tabBarLabel: 'CHAT' }} />
      <Tab.Screen
        name="Marketplace"
        component={MarketplaceStackNavigator}
        options={{ tabBarLabel: 'MARKET' }}
      />
      <Tab.Screen name="More" component={MoreStackNavigator} options={{ tabBarLabel: 'MORE' }} />
    </Tab.Navigator>
  );
};

// Setup Stack for new contractors
const SetupStack = createNativeStackNavigator();

const SetupNavigator = ({ onServiceAdded }: { onServiceAdded: () => void }) => (
  <SetupStack.Navigator screenOptions={{ headerShown: false }}>
    <SetupStack.Screen
      name="ContractorProfileEdit"
      component={ContractorProfileEditScreen}
      initialParams={{ isSetupFlow: true }}
    />
    <SetupStack.Screen name="ContractorServices">
      {(props) => <ContractorServicesScreen {...props} onServiceAdded={onServiceAdded} hideHeader={true} />}
    </SetupStack.Screen>
  </SetupStack.Navigator>
);

// Wrapper to check if contractor has services
export const ContractorNavigator = () => {
  const { user, signOut } = useAuth();
  const [hasServices, setHasServices] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkServices();
  }, [user]);

  const checkServices = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_URL}/contractors/has-services/${user.id}`);
      const data = await response.json();
      setHasServices(data.hasServices);
    } catch (error) {
      console.error('Error checking services:', error);
      // On error, assume they have services to not block access
      setHasServices(true);
    } finally {
      setLoading(false);
    }
  };

  // Callback to refresh services check after adding a service
  const onServiceAdded = () => {
    setHasServices(true);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2D2D2D" />
      </View>
    );
  }

  // If contractor has no services, show setup flow starting with Profile Edit
  if (hasServices === false) {
    return <SetupNavigator onServiceAdded={onServiceAdded} />;
  }

  // Otherwise, show the normal tab navigator
  return <ContractorTabNavigator />;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9F9F9',
    padding: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  menuList: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 10,
  },
  menuButton: {
    padding: 15,
    fontSize: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  noServicesHeader: {
    backgroundColor: '#2D2D2D',
    paddingTop: 50,
    paddingBottom: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  noServicesTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  noServicesDescription: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 15,
    lineHeight: 18,
  },
  noServicesActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  noServicesActionButton: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 8,
    overflow: 'hidden',
  },
  logoutButton: {
    backgroundColor: '#FF6B6B',
  },
});
