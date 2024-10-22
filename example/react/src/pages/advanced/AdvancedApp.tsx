import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonButtons,
  IonButton,
  IonIcon,
  IonToggle,
  IonFooter,
} from '@ionic/react';

import './styles.css';

import React from "react";
import { trash, navigate, home, play, pause } from "ionicons/icons";
import { Preferences } from '@capacitor/preferences';
import { useHistory } from 'react-router-dom';
import { useIonRouter } from '@ionic/react';

import BackgroundGeolocation, {
  Location,
  MotionActivityEvent,
  Subscription
} from "@transistorsoft/capacitor-background-geolocation";

import {BackgroundFetch} from "@transistorsoft/capacitor-background-fetch";

import {ENV} from "../../config/ENV";
import {registerTransistorAuthorizationListener} from '../../config/Authorization';

import SettingsService from "./lib/SettingsService";

import './styles.css';
import MapView from "./MapView";
import FABMenu from "./FABMenu";

/// Collection of BackgroundGeolocation event Subscription instances.
/// We collect these so we can remove event-listeners when the View is removed or refreshed
/// during development live-reload.  Otherwise a new event-listener would be registered
/// with each refresh.
///
const SUBSCRIPTIONS:Subscription[] = [];

const subscribe = (subscription:Subscription) => {
  SUBSCRIPTIONS.push(subscription);
}

const unsubscribe = () => {
  SUBSCRIPTIONS.forEach((subscription) => subscription.remove() )
  SUBSCRIPTIONS.splice(0, SUBSCRIPTIONS.length);
}

const AdvancedApp: React.FC = () => {
  const router = useIonRouter();
  const history = useHistory();
  const settingsService = SettingsService.getInstance();

  const [ready, setReady] = React.useState(false);
  const [enabled, setEnabled] = React.useState(false);
  const [isMoving, setIsMoving] = React.useState(false);
  const [location, setLocation] = React.useState<Location>();
  const [odometer, setOdometer] = React.useState(0);
  const [motionActivityEvent, setMotionActivityEvent] = React.useState<MotionActivityEvent>();
  const [testClicks, setTestClicks] = React.useState(0);
  const [clickBufferTimeout, setClickBufferTimeout] = React.useState<any>(0);

  React.useEffect(() => {
    registerTransistorAuthorizationListener(history);
    initBackgroundGeolocation();
    initBackgroundFetch();
    return () => {
      unsubscribe();
    }
  }, []);

  /// Location effect-handler
  React.useEffect(() => {
    if (!location) return;
    setOdometer(location.odometer);
  }, [location]);

  const initBackgroundGeolocation = async () => {
    /// Listen to some events.
    subscribe(BackgroundGeolocation.onLocation(setLocation, (error) => {
      console.log('[onLocation] ERROR: ', error);
    }));

    subscribe(BackgroundGeolocation.onMotionChange((location) => {
      setIsMoving(location.isMoving);
    }));

    subscribe(BackgroundGeolocation.onAuthorization((event) => {
      console.log("[onAuthorization]", event);
    }));

    subscribe(BackgroundGeolocation.onActivityChange(setMotionActivityEvent));    
    
    subscribe(BackgroundGeolocation.onPowerSaveChange((value) => {
      console.log("******* Capacitor onPowerSaveChange: ", value);
    }));
  }

  const onMapReady = async (isReady:boolean) => {
    if (!isReady) return;
    // Fetch registered orgname / username from Storage so we can fetch an Auth token from the demo server
    const org = (await Preferences.get({key: 'orgname'})).value;
    const username = (await Preferences.get({key: 'username'})).value;
    if ((org === null) || (username === null)) {
      history.goBack();
      return;
    }

    // Get an authorization token from demo server at tracker.transistorsoft.com
    const token = await BackgroundGeolocation.findOrCreateTransistorAuthorizationToken(org, username, ENV.TRACKER_HOST);

    BackgroundGeolocation.ready({
      // Debugging.
      reset: false,  // <-- !! DO NOT USE THIS IN YOUR OWN APP UNLESS YOUR REALLY KNOW WHAT THIS DOES !!
      debug: true,
      logLevel: BackgroundGeolocation.LOG_LEVEL_VERBOSE,
      transistorAuthorizationToken: token,
      // Geolocation
      desiredAccuracy: BackgroundGeolocation.DESIRED_ACCURACY_NAVIGATION,
      distanceFilter: 10,
      stopTimeout: 5,
      // Permissions
      locationAuthorizationRequest: 'Always',
      backgroundPermissionRationale: {
        title: "Allow {applicationName} to access this device's location even when closed or not in use.",
        message: "This app collects location data to enable recording your trips to work and calculate distance-travelled.",
        positiveAction: 'Change to "{backgroundPermissionOptionLabel}"',
        negativeAction: 'Cancel'
      },
      // HTTP & Persistence
      autoSync: true,
      maxDaysToPersist: 14,
      // Application
      stopOnTerminate: false,
      startOnBoot: true
    }).then((state) => {
      setEnabled(state.enabled);
      setIsMoving(state.isMoving!);
      setOdometer(state.odometer);
      setReady(true);
    });
  }

  const initBackgroundFetch = () => {
    BackgroundFetch.configure({
      minimumFetchInterval: 15, // <-- default is 15
      // Android config
      stopOnTerminate: false,
      startOnBoot: true,
      enableHeadless: true,
      requiresCharging: false,
      requiresDeviceIdle: false,
      requiresBatteryNotLow: false,
      requiresStorageNotLow: false,
      requiredNetworkType: BackgroundFetch.NETWORK_TYPE_NONE
    }, async (taskId) => {
      console.log('[BackgroundFetch] - Received event:', taskId);

      const location = await BackgroundGeolocation.getCurrentPosition({
        samples: 2,
        maximumAge: 1000 * 10,
        timeout: 30,
        desiredAccuracy: 40,
        extras: {event: "background-fetch", headless: false}
      });
      console.log('[BackgroundFetch getCurrentPosition] location', location);
      BackgroundFetch.finish(taskId);
    }, (taskId) => {
      console.warn('[BackgroundFetch] TIMEOUT: ', taskId);
      BackgroundFetch.finish(taskId);
    });
  }

  /// Handles test-mode clicks on bottom toolbar, ie: [activity:123km]
  /// Reloads test-config.
  React.useEffect(() => {
    // Swallow the zero event.
    if (testClicks === 0) return;

    console.log('[TEST CLICK]:', testClicks);
    settingsService.playSound('TEST_MODE_CLICK');
    if (testClicks >= 10) {
      // Hit it!
      setTestClicks(0);
      settingsService.playSound('TEST_MODE_SUCCESS');
      settingsService.applyTestConfig();
    } else if (testClicks <= 10) {
      // Keep going...
      if (clickBufferTimeout > 0) {
        clearTimeout(clickBufferTimeout);
      }
      setClickBufferTimeout(setTimeout(() => {
        setTestClicks(0);
      }, 2000));
    }
  }, [testClicks]);

  /// Enabled Effect.
  React.useEffect(() => {
    // Don't respond to enabledchange until BackgroundGeolocation.ready() resolves.
    // We're not interested in the initial state-change of the <IonToggle> since BackgroundGeolocation
    // automatically calls .start() upon itself after .ready() is called.
    if (!ready) { return; }

    if (enabled) {
      BackgroundGeolocation.start();
    } else {
      BackgroundGeolocation.stop();
      setIsMoving(false);
    }
  }, [enabled]);

  /// [Home] button handler
  const onClickHome = () => {    
    setEnabled(false);
    history.push('/home', 'root'); 
  }

  /// Get Current Position button handler.
  const onClickGetCurrentPosition = async () => {
    BackgroundGeolocation.getCurrentPosition({
      persist: true,      // Persist this location and POST to server.
      timeout: 30,         // Wait up to 30s for a location
      desiredAccuracy: 60, // Satisfied with a location accuracy of 60 or less.
      maximumAge: 10000,   // Satisfied up to 10s old.
      samples: 3,          // Gather 3 samples
      extras: {           // Arbitrary key/values appended to this location.
        getCurrentPosition: true
      }
    }).then((location) => {
      console.log('[getCurrentPosition]', location);
    }).catch((error) => {
      console.warn('[getCurrentPosition] ERROR', error);
    });
  }

  /// [play] / [pause] button handler.
  const onClickChangePace = () => {
    if (!enabled) { return; }
    setIsMoving(!isMoving);
    BackgroundGeolocation.changePace(!isMoving);
  }

  return (
    <IonPage className="AdvancedApp">
      <IonHeader>
        <IonToolbar color="tertiary">
          <IonTitle color="dark">BG Geolocation</IonTitle>
          <IonButtons slot="start">
            <IonButton onClick={onClickHome}><IonIcon icon={home} /></IonButton>
          </IonButtons>
          <IonButtons slot="end">
            <IonToggle checked={enabled} onIonChange={e => setEnabled(e.detail.checked)}/>
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>
        <MapView onReady={onMapReady} />
        <FABMenu />
      </IonContent>
      <IonFooter>
        <IonToolbar color="tertiary">
          <IonButtons slot="start">
            <IonButton onClick={onClickGetCurrentPosition}><IonIcon icon={navigate} /></IonButton>
          </IonButtons>
          <IonTitle style={{textAlign:'center'}}>
            <IonButton fill="clear" color="dark" onClick={() => setTestClicks(testClicks+1)}>{(motionActivityEvent) ? motionActivityEvent.activity : 'Unknown'}&nbsp;•&nbsp;{(odometer/1000).toFixed(1)}km</IonButton>
          </IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={onClickChangePace} disabled={!enabled} fill="solid" color={(isMoving) ? "danger" : "success"} style={{width:50}}><IonIcon icon={(isMoving) ? pause : play} /></IonButton>
          </IonButtons>
        </IonToolbar>
      </IonFooter>
    </IonPage>
  );
};

export default AdvancedApp;
