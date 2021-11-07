import { Component } from '@angular/core';
import { Router, NavigationStart, Event as NavigationEvent } from '@angular/router';
import {
  ModalController,
  AlertController,
  Platform,
  isPlatform
} from '@ionic/angular';

import { Storage } from '@capacitor/storage';

import { RegistrationPage } from './registration/registration.page';

import BackgroundGeolocation, {
  TransistorAuthorizationToken,
  DeviceInfo
} from "../capacitor-background-geolocation"

import {environment} from "../../environments/environment";

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
    this.router.events.subscribe(this.onRouterNavigate.bind(this));
  }

  ngAfterContentInit() {
    this.init();
  }

  /// Stop BackgroundGeolocation and remove all listeners when we navigation back to Home.
  async onRouterNavigate(event:NavigationEvent) {
    if (event instanceof NavigationStart) {
      if (event.url === '/home') {
        await BackgroundGeolocation.removeListeners();
        await BackgroundGeolocation.stop();
      }
    }
  }

  async init() {
    // When we return to Home page, stop the plugin and remove all listeners.
    await BackgroundGeolocation.stop();
    await BackgroundGeolocation.removeListeners();

    registerTransistorAuthorizationListener(this.router);

    this.orgname = (await Storage.get({key: 'orgname'})).value;
    this.username = (await Storage.get({key: 'username'})).value;

    this.url = environment.TRACKER_HOST;
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

  async onClickNavigate(app) {
    // Sanity check.
    if (!this.isValid(this.orgname) || !this.isValid(this.username)) {
      return this.onClickRegister();
    }
    if (await this.willDiscloseBackgroundPermission(app)) {
      return;
    }

    // Persist the selected page.
    await Storage.set({key: 'page', value: app});

    this.router.navigate(['/' + app]);
  }

  private isValid(name) {
    if (!name || (name.length == 0)) return false;
    name = name.replace(/s+/, '');
    return USERNAME_VALIDATOR.test(name);
  }

  /// New Google Play Console requirements for BACKGROUND_LOCATION permission require a one-time
  /// "disclosure for background location access", just a simple Alert with only an [OK] button where
  /// you declare something "this app tracks your location in the background for these reasons X, Y and Z".
  ///
  /// See Transistor Blog for more information:
  ///   https://transistorsoft.medium.com/new-google-play-console-guidelines-for-sensitive-app-permissions-d9d2f4911353
  ///
  private willDiscloseBackgroundPermission(page:string):Promise<boolean> {
    return new Promise(async (resolve, reject) => {
      if (!isPlatform('android')) {
        // Will disclose for iOS devices?  NO!
        return resolve(false);
      }
      const hasDisclosedBackgroundPermission = (await Storage.get({key: 'hasDisclosedBackgroundPermission'})).value === 'true';
      resolve(!hasDisclosedBackgroundPermission);
      // If we've already disclosed, we're done here.
      if (hasDisclosedBackgroundPermission) { return; }
      // Show the one-time disclosure Alert
      this.alertCtrl.create({
        header: 'Background Location Access',
        message: 'BG Geo collects location data to enable tracking your trips to work and calculate distance travelled even when the app is closed or not in use.\n\nThis data will be uploaded to tracker.transistorsoft.com where you may view and/or delete your location history.',
        buttons: [{
          text: 'Close',
          handler: (e) => {
            // Now set a flag that we've disclosed to the user so this alert never gets shown again.
            Storage.set({key: 'hasDisclosedBackgroundPermission', value: 'true'});
            // And continue along with routing to the desired Page...
            this.onClickNavigate(page);
          }
        }],
        backdropDismiss: false,  // <-- Important for Play Console review that this alert is not easily dismissed.
        cssClass: 'background-location-disclosure'
      }).then(async (alert:any) => {
        alert.present();
      });
    });
  }

  /*
  private async willDiscloseBackgroundPermission(routeName):Promise<boolean> {
    const hasDisclosedBackgroundPermission = (await Storage.get({key: 'hasDisclosedBackgroundPermission'})).value;

    if (!hasDisclosedBackgroundPermission) {
      this.alertCtrl.create({
        cssClass: 'my-custom-class',
        header: 'Background Location Access',
        subHeader: 'Subtitle',
        message: 'BG Geo collects location data to enable tracking your trips to work and calculate distance travelled even when the app is closed or not in use.\n\nThis data will be uploaded to tracker.transistorsoft.com where you may view and/or delete your location history.',
        buttons: ['Close']
      }).then(async (alert:any) => {
        alert.present();
        alert.onDidDismiss().then(async () => {
          await Storage.set({key: 'hasDisclosedBackgroundPermission', value: 'true'});
          this.onClickNavigate(routeName);
        });
      });
    }
    return !hasDisclosedBackgroundPermission;
  }
  */

}
