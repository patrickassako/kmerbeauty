module.exports = {
  expo: {
    name: 'KmerServices',
    slug: 'kmerservices',
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
    extra: {
      eas: {
        projectId: 'bb6b83aa-5e11-4da0-b7cc-7349e4e86e08',
      },
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'com.kmerservices.app',
      googleServicesFile: './GoogleService-Info.plist',
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#ffffff',
      },
      package: 'com.kmerservices.app',
      googleServicesFile: './google-services.json',
    },
    web: {
      favicon: './assets/favicon.png',
    },
    plugins: [
      [
        'expo-notifications',
        {
          color: '#ffffff',
        },
      ],
    ],
    notification: {
      color: '#2D2D2D',
      androidMode: 'default',
      androidCollapsedTitle: 'KmerServices',
    },
  },
};
