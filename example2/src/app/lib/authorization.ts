import { Router} from '@angular/router';

import BackgroundGeolocation, {
  HttpEvent,
  TransistorAuthorizationToken
} from "../capacitor-background-geolocation";

import {ENV} from "../ENV";

let onHttp:any;

export async function registerTransistor():Promise<TransistorAuthorizationToken> {
  let localStorage = (<any>window).localStorage;
  let orgname = localStorage.getItem('orgname');
  let username = localStorage.getItem('username');
  if (orgname == null || username == null) {
  	this.navCtrl.setRoot('HomePage');
  	return {
      accessToken: "DUMMY_TOKEN",
      refreshToken: "DUMMY_TOKEN",
      expires: -1,
      url: ''
    };
  }
  let token:TransistorAuthorizationToken = await BackgroundGeolocation.findOrCreateTransistorAuthorizationToken(orgname, username, ENV.TRACKER_HOST);

  await BackgroundGeolocation.setConfig({
    transistorAuthorizationToken: token
  });
  return token;
}

export async function registerTransistorAuthorizationListener(router:Router) {
	if (typeof(onHttp) === 'function') {
		await BackgroundGeolocation.removeListener('http', onHttp);
  }
  onHttp = async function onHttp(event:HttpEvent) {
    console.log('[Authorization onHttp]');
    switch(event.status) {
      case 403:
      case 406:
        await BackgroundGeolocation.destroyTransistorAuthorizationToken(ENV.TRACKER_HOST);
        let token = await registerTransistor();
        if (token.accessToken !== 'DUMMY_TOKEN') {
          await BackgroundGeolocation.setConfig({
            transistorAuthorizationToken: token
          });
          BackgroundGeolocation.sync();
        }
        break;
      case 410:
        let localStorage = (<any>window).localStorage;
        localStorage.removeItem('username');
        router.navigate(['/home']);
        break;
    }
  };

	BackgroundGeolocation.onHttp(onHttp);
}