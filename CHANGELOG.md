# Change Log

## 4.9.0 &mdash; 2022-09-29
* [iOS] Build `TSLocationManager.xcframework` with *XCode 14*.
* [Android] Add new Config `Notification.channelId` for custom customizing the `NotificationChannel` id.  Some use
rs have an existing foreground-service and `NotificationChannel` so wish to have the plugin's foreground-service
s share the same notification and channel.  This option should generally not be used.
* [Android] Add permission `android.permission.POST_NOTIFICATIONS` for Android 13 (targetSdkVersion 33).  Requ
ired to allow enabling notifications in Settings->Apps.
* [Android] Add `null` check when executing `PowerManager.isPowerSaveMode()`
* [Android] Add new Config option `Authorization.refreshHeaders` for full control over HTTP headers sent to `Author
ization.refreshUrl` when refreshing auth token.


## 4.8.3 &mdash; 2022-09-14
* [Android] Add new `Config.disableProviderChangeRecord (default false)` to allow disabling the automatical HTTP POST of the `onProviderChange` location record.  Some users do not want this automatically uploaded locatio
n whenever the state of location-services is changed (eg: Location-services disabled, Airplane mode, etc).
* [Android] Fix bug with `disableMotionActivityUpdates: true` and calling `.start()` followed immediately by `.changePace(true)`.  The SDK would fail to enter the moving state, entering the stationary state instead.

## 4.8.2 &mdash; 2022-09-06
* Add new iOS 15 `CLLocation` attribute `Location.ellipsoidal_altitude` *The altitude as a height above the World Geodetic System 1984 (WGS84) ellipsoid, measured in meters*.  Android `Location.altitude` has always returned *ellipsoidal altutude*, so both `Location.altitude` and `Location.ellipsoidal_altitude` will return the same value.

## 4.8.1 &mdash; 2022-08-08
* [Android] Fix `java.lang.IllegalArgumentException `TSProviderManager.handleProviderChangeEvent`.
* [Android] `startOnBoot: false` with `stopOnTerminate: false` could start-on-boot.
* [Android] `State.enabled` returned by calling `.stop()` returns `true` due to implementation running in a background-thread but `callback` executed immediately on the main-thread.  However, requesting `.getState()` immediately after calling `.stop` *would* return the correct value of `State.enabled`
* [Android] Fix `notification.sticky` not being respected.

## 4.8.0 &mdash; 2022-06-21
* [Android] Fix bug in `onProviderChange` event:  not properly detecting when location-services disabled.
* [Android] __Android 12__:  Guard `Context.startForegroundService` with `try / catch`: the plugin will now catch exception `ForegroundServiceStartNotAllowedException` and automatically retry with an `AlarmManager` *oneShot* event.
* [Android] __Android 12__: Refactor foreground-service management for Android 12:  A way has been found to restore the traditional behaviour of foreground-services, allowing them to stop when no longer required (eg: where the plugin is in the stationary state).
* [Android] Refactor application life-cycle management.  Remove deprecated permission `android.permission.GET_TASKS` traditionally used for detecting when the app has been terminated.  The new life-cycle mgmt system can detect Android headless-mode in a much more elegant manner.
* [Android] Better handling for `WhenInUse` behaviour:  The plugin will not allow `.changePace(true)` to be executed when the app is in the background (since Android forbids location-services to initiated in the background with `WhenInUse`).
* [Android] Refactor `useSignificantChangesOnly` behaviour.  Will use a default `motionTriggerDelay` with minimum 60000ms, minimum `distanceFilter: 250` and enforced `stopTimeout: 20`.
* [iOS] iOS 15 has finally implemented *Mock Location Detection*.  `location.mock` will now be present for iOS when the location is mocked, just like Android.

## 4.7.2 &mdash; 2022-05-27
* [Android] Fix bug in Android 12 support for executing `.start()` in background while terminated.  Used `JobScheduler` ONESHOT instead of `AlarmManager`.
* [Android] Plugin could be placed into an infinite loop requesting motionchange position in some cases.
* [Android] Address `ConcurrentModificationException` in `onPermissionGranted`.

## 4.7.1 &mdash; 2022-05-11
* [Android] If on device reboot location-services fails to provide a location (eg: timeout, airplane mode), the plugin would rely on motion API events to try again.  This is a problem if the motion api is disabled.  Instead, the SDK will keep trying to retrieve a location.
* [Android] Android 12 support for `ForegroundServiceStartNotAllowedException`:  immediately launch the SDK's `TrackingService` as soon as `.start()` executes.  If a location-timeout occurs while fetching the onMotionChange position after device reboot with `startOnBoot: true`, the `ForegroundServiceStartNotAllowedException` could be raised.
* [Android] Add two new attributes `android:enabled` and `android:permission` to the SDK's built-in `BootReceiver`:
```xml
<receiver android:name="com.transistorsoft.locationmanager.BootReceiver" android:enabled="true" android:exported="false" android:permission="android.permission.RECEIVE_BOOT_COMPLETED">
```

## 4.7.0 &mdash; 2022-05-09
* [Android] Android 12 support for executing `.start()` and `.getCurrentPosition()` while the plugin is disabled and in the background.  This is a bypass of new Android 12 restrictions for starting foreground-services in the background by taking advantage of AlarmManager.
```
Fatal Exception: android.app.ForegroundServiceStartNotAllowedException: startForegroundService() not allowed due to mAllowStartForeground false: service
```

* [Android] Added two new `androidx.lifecycle` dependencies to plugin's `build.gradle`, in addition to corresponding `ext` vars `ext.lifeCycleRunTimeVersion` and `ext.lifeCycleRuntimeVersion`
- `"androidx.lifecycle:lifecycle-runtime"`
- `"androidx.lifecycle:lifecycle-extensions"`

## 4.6.0 &mdash; 2022-04-29
* [Android] Add a few extra manufacturer-specific `Intent` for `DeviceSettings.showPowerManager()`.
* [Android] Remove references to deprectated `jcenter` from SDK's gradle files and Setup guide.
* [Android] Minimum `compileSdkVersion 31` is now required.
* [Android] Now that a minimum `targetSdkVersion 29` is required to release an Android app to *Play Store*, the SDK's `AndroidManifest` now automatically applies `android:foregroundServiceType="location"` to all required `Service` declarations.  You no longer need to manually provide overrides in your own `AndroidManifest`, ie:
```diff
<manifest>
    <application>
-       <service android:name="com.transistorsoft.locationmanager.service.TrackingService" android:foregroundServiceType="location" />
-       <service android:name="com.transistorsoft.locationmanager.service.LocationRequestService" android:foregroundServiceType="location" />
    </application>
</manifest>
```

## 4.5.0 &mdash; 2022-03-30
* [Android] Upgrade `android-permissions` dependency from 0.1.8 -> 2.1.6.
* [iOS] Rebuild `TSLocationManager.xcframework` with XCode 13.3

## 4.4.6 &mdash; 2022-03-21
* [Fixed] method deviceSettings.isIgnoringBatteryOptimizations had a syntax error in JS API.

## 4.4.5 &mdash; 2022-02-16
* [Android] While testing adding 20k geofences, the Logger can cause an `OutOfMemory` error.  Define a dedicated thread executor `Executors.newFixedThreadPool(2)` for posting log messages in background.
* [iOS] remote event-listeners in onAppTerminate to prevent onEnabledChange event being fired in a dying app configured for `stopOnTerminate: true`

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

