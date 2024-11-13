# Android Setup Instructions (Required)

:information_source: Use `yarn` or `npm` as desired.

```
npm install @transistorsoft/capacitor-background-geolocation
npm install @transistorsoft/capacitor-background-fetch

npx cap sync
```

## Configure `capacitor-background-fetch`

You must perform the [Android Setup](https://github.com/transistorsoft/capacitor-background-fetch/blob/master/help/INSTALL-ANDROID.md) for `@transistorsoft/capacitor-background-fetch`.


## Gradle Configuration

The plugin is aware of a number of Gradle **`ext`** variables (See your app's **`anroid/variables.gradle`**) to control the version of Android dependency versions.

### :open_file_folder: **`android/variables.gradle`**

```diff
ext {
    minSdkVersion = 21
    targetSdkVersion = 33   // Or higher
    .
    .
    .
+   compileSdkVersion = 33  // Or higher
+   // capacitor-background-geolocation variables
+   playServicesLocationVersion = '21.0.1'
}
```

A number of other **`ext`** variables are available but should generally not need to be modified.

| Option             | Default     | Description |
|--------------------|------------|--------------|
|`playServicesLocationVersion`  | `21.0.1` | `com.google.android.gms:play-services-location` |
|`hmsLocationVersion`  | `6.9.0.300` | `com.huawei.hms:location` (When running on Huawei HMS devices)|
|`okHttpVersion`     | `4.9.1`    | *BackgroundGeolocation* uses the excellent [okhttp](https://square.github.io/okhttp/) framework for its HTTP Service |
|`localBroadcastManagerVersion`  | `1.0.0` | `androidx.localbroadcastmanager:localbroadcastmanager` |


:information_source: You should always strive to use the latest available Google Play Services libraries.  You can determine the latest available version [here](https://developers.google.com/android/guides/setup).


### :open_file_folder: **`android/build.gradle`**

Custom `maven url` for both `background-geolocation` and `background-fetch` are required.  Edit your **`android/build.gradle`** as follows:

```diff
.
.
.
apply from: "variables.gradle"

allprojects {	// <-- IMPORTANT:  allprojects
    repositories {
        google()
        mavenCentral()

+       // capacitor-background-geolocation
+       maven { url("${project(':transistorsoft-capacitor-background-geolocation').projectDir}/libs") }
+       maven { url 'https://developer.huawei.com/repo/' }
+       // capacitor-background-fetch
+       maven { url("${project(':transistorsoft-capacitor-background-fetch').projectDir}/libs") }
    }
}
```

### :open_file_folder: **`android/app/build.gradle`**

Background Geolocation requires a gradle extension for your `app/build.gradle`.

```diff
apply plugin: 'com.android.application'

+Project background_geolocation = project(':transistorsoft-capacitor-background-geolocation')
+apply from: "${background_geolocation.projectDir}/app.gradle"

android {
    .
    .
    .
    buildTypes {
        release {
            .
            .
            .
            proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
+           // [background-geolocation] Proguard-rules
+           proguardFiles "${background_geolocation.projectDir}/proguard-rules.pro"
        }
    }
}
```

## AndroidManifest.xml (License Configuration)

If you've **not** [purchased a license](https://www.transistorsoft.com/shop/products/capacitor-background-geolocation#plans), **ignore this step** &mdash; the plugin is fully functional in *DEBUG* builds so you can try before you [buy](https://www.transistorsoft.com/shop/products/capacitor-background-geolocation#plans).

```diff
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.transistorsoft.backgroundgeolocation.react">

  <application
    android:name=".MainApplication"
    android:allowBackup="true"
    android:label="@string/app_name"
    android:icon="@mipmap/ic_launcher"
    android:theme="@style/AppTheme">

    <!-- capacitor-background-geolocation licence key -->
+   <meta-data android:name="com.transistorsoft.locationmanager.license" android:value="YOUR_LICENCE_KEY_HERE" />
    .
    .
    .
  </application>
</manifest>
```

### Polygon Geofencing Add-on

If you've purchased a license for the [Polygon Geofencing add-on](https://shop.transistorsoft.com/products/polygon-geofencing), add the following license key to your __`AndroidManifest`__ (Polygon Geofencing is fully functional in DEBUG builds so you can try before you buy):

```diff
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.your.package.id">

  <application>
    <!-- flutter_background_geolocation licence -->
    <meta-data android:name="com.transistorsoft.locationmanager.license" android:value="YOUR_LICENCE_KEY_HERE" />
    <!-- Background Geolocation Polygon Geofencing Licence -->
+   <meta-data android:name="com.transistorsoft.locationmanager.polygon.license" android:value="YOUR_POLYGON_LICENCE_KEY_HERE" />
    .
    .
    .
  </application>
</manifest>
```

### Huawei Mobile Services (HMS) Support

If you've [purchased an *HMS Background Geolocation* License](https://shop.transistorsoft.com/collections/frontpage/products/huawei-background-geolocation) for installing the plugin on _Huawei_ devices without *Google Play Services* installed, add your *HMS Background Geolocation* license key:

```diff
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.your.package.id">

  <application>
    <!-- capacitor-background-geolocation licence key -->
    <meta-data android:name="com.transistorsoft.locationmanager.license" android:value="YOUR_LICENCE_KEY_HERE" />
    <!-- HMS Background Geolocation licence -->
+   <meta-data android:name="com.transistorsoft.locationmanager.hms.license" android:value="YOUR_HMS_LICENCE_KEY_HERE" />
    .
    .
    .
  </application>
</manifest>
```
:warning: Huawei HMS support requires `capacitor-background-geolocation >= 3.11.0`.

## `AlarmManager` "Exact Alarms" (optional)

The plugin uses __`AlarmManager`__ "exact alarms" for precise scheduling of events (eg: __`Config.stopTimeout`__, __`Config.motionTriggerDelay`__, __`Config.schedule`__).  *Android 14 (SDK 34)*, has restricted usage of ["`AlarmManager` exact alarms"](https://developer.android.com/about/versions/14/changes/schedule-exact-alarms).  To continue using precise timing of events with *Android 14*, you can manually add this permission to your __`AndroidManifest`__.  Otherwise, the plugin will gracefully fall-back to "*in-exact* `AlarmManager` scheduling".  For more information about Android's __`AlarmManager`__, see the [Android API Docs](https://developer.android.com/training/scheduling/alarms).

:open_file_folder: In your __`AndroidManifest`__, add the following permission (**exactly as-shown**):

```xml
  <manifest>
      <uses-permission android:minSdkVersion="34" android:name="android.permission.USE_EXACT_ALARM" />
      .
      .
      .
  </manifest>
```
:warning: It has been announced that *Google Play Store* [has plans to impose greater scrutiny](https://support.google.com/googleplay/android-developer/answer/13161072?sjid=3640341614632608469-NA) over usage of this permission (which is why the plugin does not automatically add it).



