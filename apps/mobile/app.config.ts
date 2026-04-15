import type { ExpoConfig } from 'expo/config'

const config: ExpoConfig = {
  name: 'Gastos App',
  slug: 'gastos-app',
  version: '0.1.0',
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
    bundleIdentifier: 'com.gastos.app',
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#ffffff',
    },
    package: 'com.gastos.app',
  },
  web: {
    favicon: './assets/favicon.png',
  },
  plugins: [
    [
      'expo-router',
      {
        origin: false,
      },
    ],
  ],
  schemes: ['gastos'],
  extra: {
    router: {
      origin: false,
    },
  },
}

export default config
