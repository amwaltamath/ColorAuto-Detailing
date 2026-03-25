import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.colorautodetailing.admin',
  appName: 'ColorAuto Admin',
  webDir: 'dist/client',
  server: {
    url: 'https://colorautodetailing.com/employee/dashboard',
    cleartext: false,
  },
  ios: {
    scheme: 'ColorAutoAdmin',
    contentInset: 'automatic',
  },
  plugins: {
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
    SplashScreen: {
      launchAutoHide: true,
      launchShowDuration: 2000,
      backgroundColor: '#0f172a',
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#1e293b',
    },
  },
};

export default config;
