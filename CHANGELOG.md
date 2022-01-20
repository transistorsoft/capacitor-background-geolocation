# Change Log

## 4.4.4 &mdash; 2022-01-19
* [Fixed][iOS] Regression bug in iOS SAS authorization strategy
* [Fixed][Android] Android logger defaulting to LOG_LEVEL_VERBOSE when initially launched configured for LOG_LEVEL_OFF

## 4.4.3 &mdash; 2021-12-07
* [Fixed][Android] Minor fix for Android method stopSchedule -- was not sending State to callback.

## 4.4.2 &mdash; 2021-11-05
* [Fixed][iOS] Minor fix to iOS reset:false behaviour.  When .ready() was called a 2nd time, the plugin would apply the config anyway, bypassing reset:false.

## 4.4.1 &mdash; 2021-11-03
* [Changed][Android] Minnor change to Move Android plugin's registration of event-listeners into the .ready method instead of Capacitor plugin init stage.
 
## 4.4.0 &mdash; 2021-10-29
* [Added] New `Authorization.strategy "SAS"` (alternative to default `JWT`).
* [Changed] **Deprecated** `BackgroundGeolocation.removeListener`.  All event-handlers now return a `Subscription` instance containing a `.remove()` method.  You will keep track of your own `subscription` instances and call `.remove()` upon them when you wish to remove an event listener.  Eg:

```javascript
/// OLD
const onLocation = (location) => {
    console.log('[onLocation');
}
BackgroundGeolocation.onLocation(onLocation);
...
// deprecated: removeListener
BackgroundGeolocation.removeListener('location', onLocation);

/// NEW:  capture returned subscription instance.
const onLocationSubscription = BackgroundGeolocation.onLocation(onLocation);
...
// Removing an event-listener.
onLocationSubscription.remove();
```

## 4.3.0 &mdash; 2021-09-13

* [Added][Android] Implement new Android 12 "reduced accuracy" mechanism `requestTemporaryFullAccuracy`.
* [Fixed][iOS] `Authorization.refreshPayload refreshToken` was not performing a String replace on the `{refreshToken}` template, instead over-writing the entire string.  Eg:  if provided with `'refresh_token': 'Bearer {refreshToken}`, `Bearer ` would be over-written and replaced with only the refresh-token.
* [Fixed][Android] Fixed crash reported by Huawei device, where verticalAccuracy returns NaN.
* [Added] Null-check identifier !== null in getGeofence, hasGeofence, removeGeofence

## [4.2.2] &mdash; 2021-08-23
* [Fixed][iOS] add config change listeners for `heartbeatInterval` and `preventSuspend` to dynamically update interval when changed with `setConfig`.
* [Fixed] Method `stopSchedule` was not implemented.
* [Fixed] Method `getGeofence` was not implemented.

## [4.2.1] &mdash; 2021-08-03
* [Changed][Android] Revert default `okHttpVersion` back to `3.12.13`.  `4.x` requires `minSdkVersion 21` (*Android 5*).

## [4.2.0] &mdash; 2021-08-02
* [Changed][Android] Update Android default `okhttp` version to `4.9.1`.
* [Changed][Android] Update Android `eventbus` to `3.2.0`.
* [Changed][Android] Update Android `android-permissions` to import from *MavenCentral* instead of deprecated `jCenter`.
* [Changed][iOS] Re-compile iOS `TSLocationManager` using XCode 12.4 instead of `12.5.1`.
* [Fixed][Android] Fix an edge-case requesting motion permission.  If `getCurrentPosition()` is executed before `.start()`, the Android SDK fails to request motion permission.

## [0.0.13] &mdash; 2021-06-11
* [Fixed][iOS] Reports 2 reports of iOS crash `NSInvalidArgumentException (TSLocation.m line 178)` with iOS 14
.x.  Wrap JSON serialization in @try/@catch block.  iOS JSON serialization docs state the supplied NSError err
or ref should report problems but it seems this is only "sometimes" now.

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

