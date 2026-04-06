<p align="center">
  <img src="https://raw.githubusercontent.com/transistorsoft/assets/master/images/logos/transistor/transistor-logo-panel-ts.svg" alt="Background Geolocation for Capacitor" width="635">
</p>

# Background Geolocation for Capacitor

[![npm](https://img.shields.io/npm/dm/@transistorsoft/capacitor-background-geolocation.svg)]() [![npm](https://img.shields.io/npm/v/@transistorsoft/capacitor-background-geolocation.svg)]()

The most sophisticated background **location-tracking & geofencing** SDK with battery-conscious motion-detection intelligence for **iOS** and **Android**.

The SDK uses **motion-detection** APIs (accelerometer, gyroscope, magnetometer) to detect when the device is *moving* or *stationary*:

- **Moving** — location recording starts automatically at the configured `distanceFilter` (metres)
- **Stationary** — location services turn off automatically to conserve battery

> [!IMPORTANT]
> This is **`v9`**. For the previous version see [`v8.x`](https://github.com/transistorsoft/capacitor-background-geolocation/tree/8.0.1). **`v8.x`** license keys do **not** work with **`v9`** — log in to the [Customer Dashboard](https://transistorsoft.com) to generate a **`v9`** key. See the [Migration Guide](help/MIGRATION-GUIDE-9.0.0.md) for details.

---

## :books: Documentation

### <img src="https://raw.githubusercontent.com/transistorsoft/react-native-background-geolocation/master/assets/images/platforms/capacitor.svg" width="20" height="20"> Capacitor
- [Setup](https://docs.transistorsoft.com/typescript/setup/?tab=capacitor)
- [API Reference](https://docs.transistorsoft.com/typescript/BackgroundGeolocation/)
- [Example](https://docs.transistorsoft.com/typescript/examples/?tab=capacitor)

---

## :key: Licensing

> [!TIP]
> The SDK is **fully functional in `DEBUG` builds** — no license required. Try before you buy.

A license is required only for **`RELEASE` builds** on Android.
[Purchase a license](https://shop.transistorsoft.com/products/capacitor-background-geolocation)

---

## :open_file_folder: Example Apps

Two example apps are included in the [`example/`](./example) directory:

| App | Description |
|-----|-------------|
| [`example/basic`](./example/basic) | Minimal getting-started app — configure, toggle tracking, view events. Start here. |
| [`example/advanced`](./example/advanced) | Full-featured reference app with live map, geofence tools, all settings, and Transistor server integration. |

See the [example README](./example/README.md) for setup instructions.

---

## 📦 SDK availability

<img src="https://raw.githubusercontent.com/transistorsoft/assets/master/images/logos/transistor/transistor-logo-panel-all.svg" width="300">

| Platform | Package |
|---|---|
| <img src="https://raw.githubusercontent.com/transistorsoft/react-native-background-geolocation/master/assets/images/platforms/capacitor.svg" width="16" height="16"> Capacitor | **This repo** |
| <img src="https://raw.githubusercontent.com/transistorsoft/react-native-background-geolocation/master/assets/images/platforms/react-native.svg" width="16" height="16"> [React Native](https://github.com/transistorsoft/react-native-background-geolocation) | `react-native-background-geolocation` |
| <img src="https://raw.githubusercontent.com/transistorsoft/react-native-background-geolocation/master/assets/images/platforms/expo.svg" width="16" height="16"> [Expo](https://github.com/transistorsoft/react-native-background-geolocation) | `react-native-background-geolocation` |
| <img src="https://raw.githubusercontent.com/transistorsoft/react-native-background-geolocation/master/assets/images/platforms/flutter.svg" width="16" height="16"> [Flutter](https://github.com/transistorsoft/flutter_background_geolocation) | `flutter_background_geolocation` |
| <img src="https://raw.githubusercontent.com/transistorsoft/react-native-background-geolocation/master/assets/images/platforms/cordova.svg" width="16" height="16"> [Cordova](https://github.com/transistorsoft/cordova-background-geolocation-lt) | `cordova-background-geolocation-lt` |
| <img src="https://raw.githubusercontent.com/transistorsoft/react-native-background-geolocation/master/assets/images/platforms/swift.svg" width="16" height="16"> [Swift / iOS](https://github.com/transistorsoft/background-geolocation) | `background-geolocation` |
| <img src="https://raw.githubusercontent.com/transistorsoft/react-native-background-geolocation/master/assets/images/platforms/kotlin.svg" width="16" height="16"> [Kotlin / Android](https://github.com/transistorsoft/background-geolocation) | `background-geolocation` |

---

MIT © [Transistor Software](https://www.transistorsoft.com)
