
import { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => {
    return {
        ...config,
        name: 'KMR-BEAUTY',
        slug: 'kmr-beauty',
        version: '1.0.0',
        orientation: 'portrait',
        icon: './assets/icon.png',
        userInterfaceStyle: 'light',
        splash: {
            image: './assets/splash.png',
            resizeMode: 'contain',
            backgroundColor: '#ffffff',
        },
        assetBundlePatterns: ['**/*'],
        ios: {
            supportsTablet: true,
            bundleIdentifier: 'com.kmrbeauty.app',
        },
        android: {
            adaptiveIcon: {
                foregroundImage: './assets/adaptive-icon.png',
                backgroundColor: '#ffffff',
            },
            package: 'com.kmrbeauty.app',
            intentFilters: [
                {
                    action: 'VIEW',
                    data: [
                        {
                            scheme: 'kmerservices',
                        },
                    ],
                    category: ['BROWSABLE', 'DEFAULT'],
                },
            ],
        },
        web: {
            favicon: './assets/favicon.png',
            description: 'La beauté à votre porte, ou à deux pas',
        },
        plugins: [
            "expo-font",
            "expo-secure-store",
            [
                "expo-location",
                {
                    locationAlwaysAndWhenInUsePermission: "Allow $(PRODUCT_NAME) to use your location.",
                },
            ],
            [
                'expo-notifications',
                {
                    color: '#ffffff',
                },
            ],
        ],
        extra: {
            apiUrl: process.env.EXPO_PUBLIC_API_URL || 'http://192.168.8.114:3000/api/v1',
            eas: {
                projectId: '2221b6b4-690d-4afe-b200-eeb018251db5',
            },
        },
        notification: {
            color: '#2D2D2D',
            androidMode: 'default',
            androidCollapsedTitle: 'KMR-BEAUTY',
        },
    };
};
