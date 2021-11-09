# Demo App with *React*.

<img alt="alt_text" width="160px" src="https://dl.dropbox.com/s/ue81af5g3y4tppb/react-logo.svg?dl=1" />

![Home](https://dl.dropboxusercontent.com/s/byaayezphkwn36h/home-framed-350.png?dl=1)
![Settings](https://dl.dropboxusercontent.com/s/8lvnpp0gowitagq/settings-framed-350.png?dl=1)

## Installation

- First clone the plugin repo.

```console
git clone https://github.com/transistorsoft/capacitor-background-geolocation.git
cd capacitor-background-geolocation
```

- Now compile the plugin's typescript source code.

```console
npm install
npm run build
```

:information_source: Ignore warning `(!) this has been rewritten to undefined`

- Now install the `/example/react` as you would any Capacitor app.

```console
cd example/react
npm install

npm run build
npx cap sync
```

- Now run it:

```console
ionic capacitor run android
ionic capacitor run ios
```

- The quickest way to see the plugin in-action is to boot the **iOS** simulator and *simulate location* with *Freeway Drive*.

- The demo is composed of three separate and independent sub-applications:
	- [Hello World](./src/pages/hello-world/)
	- [Advanced](./src/pages/advanced) (with complex settings screen and geofencing.)

![](https://dl.dropboxusercontent.com/s/w87uylrgij9kd7r/ionic-demo-home.png?dl=1)

## :large_blue_diamond: Tracking Server

The demo app is configured to post locations to Transistor Software's demo server, which hosts a web-application for visualizing and filtering your tracking on a map.

- After booting the app the first time, you'll be asked to enter a **unique** "Tracking Server Username" (eg: Github username) so the plugin can post locations to `tracker.transistorsoft.com`.

:warning: Make your username **unique** and known only to *you* &mdash; if every one uses *"test"*, you'll never find your device!)

![](https://dl.dropboxusercontent.com/s/yhb311q5shxri36/ionic-demo-username.png?dl=1)

- You can view the plugin's tracking history by visiting [http://tracker.transistorsoft.com/username](http://tracker.transistorsoft.com/username).

![](https://dl.dropboxusercontent.com/s/1a4far51w70rjvj/Screenshot%202017-08-16%2011.34.43.png?dl=1)

## Adding Geofences

The app implements a **long-press** event on the map.  Simply **tap & hold** the map to initiate adding a geofence.

![Tap-hold to add geofence](https://dl.dropboxusercontent.com/s/9qif3rvznwkbphd/Screenshot%202015-06-06%2017.12.41.png?dl=1)

Enter an `identifier`, `radius`, `notifyOnExit`, `notifyOnEntry`.

