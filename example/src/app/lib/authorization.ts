import { Router} from '@angular/router';

import { Storage } from '@capacitor/storage';

import BackgroundGeolocation, {
  HttpEvent,
  TransistorAuthorizationToken,
  Subscription
} from "../capacitor-background-geolocation";

import {ENV} from "../ENV";

/// Keep a reference to onHttp subscription.
let onHttpSubscription:Subscription;

export async function registerTransistor():Promise<TransistorAuthorizationToken> {
  const orgname = (await Storage.get({key: 'orgname'})).value;
  const username = (await Storage.get({key: 'username'})).value;
  if (orgname == null || username == null) {
  	//this.navCtrl.setRoot('HomePage');
  	return {
      accessToken: "DUMMY_TOKEN",
      refreshToken: "DUMMY_TOKEN",
      expires: -1,
      url: ''
    };
  }
  const token:TransistorAuthorizationToken = await BackgroundGeolocation.findOrCreateTransistorAuthorizationToken(orgname, username, ENV.TRACKER_HOST);

  await BackgroundGeolocation.setConfig({
    transistorAuthorizationToken: token
  });
  return token;
}

export async function registerTransistorAuthorizationListener(router:Router) {
	if (onHttpSubscription) {
		onHttpSubscription.remove();
  }

	onHttpSubscription = BackgroundGeolocation.onHttp(async (event:HttpEvent) =>{
    console.log('[Authorization onHttp]');
    switch(event.status) {
      case 403:
      case 406:
        await BackgroundGeolocation.destroyTransistorAuthorizationToken(ENV.TRACKER_HOST);
        const token = await registerTransistor();
        if (token.accessToken !== 'DUMMY_TOKEN') {
          await BackgroundGeolocation.setConfig({
            transistorAuthorizationToken: token
          });
          BackgroundGeolocation.sync();
        }
        break;
      case 410:
        await Storage.remove({key: 'username'});
        router.navigate(['/home']);
        break;
    }
  });
}