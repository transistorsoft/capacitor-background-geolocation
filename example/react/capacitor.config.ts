import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.transistorsoft.backgroundgeolocation.capacitor',
  appName: 'BG Geo',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  },
  // 'none' | 'debug' | 'production'
  loggingBehavior: 'debug',
  android: {
    useLegacyBridge: true
  }
};

export default config;
