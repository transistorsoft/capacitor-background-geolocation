
import {
  PluginResultError,
  Plugins
} from '@capacitor/core';

const NativeModule:any = Plugins.BackgroundGeolocation;

const DEFAULT_URL:string  = 'http://tracker.transistorsoft.com';

const DUMMY_TOKEN:string 	= 'DUMMY_TOKEN';

const REFRESH_PAYLOAD:any = {
	refresh_token: '{refreshToken}'
}

const LOCATIONS_PATH:string = '/api/locations';

const REFRESH_TOKEN_PATH:string = '/api/refresh_token';

export default class TransistorAuthorizationToken {
	static findOrCreate(orgname:string, username:string, url:string=DEFAULT_URL) {

		return new Promise((resolve:Function, reject:Function) => {
			NativeModule.getTransistorToken({
				org: orgname,
				username: username,
				url: url
			}).then((result:any) => {
				if (result.success) {
					const token = result.token;
					token.url = url;
					resolve(token);
				} else {
					console.warn('[TransistorAuthorizationToken findOrCreate] ERROR: ', result);
					if (result.status == '403') {
						reject(result);
						return;
					}
					resolve({
						accessToken: DUMMY_TOKEN,
						refreshToken: DUMMY_TOKEN,
						expires: -1,
						url:url
					});
				}
			}).catch((error:PluginResultError) => {
				reject(error);
			});
		});
	}

  static destroy(url:string=DEFAULT_URL) {
  	return new Promise((resolve:Function, reject:Function) => {
			NativeModule.destroyTransistorToken({url: url}).then(() => {
				resolve();
			}).catch((error:PluginResultError) => {
				reject(error.message);
			});
		});
  }

  static applyIf(config:any) {
  	if (!config.transistorAuthorizationToken) return config;

  	const token = config.transistorAuthorizationToken;
  	delete config.transistorAuthorizationToken;

  	config.url = token.url + LOCATIONS_PATH;
  	config.authorization = {
  		strategy: 'JWT',
  		accessToken: token.accessToken,
  		refreshToken: token.refreshToken,
  		refreshUrl: token.url + REFRESH_TOKEN_PATH,
  		refreshPayload: REFRESH_PAYLOAD,
  		expires: token.expires
  	}
  	return config;
  }
}