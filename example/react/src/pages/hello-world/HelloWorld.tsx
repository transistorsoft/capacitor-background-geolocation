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
  IonList,
  IonItem,
  IonItemDivider,
  IonLabel,
  IonFooter,
} from '@ionic/react';

import React from "react";

import { Preferences } from '@capacitor/preferences';

import { trash, navigate, home, play, pause } from "ionicons/icons";

import { useHistory } from 'react-router-dom';

import BackgroundGeolocation, {
  State,
  Subscription
} from "@transistorsoft/capacitor-background-geolocation";

import {registerTransistorAuthorizationListener} from '../../config/Authorization';
import {ENV} from "../../config/ENV";

/// Collection of BackgroundGeolocation event-subscriptions.
const SUBSCRIPTIONS:Subscription[] = [];

/// Helper method to push a BackgroundGeolocation subscription onto our list of subscribers.
const subscribe = (subscription:Subscription) => {
  SUBSCRIPTIONS.push(subscription);
}

/// Helper method to unsubscribe from all registered BackgroundGeolocation event-listeners.
const unsubscribe = () => {
  SUBSCRIPTIONS.forEach((subscription) => subscription.remove() )
  SUBSCRIPTIONS.splice(0, SUBSCRIPTIONS.length);
}

const HelloWorld: React.FC = () => {
  const history = useHistory();

  const [enabled, setEnabled] = React.useState<boolean|undefined>(undefined);
  const [isMoving, setIsMoving] = React.useState(false);
  const [events, setEvents] = React.useState<any[]>([]);

  /// Adds events to List
  const addEvent = (name:string, params:any) => {
    let timestamp = new Date();
    const event = {
      expanded: false,
      timestamp: (timestamp.toLocaleDateString() + ' ' + timestamp.toLocaleTimeString()),
      name: name,
      params: JSON.stringify(params, null, 2)
    }
    setEvents(previous => [...previous, event]);
  }

  /// mount/unmount Effect.
  React.useEffect(() => {
    registerTransistorAuthorizationListener(history);
    initBackgroundGeolocation();

    return () => {
      // Remove all BackgroundGeolocation event Subscriptions when the view is destroyed.
      unsubscribe();
    }
  }, []);

  /// Configure the BackgroundGeolocation plugin.
  const initBackgroundGeolocation = async () => {
    subscribe(BackgroundGeolocation.onProviderChange((event) => {
      console.log('[onProviderChange]', event);
      addEvent('onProviderChange', event);
    }));

    subscribe(BackgroundGeolocation.onLocation((location) => {
      console.log('[onLocation]', location);
      addEvent('onLocation', location);
    }, (error) => {
      console.warn('[onLocation] ERROR: ', error);
    }));

    subscribe(BackgroundGeolocation.onMotionChange((location) => {
      setIsMoving(location.isMoving);
      console.log('[onMotionChange]', location);
      addEvent('onMotionChange', location);
    }));

    subscribe(BackgroundGeolocation.onGeofence((event) => {
      console.log('[onGeofence]', event);
      addEvent('onGeofence', event);
    }));

    subscribe(BackgroundGeolocation.onConnectivityChange((event) => {
      console.log('[onConnectivityChange]', event);
      addEvent('onConnectivityChange', event);
    }));

    subscribe(BackgroundGeolocation.onEnabledChange((enabled) => {
      console.log('[onEnabledChange]', enabled);
      setIsMoving(false);
      addEvent('onEnabledChange', {enabled: enabled});
    }));

    subscribe(BackgroundGeolocation.onHttp((event) => {
      console.log('[onHttp]', event);
      addEvent('onHttp', event);
    }));

    subscribe(BackgroundGeolocation.onActivityChange((event) => {
      console.log('[onActivityChange]', event);
      addEvent('onActivityChange', event);
    }));

    subscribe(BackgroundGeolocation.onPowerSaveChange((enabled) => {
      console.log('[onPowerSaveChange]', enabled);
      addEvent('onPowerSaveChange', {isPowerSaveMode: enabled});
    }));

    const org = (await Preferences.get({key: 'orgname'})).value;
    const username = (await Preferences.get({key: 'username'})).value;
    if ((org === null) || (username === null)) {
      history.goBack();
      return;
    }

    /// Get an authorization token from demo server at tracker.transistorsoft.com
    const token = await BackgroundGeolocation.findOrCreateTransistorAuthorizationToken(org, username, ENV.TRACKER_HOST);

    BackgroundGeolocation.ready({
      debug: true,
      logLevel: BackgroundGeolocation.LOG_LEVEL_VERBOSE,
      transistorAuthorizationToken: token,
      distanceFilter: 10,
      stopTimeout: 5,
      stopOnTerminate: false,
      startOnBoot: true
    }).then((state) => {
      setEnabled(state.enabled);
      setIsMoving(state.isMoving!);
      addEvent('State', state);
    });
  }

  /// Home button handler.
  const onClickHome = () => {
    history.goBack()
  }

  const onToggleEnabled = (value:boolean) => {
    if (value === undefined) { return; }
    if (value) {
      BackgroundGeolocation.start();
    } else {
      BackgroundGeolocation.stop();
    }
    setEnabled(value);
  }

  const onClickGetCurrentPosition = () => {
    BackgroundGeolocation.getCurrentPosition({
      extras: {
        getCurrentPosition: true
      }
    }).then((location) => {
      console.log('[getCurrentPosition]', location);
    }).catch((error) => {
      console.warn('[getCurrentPosition] ERROR', error);
    });
  }

  const onClickChangePace = () => {
    if (!enabled) { return; }
    setIsMoving(!isMoving);
    BackgroundGeolocation.changePace(!isMoving);
  }

  const onClickClear = () => {
    setEvents([]);
  }

  const onClickGetState = () => {
    BackgroundGeolocation.getState().then((state:State) => {
      addEvent('State', state);
    });
  }

  return (
    <IonPage className="HelloWorld">
      <IonHeader>
        <IonToolbar color="tertiary">
          <IonTitle color="dark">HelloWorld</IonTitle>
          <IonButtons slot="start">
            <IonButton onClick={onClickHome}><IonIcon icon={home} /></IonButton>
          </IonButtons>
          <IonButtons slot="end">
            <IonToggle checked={enabled} onIonChange={e => onToggleEnabled(e.detail.checked)}/>
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>
        <IonList>
          { events.slice().reverse().map((event, i) => (
            <div key={i}>
              <header style={{backgroundColor: '#000', color: '#fff', padding: 10}}>
                <span>{event.name}</span>
                <span style={{fontSize:12, float:'right'}}>{event.timestamp}</span>
              </header>
              <div><pre><code style={{fontSize:12}}>{event.params}</code></pre></div>
            </div>
          ))}
        </IonList>
      </IonContent>
      <IonFooter>
        <IonToolbar color="tertiary">
          <IonButtons slot="start">
            <IonButton onClick={onClickGetCurrentPosition}><IonIcon icon={navigate} /></IonButton>
          </IonButtons>
          <IonButtons slot="end">

            <IonButton onClick={onClickGetState}>Get State</IonButton>
            <IonButton onClick={onClickClear} style={{marginRight:20}}>Clear</IonButton>
            <IonButton onClick={onClickChangePace} fill="solid" disabled={!enabled} color={(isMoving) ? "danger" : "success"} style={{width:50}}><IonIcon icon={(isMoving) ? pause : play} /></IonButton>
          </IonButtons>
        </IonToolbar>
      </IonFooter>
    </IonPage>
  );
};

export default HelloWorld;
