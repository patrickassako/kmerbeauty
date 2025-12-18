import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as SecureStore from 'expo-secure-store';
import { SplashScreen } from '../screens/SplashScreen';
import { OnboardingScreen } from '../screens/OnboardingScreen';
import { SignUpScreen } from '../screens/SignUpScreen';
import { SignInScreen } from '../screens/SignInScreen';
import { ForgotPasswordScreen } from '../screens/ForgotPasswordScreen';
import { ResetPasswordScreen } from '../screens/ResetPasswordScreen';
import { VerificationScreen } from '../screens/VerificationScreen';
import { MainTabNavigator } from './MainTabNavigator';
import * as Linking from 'expo-linking';
import { ContractorNavigator } from './ContractorNavigator';
import { useAuth } from '../contexts/AuthContext';
import { View, ActivityIndicator, StyleSheet } from 'react-native';

export type AuthStackParamList = {
  Splash: undefined;
  Onboarding: undefined;
  SignUp: undefined;
  SignIn: undefined;
  ForgotPassword: undefined;
  ResetPassword: undefined;
  Verification: { phone: string };
};

const prefix = Linking.createURL('/');

const linking = {
  prefixes: [prefix, 'kmerservices://'],
  config: {
    screens: {
      ResetPassword: 'reset-password',
      SignIn: 'sign-in',
      SignUp: 'sign-up',
    },
  },
};

const Stack = createNativeStackNavigator<AuthStackParamList>();

export const AppNavigator: React.FC = () => {
  const { isAuthenticated, loading: authLoading, signUp, signIn, user, userMode } = useAuth();
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
    // Check if user is in provider mode
    const isProviderMode = userMode === 'provider';

    return (
      <NavigationContainer>
        {isProviderMode ? <ContractorNavigator /> : <MainTabNavigator />}
      </NavigationContainer>
    );
  }

  return (
    <NavigationContainer linking={linking}>
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
                  const result = await signUp(data);
                  if (result?.verificationRequired) {
                    // Only navigate to verification for phone signups
                    // Email verification is not implemented yet
                    if (result.authMethod === 'phone') {
                      props.navigation.navigate('Verification', {
                        phone: result.phone,
                        authMethod: 'phone'
                      });
                    } else {
                      // Email signup - show message that account was created
                      // User will need to login manually
                      alert('Compte créé ! Vous pouvez maintenant vous connecter avec votre email.');
                      props.navigation.navigate('SignIn');
                    }
                  }
                  // Navigation will happen automatically via auth state change if success (no verification needed)
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
              onForgotPassword={() => props.navigation.navigate('ForgotPassword')}
            />
          )}
        </Stack.Screen>

        <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
        <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
        <Stack.Screen name="Verification" component={VerificationScreen} />
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
