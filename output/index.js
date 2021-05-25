var capacitorBackgroundGeolocation = (function (core) {
    'use strict';

    var TAG = "TSLocationManager";
    var Events = {
        "BOOT": "boot",
        "TERMINATE": "terminate",
        "LOCATION": "location",
        "HTTP": "http",
        "MOTIONCHANGE": "motionchange",
        "PROVIDERCHANGE": "providerchange",
        "HEARTBEAT": "heartbeat",
        "ACTIVITYCHANGE": "activitychange",
        "GEOFENCE": "geofence",
        "GEOFENCESCHANGE": "geofenceschange",
        "SCHEDULE": "schedule",
        "CONNECTIVITYCHANGE": "connectivitychange",
        "ENABLEDCHANGE": "enabledchange",
        "POWERSAVECHANGE": "powersavechange",
        "NOTIFICATIONACTION": "notificationaction",
        "AUTHORIZATION": "authorization"
    };
    var EVENT_SUBSCRIPTIONS = [];
    var Subscription = /** @class */ (function () {
        function Subscription(event, subscription, callback) {
            this.event = event;
            this.subscription = subscription;
            this.callback = callback;
        }
        return Subscription;
    }());
    var NativeModule = core.Plugins.BackgroundGeolocation;
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
    var LOCATION_AUTHORIZATION_ALWAYS = "Always";
    var LOCATION_AUTHORIZATION_WHEN_IN_USE = "WhenInUse";
    var LOCATION_AUTHORIZATION_ANY = "Any";
    var PERSIST_MODE_ALL = 2;
    var PERSIST_MODE_LOCATION = 1;
    var PERSIST_MODE_GEOFENCE = -1;
    var PERSIST_MODE_NONE = 0;
    var ACCURACY_AUTHORIZATION_FULL = 0;
    var ACCURACY_AUTHORIZATION_REDUCED = 1;
    var BackgroundGeolocation = /** @class */ (function () {
        function BackgroundGeolocation() {
        }
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
        BackgroundGeolocation.ready = function (config) {
            return NativeModule.ready({ options: config });
        };
        BackgroundGeolocation.reset = function (config) {
            return NativeModule.reset({ options: config });
        };
        BackgroundGeolocation.start = function () {
            return NativeModule.start();
        };
        BackgroundGeolocation.stop = function () {
            return NativeModule.stop();
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
                    reject(error.errorMessage);
                });
            });
        };
        BackgroundGeolocation.getProviderState = function () {
            return NativeModule.getProviderState();
        };
        BackgroundGeolocation.onLocation = function (success, failure) {
            BackgroundGeolocation.addListener(Events.LOCATION, success, failure);
        };
        BackgroundGeolocation.onMotionChange = function (success) {
            BackgroundGeolocation.addListener(Events.MOTIONCHANGE, success);
        };
        BackgroundGeolocation.onHttp = function (success) {
            BackgroundGeolocation.addListener(Events.HTTP, success);
        };
        BackgroundGeolocation.onHeartbeat = function (success) {
            BackgroundGeolocation.addListener(Events.HEARTBEAT, success);
        };
        BackgroundGeolocation.onProviderChange = function (success) {
            BackgroundGeolocation.addListener(Events.PROVIDERCHANGE, success);
        };
        BackgroundGeolocation.onActivityChange = function (success) {
            BackgroundGeolocation.addListener(Events.ACTIVITYCHANGE, success);
        };
        BackgroundGeolocation.onGeofence = function (success) {
            BackgroundGeolocation.addListener(Events.GEOFENCE, success);
        };
        BackgroundGeolocation.onGeofencesChange = function (success) {
            BackgroundGeolocation.addListener(Events.GEOFENCESCHANGE, success);
        };
        BackgroundGeolocation.onSchedule = function (success) {
            BackgroundGeolocation.addListener(Events.SCHEDULE, success);
        };
        BackgroundGeolocation.onEnabledChange = function (success) {
            BackgroundGeolocation.addListener(Events.ENABLEDCHANGE, success);
        };
        BackgroundGeolocation.onConnectivityChange = function (success) {
            BackgroundGeolocation.addListener(Events.CONNECTIVITYCHANGE, success);
        };
        BackgroundGeolocation.onPowerSaveChange = function (success) {
            BackgroundGeolocation.addListener(Events.POWERSAVECHANGE, success);
        };
        BackgroundGeolocation.onNotificationAction = function (success) {
            BackgroundGeolocation.addListener(Events.NOTIFICATIONACTION, success);
        };
        BackgroundGeolocation.onAuthorization = function (success) {
            BackgroundGeolocation.addListener(Events.AUTHORIZATION, success);
        };
        /**
        * Listen to a plugin event
        */
        BackgroundGeolocation.addListener = function (event, success, failure) {
            if (!Events[event.toUpperCase()]) {
                throw (TAG + "#addListener - Unknown event '" + event + "'");
            }
            var handler = function (response) {
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
            var listener = NativeModule.addListener(event, handler);
            var subscription = new Subscription(event, listener, success);
            EVENT_SUBSCRIPTIONS.push(subscription);
        };
        BackgroundGeolocation.removeListener = function (event, callback) {
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
                    reject(TAG + ' Failed to find listener for event ' + event);
                }
            });
        };
        return BackgroundGeolocation;
    }());

    return BackgroundGeolocation;

}(capacitorExports));
