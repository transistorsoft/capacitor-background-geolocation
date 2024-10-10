var capacitorBackgroundGeolocation = (function (core) {
    'use strict';

    var NativeModule$3 = core.Plugins.BackgroundGeolocation;
    var LOG_LEVEL_DEBUG$1 = "debug";
    var LOG_LEVEL_NOTICE = "notice";
    var LOG_LEVEL_INFO$1 = "info";
    var LOG_LEVEL_WARN = "warn";
    var LOG_LEVEL_ERROR$1 = "error";
    var ORDER_ASC = 1;
    var ORDER_DESC = -1;
    function log(level, msg) {
        return NativeModule$3.log({
            level: level,
            message: msg
        });
    }
    function validateQuery(query) {
        if (typeof (query) !== 'object')
            return {};
        if (query.hasOwnProperty('start') && isNaN(query.start)) {
            throw new Error('Invalid SQLQuery.start.  Expected unix timestamp but received: ' + query.start);
        }
        if (query.hasOwnProperty('end') && isNaN(query.end)) {
            throw new Error('Invalid SQLQuery.end.  Expected unix timestamp but received: ' + query.end);
        }
        return query;
    }
    var Logger = /** @class */ (function () {
        function Logger() {
        }
        Object.defineProperty(Logger, "ORDER_ASC", {
            get: function () { return ORDER_ASC; },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(Logger, "ORDER_DESC", {
            get: function () { return ORDER_DESC; },
            enumerable: false,
            configurable: true
        });
        Logger.debug = function (msg) {
            return log(LOG_LEVEL_DEBUG$1, msg);
        };
        Logger.error = function (msg) {
            return log(LOG_LEVEL_ERROR$1, msg);
        };
        Logger.warn = function (msg) {
            return log(LOG_LEVEL_WARN, msg);
        };
        Logger.info = function (msg) {
            return log(LOG_LEVEL_INFO$1, msg);
        };
        Logger.notice = function (msg) {
            return log(LOG_LEVEL_NOTICE, msg);
        };
        Logger.getLog = function (query) {
            query = validateQuery(query);
            return new Promise(function (resolve, reject) {
                NativeModule$3.getLog({ options: query }).then(function (result) {
                    resolve(result.log);
                }).catch(function (error) {
                    reject(error.message);
                });
            });
        };
        Logger.destroyLog = function () {
            return new Promise(function (resolve, reject) {
                NativeModule$3.destroyLog().then(function () {
                    resolve();
                }).catch(function (error) {
                    reject(error.message);
                });
            });
        };
        Logger.emailLog = function (email, query) {
            query = validateQuery(query);
            return new Promise(function (resolve, reject) {
                NativeModule$3.emailLog({ email: email, query: query }).then(function (result) {
                    resolve(result);
                }).catch(function (error) {
                    reject(error.message);
                });
            });
        };
        Logger.uploadLog = function (url, query) {
            query = validateQuery(query);
            return new Promise(function (resolve, reject) {
                NativeModule$3.uploadLog({ url: url, query: query }).then(function () {
                    resolve();
                }).catch(function (error) {
                    reject(error.message);
                });
            });
        };
        return Logger;
    }());

    var NativeModule$2 = core.Plugins.BackgroundGeolocation;
    var DEFAULT_URL = 'http://tracker.transistorsoft.com';
    var DUMMY_TOKEN = 'DUMMY_TOKEN';
    var REFRESH_PAYLOAD = {
        refresh_token: '{refreshToken}'
    };
    var LOCATIONS_PATH = '/api/locations';
    var REFRESH_TOKEN_PATH = '/api/refresh_token';
    var TransistorAuthorizationToken = /** @class */ (function () {
        function TransistorAuthorizationToken() {
        }
        TransistorAuthorizationToken.findOrCreate = function (orgname, username, url) {
            if (url === void 0) { url = DEFAULT_URL; }
            return new Promise(function (resolve, reject) {
                NativeModule$2.getTransistorToken({
                    org: orgname,
                    username: username,
                    url: url
                }).then(function (result) {
                    if (result.success) {
                        var token = result.token;
                        token.url = url;
                        resolve(token);
                    }
                    else {
                        console.warn('[TransistorAuthorizationToken findOrCreate] ERROR: ', result);
                        if (result.status == '403') {
                            reject(result);
                            return;
                        }
                        resolve({
                            accessToken: DUMMY_TOKEN,
                            refreshToken: DUMMY_TOKEN,
                            expires: -1,
                            url: url
                        });
                    }
                }).catch(function (error) {
                    reject(error);
                });
            });
        };
        TransistorAuthorizationToken.destroy = function (url) {
            if (url === void 0) { url = DEFAULT_URL; }
            return new Promise(function (resolve, reject) {
                NativeModule$2.destroyTransistorToken({ url: url }).then(function () {
                    resolve();
                }).catch(function (error) {
                    reject(error.message);
                });
            });
        };
        TransistorAuthorizationToken.applyIf = function (config) {
            if (!config.transistorAuthorizationToken)
                return config;
            var token = config.transistorAuthorizationToken;
            delete config.transistorAuthorizationToken;
            config.url = token.url + LOCATIONS_PATH;
            config.authorization = {
                strategy: 'JWT',
                accessToken: token.accessToken,
                refreshToken: token.refreshToken,
                refreshUrl: token.url + REFRESH_TOKEN_PATH,
                refreshPayload: REFRESH_PAYLOAD,
                expires: token.expires
            };
            return config;
        };
        return TransistorAuthorizationToken;
    }());

    var NativeModule$1 = core.Plugins.BackgroundGeolocation;
    var IGNORE_BATTERY_OPTIMIZATIONS = "IGNORE_BATTERY_OPTIMIZATIONS";
    var POWER_MANAGER = "POWER_MANAGER";
    var resolveSettingsRequest = function (resolve, request) {
        if (request.lastSeenAt > 0) {
            request.lastSeenAt = new Date(request.lastSeenAt);
        }
        resolve(request);
    };
    var DeviceSettings = /** @class */ (function () {
        function DeviceSettings() {
        }
        DeviceSettings.isIgnoringBatteryOptimizations = function () {
            return new Promise(function (resolve, reject) {
                NativeModule$1.isIgnoringBatteryOptimizations().then(function (result) {
                    resolve(result.isIgnoringBatteryOptimizations);
                }).catch(function (error) {
                    reject(error.message);
                });
            });
        };
        DeviceSettings.showIgnoreBatteryOptimizations = function () {
            return new Promise(function (resolve, reject) {
                var args = { action: IGNORE_BATTERY_OPTIMIZATIONS };
                NativeModule$1.requestSettings(args).then(function (result) {
                    resolveSettingsRequest(resolve, result);
                }).catch(function (error) {
                    reject(error.message);
                });
            });
        };
        DeviceSettings.showPowerManager = function () {
            return new Promise(function (resolve, reject) {
                var args = { action: POWER_MANAGER };
                NativeModule$1.requestSettings(args).then(function (result) {
                    resolveSettingsRequest(resolve, result);
                }).catch(function (error) {
                    reject(error.message);
                });
            });
        };
        DeviceSettings.show = function (request) {
            return new Promise(function (resolve, reject) {
                var args = { action: request.action };
                NativeModule$1.showSettings(args).then(function () {
                    resolve();
                }).catch(function (error) {
                    reject(error.message);
                });
            });
        };
        return DeviceSettings;
    }());

    var Events = {
        BOOT: "boot",
        TERMINATE: "terminate",
        LOCATION: "location",
        HTTP: "http",
        MOTIONCHANGE: "motionchange",
        PROVIDERCHANGE: "providerchange",
        HEARTBEAT: "heartbeat",
        ACTIVITYCHANGE: "activitychange",
        GEOFENCE: "geofence",
        GEOFENCESCHANGE: "geofenceschange",
        SCHEDULE: "schedule",
        CONNECTIVITYCHANGE: "connectivitychange",
        ENABLEDCHANGE: "enabledchange",
        POWERSAVECHANGE: "powersavechange",
        NOTIFICATIONACTION: "notificationaction",
        AUTHORIZATION: "authorization",
    };

    var __awaiter = (undefined && undefined.__awaiter) || function (thisArg, _arguments, P, generator) {
        function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
        return new (P || (P = Promise))(function (resolve, reject) {
            function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
            function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
            function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
            step((generator = generator.apply(thisArg, _arguments || [])).next());
        });
    };
    var __generator = (undefined && undefined.__generator) || function (thisArg, body) {
        var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
        return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
        function verb(n) { return function (v) { return step([n, v]); }; }
        function step(op) {
            if (f) throw new TypeError("Generator is already executing.");
            while (_) try {
                if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
                if (y = 0, t) op = [op[0] & 2, t.value];
                switch (op[0]) {
                    case 0: case 1: t = op; break;
                    case 4: _.label++; return { value: op[1], done: false };
                    case 5: _.label++; y = op[1]; op = [0]; continue;
                    case 7: op = _.ops.pop(); _.trys.pop(); continue;
                    default:
                        if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                        if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                        if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                        if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                        if (t[2]) _.ops.pop();
                        _.trys.pop(); continue;
                }
                op = body.call(thisArg, _);
            } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
            if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
        }
    };
    var NativeModule = core.registerPlugin('BackgroundGeolocation');
    var TAG = "TSLocationManager";
    /// Container for event-subscriptions.
    var EVENT_SUBSCRIPTIONS = [];
    /// Container for watchPostion subscriptions.
    var WATCH_POSITION_SUBSCRIPTIONS = [];
    /// Event handler Subscription
    ///
    var Subscription = /** @class */ (function () {
        function Subscription(event, subscription, callback) {
            this.event = event;
            this.subscription = subscription;
            this.callback = callback;
        }
        return Subscription;
    }());
    /// Validate provided config for #ready, #setConfig, #reset.
    var validateConfig = function (config) {
        // Detect obsolete notification* fields and re-map to Notification instance.
        if ((config.notificationPriority) ||
            (config.notificationText) ||
            (config.notificationTitle) ||
            (config.notificationChannelName) ||
            (config.notificationColor) ||
            (config.notificationSmallIcon) ||
            (config.notificationLargeIcon)) {
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
    var LOG_LEVEL_OFF = 0;
    var LOG_LEVEL_ERROR = 1;
    var LOG_LEVEL_WARNING = 2;
    var LOG_LEVEL_INFO = 3;
    var LOG_LEVEL_DEBUG = 4;
    var LOG_LEVEL_VERBOSE = 5;
    var DESIRED_ACCURACY_NAVIGATION = -2;
    var DESIRED_ACCURACY_HIGH = -1;
    var DESIRED_ACCURACY_MEDIUM = 10;
    var DESIRED_ACCURACY_LOW = 100;
    var DESIRED_ACCURACY_VERY_LOW = 1000;
    var DESIRED_ACCURACY_LOWEST = 3000;
    var AUTHORIZATION_STATUS_NOT_DETERMINED = 0;
    var AUTHORIZATION_STATUS_RESTRICTED = 1;
    var AUTHORIZATION_STATUS_DENIED = 2;
    var AUTHORIZATION_STATUS_ALWAYS = 3;
    var AUTHORIZATION_STATUS_WHEN_IN_USE = 4;
    var NOTIFICATION_PRIORITY_DEFAULT = 0;
    var NOTIFICATION_PRIORITY_HIGH = 1;
    var NOTIFICATION_PRIORITY_LOW = -1;
    var NOTIFICATION_PRIORITY_MAX = 2;
    var NOTIFICATION_PRIORITY_MIN = -2;
    var ACTIVITY_TYPE_OTHER = 1;
    var ACTIVITY_TYPE_AUTOMOTIVE_NAVIGATION = 2;
    var ACTIVITY_TYPE_FITNESS = 3;
    var ACTIVITY_TYPE_OTHER_NAVIGATION = 4;
    var ACTIVITY_TYPE_AIRBORNE = 5;
    var LOCATION_AUTHORIZATION_ALWAYS = "Always";
    var LOCATION_AUTHORIZATION_WHEN_IN_USE = "WhenInUse";
    var LOCATION_AUTHORIZATION_ANY = "Any";
    var PERSIST_MODE_ALL = 2;
    var PERSIST_MODE_LOCATION = 1;
    var PERSIST_MODE_GEOFENCE = -1;
    var PERSIST_MODE_NONE = 0;
    var ACCURACY_AUTHORIZATION_FULL = 0;
    var ACCURACY_AUTHORIZATION_REDUCED = 1;
    /// BackgroundGeolocation JS API
    var BackgroundGeolocation = /** @class */ (function () {
        function BackgroundGeolocation() {
        }
        Object.defineProperty(BackgroundGeolocation, "EVENT_BOOT", {
            /// Events
            get: function () { return Events.BOOT; },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(BackgroundGeolocation, "EVENT_TERMINATE", {
            get: function () { return Events.TERMINATE; },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(BackgroundGeolocation, "EVENT_LOCATION", {
            get: function () { return Events.LOCATION; },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(BackgroundGeolocation, "EVENT_MOTIONCHANGE", {
            get: function () { return Events.MOTIONCHANGE; },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(BackgroundGeolocation, "EVENT_HTTP", {
            get: function () { return Events.HTTP; },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(BackgroundGeolocation, "EVENT_HEARTBEAT", {
            get: function () { return Events.HEARTBEAT; },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(BackgroundGeolocation, "EVENT_PROVIDERCHANGE", {
            get: function () { return Events.PROVIDERCHANGE; },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(BackgroundGeolocation, "EVENT_ACTIVITYCHANGE", {
            get: function () { return Events.ACTIVITYCHANGE; },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(BackgroundGeolocation, "EVENT_GEOFENCE", {
            get: function () { return Events.GEOFENCE; },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(BackgroundGeolocation, "EVENT_GEOFENCESCHANGE", {
            get: function () { return Events.GEOFENCESCHANGE; },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(BackgroundGeolocation, "EVENT_ENABLEDCHANGE", {
            get: function () { return Events.ENABLEDCHANGE; },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(BackgroundGeolocation, "EVENT_CONNECTIVITYCHANGE", {
            get: function () { return Events.CONNECTIVITYCHANGE; },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(BackgroundGeolocation, "EVENT_SCHEDULE", {
            get: function () { return Events.SCHEDULE; },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(BackgroundGeolocation, "EVENT_POWERSAVECHANGE", {
            get: function () { return Events.POWERSAVECHANGE; },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(BackgroundGeolocation, "EVENT_NOTIFICATIONACTION", {
            get: function () { return Events.NOTIFICATIONACTION; },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(BackgroundGeolocation, "EVENT_AUTHORIZATION", {
            get: function () { return Events.AUTHORIZATION; },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(BackgroundGeolocation, "LOG_LEVEL_OFF", {
            get: function () { return LOG_LEVEL_OFF; },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(BackgroundGeolocation, "LOG_LEVEL_ERROR", {
            get: function () { return LOG_LEVEL_ERROR; },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(BackgroundGeolocation, "LOG_LEVEL_WARNING", {
            get: function () { return LOG_LEVEL_WARNING; },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(BackgroundGeolocation, "LOG_LEVEL_INFO", {
            get: function () { return LOG_LEVEL_INFO; },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(BackgroundGeolocation, "LOG_LEVEL_DEBUG", {
            get: function () { return LOG_LEVEL_DEBUG; },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(BackgroundGeolocation, "LOG_LEVEL_VERBOSE", {
            get: function () { return LOG_LEVEL_VERBOSE; },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(BackgroundGeolocation, "ACTIVITY_TYPE_OTHER", {
            get: function () { return ACTIVITY_TYPE_OTHER; },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(BackgroundGeolocation, "ACTIVITY_TYPE_AUTOMOTIVE_NAVIGATION", {
            get: function () { return ACTIVITY_TYPE_AUTOMOTIVE_NAVIGATION; },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(BackgroundGeolocation, "ACTIVITY_TYPE_FITNESS", {
            get: function () { return ACTIVITY_TYPE_FITNESS; },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(BackgroundGeolocation, "ACTIVITY_TYPE_OTHER_NAVIGATION", {
            get: function () { return ACTIVITY_TYPE_OTHER_NAVIGATION; },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(BackgroundGeolocation, "ACTIVITY_TYPE_AIRBORNE", {
            get: function () { return ACTIVITY_TYPE_AIRBORNE; },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(BackgroundGeolocation, "DESIRED_ACCURACY_NAVIGATION", {
            get: function () { return DESIRED_ACCURACY_NAVIGATION; },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(BackgroundGeolocation, "DESIRED_ACCURACY_HIGH", {
            get: function () { return DESIRED_ACCURACY_HIGH; },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(BackgroundGeolocation, "DESIRED_ACCURACY_MEDIUM", {
            get: function () { return DESIRED_ACCURACY_MEDIUM; },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(BackgroundGeolocation, "DESIRED_ACCURACY_LOW", {
            get: function () { return DESIRED_ACCURACY_LOW; },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(BackgroundGeolocation, "DESIRED_ACCURACY_VERY_LOW", {
            get: function () { return DESIRED_ACCURACY_VERY_LOW; },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(BackgroundGeolocation, "DESIRED_ACCURACY_LOWEST", {
            get: function () { return DESIRED_ACCURACY_LOWEST; },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(BackgroundGeolocation, "AUTHORIZATION_STATUS_NOT_DETERMINED", {
            get: function () { return AUTHORIZATION_STATUS_NOT_DETERMINED; },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(BackgroundGeolocation, "AUTHORIZATION_STATUS_RESTRICTED", {
            get: function () { return AUTHORIZATION_STATUS_RESTRICTED; },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(BackgroundGeolocation, "AUTHORIZATION_STATUS_DENIED", {
            get: function () { return AUTHORIZATION_STATUS_DENIED; },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(BackgroundGeolocation, "AUTHORIZATION_STATUS_ALWAYS", {
            get: function () { return AUTHORIZATION_STATUS_ALWAYS; },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(BackgroundGeolocation, "AUTHORIZATION_STATUS_WHEN_IN_USE", {
            get: function () { return AUTHORIZATION_STATUS_WHEN_IN_USE; },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(BackgroundGeolocation, "NOTIFICATION_PRIORITY_DEFAULT", {
            get: function () { return NOTIFICATION_PRIORITY_DEFAULT; },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(BackgroundGeolocation, "NOTIFICATION_PRIORITY_HIGH", {
            get: function () { return NOTIFICATION_PRIORITY_HIGH; },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(BackgroundGeolocation, "NOTIFICATION_PRIORITY_LOW", {
            get: function () { return NOTIFICATION_PRIORITY_LOW; },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(BackgroundGeolocation, "NOTIFICATION_PRIORITY_MAX", {
            get: function () { return NOTIFICATION_PRIORITY_MAX; },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(BackgroundGeolocation, "NOTIFICATION_PRIORITY_MIN", {
            get: function () { return NOTIFICATION_PRIORITY_MIN; },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(BackgroundGeolocation, "LOCATION_AUTHORIZATION_ALWAYS", {
            get: function () { return LOCATION_AUTHORIZATION_ALWAYS; },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(BackgroundGeolocation, "LOCATION_AUTHORIZATION_WHEN_IN_USE", {
            get: function () { return LOCATION_AUTHORIZATION_WHEN_IN_USE; },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(BackgroundGeolocation, "LOCATION_AUTHORIZATION_ANY", {
            get: function () { return LOCATION_AUTHORIZATION_ANY; },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(BackgroundGeolocation, "PERSIST_MODE_ALL", {
            get: function () { return PERSIST_MODE_ALL; },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(BackgroundGeolocation, "PERSIST_MODE_LOCATION", {
            get: function () { return PERSIST_MODE_LOCATION; },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(BackgroundGeolocation, "PERSIST_MODE_GEOFENCE", {
            get: function () { return PERSIST_MODE_GEOFENCE; },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(BackgroundGeolocation, "PERSIST_MODE_NONE", {
            get: function () { return PERSIST_MODE_NONE; },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(BackgroundGeolocation, "ACCURACY_AUTHORIZATION_FULL", {
            get: function () { return ACCURACY_AUTHORIZATION_FULL; },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(BackgroundGeolocation, "ACCURACY_AUTHORIZATION_REDUCED", {
            get: function () { return ACCURACY_AUTHORIZATION_REDUCED; },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(BackgroundGeolocation, "logger", {
            get: function () { return Logger; },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(BackgroundGeolocation, "deviceSettings", {
            get: function () { return DeviceSettings; },
            enumerable: false,
            configurable: true
        });
        BackgroundGeolocation.ready = function (config) {
            return NativeModule.ready({ options: validateConfig(config) });
        };
        BackgroundGeolocation.reset = function (config) {
            return NativeModule.reset({ options: validateConfig(config) });
        };
        BackgroundGeolocation.start = function () {
            return NativeModule.start();
        };
        BackgroundGeolocation.stop = function () {
            return NativeModule.stop();
        };
        BackgroundGeolocation.startSchedule = function () {
            return NativeModule.startSchedule();
        };
        BackgroundGeolocation.stopSchedule = function () {
            return NativeModule.stopSchedule();
        };
        BackgroundGeolocation.startGeofences = function () {
            return NativeModule.startGeofences();
        };
        BackgroundGeolocation.setConfig = function (config) {
            return NativeModule.setConfig({ options: validateConfig(config) });
        };
        BackgroundGeolocation.getState = function () {
            return NativeModule.getState();
        };
        BackgroundGeolocation.changePace = function (isMoving) {
            return new Promise(function (resolve, reject) {
                NativeModule.changePace({ isMoving: isMoving }).then(function () {
                    resolve();
                }).catch(function (error) {
                    reject(error.errorMessage);
                });
            });
        };
        BackgroundGeolocation.getCurrentPosition = function (options) {
            options = options || {};
            return new Promise(function (resolve, reject) {
                NativeModule.getCurrentPosition({ options: options }).then(function (result) {
                    resolve(result);
                }).catch(function (error) {
                    reject(error.code);
                });
            });
        };
        BackgroundGeolocation.watchPosition = function (onLocation, onError, options) {
            var _this = this;
            options = options || {};
            return new Promise(function (resolve, reject) { return __awaiter(_this, void 0, void 0, function () {
                var handler, listener;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            handler = function (response) {
                                if (response.hasOwnProperty("error") && (response.error != null)) {
                                    if (typeof (onError) === 'function') {
                                        onError(response.error.code);
                                    }
                                    else {
                                        console.warn('[BackgroundGeolocation watchPostion] DEFAULT ERROR HANDLER.  Provide an onError handler to watchPosition to receive this message: ', response.error);
                                    }
                                }
                                else {
                                    onLocation(response);
                                }
                            };
                            return [4 /*yield*/, NativeModule.addListener("watchposition", handler)];
                        case 1:
                            listener = _a.sent();
                            NativeModule.watchPosition({ options: options }).then(function () {
                                WATCH_POSITION_SUBSCRIPTIONS.push(listener);
                                resolve();
                            }).catch(function (error) {
                                listener.remove();
                                reject(error.message);
                            });
                            return [2 /*return*/];
                    }
                });
            }); });
        };
        BackgroundGeolocation.stopWatchPosition = function () {
            for (var n = 0; n < WATCH_POSITION_SUBSCRIPTIONS.length; n++) {
                var subscription = WATCH_POSITION_SUBSCRIPTIONS[n];
                subscription.remove();
            }
            return NativeModule.stopWatchPosition();
        };
        BackgroundGeolocation.requestPermission = function () {
            return new Promise(function (resolve, reject) {
                NativeModule.requestPermission().then(function (result) {
                    if (result.success) {
                        resolve(result.status);
                    }
                    else {
                        reject(result.status);
                    }
                });
            });
        };
        BackgroundGeolocation.requestTemporaryFullAccuracy = function (purpose) {
            return new Promise(function (resolve, reject) {
                NativeModule.requestTemporaryFullAccuracy({ purpose: purpose }).then(function (result) {
                    resolve(result.accuracyAuthorization);
                }).catch(function (error) {
                    reject(error.message);
                });
            });
        };
        BackgroundGeolocation.getProviderState = function () {
            return NativeModule.getProviderState();
        };
        /// Locations database
        ///
        BackgroundGeolocation.getLocations = function () {
            return new Promise(function (resolve, reject) {
                NativeModule.getLocations().then(function (result) {
                    resolve(result.locations);
                }).catch(function (error) {
                    reject(error.message);
                });
            });
        };
        BackgroundGeolocation.insertLocation = function (params) {
            return new Promise(function (resolve, reject) {
                NativeModule.insertLocation({ options: params }).then(function (result) {
                    resolve(result.uuid);
                }).catch(function (error) {
                    reject(error.message);
                });
            });
        };
        BackgroundGeolocation.destroyLocations = function () {
            return new Promise(function (resolve, reject) {
                NativeModule.destroyLocations().then(function () {
                    resolve();
                }).catch(function (error) {
                    reject(error.message);
                });
            });
        };
        BackgroundGeolocation.destroyLocation = function (uuid) {
            return new Promise(function (resolve, reject) {
                NativeModule.destroyLocation({ uuid: uuid }).then(function () {
                    resolve();
                }).catch(function (error) {
                    reject(error.message);
                });
            });
        };
        BackgroundGeolocation.getCount = function () {
            return new Promise(function (resolve, reject) {
                NativeModule.getCount().then(function (result) {
                    resolve(result.count);
                }).catch(function (error) {
                    reject(error.message);
                });
            });
        };
        BackgroundGeolocation.sync = function () {
            return new Promise(function (resolve, reject) {
                NativeModule.sync().then(function (result) {
                    resolve(result.locations);
                }).catch(function (error) {
                    reject(error.message);
                });
            });
        };
        /// Geofencing
        ///
        BackgroundGeolocation.addGeofence = function (params) {
            return new Promise(function (resolve, reject) {
                NativeModule.addGeofence({ options: params }).then(function () {
                    resolve();
                }).catch(function (error) {
                    reject(error.message);
                });
            });
        };
        BackgroundGeolocation.addGeofences = function (params) {
            return new Promise(function (resolve, reject) {
                NativeModule.addGeofences({ options: params }).then(function () {
                    resolve();
                }).catch(function (error) {
                    reject(error.message);
                });
            });
        };
        BackgroundGeolocation.getGeofences = function () {
            return new Promise(function (resolve, reject) {
                NativeModule.getGeofences().then(function (result) {
                    resolve(result.geofences);
                }).catch(function (error) {
                    reject(error.message);
                });
            });
        };
        BackgroundGeolocation.getGeofence = function (identifier) {
            return new Promise(function (resolve, reject) {
                if (identifier === null) {
                    reject('identifier is null');
                    return;
                }
                NativeModule.getGeofence({ identifier: identifier }).then(function (result) {
                    resolve(result);
                }).catch(function (error) {
                    reject(error.message);
                });
            });
        };
        BackgroundGeolocation.geofenceExists = function (identifier) {
            return new Promise(function (resolve, reject) {
                if (identifier === null) {
                    reject('identifier is null');
                    return;
                }
                NativeModule.geofenceExists({ identifier: identifier }).then(function (result) {
                    resolve(result.exists);
                }).catch(function (error) {
                    reject(error.message);
                });
            });
        };
        BackgroundGeolocation.removeGeofence = function (identifier) {
            return new Promise(function (resolve, reject) {
                if (identifier === null) {
                    reject('identifier is null');
                    return;
                }
                NativeModule.removeGeofence({ identifier: identifier }).then(function () {
                    resolve();
                }).catch(function (error) {
                    reject(error.message);
                });
            });
        };
        BackgroundGeolocation.removeGeofences = function (identifiers) {
            identifiers = identifiers || [];
            return new Promise(function (resolve, reject) {
                NativeModule.removeGeofences({ identifiers: identifiers }).then(function () {
                    resolve();
                }).catch(function (error) {
                    reject(error.message);
                });
            });
        };
        /// Odometer
        ///
        BackgroundGeolocation.getOdometer = function () {
            return new Promise(function (resolve, reject) {
                NativeModule.getOdometer().then(function (result) {
                    resolve(result.odometer);
                }).catch(function (error) {
                    reject(error.message);
                });
            });
        };
        BackgroundGeolocation.setOdometer = function (value) {
            return new Promise(function (resolve, reject) {
                NativeModule.setOdometer({ "odometer": value }).then(function (result) {
                    resolve(result);
                }).catch(function (error) {
                    reject(error.message);
                });
            });
        };
        BackgroundGeolocation.resetOdometer = function () {
            return BackgroundGeolocation.setOdometer(0);
        };
        /// Background Tasks
        ///
        BackgroundGeolocation.startBackgroundTask = function () {
            return new Promise(function (resolve, reject) {
                NativeModule.startBackgroundTask().then(function (result) {
                    resolve(result.taskId);
                }).catch(function (error) {
                    reject(error.message);
                });
            });
        };
        BackgroundGeolocation.stopBackgroundTask = function (taskId) {
            return new Promise(function (resolve, reject) {
                NativeModule.stopBackgroundTask({ taskId: taskId }).then(function () {
                    resolve();
                }).catch(function (error) {
                    reject(error.message);
                });
            });
        };
        /// @alias stopBackgroundTask
        BackgroundGeolocation.finish = function (taskId) {
            return BackgroundGeolocation.stopBackgroundTask(taskId);
        };
        BackgroundGeolocation.getDeviceInfo = function () {
            return NativeModule.getDeviceInfo();
        };
        BackgroundGeolocation.playSound = function (soundId) {
            return NativeModule.playSound({ soundId: soundId });
        };
        BackgroundGeolocation.isPowerSaveMode = function () {
            return new Promise(function (resolve, reject) {
                NativeModule.isPowerSaveMode().then(function (result) {
                    resolve(result.isPowerSaveMode);
                }).catch(function (error) {
                    reject(error.message);
                });
            });
        };
        BackgroundGeolocation.getSensors = function () {
            return NativeModule.getSensors();
        };
        /// TransistorAuthorizationToken
        ///
        BackgroundGeolocation.findOrCreateTransistorAuthorizationToken = function (orgname, username, url) {
            return TransistorAuthorizationToken.findOrCreate(orgname, username, url);
        };
        BackgroundGeolocation.destroyTransistorAuthorizationToken = function (url) {
            return TransistorAuthorizationToken.destroy(url);
        };
        /// Event Handling
        ///
        BackgroundGeolocation.onLocation = function (success, failure) {
            return BackgroundGeolocation.addListener(Events.LOCATION, success, failure);
        };
        BackgroundGeolocation.onMotionChange = function (success) {
            return BackgroundGeolocation.addListener(Events.MOTIONCHANGE, success);
        };
        BackgroundGeolocation.onHttp = function (success) {
            return BackgroundGeolocation.addListener(Events.HTTP, success);
        };
        BackgroundGeolocation.onHeartbeat = function (success) {
            return BackgroundGeolocation.addListener(Events.HEARTBEAT, success);
        };
        BackgroundGeolocation.onProviderChange = function (success) {
            return BackgroundGeolocation.addListener(Events.PROVIDERCHANGE, success);
        };
        BackgroundGeolocation.onActivityChange = function (success) {
            return BackgroundGeolocation.addListener(Events.ACTIVITYCHANGE, success);
        };
        BackgroundGeolocation.onGeofence = function (success) {
            return BackgroundGeolocation.addListener(Events.GEOFENCE, success);
        };
        BackgroundGeolocation.onGeofencesChange = function (success) {
            return BackgroundGeolocation.addListener(Events.GEOFENCESCHANGE, success);
        };
        BackgroundGeolocation.onSchedule = function (success) {
            return BackgroundGeolocation.addListener(Events.SCHEDULE, success);
        };
        BackgroundGeolocation.onEnabledChange = function (success) {
            return BackgroundGeolocation.addListener(Events.ENABLEDCHANGE, success);
        };
        BackgroundGeolocation.onConnectivityChange = function (success) {
            return BackgroundGeolocation.addListener(Events.CONNECTIVITYCHANGE, success);
        };
        BackgroundGeolocation.onPowerSaveChange = function (success) {
            return BackgroundGeolocation.addListener(Events.POWERSAVECHANGE, success);
        };
        BackgroundGeolocation.onNotificationAction = function (success) {
            return BackgroundGeolocation.addListener(Events.NOTIFICATIONACTION, success);
        };
        BackgroundGeolocation.onAuthorization = function (success) {
            return BackgroundGeolocation.addListener(Events.AUTHORIZATION, success);
        };
        ///
        /// Listen to a plugin event
        ///
        BackgroundGeolocation.addListener = function (event, success, failure) {
            if (!Events[event.toUpperCase()]) {
                throw (TAG + "#addListener - Unknown event '" + event + "'");
            }
            var handler = function (response) {
                if (response.hasOwnProperty("value")) {
                    response = response.value;
                }
                if (response.hasOwnProperty("error") && (response.error != null)) {
                    if (typeof (failure) === 'function') {
                        failure(response.error);
                    }
                    else {
                        success(response);
                    }
                }
                else {
                    success(response);
                }
            };
            // Create a flag to capture edge-case where the developer subscribes to an event then IMMEDIATELY calls subscription.remove()
            // before NativeModule.addListener has resolved.
            // The developer would have to do something weird like this:
            //   const subscription = BackgroundGeolocation.onLocation(this.onLocation);
            //   subscription.remove();
            //
            // The reason for this is I don't want developers to have to await calls to BackgroundGeolocation.onXXX(myHandler).
            //
            var isRemoved = false;
            var subscriptionProxy = {
                remove: function () {
                    // EmptyFn until NativeModule.addListener resolves and re-writes this function
                    isRemoved = true;
                    console.warn('[BackgroundGeolocation.addListener] Unexpected call to subscription.remove() on subscriptionProxy.  Waiting for NativeModule.addListener to resolve.');
                }
            };
            // Now add the listener and re-write subscriptionProxy.remove.
            NativeModule.addListener(event, handler).then(function (listener) {
                var subscription = new Subscription(event, listener, success);
                EVENT_SUBSCRIPTIONS.push(subscription);
                subscriptionProxy.remove = function () {
                    listener.remove();
                    // Remove from EVENT_SUBSCRIPTIONS.
                    if (EVENT_SUBSCRIPTIONS.indexOf(subscription) >= 0) {
                        EVENT_SUBSCRIPTIONS.splice(EVENT_SUBSCRIPTIONS.indexOf(subscription), 1);
                    }
                };
                if (isRemoved) {
                    // Caught edge-case.  Developer added an event-handler then immediately call subscription.remove().
                    subscriptionProxy.remove();
                }
            });
            return subscriptionProxy;
        };
        BackgroundGeolocation.removeListener = function (event, callback) {
            console.warn('BackgroundGeolocation.removeListener is deprecated.  Event-listener methods (eg: onLocation) now return a Subscription instance.  Call subscription.remove() on the returned subscription instead.  Eg:\nconst subscription = BackgroundGeolocation.onLocation(myLocationHandler)\n...\nsubscription.remove()');
            return new Promise(function (resolve, reject) {
                var found = null;
                for (var n = 0, len = EVENT_SUBSCRIPTIONS.length; n < len; n++) {
                    var sub = EVENT_SUBSCRIPTIONS[n];
                    if ((sub.event === event) && (sub.callback === callback)) {
                        found = sub;
                        break;
                    }
                }
                if (found !== null) {
                    EVENT_SUBSCRIPTIONS.splice(EVENT_SUBSCRIPTIONS.indexOf(found), 1);
                    found.subscription.remove();
                    resolve();
                }
                else {
                    console.warn(TAG + ' Failed to find listener for event ' + event);
                    reject();
                }
            });
        };
        BackgroundGeolocation.removeListeners = function () {
            var _this = this;
            return new Promise(function (resolve) { return __awaiter(_this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            EVENT_SUBSCRIPTIONS = [];
                            return [4 /*yield*/, NativeModule.removeAllEventListeners()];
                        case 1:
                            _a.sent();
                            resolve();
                            return [2 /*return*/];
                    }
                });
            }); });
        };
        return BackgroundGeolocation;
    }());

    return BackgroundGeolocation;

})(capacitorExports);
