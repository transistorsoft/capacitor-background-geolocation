import {
  Component,
  ViewChild,
  ElementRef,
  OnInit,
  OnDestroy,
  NgZone,
  AfterContentInit
} from '@angular/core';

import { Router} from '@angular/router';

import { Preferences } from '@capacitor/preferences';

import {
  NavController,
  AlertController,
  Platform,
  ModalController,
  LoadingController
} from '@ionic/angular';

import { MapView } from './map-view.component'

import BackgroundGeolocation, {
  State,
  Location,
  Geofence,
  HttpEvent,
  MotionActivityEvent,
  ProviderChangeEvent,
  MotionChangeEvent,
  GeofenceEvent,
  GeofencesChangeEvent,
  HeartbeatEvent,
  ConnectivityChangeEvent,
  TransistorAuthorizationToken,
  Subscription
} from "../capacitor-background-geolocation";

import {environment} from "../../environments/environment";
import {ICON_MAP} from "../lib/icon-map";
import {COLORS} from "../lib/colors";
import {LongPress} from "./lib/LongPress";
import {BGService} from './lib/BGService';
import {SettingsService} from './lib/SettingsService';
import {registerTransistorAuthorizationListener} from "../lib/authorization";

import { SettingsPage } from './modals/settings/settings.page';
import { GeofencePage} from "./modals/geofence/geofence.page";

const CONTAINER_BORDER_POWER_SAVE_OFF = 'none';
const CONTAINER_BORDER_POWER_SAVE_ON = '7px solid red';

// Messages
const MESSAGE = {
  reset_odometer_success: 'Reset odometer success',
  reset_odometer_failure: 'Failed to reset odometer: {result}',
  sync_success: 'Sync success ({result} records)',
  sync_failure: 'Sync error: {result}',
  destroy_locations_success: 'Destroy locations success ({result} records)',
  destroy_locations_failure: 'Destroy locations error: {result}',
  removing_markers: 'Removing markers...',
  rendering_markers: 'Rendering markers...'
}

@Component({
  selector: 'app-advanced',
  templateUrl: './advanced.page.html',
  styleUrls: ['./advanced.page.scss'],
})

export class AdvancedPage implements OnInit, OnDestroy, AfterContentInit {
  @ViewChild('map', {static: true}) private mapElement: ElementRef;	
  /**
  * @property {Object} state
  */
  state: any;
  /**
  * @property {boolean}
  */
  enabled: boolean;
  /**
  * @property {Object} lastLocation
  */
  lastLocation: any;
  /**
  * @property {Object} map of icons
  */
  iconMap: any;
  
  lastDirectionChangeLocation: any;

  // FAB Menu
  isMainMenuOpen: boolean;
  isSyncing: boolean;
  isDestroyingLocations: boolean;
  isResettingOdometer: boolean;
  isEmailingLog: boolean;
  isMapMenuOpen: boolean;
  isWatchingPosition: boolean;

  // Private
  testModeClicks: number;
  testModeTimer: any;

  // Event subscriptions
  subscriptions: Array<Subscription>;

  constructor(
    private navCtrl:NavController,
    private alertCtrl:AlertController,
    private router:Router,
    private modalController:ModalController,
    private loadingCtrl: LoadingController,
    private bgService: BGService,
    private settingsService: SettingsService,
    public zone: NgZone,
    private platform:Platform) {
      
    // Event subscriptions
    this.subscriptions = [];

    // FAB Menu state.
    this.isMainMenuOpen = false;
    this.isMapMenuOpen = false;
    this.isSyncing = false;
    this.isResettingOdometer = false;
    this.isEmailingLog = false;
    this.isWatchingPosition = false;
    this.testModeClicks = 0;
    this.iconMap = ICON_MAP;

    // Initial state
    this.state = {
      enabled: false,
      isMoving: false,
      geofenceProximityRadius: 1000,
      trackingMode: 1,
      isChangingPace: false,
      activityIcon: this.iconMap['activity_unknown'],
      odometer: 0,
      provider: {
        gps: true,
        network: true,
        enabled: true,
        status: -1
      },
      containerBorder: 'none'
    };

    // Listen to PAUSE/RESUME events for fun.
    this.platform.pause.subscribe(() => {
      // pause
    });
    this.platform.resume.subscribe(() => {
      // resume
    });
  }
  getZone() {
    return this.zone;
  }
  onMapReady() {
    // Configure the plugin.
    this.configureBackgroundGeolocation();
  }
  
  async ionViewWillEnter() {
    console.log('⚙️ ionViewWillEnter');
  }

  async ngAfterContentInit()  {
    console.log('⚙️ ngAfterContentInit');
    
    // Re-register Transistor Demo Server Authorization listener.
    registerTransistorAuthorizationListener(this.router);  
  }

  ngOnInit() {}

  ngOnDestroy() {
    this.unsubscribe();
  }

  subscribe(subscription:Subscription) {
    this.subscriptions.push(subscription);
  }

  unsubscribe() {
    this.subscriptions.forEach((subscription) => subscription.remove() );
    this.subscriptions = [];
  }

  /**
  * Configure BackgroundGeolocation plugin
  */
  async configureBackgroundGeolocation() {
    // Listen to BackgroundGeolocation events.  Each BackgroundGeolocation event-listener returns a Subscription
    // instance containing only a .remove() method used for unsubscribing from the event.
    // We manage a collection of these Subscriptions so we can unsubscribe when the view is destroyed or refreshed during
    // development with --livereload (@see ngOnDestroy above).
    //
    this.subscribe(BackgroundGeolocation.onLocation(this.onLocation.bind(this), this.onLocationError.bind(this)));
    this.subscribe(BackgroundGeolocation.onMotionChange(this.onMotionChange.bind(this)));
    this.subscribe(BackgroundGeolocation.onHeartbeat(this.onHeartbeat.bind(this)));
    this.subscribe(BackgroundGeolocation.onGeofence(this.onGeofence.bind(this)));
    this.subscribe(BackgroundGeolocation.onActivityChange(this.onActivityChange.bind(this)));
    this.subscribe(BackgroundGeolocation.onProviderChange(this.onProviderChange.bind(this)));
    this.subscribe(BackgroundGeolocation.onGeofencesChange(this.onGeofencesChange.bind(this)));
    this.subscribe(BackgroundGeolocation.onSchedule(this.onSchedule.bind(this)));
    this.subscribe(BackgroundGeolocation.onHttp(this.onHttp.bind(this)));
    this.subscribe(BackgroundGeolocation.onPowerSaveChange(this.onPowerSaveChange.bind(this)));
    this.subscribe(BackgroundGeolocation.onConnectivityChange(this.onConnectivityChange.bind(this)));
    this.subscribe(BackgroundGeolocation.onEnabledChange(this.onEnabledChange.bind(this)));
    this.subscribe(BackgroundGeolocation.onNotificationAction(this.onNotificationAction.bind(this)));

    /// A Big red border is rendered around view when the device is in "Power Saving Mode".
    this.state.containerBorder = (await BackgroundGeolocation.isPowerSaveMode()) ? CONTAINER_BORDER_POWER_SAVE_ON : CONTAINER_BORDER_POWER_SAVE_OFF;

    const orgname = (await Preferences.get({key: 'orgname'})).value;
    const username = (await Preferences.get({key: 'username'})).value;

    let token:TransistorAuthorizationToken = await
      BackgroundGeolocation.findOrCreateTransistorAuthorizationToken(orgname, username, environment.TRACKER_HOST);

    // With the plugin's #ready method, the supplied config object will only be applied with the first
    // boot of your application.  The plugin persists the configuration you apply to it.  Each boot thereafter,
    // the plugin will automatically apply the last known configuration.

    BackgroundGeolocation.ready({
      transistorAuthorizationToken: token,
      reset: false, // <-- !!WARNING!!  DO NOT USE THIS IN YOUR OWN CODE UNLESS YOU REALLY KNOW WHAT IT DOES
      debug: true,
      locationAuthorizationRequest: 'Always',
      logLevel: BackgroundGeolocation.LOG_LEVEL_VERBOSE,
      backgroundPermissionRationale: {
        title: "Allow {applicationName} to access this device's location even when closed or not in use.",
        message: "This app collects location data to enable recording your trips to work and calculate distance-travelled.",
        positiveAction: 'Change to "{backgroundPermissionOptionLabel}"',
        negativeAction: 'Cancel'
      },
      distanceFilter: 10,
      stopTimeout: 1,
      stopOnTerminate: false,
      startOnBoot: true,
      enableHeadless: true,
      autoSync: true,
      maxDaysToPersist: 14,
    }).then(async (state) => {
      // Store the plugin state onto ourself for convenience.
      console.log('- BackgroundGeolocation is ready: ', state);
      this.zone.run(() => {
        this.state.enabled = state.enabled;
        this.state.isMoving = state.isMoving;
        this.state.geofenceProximityRadius = state.geofenceProximityRadius;
        this.state.trackingMode = state.trackingMode;

        if ((state.schedule.length > 0)) {
          BackgroundGeolocation.startSchedule();
        }
      });
    }).catch((error) => {
      console.warn('- BackgroundGeolocation configuration error: ', error);
    });
  }
  
  ////
  // UI event handlers
  //
  async onClickMainMenu() {
    this.isMainMenuOpen = !this.isMainMenuOpen;
    if (this.isMainMenuOpen) {
      this.bgService.playSound('OPEN');
    } else {
      this.bgService.playSound('CLOSE');
    }
  }

  async onClickSettings() {
    this.bgService.playSound('OPEN');

    const modal = await this.modalController.create({
      component: SettingsPage,
      cssClass: 'my-custom-class',
      animated: true,
      componentProps: {
        'bgService': this.bgService,
        'settingsService': this.settingsService
      }
    });
    modal.onDidDismiss().then(async (result:any) => {
      // Update our view-state -- BackgroundGeolocation state may have changed in Settings screen.
      const state = await BackgroundGeolocation.getState();
      this.state.enabled = state.enabled;
      this.state.isMoving = state.isMoving;
      this.state.geofenceProximityRadius = state.geofenceProximityRadius;
      this.state.trackingMode = state.trackingMode;
    });
    await modal.present();
  }

  async onClickRequestPermission() {
    let providerState = await BackgroundGeolocation.getProviderState();

    const alert = await this.alertCtrl.create({
      header: 'Request Permission',
      message: `Current Authorization Status: ${providerState.status}`,
      cssClass: 'alert-wide',
      buttons: [{
        text: 'When in Use',
        handler: () => { this.requestPermission('WhenInUse') }
      }, {
        text: 'Always',
        handler: () => { this.requestPermission('Always') }
      }]
    });
    alert.present();
  }

  async requestPermission(request) {
    await BackgroundGeolocation.setConfig({locationAuthorizationRequest: request});
    let status = await BackgroundGeolocation.requestPermission();

    console.log('[requestPermission] status:', status);

    const alert = await this.alertCtrl.create({
      header: 'Permission Result',
      message: `Authorization Status: ${status}`,
      cssClass: 'alert-wide',
      buttons: [{
        text: 'Ok',
        handler: () => {  }
      }]
    });
    alert.present();
  }

  async onClickSync() {
    this.bgService.playSound('BUTTON_CLICK');

    const onComplete = (message, result) => {
      this.settingsService.toast(message, result);
      this.isSyncing = false;
    };

    const count = await BackgroundGeolocation.getCount();
    if (!count) {
      this.settingsService.toast('Database is empty.');
      return;
    }
    const message = 'Sync ' + count + ' location' + ((count>1) ? 's' : '') + '?';
    this.settingsService.confirm('Confirm Sync', message, () => {
      this.isSyncing = true;
      BackgroundGeolocation.sync().then(rs => {
        this.bgService.playSound('MESSAGE_SENT');
        onComplete(MESSAGE.sync_success, count);
      }).catch(error => {
        onComplete(MESSAGE.sync_failure, error);
      });
    });
  }

  async onClickDestroyLocations() {
    this.bgService.playSound('BUTTON_CLICK');

    let settingsService = this.settingsService;

    const onComplete = (message, result) => {
      settingsService.toast(message, result);
      this.isDestroyingLocations = false;
    };

    const count = await BackgroundGeolocation.getCount();
    if (!count) {
      this.settingsService.toast('Locations database is empty');
      return;
    }
    // Confirm destroy
    let message = 'Destroy ' + count + ' location' + ((count>1) ? 's' : '') + '?';
    this.settingsService.confirm('Confirm Delete', message, () => {
      // Good to go...
      this.isDestroyingLocations = true;
      BackgroundGeolocation.destroyLocations().then(result => {
        this.bgService.playSound('MESSAGE_SENT');
        onComplete.call(this, MESSAGE.destroy_locations_success, count);
      }).catch(error => {
        onComplete.call(this, MESSAGE.destroy_locations_failure, error);
      });
    });
  }

  async onClickEmailLogs() {
    this.bgService.playSound('BUTTON_CLICK');

    const email = (await Preferences.get({key: 'settings:email'})).value;
    if (!email) {
      // Prompt user to enter a unique identifier for tracker.transistorsoft.com
      const prompt = await this.alertCtrl.create({
        backdropDismiss: false,
        header: 'Email Logs',
        message: 'Please enter your email address',
        inputs: [{
          name: 'email',
          placeholder: 'Email address'
        }],
        buttons: [{
          text: 'Cancel',
          handler: (data: any) => {
            prompt.dismiss();
          }
        }, {
          text: 'OK',
          handler: (data: any) => {
            if (data.email.length < 1) {
              return;
            }
            Preferences.set({key: 'settings:email', value: data.email});
            this.doEmailLog(data.email);

          }
        }]
      });
      prompt.present();
    } else {
      this.doEmailLog(email);
    }
  }

  async doEmailLog(email) {
    const spinner = await this.loadingCtrl.create({
      cssClass: 'my-custom-class',
      message: 'Preparing logs...'
    });
    spinner.present();

    this.isEmailingLog = true;

    BackgroundGeolocation.logger.emailLog(email).then(result => {
      spinner.dismiss();
      this.isEmailingLog = false;
    }).catch(error => {
      spinner.dismiss();
      this.isEmailingLog = false;
      console.warn('- email log failed: ', error);
    });
  }

  onClickResetOdometer() {
    this.state.odometer = '0.0';
    this.bgService.playSound('BUTTON_CLICK');
    this.isResettingOdometer = true;

    let settingsService = this.settingsService;

    const onComplete = (message, result?) => {
      settingsService.toast(message, result);
      this.isResettingOdometer = false;
    };

    BackgroundGeolocation.resetOdometer().then((location) => {
      onComplete.call(this, MESSAGE.reset_odometer_success);
    }).catch((error) => {
      onComplete.call(this, MESSAGE.reset_odometer_failure, error);
    });
  }

  // Return to Home screen (app switcher)
  onClickHome() {
    this.navCtrl.navigateBack('/home');
  }

  async onToggleEnabled() {
    const state = await BackgroundGeolocation.getState();

    if (state.enabled === this.state.enabled) {
      // The plugin is already in the desired state.  Ignored.  onToggleEnabled fires on initial boot.
      return;
    }
    this.bgService.playSound('BUTTON_CLICK');

    if (this.state.enabled) {
      let onSuccess = (state) => {
        console.log('[js] START SUCCESS :', state);
      };
      let onFailure = (error) => {
        console.error('[js] START FAILURE: ', error);
      };

      if (this.state.trackingMode == 1) {
        BackgroundGeolocation.start().then(onSuccess).catch(onFailure);
      } else {
        BackgroundGeolocation.startGeofences().then(onSuccess).catch(onFailure);
      }
    } else {
      await BackgroundGeolocation.stop();
      this.state.isMoving = false;
    }
  }

  onClickWatchPosition() {
    this.isWatchingPosition = !this.isWatchingPosition;
    if (this.isWatchingPosition) {
      BackgroundGeolocation.watchPosition((location) => {
        console.log('*** [watchPosition]', location);
      }, (error) => {
        console.warn('*** [watchPosition] ERROR: ', error);
      }, {
        interval: 1000
      });
    } else {
      BackgroundGeolocation.stopWatchPosition();
    }
  }

  onClickGetCurrentPosition() {
    this.bgService.playSound('BUTTON_CLICK');

    BackgroundGeolocation.getCurrentPosition({
      maximumAge: 0,
      desiredAccuracy: 100,
      samples: 1,
      persist: true,
      timeout: 30,
      extras: {
        event: 'getCurrentPosition'
      }
    }).then(location => {
      console.log('[js] getCurrentPosition: ', location);
    }).catch(error => {
      console.warn('[js] getCurrentPosition FAILURE: ', error);
    });
  }

  /**
  * My private test mode.  DO NOT USE
  * @private
  */
  onClickTestMode() {
    this.bgService.playSound('TEST_MODE_CLICK');
    this.testModeClicks++;
    if (this.testModeClicks == 10) {
      this.bgService.playSound('TEST_MODE_SUCCESS');
      this.settingsService.applyTestConfig();
    }
    if (this.testModeTimer > 0) clearTimeout(this.testModeTimer);

    this.testModeTimer = setTimeout(() => {
      this.testModeClicks = 0;
    }, 2000);

  }
  onClickChangePace() {
    if (!this.state.enabled) {
      return;
    }
    const onComplete = () => {
      this.state.isChangingPace = false;
    }
    this.bgService.playSound('BUTTON_CLICK');

    this.state.isChangingPace = true;
    this.state.isMoving = !this.state.isMoving;
    BackgroundGeolocation.changePace(this.state.isMoving).then(onComplete).catch(onComplete);
  }

  /// Listener from MapView
  async onAddGeofence(coords) {
    let props:any = {bgService: this.bgService};
    if (Array.isArray(coords)) {
      props.vertices = coords;
    } else {
      props.latitude = coords.latitude;
      props.longitude = coords.longitude;
    }
    const modal = await this.modalController.create({
      component: GeofencePage,
      cssClass: 'ios',
      animated: true,
      componentProps: props
    });
    await modal.present();  
  }

  ////
  // Background Geolocation event-listeners
  //

  /**
  * @event location
  */
  onLocation(location:Location) {
    console.log('[location] -', JSON.stringify(location, null, 2));
    // Print a log message to SDK's logger to prove this executed, even in the background.
    BackgroundGeolocation.logger.debug("👍 [onLocation] received location in Javascript: " + location.uuid);
    
    this.zone.run(() => {
      if (!location.sample) {
        // Convert meters -> km -> round nearest hundredth -> fix float xxx.x
        this.state.odometer = parseFloat((Math.round((location.odometer/1000)*10)/10).toString()).toFixed(1);
      }
    });
  }
  /**
  * @event location failure
  */
  onLocationError(error:number) {
    console.warn('[location] - ERROR: ', error);
  }
  /**
  * @event motionchange
  */
  onMotionChange(event:MotionChangeEvent) {
    console.log('[motionchange] -', event.isMoving, event.location);

    this.zone.run(() => {      
      this.state.enabled = true;
      this.state.isChangingPace = false;
      this.state.isMoving = event.isMoving;
    });
  }

  /**
  * @event heartbeat
  */
  onHeartbeat(event:HeartbeatEvent) {
    console.log('[heartbeat] -', event);
  }
  /**
  * @event activitychange
  */
  onActivityChange(event:MotionActivityEvent) {
    console.log('[activitychange] -', event.activity, event.confidence);

    this.zone.run(() => {
      this.state.activityName = event.activity;
      this.state.activityIcon = this.iconMap['activity_' + event.activity];
    });
  }

  /**
  * @event providerchange
  */
  onProviderChange(event:ProviderChangeEvent) {
    console.log('[providerchange] -', event);

    if ((event.status == BackgroundGeolocation.AUTHORIZATION_STATUS_ALWAYS) && (event.accuracyAuthorization == BackgroundGeolocation.ACCURACY_AUTHORIZATION_REDUCED)) {
      // Supply "Purpose" key from Info.plist as 1st argument.
      BackgroundGeolocation.requestTemporaryFullAccuracy("DemoPurpose").then((accuracyAuthorization) => {
        if (accuracyAuthorization == BackgroundGeolocation.ACCURACY_AUTHORIZATION_FULL) {
          console.log(`[requestTemporaryFullAccuracy] GRANTED:  ${accuracyAuthorization}`);
        } else {
          console.log(`[requestTemporaryFullAccuracy] DENIED:  ${accuracyAuthorization}`);
        }
      }).catch((error) => {
        console.log(`[requestTemporaryFullAccuracy] FAILED TO SHOW DIALOG: ${error}`);
      });
    }

    switch(event.status) {
      case BackgroundGeolocation.AUTHORIZATION_STATUS_DENIED:
        break;
      case BackgroundGeolocation.AUTHORIZATION_STATUS_ALWAYS:
        break;
      case BackgroundGeolocation.AUTHORIZATION_STATUS_WHEN_IN_USE:
        break;
    }
    this.zone.run(() => {
      this.state.provider = event;
    });

  }
  /**
  * @event geofenceschange
  */
  onGeofencesChange(event:GeofencesChangeEvent) {
    console.log('[geofenceschange] -', event);    
  }

  /**
  * @event geofence
  */
  async onGeofence(event:GeofenceEvent) {
    console.log('[geofence] -', event);    
  }
  /**
  * @event http
  */
  onHttp(response:HttpEvent) {
    if (response.success) {
      console.log('[http] - success: ', response);
    } else {
      console.warn('[http] - FAILURE: ', response);
    }
  }

  /**
  * @event schedule
  */
  onSchedule(state:State) {
    console.log('[schedule] - ', state);
    this.zone.run(() => {
      this.state.enabled = state.enabled;
    });
  }
  /**
  * @event powersavechange
  */
  onPowerSaveChange(isPowerSaveMode) {
    console.log('[js powersavechange: ', isPowerSaveMode);
    this.settingsService.toast('Power-save mode: ' + ((isPowerSaveMode) ? 'ON' : 'OFF'), null, 5000);
    this.zone.run(() => {
      this.state.containerBorder = (isPowerSaveMode) ? CONTAINER_BORDER_POWER_SAVE_ON : CONTAINER_BORDER_POWER_SAVE_OFF;
    });
  }

  /**
  * @event connectivitychange
  */
  onConnectivityChange(event:ConnectivityChangeEvent) {
    this.settingsService.toast('connectivitychange: ' + event.connected);
    console.log('[connectivitychange] -', event);
  }
  /**
  * @event enabledchange
  */
  onEnabledChange(enabled:boolean) {
    this.settingsService.toast('enabledchange: ' + enabled);
    console.log('[enabledchange] -', enabled);
    this.zone.run(() => {
      this.state.enabled = enabled;
      this.state.isMoving = false;
    });
  }

  /**
  * @event notificationaction
  */
  onNotificationAction(buttonId:string) {
    console.log('[notificationaction] -', buttonId);
    switch(buttonId) {
      case 'notificationButtonFoo':
        break;
      case 'notificaitonButtonBar':
        break;
    }
  }      
}
