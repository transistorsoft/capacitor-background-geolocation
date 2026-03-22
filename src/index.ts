
import {
  registerPlugin,
  PluginListenerHandle,
  PluginResultError
} from '@capacitor/core';

import {
  Config,
  DeviceSettingsRequest,
  CurrentPositionRequest,
  WatchPositionRequest,
  Location,
  LocationError,
  State,
  Geofence,
  SQLQuery,
  MotionChangeEvent,
  MotionActivityEvent,
  GeofenceEvent,
  GeofencesChangeEvent,
  HeartbeatEvent,
  HttpEvent,
  ProviderChangeEvent,
  ConnectivityChangeEvent,
  AuthorizationEvent,
  LogLevel,
  DesiredAccuracy,
  PersistMode,
  AuthorizationStatus,
  AccuracyAuthorization,
  LocationRequest,
  AuthorizationStrategy,
  LocationFilterPolicy,
  KalmanProfile,
  NotificationPriority,
  HttpMethod,
  TriggerActivity,
  ActivityType,
  Event
} from '@transistorsoft/background-geolocation-types';

const NativeModule:any = registerPlugin('BackgroundGeolocation');

/**
 * Logger
 */
const LOGGER_LOG_LEVEL_DEBUG = "debug";
const LOGGER_LOG_LEVEL_NOTICE = "notice";
const LOGGER_LOG_LEVEL_INFO = "info";
const LOGGER_LOG_LEVEL_WARN = "warn";
const LOGGER_LOG_LEVEL_ERROR = "error";

const ORDER_ASC = 1;
const ORDER_DESC = -1;

function log(level:string, msg:string) {
  return NativeModule.log({
    level: level,
    message: msg
  });
}

function validateQuery(query?:SQLQuery):SQLQuery {
  if (typeof(query) !== 'object') return {};

  if (query.hasOwnProperty('start') && isNaN(query.start)) {
    throw new Error('Invalid SQLQuery.start.  Expected unix timestamp but received: ' + query.start);
  }
  if (query.hasOwnProperty('end') && isNaN(query.end)) {
    throw new Error('Invalid SQLQuery.end.  Expected unix timestamp but received: ' + query.end);
  }
  return query;
}

class Logger {
  static get ORDER_ASC() { return ORDER_ASC; }
  static get ORDER_DESC() { return ORDER_DESC; }

  static debug(msg:string) {
    return log(LOGGER_LOG_LEVEL_DEBUG, msg);
  }

  static error(msg:string) {
    return log(LOGGER_LOG_LEVEL_ERROR, msg);
  }

  static warn(msg:string) {
    return log(LOGGER_LOG_LEVEL_WARN, msg);
  }

  static info(msg:string) {
    return log(LOGGER_LOG_LEVEL_INFO, msg);
  }

  static notice(msg:string) {
    return log(LOGGER_LOG_LEVEL_NOTICE, msg);
  }

  static getLog(query?:SQLQuery) {
    query = validateQuery(query);
    return new Promise((resolve:Function, reject:Function) => {
      NativeModule.getLog({options:query}).then((result:any) => {
        resolve(result.log);
      }).catch((error:PluginResultError) => {
        reject(error.message);
      });
    });
  }

  static destroyLog() {
    return new Promise((resolve:Function, reject:Function) => {
      NativeModule.destroyLog().then(() => {
        resolve();
      }).catch((error:PluginResultError) => {
        reject(error.message);
      });
    });
  }

  static emailLog(email:string, query?:SQLQuery) {
    query = validateQuery(query);
    return new Promise((resolve:Function, reject:Function) => {
      NativeModule.emailLog({email:email, query:query}).then((result:any) => {
        resolve(result);
      }).catch((error:PluginResultError) => {
        reject(error.message);
      });
    });
  }

  static uploadLog(url:string, query?:SQLQuery) {
    query = validateQuery(query);
    return new Promise((resolve:Function, reject:Function) => {
      NativeModule.uploadLog({url:url, query:query}).then(() => {
        resolve();
      }).catch((error:PluginResultError) => {
        reject(error.message);
      });
    });
  }
}

/**
 * TransistorAuthorizationToken
 */
const DEFAULT_URL:string  = 'http://tracker.transistorsoft.com';

const DUMMY_TOKEN:string  = 'DUMMY_TOKEN';

const REFRESH_PAYLOAD:any = {
  refresh_token: '{refreshToken}'
}

const LOCATIONS_PATH:string = '/api/locations';

const REFRESH_TOKEN_PATH:string = '/api/refresh_token';

class TransistorAuthorizationToken {
  static findOrCreate(orgname:string, username:string, url:string=DEFAULT_URL) {

    return new Promise((resolve:Function, reject:Function) => {
      NativeModule.getTransistorToken({
        org: orgname,
        username: username,
        url: url
      }).then((result:any) => {
        if (result.success) {
          const token = result.token;
          token.url = url;
          resolve(token);
        } else {
          console.warn('[TransistorAuthorizationToken findOrCreate] ERROR: ', result);
          if (result.status == '403') {
            reject(result);
            return;
          }
          resolve({
            accessToken: DUMMY_TOKEN,
            refreshToken: DUMMY_TOKEN,
            expires: -1,
            url:url
          });
        }
      }).catch((error:PluginResultError) => {
        reject(error);
      });
    });
  }

  static destroy(url:string=DEFAULT_URL) {
    return new Promise((resolve:Function, reject:Function) => {
      NativeModule.destroyTransistorToken({url: url}).then(() => {
        resolve();
      }).catch((error:PluginResultError) => {
        reject(error.message);
      });
    });
  }

  static applyIf(config:Config) {
    if (!config.transistorAuthorizationToken) return config;

    const token = config.transistorAuthorizationToken;
    delete config.transistorAuthorizationToken;

    if (!config.http) { config.http = {}; }
    config.http.url = token.url + LOCATIONS_PATH;
    config.authorization = {
      strategy: 'JWT',
      accessToken: token.accessToken,
      refreshToken: token.refreshToken,
      refreshUrl: token.url + REFRESH_TOKEN_PATH,
      refreshPayload: REFRESH_PAYLOAD,
      expires: token.expires
    }
    return config;
  }
}

/**
 * DeviceSettings
 */
const IGNORE_BATTERY_OPTIMIZATIONS = "IGNORE_BATTERY_OPTIMIZATIONS";
const POWER_MANAGER = "POWER_MANAGER";

const resolveSettingsRequest = (resolve:Function, request:DeviceSettingsRequest) => {
  // lastSeenAt arrives from the native bridge as a unix timestamp (number); convert to Date.
  const lastSeenAt = request.lastSeenAt as unknown as number;
  if (lastSeenAt > 0) {
    request.lastSeenAt = new Date(lastSeenAt);
  }
  resolve(request);
}

class DeviceSettings {
  static isIgnoringBatteryOptimizations() {
    return new Promise((resolve:Function, reject:Function) => {
      NativeModule.isIgnoringBatteryOptimizations().then((result:any) => {
        resolve(result.isIgnoringBatteryOptimizations);
      }).catch((error:PluginResultError) => {
        reject(error.message);
      })
    });
  }

  static showIgnoreBatteryOptimizations() {
    return new Promise((resolve:Function, reject:Function) => {
      const args = {action: IGNORE_BATTERY_OPTIMIZATIONS};
      NativeModule.requestSettings(args).then((result:any) => {
        resolveSettingsRequest(resolve, result);
      }).catch((error:PluginResultError) => {
        reject(error.message);
      });
    });
  }

  static showPowerManager() {
    return new Promise((resolve:Function, reject:Function) => {
      const args = {action: POWER_MANAGER};
      NativeModule.requestSettings(args).then((result:any) => {
        resolveSettingsRequest(resolve, result);
      }).catch((error:PluginResultError) => {
        reject(error.message);
      })
    });
  }

  static show(request:DeviceSettingsRequest) {
    return new Promise((resolve:Function, reject:Function) => {
      const args = {action: request.action};
      NativeModule.showSettings(args).then(() => {
        resolve();
      }).catch((error:PluginResultError) => {
        reject(error.message);
      });
    });
  }
}

const TAG               = "TSLocationManager";

/// Container for event-subscriptions.
let EVENT_SUBSCRIPTIONS:any = [];

/// Container for watchPosition subscriptions, keyed by watchId.
let WATCH_POSITION_SUBSCRIPTIONS: Map<number, PluginListenerHandle> = new Map();

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

const LOG_LEVEL_OFF     = LogLevel.Off;
const LOG_LEVEL_ERROR   = LogLevel.Error;
const LOG_LEVEL_WARNING = LogLevel.Warning;
const LOG_LEVEL_INFO    = LogLevel.Info;
const LOG_LEVEL_DEBUG   = LogLevel.Debug;
const LOG_LEVEL_VERBOSE = LogLevel.Verbose;

const DESIRED_ACCURACY_NAVIGATION = DesiredAccuracy.Navigation;
const DESIRED_ACCURACY_HIGH       = DesiredAccuracy.High;
const DESIRED_ACCURACY_MEDIUM     = DesiredAccuracy.Medium;
const DESIRED_ACCURACY_LOW        = DesiredAccuracy.Low;
const DESIRED_ACCURACY_VERY_LOW   = DesiredAccuracy.VeryLow;
const DESIRED_ACCURACY_LOWEST     = DesiredAccuracy.Lowest;

const AUTHORIZATION_STATUS_NOT_DETERMINED = AuthorizationStatus.NotDetermined;
const AUTHORIZATION_STATUS_RESTRICTED     = AuthorizationStatus.Restricted;
const AUTHORIZATION_STATUS_DENIED         = AuthorizationStatus.Denied;
const AUTHORIZATION_STATUS_ALWAYS         = AuthorizationStatus.Always;
const AUTHORIZATION_STATUS_WHEN_IN_USE    = AuthorizationStatus.WhenInUse;

const NOTIFICATION_PRIORITY_DEFAULT = NotificationPriority.Default;
const NOTIFICATION_PRIORITY_HIGH    = NotificationPriority.High;
const NOTIFICATION_PRIORITY_LOW     = NotificationPriority.Low;
const NOTIFICATION_PRIORITY_MAX     = NotificationPriority.Max;
const NOTIFICATION_PRIORITY_MIN     = NotificationPriority.Min;

const ACTIVITY_TYPE_OTHER                 = ActivityType.Other;
const ACTIVITY_TYPE_AUTOMOTIVE_NAVIGATION = ActivityType.AutomotiveNavigation;
const ACTIVITY_TYPE_FITNESS               = ActivityType.Fitness;
const ACTIVITY_TYPE_OTHER_NAVIGATION      = ActivityType.OtherNavigation;
const ACTIVITY_TYPE_AIRBORNE              = ActivityType.Airborne;

const LOCATION_AUTHORIZATION_ALWAYS      = LocationRequest.Always;
const LOCATION_AUTHORIZATION_WHEN_IN_USE = LocationRequest.WhenInUse;
const LOCATION_AUTHORIZATION_ANY         = LocationRequest.Any;

const PERSIST_MODE_ALL      = PersistMode.All;
const PERSIST_MODE_LOCATION = PersistMode.Location;
const PERSIST_MODE_GEOFENCE = PersistMode.Geofence;
const PERSIST_MODE_NONE     = PersistMode.None;

const ACCURACY_AUTHORIZATION_FULL    = AccuracyAuthorization.Full;
const ACCURACY_AUTHORIZATION_REDUCED = AccuracyAuthorization.Reduced;

/// BackgroundGeolocation JS API
export default class BackgroundGeolocation {
  static get LogLevel() { return LogLevel; }
  static get DesiredAccuracy() { return DesiredAccuracy; }
  static get PersistMode() { return PersistMode; }
  static get AuthorizationStatus() { return AuthorizationStatus; }
  static get AccuracyAuthorization() { return AccuracyAuthorization; }
  static get AuthorizationStrategy() { return AuthorizationStrategy; }
  static get LocationFilterPolicy() { return LocationFilterPolicy; }
  static get KalmanProfile() { return KalmanProfile; }
  static get HttpMethod() { return HttpMethod; }
  static get TriggerActivity() { return TriggerActivity; }

  /// Events
  static get EVENT_BOOT()                  { return Event.Boot; }
  static get EVENT_TERMINATE()             { return Event.Terminate; }
  static get EVENT_LOCATION()              { return Event.Location; }
  static get EVENT_MOTIONCHANGE()          { return Event.MotionChange; }
  static get EVENT_HTTP()                  { return Event.Http; }
  static get EVENT_HEARTBEAT()             { return Event.Heartbeat; }
  static get EVENT_PROVIDERCHANGE()        { return Event.ProviderChange; }
  static get EVENT_ACTIVITYCHANGE()        { return Event.ActivityChange; }
  static get EVENT_GEOFENCE()              { return Event.Geofence; }
  static get EVENT_GEOFENCESCHANGE()       { return Event.GeofencesChange; }
  static get EVENT_ENABLEDCHANGE()         { return Event.EnabledChange; }
  static get EVENT_CONNECTIVITYCHANGE()    { return Event.ConnectivityChange; }
  static get EVENT_SCHEDULE()              { return Event.Schedule; }
  static get EVENT_POWERSAVECHANGE()       { return Event.PowerSaveChange; }
  static get EVENT_NOTIFICATIONACTION()    { return "notificationaction"} // <-- TODO : Add to background-geolocation-types
  static get EVENT_AUTHORIZATION()         { return Event.Authorization; }

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

  static ready(config:Config) {
    return NativeModule.ready({options:config});
  }

  static reset(config?:Config) {
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

  static stopSchedule() {
    return NativeModule.stopSchedule();
  }

  static startGeofences() {
    return NativeModule.startGeofences();
  }

  static setConfig(config:Config) {
    return NativeModule.setConfig({options:config});
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

  static getCurrentPosition(options:CurrentPositionRequest) {
    options = options || {};
    return new Promise((resolve:Function, reject:Function) => {
      NativeModule.getCurrentPosition({options: options}).then((result:Location) => {
        resolve(result);
      }).catch((error:any) => {
        reject(error.code);
      });
    });
  }

  static watchPosition(options:WatchPositionRequest, onLocation:(location:Location) => void, onError?:(errorCode:number) => void) {
    options = options || {};

    let isRemoved = false;
    let nativeWatchId:number | null = null;

    const subscriptionProxy = {
      remove: () => {
        isRemoved = true;
        if (nativeWatchId !== null) {
          const listener = WATCH_POSITION_SUBSCRIPTIONS.get(nativeWatchId);
          if (listener) {
            listener.remove();
            WATCH_POSITION_SUBSCRIPTIONS.delete(nativeWatchId);
          }
          NativeModule.stopWatchPosition({watchId: nativeWatchId});
          nativeWatchId = null;
        }
      }
    };

    const handler = (response:any) => {
      if (response.hasOwnProperty("error") && (response.error != null)) {
        if (typeof(onError) === 'function') {
          onError(response.error.code);
        } else {
          console.warn('[BackgroundGeolocation watchPosition] DEFAULT ERROR HANDLER.  Provide an onError callback to watchPosition to receive this message: ', response.error);
        }
      } else {
        onLocation(response);
      }
    };

    NativeModule.addListener("watchposition", handler).then((listener:PluginListenerHandle) => {
      NativeModule.watchPosition({options:options}).then((result:any) => {
        nativeWatchId = result.watchId;
        if (isRemoved) {
          // remove() was called before the native async call resolved — honour it now.
          listener.remove();
          NativeModule.stopWatchPosition({watchId: nativeWatchId});
        } else {
          WATCH_POSITION_SUBSCRIPTIONS.set(nativeWatchId!, listener);
        }
      }).catch(() => {
        listener.remove();
      });
    });

    return subscriptionProxy;
  }

  static stopWatchPosition(watchId?:number):void {
    if (watchId !== undefined) {
      const listener = WATCH_POSITION_SUBSCRIPTIONS.get(watchId);
      if (listener) {
        listener.remove();
        WATCH_POSITION_SUBSCRIPTIONS.delete(watchId);
      }
      NativeModule.stopWatchPosition({watchId: watchId});
    }
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
  static addGeofence(params:Geofence) {
    return new Promise((resolve:Function, reject:Function) => {
      NativeModule.addGeofence({options:params}).then(() => {
        resolve();
      }).catch((error:PluginResultError) => {
        reject(error.message);
      });
    });
  }

  static addGeofences(params:Geofence[]) {
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

  static removeGeofences(identifiers?:Array<string>) {
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
  static onLocation(cb:(location:Location) => void, onError?:(err:LocationError) => void) {
    return BackgroundGeolocation.addListener(Event.Location, cb, onError);
  }

  static onMotionChange(cb:(event:MotionChangeEvent) => void) {
    return BackgroundGeolocation.addListener(Event.MotionChange, cb);
  }

  static onHttp(cb:(event:HttpEvent) => void) {
    return BackgroundGeolocation.addListener(Event.Http, cb);
  }

  static onHeartbeat(cb:(event:HeartbeatEvent) => void) {
    return BackgroundGeolocation.addListener(Event.Heartbeat, cb);
  }

  static onProviderChange(cb:(event:ProviderChangeEvent) => void) {
    return BackgroundGeolocation.addListener(Event.ProviderChange, cb);
  }

  static onActivityChange(cb:(event:MotionActivityEvent) => void) {
    return BackgroundGeolocation.addListener(Event.ActivityChange, cb);
  }

  static onGeofence(cb:(event:GeofenceEvent) => void) {
    return BackgroundGeolocation.addListener(Event.Geofence, cb);
  }

  static onGeofencesChange(cb:(event:GeofencesChangeEvent) => void) {
    return BackgroundGeolocation.addListener(Event.GeofencesChange, cb);
  }

  static onSchedule(cb:(state:State) => void) {
    return BackgroundGeolocation.addListener(Event.Schedule, cb);
  }

  static onEnabledChange(cb:(enabled:boolean) => void) {
    return BackgroundGeolocation.addListener(Event.EnabledChange, cb);
  }

  static onConnectivityChange(cb:(event:ConnectivityChangeEvent) => void) {
    return BackgroundGeolocation.addListener(Event.ConnectivityChange, cb);
  }

  static onPowerSaveChange(cb:(enabled:boolean) => void) {
    return BackgroundGeolocation.addListener(Event.PowerSaveChange, cb);
  }

  static onNotificationAction(cb:(buttonId:string) => void) {
    return BackgroundGeolocation.addListener("notificationaction", cb);
  }

  static onAuthorization(cb:(event:AuthorizationEvent) => void) {
    return BackgroundGeolocation.addListener(Event.Authorization, cb);
  }

  ///
  /// Listen to a plugin event
  ///
  static addListener(event:string, success:Function, failure?:Function) {    
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





