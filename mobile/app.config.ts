
import { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => {
    return {
        ...config,
        name: 'KMR-BEAUTY',
        slug: 'kmr-beauty',
        scheme: 'kmerbeauty',
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
            bundleIdentifier: 'com.kmerservice.beauty',
        },
        android: {
            adaptiveIcon: {
                foregroundImage: './assets/adaptive-icon.png',
                backgroundColor: '#ffffff',
            },
            package: 'com.kmerservice.beauty',
            versionCode: 6,
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
            config: {
                googleMaps: {
                    apiKey: process.env.GOOGLE_MAPS_API_KEY || "AIzaSyBhX1SBAKKvEcfgYHSY3G2Z2gibg7lepS4"
                }
            },
            googleServicesFile: "./google-services.json",
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
                "expo-image-picker",
                {
                    "photosPermission": "Allow $(PRODUCT_NAME) to access your photos to update your profile or upload service images.",
                    "cameraPermission": "Allow $(PRODUCT_NAME) to access your camera to take photos for your profile or services."
                }
            ],
            [
                'expo-notifications',
                {
                    color: '#ffffff',
                },
            ],
            [
                'expo-build-properties',
                {
                    android: {
                        kotlinVersion: '1.9.25',
                        enableProguardInReleaseBuilds: false,
                        enableShrinkResourcesInReleaseBuilds: false,
                    },
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
