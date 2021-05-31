# iOS Setup Instructions (Required)

:information_source: Use `yarn` or `npm` as desired.

```
npm install @transistorsoft/capacitor-background-geolocation
npx cap sync
```

## Configure Background Capabilities

Open your App in **XCode** and select the root of your project.  Select **Capabilities** tab.  Enable **Background Modes** and enable the following modes:

- [x] Location updates
- [x] Background fetch
- [x] Audio (**optional for debug-mode sound FX**, see API docs [Config.debug](https://transistorsoft.github.io/capacitor-background-geolocation/interfaces/config.html#debug)

![](https://dl.dropboxusercontent.com/s/a4xieyd0h38xklu/Screenshot%202016-09-22%2008.12.51.png?dl=1)

## Configure Usage Strings in `Info.plist`

Edit **`Info.plist`**.  Add the following items (Set **Value** as desired):

| Key | Type | Value |
|-----|-------|-------------|
| *Privacy - Location Always and When in Use Usage Description* | `String` | *CHANGEME: Location required in background* |
| *Privacy - Location When in Use Usage Description* | `String` | *CHANGEME: Location required when app is in use* |
| *Privacy - Motion Usage Description* | `String` | *CHANGEME: Motion permission helps detect when device in in-motion* |

![](https://dl.dropboxusercontent.com/s/j7udsab7brlj4yk/Screenshot%202016-09-22%2008.33.53.png?dl=1)


## [Configure `capacitor-background-fetch`](https://github.com/transistorsoft/capacitor-background-fetch/blob/master/docs/INSTALL-IOS.md#configure-background-capabilities)

The BackgroundGeolocation SDK makes use internally on __`capacitor-background-fetch`__.  Regardless of whether you instend to implement the `BackgroundFetch` Javascript API in your app, you **must** perform the [Background Fetch iOS Setup](https://github.com/transistorsoft/capacitor-background-fetch/blob/master/docs/INSTALL-IOS.md#configure-background-capabilities) at __`capacitor-background-fetch`__.
