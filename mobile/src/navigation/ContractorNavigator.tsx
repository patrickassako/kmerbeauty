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
  ContractorAppointmentsScreen,
  ContractorEarningsScreen,
  AppointmentDetailsScreen,
  ProposalDetailsScreen,
} from '../screens/contractor';
import { ChatScreen } from '../screens/main/ChatScreen';
import { ConversationsScreen } from '../screens/main/ConversationsScreen';

// Stack navigators for each tab
const HomeStack = createNativeStackNavigator();
const ProposalStack = createNativeStackNavigator();
const ChatStack = createNativeStackNavigator();
const CalendarStack = createNativeStackNavigator();
const MoreStack = createNativeStackNavigator();

// Home Stack
const HomeStackNavigator = () => (
  <HomeStack.Navigator screenOptions={{ headerShown: false }}>
    <HomeStack.Screen name="ContractorDashboard" component={ContractorDashboardScreen} />
    <HomeStack.Screen name="ContractorEarnings" component={ContractorEarningsScreen} />
    <HomeStack.Screen name="ContractorProfileEdit" component={ContractorProfileEditScreen} />
    <HomeStack.Screen name="ContractorServices" component={ContractorServicesScreen} />
  </HomeStack.Navigator>
);

// Proposal Stack
const ProposalStackNavigator = () => (
  <ProposalStack.Navigator screenOptions={{ headerShown: false }}>
    <ProposalStack.Screen name="ContractorProposalsList" component={ContractorProposalsScreen} />
    <ProposalStack.Screen name="ProposalDetails" component={ProposalDetailsScreen} />
  </ProposalStack.Navigator>
);

// Chat Stack
const ChatStackNavigator = () => (
  <ChatStack.Navigator screenOptions={{ headerShown: false }}>
    <ChatStack.Screen name="ConversationsList" component={ConversationsScreen} />
    <ChatStack.Screen name="Chat" component={ChatScreen} />
  </ChatStack.Navigator>
);

// Calendar Stack
const CalendarStackNavigator = () => (
  <CalendarStack.Navigator screenOptions={{ headerShown: false }}>
    <CalendarStack.Screen name="ContractorAppointmentsList" component={ContractorAppointmentsScreen} />
    <CalendarStack.Screen name="AppointmentDetails" component={AppointmentDetailsScreen} />
  </CalendarStack.Navigator>
);

// More Stack (Settings, Profile, etc.)
const MoreStackNavigator = () => (
  <MoreStack.Navigator screenOptions={{ headerShown: false }}>
    <MoreStack.Screen name="ContractorMore" component={ContractorMoreScreen} />
    <MoreStack.Screen name="ContractorAvailability" component={ContractorAvailabilityScreen} />
    <MoreStack.Screen name="ContractorServices" component={ContractorServicesScreen} />
    <MoreStack.Screen name="ContractorProfile" component={ContractorProfileEditScreen} />
  </MoreStack.Navigator>
);

// More Screen (placeholder)
const ContractorMoreScreen = ({ navigation }: any) => {
  const { signOut } = useAuth();

  const handleSignOut = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut();
            } catch (error) {
              console.error('Sign out error:', error);
              Alert.alert('Error', 'Failed to sign out. Please try again.');
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>More</Text>
      <View style={styles.menuList}>
        <MenuButton title="Profile" onPress={() => navigation.navigate('ContractorProfile')} />
        <MenuButton title="My Schedule" onPress={() => navigation.navigate('ContractorAvailability')} />
        <MenuButton title="My Services" onPress={() => navigation.navigate('ContractorServices')} />
        <MenuButton title="Settings" onPress={() => {}} />
        <MenuButton title="Logout" onPress={handleSignOut} />
      </View>
    </View>
  );
};

const MenuButton = ({ title, onPress }: { title: string; onPress: () => void }) => (
  <Text style={styles.menuButton} onPress={onPress}>
    {title} →
  </Text>
);

// Bottom Tab Navigator
const Tab = createBottomTabNavigator();

const ContractorTabNavigator = () => {
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
          } else if (route.name === 'Calendar') {
            iconText = '📅';
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
        options={{ tabBarLabel: 'PROPOSAL' }}
      />
      <Tab.Screen name="Chat" component={ChatStackNavigator} options={{ tabBarLabel: 'CHAT' }} />
      <Tab.Screen
        name="Calendar"
        component={CalendarStackNavigator}
        options={{ tabBarLabel: 'CALENDAR' }}
      />
      <Tab.Screen name="More" component={MoreStackNavigator} options={{ tabBarLabel: 'MORE' }} />
    </Tab.Navigator>
  );
};

// Wrapper to check if contractor has services
export const ContractorNavigator = () => {
  const { user } = useAuth();
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

  // If contractor has no services, show services screen
  if (hasServices === false) {
    return <ContractorServicesScreen onServiceAdded={onServiceAdded} />;
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
});
