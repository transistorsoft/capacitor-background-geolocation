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
    targetSdkVersion = 30   // Or higher
    .
    .
    .
+   compileSdkVersion = 31  // Or higher
+   // capacitor-background-geolocation variables
+   googlePlayServicesLocationVersion = '20.0.0'
}
```

A number of other **`ext`** variables are available but should generally not need to be modified.

| Option             | Default     | Description |
|--------------------|------------|--------------|
|`googlePlayServicesLocationVersion`  | `19.0.1` | `com.google.android.gms:play-services-location` |
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

allprojects {
    repositories {
        google()
        mavenCentral()

+       // capacitor-background-geolocation
+       maven {
+         url("${project(':transistorsoft-capacitor-background-geolocation').projectDir}/libs")
+       }
+       // capacitor-background-fetch
+       maven {
+         url("${project(':transistorsoft-capacitor-background-fetch').projectDir}/libs")
+       }
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

