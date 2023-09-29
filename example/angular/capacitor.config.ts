import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: "com.transistorsoft.backgroundgeolocation.capacitor",
  appName: "CAP BGGeo",
  bundledWebRuntime: false,
  webDir: "www",
  // 'none' | 'debug' | 'production'
  loggingBehavior: 'debug',
  android: {
    useLegacyBridge: true
  }
};
