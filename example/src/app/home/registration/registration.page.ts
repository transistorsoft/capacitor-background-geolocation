import { Component, OnInit } from '@angular/core';
import {
	ModalController,
	NavParams,
	ToastController,
	Platform
} from '@ionic/angular';

import { Storage } from '@capacitor/storage';

import BackgroundGeolocation from "../../capacitor-background-geolocation";

import {ENV} from "../../ENV";

// Only allow alpha-numeric usernames with '-' and '_'
const USERNAME_VALIDATOR =  /^[a-zA-Z0-9_-]*$/;

@Component({
  selector: 'app-registration',
  templateUrl: './registration.page.html',
  styleUrls: ['./registration.page.scss'],
})
export class RegistrationPage implements OnInit {

	orgname: string;
	username: string;
	url: string;
	devicename: string;

  constructor(
  	public modalController: ModalController,
  	public navParams:NavParams,
  	public toastController: ToastController,
  	public platform:Platform) {

  	this.init();
  }

  async init() {
  	let deviceInfo = await BackgroundGeolocation.getDeviceInfo();
  	this.devicename = deviceInfo.manufacturer + ' ' + deviceInfo.model;

  	this.url = ENV.TRACKER_HOST
  }
  ngOnInit() {}

  async onClickRegister() {
  	let errors = [];

    if (!this.isValid(this.orgname)) errors.push('Organization name');
    if (!this.isValid(this.username)) errors.push('Username');

    if (errors.length > 0) {
      let msg = "Invalid " + errors.join(', ');
      const toast = await this.toastController.create({
        message: msg,
        duration: 3000,
        cssClass: 'toast-error',
        position: 'bottom'

      });
      toast.present();

      return false;
    }
    // Destroy existing cached token.
    await BackgroundGeolocation.destroyTransistorAuthorizationToken(ENV.TRACKER_HOST);
    // Register device with tracker.transistorsoft.com to receive a JSON Web Token (JWT).
    let token = await BackgroundGeolocation.findOrCreateTransistorAuthorizationToken(this.orgname, this.username, ENV.TRACKER_HOST);

    await BackgroundGeolocation.setConfig({
      transistorAuthorizationToken: token
    });

    await Storage.set({key: 'orgname', value: this.orgname});
    await Storage.set({key: 'username', value: this.username});

    this.modalController.dismiss({
    	orgname: this.orgname,
    	username: this.username
    });
  }

  private isValid(name) {
    if (!name || (name.length == 0)) return false;
    name = name.replace(/s+/, '');
    return USERNAME_VALIDATOR.test(name);
  }

  onClickCancel() {
  	this.modalController.dismiss();
  }
}
