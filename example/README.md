# Example Applications

Two example apps are provided, both built with **React + Ionic** and targeting iOS and Android via Capacitor.

---

## [`basic`](./basic)

A minimal getting-started app. It demonstrates the essential plugin lifecycle — configuring the plugin, toggling tracking on/off, and receiving location updates — with as little surrounding code as possible. Start here if you are new to the plugin.

**Features:**
- Plugin configuration with `ready()`
- Enable / disable tracking with a single toggle
- Display incoming locations in a scrollable event log
- Request location permission
- Email the debug log

---

## [`advanced`](./advanced)

A full-featured demo app used internally for QA and as a reference implementation. It connects to the [Transistor GPS Tracking Server](https://tracker.transistorsoft.com) so you can watch your device on a live map in a browser.

**Features:**
- Live Google Map showing location trail, geofences, and current position marker
- Full plugin settings sheet — every configuration option, grouped and editable at runtime
- Geofence tools — draw circular or polygon geofences directly on the map
- FAB action menu: sync locations, destroy database, reset odometer, watch position, request permission, email log
- `BackgroundFetch` integration for periodic background work on iOS
- Transistor server registration and authorization token management

---

## Getting Started

Each app is self-contained. From either directory:

```bash
npm install
npx cap sync
```

Then open the native project:

```bash
npx cap open ios      # Xcode
npx cap open android  # Android Studio
```

On first launch you will be prompted to register with a username and organisation name. This creates an account on the [Transistor tracking server](https://tracker.transistorsoft.com) so the app has a valid `url` to post locations to.
