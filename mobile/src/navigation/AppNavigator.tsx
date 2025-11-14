import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as SecureStore from 'expo-secure-store';
import { SplashScreen } from '../screens/SplashScreen';
import { OnboardingScreen } from '../screens/OnboardingScreen';
import { SignUpScreen } from '../screens/SignUpScreen';
import { SignInScreen } from '../screens/SignInScreen';
import { MainTabNavigator } from './MainTabNavigator';
import { ContractorNavigator } from './ContractorNavigator';
import { useAuth } from '../contexts/AuthContext';
import { View, ActivityIndicator, StyleSheet } from 'react-native';

export type AuthStackParamList = {
  Splash: undefined;
  Onboarding: undefined;
  SignUp: undefined;
  SignIn: undefined;
};

const Stack = createNativeStackNavigator<AuthStackParamList>();

export const AppNavigator: React.FC = () => {
  const { isAuthenticated, loading: authLoading, signUp, signIn, user } = useAuth();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    checkFirstLaunch();
  }, []);

  const checkFirstLaunch = async () => {
    try {
      const hasSeenOnboarding = await SecureStore.getItemAsync('hasSeenOnboarding');
      setShowOnboarding(!hasSeenOnboarding);
    } catch (error) {
      console.error('Error checking onboarding status:', error);
      setShowOnboarding(true);
    } finally {
      setInitializing(false);
    }
  };

  const handleOnboardingComplete = async () => {
    await SecureStore.setItemAsync('hasSeenOnboarding', 'true');
    setShowOnboarding(false);
  };

  if (initializing || authLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2D2D2D" />
      </View>
    );
  }

  // If user is authenticated, show main app
  if (isAuthenticated) {
    // Check if user is a contractor
    const isContractor = user?.role === 'CONTRACTOR';

    return (
      <NavigationContainer>
        {isContractor ? <ContractorNavigator /> : <MainTabNavigator />}
      </NavigationContainer>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName={showOnboarding ? 'Splash' : 'SignUp'}
        screenOptions={{
          headerShown: false,
          animation: 'fade',
        }}
      >
        {showOnboarding && (
          <>
            <Stack.Screen name="Splash">
              {(props) => (
                <SplashScreen
                  {...props}
                  onContinue={() => props.navigation.navigate('Onboarding')}
                />
              )}
            </Stack.Screen>
            <Stack.Screen name="Onboarding">
              {(props) => (
                <OnboardingScreen
                  {...props}
                  onComplete={() => {
                    handleOnboardingComplete();
                    props.navigation.replace('SignUp');
                  }}
                />
              )}
            </Stack.Screen>
          </>
        )}

        <Stack.Screen name="SignUp">
          {(props) => (
            <SignUpScreen
              {...props}
              onSignUp={async (data) => {
                try {
                  await signUp(data);
                  // Navigation will happen automatically via auth state change
                } catch (error: any) {
                  alert(error.message || 'Sign up failed');
                }
              }}
              onSignIn={() => props.navigation.navigate('SignIn')}
            />
          )}
        </Stack.Screen>

        <Stack.Screen name="SignIn">
          {(props) => (
            <SignInScreen
              {...props}
              onSignIn={async (data) => {
                try {
                  await signIn(data);
                  // Navigation will happen automatically via auth state change
                } catch (error: any) {
                  alert(error.message || 'Sign in failed');
                }
              }}
              onSignUp={() => props.navigation.navigate('SignUp')}
              onForgotPassword={() => {
                // TODO: Implement forgot password flow
                alert('Forgot password feature coming soon!');
              }}
            />
          )}
        </Stack.Screen>
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
});
