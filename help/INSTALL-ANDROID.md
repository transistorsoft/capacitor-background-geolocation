# Android Setup

### With `yarn`

```bash
yarn add @transistorsoft/capacitor-background-geolocation
npx cap sync
```

### With `npm`

```bash
npm install @transistorsoft/capacitor-background-geolocation --save
npx cap sync
```

---

## Gradle Configuration

Add the following `ext` variables to control Android dependency versions the plugin will align to.

> [!TIP]
> You should always strive to use the latest available Google Play Services libraries.  You can determine the latest available version [here](https://developers.google.com/android/guides/setup).

### :open_file_folder: **`android/variables.gradle`**

```diff
ext {
+   minSdkVersion       = 24       // required minimum
    compileSdkVersion   = 35       // Or higher
    targetSdkVersion    = 35       // Or higher
    .
    .
    .
+   // capacitor-background-geolocation
+   playServicesLocationVersion = '21.3.0'  // Or higher
}
```

### :open_file_folder: **`android/app/build.gradle`**

```diff
apply plugin: 'com.android.application'

android {
    .
    .
    .
    buildTypes {
        release {
            .
            .
            .
            minifyEnabled enableProguardInReleaseBuilds
+           shrinkResources false
        }
    }
}
```

---

## AndroidManifest.xml — License Key

> [!NOTE]
> If you have **not** [purchased a license](https://www.transistorsoft.com/shop/products/capacitor-background-geolocation#plans), **skip this step** — the plugin is fully functional in *DEBUG* builds so you can evaluate it before you [purchase](https://www.transistorsoft.com/shop/products/capacitor-background-geolocation#plans).

Your license key is a **JWT** that encodes all the features (*entitlements*) your subscription includes (e.g. Polygon Geofencing). There is only **one key** — no separate keys per add-on.

Login to the [Customer Dashboard](https://www.transistorsoft.com/shop/customers) to retrieve your key.

:open_file_folder: **`android/app/src/main/AndroidManifest.xml`**

```diff
<manifest xmlns:android="http://schemas.android.com/apk/res/android">

  <application
    android:name=".MainApplication"
    android:allowBackup="true"
    android:label="@string/app_name"
    android:icon="@mipmap/ic_launcher"
    android:theme="@style/AppTheme">

    <!-- capacitor-background-geolocation licence -->
+   <meta-data android:name="com.transistorsoft.locationmanager.license" android:value="YOUR_LICENSE_KEY_HERE" />
    .
    .
    .
  </application>
</manifest>
```

---

## Optional: Background Fetch

[`@transistorsoft/capacitor-background-fetch`](https://github.com/transistorsoft/capacitor-background-fetch) is an optional companion plugin that gives your app a periodic callback in the background — up to once every 15 minutes on both iOS and Android — even when the app has been suspended. This is useful for syncing data, refreshing tokens, or other lightweight background work independent of location tracking.

### Install

```bash
yarn add @transistorsoft/capacitor-background-fetch
npx cap sync
```

Follow the [Android Setup for capacitor-background-fetch](https://github.com/transistorsoft/capacitor-background-fetch/blob/master/help/INSTALL-ANDROID.md) to complete integration.
