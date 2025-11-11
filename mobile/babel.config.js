module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      'react-native-reanimated/plugin',
      [
        'module-resolver',
        {
          root: ['./src'],
          alias: {
            '@': './src',
            '@components': './src/components',
            '@screens': './src/screens',
            '@navigation': './src/navigation',
            '@design-system': './src/design-system',
            '@hooks': './src/hooks',
            '@store': './src/store',
            '@api': './src/api',
            '@utils': './src/utils',
            '@types': './src/types',
            '@assets': './src/assets',
          },
        },
      ],
    ],
  };
};
