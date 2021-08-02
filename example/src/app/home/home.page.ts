import { Component } from '@angular/core';
import { Router} from '@angular/router';
import {
  ModalController,
  AlertController,
  Platform
} from '@ionic/angular';

import { RegistrationPage } from './registration/registration.page';

import BackgroundGeolocation, {
  TransistorAuthorizationToken,
  DeviceInfo
} from "../capacitor-background-geolocation"


import {ENV} from "../ENV";

import {registerTransistorAuthorizationListener} from "../lib/authorization";

// Only allow alpha-numeric usernames with '-' and '_'
const USERNAME_VALIDATOR =  /^[a-zA-Z0-9_-]*$/;

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage {
  orgname: string;
  username: string;
  deviceIdentifier: string;
  deviceInfo: DeviceInfo;
  url: string;

  constructor(
    public modalController: ModalController,
    public alertCtrl: AlertController,
    public platform: Platform,
    public router: Router
  ) {

  }

  ngAfterContentInit() {
    this.init();
  }

  async init() {


    // When we return to Home page, stop the plugin and remove all listeners.
    await BackgroundGeolocation.stop();
    await BackgroundGeolocation.removeListeners();
    registerTransistorAuthorizationListener(this.router);

    const localStorage = (<any>window).localStorage;

    this.orgname = localStorage.getItem('orgname');
    this.username = localStorage.getItem('username');

    // Handle install of previous version, where orgname didn't exist and reverse the values, placing username into orgname.
    if (this.isValid(this.username) && this.orgname == null) {
      localStorage.setItem('orgname', this.username);
      localStorage.removeItem('username');
      this.orgname = this.username;
      this.username = null;
    }

    this.url = ENV.TRACKER_HOST;
    if (this.isValid(this.orgname)) {
      this.url += '/' + this.orgname;
    }

    this.deviceInfo = await BackgroundGeolocation.getDeviceInfo();
    let identifier = this.deviceInfo.model;
    if (this.username) {
      identifier += '-' + this.username;
    }
    this.deviceIdentifier = identifier;

    if (!this.isValid(this.orgname) || !this.isValid(this.username)) {
      this.onClickRegister();
    }
  }

  async onClickRegister() {
    const modal = await this.modalController.create({
      component: RegistrationPage,
      cssClass: 'my-custom-class',
      animated: true,
      componentProps: {
        'orgname': this.orgname,
        'username': this.username
      }
    });
    modal.onDidDismiss().then((result:any) => {
      // Update our view-state -- BackgroundGeolocation state may have changed in Settings screen.
      if ((result != null) && result.data) {
        this.orgname = result.data.orgname;
        this.username = result.data.username;
        this.deviceIdentifier = this.deviceInfo.model + '-' + this.username;
      }
    });
    await modal.present();
  }

  async onClickNavigate(value) {
    let localStorage = (<any>window).localStorage;
    let orgname = localStorage.getItem('orgname');
    let username = localStorage.getItem('username');
    // Sanity check.
    if (!this.isValid(orgname) || !this.isValid(username)) {
      return this.onClickRegister();
    }
    if (this.willDiscloseBackgroundPermission(value)) {
      return;
    }

    // Persist the selected page.
    localStorage.setItem('page', value);

    this.router.navigate(['/' + value]);

  }

  async initBackgroundGeolocation() {
    const handler = (location:any) => {
      console.log('*** [location] ', location);
    };
    const onError = (error:any) => {
      console.log('*** [location] ERROR: ', error);
    }
    BackgroundGeolocation.onLocation(handler, onError);

    BackgroundGeolocation.onProviderChange((event:any) => {
      console.log('*** [providerchange]', event);
    });

    BackgroundGeolocation.onMotionChange((event) => {
      console.log('*** [motionchange]', event);
    })

    BackgroundGeolocation.onGeofence((event) => {
      console.log('*** [geofence]', event);
    });

    BackgroundGeolocation.onGeofencesChange((event) => {
      console.log('*** [geofenceschange]', event);
    })

    const token:TransistorAuthorizationToken = await BackgroundGeolocation.findOrCreateTransistorAuthorizationToken("transistor-capacitor", "test");

  	let state = await BackgroundGeolocation.ready({
      desiredAccuracy: BackgroundGeolocation.DESIRED_ACCURACY_HIGH,
      distanceFilter: 50,
      enableHeadless: true,
      stopOnTerminate: false,
      logLevel: BackgroundGeolocation.LOG_LEVEL_VERBOSE,
      debug: true,
      transistorAuthorizationToken: token
    });

    console.log('*** [ready]', state);

    if (!state.enabled) {
      await BackgroundGeolocation.start();
    }

    let providerState = await BackgroundGeolocation.getProviderState();
    console.log('*** [getProviderState]', providerState);

    let status = await BackgroundGeolocation.requestPermission();
    console.log('*** [requestPermission] ', status);

    BackgroundGeolocation.requestTemporaryFullAccuracy('DemoPurpose').then((status:number) => {
      console.log('*** [requestTemporaryFullAccuracy] status: ', status);
    }).catch((error) => {
      console.warn('*** [requestTemporaryFullAccuracy] ERROR: ', error);
    });

    let location:any = await BackgroundGeolocation.getCurrentPosition({
      samples: 3,
      persist: true,
      desiredAccuracy: 1
    });

    await BackgroundGeolocation.addGeofence({
      identifier: 'HOME',
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      radius: 200,
      notifyOnEntry: true,
      notifyOnExit: true
    });
  }

  private isValid(name) {
    if (!name || (name.length == 0)) return false;
    name = name.replace(/s+/, '');
    return USERNAME_VALIDATOR.test(name);
  }

  private willDiscloseBackgroundPermission(routeName):boolean {
    let localStorage = (<any>window).localStorage;
    let hasDisclosedBackgroundPermission = (localStorage.getItem('hasDisclosedBackgroundPermission') !== null);

    if (!hasDisclosedBackgroundPermission) {
      this.alertCtrl.create({
        cssClass: 'my-custom-class',
        header: 'Background Location Access',
        subHeader: 'Subtitle',
        message: 'BG Geo collects location data to enable tracking your trips to work and calculate distance travelled even when the app is closed or not in use.\n\nThis data will be uploaded to tracker.transistorsoft.com where you may view and/or delete your location history.',
        buttons: ['Close']
      }).then((alert:any) => {
        alert.present();
        alert.onDidDismiss().then(() => {
          localStorage.setItem('hasDisclosedBackgroundPermission', true);
          this.onClickNavigate(routeName);
        });
      });
    }
    return !hasDisclosedBackgroundPermission;
  }

}
