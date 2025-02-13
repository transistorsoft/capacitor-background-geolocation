# Change Log

## 7.0.3 &mdash; 2025-02-13
* [Android] Re-compile library with JDK 17
* [Android] Fix `ConcurrentModificationException` in `StopTimeoutEvaluator`.

## 7.0.2 &mdash; 2025-02-07
* Update `peerDependencies` in `package.json`.

## 7.0.1 &mdash; 2025-02-06
* Upgrade to Capacitor 7

## 6.1.5 &mdash; 2024-12-03
* [Android] Remove Android Setup Step for `proguard-rules.pro`.  The plugin is able to automatically apply its `proguard-rules`.

## 6.1.4 &mdash; 2024-11-12
* [Android] Remove enforcement of minimum Geofence radius `150`
* [Android] Fix issue with `TSLocationManagerActivity` (responsible for showing location permission / authorization dialogs).  Minimizing the app with an active permission dialog would cause the app's `MainActivity` to terminate on some devices.

## 6.1.3 &mdash; 2024-11-08
* [Android] Fix reported "screen flickering" issue on some devices when SDK requests permissions.
* [Android] Address Android synchronization issue with `TSLocation.toMap`.
* [iOS] Address crash in `TSConfig` due to "uncaught exception NSInvalidArgumentException"
* [Android] Change `foregroundServiceType` on `LocationRequestService` from `shortService` -> `location`.
* [iOS] Address inconsistent location-tracking performance on iOS.

## [6.1.2] &mdash; 2024-10-23
* [iOS] Fix bug with `triggerActivites` preventing motion-triggering in iOS simulator with simulated location.

## [6.1.1] &mdash; 2024-10-21
* [Android] Implement `Service.onTimeout` to handle `foregroundServiceType="shortService"` timeouts.
* [iOS] Add new `Config.activityType` `ACTIVITY_TYPE_AIRBORNE`.
* [iOS] Implement `Config.triggerActivities` for iOS.
* [Android] Guard against `NullPointerException` receiving a null location in `PolygonGeofenceService` event.
* [Android] Address possible leak of `Activity` reference when terminating the app.  Ensure internal reference to `Activity` is nullified when app is terminated.
* [Android] Add improvements to Android geofencing-only mode with `goefenceModeHighAccuracy: true` where motion-activity updates disabled.
* [Android] Add error-checking in polygon-geofencing to handle a possible `NullPointerException`.
* [iOS] Fix broken linking to Settings screen in `locationAuthorizationAlert` on iOS 18.

## [6.1.0] &mdash; 2024-09-04
* [iOS] Fix bug in iOS *Polygon Geofencing* when running in geofences-only mode (`.startGeofences`).  iOS would mistakenly turn off location updates exactly 3 samples into the containing circular geofence of a polygon.
* Implement `notifyOnDwell` for polygon-geofences.

## [6.0.3] &mdash; 2024-06-30
* Fix `uploadLog` method.  Javascript layer was mistakenly executing `emailLog` instead.

## [6.0.2] &mdash; 2024-06-12
* [Android] Remove permission `FOREGROUND_SERVICE_HEALTH`.  It turns out that this permission is no longer required whe
n the `ActivityRecognitionServivce` is defined with a `foregroundServiceType="shortservice"`, instead of `"health"`, which allows a background
-launched foreground-service to stay active for up to 3 minutes, which is sufficient for the `ActivityRecognitionServic
e`, which typically stays activated only for a few milliseconds.
* [Android] Fix "Multiple geofence events triggered for a single geofence registration when registered individually".

## [6.0.1]  &mdash; 2024-05-14
* [Android] Fix bug in .getCurrentPosition not returning or throwing an error in a condition where Network OFF and GPS ON.

## [6.0.0] &mdash; 2024-04-26
* Ugrade to Capacitor v6.

## 5.4.2 &mdash; 2024-04-22
* [iOS] Code-sign `TSLocationManager.xcframework` with new Apple Organization (*9224-2932 Quebec Inc*) certificate.

## 5.4.1 &mdash; 2024-03-28
* [iOS] Add `PrivacyInfo` -> `TSLocationManager.xcframework`.
* [iOS] codesign `TSLocationManager.xcframework`.

## 5.4.0 &mdash; 2024-03-19
* [iOS] Implement new [iOS Privacy Manifest](https://developer.apple.com/documentation/bundleresources/privacy_manifest_files?language=objc)
* Add property `AuthorizationEvent.status`, provding the HTTP status code from the `refreshUrl`.

## 5.3.2 &mdash; 2024-03-18
* [iOS] Fix bug in iOS scheduler, triggering ON incorrectly.  For example, given a `schedule: ['1 00:00-23:59'], the plugin was trigging on for `DAY 2`.

## 5.3.1 &mdash; 2024-03-15
* [iOS] Fix bug in polygon-geofencing:  monitoredIdentifiers not being cleared when `.removeGeofences()` is called, can result in null-pointer exception.
* [Android] Change `foregroundServiceType` of the SDK's `GeofencingService` definition in its `AndroidManifest` from `shortService` -> `location`.

## 5.3.0 &mdash; 2024-02-27
* [iOS] Modify behaviour of stop-detection system to NOT turn off location-services but merely adjust desiredAccuracy as high as possible.  There were problems reported using `locationAuthorizationRequest: 'WhenInUse'` with recent versions of iOS where the stop-detection system could put the app to sleep during tracking if the motion API reported the device became momentarily stationary.

## 5.2.4  &mdash; 2023-11-16
* [Android] Fix problem with polygon-geofencing license-validation not working in DEBUG builds when configured with pro
duct flavors.

## 5.2.3 &mdash; 2023-11-06
* [Android] HMS geolocation event does not provide a timestamp for the triggering location!!  Use System current time.
* [Android] Guard against Geofence SQLite query returning null in `GeofencingService`.
* [Android] Fix `ConcurrentModificationException` in `SingleLocationRequest.getBestLocation`

## 5.2.2 &mdash; 2023-10-12
* [Android] Fix `IllegalStateException` calling addGeofences when number of geofences exceeds platform maximum (100).

## 5.2.1 &mdash; 2023-10-02
* [iOS] Fix "*Duplicate symbol error DummyPods_TSLocationManager*".
* [Android] Fix timeout issue in `.watchPosition`.

## 5.2.0 &mdash; 2023-09-29

* **Polygon Geofencing**:  The Background Geolocation SDK now supports *Polygon Geofences* (Geofences of any shape).  For more information, see API docs [`Geofence.vertices`](https://transistorsoft.github.io/capacitor-background-geolocation/interfaces/geofence.html#vertices).  ℹ️ __*Polygon Geofencing*__ is [sold as a separate add-on](https://shop.transistorsoft.com/products/polygon-geofencing) (fully functional in *DEBUG* builds).

![](https://dl.dropbox.com/scl/fi/sboshfvar0h41azmb4tyv/polygon-geofencing-parc-outremont-400.png?rlkey=d2s0n3zbzu72e7s2gch9kxd4a&dl=1)
![](https://dl.dropbox.com/scl/fi/xz48myvjnpp8ko0l2tufg/polygon-geofencing-parc-lafontaine-400.png?rlkey=sf20ns959uj0a0fq0atmj55bz&dl=1)

* Remove `backup_rules.xml` from `AndroidManifest.xml` &mdash; it's causing conflicts with other plugins.
* [Android] Add proguard-rule for compilation of the android library to prevent from obfuscating the `BuildConfig` class to `a.a.class`, conflicting with other libraries.

## 5.1.4 &mdash; 2023-09-11
* [Android] Add proguard-rule for compilation of the android library to prevent from obfuscating the `BuildConfig` class to `a.a.class`, conflicting with other libraries.

## 5.1.3 &mdash; 2023-09-05
* [Android] Performance enhancements and error-checking.
* [Typescript] Add missing `LocationError` value `3`;

## 5.1.2 &mdash; 2023-08-24

* [Android] Fix memory-leak in `.startBackgroundTask`:  If a `Task` timed-out and is "FORCE KILLED", it was never removed from a `List<Task>`.
* [Android] Fix `Exception NullPointerException:at com.transistorsoft.locationmanager.util.BackgroundTaskWorker.onStopped`

## 5.1.1 &mdash; 2023-08-23
* [Android] :warning: If you have the following elements defined in your __`AndroidManifest.xml`__, __DELETE__ them:
```diff
-       <service android:name="com.transistorsoft.locationmanager.service.TrackingService" android:foregroundServiceType="location" />
-       <service android:name="com.transistorsoft.locationmanager.service.LocationRequestService" android:foregroundServiceType="location" />
```
* [Android] Modify Foreground-service management to use `stopSelfResult(startId)` instead of `stopSelf()`.  This could improve reports of Android ANR
`Context.startForeground`.
* [Android] Re-factor getCurrentPosition to prefer more recent location vs more accuracy (within limits)
* [Android] Android 14 (API 34) support:  Android 14 is more strict with scheduling `AlarmManager` "exact alarms" (which the plugin does take advantage of).  If you wish the plugin to use `AlarmManager` "exact alarms" in your app, you must now explicitly define that permission in your own `AndroidManifest`:
```xml
<manifest>
    <uses-permission android:minSdkVersion="34" android:name="android.permission.USE_EXACT_ALARM" />
</manifest>
```

* [Android] Android 14 (API 34) support:  Re-factor BackgroundTaskService to use `WorkManager` instead of a foreground-service.
* [Android] Android 14 (API 34) support: Due to new runtime permission requirements on `AlarmManager` exact alarms (`android.permission.SCHEDULE_EXACT_ALARM`), the plugin can no longer rely upon launching a foreground-service using an exact alarm.  Instead, the plugin will create a geofence around the current position (configured with `initialTriggerEntry`) to hopefully immediately launch a foreground-service to handle the fake geofence event, since Android allows foreground-service launches due to Geofencing events.
* [Android] Android 14 (API 34) support:  All foreground-services now require an `android:foregroundServiceType` in the plugin's `AndroidManifest` (handled automatically by the plugin).
* [Android] Android 14 (API 34) support: Fix error "*One of RECEIVER_EXPORTED or RECEIVER_NOT_EXPORTED should be specified*" in `DeviceSettings.startMonitoringPowerSaveChanges`.
* [Android] Add sanity-check for invalid `Geofence` arguments (eg: invalid latitude/longitude).
* [Android] Add safety-checks in ForegroundService stop-handling.  There was a report of a *reproducible* crash while aggressively calling `.getCurrentPosition` in a `Timer` (eg: every second).
* [Android] Demote `HeartbeatService` from a Foreground Service to `AlarmManager` ONESHOT.  :warning: In your `onHeartbeat` event, if you intend to perform any kind of asynchronous function, you should wrap it inside `BackgroundGeolocation.startBackgroundTask` in order to prevents the OS from suspending your app before your task is complete:

```javascript
BacckgroundGeolocation.onHeartbeat(async (event) => {
  console.log("[onHeartbeat] $event");
  // First register a background-task.
  const taskId = await BackgroundGeolocation.startBackgroundTask();
  try {
    // Now you're free to perform long-running tasks, such as getCurrentPosition()
    const location = await BackgroundGeolocation.getCurrentPosition({
      samples: 3,
      timeout: 30,
      extras: {
        "event": "heartbeat"
      }
    });
    console.log("[onHeartbeat] location:", $location);
  } catch(error) {
    console.log("[getCurrentPosition] ERROR:", error);
  }
  // Be sure to singal completion of your background-task:
  BackgroundGeolocation.stopBackgroundTask(taskId);
});
```

* [Android] Fix NPE iterating a `List` in `AbstractService`.
* [Android] If a `SingleLocationRequest` error occurs and at least one sample exits, prefer to resolve the request successfully rather than firing the error (eg: `getCurrentPosition`, `motionchange`, `providerchange` requests).

## 5.0.0 &mdash; 2023-05-12
* Capacitor 5 support.  For Capacitor 4, you must use `v4.x`

## 4.12.0 &mdash; 2023-05-04
* [Android] Gradle v8 now requires `namespace` attribute in gradle files.
* [iOS] iOS 16.4 made a major change to location-services, exposed only when `Config.showsBackgroundLocationIndicator` is `false` (the default).  As a result of this change, `Config.showsBackgroundLocationIndicator` will now default to `true`.

## 4.11.4 &mdash; 2023-04-19
* [Android] Upgrade `logback-android` dependency to `3.0.0` (`org.slf4j-api` to `2.0.7).

## 4.11.3 &mdash; 2023-04-12
* [Android] Fix String concatenation issue on Turkish devices where method-name composed for use with reflection is in
correctly capitalized (ie: `isMoving -> `setIsMoving` is incorrectly capitalized with Turkish capital as `setİsMoving`
.  Simply enforce `Locale.ENGLISH` when performing `String.toUpperCase(Locale.ENGLISH)`.

## 4.11.2 &mdash; 2023-04-05
* [iOS] Fix bug in TSScheduler.  When schedule was cleared via .setConfig, only the State.schedulerEnabled property was set to false, but the TSScheduler singleton contained an internal 'enabled' property which was not reset to false.  Solution was to simply call stop() method upon TSScheduler singleton.

## 4.11.1 &mdash; 2023-03-30
* [Android] Bump default `hmsLocationVersion = 6.9.0.300`.  There are reports of Google rejecting apps due to older huawei HMS dependenc
ies.
* [Android] Fix `ClassCastException` related to Motion API error

## 4.11.0 &mdash; 2023-03-29
* [Android] Introduce __Huawei HMS Support__.  Requires a separate license key [purchased here](https://shop.transistorsoft.com/collections/frontpage/products/huawei-background-geolocation).
* [iOS] Fix for iOS 16.4.  iOS 16.4 introduces changes to CoreLocation behaviour when using Config.showsBackgroundLocationIndi
cator: false.
* [Android] Added extra logic in a location error-handler to mitigate against a possible edge-case where a location-error fetching the onMotionChange position could possibly result in an infinite loop, causing a stackoverflow exception:
```
at com.transistorsoft.locationmanager.service.TrackingService.changePace(TrackingService.java:264)
at com.transistorsoft.locationmanager.service.TrackingService$c.onError(TrackingService.java:69)
at com.transistorsoft.locationmanager.location.SingleLocationRequest.onError(SingleLocationRequest.java:18)
at com.transistorsoft.locationmanager.location.SingleLocationRequest.start(SingleLocationRequest.java:71)
at com.transistorsoft.locationmanager.location.TSLocationManager.getCurrentPosition(TSLocationManager.java:3)
at com.transistorsoft.locationmanager.service.TrackingService.changePace(TrackingService.java:321)
at com.transistorsoft.locationmanager.service.TrackingService$c.onError(TrackingService.java:69)
at com.transistorsoft.locationmanager.location.SingleLocationRequest.onError(SingleLocationRequest.java:18)
at com.transistorsoft.locationmanager.location.SingleLocationRequest.start(SingleLocationRequest.java:71)
at com.transistorsoft.locationmanager.location.TSLocationManager.getCurrentPosition(TSLocationManager.java:3)
at com.transistorsoft.locationmanager.service.TrackingService.changePace(TrackingService.java:321)
at com.transistorsoft.locationmanager.service.TrackingService$c.onError(TrackingService.java:69)
at com.transistorsoft.locationmanager.location.SingleLocationRequest.onError(SingleLocationRequest.java:18)
at com.transistorsoft.locationmanager.location.SingleLocationRequest.start(SingleLocationRequest.java:71)
.
.
.
```

## 4.10.1 &mdash; 2023-03-17
* [Fixed][Android] Android plugin was missing implementation for onAuthorization event handler.

## 4.10.0 &mdash; 2023-02-01
* [Fixed][Android] Implement support for `play-services-location v21` (`ext.playServicesLocationVersion` in your `android/build.gradle`).  The plugin can now work with either `<= v20` or `>= v21`.

## 4.9.5 &mdash; 2023-01-19
* [Fixed] Fixed inconsistency in API docs with `location.activity` (`location.activity.type`) and `MotionChangeEvent` provided to `onActivityChange` (`motionActivityEvent.activity`).
* [Changed] __Android__ Update `logback-android` version.

## 4.9.4 &mdash; 2022-12-12
* [Fixed] __Android__: Catch `Fatal Exception: java.lang.IllegalArgumentException: NetworkCallback was already unregistered`
* [Fixed] __Android__ It has been discovered that the Android logger `logback-android` has not been automatically clearing all expired records (`Config.logMaxDays`) from the log database.  The `logback-android` database consists of three tables and only *one* was being cleared (see https://github.com/tony19/logback-android/pull/214), resulting in a constantly growing database (where `logLevel > LOG_LEVEL_OFF`).  This version of the plugin will alter the `logback-android` database tables with `ON DELETE CASCADE` to ensure all log-data is properly removed.
* [Added] Added two new *HTTP RPC* commands `stopSchedule` and `startSchedule` (See API docs *HTTP Guide* for more information).

## 4.9.3 &mdash; 2022-11-11
* Update peerDependencies `@capacitor/core: ^4.0.0`

## 4.9.2 &mdash; 2022-10-26
* `getCurrentPosition` options not being sent to native code.
* [Android] Fix logic error with `getCurrentPosition` not respecting `timeout`.
* [Android] `play-services:location` has [introduced a breaking change](https://developers.google.com/android/guides/releases#october_13_2022) in `v21`, breaking the plugin.  `googlePlayServicesLocationVersion` will be capped with a maximum of `v20`.  The next major release (`4.10.0`) will set a minimum required version of `v21`.

## 4.9.1 &mdash; 2022-10-14
* [iOS] Fix bug in iOS scheduler firing on days where it should not.
* [iOS] Rebuild `TSLocationManager.xcframework` with *XCode 13* (instead of *XCode 14*).

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

