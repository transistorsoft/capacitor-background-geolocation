import Foundation
import CoreLocation
import UIKit
import Capacitor
import TSLocationManager

// Event name constants are provided by TSEventName* from TSLocationManager SDK.

@objc(BackgroundGeolocationModule)
public class BackgroundGeolocationModule: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "BackgroundGeolocationPlugin"
    public let jsName = "BackgroundGeolocation"
    
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "registerPlugin", returnType: CAPPluginReturnNone),
        CAPPluginMethod(name: "ready", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "reset", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "setConfig", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "getState", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "start", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "startGeofences", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "startSchedule", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "stopSchedule", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "stop", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "changePace", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "getProviderState", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "requestPermission", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "requestTemporaryFullAccuracy", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "sync", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "getCurrentPosition", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "watchPosition", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "stopWatchPosition", returnType: CAPPluginReturnPromise),
        
        CAPPluginMethod(name: "addGeofence", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "addGeofences", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "getGeofences", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "getGeofence", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "geofenceExists", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "removeGeofence", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "removeGeofences", returnType: CAPPluginReturnPromise),
        
        CAPPluginMethod(name: "getOdometer", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "setOdometer", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "getLocations", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "getCount", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "insertLocation", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "destroyLocations", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "destroyLocation", returnType: CAPPluginReturnPromise),

        CAPPluginMethod(name: "startBackgroundTask", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "stopBackgroundTask", returnType: CAPPluginReturnPromise),
        
        CAPPluginMethod(name: "getLog", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "destroyLog", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "emailLog", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "uploadLog", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "log", returnType: CAPPluginReturnPromise),
        
        CAPPluginMethod(name: "getSensors", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "getDeviceInfo", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "isPowerSaveMode", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "isIgnoringBatteryOptimizations", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "requestSettings", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "showSettings", returnType: CAPPluginReturnPromise),
        
        CAPPluginMethod(name: "playSound", returnType: CAPPluginReturnPromise),
        
        CAPPluginMethod(name: "getTransistorToken", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "destroyTransistorToken", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "removeAllEventListeners", returnType: CAPPluginReturnPromise)
    ]

    var ready = false

    public override func load() {
        let locationManager = BackgroundGeolocation.sharedInstance()

        if let root = UIApplication.shared.delegate?.window??.rootViewController {
            locationManager.viewController = root
        }
        ready = false
        registerEventListeners()
    }

    func registerEventListeners() {

        let locationManager = BackgroundGeolocation.sharedInstance()
        weak var me = self
        
        locationManager.onLocation({ (event: TSLocationEvent?) in
            guard let me = me, me.hasListeners(TSEventNameLocation) else { return }
            if let locationDict = event?.toDictionary() as? [String: Any] {
                me.notifyListeners(TSEventNameLocation, data: locationDict)
            }
        }, failure: { error in
            guard let me = me, me.hasListeners(TSEventNameLocation) else { return }
            if let nsError = error as? NSError {
                me.notifyListeners(TSEventNameLocation, data: ["error": nsError.code] as [String: Any])
            }
        })

        locationManager.onMotionChange({ (event: TSLocationEvent?) in
            guard let me = me, me.hasListeners(TSEventNameMotionChange) else { return }
            let params: [String: Any] = [
                "isMoving": event?.isMoving as Any,
                "location": event?.toDictionary() as Any
            ]
            me.notifyListeners(TSEventNameMotionChange, data: params)
        })

        locationManager.onActivityChange({ (event: TSActivityChangeEvent?) in
            guard let me = me, me.hasListeners(TSEventNameActivityChange) else { return }
            let params: [String: Any] = [
                "activity": event?.activity as Any,
                "confidence": event?.confidence as Any
            ]
            me.notifyListeners(TSEventNameActivityChange, data: params)
        })

        locationManager.onHeartbeat({ (event: TSHeartbeatEvent?) in
            guard let me = me, me.hasListeners(TSEventNameHeartbeat) else { return }
            if let eventData = event?.toDictionary() as? [String: Any] {
                me.notifyListeners(TSEventNameHeartbeat, data: eventData)
            }
        })

        locationManager.onGeofence({ (event: TSGeofenceEvent?) in
            guard let me = me, me.hasListeners(TSEventNameGeofence) else { return }
            if let eventData = event?.toDictionary() as? [String: Any] {
                me.notifyListeners(TSEventNameGeofence, data: eventData)
            }
        })

        locationManager.onGeofencesChange({ (event: TSGeofencesChangeEvent?) in
            guard let me = me, me.hasListeners(TSEventNameGeofencesChange) else { return }
            if let eventData = event?.toDictionary() as? [String: Any] {
                me.notifyListeners(TSEventNameGeofencesChange, data: eventData)
            }
        })

        locationManager.onHttp({ (event: TSHttpEvent?) in
            guard let me = me, me.hasListeners(TSEventNameHttp) else { return }
            if let eventData = event?.toDictionary() as? [String: Any] {
                me.notifyListeners(TSEventNameHttp, data: eventData)
            }
        })

        locationManager.onProviderChange({ (event: TSProviderChangeEvent?) in
            guard let me = me, me.hasListeners(TSEventNameProviderChange) else { return }
            if let eventData = event?.toDictionary() as? [String: Any] {
                me.notifyListeners(TSEventNameProviderChange, data: eventData)
            }
        })

        locationManager.onSchedule({ (event: TSScheduleEvent?) in
            guard let me = me, me.hasListeners(TSEventNameSchedule) else { return }
            if let state = event?.state as? [String: Any] {
                me.notifyListeners(TSEventNameSchedule, data: state)
            }
        })

        locationManager.onPowerSaveChange({ (event: TSPowerSaveChangeEvent?) in
            guard let me = me, me.hasListeners(TSEventNamePowerSaveChange) else { return }
            let params: [String: Any] = ["value": event?.isPowerSaveMode as Any]
            me.notifyListeners(TSEventNamePowerSaveChange, data: params)
        })

        locationManager.onConnectivityChange({ (event: TSConnectivityChangeEvent?) in
            guard let me = me, me.hasListeners(TSEventNameConnectivityChange) else { return }
            let params: [String: Any] = ["connected": event?.hasConnection as Any]
            me.notifyListeners(TSEventNameConnectivityChange, data: params)
        })

        locationManager.onEnabledChange({ (event: TSEnabledChangeEvent?) in
            guard let me = me, me.hasListeners(TSEventNameEnabledChange) else { return }
            me.notifyListeners(TSEventNameEnabledChange, data: ["value": event?.enabled as Any])
        })

        locationManager.onAuthorization({ (event: TSAuthorizationEvent?) in
            guard let me = me, me.hasListeners(TSEventNameAuthorization) else { return }
            if let eventData = event?.toDictionary() as? [String: Any] {
                me.notifyListeners(TSEventNameAuthorization, data: eventData)
            }
        })

    }

    @objc func registerPlugin(_ call: CAPPluginCall) {
        guard let pluginId = call.getString("id") else {
            call.reject("Missing required parameter: id")
            return
        }
        let config = TSConfig.sharedInstance()
        config.registerPlugin(pluginId)
        call.resolve()
    }

    @objc func ready(_ call: CAPPluginCall) {
        let locationManager = BackgroundGeolocation.sharedInstance()
        let config = TSConfig.sharedInstance()
        
        let params = call.getObject("options") ?? [:]
        let reset = (params["reset"] as? Bool) ?? true
        if ready {
            if reset {
                locationManager.log("warn", message: "#ready already called.  Redirecting to #setConfig")
                config.update(with: params)
            } else {
                locationManager.log("warn", message: "#ready already called.  Ignored Config since reset: false")
            }
            if let configDict = config.toDictionary() as? [String: Any] {
                call.resolve(configDict)
            } else {
                call.reject("Failed to convert config to dictionary", nil, nil, [:])
            }
            return
        }
        ready = true
        DispatchQueue.main.async {
            if config.isFirstBoot() {
                config.update(with: params)
            } else {
                if reset {
                    config.resetConfig(true)
                    config.update(with: params)
                } else if let auth = params["authorization"] as? [String: Any] {
                    config.batchUpdate { cfg in
                        cfg.authorization.update(with: auth)
                    }
                }
            }
            locationManager.ready()
            if let configDict = config.toDictionary() as? [String: Any] {
                call.resolve(configDict)
            } else {
                call.reject("Failed to convert config to dictionary", nil, nil, [:])
            }
        }
    }

    @objc func reset(_ call: CAPPluginCall) {
        let params = call.getObject("options") ?? [:]
        let config = TSConfig.sharedInstance()

        if !params.isEmpty {
            config.resetConfig(true)
            config.update(with: params)
        } else {
            config.resetConfig(false)
        }

        if let configDict = config.toDictionary() as? [String: Any] {
            call.resolve(configDict)
        } else {
            call.reject("Failed to convert config to dictionary", nil, nil, [:])
        }
    }

    @objc func setConfig(_ call: CAPPluginCall) {
        let params = call.getObject("options") ?? [:]
        let config = TSConfig.sharedInstance()
        config.update(with: params)
        if let configDict = config.toDictionary() as? [String: Any] {
            call.resolve(configDict)
        } else {
            call.reject("Failed to convert config to dictionary", nil, nil, [:])
        }
    }

    @objc func getState(_ call: CAPPluginCall) {
        let config = TSConfig.sharedInstance()
        if let configDict = config.toDictionary() as? [String: Any] {
            call.resolve(configDict)
        } else {
            call.reject("Failed to convert config to dictionary", nil, nil, [:])
        }
    }

    @objc func start(_ call: CAPPluginCall) {
        DispatchQueue.main.async {
            let locationManager = BackgroundGeolocation.sharedInstance()
            locationManager.start()
            if let state = locationManager.getState() as? [String: Any] {
                call.resolve(state)
            } else {
                call.reject("Failed to get location manager state", nil, nil, [:])
            }
        }
    }

    @objc func stop(_ call: CAPPluginCall) {
        let locationManager = BackgroundGeolocation.sharedInstance()
        locationManager.stop()
        if let state = locationManager.getState() as? [String: Any] {
            call.resolve(state)
        } else {
            call.reject("Failed to get location manager state", nil, nil, [:])
        }
    }

    @objc func startSchedule(_ call: CAPPluginCall) {
        let config = TSConfig.sharedInstance()
        let locationManager = BackgroundGeolocation.sharedInstance()
        locationManager.startSchedule()
        if let configDict = config.toDictionary() as? [String: Any] {
            call.resolve(configDict)
        } else {
            call.reject("Failed to convert config to dictionary", nil, nil, [:])
        }
    }

    @objc func stopSchedule(_ call: CAPPluginCall) {
        let config = TSConfig.sharedInstance()
        let locationManager = BackgroundGeolocation.sharedInstance()
        locationManager.stopSchedule()
        if let configDict = config.toDictionary() as? [String: Any] {
            call.resolve(configDict)
        } else {
            call.reject("Failed to convert config to dictionary", nil, nil, [:])
        }
    }

    @objc func startGeofences(_ call: CAPPluginCall) {
        let config = TSConfig.sharedInstance()
        let locationManager = BackgroundGeolocation.sharedInstance()
        locationManager.startGeofences()
        if let configDict = config.toDictionary() as? [String: Any] {
            call.resolve(configDict)
        } else {
            call.reject("Failed to convert config to dictionary", nil, nil, [:])
        }
    }

    @objc func changePace(_ call: CAPPluginCall) {
        let isMoving = call.getBool("isMoving") ?? false
        let locationManager = BackgroundGeolocation.sharedInstance()
        locationManager.changePace(isMoving)
        call.resolve()
    }

    @objc func startBackgroundTask(_ call: CAPPluginCall) {
        let locationManager = BackgroundGeolocation.sharedInstance()
        let taskId = locationManager.createBackgroundTask()
        call.resolve(["taskId": taskId.rawValue])
    }

    @objc func stopBackgroundTask(_ call: CAPPluginCall) {
        guard let taskIdNumber = call.options["taskId"] as? NSNumber else {
            call.reject("Missing required parameter: taskId")
            return
        }
        let locationManager = BackgroundGeolocation.sharedInstance()
        locationManager.stopBackgroundTask(UIBackgroundTaskIdentifier(rawValue: taskIdNumber.intValue))
        call.resolve()
    }

    @objc func getCurrentPosition(_ call: CAPPluginCall) {
        let options = call.getObject("options") ?? [:]
        let locationManager = BackgroundGeolocation.sharedInstance()

        let request = TSCurrentPositionRequest.make(
            type: .current,
            success: { event in
                if let eventData = event.data as? [String: Any] {
                    call.resolve(eventData)
                } else if let dict = event.toDictionary() as? [String: Any] {
                    call.resolve(dict)
                } else {
                    call.reject("Failed to convert location to dictionary", nil, nil, [:])
                }
            },
            failure: { error in
                call.reject("get_current_position_error", error.localizedDescription, error, [:])
            }
        )

        if let timeout = options["timeout"] as? Double {
            request.timeout = timeout
        }
        if let maximumAge = options["maximumAge"] as? Int {
            request.maximumAge = maximumAge
        }
        if let persist = options["persist"] as? Bool {
            request.persist = persist
        }
        if let samples = options["samples"] as? Int {
            request.samples = samples
        }
        if let desiredAccuracy = options["desiredAccuracy"] as? Double {
            request.desiredAccuracy = desiredAccuracy
        }
        if let extras = options["extras"] as? [String: Any] {
            request.extras = extras
        }

        locationManager.getCurrentPosition(request)
    }
    
    @objc func watchPosition(_ call: CAPPluginCall) {
        let options = call.getObject("options") ?? [:]
        weak var me = self
        let locationManager = BackgroundGeolocation.sharedInstance()

        let request = TSWatchPositionRequest.make(
            interval: 1000,
            success: { event in
                guard let me = me else { return }
                
                if let eventData = event.locationEvent.toDictionary() as? [String: Any] {
                    me.notifyListeners(TSEventNameWatchPosition, data: eventData)
                } else if let dict = event.toDictionary() as? [String: Any] {
                    me.notifyListeners(TSEventNameWatchPosition, data: dict)
                }
            },
            failure: { error in
                guard let me = me else { return }

                if let nsError = error as? NSError {
                    let result: [String: Any] = [
                        "error": [
                            "code": nsError.code,
                            "message": nsError.localizedDescription
                        ]
                    ]
                    me.notifyListeners(TSEventNameWatchPosition, data: result)
                } else {
                    let result: [String: Any] = [
                        "error": [
                            "code": -1,
                            "message": error.localizedDescription
                        ]
                    ]
                    me.notifyListeners(TSEventNameWatchPosition, data: result)
                }
            }
        )

        if let interval = options["interval"] as? Double {
            request.interval = interval
        }

        if let desiredAccuracy = options["desiredAccuracy"] as? Double {
            request.desiredAccuracy = desiredAccuracy
        }

        if let persist = options["persist"] as? Bool {
            request.persist = persist
        }

        if let extras = options["extras"] as? [String: Any] {
            request.extras = extras
        }

        if let timeoutNumber = options["timeout"] as? NSNumber {
            request.timeout = timeoutNumber.doubleValue
        }

        let watchId = Int(locationManager.watchPosition(request))
        call.resolve(["watchId": NSNumber(value: watchId)])
    }


    @objc func stopWatchPosition(_ call: CAPPluginCall) {
        guard let watchIdNumber = call.options["watchId"] as? NSNumber else {
            call.reject("Missing required parameter: watchId")
            return
        }
        let watchId = watchIdNumber.intValue
        BackgroundGeolocation.sharedInstance().stopWatchPosition(watchId)
        call.resolve()
    }

    // Locations Database

    @objc func getLocations(_ call: CAPPluginCall) {
        let locationManager = BackgroundGeolocation.sharedInstance()
        locationManager.getLocations({ records in
            call.resolve(["locations": records as Any])
        }, failure: { error in
            call.reject(error, nil, nil, [:])
        })
    }

    @objc func sync(_ call: CAPPluginCall) {
        let locationManager = BackgroundGeolocation.sharedInstance()
        locationManager.sync({ records in
            call.resolve(["locations": records as Any])
        }, failure: { error in
            if let nsError = error as? NSError {
                call.reject("\(nsError.code)", nil, error, nsError.userInfo)
            } else {
                call.reject("Unknown error occurred", nil, error, [:])
            }
        })
    }

    @objc func getGeofences(_ call: CAPPluginCall) {
        let locationManager = BackgroundGeolocation.sharedInstance()
        locationManager.getGeofences({ geofences in
            let geofenceArray = geofences ?? []
            let result = geofenceArray.compactMap { ($0 as? TSGeofence)?.toDictionary() as? [String: Any] }
            call.resolve(["geofences": result])
        }, failure: { error in
            call.reject(error, nil, nil, [:])
        })
    }

    @objc func getGeofence(_ call: CAPPluginCall) {
        guard let identifier = call.getString("identifier") else {
            call.reject("Missing required parameter: identifier")
            return
        }

        let locationManager = BackgroundGeolocation.sharedInstance()
        locationManager.getGeofence(identifier, success: { geofence in
            if let geofenceData = geofence.toDictionary() as? [String: Any] {
                call.resolve(geofenceData)
            } else {
                call.reject("Failed to convert geofence to dictionary", nil, nil, [:])
            }
        }, failure: { error in
            call.reject(error, nil, nil, [:])
        })
    }
    
    @objc func geofenceExists(_ call: CAPPluginCall) {
        guard let identifier = call.getString("identifier") else {
            call.reject("Missing required parameter: identifier")
            return
        }

        let locationManager = BackgroundGeolocation.sharedInstance()
        locationManager.geofenceExists(identifier, callback: { exists in
            call.resolve(["exists": exists])
        })
    }

    @objc func addGeofence(_ call: CAPPluginCall) {
        let params = call.getObject("options") ?? [:]
        guard let geofence = buildGeofence(params) else {
            let error = "Invalid geofence data: \(params)"
            call.reject(error, nil, nil, [:])
            return
        }

        let locationManager = BackgroundGeolocation.sharedInstance()
        locationManager.add(geofence, success: {
            call.resolve()
        }, failure: { error in
            call.reject(error, nil, nil, [:])
        })
    }

    @objc func addGeofences(_ call: CAPPluginCall) {
        guard let data = call.options["options"] as? [[String: Any]] else {
            call.reject("Invalid geofences data", nil, nil, [:])
            return
        }

        var geofences: [TSGeofence] = []
        for params in data {
            if let geofence = buildGeofence(params) {
                geofences.append(geofence)
            } else {
                let error = "Invalid geofence data: \(params)"
                call.reject(error, nil, nil, [:])
                return
            }
        }

        let locationManager = BackgroundGeolocation.sharedInstance()
        locationManager.addGeofences(geofences, success: {
            call.resolve()
        }, failure: { error in
            call.reject(error, nil, nil, [:])
        })
    }

    @objc func removeGeofence(_ call: CAPPluginCall) {
        guard let identifier = call.getString("identifier") else {
            call.reject("Missing required parameter: identifier")
            return
        }

        let locationManager = BackgroundGeolocation.sharedInstance()
        locationManager.removeGeofence(identifier, success: {
            call.resolve()
        }, failure: { error in
            call.reject(error, nil, nil, [:])
        })
    }

    @objc func removeGeofences(_ call: CAPPluginCall) {
        let identifiers = call.options["identifiers"] as? [String] ?? []
        let locationManager = BackgroundGeolocation.sharedInstance()
        locationManager.removeGeofences(identifiers, success: {
            call.resolve()
        }, failure: { error in
            call.reject(error, nil, nil, [:])
        })
    }

    @objc func getOdometer(_ call: CAPPluginCall) {
        let locationManager = BackgroundGeolocation.sharedInstance()
        let distance = locationManager.getOdometer()
        call.resolve(["odometer": distance])
    }

    @objc func setOdometer(_ call: CAPPluginCall) {
        let value = call.getDouble("odometer") ?? 0
        let locationManager = BackgroundGeolocation.sharedInstance()

        let request = TSCurrentPositionRequest.make(
            type: .current,
            success: { event in
                if let eventData = event.data as? [String: Any] {
                    call.resolve(eventData)
                } else if let dict = event.toDictionary() as? [String: Any] {
                    call.resolve(dict)
                } else {
                    call.reject("Failed to convert location to dictionary", nil, nil, [:])
                }
            },
            failure: { error in
                call.reject("set_odometer_error", error.localizedDescription, error, [:])
            }
        )

        locationManager.setOdometer(value, request: request)
    }

    @objc func destroyLocations(_ call: CAPPluginCall) {
        let locationManager = BackgroundGeolocation.sharedInstance()
        let result = locationManager.destroyLocations()
        if result {
            call.resolve()
        } else {
            call.reject("destroyLocations:  Unknown error", nil, nil, [:])
        }
    }

    @objc func destroyLocation(_ call: CAPPluginCall) {
        guard let uuid = call.getString("uuid") else {
            call.reject("Missing required parameter: uuid")
            return
        }

        let locationManager = BackgroundGeolocation.sharedInstance()
        locationManager.destroyLocation(uuid, success: {
            call.resolve()
        }, failure: { error in
            call.reject(error, nil, nil, [:])
        })
    }

    @objc func getCount(_ call: CAPPluginCall) {
        let locationManager = BackgroundGeolocation.sharedInstance()
        let count = locationManager.getCount()
        call.resolve(["count": count])
    }

    @objc func insertLocation(_ call: CAPPluginCall) {
        let params = call.getObject("options") ?? [:]
        let locationManager = BackgroundGeolocation.sharedInstance()
        locationManager.insertLocation(params, success: { uuid in
            call.resolve(["uuid": uuid])
        }, failure: { error in
            call.reject(error, nil, nil, [:])
        })
    }

    @objc func getLog(_ call: CAPPluginCall) {
        let params = call.getObject("options") ?? [:]
        let locationManager = BackgroundGeolocation.sharedInstance()
        let query = LogQuery(dictionary: params)
        locationManager.getLog(query, success: { log in
            call.resolve(["log": log])
        }, failure: { error in
            call.reject(error, nil, nil, [:])
        })
    }

    @objc func destroyLog(_ call: CAPPluginCall) {
        let locationManager = BackgroundGeolocation.sharedInstance()
        let result = locationManager.destroyLog()
        if result {
            call.resolve()
        } else {
            call.reject("destroyLog Unknown error", nil, nil, [:])
        }
    }

    @objc func emailLog(_ call: CAPPluginCall) {
        let params = call.getObject("query") ?? [:]
        guard let email = call.getString("email") else {
            call.reject("Missing required parameter: email")
            return
        }

        let query = LogQuery(dictionary: params)
        let locationManager = BackgroundGeolocation.sharedInstance()
        locationManager.emailLog(email, query: query, success: {
            call.resolve()
        }, failure: { error in
            call.reject(error, nil, nil, [:])
        })
    }

    @objc func uploadLog(_ call: CAPPluginCall) {
        let params = call.getObject("query") ?? [:]
        guard let url = call.getString("url") else {
            call.reject("Missing required parameter: url")
            return
        }

        let query = LogQuery(dictionary: params)
        let locationManager = BackgroundGeolocation.sharedInstance()
        locationManager.uploadLog(url, query: query, success: {
            call.resolve()
        }, failure: { error in
            call.reject(error, nil, nil, [:])
        })
    }

    @objc func log(_ call: CAPPluginCall) {
        let level = call.getString("level") ?? "debug"
        let message = call.getString("message") ?? "no message"
        BackgroundGeolocation.sharedInstance().log(level, message: message)
        call.resolve()
    }

    @objc func getSensors(_ call: CAPPluginCall) {
        let locationManager = BackgroundGeolocation.sharedInstance()
        let sensors: [String: Any] = [
            "platform": "ios",
            "accelerometer": locationManager.isAccelerometerAvailable(),
            "gyroscope": locationManager.isGyroAvailable(),
            "magnetometer": locationManager.isMagnetometerAvailable(),
            "motion_hardware": locationManager.isMotionHardwareAvailable()
        ]
        call.resolve(sensors)
    }

    @objc func getDeviceInfo(_ call: CAPPluginCall) {
        let deviceInfo = TSDeviceInfo.sharedInstance()
        if let infoDict = deviceInfo.toDictionary("capacitor") as? [String: Any] {
            call.resolve(infoDict)
        } else {
            call.reject("Failed to get device info", nil, nil, [:])
        }
    }

    @objc func isPowerSaveMode(_ call: CAPPluginCall) {
        let locationManager = BackgroundGeolocation.sharedInstance()
        call.resolve([
            "isPowerSaveMode": locationManager.isPowerSaveMode()
        ])
    }

    @objc func isIgnoringBatteryOptimizations(_ call: CAPPluginCall) {
        call.resolve([
            "isIgnoringBatteryOptimizations": false
        ])
    }

    @objc func requestSettings(_ call: CAPPluginCall) {
        call.reject("No iOS Implementation", nil, nil, [:])
    }

    @objc func showSettings(_ call: CAPPluginCall) {
        call.reject("No iOS Implementation", nil, nil, [:])
    }

    @objc func requestPermission(_ call: CAPPluginCall) {
        BackgroundGeolocation.sharedInstance().requestPermission({ status in
            call.resolve(["success": true, "status": status])
        }, failure: { status in
            call.resolve(["success": false, "status": status])
        })
    }

    @objc func requestTemporaryFullAccuracy(_ call: CAPPluginCall) {
        let purpose = call.getString("purpose") ?? ""
        BackgroundGeolocation.sharedInstance().requestTemporaryFullAccuracy(purpose, success: { accuracyAuthorization in
            call.resolve(["accuracyAuthorization": accuracyAuthorization])
        }, failure: { error in
            if let nsError = error as? NSError,
               let debugDescription = nsError.userInfo["NSDebugDescription"] as? String {
                call.reject(debugDescription, nil, error, nsError.userInfo)
            } else {
                call.reject("Unknown error occurred", nil, error, [:])
            }
        })
    }
    
    @objc func getProviderState(_ call: CAPPluginCall) {
        let locationManager = BackgroundGeolocation.sharedInstance()
        let event = locationManager.getProviderState()
        if let stateData = event.toDictionary() as? [String: Any] {
            call.resolve(stateData)
        } else {
            call.reject("Failed to convert provider state to dictionary", nil, nil, [:])
        }
    }

    @objc func getTransistorToken(_ call: CAPPluginCall) {
        guard let orgname = call.getString("org") else {
            call.resolve([
                "success": false,
                "status": -1,
                "message": "Missing required parameter: org"
            ])
            return
        }

        guard let username = call.getString("username") else {
            call.resolve([
                "success": false,
                "status": -1,
                "message": "Missing required parameter: username"
            ])
            return
        }

        guard let url = call.getString("url") else {
            call.resolve([
                "success": false,
                "status": -1,
                "message": "Missing required parameter: url"
            ])
            return
        }

        TransistorAuthorizationToken.findOrCreate(
            withOrg: orgname,
            username: username,
            url: url,
            framework: "capacitor",
            success: { token in
                if let tokenData = token.toDictionary() as? [String: Any] {
                    let result: [String: Any] = [
                        "success": true,
                        "token": tokenData
                    ]
                    call.resolve(result)
                } else {
                    call.reject("Failed to convert token to dictionary", nil, nil, [:])
                }
            },
            failure: { error in
                let result: [String: Any]
                if let nsError = error as? NSError {
                    result = [
                        "success": false,
                        "status": nsError.code,
                        "message": nsError.localizedDescription
                    ]
                } else {
                    result = [
                        "success": false,
                        "status": -1,
                        "message": "Unknown error occurred"
                    ]
                }
                call.resolve(result)
            }
        )
    }

    @objc func destroyTransistorToken(_ call: CAPPluginCall) {
        guard let url = call.getString("url") else {
            call.reject("Missing required parameter: url")
            return
        }
        TransistorAuthorizationToken.destroy(withUrl: url)
        call.resolve()
    }


    @objc func playSound(_ call: CAPPluginCall) {
        let soundId = call.getInt("soundId") ?? 0
        BackgroundGeolocation.sharedInstance().playSound(UInt32(soundId))
        call.resolve()
    }

    @objc func removeAllEventListeners(_ call: CAPPluginCall) {
        self.removeAllListeners(call)
        NSLog("BackgroundGeolocation plugin removeAllListeners")
    }

    func buildGeofence(_ params: [String: Any]) -> TSGeofence? {
        guard let identifier = params["identifier"] as? String,
              (params["vertices"] != nil || (params["radius"] != nil && params["latitude"] != nil && params["longitude"] != nil)) else {
            return nil
        }

        let radius = (params["radius"] as? NSNumber)?.doubleValue ?? 0
        let latitude = (params["latitude"] as? NSNumber)?.doubleValue ?? 0
        let longitude = (params["longitude"] as? NSNumber)?.doubleValue ?? 0
        let notifyOnEntry = (params["notifyOnEntry"] as? Bool) ?? false
        let notifyOnExit = (params["notifyOnExit"] as? Bool) ?? false
        let notifyOnDwell = (params["notifyOnDwell"] as? Bool) ?? false
        let loiteringDelay = (params["loiteringDelay"] as? NSNumber)?.doubleValue ?? 0
        let extras = params["extras"] as? [String: Any]

        let vertices: [[Double]]? = (params["vertices"] as? [[NSNumber]])?.map {
            $0.map { $0.doubleValue }
        }

        return TSGeofence(
            identifier: identifier,
            radius: radius,
            latitude: latitude,
            longitude: longitude,
            notifyOnEntry: notifyOnEntry,
            notifyOnExit: notifyOnExit,
            notifyOnDwell: notifyOnDwell,
            loiteringDelay: loiteringDelay,
            extras: extras,
            vertices: vertices
        )
    }

    deinit {
        BackgroundGeolocation.sharedInstance().removeListeners()
    }
}
