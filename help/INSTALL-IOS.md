# iOS Setup

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

## Configure Background Capabilities

Open your app in **Xcode** and select the root of your project. Select the **Signing & Capabilities** tab. Click **+ Capability** and add **Background Modes**, then enable the following:

- [x] Location updates
- [x] Background fetch
- [x] Audio *(optional — enables debug-mode sound effects, see [`Config.debug`](https://transistorsoft.github.io/capacitor-background-geolocation/interfaces/config.html#debug))*

![](https://dl.dropboxusercontent.com/s/a4xieyd0h38xklu/Screenshot%202016-09-22%2008.12.51.png?dl=1)

## Configure Usage Strings in `Info.plist`

Edit **`Info.plist`** and add the following keys (set the *Value* strings to match your app's actual usage):

| Key | Type | Value |
|-----|------|-------|
| *Privacy - Location Always and When in Use Usage Description* | `String` | *CHANGEME: Location is required in the background* |
| *Privacy - Location When in Use Usage Description* | `String` | *CHANGEME: Location is required while the app is in use* |
| *Privacy - Motion Usage Description* | `String` | *CHANGEME: Motion detection helps determine when the device is moving* |

![](https://dl.dropboxusercontent.com/scl/fi/dh0sen3wxsgp1hox41le0/iOS-permissions-plist.png?rlkey=i3fipjdcpu7p1eez4mapukkpl&dl=1)

## Configure Your License

> [!NOTE]
> If you've **not** [purchased a license](https://www.transistorsoft.com/shop/products/capacitor-background-geolocation#plans), **ignore this step** &mdash; the plugin is fully functional in *DEBUG* builds so you can try before you [buy](https://www.transistorsoft.com/shop/products/jcapacitor-background-geolocation#plans).

In your __`Info.plist`__, add the following key: 

|      Key     |     Type     |     Value     |
|-----|-------|-------------|
| *`TSLocationManagerLicense`* | `String` | `                    <PASTE YOUR LICENSE KEY HERE>                     ` |

## Optional: Background Fetch

[`@transistorsoft/capacitor-background-fetch`](https://github.com/transistorsoft/capacitor-background-fetch) is an optional companion plugin that gives your app a periodic callback in the background — up to once every 15 minutes — even while the app is suspended. This is useful for syncing data, refreshing tokens, or other lightweight background work independent of location tracking.

### Install

```bash
yarn add @transistorsoft/capacitor-background-fetch
npx cap sync
```

Follow the [iOS Setup for capacitor-background-fetch](https://github.com/transistorsoft/capacitor-background-fetch/blob/master/help/INSTALL-IOS.md#configure-background-capabilities) to complete integration.
