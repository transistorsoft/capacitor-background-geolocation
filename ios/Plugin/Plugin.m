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


@implementation MyPlugin {
    NSMutableDictionary *listeners;
    BOOL ready;
    void(^onLocation)(TSLocation*);
    void(^onLocationError)(NSError*);
}

- (void)load {
    NSLog(@"*************** LOAD ****************");
    TSLocationManager *locationManager = [TSLocationManager sharedInstance];
    UIViewController *root = [[[[UIApplication sharedApplication] delegate] window] rootViewController];
    locationManager.viewController = root;
    
    ready = NO;
    
    __typeof(self) __weak me = self;
    
    // Build event-listener blocks
    onLocation = ^void(TSLocation *location) {
        [me notifyListeners:EVENT_LOCATION data:[location toDictionary]];
    };
    
    onLocationError = ^void(NSError *error) {
        [me notifyListeners:EVENT_LOCATION data: @{@"error":@(error.code)}];
    };
    
    [locationManager onLocation:onLocation failure:onLocationError];
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
    //success(@[[event toDictionary]]);
    [call resolve:[event toDictionary]];
}


@end
