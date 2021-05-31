/**
* This is just a helper for including the plugin from either the public npm version or the latest
* release from private version (customers only)
*/

import BackgroundGeolocation, {
  State,
  Config,
  Location,
  LocationError,
  Geofence,
  HttpEvent,
  MotionActivityEvent,
  ProviderChangeEvent,
  MotionChangeEvent,
  GeofenceEvent,
  GeofencesChangeEvent,
  HeartbeatEvent,
  ConnectivityChangeEvent,
  DeviceSettings,
  DeviceSettingsRequest,
  SQLQuery,
  Authorization, AuthorizationEvent,
  DeviceInfo,
  TransistorAuthorizationToken
} from "@transistorsoft/capacitor-background-geolocation";  // <-- Use "capacitor-background-geolocation" for customers-only version


export default BackgroundGeolocation;

export {
  State,
  Config,
  Location,
  LocationError,
  Geofence,
  HttpEvent,
  MotionActivityEvent,
  ProviderChangeEvent,
  MotionChangeEvent,
  GeofenceEvent,
  GeofencesChangeEvent,
  HeartbeatEvent,
  ConnectivityChangeEvent,
  DeviceSettings,
  DeviceSettingsRequest,
  SQLQuery,
  Authorization, AuthorizationEvent,
  DeviceInfo,
  TransistorAuthorizationToken
};
