#import <Foundation/Foundation.h>
#import <Capacitor/Capacitor.h>

// Define the plugin using the CAP_PLUGIN Macro, and
// each method the plugin supports using the CAP_PLUGIN_METHOD macro.
CAP_PLUGIN(BackgroundGeolocationModule, "BackgroundGeolocation",
           CAP_PLUGIN_METHOD(ready, CAPPluginReturnPromise);
           CAP_PLUGIN_METHOD(reset, CAPPluginReturnPromise);
           CAP_PLUGIN_METHOD(setConfig, CAPPluginReturnPromise);
           CAP_PLUGIN_METHOD(getState, CAPPluginReturnPromise);
           CAP_PLUGIN_METHOD(start, CAPPluginReturnPromise);
           CAP_PLUGIN_METHOD(startGeofences, CAPPluginReturnPromise);
           CAP_PLUGIN_METHOD(startSchedule, CAPPluginReturnPromise);
           CAP_PLUGIN_METHOD(stopSchedule, CAPPluginReturnPromise);
           CAP_PLUGIN_METHOD(stop, CAPPluginReturnPromise);
           CAP_PLUGIN_METHOD(changePace, CAPPluginReturnPromise);
           CAP_PLUGIN_METHOD(getProviderState, CAPPluginReturnPromise);
           CAP_PLUGIN_METHOD(requestPermission, CAPPluginReturnPromise);
           CAP_PLUGIN_METHOD(requestTemporaryFullAccuracy, CAPPluginReturnPromise);
           CAP_PLUGIN_METHOD(sync, CAPPluginReturnPromise);
           CAP_PLUGIN_METHOD(getCurrentPosition, CAPPluginReturnPromise);
           CAP_PLUGIN_METHOD(watchPosition, CAPPluginReturnPromise);
           CAP_PLUGIN_METHOD(stopWatchPosition, CAPPluginReturnPromise);
           
           CAP_PLUGIN_METHOD(addGeofence, CAPPluginReturnPromise);
           CAP_PLUGIN_METHOD(addGeofences, CAPPluginReturnPromise);
           CAP_PLUGIN_METHOD(getGeofences, CAPPluginReturnPromise);
           CAP_PLUGIN_METHOD(getGeofence, CAPPluginReturnPromise);
           CAP_PLUGIN_METHOD(geofenceExists, CAPPluginReturnPromise);
           CAP_PLUGIN_METHOD(removeGeofence, CAPPluginReturnPromise);
           CAP_PLUGIN_METHOD(removeGeofences, CAPPluginReturnPromise);
           
           CAP_PLUGIN_METHOD(getOdometer, CAPPluginReturnPromise);
           CAP_PLUGIN_METHOD(setOdometer, CAPPluginReturnPromise);
           CAP_PLUGIN_METHOD(getLocations, CAPPluginReturnPromise);
           CAP_PLUGIN_METHOD(getCount, CAPPluginReturnPromise);
           CAP_PLUGIN_METHOD(insertLocation, CAPPluginReturnPromise);
           CAP_PLUGIN_METHOD(destroyLocations, CAPPluginReturnPromise);
           CAP_PLUGIN_METHOD(destroyLocation, CAPPluginReturnPromise);
           CAP_PLUGIN_METHOD(getProviderState, CAPPluginReturnPromise);
           
           CAP_PLUGIN_METHOD(startBackgroundTask, CAPPluginReturnPromise);
           CAP_PLUGIN_METHOD(stopBackgroundTask, CAPPluginReturnPromise);
           
           CAP_PLUGIN_METHOD(getLog, CAPPluginReturnPromise);
           CAP_PLUGIN_METHOD(destroyLog, CAPPluginReturnPromise);
           CAP_PLUGIN_METHOD(emailLog, CAPPluginReturnPromise);
           CAP_PLUGIN_METHOD(uploadLog, CAPPluginReturnPromise);
           CAP_PLUGIN_METHOD(log, CAPPluginReturnPromise);
           
           CAP_PLUGIN_METHOD(getSensors, CAPPluginReturnPromise);
           CAP_PLUGIN_METHOD(getDeviceInfo, CAPPluginReturnPromise);
           CAP_PLUGIN_METHOD(isPowerSaveMode, CAPPluginReturnPromise);
           CAP_PLUGIN_METHOD(isIgnoringBatteryOptimizations, CAPPluginReturnPromise);
           CAP_PLUGIN_METHOD(requestSettings, CAPPluginReturnPromise);
           CAP_PLUGIN_METHOD(showSettings, CAPPluginReturnPromise);
           
           CAP_PLUGIN_METHOD(playSound, CAPPluginReturnPromise);
           
           CAP_PLUGIN_METHOD(getTransistorToken, CAPPluginReturnPromise);
           CAP_PLUGIN_METHOD(destroyTransistorToken, CAPPluginReturnPromise);
           CAP_PLUGIN_METHOD(removeAllEventListeners, CAPPluginReturnPromise);
)


