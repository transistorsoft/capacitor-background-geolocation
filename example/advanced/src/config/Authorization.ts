import { Preferences } from '@capacitor/preferences';

import BackgroundGeolocation, {
  TransistorAuthorizationToken,
  HttpEvent
} from "@transistorsoft/capacitor-background-geolocation";

import { ENV } from "./ENV";

let onHttpSubscription: any = null;

/**
 * If the app registers for a TransistorAuthorizationToken while disconnected from network,
 * the app configures an accessToken: "DUMMY_TOKEN".
 * When the server receives a DUMMY_TOKEN, it will return an HTTP status "406 Unacceptable".
 * This is the signal to re-register for a token.
 */
async function register(onReregistered?: () => void): Promise<TransistorAuthorizationToken> {
  console.log('[TransistorAuth] this device requires registration');
  await BackgroundGeolocation.destroyTransistorAuthorizationToken(ENV.TRACKER_HOST);

  const { value: org }      = await Preferences.get({ key: '@transistor_org' });
  const { value: username } = await Preferences.get({ key: '@transistor_username' });

  if (org == null || username == null) {
    return {
      accessToken: "DUMMY_TOKEN",
      refreshToken: "DUMMY_TOKEN",
      expires: -1,
      url: ''
    };
  }

  const token: TransistorAuthorizationToken =
    await BackgroundGeolocation.findOrCreateTransistorAuthorizationToken(org, username, ENV.TRACKER_HOST);

  await BackgroundGeolocation.setConfig({
    transistorAuthorizationToken: token
  });
  if (onReregistered) onReregistered();
  return token;
}

/**
 * Global BackgroundGeolocation onHttp listener for handling edge-cases related to TransistorAuthorizationToken.
 * @param onGoHome  Called when the device token has been destroyed server-side (HTTP 410).
 */
export async function registerTransistorAuthorizationListener(onGoHome?: () => void) {
  console.log('[Authorization registerTransistorAuthorizationListener]');
  if (onHttpSubscription !== null) {
    onHttpSubscription.remove();
  }
  onHttpSubscription = BackgroundGeolocation.onHttp(async (event: HttpEvent) => {
    switch (event.status) {
      case 403:
      case 406: {
        await BackgroundGeolocation.destroyTransistorAuthorizationToken(ENV.TRACKER_HOST);
        const token = await register();
        if (token.accessToken !== 'DUMMY_TOKEN') {
          BackgroundGeolocation.sync();
        }
        break;
      }
      case 410:
        if (onGoHome) onGoHome();
        break;
    }
  });
}
