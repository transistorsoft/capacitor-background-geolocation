import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.transistorsoft.backgroundgeolocation.capacitor',
  appName: 'BG Geo',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
