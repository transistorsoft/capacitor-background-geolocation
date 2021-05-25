import { Plugins } from '@capacitor/core';

const TAG               = "TSLocationManager";

const Events:any = {
  "BOOT"               : "boot",
  "TERMINATE"          : "terminate",
  "LOCATION"           : "location",
  "HTTP"               : "http",
  "MOTIONCHANGE"       : "motionchange",
  "PROVIDERCHANGE"     : "providerchange",
  "HEARTBEAT"          : "heartbeat",
  "ACTIVITYCHANGE"     : "activitychange",
  "GEOFENCE"           : "geofence",
  "GEOFENCESCHANGE"    : "geofenceschange",
  "SCHEDULE"           : "schedule",
  "CONNECTIVITYCHANGE" : "connectivitychange",
  "ENABLEDCHANGE"      : "enabledchange",
  "POWERSAVECHANGE"    : "powersavechange",
  "NOTIFICATIONACTION" : "notificationaction",
  "AUTHORIZATION"      : "authorization"
}

const EVENT_SUBSCRIPTIONS:any = [];

class Subscription {
  event:string;
  subscription: any;
  callback:Function;

  constructor(event:string, subscription:any, callback:Function) {
    this.event = event;
    this.subscription = subscription;
    this.callback = callback;
  }
}

const NativeModule = Plugins.BackgroundGeolocation;


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

const LOCATION_AUTHORIZATION_ALWAYS       = "Always";
const LOCATION_AUTHORIZATION_WHEN_IN_USE  = "WhenInUse";
const LOCATION_AUTHORIZATION_ANY          = "Any";

const PERSIST_MODE_ALL                    = 2;
const PERSIST_MODE_LOCATION               = 1;
const PERSIST_MODE_GEOFENCE               = -1;
const PERSIST_MODE_NONE                   = 0;

const ACCURACY_AUTHORIZATION_FULL        = 0;
const ACCURACY_AUTHORIZATION_REDUCED     = 1;

export default class BackgroundGeolocation {
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

  static ready(config:any) {
    return NativeModule.ready({options:config});
  }

  static reset(config?:any) {
    return NativeModule.reset({options:config});
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

  static startGeofences() {
    return NativeModule.startGeofences();
  }

  static setConfig(config:any) {
    return NativeModule.setConfig({options:config});
  }

  static getState() {
    return NativeModule.getState();
  }

  static startBackgroundTask() {
    return new Promise((resolve:Function) => {
      NativeModule.beginBackgroundTask().then((result:any) => {
        resolve(result.taskId);
      });
    });
  }

  static stopBackgroundTask(taskId:string) {
    return new Promise((resolve:Function) => {
      NativeModule.finish({taskId: taskId}).then(() => {
        resolve();
      });
    });
  }

  static changePace(isMoving:boolean) {
    return new Promise((resolve:Function, reject:Function) => {
      NativeModule.changePace({isMoving:isMoving}).then((result:any) => {
        resolve();
      }).catch((error:any) => {
        reject(error.errorMessage);
      })
    });
  }

  static getCurrentPosition(options:any) {
    return new Promise((resolve:Function, reject:Function) => {
      NativeModule.getCurrentPosition(options).then((result:any) => {
        resolve(result.location);
      }).catch((error:any) => {
        reject(error.code);
      });
    });
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
        reject(error.errorMessage);
      });
    });
  }

  static getProviderState() {
    return NativeModule.getProviderState();
  }

  /// Event handling
  ///
  ///
  static onLocation(success:Function, failure:Function) {
    BackgroundGeolocation.addListener(Events.LOCATION, success, failure);
  }

  static onMotionChange(success:Function) {
    BackgroundGeolocation.addListener(Events.MOTIONCHANGE, success);
  }

  static onHttp(success:Function) {
    BackgroundGeolocation.addListener(Events.HTTP, success);
  }

  static onHeartbeat(success:Function) {
    BackgroundGeolocation.addListener(Events.HEARTBEAT, success);
  }

  static onProviderChange(success:Function) {
    BackgroundGeolocation.addListener(Events.PROVIDERCHANGE, success);
  }

  static onActivityChange(success:Function) {
    BackgroundGeolocation.addListener(Events.ACTIVITYCHANGE, success);
  }

  static onGeofence(success:Function) {
    BackgroundGeolocation.addListener(Events.GEOFENCE, success);
  }

  static onGeofencesChange(success:Function) {
    BackgroundGeolocation.addListener(Events.GEOFENCESCHANGE, success);
  }

  static onSchedule(success:Function) {
    BackgroundGeolocation.addListener(Events.SCHEDULE, success);
  }

  static onEnabledChange(success:Function) {
    BackgroundGeolocation.addListener(Events.ENABLEDCHANGE, success);
  }

  static onConnectivityChange(success:Function) {
    BackgroundGeolocation.addListener(Events.CONNECTIVITYCHANGE, success);
  }

  static onPowerSaveChange(success:Function) {
    BackgroundGeolocation.addListener(Events.POWERSAVECHANGE, success);
  }

  static onNotificationAction(success:Function) {
    BackgroundGeolocation.addListener(Events.NOTIFICATIONACTION, success);
  }

  static onAuthorization(success:Function) {
    BackgroundGeolocation.addListener(Events.AUTHORIZATION, success);
  }

  /**
  * Listen to a plugin event
  */
  static addListener(event:string, success:Function, failure?:Function) {
    if (!Events[event.toUpperCase()]) {
      throw (TAG + "#addListener - Unknown event '" + event + "'");
    }

    const handler = (response:any) => {
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

    let listener = NativeModule.addListener(event, handler);
    const subscription = new Subscription(event, listener, success);
    EVENT_SUBSCRIPTIONS.push(subscription);
  }

  static removeListener(event:string, callback:Function) {
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
    } else {
      console.warn(TAG + ' Failed to find listener for event ' + event);
    }
  }

}




