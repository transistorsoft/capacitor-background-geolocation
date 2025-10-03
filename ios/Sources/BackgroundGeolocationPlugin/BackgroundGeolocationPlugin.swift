import Foundation
import CoreLocation
import UIKit
import Capacitor
import TSLocationManager

let EVENT_LOCATION           = "location"
let EVENT_WATCHPOSITION      = "watchposition"
let EVENT_PROVIDERCHANGE     = "providerchange"
let EVENT_MOTIONCHANGE       = "motionchange"
let EVENT_ACTIVITYCHANGE     = "activitychange"
let EVENT_GEOFENCESCHANGE    = "geofenceschange"
let EVENT_HTTP               = "http"
let EVENT_SCHEDULE           = "schedule"
let EVENT_GEOFENCE           = "geofence"
let EVENT_HEARTBEAT          = "heartbeat"
let EVENT_POWERSAVECHANGE    = "powersavechange"
let EVENT_CONNECTIVITYCHANGE = "connectivitychange"
let EVENT_ENABLEDCHANGE      = "enabledchange"
let EVENT_NOTIFICATIONACTION = "notificationaction"
let EVENT_AUTHORIZATION      = "authorization"

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
        CAPPluginMethod(name: "getProviderState", returnType: CAPPluginReturnPromise),
        
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
        let locationManager = TSLocationManager.sharedInstance()

        if let root = UIApplication.shared.delegate?.window??.rootViewController {
            locationManager?.viewController = root
        }
        ready = false
        registerEventListeners()
    }

    func registerEventListeners() {

        guard let locationManager = TSLocationManager.sharedInstance()  else { return }
        weak var me = self
        
        locationManager.onLocation({ (location: TSLocation?) in
            guard let me = me, me.hasListeners(EVENT_LOCATION) else { return }
            if let locationDict = location?.toDictionary() as? [String: Any] {
                me.notifyListeners(EVENT_LOCATION, data: locationDict)
            }
        }, failure: { error in
            guard let me = me, me.hasListeners(EVENT_LOCATION) else { return }
            if let nsError = error as? NSError {
                me.notifyListeners(EVENT_LOCATION, data: ["error": nsError.code] as [String: Any])
            }
        })

        locationManager.onMotionChange({ (tsLocation: TSLocation?) in
            guard let me = me, me.hasListeners(EVENT_MOTIONCHANGE) else { return }
            let params: [String: Any] = [
                "isMoving": tsLocation?.isMoving as Any,
                "location": tsLocation?.toDictionary() as Any
            ]
            me.notifyListeners(EVENT_MOTIONCHANGE, data: params)
        })

        locationManager.onActivityChange({ (event: TSActivityChangeEvent?) in
            guard let me = me, me.hasListeners(EVENT_ACTIVITYCHANGE) else { return }
            let params: [String: Any] = [
                "activity": event?.activity as Any,
                "confidence": event?.confidence as Any
            ]
            me.notifyListeners(EVENT_ACTIVITYCHANGE, data: params)
        })

        locationManager.onHeartbeat({ (event:TSHeartbeatEvent?) in
            guard let me = me, me.hasListeners(EVENT_HEARTBEAT) else { return }
            let params: [String: Any] = [
                "location": event?.location.toDictionary() as Any
            ]
            me.notifyListeners(EVENT_HEARTBEAT, data: params)
        })

        locationManager.onGeofence({ (event: TSGeofenceEvent?) in
            guard let me = me, me.hasListeners(EVENT_GEOFENCE) else { return }
            if var params = event?.toDictionary() as? [String: Any] {
                params["location"] = event?.location.toDictionary() as? [String: Any]
                me.notifyListeners(EVENT_GEOFENCE, data: params)
            }
        })
        
        locationManager.onGeofencesChange({ (event: TSGeofencesChangeEvent?) in
            guard let me = me, me.hasListeners(EVENT_GEOFENCESCHANGE) else { return }
            if let eventData = event?.toDictionary() as? [String: Any] {
                me.notifyListeners(EVENT_GEOFENCESCHANGE, data: eventData)
            }
        })
        
        locationManager.onHttp({ (event: TSHttpEvent?) in
            guard let me = me, me.hasListeners(EVENT_HTTP) else { return }
            if let eventData = event?.toDictionary() as? [String: Any] {
                me.notifyListeners(EVENT_HTTP, data: eventData)
            }
        })

        locationManager.onProviderChange({ (event: TSProviderChangeEvent?) in
            guard let me = me, me.hasListeners(EVENT_PROVIDERCHANGE) else { return }
            if let eventData = event?.toDictionary() as? [String: Any] {
                me.notifyListeners(EVENT_PROVIDERCHANGE, data: eventData)
            }
        })

        locationManager.onSchedule({ (event: TSScheduleEvent?) in
            guard let me = me, me.hasListeners(EVENT_SCHEDULE) else { return }
            if let state = event?.state as? [String: Any] {
                me.notifyListeners(EVENT_SCHEDULE, data: state)
            }
        })
        
        locationManager.onPowerSaveChange({ (event: TSPowerSaveChangeEvent?) in
            guard let me = me, me.hasListeners(EVENT_POWERSAVECHANGE) else { return }
            let params: [String: Any] = ["value": event?.isPowerSaveMode as Any]
            me.notifyListeners(EVENT_POWERSAVECHANGE, data: params)
        })

        locationManager.onConnectivityChange({ (event: TSConnectivityChangeEvent?) in
            guard let me = me, me.hasListeners(EVENT_CONNECTIVITYCHANGE) else { return }
            let params: [String: Any] = ["connected": event?.hasConnection as Any]
            me.notifyListeners(EVENT_CONNECTIVITYCHANGE, data: params)
        })

        locationManager.onEnabledChange({ (event: TSEnabledChangeEvent?) in
            guard let me = me, me.hasListeners(EVENT_ENABLEDCHANGE) else { return }
            me.notifyListeners(EVENT_ENABLEDCHANGE, data: ["value": event?.enabled as Any])
        })


    }

    @objc func registerPlugin(_ call: CAPPluginCall) {
        let pluginId = call.getString("id")
        let config = TSConfig.sharedInstance()
        config?.registerPlugin(pluginId)
    }

    @objc func ready(_ call: CAPPluginCall) {
        guard let locationManager = TSLocationManager.sharedInstance(),
              let config = TSConfig.sharedInstance() else { return }
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
                    config.reset(true)
                    config.update(with: params)
                } else if let auth = params["authorization"] as? [String: Any] {
                    config.update { builder in
                        builder?.authorization = TSAuthorization.create(with: auth)
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
        guard let config = TSConfig.sharedInstance() else { return }
        if !params.isEmpty {
            config.reset(true)
            config.update(with: params)
        } else {
            config.reset()
        }
        if let configDict = config.toDictionary() as? [String: Any] {
            call.resolve(configDict)
        } else {
            call.reject("Failed to convert config to dictionary", nil, nil, [:])
        }
    }

    @objc func setConfig(_ call: CAPPluginCall) {
        let params = call.getObject("options") ?? [:]
        guard let config = TSConfig.sharedInstance() else { return }
        config.update(with: params)
        if let configDict = config.toDictionary() as? [String: Any] {
            call.resolve(configDict)
        } else {
            call.reject("Failed to convert config to dictionary", nil, nil, [:])
        }
    }

    @objc func getState(_ call: CAPPluginCall) {
        guard let config = TSConfig.sharedInstance() else { return }
        if let configDict = config.toDictionary() as? [String: Any] {
            call.resolve(configDict)
        } else {
            call.reject("Failed to convert config to dictionary", nil, nil, [:])
        }
    }

    @objc func start(_ call: CAPPluginCall) {
        DispatchQueue.main.async {
            guard let locationManager = TSLocationManager.sharedInstance() else { return }
            locationManager.start()
            if let state = locationManager.getState() as? [String: Any] {
                call.resolve(state)
            } else {
                call.reject("Failed to get location manager state", nil, nil, [:])
            }
        }
    }

    @objc func stop(_ call: CAPPluginCall) {
        guard let locationManager = TSLocationManager.sharedInstance() else { return }
        locationManager.stop()
        if let state = locationManager.getState() as? [String: Any] {
            call.resolve(state)
        } else {
            call.reject("Failed to get location manager state", nil, nil, [:])
        }
    }

    @objc func startSchedule(_ call: CAPPluginCall) {
        guard let config = TSConfig.sharedInstance(),
              let locationManager = TSLocationManager.sharedInstance() else { return }
        locationManager.startSchedule()
        if let configDict = config.toDictionary() as? [String: Any] {
            call.resolve(configDict)
        } else {
            call.reject("Failed to convert config to dictionary", nil, nil, [:])
        }
    }

    @objc func stopSchedule(_ call: CAPPluginCall) {
        guard let config = TSConfig.sharedInstance(),
              let locationManager = TSLocationManager.sharedInstance() else { return }
        locationManager.stopSchedule()
        if let configDict = config.toDictionary() as? [String: Any] {
            call.resolve(configDict)
        } else {
            call.reject("Failed to convert config to dictionary", nil, nil, [:])
        }
    }

    @objc func startGeofences(_ call: CAPPluginCall) {
        guard let config = TSConfig.sharedInstance(),
              let locationManager = TSLocationManager.sharedInstance() else { return }
        locationManager.startGeofences()
        if let configDict = config.toDictionary() as? [String: Any] {
            call.resolve(configDict)
        } else {
            call.reject("Failed to convert config to dictionary", nil, nil, [:])
        }
    }

    @objc func changePace(_ call: CAPPluginCall) {
        let isMoving = call.getBool("isMoving") ?? false
        guard let locationManager = TSLocationManager.sharedInstance() else { return }
        locationManager.changePace(isMoving)
        call.resolve()
    }

    @objc func startBackgroundTask(_ call: CAPPluginCall) {
        guard let locationManager = TSLocationManager.sharedInstance() else { return }
        let taskId = locationManager.createBackgroundTask()
        call.resolve(["taskId": taskId])
    }

    @objc func stopBackgroundTask(_ call: CAPPluginCall) {
        let taskId = call.getInt("taskId") ?? -1
        guard let locationManager = TSLocationManager.sharedInstance() else { return }
        locationManager.stopBackgroundTask(UIBackgroundTaskIdentifier(rawValue: taskId))
        call.resolve()
    }
    
    @objc func getCurrentPosition(_ call: CAPPluginCall) {
        let options = call.getObject("options") ?? [:]
        guard let locationManager = TSLocationManager.sharedInstance() else { return }

        let request = TSCurrentPositionRequest(success: { (location: TSLocation?) in
            if let locationData = location?.toDictionary() as? [String: Any] {
                call.resolve(locationData)
            } else {
                call.reject("Failed to convert location to dictionary", nil, nil, [:])
            }
        }, failure: { error in
            if let nsError = error as? NSError {
                call.reject("\(nsError.code)", nil, error, nsError.userInfo)
            } else {
                call.reject("Unknown error occurred", nil, error, [:])
            }
        })

        if let timeout = options["timeout"] as? Double {
            request?.timeout = timeout
        }
        if let maximumAge = options["maximumAge"] as? Double {
            request?.maximumAge = maximumAge
        }
        if let persist = options["persist"] as? Bool {
            request?.persist = persist
        }
        if let samples = options["samples"] as? Int {
            request?.samples = Int32(samples)
        }
        if let desiredAccuracy = options["desiredAccuracy"] as? Double {
            request?.desiredAccuracy = desiredAccuracy
        }
        if let extras = options["extras"] as? [String: Any] {
            request?.extras = extras
        }
        locationManager.getCurrentPosition(request)
    }

    @objc func watchPosition(_ call: CAPPluginCall) {
        let options = call.getObject("options") ?? [:]
        weak var me = self

        let request = TSWatchPositionRequest(success: { (location: TSLocation?) in
            guard let me = me else { return }
            if !me.hasListeners(EVENT_WATCHPOSITION) {
                TSLocationManager.sharedInstance()?.stopWatchPosition()
                return
            }
            if let locationData = location?.toDictionary() as? [String: Any] {
                me.notifyListeners(EVENT_WATCHPOSITION, data: locationData)
            }
        }, failure: { error in
            guard let me = me else { return }
            if !me.hasListeners(EVENT_WATCHPOSITION) {
                TSLocationManager.sharedInstance()?.stopWatchPosition()
                return
            }
            if let nsError = error as? NSError {
                let result: [String: Any] = [
                    "error": [
                        "code": nsError.code,
                        "message": nsError.localizedDescription
                    ]
                ]
                me.notifyListeners(EVENT_WATCHPOSITION, data: result)
            }
        })

        if let interval = options["interval"] as? Double {
            request?.interval = interval
        }
        if let desiredAccuracy = options["desiredAccuracy"] as? Double {
            request?.desiredAccuracy = desiredAccuracy
        }
        if let persist = options["persist"] as? Bool {
            request?.persist = persist
        }
        if let extras = options["extras"] as? [String: Any] {
            request?.extras = extras
        }
        if let timeout = options["timeout"] as? Double {
            request?.timeout = timeout
        }
        TSLocationManager.sharedInstance()?.watchPosition(request)
        call.resolve()
    }

    @objc func stopWatchPosition(_ call: CAPPluginCall) {
        TSLocationManager.sharedInstance()?.stopWatchPosition()
        call.resolve()
    }

    // Locations Database

    @objc func getLocations(_ call: CAPPluginCall) {
        TSLocationManager.sharedInstance()?.getLocations({ records in
            call.resolve(["locations": records as Any])
        }, failure: { error in
            if let errorString = error {
                call.reject(errorString, nil, nil, [:])
            } else {
                call.reject("Unknown error", nil, nil, [:])
            }
        })
    }

    @objc func sync(_ call: CAPPluginCall) {
        TSLocationManager.sharedInstance()?.sync({ records in
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
        TSLocationManager.sharedInstance()?.getGeofences({ geofences in
            if let geofenceArray = geofences {
                let result = geofenceArray.compactMap { ($0 as? TSGeofence)?.toDictionary() as? [String: Any] }
                call.resolve(["geofences": result])
            } else {
                call.resolve(["geofences": []])
            }
        }, failure: { error in
            if let errorString = error {
                call.reject(errorString, nil, nil, [:])
            } else {
                call.reject("Unknown error", nil, nil, [:])
            }
        })
    }
    

    @objc func getGeofence(_ call: CAPPluginCall) {
        let identifier = call.getString("identifier")
        TSLocationManager.sharedInstance()?.getGeofence(identifier, success: { geofence in
            if let geofence = geofence,
               let geofenceData = geofence.toDictionary() as? [String: Any] {
                call.resolve(geofenceData)
            } else {
                call.reject("Failed to convert geofence to dictionary", nil, nil, [:])
            }
        }, failure: { error in
            if let errorString = error {
                call.reject(errorString, nil, nil, [:])
            } else {
                call.reject("Unknown error", nil, nil, [:])
            }
        })
    }
    
    @objc func geofenceExists(_ call: CAPPluginCall) {
        let identifier = call.getString("identifier")
        TSLocationManager.sharedInstance()?.geofenceExists(identifier, callback: { exists in
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
        TSLocationManager.sharedInstance()?.add(geofence, success: {
            call.resolve()
        }, failure: { error in
            if let errorString = error {
                call.reject(errorString, nil, nil, [:])
            } else {
                call.reject("Unknown error", nil, nil, [:])
            }
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
        TSLocationManager.sharedInstance()?.addGeofences(geofences, success: {
            call.resolve()
        }, failure: { error in
            if let errorString = error {
                call.reject(errorString, nil, nil, [:])
            } else {
                call.reject("Unknown error", nil, nil, [:])
            }
        })
    }

    @objc func removeGeofence(_ call: CAPPluginCall) {
        let identifier = call.getString("identifier")
        TSLocationManager.sharedInstance()?.removeGeofence(identifier, success: {
            call.resolve()
        }, failure: { error in
            if let errorString = error {
                call.reject(errorString, nil, nil, [:])
            } else {
                call.reject("Unknown error", nil, nil, [:])
            }
        })
    }

    @objc func removeGeofences(_ call: CAPPluginCall) {
        guard let identifiers = call.options["identifiers"] as? [String] else {
            call.reject("Invalid identifiers", nil, nil, [:])
            return
        }
        TSLocationManager.sharedInstance()?.removeGeofences(identifiers, success: {
            call.resolve()
        }, failure: { error in
            if let errorString = error {
                call.reject(errorString, nil, nil, [:])
            } else {
                call.reject("Unknown error", nil, nil, [:])
            }
        })
    }

    @objc func getOdometer(_ call: CAPPluginCall) {
        guard let locationManager = TSLocationManager.sharedInstance() else { return }
        let distance = locationManager.getOdometer()
        call.resolve(["odometer": distance])
    }

    @objc func setOdometer(_ call: CAPPluginCall) {
        let value = call.getDouble("odometer") ?? 0
        guard let locationManager = TSLocationManager.sharedInstance() else { return }
        let request = TSCurrentPositionRequest(success: { location in
            if let locationData = location?.toDictionary() as? [String: Any] {
                call.resolve(locationData)
            } else {
                call.reject("Failed to convert location to dictionary", nil, nil, [:])
            }
        }, failure: { error in
            if let nsError = error as? NSError {
                call.reject("\(nsError.code)", nil, error, nsError.userInfo)
            } else {
                call.reject("Unknown error occurred", nil, error, [:])
            }
        })
        locationManager.setOdometer(value, request: request)
    }
    
    @objc func destroyLocations(_ call: CAPPluginCall) {
        guard let locationManager = TSLocationManager.sharedInstance() else { return }
        let result = locationManager.destroyLocations()
        if result {
            call.resolve()
        } else {
            call.reject("destroyLocations:  Unknown error", nil, nil, [:])
        }
    }

    @objc func destroyLocation(_ call: CAPPluginCall) {
        let uuid = call.getString("uuid")
        TSLocationManager.sharedInstance()?.destroyLocation(uuid, success: {
            call.resolve()
        }, failure: { error in
            if let errorString = error {
                call.reject(errorString, nil, nil, [:])
            } else {
                call.reject("Unknown error", nil, nil, [:])
            }
        })
    }

    @objc func getCount(_ call: CAPPluginCall) {
        guard let locationManager = TSLocationManager.sharedInstance() else { return }
        let count = locationManager.getCount()
        call.resolve(["count": count])
    }

    @objc func insertLocation(_ call: CAPPluginCall) {
        let params = call.getObject("options") ?? [:]
        TSLocationManager.sharedInstance()?.insertLocation(params, success: { uuid in
            call.resolve(["uuid": uuid as Any])
        }, failure: { error in
            if let errorString = error {
                call.reject(errorString, nil, nil, [:])
            } else {
                call.reject("Unknown error", nil, nil, [:])
            }
        })
    }

    @objc func getLog(_ call: CAPPluginCall) {
        let params = call.getObject("options") ?? [:]
        guard let locationManager = TSLocationManager.sharedInstance() else { return }
        let query = LogQuery(dictionary: params)
        locationManager.getLog(query, success: { log in
            call.resolve(["log": log as Any])
        }, failure: { error in
            if let errorString = error {
                call.reject(errorString, nil, nil, [:])
            } else {
                call.reject("Unknown error", nil, nil, [:])
            }
        })
    }

    @objc func destroyLog(_ call: CAPPluginCall) {
        guard let locationManager = TSLocationManager.sharedInstance() else { return }
        let result = locationManager.destroyLog()
        if result {
            call.resolve()
        } else {
            call.reject("destroyLog Unknown error", nil, nil, [:])
        }
    }

    @objc func emailLog(_ call: CAPPluginCall) {
        let params = call.getObject("query") ?? [:]
        let email = call.getString("email")
        let query = LogQuery(dictionary: params)
        TSLocationManager.sharedInstance()?.emailLog(email, query: query, success: {
            call.resolve()
        }, failure: { error in
            if let errorString = error {
                call.reject(errorString, nil, nil, [:])
            } else {
                call.reject("Unknown error", nil, nil, [:])
            }
        })
    }

    @objc func uploadLog(_ call: CAPPluginCall) {
        let params = call.getObject("query") ?? [:]
        let url = call.getString("url")
        let query = LogQuery(dictionary: params)
        TSLocationManager.sharedInstance()?.uploadLog(url, query: query, success: {
            call.resolve()
        }, failure: { error in
            if let errorString = error {
                call.reject(errorString, nil, nil, [:])
            } else {
                call.reject("Unknown error", nil, nil, [:])
            }
        })
    }

    @objc func log(_ call: CAPPluginCall) {
        let level = call.getString("level") ?? "debug"
        let message = call.getString("message") ?? "no message"
        TSLocationManager.sharedInstance()?.log(level, message: message)
        call.resolve()
    }

    @objc func getSensors(_ call: CAPPluginCall) {
        guard let locationManager = TSLocationManager.sharedInstance() else { return }
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
        if let infoDict = deviceInfo?.toDictionary("capacitor") as? [String: Any] {
            call.resolve(infoDict)
        } else {
            call.reject("Failed to get device info", nil, nil, [:])
        }
    }

    @objc func isPowerSaveMode(_ call: CAPPluginCall) {
        guard let locationManager = TSLocationManager.sharedInstance() else { return }
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
        TSLocationManager.sharedInstance()?.requestPermission({ status in
            call.resolve(["success": true, "status": status as Any])
        }, failure: { status in
            call.resolve(["success": false, "status": status as Any])
        })
    }

    @objc func requestTemporaryFullAccuracy(_ call: CAPPluginCall) {
        let purpose = call.getString("purpose") ?? ""
        TSLocationManager.sharedInstance()?.requestTemporaryFullAccuracy(purpose, success: { accuracyAuthorization in
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
        guard let locationManager = TSLocationManager.sharedInstance() else { return }
        if let event = locationManager.getProviderState(),
           let stateData = event.toDictionary() as? [String: Any] {
            call.resolve(stateData)
        } else {
            call.reject("Failed to convert provider state to dictionary", nil, nil, [:])
        }
    }
    
    @objc func getTransistorToken(_ call: CAPPluginCall) {
        let orgname = call.getString("org")
        let username = call.getString("username")
        let url = call.getString("url")
        TransistorAuthorizationToken.findOrCreate(withOrg: orgname, username: username, url: url, framework: "capacitor", success: { token in
            if let token = token,
               let tokenData = token.toDictionary() as? [String: Any] {
                let result: [String: Any] = [
                    "success": true,
                    "token": tokenData
                ]
                call.resolve(result)
            } else {
                call.reject("Failed to convert token to dictionary", nil, nil, [:])
            }
        }, failure: { error in
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
        })
    }
    
    @objc func destroyTransistorToken(_ call: CAPPluginCall) {
        let url = call.getString("url")
        TransistorAuthorizationToken.destroy(withUrl: url)
        call.resolve()
    }

    @objc func playSound(_ call: CAPPluginCall) {
        let soundId = call.getInt("soundId") ?? 0
        TSLocationManager.sharedInstance()?.playSound(UInt32(soundId))
        call.resolve()
    }

    @objc func removeAllEventListeners(_ call: CAPPluginCall) {
        self.removeAllListeners(call)
        NSLog("BackgroundGeolocation plugin removeAllListeners")
        call.resolve()
    }

    func buildGeofence(_ params: [String: Any]) -> TSGeofence? {
        guard let identifier = params["identifier"] as? String,
              (params["vertices"] != nil || (params["radius"] != nil && params["latitude"] != nil && params["longitude"] != nil)) else {
            return nil
        }
        let radius = (params["radius"] as? Double) ?? 0
        let latitude = (params["latitude"] as? Double) ?? 0
        let longitude = (params["longitude"] as? Double) ?? 0
        let notifyOnEntry = (params["notifyOnEntry"] as? Bool) ?? false
        let notifyOnExit = (params["notifyOnExit"] as? Bool) ?? false
        let notifyOnDwell = (params["notifyOnDwell"] as? Bool) ?? false
        let loiteringDelay = (params["loiteringDelay"] as? Double) ?? 0
        let extras = params["extras"] as? [String: Any]
        let vertices = params["vertices"] as? [[Double]]

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
        TSLocationManager.sharedInstance()?.removeListeners()
    }
}
