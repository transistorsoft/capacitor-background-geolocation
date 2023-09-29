import { Component, OnInit } from '@angular/core';

import {
  NavParams,
  AlertController,
  ModalController,
  LoadingController
} from "@ionic/angular";

import { Preferences } from '@capacitor/preferences';

import BackgroundGeolocation, {
  Geofence,
  DeviceSettingsRequest
} from "../../../capacitor-background-geolocation";

import {AboutPage} from "../about/about.page";

const TRACKING_MODE_OPTIONS = [
  'location',
  'geofence'
];
const LOG_LEVEL_OPTIONS = ['OFF', 'ERROR', 'WARNING', 'INFO', 'DEBUG', 'VERBOSE'];
const NOTIFICATION_PRIORITY_OPTIONS = ['DEFAULT', 'HIGH', 'LOW', 'MAX', 'MIN'];

@Component({
  selector: 'app-settings',
  templateUrl: './settings.page.html',
  styleUrls: ['./settings.page.scss'],
})
export class SettingsPage implements OnInit {
	settingsService: any;
  bgService: any;
  isLoaded: boolean;
  loader: any;
  storage: any;
  alert: any;
  state: any;
  basicTab: any;
  listTab: any;
  selectedSegment: string;
  trackingModeOptions: any;
  desiredAccuracyOptions: any;
  distanceFilterOptions: any;
  autoSyncThresholdOptions: any;
  geofenceProximityRadiusOptions: any;
  heartbeatIntervalOptions: any;
  logLevelOptions: any;
  logMaxDaysOptions: any;
  notificationPriorityOptions: any;
  settings: any;
  //geofenceOptions: any;
  //mapOptions: any;
  email: string;
  isSyncing: boolean;
  isEmailingLog: boolean;
  isDestroyingLog: boolean;
  isAddingGeofences: boolean;
  isResettingOdometer: boolean;

  bgGeoState: any;

  constructor(
  	private navParams: NavParams,
    private alertCtrl: AlertController,
    private modalCtrl: ModalController,
    private loadingCtrl: LoadingController) {

  	this.state = {};
  	this.init();
  }

  ngOnInit() {
  }

  compareWith(v1: any, v2: any) {
  	const typeOfV1 = typeof(v1);
  	const typeOfV2 = typeof(v2);

  	if (typeOfV1 === typeOfV2) {
  		return  v1 === v2;
  	} else if ((typeOfV1 === 'string') && (typeOfV2 === 'number')) {
  		return (v1 === (new String(v2)).toString());
		} else {
			return (v1 === v2);
		}
  }

  async init() {

  	// Load email address for email log
    const email = (await Preferences.get({key: 'settings:email'})).value;
    if (email) {
      this.email = email;
    }

  	this.bgService = this.navParams.get('bgService');
    this.settingsService = this.navParams.get('settingsService');

    this.isLoaded = false;

    this.loader = await this.loadingCtrl.create({
      cssClass: 'my-custom-class',
      message: 'Loading...'
    });
    this.loader.present();

    // We do a BackgroundGeolocation#getState each time Settings screen is shown.
    this.trackingModeOptions = TRACKING_MODE_OPTIONS;
    this.logLevelOptions = LOG_LEVEL_OPTIONS;
    this.notificationPriorityOptions = NOTIFICATION_PRIORITY_OPTIONS;

    this.isSyncing = false;
    this.isAddingGeofences = false;
    this.isResettingOdometer = false;
    this.isDestroyingLog = false;

    let settings = this.bgService.getSettings();

    this.bgGeoState = await BackgroundGeolocation.getState();

    settings.forEach((setting) => {
      this.state[setting.name] = '' + this.bgGeoState[setting.name];
    });
    this.state.trackingMode = (this.bgGeoState.trackingMode) ? 'location' : 'geofence';
    this.state.logLevel = this.decodeLogLevel(this.bgGeoState.logLevel);
    this.state.notificationPriority = this.decodeNotficationPriority(this.bgGeoState.notificationPriority);
    if (this.state.triggerActivities) {
      this.state.triggerActivities = this.decodeTriggerActivities(this.state.triggerActivities);
    }
    // Hide the Loading...
    this.isLoaded = true;
    this.loader.dismiss();
  }

  ionViewDidLoad() {

  }
  ionViewWillEnter() {
    if (!this.isLoaded) {

    	// TODO?
      //this.loader.present();
    }
  }

  onClickClose() {
    this.modalCtrl.dismiss();

  }

  async onClickAbout() {
  	const modal = await this.modalCtrl.create({
      component: AboutPage,
      cssClass: 'my-custom-class',
      animated: true,
      componentProps: {
        bgService: this.bgService
      }
    });
    await modal.present();

  	/*
    this.modalCtrl.create('AboutPage', {
      bgService: this.bgService,
    }).present();
    */
  }

  onChangeValue(name) {
    let value = this.state[name];
    let currentValue = this.bgGeoState[name];
    const setting = this.bgService.getSetting(name);

    if (typeof(value) !== 'undefined') {
      switch (name) {
        case 'logLevel':
          value = this.encodeLogLevel(value);
          break;
        case 'notificationPriority':
          value = this.encodeNotficationPriority(value);
          break;
        case 'trackingMode':
        	if (value === 'location') {
        		if (currentValue === 1) {
        			return;
        		}
        	} else if (currentValue === 0) {
        		return;
        	}
        	this.setTrackingMode(value);
        	return;
          break;
        case 'triggerActivities':
          value = this.encodeTriggerActivities(value);
          break;
      }

      if (typeof(currentValue) === 'undefined') {
	    	return;
	    }
	    if (typeof(currentValue) === 'number') {
	    	value = parseInt(value, 10);
	    }
      if (value === currentValue) {
      	return;
      }

      console.log('***** onChangeValue', name, value, currentValue);

      switch (name) {
      	case 'trackingMode':
      		this.setTrackingMode(value);
      		return;
      		break;
      	case 'geofenceProximityRadius':
      		this.bgService.playSound('ADD_GEOFENCE');
      		break;
      }
      this.bgService.set(name, value);
    }
  }

  setTrackingMode(mode) {
    this.state.trackingMode = mode;
    if (mode === 'location') {
      BackgroundGeolocation.start();
    } else {
      BackgroundGeolocation.startGeofences();
    }
  }

  onClickResetOdometer() {
    this.bgService.playSound('BUTTON_CLICK');

    this.isResettingOdometer = true;

    const onComplete = () => {
      this.isResettingOdometer = false;
    }
    BackgroundGeolocation.resetOdometer().then((location) => {
      onComplete.call(this);
    }).catch((error) => {
      onComplete.call(this);
      this.notify('Reset odometer error', error);
    });
  }

  onUpdateUrl() {
    this.onChangeValue('url');
  }

  onClickSync() {
    this.bgService.playSound('BUTTON_CLICK');
    this.isSyncing = true;

    const onComplete = () => {
      this.isSyncing = false;
    };

    BackgroundGeolocation.sync().then((rs) => {
      this.bgService.playSound('MESSAGE_SENT');
      onComplete.call(this);
    }).catch((error) => {
      onComplete.call(this);
      this.bgService.playSound('ERROR');
      this.notify('Sync error', error);
    });
  }

  onUpdateEmail() {
    this.bgService.playSound('BUTTON_CLICK');
    Preferences.set({key: 'settings:email', value: this.email});
  }

  onClickEmailLog() {
    this.bgService.playSound('BUTTON_CLICK');

    if (!this.email) {
      this.notify('Email logs', 'Please enter an email address');
      return;
    }

    this.isEmailingLog = true;

    const onComplete = () => {
      this.isEmailingLog = false;
    }

    BackgroundGeolocation.logger.emailLog(this.email).then(() => {
      onComplete.call(this);
    }).catch((error) => {
      onComplete.call(this);
      this.notify('Email error', error);
    });
  }

  onClickDestroyLog() {
    this.settingsService.confirm('Confirm Destroy', 'Destroy Logs?', () => {
      this.isDestroyingLog = true;
      BackgroundGeolocation.logger.destroyLog().then((success) => {
        this.isDestroyingLog = false;
        this.bgService.playSound('MESSAGE_SENT');
        this.settingsService.toast('Destroyed logs');
      });
    });
  }

  onClickRemoveGeofences() {
    this.bgService.playSound('BUTTON_CLICK');

    BackgroundGeolocation.removeGeofences().then(() => {
      this.bgService.playSound('MESSAGE_SENT');
    }).catch((error) => {
      this.bgService.playSound('ERROR');
      this.notify('Remove geofences error', error);
    });
  }

  onClickLoadGeofences() {
    this.bgService.playSound('BUTTON_CLICK');
    this.isAddingGeofences = true;

    let data      = this.bgService.getCityDriveData();
    let geofences:Array<Geofence> = []

    let applicationState = this.settingsService.getApplicationState();

    for (let n=0,len=data.length;n<len;n++) {
      let latlng = data[n];
      geofences.push({
        identifier: 'city_drive_' + (n+1),
        latitude: parseFloat(latlng.lat),
        longitude: parseFloat(latlng.lng),
        radius: applicationState.geofenceRadius,
        notifyOnEntry: applicationState.geofenceNotifyOnEntry,
        notifyOnExit: applicationState.geofenceNotifyOnExit,
        notifyOnDwell: applicationState.geofenceNotifyOnDwell,
        loiteringDelay: applicationState.geofenceLoiteringDelay,
        extras: {'geofence_extra': 'foo'}
      });
    }

    const onComplete = () => {
      this.isAddingGeofences = false;
    };


    BackgroundGeolocation.addGeofences(geofences).then(() => {
      onComplete.call(this);
      this.bgService.playSound('ADD_GEOFENCE');
    }).catch((error) => {
      onComplete.call(this);
      this.bgService.playSound('ERROR');
      this.notify('Add geofences error', error);
    });
  }

  async onClickIgnoreBatteryOptimizations() {
    let isIgnoring = await BackgroundGeolocation.deviceSettings.isIgnoringBatteryOptimizations();
    BackgroundGeolocation.deviceSettings.showIgnoreBatteryOptimizations().then((request:DeviceSettingsRequest) => {
      let message = [
        `isIgnoring: ${isIgnoring}`,
        `Device: ${request.manufacturer} ${request.model} @ ${request.version}`,
        `Seen? ${request.seen} on ${request.lastSeenAt}`
      ];
      this.settingsService.confirm('Battery Optimizations', message.join("<br />"), () => {
        BackgroundGeolocation.deviceSettings.show(request);
      });
    }).catch((error:string) => {
      console.warn('[ignoreBatteryOptimizations]', error);
      this.notify('Notice', error);
    });
  }

  onClickPowerManager() {
    BackgroundGeolocation.deviceSettings.showPowerManager().then((request:DeviceSettingsRequest) => {
      let message = [
        `Device: ${request.manufacturer} ${request.model} @ ${request.version}`,
        `Seen? ${request.seen} on ${request.lastSeenAt}`
      ];
      this.settingsService.confirm('Power Manager', message.join("<br />"), () => {
        BackgroundGeolocation.deviceSettings.show(request);
      });
    }).catch((error:string) => {
      console.warn('[showPowerManager]', error);
      this.notify('Notice', error);
    });
  }

  async notify(title, message) {
    const alert = await this.alertCtrl.create({
    	cssClass: 'my-custom-class',
      header: title,
      subHeader: message,
      buttons: ['Dismiss']
    });
    alert.present();
  }

  decodeNotficationPriority(value) {
    switch(value) {
      case 0:
        value = 'DEFAULT';
        break;
      case 1:
        value = 'HIGH';
        break;
      case -1:
        value = 'LOW';
        break;
      case 2:
        value = 'MAX';
        break;
      case -2:
        value = 'MIN';
        break;
      default:
        value = 0;
    }
    return value;
  }

  encodeNotficationPriority(value) {
    switch(value) {
      case 'DEFAULT':
        value = 0;
        break;
      case 'HIGH':
        value = 1;
        break;
      case 'LOW':
        value = -1;
        break;
      case 'MAX':
        value = 2;
        break;
      case 'MIN':
        value = -2;
        break;
    }
    return value;
  }

  decodeLogLevel(value) {
    switch(value) {
      case 0:
        value = 'OFF';
        break;
      case 1:
        value = 'ERROR';
        break;
      case 2:
        value = 'WARNING';
        break;
      case 3:
        value = 'INFO';
        break;
      case 4:
        value = 'DEBUG';
        break;
      case 5:
        value = 'VERBOSE';
        break;
    }
    return value;
  }
  encodeLogLevel(value) {
    switch(value) {
      case 'OFF':
        value = 0;
        break;
      case 'ERROR':
        value = 1;
        break;
      case 'WARNING':
        value = 2;
        break;
      case 'INFO':
        value = 3;
        break;
      case 'DEBUG':
        value = 4;
        break;
      case 'VERBOSE':
        value = 5;
        break;
      default:
        value = 5;
    }
    return value;
  }
  decodeTriggerActivities(value) {
    return value.split(',');
  }
  encodeTriggerActivities(value) {
    return value.join(',');
  }
}
