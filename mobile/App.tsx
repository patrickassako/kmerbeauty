import React from 'react';
import { StatusBar } from 'react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { I18nProvider } from './src/i18n/I18nContext';
import { AuthProvider } from './src/contexts/AuthContext';
import { GeolocationProvider } from './src/contexts/GeolocationContext';
import { WalkthroughProvider } from './src/contexts/WalkthroughContext';
import { AppNavigator } from './src/navigation/AppNavigator';

import { ToastProvider } from './src/contexts/ToastContext';
import { PostHogProvider } from 'posthog-react-native';
import { POSTHOG_API_KEY, POSTHOG_HOST } from './src/services/posthog';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 1000 * 60 * 5, // 5 minutes
    },
  },
});

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <PostHogProvider
          apiKey={POSTHOG_API_KEY}
          options={{
            host: POSTHOG_HOST,
          }}
        >
          <QueryClientProvider client={queryClient}>
            <I18nProvider>
              <ToastProvider>
                <AuthProvider>
                  <GeolocationProvider>
                    <WalkthroughProvider>
                      <StatusBar barStyle="light-content" />
                      <AppNavigator />
                    </WalkthroughProvider>
                  </GeolocationProvider>
                </AuthProvider>
              </ToastProvider>
            </I18nProvider>
          </QueryClientProvider>
        </PostHogProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

