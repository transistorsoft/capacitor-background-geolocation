#import "Plugin.h"
#import <Foundation/Foundation.h>
#import <CoreLocation/CoreLocation.h>
#import <UIKit/UIKit.h>

#import <Capacitor/Capacitor.h>
#import <Capacitor/Capacitor-Swift.h>
#import <Capacitor/CAPBridgedPlugin.h>
#import <Capacitor/CAPBridgedJSTypes.h>

static NSString *const EVENT_LOCATION           = @"location";
static NSString *const EVENT_WATCHPOSITION      = @"watchposition";
static NSString *const EVENT_PROVIDERCHANGE     = @"providerchange";
static NSString *const EVENT_MOTIONCHANGE       = @"motionchange";
static NSString *const EVENT_ACTIVITYCHANGE     = @"activitychange";
static NSString *const EVENT_GEOFENCESCHANGE    = @"geofenceschange";
static NSString *const EVENT_HTTP               = @"http";
static NSString *const EVENT_SCHEDULE           = @"schedule";
static NSString *const EVENT_GEOFENCE           = @"geofence";
static NSString *const EVENT_HEARTBEAT          = @"heartbeat";
static NSString *const EVENT_POWERSAVECHANGE    = @"powersavechange";
static NSString *const EVENT_CONNECTIVITYCHANGE = @"connectivitychange";
static NSString *const EVENT_ENABLEDCHANGE      = @"enabledchange";
static NSString *const EVENT_NOTIFICATIONACTION = @"notificationaction";
static NSString *const EVENT_AUTHORIZATION      = @"authorization";


@implementation Plugin {
    NSMutableDictionary *listeners;
    BOOL ready;
    void(^onLocation)(TSLocation*);
    void(^onLocationError)(NSError*);
}

- (void)load {
    TSLocationManager *locationManager = [TSLocationManager sharedInstance];
    UIViewController *root = [[[[UIApplication sharedApplication] delegate] window] rootViewController];
    locationManager.viewController = root;
    
    ready = NO;
    
    [self registerEventListeners];
}

- (void) registerEventListeners {
    TSLocationManager *locationManager = [TSLocationManager sharedInstance];
    
    __typeof(self) __weak me = self;
    
    
    [locationManager onLocation:^(TSLocation* location) {
        if (![me hasListeners:EVENT_LOCATION]) return;
        [me notifyListeners:EVENT_LOCATION data:[location toDictionary]];
    } failure:^(NSError *error) {
        if (![me hasListeners:EVENT_LOCATION]) return;
        [me notifyListeners:EVENT_LOCATION data: @{@"error":@(error.code)}];
    }];
    
    [locationManager onMotionChange:^(TSLocation *tsLocation) {
        if (![me hasListeners:EVENT_MOTIONCHANGE]) return;
        NSDictionary *params = @{
            @"isMoving": @(tsLocation.isMoving),
            @"location": [tsLocation toDictionary]
        };
        [me notifyListeners:EVENT_MOTIONCHANGE data:params];
    }];
    
    [locationManager onActivityChange:^(TSActivityChangeEvent *event) {
        if (![me hasListeners:EVENT_ACTIVITYCHANGE]) return;
        NSDictionary *params = @{@"activity": event.activity, @"confidence": @(event.confidence)};
        [me notifyListeners:EVENT_ACTIVITYCHANGE data:params];
    }];
    
    [locationManager onHeartbeat:^(TSHeartbeatEvent *event) {
        if (![me hasListeners:EVENT_HEARTBEAT]) return;
        NSDictionary *params = @{
            @"location": [event.location toDictionary],
        };
        [me notifyListeners:EVENT_HEARTBEAT data:params];
    }];
    
    [locationManager onGeofence:^(TSGeofenceEvent *event) {
        if (![me hasListeners:EVENT_GEOFENCE]) return;
        NSMutableDictionary *params = [[event toDictionary] mutableCopy];
        [params setObject:[event.location toDictionary] forKey:@"location"];
        [me notifyListeners:EVENT_GEOFENCE data:params];
    }];
    
    [locationManager onGeofencesChange:^(TSGeofencesChangeEvent *event) {
        if (![me hasListeners:EVENT_GEOFENCESCHANGE]) return;
        [me notifyListeners:EVENT_GEOFENCESCHANGE data:[event toDictionary]];
    }];
    
    [locationManager onHttp:^(TSHttpEvent *event) {
        if (![me hasListeners:EVENT_HTTP]) return;
        [me notifyListeners:EVENT_HTTP data:[event toDictionary]];
    }];
    
    [locationManager onProviderChange:^(TSProviderChangeEvent *event) {
        if (![me hasListeners:EVENT_PROVIDERCHANGE]) return;
        [me notifyListeners:EVENT_PROVIDERCHANGE data:[event toDictionary]];
    }];
    
    [locationManager onSchedule:^(TSScheduleEvent *event) {
        if (![me hasListeners:EVENT_SCHEDULE]) return;
        [me notifyListeners:EVENT_SCHEDULE data:event.state];
    }];
    
    [locationManager onPowerSaveChange:^(TSPowerSaveChangeEvent *event) {
        if (![me hasListeners:EVENT_POWERSAVECHANGE]) return;
        NSDictionary *params = @{@"value":@(event.isPowerSaveMode)};
        [me notifyListeners:EVENT_POWERSAVECHANGE data:params];
    }];
    
    [locationManager onConnectivityChange:^(TSConnectivityChangeEvent *event) {
        if (![me hasListeners:EVENT_CONNECTIVITYCHANGE]) return;
        NSDictionary *params = @{@"connected":@(event.hasConnection)};
        [me notifyListeners:EVENT_CONNECTIVITYCHANGE data:params];
    }];
    
    [locationManager onEnabledChange:^(TSEnabledChangeEvent *event) {
        if (![me hasListeners:EVENT_ENABLEDCHANGE]) return;
        [me notifyListeners:EVENT_ENABLEDCHANGE data:@{@"value":@(event.enabled)}];
    }];
    
    [locationManager onAuthorization:^(TSAuthorizationEvent *event) {
        if (![me hasListeners:EVENT_AUTHORIZATION]) return;
        [me notifyListeners:EVENT_AUTHORIZATION data:[event toDictionary]];
    }];
}

- (void)ready:(CAPPluginCall *) call {
    TSLocationManager *locationManager = [TSLocationManager sharedInstance];
    NSDictionary *params = [call getObject:@"options" defaultValue:@{}];
    
    if (ready) {
        [locationManager log:@"warn" message:@"#ready already called.  Redirecting to #setConfig"];
        TSConfig *config = [TSConfig sharedInstance];
        
        [config updateWithDictionary:params];
        [call resolve:[config toDictionary]];
        return;
    }
    ready = YES;
    dispatch_async(dispatch_get_main_queue(), ^{
        TSConfig *config = [TSConfig sharedInstance];
        if (config.isFirstBoot) {
            [config updateWithDictionary:params];
        } else {
            BOOL reset = (params[@"reset"]) ? [params[@"reset"] boolValue] : YES;
            if (reset) {
                [config reset:YES];
                [config updateWithDictionary:params];
            } else if ([params objectForKey:@"authorization"]) {
                [config updateWithBlock:^(TSConfigBuilder *builder) {
                    builder.authorization = [TSAuthorization createWithDictionary:[params objectForKey:@"authorization"]];
                }];
            }
        }
        TSLocationManager *locationManager = [TSLocationManager sharedInstance];
        [locationManager ready];
        [call resolve:[config toDictionary]];
    });
}

- (void) reset:(CAPPluginCall *) call {
    NSDictionary *params = [call getObject:@"options" defaultValue:@{}];
    TSConfig *config = [TSConfig sharedInstance];
    if ([[params allKeys] count] > 0) {
        [config reset:YES];
        [config updateWithDictionary:params];
    } else {
        [config reset];
    }
    [call resolve:[config toDictionary]];
}

- (void) setConfig:(CAPPluginCall *) call {
    NSDictionary *params = [call getObject:@"options" defaultValue:@{}];
    TSConfig *config = [TSConfig sharedInstance];
    [config updateWithDictionary:params];
    [call resolve:[config toDictionary]];
}

- (void) getState:(CAPPluginCall *) call {
    TSConfig *config = [TSConfig sharedInstance];
    [call resolve:[config toDictionary]];
}

- (void) start:(CAPPluginCall *) call {
    dispatch_async(dispatch_get_main_queue(), ^{
        TSLocationManager *locationManager = [TSLocationManager sharedInstance];
        [locationManager start];
        [call resolve:[locationManager getState]];
    });
}

- (void) stop:(CAPPluginCall *) call {
    TSLocationManager *locationManager = [TSLocationManager sharedInstance];
    [locationManager stop];
    [call resolve:[locationManager getState]];
}

- (void) startSchedule:(CAPPluginCall *) call {
    TSConfig *config = [TSConfig sharedInstance];
    TSLocationManager *locationManager = [TSLocationManager sharedInstance];
    [locationManager startSchedule];
    [call resolve:[config toDictionary]];
}

- (void) stopSchedule:(CAPPluginCall *) call {
    TSConfig *config = [TSConfig sharedInstance];
    TSLocationManager *locationManager = [TSLocationManager sharedInstance];
    [locationManager stopSchedule];
    [call resolve:[config toDictionary]];
}

- (void) startGeofences:(CAPPluginCall *) call {
    TSConfig *config = [TSConfig sharedInstance];
    TSLocationManager *locationManager = [TSLocationManager sharedInstance];
    [locationManager startGeofences];
    [call resolve:[config toDictionary]];
}

- (void) changePace:(CAPPluginCall *) call {
    BOOL isMoving = [call getBool:@"isMoving" defaultValue:NO];
    TSLocationManager *locationManager = [TSLocationManager sharedInstance];
    [locationManager changePace:isMoving];
    [call resolve];
}

- (void) startBackgroundTask:(CAPPluginCall *) call {
    TSLocationManager *locationManager = [TSLocationManager sharedInstance];
    UIBackgroundTaskIdentifier taskId = [locationManager createBackgroundTask];
    [call resolve:@{@"taskId":@(taskId)}];
}

- (void) stopBackgroundTask:(CAPPluginCall *) call {
    NSNumber *taskId = [call getNumber:@"taskId" defaultValue:@(-1)];
    TSLocationManager *locationManager = [TSLocationManager sharedInstance];
    [locationManager stopBackgroundTask:[taskId longValue]];
    [call resolve];
}

- (void) getCurrentPosition:(CAPPluginCall *) call {
    NSDictionary *options = [call getObject:@"options" defaultValue:@{}];
    TSLocationManager *locationManager = [TSLocationManager sharedInstance];
    
    TSCurrentPositionRequest *request = [[TSCurrentPositionRequest alloc] initWithSuccess:^(TSLocation *location) {
        [call resolve:[location toDictionary]];
    } failure:^(NSError *error) {
        [call reject:[NSString stringWithFormat:@"%lu", error.code] :nil :nil :error.userInfo];
    }];
    
    if (options[@"timeout"]) {
        request.timeout = [options[@"timeout"] doubleValue];
    }
    if (options[@"maximumAge"]) {
        request.maximumAge = [options[@"maximumAge"] doubleValue];
    }
    if (options[@"persist"]) {
        request.persist = [options[@"persist"] boolValue];
    }
    if (options[@"samples"]) {
        request.samples = [options[@"samples"] intValue];
    }
    if (options[@"desiredAccuracy"]) {
        request.desiredAccuracy = [options[@"desiredAccuracy"] doubleValue];
    }
    if (options[@"extras"]) {
        request.extras = options[@"extras"];
    }
    [locationManager getCurrentPosition:request];
}

- (void) watchPosition:(CAPPluginCall *) call {
    NSDictionary *options = [call getObject:@"options" defaultValue:@{}];
    
    TSLocationManager *locationManager = [TSLocationManager sharedInstance];
    
    TSWatchPositionRequest *request = [[TSWatchPositionRequest alloc] initWithSuccess:^(TSLocation *location) {
        // TODO Fire EVENT_WATCHPOSITION here.
        //[self sendEvent:EVENT_WATCHPOSITION body:[location toDictionary]];
        NSLog(@"*** TODO watchPosition fire EVENT_WATCHPOSITION unimplemented ***");
    } failure:^(NSError *error) {
        // DO NOTHING.
    }];

    if (options[@"interval"])           { request.interval = [options[@"interval"] doubleValue]; }
    if (options[@"desiredAccuracy"])    { request.desiredAccuracy = [options[@"desiredAccuracy"] doubleValue]; }
    if (options[@"persist"])            { request.persist = [options[@"persist"] boolValue]; }
    if (options[@"extras"])             { request.extras = options[@"extras"]; }
    if (options[@"timeout"])            { request.timeout = [options[@"timeout"] doubleValue]; }

    [locationManager watchPosition:request];
    [call resolve];
}

- (void) stopWatchPosition:(CAPPluginCall *) call {
    TSLocationManager *locationManager = [TSLocationManager sharedInstance];
    [locationManager stopWatchPosition];
    [call resolve];
}

/// Locations Database

- (void) getLocations:(CAPPluginCall *) call {
    TSLocationManager *locationManager = [TSLocationManager sharedInstance];
    [locationManager getLocations:^(NSArray* records) {
        NSDictionary *params = @{@"locations":records};
        [call resolve:params];
    } failure:^(NSString* error) {
        [call reject:error :nil :nil :@{}];
    }];
}

- (void) sync:(CAPPluginCall *) call {
    TSLocationManager *locationManager = [TSLocationManager sharedInstance];
    [locationManager sync:^(NSArray* records) {
        NSDictionary *params = @{@"locations":records};
        [call resolve:params];
    } failure:^(NSError* error) {
        [call reject:[NSString stringWithFormat:@"%lu", error.code] :nil :nil :error.userInfo];
    }];
}

- (void) getGeofences:(CAPPluginCall *) call {
    TSLocationManager *locationManager = [TSLocationManager sharedInstance];
    [locationManager getGeofences:^(NSArray* geofences) {
        NSMutableArray *result = [NSMutableArray new];
        for (TSGeofence *geofence in geofences) { [result addObject:[geofence toDictionary]]; }
        [call resolve:@{@"geofences": result}];
    } failure:^(NSString* error) {
        [call reject:error :nil :nil :@{}];
    }];
}

- (void) getGeofence:(CAPPluginCall *) call {
    NSString *identifier = [call getString:@"identifier" defaultValue:nil];
    TSLocationManager *locationManager = [TSLocationManager sharedInstance];
    [locationManager getGeofence:identifier success:^(TSGeofence *geofence) {
        [call resolve:[geofence toDictionary]];
    } failure:^(NSString* error) {
        [call reject:error :nil :nil :@{}];
    }];
}

- (void) geofenceExists:(CAPPluginCall *) call {
    NSString *identifier = [call getString:@"identifier" defaultValue:nil];
    TSLocationManager *locationManager = [TSLocationManager sharedInstance];
    [locationManager geofenceExists:identifier callback:^(BOOL exists) {
        [call resolve:@{@"exists": @(exists)}];
    }];
}

- (void) addGeofence:(CAPPluginCall *) call {
    NSDictionary *params = [call getObject:@"options" defaultValue:@{}];

    TSGeofence *geofence = [self buildGeofence:params];
    
    if (!geofence) {
        NSString *error = [NSString stringWithFormat:@"Invalid geofence data: %@", params];
        [call reject:error :nil :nil :@{}];
        return;
    }
    
    TSLocationManager *locationManager = [TSLocationManager sharedInstance];
    
    [locationManager addGeofence:geofence success:^{
        [call resolve];
    } failure:^(NSString *error) {
        [call reject:error :nil :nil :@{}];
    }];
}


- (void) addGeofences:(CAPPluginCall *) call {
    NSArray *data = [call.options mutableArrayValueForKey:@"options"];
    NSMutableArray *geofences = [NSMutableArray new];
    
    for (NSDictionary *params in data) {
        TSGeofence *geofence = [self buildGeofence:params];
        if (geofence != nil) {
            [geofences addObject:geofence];
        } else {
            NSString *error = [NSString stringWithFormat:@"Invalid geofence data: %@", params];
            [call reject:error :nil :nil :@{}];
            return;
        }
    }
    
    TSLocationManager *locationManager = [TSLocationManager sharedInstance];
    [locationManager addGeofences:geofences success:^{
        [call resolve];
    } failure:^(NSString *error) {
        [call reject:error :nil :nil :@{}];
    }];
}

- (void) removeGeofence:(CAPPluginCall *) call {
    NSString *identifier = [call getString:@"identifier" defaultValue:nil];
    
    TSLocationManager *locationManager = [TSLocationManager sharedInstance];
    [locationManager removeGeofence:identifier success:^{
        [call resolve];
    } failure:^(NSString* error) {
        [call reject:error :nil :nil :@{}];
    }];
}

- (void) removeGeofences:(CAPPluginCall *) call {
    NSArray *identifiers = [call.options mutableArrayValueForKey:@"identifiers"];
    
    TSLocationManager *locationManager = [TSLocationManager sharedInstance];
    [locationManager removeGeofences:identifiers success:^{
        [call resolve];
    } failure:^(NSString* error) {
        [call reject:error :nil :nil :@{}];
    }];
}

- (void) getOdometer:(CAPPluginCall *) call {
    
    TSLocationManager *locationManager = [TSLocationManager sharedInstance];
    NSNumber *distance = @([locationManager getOdometer]);
    [call resolve:@{@"odometer":distance}];
}

- (void) setOdometer:(CAPPluginCall *) call {
    double value = [[call getNumber:@"odometer" defaultValue:0] doubleValue];
    
    TSLocationManager *locationManager = [TSLocationManager sharedInstance];
    TSCurrentPositionRequest *request = [[TSCurrentPositionRequest alloc] initWithSuccess:^(TSLocation *location) {
        [call resolve:[location toDictionary]];
    } failure:^(NSError *error) {
        [call reject:[NSString stringWithFormat:@"%lu", error.code] :nil :error :error.userInfo];
    }];
    [locationManager setOdometer:value request:request];
}

- (void) destroyLocations:(CAPPluginCall *) call {
    TSLocationManager *locationManager = [TSLocationManager sharedInstance];
    BOOL result = [locationManager destroyLocations];
    if (result) {
        [call resolve];
    } else {
        [call reject:@"destroyLocations:  Unknown error" :nil :nil :@{}];
    }
}

- (void) destroyLocation:(CAPPluginCall *) call {
    NSString *uuid = [call getString:@"uuid" defaultValue:nil];
    TSLocationManager *locationManager = [TSLocationManager sharedInstance];
    [locationManager destroyLocation:uuid success:^{
        [call resolve];
    } failure:^(NSString *error) {
        [call reject:error :nil :nil :@{}];
    }];
}

- (void) getCount:(CAPPluginCall *) call {
    TSLocationManager *locationManager = [TSLocationManager sharedInstance];
    int count = [locationManager getCount];
    [call resolve:@{@"count": @(count)}];
}

- (void) insertLocation:(CAPPluginCall *) call {
    NSDictionary *params = [call getObject:@"options" defaultValue:@{}];
    TSLocationManager *locationManager = [TSLocationManager sharedInstance];
    [locationManager insertLocation: params success:^(NSString* uuid) {
        [call resolve:@{@"uuid":uuid}];
    } failure:^(NSString* error) {
        [call reject:error :nil :nil :@{}];
    }];
}

- (void) getLog:(CAPPluginCall *) call {
    NSDictionary *params = [call getObject:@"options" defaultValue:@{}];
    
    TSLocationManager *locationManager = [TSLocationManager sharedInstance];
    LogQuery *query = [[LogQuery alloc] initWithDictionary:params];
    [locationManager getLog:query success:^(NSString* log) {
        [call resolve:@{@"log":log}];
    } failure:^(NSString* error) {
        [call reject:error :nil :nil :@{}];
    }];
}

- (void) destroyLog:(CAPPluginCall *) call {
    TSLocationManager *locationManager = [TSLocationManager sharedInstance];
    BOOL result = [locationManager destroyLog];
    if (result) {
        [call resolve];
    } else {
        [call reject:@"destroyLog Unknown error" :nil :nil :@{}];
    }
}

- (void) emailLog:(CAPPluginCall *) call {
    NSDictionary *params = [call getObject:@"query" defaultValue:@{}];
    NSString *email = [call getString:@"email" defaultValue:nil];
    LogQuery *query = [[LogQuery alloc] initWithDictionary:params];
    
    TSLocationManager *locationManager = [TSLocationManager sharedInstance];
    [locationManager emailLog:email query:query success:^{
        [call resolve];
    } failure:^(NSString* error) {
        [call reject:error :nil :nil :@{}];
    }];
}

- (void) uploadLog:(CAPPluginCall *) call {
    NSDictionary *params = [call getObject:@"query" defaultValue:@{}];
    NSString *url = [call getString:@"url" defaultValue:nil];
    LogQuery *query = [[LogQuery alloc] initWithDictionary:params];
    
    TSLocationManager *locationManager = [TSLocationManager sharedInstance];
    [locationManager uploadLog:url query:query success:^{
        [call resolve];
    } failure:^(NSString* error) {
        [call reject:error :nil :nil :@{}];
    }];
    
}

- (void) log:(CAPPluginCall *) call {
    NSString *level = [call getString:@"level" defaultValue:@"debug"];
    NSString *message = [call getString:@"message" defaultValue:@"no message"];
    TSLocationManager *locationManager = [TSLocationManager sharedInstance];
    
    [locationManager log:level message:message];
    [call resolve];
}

- (void) getSensors:(CAPPluginCall *) call {
    TSLocationManager *locationManager = [TSLocationManager sharedInstance];
    NSDictionary *sensors = @{
        @"platform": @"ios",
        @"accelerometer": @([locationManager isAccelerometerAvailable]),
        @"gyroscope": @([locationManager isGyroAvailable]),
        @"magnetometer": @([locationManager isMagnetometerAvailable]),
        @"motion_hardware": @([locationManager isMotionHardwareAvailable])
    };
    [call resolve:sensors];
}

- (void) getDeviceInfo:(CAPPluginCall *) call {
    TSDeviceInfo *deviceInfo = [TSDeviceInfo sharedInstance];
    [call resolve:[deviceInfo toDictionary:@"capacitor"]];
}

- (void) isPowerSaveMode:(CAPPluginCall *) call {
    TSLocationManager *locationManager = [TSLocationManager sharedInstance];
    [call resolve:@{
        @"isPowerSaveMode":@([locationManager isPowerSaveMode])
    }];
}

- (void) isIgnoringBatteryOptimizations:(CAPPluginCall *) call {
    [call resolve:@{
        @"isIgnoringBatteryOptimizations":@(NO)
    }];
}

- (void) requestSettings:(CAPPluginCall *) call {
    [call reject:@"No iOS Implementation" :nil :nil :@{}];
}

- (void) showSettings:(CAPPluginCall *) call {
    [call reject:@"No iOS Implementation" :nil :nil :@{}];
}

- (void) requestPermission:(CAPPluginCall *) call {
    TSLocationManager *locationManager = [TSLocationManager sharedInstance];
    [locationManager requestPermission:^(NSNumber *status) {
        [call resolve:@{@"success":@(YES), @"status":status}];
    } failure:^(NSNumber *status) {
        [call resolve:@{@"success":@(NO), @"status":status}];
    }];
}

- (void) requestTemporaryFullAccuracy:(CAPPluginCall *) call {
    NSString *purpose = [call getString:@"purpose" defaultValue:@""];
    TSLocationManager *locationManager = [TSLocationManager sharedInstance];
    [locationManager requestTemporaryFullAccuracy:purpose success:^(NSInteger accuracyAuthorization) {
        [call resolve:@{@"accuracyAuthorization": @(accuracyAuthorization)}];
    } failure:^(NSError *error) {
        [call reject:error.userInfo[@"NSDebugDescription"] :nil :error :error.userInfo];
    }];
}

- (void) getProviderState:(CAPPluginCall *) call {
    TSLocationManager *locationManager = [TSLocationManager sharedInstance];
    TSProviderChangeEvent *event = [locationManager getProviderState];
    [call resolve:[event toDictionary]];
}

- (void) getTransistorToken:(CAPPluginCall *) call {
    NSString *orgname = [call getString:@"org" defaultValue:nil];
    NSString *username = [call getString:@"username" defaultValue:nil];
    NSString *url = [call getString:@"url" defaultValue:nil];
    
    [TransistorAuthorizationToken findOrCreateWithOrg:orgname
                                             username:username
                                                 url:url
                                            framework:@"capacitor"
                                              success:^(TransistorAuthorizationToken *token) {
        NSDictionary *result = @{
            @"success":@(YES),
            @"token": [token toDictionary]
        };
        [call resolve:result];
    } failure:^(NSError *error) {
        NSDictionary *result = @{
            @"success":@(NO),
            @"status": @(error.code),
            @"message": error.localizedDescription
        };
        [call resolve:result];
    }];
}


- (void) destroyTransistorToken:(CAPPluginCall *) call {
    NSString *url = [call getString:@"url" defaultValue:nil];
    [TransistorAuthorizationToken destroyWithUrl:url];
    [call resolve];
}

- (void) playSound:(CAPPluginCall *) call {
    int soundId = [[call getNumber:@"soundId" defaultValue:0] intValue];
    TSLocationManager *locationManager = [TSLocationManager sharedInstance];
    [locationManager playSound:soundId];
    [call resolve];
}

- (void) removeAllEventListeners:(CAPPluginCall *) call {
    [self removeAllListeners:call];
    NSLog(@"BackgroundGeolocation plugin removeAllListeners");        
    [call resolve];
}

-(TSGeofence*) buildGeofence:(NSDictionary*)params {
    if (!params[@"identifier"] || !params[@"radius"] || !params[@"latitude"] || !params[@"longitude"]) {
        return nil;
    }
    return [[TSGeofence alloc] initWithIdentifier: params[@"identifier"]
                                           radius: [params[@"radius"] doubleValue]
                                         latitude: [params[@"latitude"] doubleValue]
                                        longitude: [params[@"longitude"] doubleValue]
                                    notifyOnEntry: (params[@"notifyOnEntry"]) ? [params[@"notifyOnEntry"] boolValue]  : NO
                                     notifyOnExit: (params[@"notifyOnExit"])  ? [params[@"notifyOnExit"] boolValue] : NO
                                    notifyOnDwell: (params[@"notifyOnDwell"]) ? [params[@"notifyOnDwell"] boolValue] : NO
                                   loiteringDelay: (params[@"loiteringDelay"]) ? [params[@"loiteringDelay"] doubleValue] : 0
                                           extras: params[@"extras"]];
}

- (void)dealloc
{
    TSLocationManager *locationManager = [TSLocationManager sharedInstance];
    [locationManager removeListeners];    
}



@end
