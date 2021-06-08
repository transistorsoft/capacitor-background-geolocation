# Change Log

## [0.0.12] &mdash; 2021-06-08
- [Fixed] Implement `watchPosition`

## [0.0.11] &mdash; 2021-06-07
- [Fixed] iOS.  Small change to TSLocationManager to ignore onResume events when .ready() not yet called.  This was causing the plugin to start itself before ready is called.  Could result in missed events.

## [0.0.10] &mdash; 2021-06-06
- Fixed iOS .podspec.  Was still referencing TSBackgroundFetch.xcframework, which was removed from this repo now that capacitor-background-fetch exitsts.

## [0.0.9] &mdash; 2021-06-03
- Add `EVENT_` constants to `BackgroundGeolocation` class, eg: `BackgroundGeolocation.EVENT_LOCATION`.
- Fix Android example.  Was not configuring background-fetch

## [0.0.8] &mdash; 2021-06-02
- Update Setup Instructions for `@transistorsoft/capacitor-background-fetch`.

## [0.0.4] &mdash; 2021-06-02
- Fix package.json to include ios/TSLocationManager.xcframework, android/libs when publishing to npm.

## [0.0.3] &mdash; 2021-05-31
- Fix Podfile name in package.json

## [0.0.2] &mdash; 2021-05-31
- Working beta version for both iOS / Android.

