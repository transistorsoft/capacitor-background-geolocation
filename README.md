Background Geolocation for Capacitor &middot; [![npm](https://img.shields.io/npm/dm/@transistorsoft/capacitor-background-geolocation.svg)]() [![npm](https://img.shields.io/npm/v/@transistorsoft/capacitor-background-geolocation.svg)]()
============================================================================

[![](https://dl.dropboxusercontent.com/s/nm4s5ltlug63vv8/logo-150-print.png?dl=1)](https://www.transistorsoft.com)

-------------------------------------------------------------------------------

The *most* sophisticated background **location-tracking & geofencing** module with battery-conscious motion-detection intelligence for **iOS** and **Android**.

The plugin's [Philosophy of Operation](../../wiki/Philosophy-of-Operation) is to use **motion-detection** APIs (accelerometer, gyroscope and magnetometer) to detect when the device is *moving* and *stationary*.

- When the device is detected to be **moving**, the plugin automatically starts recording locations according to the configured `distanceFilter` (metres).

- When the device is detected to be **stationary**, the plugin automatically turns off location-services to conserve energy.

Also available for [Flutter](https://github.com/transistorsoft/flutter_background_geolocation), [Cordova](https://github.com/transistorsoft/cordova-background-geolocation-lt), and [React Native](https://github.com/transistorsoft/react-native-background-geolocation).

----------------------------------------------------------------------------

The **[Android module](http://www.transistorsoft.com/shop/products/capacitor-background-geolocation)** requires [purchasing a license](http://www.transistorsoft.com/shop/products/capacitor-background-geolocation). However, it *will* work for **DEBUG** builds — try before you buy.

----------------------------------------------------------------------------

[![Google Play](https://dl.dropboxusercontent.com/s/80rf906x0fheb26/google-play-icon.png?dl=1)](https://play.google.com/store/apps/details?id=com.transistorsoft.backgroundgeolocation.react)

![Home](https://dl.dropboxusercontent.com/s/wa43w1n3xhkjn0i/home-framed-350.png?dl=1)
![Settings](https://dl.dropboxusercontent.com/s/8oad228siog49kt/settings-framed-350.png?dl=1)

> [!IMPORTANT]
> This plugin requires **Capacitor 5** or higher. For Capacitor 4, use the `4.x` version of the plugin.

# Contents
- ### 😫 [Help!](../../wiki/Help)
- ### :books: [API Documentation](https://transistorsoft.github.io/capacitor-background-geolocation/latest)
- ### [Installing the Plugin](#large_blue_diamond-installing-the-plugin)
- ### [Setup Guides](#large_blue_diamond-setup-guides)
- ### [Configure your License](#large_blue_diamond-configure-your-license)
- ### [Using the Plugin](#large_blue_diamond-using-the-plugin)
- ### [Example](#large_blue_diamond-example)
- ### [Debugging](../../wiki/Debugging)
- ### [Example Apps](#large_blue_diamond-example-apps)
- ### [Testing Server](#large_blue_diamond-simple-testing-server)
- ### [Privacy Policy](help/PRIVACY_POLICY.md)

---

## :large_blue_diamond: Installing the Plugin

> [!CAUTION]
> This is the new v9 version.  For previous version, see [`v8.x`](https://github.com/transistorsoft/capacitor-background-geolocation/tree/8.0.1).  __`v8.x`__ license keys do not work with __`v9`__.  Login to the customer dashboard to generate a __`v9`__ key.  See the [Migration Guide](help/MIGRATION-GUIDE-9.0.0.md) for details.

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

### Optional: Background Fetch

[`@transistorsoft/capacitor-background-fetch`](https://github.com/transistorsoft/capacitor-background-fetch) is a companion plugin that provides a periodic background callback — up to once every 15 minutes — even while your app is suspended. It is not required by the geolocation plugin but is a useful add-on for keeping data in sync.

```bash
yarn add @transistorsoft/capacitor-background-fetch
npx cap sync
```

---

## :large_blue_diamond: Setup Guides

### iOS
- [Required iOS Setup](help/INSTALL-IOS.md)

### Android
- [Required Android Setup](help/INSTALL-ANDROID.md)

---

## :large_blue_diamond: Configure your License

> [!NOTE]
> If you have **not** [purchased a license](https://www.transistorsoft.com/shop/products/capacitor-background-geolocation#plans), **skip this step** — the plugin is fully functional in *DEBUG* builds so you can evaluate it first.

Your license is a **JWT** issued by the [Customer Dashboard](https://www.transistorsoft.com/shop/customers). It encodes all the features (*entitlements*) your subscription includes — there is only **one key** regardless of which add-ons you have.

Add your license key to **`android/app/src/main/AndroidManifest.xml`**:

```diff
<manifest xmlns:android="http://schemas.android.com/apk/res/android">
  <application
    android:name=".MainApplication"
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

## :large_blue_diamond: Using the Plugin

```javascript
import BackgroundGeolocation from "@transistorsoft/capacitor-background-geolocation";
```

---

## :large_blue_diamond: Example

There are three main steps to using `BackgroundGeolocation`:
1. Wire up event-listeners.
2. `#ready` the plugin.
3. `#start` the plugin.

> [!WARNING]
> Do not call any API method that requires location-services (e.g. `#getCurrentPosition`, `#watchPosition`, `#start`) until the `#ready` promise resolves.

```javascript
// NO! .ready() has not yet resolved.
BackgroundGeolocation.getCurrentPosition(options);
BackgroundGeolocation.start();

BackgroundGeolocation.ready(config).then((state) => {
  // YES — .ready() has resolved.
  BackgroundGeolocation.getCurrentPosition(options);
  BackgroundGeolocation.start();
});

// NO! .ready() has not yet resolved.
BackgroundGeolocation.getCurrentPosition(options);
BackgroundGeolocation.start();
```

---------------------------------------------------------------------------------------------

### Example — *React*

<img alt="React" width="50px" src="https://hackr.io/tutorials/react/logo-react.svg?ver=1610114789" />

<details>
  <summary>View Source</summary>

```typescript
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonButtons,
  IonToggle,
  IonItemDivider,
  IonLabel
} from '@ionic/react';

import React from "react";

import BackgroundGeolocation, {
  Subscription
} from "@transistorsoft/capacitor-background-geolocation";

const HelloWorld: React.FC = () => {
  const [ready, setReady] = React.useState(false);
  const [enabled, setEnabled] = React.useState(false);
  const [events, setEvents] = React.useState<any[]>([]);

  const addEvent = (name: string, event: any) => {
    setEvents(previous => [...previous, {
      name: name,
      json: JSON.stringify(event, null, 2)
    }]);
  }

  React.useEffect(() => {
    /// 1. Subscribe to events.
    const onLocation: Subscription = BackgroundGeolocation.onLocation((location) => {
      addEvent('onLocation', location);
    });

    const onMotionChange: Subscription = BackgroundGeolocation.onMotionChange((event) => {
      addEvent('onMotionChange', event);
    });

    const onActivityChange: Subscription = BackgroundGeolocation.onActivityChange((event) => {
      addEvent('onActivityChange', event);
    });

    const onProviderChange: Subscription = BackgroundGeolocation.onProviderChange((event) => {
      addEvent('onProviderChange', event);
    });

    /// 2. Ready the plugin.
    BackgroundGeolocation.ready({
      // Geolocation
      desiredAccuracy: BackgroundGeolocation.DESIRED_ACCURACY_HIGH,
      distanceFilter: 10,
      // Activity Recognition
      stopTimeout: 5,
      // Application
      debug: true,              // <-- enable to hear life-cycle sounds
      logLevel: BackgroundGeolocation.LOG_LEVEL_VERBOSE,
      stopOnTerminate: false,   // <-- continue tracking after the app is closed
      startOnBoot: true,        // <-- start tracking when the device boots
    }).then((state) => {
      setReady(true);
      setEnabled(state.enabled);
      addEvent('State', state);
    });

    return () => {
      // Remove subscriptions when the component unmounts (important during
      // live-reload in development to prevent listener accumulation).
      onLocation.remove();
      onMotionChange.remove();
      onActivityChange.remove();
      onProviderChange.remove();
    };
  }, []);

  /// 3. Start / stop BackgroundGeolocation.
  React.useEffect(() => {
    if (!ready) { return; }

    if (enabled) {
      BackgroundGeolocation.start();
    } else {
      BackgroundGeolocation.stop();
      setEvents([]);
    }
  }, [enabled]);

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="end">
            <IonLabel>Toggle to <code>{enabled ? 'stop()' : 'start()'}</code> &mdash;&gt;</IonLabel>
            <IonToggle checked={enabled} onIonChange={e => setEnabled(e.detail.checked)} />
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>
        <div style={{ padding: 10 }}>
          {events.slice().reverse().map((event, i) => (
            <div key={i}>
              <p><strong>{event.name}</strong></p>
              <small><pre><code>{event.json}</code></pre></small>
              <IonItemDivider />
            </div>
          ))}
        </div>
      </IonContent>
    </IonPage>
  );
}
```

</details>

---------------------------------------------------------------------------------------------

### Promise API

The `BackgroundGeolocation` API supports [Promises](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise) for nearly every method. The exceptions are **`#watchPosition`** and the event-listener methods (`onLocation`, `onProviderChange`, etc.). See the [API Documentation](https://transistorsoft.github.io/capacitor-background-geolocation/latest) for full details.

---

## :large_blue_diamond: Example Apps

Two example apps are included in the [`example/`](./example) directory:

| App | Description |
|-----|-------------|
| [`example/basic`](./example/basic) | Minimal getting-started app — configure, toggle tracking, view events. Start here. |
| [`example/advanced`](./example/advanced) | Full-featured reference app with live map, geofence tools, all settings, and Transistor server integration. |

See the [example README](./example/README.md) for setup instructions.

![Home](https://dl.dropboxusercontent.com/s/wa43w1n3xhkjn0i/home-framed-350.png?dl=1)
![Settings](https://dl.dropboxusercontent.com/s/8oad228siog49kt/settings-framed-350.png?dl=1)

---

## :large_blue_diamond: [Simple Testing Server](https://github.com/transistorsoft/background-geolocation-console)

A simple Node-based [web application](https://github.com/transistorsoft/background-geolocation-console) with a SQLite database is available for field-testing and performance analysis. If you're familiar with Node you can have it running in about **one minute**.

![](https://dl.dropboxusercontent.com/s/px5rzz7wybkv8fs/background-geolocation-console-map.png?dl=1)

![](https://dl.dropboxusercontent.com/s/tiy5b2oivt0np2y/background-geolocation-console-grid.png?dl=1)
