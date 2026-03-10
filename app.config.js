const getRequiredEnv = (name) => {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
};

const auth0Domain = getRequiredEnv('EXPO_PUBLIC_AUTH0_DOMAIN');
const auth0Scheme = getRequiredEnv('EXPO_PUBLIC_AUTH0_SCHEME');

module.exports = {
  expo: {
    name: 'StockTrackerApp',
    slug: 'StockTrackerApp',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'light',
    splash: {
      image: './assets/splash-icon.png',
      resizeMode: 'contain',
      backgroundColor: '#ffffff',
    },
    ios: {
      supportsTablet: true,
    },
    android: {
      googleServicesFile: './google-services.json',
      adaptiveIcon: {
        backgroundColor: '#E6F4FE',
        foregroundImage: './assets/adaptive-icon.png',
        backgroundImage: './assets/android-icon-background.png',
        monochromeImage: './assets/android-icon-monochrome.png',
      },
      predictiveBackGestureEnabled: false,
      package: 'com.anonymous.StockTrackerApp',
    },
    web: {
      favicon: './assets/favicon.png',
    },
    plugins: [
      '@react-native-firebase/app',
      '@react-native-firebase/messaging',
      [
        'react-native-auth0',
        {
          domain: auth0Domain,
          customScheme: auth0Scheme,
        },
      ],
    ],
  },
};
