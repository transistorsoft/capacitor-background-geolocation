import {
  PluginResultError,
  Plugin
} from '@capacitor/core';

const NativeModule:any = Plugin.BackgroundGeolocation;

const IGNORE_BATTERY_OPTIMIZATIONS = "IGNORE_BATTERY_OPTIMIZATIONS";
const POWER_MANAGER = "POWER_MANAGER";

const resolveSettingsRequest = (resolve:Function, request:any) => {
  if (request.lastSeenAt > 0) {
    request.lastSeenAt = new Date(request.lastSeenAt);
  }
  resolve(request);
}

export default class DeviceSettings {
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

  static show(request:any) {
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
