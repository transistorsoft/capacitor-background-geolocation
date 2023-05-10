Background Geolocation for Capacitor &middot; [![npm](https://img.shields.io/npm/dm/@transistorsoft/capacitor-background-geolocation.svg)]() [![npm](https://img.shields.io/npm/v/@transistorsoft/capacitor-background-geolocation.svg)]()
============================================================================

[![](https://dl.dropboxusercontent.com/s/nm4s5ltlug63vv8/logo-150-print.png?dl=1)](https://www.transistorsoft.com)

-------------------------------------------------------------------------------

The *most* sophisticated background **location-tracking & geofencing** module with battery-conscious motion-detection intelligence for **iOS** and **Android**.

The plugin's [Philosophy of Operation](../../wiki/Philosophy-of-Operation) is to use **motion-detection** APIs (using accelerometer, gyroscope and magnetometer) to detect when the device is *moving* and *stationary*.

- When the device is detected to be **moving**, the plugin will *automatically* start recording a location according to the configured `distanceFilter` (meters).

- When the device is detected be **stationary**, the plugin will automatically turn off location-services to conserve energy.

Also available for [Flutter](https://github.com/transistorsoft/flutter_background_geolocation), [Cordova](https://github.com/transistorsoft/cordova-background-geolocation-lt), and [React Native](https://github.com/transistorsoft/capacitor-background-geolocation).

----------------------------------------------------------------------------

The **[Android module](http://www.transistorsoft.com/shop/products/capacitor-background-geolocation)** requires [purchasing a license](http://www.transistorsoft.com/shop/products/capacitor-background-geolocation).  However, it *will* work for **DEBUG** builds.  It will **not** work with **RELEASE** builds [without purchasing a license](http://www.transistorsoft.com/shop/products/capacitor-background-geolocation).

(2018) This plugin is supported **full-time** and field-tested **daily** since 2013.

----------------------------------------------------------------------------

[![Google Play](https://dl.dropboxusercontent.com/s/80rf906x0fheb26/google-play-icon.png?dl=1)](https://play.google.com/store/apps/details?id=com.transistorsoft.backgroundgeolocation.react)

![Home](https://dl.dropboxusercontent.com/s/wa43w1n3xhkjn0i/home-framed-350.png?dl=1)
![Settings](https://dl.dropboxusercontent.com/s/8oad228siog49kt/settings-framed-350.png?dl=1)

> ### :rotating_light: This plugin requires Capacitor 5 :rotating_light:
>
> For Capacitor 4, use the 4.x version of the plugin.

# Contents
- ### 😫 [Help!](../../wiki/Help)
- ### :books: [API Documentation](https://transistorsoft.github.io/capacitor-background-geolocation)
- ### [Installing the Plugin](#large_blue_diamond-installing-the-plugin)
- ### [Setup Guides](#large_blue_diamond-setup-guides)
- ### [Configure your License](#large_blue_diamond-configure-your-license)
- ### [Using the plugin](#large_blue_diamond-using-the-plugin)
- ### [Example](#large_blue_diamond-example)
- ### [Debugging](../../wiki/Debugging)
- ### [Demo Application](#large_blue_diamond-demo-application)
- ### [Testing Server](#large_blue_diamond-simple-testing-server)
- ### [Privacy Policy](help/PRIVACY_POLICY.md)

## :large_blue_diamond: Installing the Plugin

:warning: Capacitor 3+ required.

### With `yarn`

```bash
$ yarn add @transistorsoft/capacitor-background-geolocation
$ yarn add @transistorsoft/capacitor-background-fetch
$ npx cap sync
```

### With `npm`
```console
$ npm install @transistorsoft/capacitor-background-geolocation --save
$ npm install @transistorsoft/capacitor-background-fetch --save
$ npx cap sync
```

## :large_blue_diamond: Setup Guides

### iOS
- [Required iOS Setup](help/INSTALL-IOS.md)

### Android
- [Required Android Setup](help/INSTALL-ANDROID.md)


## :large_blue_diamond: Configure your license

1. Login to Customer Dashboard to generate an application key:
[www.transistorsoft.com/shop/customers](http://www.transistorsoft.com/shop/customers)
![](https://gallery.mailchimp.com/e932ea68a1cb31b9ce2608656/images/b2696718-a77e-4f50-96a8-0b61d8019bac.png)

2. Add your license-key to `android/app/src/main/AndroidManifest.xml`:

```diff
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.transistorsoft.backgroundgeolocation.react">

  <application
    android:name=".MainApplication"
    android:allowBackup="true"
    android:label="@string/app_name"
    android:icon="@mipmap/ic_launcher"
    android:theme="@style/AppTheme">

    <!-- capacitor-background-geolocation licence -->
+     <meta-data android:name="com.transistorsoft.locationmanager.license" android:value="YOUR_LICENCE_KEY_HERE" />
    .
    .
    .
  </application>
</manifest>
```

## :large_blue_diamond: Using the plugin ##

```javascript
import BackgroundGeolocation from "@transistorsoft/capacitor-background-geolocation";
```

## :large_blue_diamond: Example

There are three main steps to using `BackgroundGeolocation`
1. Wire up event-listeners.
2. `#ready` the plugin.
3. `#start` the plugin.

:warning: Do not execute *any* API method which will require accessing location-services until the callback to **`#ready`** executes (eg: `#getCurrentPosition`, `#watchPosition`, `#start`).


```javascript
// NO!  .ready() has not resolved.
BackgroundGeolocation.getCurrentPosition(options);
BackgroundGeolocation.start();

BackgroundGeolocation.ready(config).then((state) => {
  // YES -- .ready() has now resolved.
  BackgroundGeolocation.getCurrentPosition(options);
  BackgroundGeolocation.start();  
});

// NO!  .ready() has not resolved.
BackgroundGeolocation.getCurrentPosition(options);
BackgroundGeolocation.start();
```
---------------------------------------------------------------------------------------------

### Example 1. &mdash; *React*

<img alt="alt_text" width="50px" src="https://hackr.io/tutorials/react/logo-react.svg?ver=1610114789" />

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

  const addEvent = (name: string, event:any) => {
    setEvents(previous => [...previous, {
      name: name,
      json: JSON.stringify(event, null, 2)
    }]);
  }

  React.useEffect(() => {
    /// 1.  Subscribe to events.
    const onLocation:Subscription = BackgroundGeolocation.onLocation((location) => {
      addEvent('onLocation', location);
    })

    const onMotionChange:Subscription = BackgroundGeolocation.onMotionChange((event) => {
      addEvent('onMotionChange', event);
    });

    const onActivityChange:Subscription = BackgroundGeolocation.onActivityChange((event) => {
      addEvent('onActivityChange', event);
    })

    const onProviderChange:Subscription = BackgroundGeolocation.onProviderChange((event) => {
      addEvent('onProviderChange', event);
    })

    /// 2. ready the plugin.
    BackgroundGeolocation.ready({
      // Geolocation Config
      desiredAccuracy: BackgroundGeolocation.DESIRED_ACCURACY_HIGH,
      distanceFilter: 10,
      // Activity Recognition
      stopTimeout: 5,
      // Application config
      debug: true, // <-- enable this hear sounds for background-geolocation life-cycle.
      logLevel: BackgroundGeolocation.LOG_LEVEL_VERBOSE,
      stopOnTerminate: false,   // <-- Allow the background-service to continue tracking when user closes the app.
      startOnBoot: true,        // <-- Auto start tracking when device is powered-up.
    }).then((state) => {
      setReady(true);
      setEnabled(state.enabled)
      addEvent('State', state);
    });

    return () => {
      // Remove BackgroundGeolocation event-subscribers when the View is removed or refreshed
      // during development live-reload.  Without this, event-listeners will accumulate with
      // each refresh during live-reload.
      onLocation.remove();
      onMotionChange.remove();
      onActivityChange.remove();
      onProviderChange.remove();
    }
  }, []);

  /// 3. start / stop BackgroundGeolocation
  React.useEffect(() => {
    if (!ready) { return }

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
            <IonLabel>Toggle to <code>{(enabled ? 'stop()' : 'start()')}</code> &mdash;&gt;</IonLabel>
            <IonToggle checked={enabled} onIonChange={e => setEnabled(e.detail.checked)}/>
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>
        <div style={{padding:10}}>
        { events.slice().reverse().map((event, i) => (
          <div key={i}>
            <p><strong>{event.name}</strong></p>
            <small><pre><code>{event.json}</code></pre></small>
            <IonItemDivider />
          </div>
        ))}
        </div>
      </IonContent>
    </IonPage>
  )
}
```

</details>

---------------------------------------------------------------------------------------------

### Example 2. &mdash; *Angular*

<img alt="alt_text" width="55px" src="https://dl.dropbox.com/s/w4hw88clxqmlis2/angular-logo.svg?dl=1" />

<details>
  <summary>View Source</summary>

```typescript
import {
  Component, 
  NgZone,
  OnDestroy
} from '@angular/core'

import BackgroundGeolocation, {
  Location,
  Subscription
} from "@transistorsoft/capacitor-background-geolocation";

@Component({
  selector: 'hello-world',
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="end">
          <ion-label>Toggle to <code>{{(enabled ? 'stop()' : 'start()')}}</code> &mdash;&gt;</ion-label>
          <ion-toggle [(ngModel)]="enabled" (ionChange)="onToggleEnabled()" style="display:block;"></ion-toggle>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content fullscreen>
      <div *ngFor="let event of events.slice().reverse()" style="padding:10px">
        <div>
          <p><strong>{{event.name}}</strong></p>
          <small><pre><code>{{event.json}}</code></pre></small>
          <ion-item-divider></ion-item-divider>
        </div>
      </div>
    </ion-content>
  `,
  styles: []
})

export class HelloWorldPage implements OnDestroy {
  ready:boolean = false;
  enabled:boolean = false;
  events:any = [];
  subscriptions:Subscription[] = [];

  constructor(private zone:NgZone) {}

  /// WARNING:  DO NOT Use ionViewWillEnter to configure the SDK -- use ngAfterContentInit.  
  /// ionViewWillEnter only executes when the app is brought to the foreground.  
  /// It will NOT execute when the app is launched in the background, as the SDK will often do.
  /// 
  ngAfterContentInit() {
    /// Step 1:  Subscribe to BackgroundGeolocation events.
    this.subscriptions.push(BackgroundGeolocation.onLocation((location) => {
      this.addEvent('onLocation', location);
    }))

    this.subscriptions.push(BackgroundGeolocation.onMotionChange((event) => {
      this.addEvent('onMotionChange', event);
    }))

    this.subscriptions.push(BackgroundGeolocation.onActivityChange((event) => {
      this.addEvent('onActivityChange', event);
    }))

    this.subscriptions.push(BackgroundGeolocation.onProviderChange((event) => {
      this.addEvent('onProviderChange', event);
    }))

    /// Step 2:  Ready the plugin.
    BackgroundGeolocation.ready({
      // Geolocation Config
      desiredAccuracy: BackgroundGeolocation.DESIRED_ACCURACY_HIGH,
      distanceFilter: 10,
      // Activity Recognition
      stopTimeout: 5,
      // Application config
      debug: true, // <-- enable this hear sounds for background-geolocation life-cycle.
      logLevel: BackgroundGeolocation.LOG_LEVEL_VERBOSE,
      stopOnTerminate: false,   // <-- Allow the background-service to continue tracking when user closes the app.
      startOnBoot: true,        // <-- Auto start tracking when device is powered-up.
    }).then((state) => {
      // BackgroundGeolocation is now ready to use.
      this.ready = true;
      this.enabled = state.enabled;
      this.addEvent('State', state);
    });
  }

  /// When view is destroyed, be sure to .remove() all BackgroundGeolocation
  /// event-subscriptions.
  ngOnDestroy() {
    this.subscriptions.forEach((subscription:Subscription) => {
      subscription.remove();
    })
  }

  /// Add an event to the view.
  addEvent(name:string, event:any) {
    this.zone.run(() => {
      this.events.push({
        name: name, 
        json: JSON.stringify(event, null, 2)
      })  
    })    
  }

  /// Toggle the plugin on/off.
  onToggleEnabled() {
    if (!this.ready) { return }

    this.events = [];
    if (this.enabled) {
      BackgroundGeolocation.start().then((state) => {
        this.addEvent('State', state);
      })
    } else {
      BackgroundGeolocation.stop().then((state) => {
        this.addEvent('State', state);
      })
    }
  }
}
```

</details>

---------------------------------------------------------------------------------------------

### Promise API

The `BackgroundGeolocation` Javascript API supports [Promises](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise) for *nearly* every method (the exceptions are **`#watchPosition`** and adding event-listeners via **`onXXX`** methods (eg: `onLocation`, `onProviderChange`).  For more information, see the [API Documentation](https://transistorsoft.github.io/capacitor-background-geolocation)


## :large_blue_diamond: [Demo Application](./example)

A fully-featured [Demo App](./example) is available in this repo, for both *React* and *Angular*.  After first cloning this repo, follow the installation instructions in the [README](./example/README.md) there.  This demo-app includes an advanced settings-screen allowing you to quickly experiment with all the different settings available for each platform.

![Home](https://dl.dropboxusercontent.com/s/wa43w1n3xhkjn0i/home-framed-350.png?dl=1)
![Settings](https://dl.dropboxusercontent.com/s/8oad228siog49kt/settings-framed-350.png?dl=1)


## :large_blue_diamond: [Simple Testing Server](https://github.com/transistorsoft/background-geolocation-console)

A simple Node-based [web-application](https://github.com/transistorsoft/background-geolocation-console) with SQLite database is available for field-testing and performance analysis.  If you're familiar with Node, you can have this server up-and-running in about **one minute**.

![](https://dl.dropboxusercontent.com/s/px5rzz7wybkv8fs/background-geolocation-console-map.png?dl=1)

![](https://dl.dropboxusercontent.com/s/tiy5b2oivt0np2y/background-geolocation-console-grid.png?dl=1)

