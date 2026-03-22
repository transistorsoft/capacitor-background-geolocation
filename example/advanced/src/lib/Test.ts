'use strict';

import { Preferences } from '@capacitor/preferences';
import BackgroundGeolocation, { Geofence } from '@transistorsoft/capacitor-background-geolocation';
import { ENV } from '../config/ENV';

let geofenceNextId = 0;

const FREEWAY_DRIVE_DATA = [{"lat":37.33527476,"lng":-122.03254703},{"lat":37.33500926,"lng":-122.03272188},{"lat":37.33467638,"lng":-122.03432425},{"lat":37.33453849,"lng":-122.03695223},{"lat":37.33447068,"lng":-122.04007348},{"lat":37.33446146,"lng":-122.04380955},{"lat":37.33426985,"lng":-122.04751058},{"lat":37.33352458,"lng":-122.05100549},{"lat":37.33275353,"lng":-122.05462472},{"lat":37.33228724,"lng":-122.05833354},{"lat":37.33307736,"lng":-122.06203541},{"lat":37.33422447,"lng":-122.06562781},{"lat":37.33435661,"lng":-122.06939204},{"lat":37.33369775,"lng":-122.07309474},{"lat":37.33368006,"lng":-122.07665613},{"lat":37.33492184,"lng":-122.07997503},{"lat":37.3370055,"lng":-122.0827595},{"lat":37.33879885,"lng":-122.08577472},{"lat":37.34046597,"lng":-122.08886286},{"lat":37.34208941,"lng":-122.09195687},{"lat":37.34415677,"lng":-122.09439031},{"lat":37.34576798,"lng":-122.09727888},{"lat":37.34719244,"lng":-122.1006624},{"lat":37.34894824,"lng":-122.1036539},{"lat":37.35145376,"lng":-122.10569934},{"lat":37.35357644,"lng":-122.10818206},{"lat":37.35478615,"lng":-122.11144128},{"lat":37.35583234,"lng":-122.11484701},{"lat":37.35772158,"lng":-122.11764607},{"lat":37.36040727,"lng":-122.11952001}];

const TEST_GEOFENCES = [{
  identifier: '[CAP] Home', radius: 200.0,
  latitude: 45.51872221233045, longitude: -73.60041976465013,
  notifyOnEntry: true, notifyOnExit: true, notifyOnDwell: true, loiteringDelay: 60000,
  extras: { radius: 200, center: { latitude: 45.51872221233045, longitude: -73.60041976465013 } }
}, {
  identifier: '[CAP] Parc Outremont', radius: 200.0,
  latitude: 45.51791915253888, longitude: -73.60480434117284,
  notifyOnEntry: true, notifyOnExit: true, notifyOnDwell: true, loiteringDelay: 60000,
  extras: { radius: 200, center: { latitude: 45.51791915253888, longitude: -73.60480434117284 } }
}, {
  identifier: '[CAP] 5 Saison', radius: 200.0,
  latitude: 45.52193435702239, longitude: -73.60793815706307,
  notifyOnEntry: true, notifyOnExit: true, notifyOnDwell: true, loiteringDelay: 0,
  extras: { radius: 200, center: { latitude: 45.52193435702239, longitude: -73.60793815706307 } }
}, {
  identifier: '[CAP] Laj', radius: 200.0,
  latitude: 45.52011166353691, longitude: -73.61188565687189,
  notifyOnEntry: true, notifyOnExit: true, notifyOnDwell: true, loiteringDelay: 0,
  extras: { radius: 200, center: { latitude: 45.52011166353691, longitude: -73.61188565687189 } }
}, {
  identifier: '[CAP] Park Beaubien', radius: 200.0,
  latitude: 45.51536622906458, longitude: -73.60916110960558,
  notifyOnEntry: true, notifyOnExit: true, notifyOnDwell: false, loiteringDelay: 0,
  extras: { radius: 200, center: { latitude: 45.51536622906458, longitude: -73.60916110960558 } }
}, {
  identifier: '[CAP] Parc Fairmount', radius: 200.0,
  latitude: 45.5204308608878, longitude: -73.59730225310089,
  notifyOnEntry: true, notifyOnExit: true, notifyOnDwell: true, loiteringDelay: 60000,
  extras: { radius: 200, center: { latitude: 45.5204308608878, longitude: -73.59730225310089 } }
}, {
  identifier: '[CAP] Park Laurier', radius: 200.0,
  latitude: 45.53237479609443, longitude: -73.58741778627864,
  notifyOnEntry: true, notifyOnExit: true, notifyOnDwell: true, loiteringDelay: 60000,
  extras: { radius: 200, center: { latitude: 45.53237479609443, longitude: -73.58741778627864 } }
}];

export default class Test {
  static async applyTestConfig(): Promise<void> {
    await BackgroundGeolocation.removeGeofences();
    await BackgroundGeolocation.addGeofences(TEST_GEOFENCES);
    await BackgroundGeolocation.resetOdometer();

    const { value: org } = await Preferences.get({ key: '@transistor_org' });
    const { value: username } = await Preferences.get({ key: '@transistor_username' });

    if (!org || !username) {
      throw new Error('Attempt to create transistorAuthorizationToken with null org or username');
    }

    // NOTE: findOrCreateTransistorAuthorizationToken is used here only to sync data with the
    // Transistor Software demo server (https://tracker.transistorsoft.com) so you can see your
    // tracking data on a live map.  It is NOT a required part of the core SDK.  In your own app
    // you would simply configure { url: 'https://your.server.com/locations' } instead.
    const token = await BackgroundGeolocation.findOrCreateTransistorAuthorizationToken(
      org, username, ENV.TRACKER_HOST
    );

    const state = await BackgroundGeolocation.reset({
      transistorAuthorizationToken: token,
      disableProviderChangeRecord: true,
      debug: true,
      logLevel: BackgroundGeolocation.LOG_LEVEL_VERBOSE,
      desiredAccuracy: BackgroundGeolocation.DESIRED_ACCURACY_HIGH,
      distanceFilter: 50,
      disableElasticity: false,
      stopTimeout: 1,
      backgroundPermissionRationale: {
        title: "Allow {applicationName} to access this device's location even when closed or not in use.",
        message: "This app collects location data to enable recording your trips to work and calculate distance-travelled.",
        positiveAction: 'Change to "{backgroundPermissionOptionLabel}"',
        negativeAction: 'Cancel',
      },
      schedule: [],
      maxDaysToPersist: 14,
      geofenceModeHighAccuracy: true,
      stopOnTerminate: false,
      startOnBoot: true,
      enableHeadless: true,
      heartbeatInterval: -1,
    });

    if (state.schedule && state.schedule.length > 0) {
      BackgroundGeolocation.startSchedule();
    }
  }

  static getTestGeofences(route: string, config: any): Geofence[] {
    return FREEWAY_DRIVE_DATA.map((point) => ({
      identifier: 'freeway_drive_' + (++geofenceNextId),
      extras: { geofence_extra_foo: 'extra geofence data' },
      latitude: point.lat,
      longitude: point.lng,
      radius: config.radius,
      notifyOnEntry: config.notifyOnEntry,
      notifyOnExit: config.notifyOnExit,
      notifyOnDwell: config.notifyOnDwell,
      loiteringDelay: config.loiteringDelay,
    }));
  }
}
