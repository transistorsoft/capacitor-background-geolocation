
import { Storage } from '@capacitor/storage';

const APP_SETTINGS = [

  {name: 'geofenceRadius', defaultValue: 200},
  {name: 'geofenceNotifyOnEntry', defaultValue: true},
  {name: 'geofenceNotifyOnExit', defaultValue: false},
  {name: 'geofenceNotifyOnDwell', defaultValue: false},
  {name: 'geofenceLoiteringDelay', defaultValue: 30000},
  {name: 'mapHideMarkers', defaultValue: false},
  {name: 'mapHidePolyline', defaultValue: false},
  {name: 'mapHideGeofenceHits', defaultValue: false},
  {name: 'email', defaultValue: null}
];

const GEOFENCE_RADIUS_OPTIONS = [50, 100, 150, 200, 500, 1000];
const GEOFENCE_LOITERING_DELAY_OPTIONS = [1*1000, 10*1000, 30*1000, 60*1000, 5*60*1000];

////
// Normally once wouldn't include the plugin like this.  It's done to allow me to
// easily switch between importing the npm vs paid version by editing a single file.
//
import BackgroundGeolocation, {TransistorAuthorizationToken} from "@transistorsoft/capacitor-background-geolocation";

import {ENV} from "../../../config/ENV";

let instance:any = null;

export default class SettingsService {

  public applicationState:any;
  private myState:any;
  public geofenceRadiusOptions: any;
  public geofenceLoiteringDelayOptions: any;

  static getInstance() {
    if (instance === null) {
      instance = new SettingsService();
    }
    return instance;
  }

  constructor() {
    this.geofenceRadiusOptions = GEOFENCE_RADIUS_OPTIONS;
    this.geofenceLoiteringDelayOptions = GEOFENCE_LOITERING_DELAY_OPTIONS;

    this.applicationState = {};

    this.init();

  }

  async init() {
    Storage.get({key: 'settings'}).then((result) => {
      if (result.value) {
        this.loadState(result.value);
      } else {
        APP_SETTINGS.forEach((setting) => {
          this.applicationState[setting.name] = setting.defaultValue;
        });
        this.saveState();
      }
    });
  }

  getApplicationState() {
    return this.applicationState;
  }

  onChange(name:string) {
    if (this.myState[name] === this.applicationState[name]) {
      return;
    }
    this.saveState();
    /**
    * TODO
    this.events.publish('change', name, this.applicationState[name]);
    */
  }

  set(name:string, value:any) {
    if (!this.applicationState.hasOwnProperty(name)) {
      console.warn("SettingsService#set: Unknown property ", name);
      return;
    }
    if (this.myState[name] === value) {
      return;
    }
    this.applicationState[name] = value;
    this.saveState();
    /**
    * TODO

    this.events.publish('change', name, value);

    */
  }

  get(name:string) {
    if (this.applicationState.hasOwnProperty(name)) {
      return this.applicationState[name];
    } else {
      return null;
    }
  }

  async toast(message:string, result?:any, duration?:number) {
    if (typeof(result) !== undefined) {
      message = message.replace("\{result\}", result)
    }
    /* TODO
    let toast = await this.toastCtrl.create({
      message: message,
      duration: duration || 3000
    });
    toast.present();
    */
  }

  async confirm(title:string, message:string, callback:Function) {
    /* TODO
    let alert = await this.alertCtrl.create({
      header: title,
      message: message,
      buttons: [{
        text: 'Cancel',
        role: 'cancel',
        handler: () => {}
      }, {
        text: 'Confirm',
        handler: callback
      }]
    });
    alert.present();
    */
  }

  /**
  * Subscribe to BGService events
  */
  on(event:string, callback:Function) {
    /**
    * TODO
    this.events.subscribe(event, callback);

    */
  }

  /**
  * My private test config.
  * DO NOT USE
  * @private
  */
  async applyTestConfig() {

    let geofences = [{
      "identifier": "[Capacitor] Home",
      "radius": 200.0,
      "latitude": 45.51872221233045,
      "longitude": -73.60041976465013,
      "notifyOnEntry": true,
      "notifyOnExit": true,
      "notifyOnDwell": true,
      "loiteringDelay": 60000,
      "extras": {
        "radius": 200,
        "center": {
          "latitude": 45.51872221233045,
          "longitude": -73.60041976465013,
        }
      }
    }, {
      "identifier": "[Capacitor] Parc Outremont",
      "radius": 200.0,
      "latitude": 45.51791915253888,
      "longitude": -73.60480434117284,
      "notifyOnEntry": true,
      "notifyOnExit": true,
      "notifyOnDwell": true,
      "loiteringDelay": 60000,
      "extras": {
        "radius": 200,
        "center": {
          "latitude": 45.51791915253888,
          "longitude": -73.60480434117284,
        }
      }
    }, {
      "identifier": "[Capacitor] 5 Saison",
      "radius": 200.0,
      "latitude": 45.52193435702239,
      "longitude": -73.60793815706307,
      "notifyOnEntry": true,
      "notifyOnExit": true,
      "notifyOnDwell": true,
      "loiteringDelay": 0,
      "extras": {
        "radius": 200,
        "center": {
          "latitude": 45.52193435702239,
          "longitude": -73.60793815706307,
        }
      }
    }, {
      "identifier": "[Capacitor] Laj",
      "radius": 200.0,
      "latitude": 45.52011166353691,
      "longitude": -73.61188565687189,
      "notifyOnEntry": true,
      "notifyOnExit": true,
      "notifyOnDwell": true,
      "loiteringDelay": 0,
      "extras": {
        "radius": 200,
        "center": {
          "latitude": 45.52011166353691,
          "longitude": -73.61188565687189
        }
      }
    }, {
      "identifier": "[Capacitor] Park Beaubien",
      "radius": 200.0,
      "latitude": 45.51536622906458,
      "longitude": -73.60916110960558,
      "notifyOnEntry": true,
      "notifyOnExit": true,
      "notifyOnDwell": false,
      "loiteringDelay": 0,
      "extras": {
        "radius": 200,
        "center": {
          "latitude": 45.51536622906458,
          "longitude": -73.60916110960558
        }
      }
    }, {
      "identifier": "[Capacitor] Parc & Fairmount",
      "radius": 200.0,
      "latitude": 45.5204308608878,
      "longitude": -73.59730225310089,
      "notifyOnEntry": true,
      "notifyOnExit": true,
      "notifyOnDwell": true,
      "loiteringDelay": 60000,
      "extras": {
        "radius": 200,
        "center": {
          "latitude": 45.5204308608878,
          "longitude": -73.59730225310089
        }
      }
    }, {
      "identifier": "[Capacitor] Parc Couches Tard",
      "radius": 200.0,
      "latitude": 45.51744539760233,
      "longitude": -73.5908963928221,
      "notifyOnEntry": true,
      "notifyOnExit": true,
      "notifyOnDwell": false,
      "loiteringDelay": 0,
      "extras": {
        "radius": 200,
        "center": {
          "latitude": 45.51744539760233,
          "longitude": -73.5908963928221
        }
      }
    }, {
      "identifier": "[Capacitor] Laurier & Côtes Saint Catherines",
      "radius": 200.0,
      "latitude": 45.51602235252262,
      "longitude": -73.59890979915006,
      "notifyOnEntry": true,
      "notifyOnExit": true,
      "notifyOnDwell": false,
      "loiteringDelay": 60000,
      "extras": {
        "radius": 200,
        "center": {
          "latitude": 45.51602235252262,
          "longitude": -73.59890979915006,
        }
      }
    }, {
      "identifier": "[Capacitor] Mountain 1",
      "radius": 200.0,
      "latitude": 45.51339446482965,
      "longitude": -73.5890430151955,
      "notifyOnEntry": true,
      "notifyOnExit": true,
      "notifyOnDwell": false,
      "loiteringDelay": 60000,
      "extras": {
        "radius": 200,
        "center": {
          "latitude": 45.51339446482965,
          "longitude": -73.5890430151955
        }
      }
    }, {
      "identifier": "[Capacitor] Mountain 2",
      "radius": 200.0,
      "latitude": 45.511936585973096,
      "longitude": -73.59662309075495,
      "notifyOnEntry": true,
      "notifyOnExit": true,
      "notifyOnDwell": false,
      "loiteringDelay": 60000,
      "extras": {
        "radius": 200,
        "center": {
          "latitude": 45.511936585973096,
          "longitude": -73.59662309075495
        }
      }
    }, {
      "identifier": "[Capacitor] Mountain 3",
      "radius": 200.0,
      "latitude": 45.50873361477508,
      "longitude": -73.59089814860727,
      "notifyOnEntry": true,
      "notifyOnExit": true,
      "notifyOnDwell": false,
      "loiteringDelay": 60000,
      "extras": {
        "radius": 200,
        "center": {
          "latitude": 45.50873361477508,
          "longitude": -73.59089814860727
        }
      }
    }, {
      "identifier": "[Capacitor] Mountain 4",
      "radius": 200.0,
      "latitude": 45.50414694296492,
      "longitude": -73.5916710539562,
      "notifyOnEntry": true,
      "notifyOnExit": true,
      "notifyOnDwell": false,
      "loiteringDelay": 60000,
      "extras": {
        "radius": 200,
        "center": {
          "latitude": 45.50414694296492,
          "longitude": -73.5916710539562
        }
      }
    }, {
      "identifier": "[Capacitor] Mountain 5",
      "radius": 200.0,
      "latitude": 45.50491473767328,
      "longitude": -73.58654527405864,
      "notifyOnEntry": true,
      "notifyOnExit": true,
      "notifyOnDwell": false,
      "loiteringDelay": 60000,
      "extras": {
        "radius": 200,
        "center": {
          "latitude": 45.50491473767328,
          "longitude": -73.58654527405864
        }
      }
    }, {
      "identifier": "[Capacitor] Mountain Lake",
      "radius": 200.0,
      "latitude": 45.49860916086097,
      "longitude": -73.59621565704647,
      "notifyOnEntry": true,
      "notifyOnExit": true,
      "notifyOnDwell": false,
      "loiteringDelay": 60000,
      "extras": {
        "radius": 200,
        "center": {
          "latitude": 45.49860916086097,
          "longitude": -73.59621565704647
        }
      }
    }, {
      "identifier": "[Capacitor] Park JFK",
      "radius": 200.0,
      "latitude": 45.52135522992923,
      "longitude": -73.61568446341691,
      "notifyOnEntry": true,
      "notifyOnExit": true,
      "notifyOnDwell": false,
      "loiteringDelay": 60000,
      "extras": {
        "radius": 200,
        "center": {
          "latitude": 45.52135522992923,
          "longitude": -73.61568446341691
        }
      }
    }, {
      "identifier": "[Capacitor] Rope Park",
      "radius": 200.0,
      "latitude": 45.51335215591131,
      "longitude": -73.58016477295465,
      "notifyOnEntry": true,
      "notifyOnExit": true,
      "notifyOnDwell": true,
      "loiteringDelay": 60000,
      "extras": {
        "radius": 200,
        "center": {
          "latitude": 45.51335215591131,
          "longitude": -73.58016477295465
        }
      }
    }, {
      "identifier": "[Capacitor] Cafe Union",
      "radius": 200.0,
      "latitude": 45.5332674993574,
      "longitude": -73.61939297593483,
      "notifyOnEntry": true,
      "notifyOnExit": true,
      "notifyOnDwell": true,
      "loiteringDelay": 60000,
      "extras": {
        "radius": 200,
        "center": {
          "latitude": 45.5332674993574,
          "longitude": -73.61939297593483
        }
      }
    }, {
      "identifier": "[Capacitor] Park Laurier",
      "radius": 200.0,
      "latitude": 45.53237479609443,
      "longitude": -73.58741778627864,
      "notifyOnEntry": true,
      "notifyOnExit": true,
      "notifyOnDwell": true,
      "loiteringDelay": 60000,
      "extras": {
        "radius": 200,
        "center": {
          "latitude": 45.53237479609443,
          "longitude": -73.58741778627864,
        }
      }
    }];

    await BackgroundGeolocation.removeGeofences();
    await BackgroundGeolocation.addGeofences(geofences);
    await BackgroundGeolocation.resetOdometer();

    const orgname = (await Storage.get({key: 'orgname'})).value!;
    const username = (await Storage.get({key: 'username'})).value!;
    let token:TransistorAuthorizationToken = await BackgroundGeolocation.findOrCreateTransistorAuthorizationToken(
      orgname,
      username,
      ENV.TRACKER_HOST
    );

    await BackgroundGeolocation.reset({
      debug: true,
      logLevel: BackgroundGeolocation.LOG_LEVEL_VERBOSE,
      desiredAccuracy: BackgroundGeolocation.DESIRED_ACCURACY_HIGH,
      distanceFilter: 50,
      disableElasticity: false,
      locationUpdateInterval: 1000,
      fastestLocationUpdateInterval: -1,
      stopTimeout: 1,
      motionTriggerDelay: 30000,
      transistorAuthorizationToken: token,
      backgroundPermissionRationale: {
        title: "Allow {applicationName} to access this device's location even when the app is closed or not in use.",
        message: "This app collects location data to enable recording your trips to work and calculate distance-travelled.",
        positiveAction: 'Change to "{backgroundPermissionOptionLabel}"',
        negativeAction: 'Cancel'
      },
      schedule: [
        //'2-6 09:00-17:00'
      ],
      scheduleUseAlarmManager: true,
      maxDaysToPersist: 14,
      geofenceModeHighAccuracy: true,
      stopOnTerminate: false,
      startOnBoot: true,
      enableHeadless: true,
      heartbeatInterval: -1
    });
  }

  private loadState(json:string) {
    this.applicationState = JSON.parse(json);
    let invalid = false;
    APP_SETTINGS.forEach((setting) => {
      if (!this.applicationState.hasOwnProperty(setting.name)) {
        this.applicationState[setting.name] = setting.defaultValue;
        invalid = true;
      }
    });
    if (!invalid) { this.saveState(); }

    this.myState = Object.assign({}, this.applicationState);
  }
  private saveState() {
    Storage.set({key: 'settings', value: JSON.stringify(this.applicationState, null)});
    this.myState = Object.assign({}, this.applicationState);
  }
}
