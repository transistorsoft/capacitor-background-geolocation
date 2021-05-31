import { Component, OnInit } from '@angular/core';

import {
  ModalController,
  AlertController,
  NavParams
} from '@ionic/angular';

import {BGService} from '../../lib/BGService';

////
// NOTE:  normally you will simply import from "cordova-background-geolocation-lt" or "cordova-background-geolocation"
// This is done only for convenience in the SampleApp for easily switching between public / private version of the plugin
//
import BackgroundGeolocation from "../../../capacitor-background-geolocation";

@Component({
  selector: 'app-geofence',
  templateUrl: './geofence.page.html',
  styleUrls: ['./geofence.page.scss'],
})
export class GeofencePage implements OnInit {

  private bgService: BGService;
  public identifier: string;
  public radius: string;
  private latitude: number;
  private longitude: number;
  public notifyOnEntry: boolean;
  public notifyOnExit: boolean;
  public notifyOnDwell: boolean;
  public loiteringDelay: number;
  public radiusOptions: any;

  constructor(
    private alertCtrl: AlertController,
    private navParams: NavParams,
    private modalCtrl: ModalController) {
    this.bgService = this.navParams.get('bgService');
    this.identifier = '';
    this.radius = '200';
    this.latitude = this.navParams.get('latitude');
    this.longitude = this.navParams.get('longitude');

    this.notifyOnEntry = true;
    this.notifyOnExit = true;
    this.notifyOnDwell = false;

    this.radiusOptions = ['100', '150', '200', '500', '1000', '5000', '10000'];
  }

  ngOnInit() {
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad GeofencePage');
  }

  onClickCancel() {
    this.modalCtrl.dismiss();
  }

  onClickSubmit() {
    let radius = parseInt(this.radius, 10);
    BackgroundGeolocation.addGeofence({
      identifier: this.identifier,
      radius: radius,
      latitude: this.latitude,
      longitude: this.longitude,
      notifyOnEntry: this.notifyOnEntry,
      notifyOnExit: this.notifyOnExit,
      notifyOnDwell: this.notifyOnDwell,
      loiteringDelay: this.loiteringDelay,
      extras: {
        radius: radius,
        center: {latitude: this.latitude, longitude: this.longitude}
      }
    }).then((identifier) => {
      this.bgService.playSound('ADD_GEOFENCE');
      this.modalCtrl.dismiss();
    }).catch((error) => {
      this.alert('Error', error);
    });
  }

  async alert(title, message) {
    const alert = await this.alertCtrl.create({
      header: title,
      message: message,
      buttons: ['Dismiss']
    });
    alert.present();
  }


}
