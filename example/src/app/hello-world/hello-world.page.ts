import {
  Component,
  OnInit,
  OnDestroy,
  NgZone,

} from '@angular/core';

import { Router } from '@angular/router';

import { Storage } from '@capacitor/storage';

import BackgroundGeolocation, {
  Location,
  HttpEvent,
  GeofenceEvent,
  MotionActivityEvent,
  ProviderChangeEvent,
  MotionChangeEvent,
  ConnectivityChangeEvent,
  AuthorizationEvent,
  TransistorAuthorizationToken,
  Subscription
} from "../capacitor-background-geolocation";

import {ENV} from "../ENV";

@Component({
  selector: 'app-hello-world',
  templateUrl: './hello-world.page.html',
  styleUrls: ['./hello-world.page.scss'],
})
export class HelloWorldPage implements OnInit, OnDestroy {

	// UI State
  enabled: boolean;
  isMoving: boolean;

  // ion-list datasource
  events: any;

  subscriptions: any;

  constructor(public router:Router, private zone:NgZone) {
    this.events = [];
    this.subscriptions = [];

  }

  subscribe(subscription:Subscription) {
    this.subscriptions.push(subscription);
  }

  unsubscribe() {
    this.subscriptions.forEach((subscription) => subscription.remove() );
    this.subscriptions = [];
  }

  ngAfterContentInit() {
    this.configureBackgroundGeolocation();
    // [NOTE] For development with live-reload:  remove event-listeners each time we refresh with live-reload.
    window.onbeforeunload = () => this.ngOnDestroy();
  }

  ngOnInit() {
  }

  ngOnDestroy() {
    this.unsubscribe();
  }

  async configureBackgroundGeolocation() {
    // Listen to BackgroundGeolocation events.
    this.subscribe(BackgroundGeolocation.onEnabledChange(this.onEnabledChange.bind(this)));
    this.subscribe(BackgroundGeolocation.onLocation(this.onLocation.bind(this)));
    this.subscribe(BackgroundGeolocation.onMotionChange(this.onMotionChange.bind(this)));
    this.subscribe(BackgroundGeolocation.onGeofence(this.onGeofence.bind(this)));
    this.subscribe(BackgroundGeolocation.onActivityChange(this.onActivityChange.bind(this)));
    this.subscribe(BackgroundGeolocation.onHttp(this.onHttp.bind(this)));
    this.subscribe(BackgroundGeolocation.onProviderChange(this.onProviderChange.bind(this)));
    this.subscribe(BackgroundGeolocation.onPowerSaveChange(this.onPowerSaveChange.bind(this)));
    this.subscribe(BackgroundGeolocation.onConnectivityChange(this.onConnectivityChange.bind(this)));
    this.subscribe(BackgroundGeolocation.onAuthorization(this.onAuthorization.bind(this)));

    // Compose #url: tracker.transistorsoft.com/locations/{username}
    const orgname = (await Storage.get({key: 'orgname'})).value;
    const username = (await Storage.get({key: 'username'})).value;


    const token:TransistorAuthorizationToken = await BackgroundGeolocation.findOrCreateTransistorAuthorizationToken(
      orgname,
      username,
      ENV.TRACKER_HOST
    );

    // Step 1:  Listen to events


    // Step 2:  Configure the plugin
    BackgroundGeolocation.ready({
      reset: true,
      debug: true,
      logLevel: BackgroundGeolocation.LOG_LEVEL_VERBOSE,
      distanceFilter: 10,
      stopTimeout: 1,
      stopOnTerminate: false,
      startOnBoot: true,
      url: ENV.TRACKER_HOST + '/api/locations',
      // [Android] backgroundPermissionRationale for Always permission.
      backgroundPermissionRationale: {
        title: "Allow {applicationName} to access this device's location even when closed or not in use.",
        message: "This app collects location data to enable recording your trips to work and calculate distance-travelled.",
        positiveAction: 'Change to "{backgroundPermissionOptionLabel}"',
        negativeAction: 'Cancel'
      },
      authorization: {  // <-- JWT authorization for tracker.transistorsoft.com
        strategy: 'jwt',
        accessToken: token.accessToken,
        refreshToken: token.refreshToken,
        refreshUrl: ENV.TRACKER_HOST + '/api/refresh_token',
        refreshPayload: {
          refresh_token: '{refreshToken}'
        },
        expires: token.expires
      },
      autoSync: true
    }).then((state) => {
      // Update UI state (toggle switch, changePace button)
      this.addEvent('State', new Date(), state);
      this.zone.run(() => {
        this.isMoving = state.isMoving;
        this.enabled = state.enabled;
      });
    });
  }
  // Return to Home screen (app switcher)
  onClickHome() {
    //this.navCtrl.setRoot('HomePage');
    this.router.navigate(['/home']);
  }

  // #start / #stop tracking
  onToggleEnabled() {
    if (this.enabled) {
      BackgroundGeolocation.start();
    } else {
      BackgroundGeolocation.stop();
    }
  }

  // Fetch the current position
  onClickGetCurrentPosition() {
    BackgroundGeolocation.getCurrentPosition({persist: true}, (location) => {
      console.log('- getCurrentPosition: ', location);
    }, (error) => {
      console.warn('- Location error: ', error);
    });
  }

  // Change plugin state between stationary / tracking
  onClickChangePace() {
    this.isMoving = !this.isMoving;
    BackgroundGeolocation.changePace(this.isMoving);
  }

  // Clear the list of events from ion-list
  onClickClear() {
    this.events = [];
  }

  /**
  * @event enabledchange
  */
  onEnabledChange(enabled:boolean) {
    this.isMoving = false;
    this.addEvent('onEnabledChange', new Date(), {enabled: enabled});
  }
  /**
  * @event location
  */
  onLocation(location:Location) {
    console.log('[event] location: ', location);
    this.addEvent('onLocation', new Date(location.timestamp), location);

  }
  /**
  * @event motionchange
  */
  onMotionChange(event:MotionChangeEvent) {
    console.log('[event] motionchange, isMoving: ', event.isMoving, ', location: ', event.location);
    this.addEvent('onMotionChange', new Date(event.location.timestamp), event);
    this.isMoving = event.isMoving;
  }
  /**
  * @event activitychange
  */
  onActivityChange(event:MotionActivityEvent) {
    console.log('[event] activitychange: ', event);
    this.addEvent('onActivityChange', new Date(), event);
  }
  onGeofence(event:GeofenceEvent) {
    console.log('[event] geofence: ', event);
    this.addEvent('onGeofence', new Date(event.location.timestamp), event);
  }
  /**
  * @event http
  */
  onHttp(response:HttpEvent) {
    console.log('[event] http: ', response);
    this.addEvent('onHttp', new Date(), response);
  }
  /**
  * @event providerchange
  */
  onProviderChange(provider:ProviderChangeEvent) {
    console.log('[event] providerchange', provider);
    this.addEvent('onProviderChange', new Date(), provider);
  }
  /**
  * @event powersavechange
  */
  onPowerSaveChange(isPowerSaveEnabled:boolean) {
    console.log('[event] powersavechange', isPowerSaveEnabled);
    this.addEvent('onPowerSaveChange', new Date(), {isPowerSaveEnabled: isPowerSaveEnabled});
  }
  /**
  * @event connectivitychange
  */
  onConnectivityChange(event:ConnectivityChangeEvent) {
    console.log('[event] connectivitychange connected? ', event.connected);
    this.addEvent('onConnectivityChange', new Date(), event);
  }
  /**
  * @event authorization
  */
  onAuthorization(event:AuthorizationEvent) {
    console.log('[event] authorization: ', event);
  }
  /**
  * Add a record to ion-list
  * @param {String} event name
  * @param {Date} date
  * @param {Object} event object, eg: {location}, {provider}, {activity}
  */
  private addEvent(name, date, event) {
    let timestamp = date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
    this.zone.run(() => {
      this.events.push({
        name: name,
        timestamp: timestamp,
        object: event,
        content: JSON.stringify(event, null, 2)
      });
    })

  }

}
