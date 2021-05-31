import {
  Component,
  ViewChild,
  ElementRef,
  OnInit,
  AfterContentInit
} from '@angular/core';

import { Router} from '@angular/router';

import {
  AlertController,
  Platform,
  ModalController,
  LoadingController
} from '@ionic/angular';

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
  TransistorAuthorizationToken
} from "../capacitor-background-geolocation";

import {ENV} from "../ENV";
import {ICON_MAP} from "../lib/icon-map";
import {COLORS} from "../lib/colors";
import {LongPress} from "./lib/LongPress";
import {BGService} from './lib/BGService';
import {SettingsService} from './lib/SettingsService';
import {registerTransistorAuthorizationListener} from "../lib/authorization";

import { SettingsPage } from './modals/settings/settings.page';
import { GeofencePage} from "./modals/geofence/geofence.page";

declare var google;

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
export class AdvancedPage implements OnInit, AfterContentInit {
  @ViewChild('map', {static: true}) private mapElement: ElementRef;
	/**
  * @property {google.Map} Reference to Google Map instance
  */
  map: any;
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

  currentLocationMarker: any;
  locationAccuracyCircle:  any;
  geofenceHitMarkers: any;
  polyline: any;
  stationaryRadiusCircle: any;
  geofenceCursor: any;
  locationMarkers: any;
  geofenceMarkers: any;
  lastDirectionChangeLocation: any;

  // Geofence Hits
  geofenceHits: any;

  // FAB Menu
  isMainMenuOpen: boolean;
  isSyncing: boolean;
  isDestroyingLocations: boolean;
  isResettingOdometer: boolean;
  isEmailingLog: boolean;
  isMapMenuOpen: boolean;

  // Private
  testModeClicks: number;
  testModeTimer: any;

  constructor(
    public alertCtrl:AlertController,
    public router:Router,
    public modalController:ModalController,
    private loadingCtrl: LoadingController,
    private bgService: BGService,
    public settingsService: SettingsService,
    public platform:Platform) {

    // FAB Menu state.
    this.isMainMenuOpen = false;
    this.isMapMenuOpen = false;
    this.isSyncing = false;
    this.isResettingOdometer = false;
    this.isEmailingLog = false;

    this.testModeClicks = 0;

    this.iconMap = ICON_MAP;

    this.geofenceHits = [];

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

    /// Listen to PAUSE/RESUME events for fun.
    this.platform.pause.subscribe(() => {
      console.log('************************** PAUSE');
    });
    this.platform.resume.subscribe(() => {
      console.log('************************** RESUME');
    })
  }

  async ionViewWillEnter() {
    // When live-reloading, we need to tell the plugin to remove all its listeners otherwise new listeners
    // are accumulated with each live-reload.
    await BackgroundGeolocation.removeListeners();
    // Re-register Transistor Demo Server Authorization listener.
    registerTransistorAuthorizationListener(this.router);

    // Configure the plugin.
    this.configureBackgroundGeolocation();
  }

  ngAfterContentInit()  {
    // Setup the GoogleMap.
    this.configureMap();
  }

  ngOnInit() {}

  /**
  * Configure BackgroundGeolocation plugin
  */
  async configureBackgroundGeolocation() {
    // [optional] We first bind all our event-handlers to *this* so that we have the option to later remove these
    // listeners with BackgroundGeolocation.un("eventname", this.onMyHandler), since the #bind method returns a new function instance.
    // To remove an event-handler requires a reference to the *exact* success-callback provided to #on
    // eg:
    //  this.onLocation = this.onLocation.bind(this);
    //  BackgroundGeolocation.onLocation(this.onLocation);  <-- add listener
    //  BackgroundGeolocation.un("location", this.onLocation);  <-- remove listener
    // If you don't plan to remove events, this is unnecessary.
    //
    this.onLocation = this.onLocation.bind(this);
    this.onLocationError = this.onLocationError.bind(this);
    this.onMotionChange = this.onMotionChange.bind(this);
    this.onHeartbeat = this.onHeartbeat.bind(this);
    this.onGeofence = this.onGeofence.bind(this);
    this.onActivityChange = this.onActivityChange.bind(this);
    this.onProviderChange = this.onProviderChange.bind(this);
    this.onGeofencesChange = this.onGeofencesChange.bind(this);
    this.onSchedule = this.onSchedule.bind(this);
    this.onHttp = this.onHttp.bind(this);

    this.onPowerSaveChange = this.onPowerSaveChange.bind(this);
    this.onConnectivityChange = this.onConnectivityChange.bind(this);
    this.onEnabledChange = this.onEnabledChange.bind(this);

    // Listen to BackgroundGeolocation events
    BackgroundGeolocation.onLocation(this.onLocation, this.onLocationError);
    BackgroundGeolocation.onMotionChange(this.onMotionChange);
    BackgroundGeolocation.onHeartbeat(this.onHeartbeat);
    BackgroundGeolocation.onGeofence(this.onGeofence);
    BackgroundGeolocation.onActivityChange(this.onActivityChange);
    BackgroundGeolocation.onProviderChange(this.onProviderChange);
    BackgroundGeolocation.onGeofencesChange(this.onGeofencesChange);
    BackgroundGeolocation.onSchedule(this.onSchedule);
    BackgroundGeolocation.onHttp(this.onHttp);
    BackgroundGeolocation.onPowerSaveChange(this.onPowerSaveChange);
    BackgroundGeolocation.onConnectivityChange(this.onConnectivityChange);
    BackgroundGeolocation.onEnabledChange(this.onEnabledChange);
    BackgroundGeolocation.onNotificationAction(this.onNotificationAction);

    /// A Big red border is rendered around view when the device is in "Power Saving Mode".
    this.state.containerBorder = (await BackgroundGeolocation.isPowerSaveMode()) ? CONTAINER_BORDER_POWER_SAVE_ON : CONTAINER_BORDER_POWER_SAVE_OFF;

    const localStorage = (<any>window).localStorage;
    const orgname = localStorage.getItem('orgname') || ''
    const username = localStorage.getItem('username') || '';

    let token:TransistorAuthorizationToken = await
      BackgroundGeolocation.findOrCreateTransistorAuthorizationToken(orgname, username,ENV.TRACKER_HOST);

    // With the plugin's #ready method, the supplied config object will only be applied with the first
    // boot of your application.  The plugin persists the configuration you apply to it.  Each boot thereafter,
    // the plugin will automatically apply the last known configuration.

    BackgroundGeolocation.ready({
      transistorAuthorizationToken: token,
      reset: false,
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
      this.state.enabled = state.enabled;
      this.state.isMoving = state.isMoving;
      this.state.geofenceProximityRadius = state.geofenceProximityRadius;
      this.state.trackingMode = state.trackingMode;

      if ((state.schedule.length > 0)) {
        BackgroundGeolocation.startSchedule();
      }
    }).catch((error) => {
      console.warn('- BackgroundGeolocation configuration error: ', error);
    });
  }

  /**
  * Configure Google Maps
  */
  configureMap() {
    // Handle case where app booted without network accesss (google maps lib fails to load)
    if (typeof(google) !== 'object') {
      console.warn('- map not loaded');
      return;
    }
    this.locationMarkers = [];
    this.geofenceMarkers = [];
    this.geofenceHitMarkers = [];

    let latLng = new google.maps.LatLng(-34.9290, 138.6010);

    let mapOptions = {
      center: latLng,
      zoom: 15,
      mapTypeId: google.maps.MapTypeId.ROADMAP,
      zoomControl: false,
      mapTypeControl: false,
      panControl: false,
      rotateControl: false,
      scaleControl: false,
      streetViewControl: false,
      disableDefaultUI: true
    };
    this.map = new google.maps.Map(this.mapElement.nativeElement, mapOptions);

    // Create LongPress event-handler
    new LongPress(this.map, 500);

    // Tap&hold detected.  Play a sound a draw a circular cursor.
    google.maps.event.addListener(this.map, 'longpresshold', this.onLongPressStart.bind(this));
    // Longpress cancelled.  Get rid of the circle cursor.
    google.maps.event.addListener(this.map, 'longpresscancel', this.onLongPressCancel.bind(this));
    // Longpress initiated, add the geofence
    google.maps.event.addListener(this.map, 'longpress', this.onLongPress.bind(this));

    // Blue current location marker
    this.currentLocationMarker = new google.maps.Marker({
      zIndex: 10,
      map: this.map,
      title: 'Current Location',
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 12,
        fillColor: COLORS.blue,
        fillOpacity: 1,
        strokeColor: COLORS.white,
        strokeOpacity: 1,
        strokeWeight: 6
      }
    });
    // Light blue location accuracy circle
    this.locationAccuracyCircle = new google.maps.Circle({
      map: this.map,
      zIndex: 9,
      fillColor: COLORS.light_blue,
      fillOpacity: 0.4,
      strokeOpacity: 0
    });
    // Stationary Geofence
    this.stationaryRadiusCircle = new google.maps.Circle({
      zIndex: 0,
      fillColor: COLORS.red,
      strokeColor: COLORS.red,
      strokeWeight: 1,
      fillOpacity: 0.3,
      strokeOpacity: 0.7,
      map: this.map
    });
    // Route polyline
    let seq = {
      repeat: '30px',
      icon: {
        path: google.maps.SymbolPath.FORWARD_OPEN_ARROW,
        scale: 1,
        fillOpacity: 0,
        strokeColor: COLORS.white,
        strokeWeight: 1,
        strokeOpacity: 1
      }
    };
    this.polyline = new google.maps.Polyline({
      map: (this.settingsService.applicationState.mapHidePolyline) ? null : this.map,
      zIndex: 1,
      geodesic: true,
      strokeColor: COLORS.polyline_color,
      strokeOpacity: 0.7,
      strokeWeight: 7,
      icons: [seq]
    });
    // Popup geofence cursor for adding geofences via LongPress
    this.geofenceCursor = new google.maps.Marker({
      clickable: false,
      zIndex: 100,
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 100,
        fillColor: COLORS.green,
        fillOpacity: 0.2,
        strokeColor: COLORS.green,
        strokeWeight: 1,
        strokeOpacity: 0.7
      }
    });
  }

  ////
  // UI event handlers
  //
  onClickMainMenu() {
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

    let count = await BackgroundGeolocation.getCount();
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
    const storage = (<any>window).localStorage;
    const email = storage.getItem('settings:email');
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
            storage.setItem('settings:email', data.email);
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
    this.resetMarkers();

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
    this.router.navigate(['/home']);
  }

  onClickMapMenu() {
    this.isMapMenuOpen = !this.isMapMenuOpen;
    let soundId = (this.isMapMenuOpen) ? 'OPEN' : 'CLOSE';
    this.bgService.playSound(soundId);
  }

  onSelectMapOption(name) {
    this.bgService.playSound('BUTTON_CLICK');
    // Invert the value
    let enabled = !this.settingsService.applicationState[name];

    // Save it:
    this.settingsService.set(name, enabled);

    // Apply it:
    let map = (enabled) ? null : this.map;
    let message = (enabled) ? 'Hide ' : 'Show ';
    switch(name) {
      case 'mapHideMarkers':
        this.locationMarkers.forEach((marker) => {
          marker.setMap(map);
        });
        message += 'map markers';
        break;
      case 'mapHidePolyline':
        this.polyline.setMap(map);
        message += 'polyline';
        break;
      case 'mapHideGeofenceHits':
        this.geofenceHitMarkers.forEach((marker) => {
          marker.setMap(map);
        });
        message += 'geofence transitions';
        break;
     }
     this.settingsService.toast(message, undefined, 1000);
  }

  async onToggleEnabled() {
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
      this.state.isMoving = false;
      await BackgroundGeolocation.stop();
      this.clearMarkers();
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
        foo: 'bar'
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

    this.setCenter(location);

    if (!location.sample) {
      // Convert meters -> km -> round nearest hundredth -> fix float xxx.x
      this.state.odometer = parseFloat((Math.round((location.odometer/1000)*10)/10).toString()).toFixed(1);
    }
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

    if (event.isMoving) {
      this.hideStationaryCircle();
    } else {
      this.showStationaryCircle(event.location);
    }
    this.state.enabled = true;
    this.state.isChangingPace = false;
    this.state.isMoving = event.isMoving;
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
    this.state.activityName = event.activity;
    this.state.activityIcon = this.iconMap['activity_' + event.activity];
    console.log('[activitychange] -', event.activity, event.confidence);
  }
  /**
  * @event providerchange
  */
  onProviderChange(provider:ProviderChangeEvent) {
    console.log('[providerchange] -', provider);

    switch(provider.status) {
      case BackgroundGeolocation.AUTHORIZATION_STATUS_DENIED:
        break;
      case BackgroundGeolocation.AUTHORIZATION_STATUS_ALWAYS:
        break;
      case BackgroundGeolocation.AUTHORIZATION_STATUS_WHEN_IN_USE:
        break;
    }

    this.state.provider = provider;
  }
  /**
  * @event geofenceschange
  */
  onGeofencesChange(event:GeofencesChangeEvent) {
    console.log('[geofenceschange] -', event);
    // All geofences off
    if (!event.on.length && !event.off.length) {
      this.geofenceMarkers.forEach((circle) => {
        circle.setMap(null);
      });
      this.geofenceMarkers = [];
      return;
    }

    // Filter out all "off" geofences.
    this.geofenceMarkers = this.geofenceMarkers.filter((circle) => {
      if (event.off.indexOf(circle.identifier) < 0) {
        return true;
      } else {
        circle.setMap(null);
        return false;
      }
    });

    // Add new "on" geofences.
    event.on.forEach((geofence:Geofence) => {
      var circle = this.geofenceMarkers.find((marker) => { return marker.identifier === geofence.identifier;});
      // Already added?
      if (circle) { return; }
      this.geofenceMarkers.push(this.buildGeofenceMarker(geofence));
    });

  }
  /**
  * @event geofence
  */
  async onGeofence(event:GeofenceEvent) {
    console.log('[geofence] -', event);

    var circle = this.geofenceMarkers.find((marker) => {
      return marker.identifier === event.identifier;
    });

    if (!circle) { return; }
    var map = (this.settingsService.applicationState.mapHideGeofenceHits) ? null : this.map;

    let location = event.location;
    let geofenceMarker = this.geofenceHits[event.identifier];
    if (!geofenceMarker) {
      geofenceMarker = {
        circle: new google.maps.Circle({
          zIndex: 100,
          fillOpacity: 0,
          strokeColor: COLORS.black,
          strokeWeight: 1,
          strokeOpacity: 1,
          radius: circle.getRadius()+1,
          center: circle.getCenter(),
          map: map
        }),
        events: []
      };
      this.geofenceHits[event.identifier] = geofenceMarker;
      this.geofenceHitMarkers.push(geofenceMarker.circle);
    }

    var color;
    if (event.action === 'ENTER') {
      color = COLORS.green;
    } else if (event.action === 'DWELL') {
      color = COLORS.gold;
    } else {
      color = COLORS.red;
    }

    let circleLatLng = geofenceMarker.circle.getCenter();
    let locationLatLng = new google.maps.LatLng(location.coords.latitude, location.coords.longitude);
    let distance = google.maps.geometry.spherical.computeDistanceBetween (circleLatLng, locationLatLng);

    // Push event
    geofenceMarker.events.push({
      action: event.action,
      location: event.location,
      distance: distance
    });

    let heading = google.maps.geometry.spherical.computeHeading(circleLatLng, locationLatLng);
    let circleEdgeLatLng = google.maps.geometry.spherical.computeOffset(circleLatLng, geofenceMarker.circle.getRadius(), heading);

    geofenceMarker.events.push({
      location: event.location,
      action: event.action,
      distance: distance
    });

    var geofenceEdgeMarker = new google.maps.Marker({
      zIndex: 1000,
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 5,
        fillColor: color,
        fillOpacity: 0.7,
        strokeColor: COLORS.black,
        strokeWeight: 1,
        strokeOpacity: 1
      },
      map: map,
      position: circleEdgeLatLng
    });
    this.geofenceHitMarkers.push(geofenceEdgeMarker);

    var locationMarker = this.buildLocationMarker(location, {
      showHeading: true
    });
    locationMarker.setMap(map);
    this.geofenceHitMarkers.push(locationMarker);

    var polyline = new google.maps.Polyline({
      map: map,
      zIndex: 1000,
      geodesic: true,
      strokeColor: COLORS.black,
      strokeOpacity: 1,
      strokeWeight: 1,
      path: [circleEdgeLatLng, locationMarker.getPosition()]
    });
    this.geofenceHitMarkers.push(polyline);

    // Change the color of activated geofence to light-grey.
    circle.activated = true;
    circle.setOptions({
      fillColor: COLORS.grey,
      fillOpacity: 0.2,
      strokeColor: COLORS.grey,
      strokeOpacity: 0.4
    });
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
    this.state.enabled = state.enabled;

    console.log('[schedule] - ', state);
  }
  /**
  * @event powersavechange
  */
  onPowerSaveChange(isPowerSaveMode) {
    console.log('[js powersavechange: ', isPowerSaveMode);
    this.settingsService.toast('Power-save mode: ' + ((isPowerSaveMode) ? 'ON' : 'OFF'), null, 5000);
    this.state.containerBorder = (isPowerSaveMode) ? CONTAINER_BORDER_POWER_SAVE_ON : CONTAINER_BORDER_POWER_SAVE_OFF;
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
    this.state.enabled = enabled;
    this.state.isMoving = false;
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

  ////
  // Google map methods
  //
  //
  //
  private setCenter(location:Location) {
    this.updateCurrentLocationMarker(location);
    setTimeout(function() {
      this.map.setCenter(new google.maps.LatLng(location.coords.latitude, location.coords.longitude));
    }.bind(this));
  }

  private updateCurrentLocationMarker(location:Location) {
    var latlng = new google.maps.LatLng(location.coords.latitude, location.coords.longitude);
    this.currentLocationMarker.setPosition(latlng);
    this.locationAccuracyCircle.setCenter(latlng);
    this.locationAccuracyCircle.setRadius(location.coords.accuracy);

    if (location.sample === true) {
      return;
    }
    if (this.lastLocation) {
      this.locationMarkers.push(this.buildLocationMarker(location));
    }
    // Add breadcrumb to current Polyline path.
    this.polyline.getPath().push(latlng);
    if (!this.state.mapHidePolyline) {
      this.polyline.setMap(this.map);
    }
    this.lastLocation = location;
  }

  // Build a bread-crumb location marker.
  private buildLocationMarker(location:Location, options?) {
    options = options || {};
    var icon = google.maps.SymbolPath.CIRCLE;
    var scale = 3;
    var zIndex = 1;
    var anchor;
    var strokeWeight = 1;

    if (!this.lastDirectionChangeLocation) {
      this.lastDirectionChangeLocation = location;
    }

    // Render an arrow marker if heading changes by 10 degrees or every 5 points.
    var deltaHeading = Math.abs(location.coords.heading - this.lastDirectionChangeLocation.coords.heading);
    if ((deltaHeading >= 15) || !(this.locationMarkers.length % 5) || options.showHeading) {
      icon = google.maps.SymbolPath.FORWARD_CLOSED_ARROW;
      scale = 2;
      strokeWeight = 1;
      anchor = new google.maps.Point(0, 2.6);
      this.lastDirectionChangeLocation = location;
    }

    return new google.maps.Marker({
      zIndex: zIndex,
      icon: {
        path: icon,
        rotation: location.coords.heading,
        scale: scale,
        anchor: anchor,
        fillColor: COLORS.polyline_color,
        fillOpacity: 1,
        strokeColor: COLORS.black,
        strokeWeight: strokeWeight,
        strokeOpacity: 1
      },
      map: (!this.settingsService.applicationState.mapHideMarkers) ? this.map : null,
      position: new google.maps.LatLng(location.coords.latitude, location.coords.longitude)
    });
  }

  buildGeofenceMarker(geofence:Geofence) {
    // Add longpress event for adding GeoFence of hard-coded radius 200m.
    var circle = new google.maps.Circle({
      identifier: geofence.identifier,
      zIndex: 100,
      fillColor: COLORS.green,
      fillOpacity: 0.2,
      strokeColor: COLORS.green,
      strokeWeight: 1,
      strokeOpacity: 0.7,
      params: geofence,
      radius: geofence.radius,
      center: new google.maps.LatLng(geofence.latitude, geofence.longitude),
      map: this.map
    });
    // Add 'click' listener to geofence so we can edit it.
    google.maps.event.addListener(geofence, 'click', () => {
      this.settingsService.toast('Click geofence ' + geofence.identifier, null, 1000);
    });
    return circle;
  }

  buildStopZoneMarker(latlng:any) {
    return new google.maps.Marker({
      zIndex: 1,
      map: this.map,
      position: latlng,
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 12,
        fillColor: COLORS.red,
        fillOpacity: 0.3,
        strokeColor: COLORS.red,
        strokeWeight: 1,
        strokeOpacity: 0.7
      }
    });
  }

  showStationaryCircle(location:Location) {
    var coords = location.coords;
    var radius = (this.state.trackingMode == 1) ? 200 : (this.state.geofenceProximityRadius / 2);
    var center = new google.maps.LatLng(coords.latitude, coords.longitude);

    this.stationaryRadiusCircle.setRadius(radius);
    this.stationaryRadiusCircle.setCenter(center);
    this.stationaryRadiusCircle.setMap(this.map);
    this.map.setCenter(center);
  }

  hideStationaryCircle() {
    // Create a little red breadcrumb circle of our last stop-position
    var latlng = this.stationaryRadiusCircle.getCenter();
    var stopZone = this.buildStopZoneMarker(latlng);
    var lastMarker = this.locationMarkers.pop();
    if (lastMarker) {
      lastMarker.setMap(null);
    }
    this.locationMarkers.push(stopZone);
    this.stationaryRadiusCircle.setMap(null);
  }

  resetMarkers() {
    // Clear location-markers.
    this.locationMarkers.forEach((marker) => {
      marker.setMap(null);
    });
    this.locationMarkers = [];

    // Clear geofence hit markers
    this.geofenceHitMarkers.forEach((marker) => {
      marker.setMap(null);
    })

    this.polyline.setPath([]);
  }

  clearMarkers() {
    this.resetMarkers();

    this.geofenceMarkers.forEach((marker) => {
      marker.setMap(null);
    });
    this.geofenceMarkers = [];

    // Clear red stationaryRadius marker
    this.stationaryRadiusCircle.setMap(null);

    // Clear blue route PolyLine
    this.polyline.setMap(null);
    this.polyline.setPath([]);
  }

  alert(title, message) {

  }

  ////
  // Map events
  //
  onLongPressStart(e) {
    this.bgService.playSound('LONG_PRESS_ACTIVATE');
    this.geofenceCursor.setPosition(e.latLng);
    this.geofenceCursor.setMap(this.map);
  }

  onLongPressCancel(e) {
    this.bgService.playSound('LONG_PRESS_CANCEL');
    this.geofenceCursor.setMap(null);
  }

  async onLongPress(e) {
    var latlng = e.latLng;
    this.geofenceCursor.setMap(null);

    const modal = await this.modalController.create({
      component: GeofencePage,
      cssClass: 'my-custom-class',
      animated: true,
      componentProps: {
        bgService: this.bgService,
        'latitude': latlng.lat(),
        'longitude': latlng.lng()
      }
    });
    await modal.present();
  }
}
