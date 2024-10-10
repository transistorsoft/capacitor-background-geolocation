
import {
  registerPlugin,
  PluginListenerHandle,
  PluginResultError
} from '@capacitor/core';

const NativeModule:any = registerPlugin('BackgroundGeolocation');

import Logger from "./Logger";
import TransistorAuthorizationToken from "./TransistorAuthorizationToken";
import DeviceSettings from "./DeviceSettings";
import {Events} from "./Events";

const TAG               = "TSLocationManager";

/// Container for event-subscriptions.
let EVENT_SUBSCRIPTIONS:any = [];

/// Container for watchPostion subscriptions.
let WATCH_POSITION_SUBSCRIPTIONS:any = [];

/// Event handler Subscription
///
class Subscription {
  event:string;
  subscription: PluginListenerHandle;
  callback:Function;

  constructor(event:string, subscription:any, callback:Function) {
    this.event = event;
    this.subscription = subscription;
    this.callback = callback;
  }
}


/// Validate provided config for #ready, #setConfig, #reset.
const validateConfig = (config:any) => {
  // Detect obsolete notification* fields and re-map to Notification instance.
  if (
    (config.notificationPriority) ||
    (config.notificationText) ||
    (config.notificationTitle) ||
    (config.notificationChannelName) ||
    (config.notificationColor) ||
    (config.notificationSmallIcon) ||
    (config.notificationLargeIcon)
  ) {
    console.warn('[BackgroundGeolocation] WARNING: Config.notification* fields (eg: notificationText) are all deprecated in favor of notification: {title: "My Title", text: "My Text"}  See docs for "Notification" class');
    config.notification = {
      text: config.notificationText,
      title: config.notificationTitle,
      color: config.notificationColor,
      channelName: config.notificationChannelName,
      smallIcon: config.notificationSmallIcon,
      largeIcon: config.notificationLargeIcon,
      priority: config.notificationPriority
    };
  }

  config = TransistorAuthorizationToken.applyIf(config);

  return config;
};

const LOG_LEVEL_OFF     =  0;
const LOG_LEVEL_ERROR   =  1;
const LOG_LEVEL_WARNING =  2;
const LOG_LEVEL_INFO    =  3;
const LOG_LEVEL_DEBUG   =  4;
const LOG_LEVEL_VERBOSE =  5;

const DESIRED_ACCURACY_NAVIGATION = -2;
const DESIRED_ACCURACY_HIGH       = -1;
const DESIRED_ACCURACY_MEDIUM     = 10;
const DESIRED_ACCURACY_LOW        = 100;
const DESIRED_ACCURACY_VERY_LOW   = 1000;
const DESIRED_ACCURACY_LOWEST     = 3000;

const AUTHORIZATION_STATUS_NOT_DETERMINED = 0;
const AUTHORIZATION_STATUS_RESTRICTED     = 1;
const AUTHORIZATION_STATUS_DENIED         = 2;
const AUTHORIZATION_STATUS_ALWAYS         = 3;
const AUTHORIZATION_STATUS_WHEN_IN_USE    = 4;

const NOTIFICATION_PRIORITY_DEFAULT       = 0;
const NOTIFICATION_PRIORITY_HIGH          = 1;
const NOTIFICATION_PRIORITY_LOW           =-1;
const NOTIFICATION_PRIORITY_MAX           = 2;
const NOTIFICATION_PRIORITY_MIN           =-2;

const ACTIVITY_TYPE_OTHER                 = 1;
const ACTIVITY_TYPE_AUTOMOTIVE_NAVIGATION = 2;
const ACTIVITY_TYPE_FITNESS               = 3;
const ACTIVITY_TYPE_OTHER_NAVIGATION      = 4;
const ACTIVITY_TYPE_AIRBORNE              = 5;

const LOCATION_AUTHORIZATION_ALWAYS       = "Always";
const LOCATION_AUTHORIZATION_WHEN_IN_USE  = "WhenInUse";
const LOCATION_AUTHORIZATION_ANY          = "Any";

const PERSIST_MODE_ALL                    = 2;
const PERSIST_MODE_LOCATION               = 1;
const PERSIST_MODE_GEOFENCE               = -1;
const PERSIST_MODE_NONE                   = 0;

const ACCURACY_AUTHORIZATION_FULL        = 0;
const ACCURACY_AUTHORIZATION_REDUCED     = 1;

/// BackgroundGeolocation JS API
export default class BackgroundGeolocation {
  /// Events
  static get EVENT_BOOT()                  { return Events.BOOT; }
  static get EVENT_TERMINATE()             { return Events.TERMINATE; }
  static get EVENT_LOCATION()              { return Events.LOCATION; }
  static get EVENT_MOTIONCHANGE()          { return Events.MOTIONCHANGE; }
  static get EVENT_HTTP()                  { return Events.HTTP; }
  static get EVENT_HEARTBEAT()             { return Events.HEARTBEAT; }
  static get EVENT_PROVIDERCHANGE()        { return Events.PROVIDERCHANGE; }
  static get EVENT_ACTIVITYCHANGE()        { return Events.ACTIVITYCHANGE; }
  static get EVENT_GEOFENCE()              { return Events.GEOFENCE; }
  static get EVENT_GEOFENCESCHANGE()       { return Events.GEOFENCESCHANGE; }
  static get EVENT_ENABLEDCHANGE()         { return Events.ENABLEDCHANGE; }
  static get EVENT_CONNECTIVITYCHANGE()    { return Events.CONNECTIVITYCHANGE; }
  static get EVENT_SCHEDULE()              { return Events.SCHEDULE; }
  static get EVENT_POWERSAVECHANGE()       { return Events.POWERSAVECHANGE; }
  static get EVENT_NOTIFICATIONACTION()    { return Events.NOTIFICATIONACTION; }
  static get EVENT_AUTHORIZATION()         { return Events.AUTHORIZATION; }

	static get LOG_LEVEL_OFF()                        { return LOG_LEVEL_OFF; }
  static get LOG_LEVEL_ERROR()                      { return LOG_LEVEL_ERROR; }
  static get LOG_LEVEL_WARNING()                    { return LOG_LEVEL_WARNING; }
  static get LOG_LEVEL_INFO()                       { return LOG_LEVEL_INFO; }
  static get LOG_LEVEL_DEBUG()                      { return LOG_LEVEL_DEBUG; }
  static get LOG_LEVEL_VERBOSE()                    { return LOG_LEVEL_VERBOSE; }

  static get ACTIVITY_TYPE_OTHER()                  { return ACTIVITY_TYPE_OTHER;}
  static get ACTIVITY_TYPE_AUTOMOTIVE_NAVIGATION()  { return ACTIVITY_TYPE_AUTOMOTIVE_NAVIGATION;}
  static get ACTIVITY_TYPE_FITNESS()                { return ACTIVITY_TYPE_FITNESS;}
  static get ACTIVITY_TYPE_OTHER_NAVIGATION()       { return ACTIVITY_TYPE_OTHER_NAVIGATION;}
  static get ACTIVITY_TYPE_AIRBORNE()               { return ACTIVITY_TYPE_AIRBORNE; }
  static get DESIRED_ACCURACY_NAVIGATION()          { return DESIRED_ACCURACY_NAVIGATION; }
  static get DESIRED_ACCURACY_HIGH()                { return DESIRED_ACCURACY_HIGH; }
  static get DESIRED_ACCURACY_MEDIUM()              { return DESIRED_ACCURACY_MEDIUM; }
  static get DESIRED_ACCURACY_LOW()                 { return DESIRED_ACCURACY_LOW; }
  static get DESIRED_ACCURACY_VERY_LOW()            { return DESIRED_ACCURACY_VERY_LOW; }
  static get DESIRED_ACCURACY_LOWEST()              { return DESIRED_ACCURACY_LOWEST; }

  static get AUTHORIZATION_STATUS_NOT_DETERMINED()  { return AUTHORIZATION_STATUS_NOT_DETERMINED; }
  static get AUTHORIZATION_STATUS_RESTRICTED()      { return AUTHORIZATION_STATUS_RESTRICTED; }
  static get AUTHORIZATION_STATUS_DENIED()          { return AUTHORIZATION_STATUS_DENIED; }
  static get AUTHORIZATION_STATUS_ALWAYS()          { return AUTHORIZATION_STATUS_ALWAYS; }
  static get AUTHORIZATION_STATUS_WHEN_IN_USE()     { return AUTHORIZATION_STATUS_WHEN_IN_USE; }

  static get NOTIFICATION_PRIORITY_DEFAULT()        { return NOTIFICATION_PRIORITY_DEFAULT; }
  static get NOTIFICATION_PRIORITY_HIGH()           { return NOTIFICATION_PRIORITY_HIGH; }
  static get NOTIFICATION_PRIORITY_LOW()            { return NOTIFICATION_PRIORITY_LOW; }
  static get NOTIFICATION_PRIORITY_MAX()            { return NOTIFICATION_PRIORITY_MAX; }
  static get NOTIFICATION_PRIORITY_MIN()            { return NOTIFICATION_PRIORITY_MIN; }

  static get LOCATION_AUTHORIZATION_ALWAYS()        { return LOCATION_AUTHORIZATION_ALWAYS}
  static get LOCATION_AUTHORIZATION_WHEN_IN_USE()   { return LOCATION_AUTHORIZATION_WHEN_IN_USE}
  static get LOCATION_AUTHORIZATION_ANY()           { return LOCATION_AUTHORIZATION_ANY}

  static get PERSIST_MODE_ALL()                     { return PERSIST_MODE_ALL; }
  static get PERSIST_MODE_LOCATION()                { return PERSIST_MODE_LOCATION; }
  static get PERSIST_MODE_GEOFENCE()                { return PERSIST_MODE_GEOFENCE; }
  static get PERSIST_MODE_NONE()                    { return PERSIST_MODE_NONE; }

  static get ACCURACY_AUTHORIZATION_FULL()          { return ACCURACY_AUTHORIZATION_FULL; }
  static get ACCURACY_AUTHORIZATION_REDUCED()       { return ACCURACY_AUTHORIZATION_REDUCED; }

  static get logger() { return Logger; }

  static get deviceSettings() { return DeviceSettings; }

  static ready(config:any) {
    return NativeModule.ready({options:validateConfig(config)});
  }

  static reset(config?:any) {
    return NativeModule.reset({options:validateConfig(config)});
  }

  static start() {
    return NativeModule.start();
  }

  static stop() {
    return NativeModule.stop();
  }

  static startSchedule() {
    return NativeModule.startSchedule();
  }

  static stopSchedule() {
    return NativeModule.stopSchedule();
  }

  static startGeofences() {
    return NativeModule.startGeofences();
  }

  static setConfig(config:any) {
    return NativeModule.setConfig({options:validateConfig(config)});
  }

  static getState() {
    return NativeModule.getState();
  }

  static changePace(isMoving:boolean) {
    return new Promise((resolve:Function, reject:Function) => {
      NativeModule.changePace({isMoving:isMoving}).then(() => {
        resolve();
      }).catch((error:any) => {
        reject(error.errorMessage);
      })
    });
  }

  static getCurrentPosition(options:Object) {
    options = options || {};
    return new Promise((resolve:Function, reject:Function) => {
      NativeModule.getCurrentPosition({options: options}).then((result:Location) => {
        resolve(result);
      }).catch((error:any) => {
        reject(error.code);
      });
    });
  }

  static watchPosition(onLocation:Function, onError?:Function, options?:any) {
    options = options || {};
    return new Promise(async (resolve:Function, reject:Function) => {

      const handler = (response:any) => {
        if (response.hasOwnProperty("error") && (response.error != null)) {
          if (typeof(onError) === 'function') {
            onError(response.error.code);
          } else {
            console.warn('[BackgroundGeolocation watchPostion] DEFAULT ERROR HANDLER.  Provide an onError handler to watchPosition to receive this message: ', response.error);
          }
        } else {
          onLocation(response);
        }
      }
      const listener:PluginListenerHandle = await NativeModule.addListener("watchposition", handler);

      NativeModule.watchPosition({options:options}).then(() => {
        WATCH_POSITION_SUBSCRIPTIONS.push(listener);
        resolve();
      }).catch((error:any) => {
        listener.remove();
        reject(error.message);
      });
    });
  }

  static stopWatchPosition() {
    for (let n=0;n<WATCH_POSITION_SUBSCRIPTIONS.length;n++) {
      const subscription = WATCH_POSITION_SUBSCRIPTIONS[n];
      subscription.remove();
    }
    return NativeModule.stopWatchPosition();
  }

  static requestPermission() {
    return new Promise((resolve:Function, reject:Function) => {
      NativeModule.requestPermission().then((result:any) => {
        if (result.success) {
          resolve(result.status);
        } else {
          reject(result.status);
        }
      });
    });
  }

  static requestTemporaryFullAccuracy(purpose:string) {
    return new Promise((resolve:Function, reject:Function) => {
      NativeModule.requestTemporaryFullAccuracy({purpose:purpose}).then((result:any) => {
        resolve(result.accuracyAuthorization);
      }).catch((error:any) => {
        reject(error.message);
      });
    });
  }

  static getProviderState() {
    return NativeModule.getProviderState();
  }

  /// Locations database
  ///
  static getLocations() {
    return new Promise((resolve:Function, reject:Function) => {
      NativeModule.getLocations().then((result:any) => {
        resolve(result.locations);
      }).catch((error:PluginResultError) => {
        reject(error.message);
      });
    });
  }

  static insertLocation(params:any) {
    return new Promise((resolve:Function, reject:Function) => {
      NativeModule.insertLocation({options:params}).then((result:any) => {
        resolve(result.uuid);
      }).catch((error:PluginResultError) => {
        reject(error.message);
      });
    });
  }

  static destroyLocations() {
    return new Promise((resolve:Function, reject:Function) => {
      NativeModule.destroyLocations().then(() => {
        resolve();
      }).catch((error:PluginResultError) => {
        reject(error.message);
      });
    });
  }

  static destroyLocation(uuid:string) {
    return new Promise((resolve:Function, reject:Function) => {
      NativeModule.destroyLocation({uuid:uuid}).then(() => {
        resolve();
      }).catch((error:PluginResultError) => {
        reject(error.message);
      });
    });
  }

  static getCount() {
    return new Promise((resolve:Function, reject:Function) => {
      NativeModule.getCount().then((result:any) => {
        resolve(result.count);
      }).catch((error:PluginResultError) => {
        reject(error.message);
      });
    });
  }

  static sync() {
    return new Promise((resolve:Function, reject:Function) => {
      NativeModule.sync().then((result:any) => {
        resolve(result.locations);
      }).catch((error:PluginResultError) => {
        reject(error.message);
      });
    });
  }

  /// Geofencing
  ///
  static addGeofence(params:any) {
    return new Promise((resolve:Function, reject:Function) => {
      NativeModule.addGeofence({options:params}).then(() => {
        resolve();
      }).catch((error:PluginResultError) => {
        reject(error.message);
      });
    });
  }

  static addGeofences(params:any) {
    return new Promise((resolve:Function, reject:Function) => {
      NativeModule.addGeofences({options:params}).then(() => {
        resolve();
      }).catch((error:PluginResultError) => {
        reject(error.message);
      });
    });
  }

  static getGeofences() {
    return new Promise((resolve:Function, reject:Function) => {
      NativeModule.getGeofences().then((result:any) => {
        resolve(result.geofences);
      }).catch((error:PluginResultError) => {
        reject(error.message);
      });
    });
  }

  static getGeofence(identifier:string) {
    return new Promise((resolve:Function, reject:Function) => {
      if (identifier === null) {
        reject('identifier is null');
        return;
      }
      NativeModule.getGeofence({identifier:identifier}).then((result:any) => {
        resolve(result);
      }).catch((error:PluginResultError) => {
        reject(error.message);
      });
    });
  }

  static geofenceExists(identifier:string) {
    return new Promise((resolve:Function, reject:Function) => {
      if (identifier === null) {
        reject('identifier is null');
        return;
      }
      NativeModule.geofenceExists({identifier:identifier}).then((result:any) => {
        resolve(result.exists);
      }).catch((error:PluginResultError) => {
        reject(error.message);
      });
    });
  }

  static removeGeofence(identifier:string) {
    return new Promise((resolve:Function, reject:Function) => {
      if (identifier === null) {
        reject('identifier is null');
        return;
      }
      NativeModule.removeGeofence({identifier:identifier}).then(() => {
        resolve();
      }).catch((error:PluginResultError) => {
        reject(error.message);
      });
    });
  }

  static removeGeofences(identifiers?:Array<String>) {
    identifiers = identifiers || [];
    return new Promise((resolve:Function, reject:Function) => {
      NativeModule.removeGeofences({identifiers:identifiers}).then(() => {
        resolve();
      }).catch((error:PluginResultError) => {
        reject(error.message);
      });
    });
  }

  /// Odometer
  ///
  static getOdometer() {
    return new Promise((resolve:Function, reject:Function) => {
      NativeModule.getOdometer().then((result:any) => {
        resolve(result.odometer);
      }).catch((error:PluginResultError) => {
        reject(error.message);
      });
    });
  }

  static setOdometer(value:number) {
    return new Promise((resolve:Function, reject:Function) => {
      NativeModule.setOdometer({"odometer":value}).then((result:any) => {
        resolve(result);
      }).catch((error:PluginResultError) => {
        reject(error.message);
      });
    });
  }

  static resetOdometer() {
    return BackgroundGeolocation.setOdometer(0);
  }

  /// Background Tasks
  ///
  static startBackgroundTask() {
    return new Promise((resolve:Function, reject:Function) => {
      NativeModule.startBackgroundTask().then((result:any) => {
        resolve(result.taskId);
      }).catch((error:PluginResultError) => {
        reject(error.message);
      });
    });
  }

  static stopBackgroundTask(taskId:number) {
    return new Promise((resolve:Function, reject:Function) => {
      NativeModule.stopBackgroundTask({taskId: taskId}).then(() => {
        resolve();
      }).catch((error:PluginResultError) => {
        reject(error.message);
      });
    });
  }

  /// @alias stopBackgroundTask
  static finish(taskId:number) {
    return BackgroundGeolocation.stopBackgroundTask(taskId);
  }

  static getDeviceInfo() {
    return NativeModule.getDeviceInfo();
  }

  static playSound(soundId:any) {
    return NativeModule.playSound({soundId:soundId});
  }

  static isPowerSaveMode() {
    return new Promise((resolve:Function, reject:Function) => {
      NativeModule.isPowerSaveMode().then((result:any) => {
        resolve(result.isPowerSaveMode);
      }).catch((error:PluginResultError) => {
        reject(error.message);
      })
    });
  }

  static getSensors() {
    return NativeModule.getSensors();
  }

  /// TransistorAuthorizationToken
  ///
  static findOrCreateTransistorAuthorizationToken(orgname:string, username:string, url?:string) {
    return TransistorAuthorizationToken.findOrCreate(orgname, username, url);
  }

  static destroyTransistorAuthorizationToken(url:string) {
    return TransistorAuthorizationToken.destroy(url);
  }

  /// Event Handling
  ///
  static onLocation(success:Function, failure:Function) {
    return BackgroundGeolocation.addListener(Events.LOCATION, success, failure);
  }

  static onMotionChange(success:Function) {
    return BackgroundGeolocation.addListener(Events.MOTIONCHANGE, success);
  }

  static onHttp(success:Function) {
    return BackgroundGeolocation.addListener(Events.HTTP, success);
  }

  static onHeartbeat(success:Function) {
    return BackgroundGeolocation.addListener(Events.HEARTBEAT, success);
  }

  static onProviderChange(success:Function) {
    return BackgroundGeolocation.addListener(Events.PROVIDERCHANGE, success);
  }

  static onActivityChange(success:Function) {
    return BackgroundGeolocation.addListener(Events.ACTIVITYCHANGE, success);
  }

  static onGeofence(success:Function) {
    return BackgroundGeolocation.addListener(Events.GEOFENCE, success);
  }

  static onGeofencesChange(success:Function) {
    return BackgroundGeolocation.addListener(Events.GEOFENCESCHANGE, success);
  }

  static onSchedule(success:Function) {
    return BackgroundGeolocation.addListener(Events.SCHEDULE, success);
  }

  static onEnabledChange(success:Function) {
    return BackgroundGeolocation.addListener(Events.ENABLEDCHANGE, success);
  }

  static onConnectivityChange(success:Function) {
    return BackgroundGeolocation.addListener(Events.CONNECTIVITYCHANGE, success);
  }

  static onPowerSaveChange(success:Function) {
    return BackgroundGeolocation.addListener(Events.POWERSAVECHANGE, success);
  }

  static onNotificationAction(success:Function) {
    return BackgroundGeolocation.addListener(Events.NOTIFICATIONACTION, success);
  }

  static onAuthorization(success:Function) {
    return BackgroundGeolocation.addListener(Events.AUTHORIZATION, success);
  }

  ///
  /// Listen to a plugin event
  ///
  static addListener(event:string, success:Function, failure?:Function) {
    if (!Events[event.toUpperCase()]) {
      throw (TAG + "#addListener - Unknown event '" + event + "'");
    }

    const handler = (response:any) => {
      if (response.hasOwnProperty("value")) {
        response = response.value;
      }
      if (response.hasOwnProperty("error") && (response.error != null)) {
        if (typeof(failure) === 'function') {
          failure(response.error);
        } else {
          success(response);
        }
      } else {
        success(response);
      }
    }

    // Create a flag to capture edge-case where the developer subscribes to an event then IMMEDIATELY calls subscription.remove()
    // before NativeModule.addListener has resolved.
    // The developer would have to do something weird like this:
    //   const subscription = BackgroundGeolocation.onLocation(this.onLocation);
    //   subscription.remove();
    //
    // The reason for this is I don't want developers to have to await calls to BackgroundGeolocation.onXXX(myHandler).
    //
    let isRemoved = false;

    const subscriptionProxy = {
      remove: () => {
        // EmptyFn until NativeModule.addListener resolves and re-writes this function
        isRemoved = true;
        console.warn('[BackgroundGeolocation.addListener] Unexpected call to subscription.remove() on subscriptionProxy.  Waiting for NativeModule.addListener to resolve.');
      }
    };

    // Now add the listener and re-write subscriptionProxy.remove.
    NativeModule.addListener(event, handler).then((listener:PluginListenerHandle) => {
      const subscription = new Subscription(event, listener, success);
      EVENT_SUBSCRIPTIONS.push(subscription);

      subscriptionProxy.remove = () => {
        listener.remove();
        // Remove from EVENT_SUBSCRIPTIONS.
        if (EVENT_SUBSCRIPTIONS.indexOf(subscription) >= 0) {
          EVENT_SUBSCRIPTIONS.splice(EVENT_SUBSCRIPTIONS.indexOf(subscription), 1);
        }
      }
      if (isRemoved) {
        // Caught edge-case.  Developer added an event-handler then immediately call subscription.remove().
        subscriptionProxy.remove();
      }
    });

    return subscriptionProxy;
  }

  static removeListener(event:string, callback:Function) {
    console.warn('BackgroundGeolocation.removeListener is deprecated.  Event-listener methods (eg: onLocation) now return a Subscription instance.  Call subscription.remove() on the returned subscription instead.  Eg:\nconst subscription = BackgroundGeolocation.onLocation(myLocationHandler)\n...\nsubscription.remove()');
    return new Promise((resolve:Function, reject:Function) => {
      let found = null;
      for (let n=0,len=EVENT_SUBSCRIPTIONS.length;n<len;n++) {
        let sub = EVENT_SUBSCRIPTIONS[n];
        if ((sub.event === event) && (sub.callback === callback)) {
            found = sub;
            break;
        }
      }
      if (found !== null) {
        EVENT_SUBSCRIPTIONS.splice(EVENT_SUBSCRIPTIONS.indexOf(found), 1);
        found.subscription.remove();
        resolve();
      } else {
        console.warn(TAG + ' Failed to find listener for event ' + event);
        reject();
      }
    });
  }

  static removeListeners() {
    return new Promise(async (resolve:Function) => {
      EVENT_SUBSCRIPTIONS = [];
      await NativeModule.removeAllEventListeners();
      resolve();
    });
  }
}





