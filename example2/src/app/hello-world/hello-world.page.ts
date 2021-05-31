import { Component, OnInit } from '@angular/core';

import { Router} from '@angular/router';

import BackgroundGeolocation, {
  Location,
  HttpEvent,
  MotionActivityEvent,
  ProviderChangeEvent,
  MotionChangeEvent,
  ConnectivityChangeEvent,
  AuthorizationEvent,
  TransistorAuthorizationToken
} from "../capacitor-background-geolocation";

import {ENV} from "../ENV";

@Component({
  selector: 'app-hello-world',
  templateUrl: './hello-world.page.html',
  styleUrls: ['./hello-world.page.scss'],
})
export class HelloWorldPage implements OnInit {

	// UI State
  enabled: boolean;
  isMoving: boolean;

  // ion-list datasource
  events: any;
  constructor(public router:Router) {


  }

  ionViewWillEnter() {
    this.configureBackgroundGeolocation();
  }

  ngOnInit() {
  }

  async configureBackgroundGeolocation() {
    // Compose #url: tracker.transistorsoft.com/locations/{username}
    let localStorage = (<any>window).localStorage;

    let token:TransistorAuthorizationToken = await BackgroundGeolocation.findOrCreateTransistorAuthorizationToken(
      localStorage.getItem('orgname'),
      localStorage.getItem('username'),
      ENV.TRACKER_HOST
    );

    // Step 1:  Listen to events
    BackgroundGeolocation.onLocation(this.onLocation.bind(this));
    BackgroundGeolocation.onMotionChange(this.onMotionChange.bind(this));
    BackgroundGeolocation.onActivityChange(this.onActivityChange.bind(this));
    BackgroundGeolocation.onHttp(this.onHttpSuccess.bind(this));
    BackgroundGeolocation.onProviderChange(this.onProviderChange.bind(this));
    BackgroundGeolocation.onPowerSaveChange(this.onPowerSaveChange.bind(this));
    BackgroundGeolocation.onConnectivityChange(this.onConnectivityChange.bind(this));
    BackgroundGeolocation.onAuthorization(this.onAuthorization.bind(this));

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
    }, (state) => {
      console.log('- Configure success: ', state);
      // Update UI state (toggle switch, changePace button)

      this.isMoving = state.isMoving;
      this.enabled = state.enabled;

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
  * @event location
  */
  onLocation(location:Location) {
    console.log('[event] location: ', location);
    let event = location.event || 'location';

    this.addEvent(event, new Date(location.timestamp), location);

  }
  /**
  * @event motionchange
  */
  onMotionChange(event:MotionChangeEvent) {
    console.log('[event] motionchange, isMoving: ', event.isMoving, ', location: ', event.location);
    this.isMoving = event.isMoving;
  }
  /**
  * @event activitychange
  */
  onActivityChange(event:MotionActivityEvent) {
    console.log('[event] activitychange: ', event);
    this.addEvent('activitychange', new Date(), event);
  }
  /**
  * @event http
  */
  onHttpSuccess(response:HttpEvent) {
    console.log('[event] http: ', response);

    this.addEvent('http', new Date(), response);

  }
  onHttpFailure(response:HttpEvent) {
    console.warn('[event] http failure: ', response);
    this.addEvent('http failure', new Date(), response);

  }
  /**
  * @event providerchange
  */
  onProviderChange(provider:ProviderChangeEvent) {
    console.log('[event] providerchange', provider);
    this.addEvent('providerchange', new Date(), provider);
  }
  /**
  * @event powersavechange
  */
  onPowerSaveChange(isPowerSaveEnabled:boolean) {
    console.log('[event] powersavechange', isPowerSaveEnabled);

    this.addEvent('powersavechange', new Date(), {isPowerSaveEnabled: isPowerSaveEnabled});

  }
  /**
  * @event connectivitychange
  */
  onConnectivityChange(event:ConnectivityChangeEvent) {
    console.log('[event] connectivitychange connected? ', event.connected);
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

    this.events.unshift({
      name: name,
      timestamp: timestamp,
      object: event,
      content: JSON.stringify(event, null, 2)
    });
  }

}
