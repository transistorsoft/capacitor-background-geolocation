import {
  PluginResultError,
  Plugins
} from '@capacitor/core';

const NativeModule:any = Plugins.BackgroundGeolocation;

const LOG_LEVEL_DEBUG = "debug";
const LOG_LEVEL_NOTICE = "notice";
const LOG_LEVEL_INFO = "info";
const LOG_LEVEL_WARN = "warn";
const LOG_LEVEL_ERROR = "error";

const ORDER_ASC = 1;
const ORDER_DESC = -1;

function log(level:string, msg:string) {
  return NativeModule.log({
  	level: level,
  	message: msg
  });
}

function validateQuery(query:any) {
  if (typeof(query) !== 'object') return {};

  if (query.hasOwnProperty('start') && isNaN(query.start)) {
    throw new Error('Invalid SQLQuery.start.  Expected unix timestamp but received: ' + query.start);
  }
  if (query.hasOwnProperty('end') && isNaN(query.end)) {
    throw new Error('Invalid SQLQuery.end.  Expected unix timestamp but received: ' + query.end);
  }
  return query;
}

export default class Logger {
  static get ORDER_ASC() { return ORDER_ASC; }
  static get ORDER_DESC() { return ORDER_DESC; }

  static debug(msg:string) {
    return log(LOG_LEVEL_DEBUG, msg);
  }

  static error(msg:string) {
    return log(LOG_LEVEL_ERROR, msg);
  }

  static warn(msg:string) {
    return log(LOG_LEVEL_WARN, msg);
  }

  static info(msg:string) {
    return log(LOG_LEVEL_INFO, msg);
  }

  static notice(msg:string) {
    return log(LOG_LEVEL_NOTICE, msg);
  }

  static getLog(query?:any) {
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

  static emailLog(email:string, query?:any) {
    query = validateQuery(query);
    return new Promise((resolve:Function, reject:Function) => {
      NativeModule.emailLog({email:email, query:query}).then((result:any) => {
        resolve(result);
      }).catch((error:PluginResultError) => {
        reject(error.message);
      });
    });
  }

  static uploadLog(url:string, query?:any) {
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
