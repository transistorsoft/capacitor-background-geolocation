import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  IonApp,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonFooter,
  IonButtons,
  IonButton,
  IonIcon,
  IonToggle,
  IonToast,
} from '@ionic/react';
import { navigate, play, pause } from 'ionicons/icons';

import { SplashScreen } from '@capacitor/splash-screen';
import { StatusBar, Style } from '@capacitor/status-bar';
import { Preferences } from '@capacitor/preferences';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { BackgroundFetch } from '@transistorsoft/capacitor-background-fetch';
import BackgroundGeolocation, {
  Location,
} from '@transistorsoft/capacitor-background-geolocation';

import RegistrationModal from './RegistrationModal';
import MapView from './MapView';
import FABMenu from './FABMenu';
import ConfigView from './ConfigView';
import TSDialog from './lib/Dialog';
import { ENV } from './config/ENV';
import { registerTransistorAuthorizationListener } from './config/Authorization';

// Module-level subscription array (survives StrictMode double-invoke)
const SUBSCRIPTIONS: Array<{ remove: () => void }> = [];

export default function App() {
  // Plugin state
  const [isInitialized, setIsInitialized] = useState(false);
  const [isEnabled, setIsEnabled] = useState(false);
  const [isMoving, setIsMoving] = useState(false);
  const [odometer, setOdometer] = useState(0);
  const [odometerError, setOdometerError] = useState(0);

  // UI state
  const [registrationVisible, setRegistrationVisible] = useState(false);
  const [configViewVisible, setConfigViewVisible] = useState(false);
  const [savedOrg, setSavedOrg] = useState('');
  const [savedUsername, setSavedUsername] = useState('');

  // Toast state
  const [toastMsg, setToastMsg] = useState('');

  const toastTimerRef = useRef<any>(null);

  // Configure Dialog toast renderer
  useEffect(() => {
    TSDialog.getInstance().setToast((message: string, duration = 3000) => showToast(message, duration));
  }, []);

  const showToast = (message: string, duration = 3000) => {
    setToastMsg(message);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToastMsg(''), duration);
  };

  // Mount
  useEffect(() => {
    SplashScreen.hide();
    StatusBar.setStyle({ style: Style.Light });

    // Register BackgroundGeolocation event listeners and store references in module-level SUBSCRIPTIONS array so we can remove them on unmount.  We don't want to store these in state or refs because we don't want to trigger any re-renders when they change, and we don't want them to be reset on re-render.
    // event listeners should be registered BEFORE calling BackgroundGeolocation.ready(config) in case any events fire immediately upon initialization (e.g. location, geofence, providerchange, motionchange, etc).
    SUBSCRIPTIONS.push(
      BackgroundGeolocation.onLocation((location: Location) => {
        console.log('[location] -', location);
        setOdometer(location.odometer);
        setOdometerError((location as any).odometer_error ?? 0);
      }, error => {
        console.warn('[location] ERROR -', error);
      }),

      BackgroundGeolocation.onMotionChange(event => {
        console.log('[motionchange] -', event.isMoving, event.location);
        setIsMoving(event.isMoving);
      }),

      BackgroundGeolocation.onEnabledChange(enabled => {
        console.log('[enabledchange] -', enabled);
        setIsEnabled(enabled);
      }),

      BackgroundGeolocation.onAuthorization(evt => {
        console.log('[onAuthorization]', evt);
      }),
    );

    registerTransistorAuthorizationListener(() => {
      openRegistrationModal();
    });

    bootstrap();
    initBackgroundFetch();

    return () => {
      SUBSCRIPTIONS.forEach(sub => sub.remove());
      SUBSCRIPTIONS.splice(0, SUBSCRIPTIONS.length);
    };
  }, []);

  // Bootstrap
  const bootstrap = async () => {
    try {
      const { value: registered } = await Preferences.get({ key: '@transistor_registered' });

      if (!registered) {
        setRegistrationVisible(true);
        return;
      }

      const [{ value: org }, { value: username }] = await Promise.all([
        Preferences.get({ key: '@transistor_org' }),
        Preferences.get({ key: '@transistor_username' }),
      ]);

      if (!org || !username) {
        console.warn('[App] Registration data missing/corrupt. Showing RegistrationModal');
        setRegistrationVisible(true);
        return;
      }

      await initializeBackgroundGeolocation(org, username);
    } catch (e) {
      console.warn('[App] bootstrap ERROR', e);
      setRegistrationVisible(true);
    }
  };

  // BGGeo init
  const initializeBackgroundGeolocation = async (org: string, username: string) => {
    try {
      setIsInitialized(true);

      // NOTE: findOrCreateTransistorAuthorizationToken is used here only to sync data with the
      // Transistor Software demo server (https://tracker.transistorsoft.com) so you can see your
      // tracking data on a live map.  It is NOT a required part of the core SDK.  In your own app
      // you would simply configure { url: 'https://your.server.com/locations' } instead.
      const token = await BackgroundGeolocation.findOrCreateTransistorAuthorizationToken(
        org, username, ENV.TRACKER_HOST,
      );

      // You must call BackgroundGeolocation.ready() each and every time your app boots.  
      const state = await BackgroundGeolocation.ready({
        reset: false,
        transistorAuthorizationToken: token,
        geolocation: {
          desiredAccuracy: BackgroundGeolocation.DesiredAccuracy.High,
          distanceFilter: 10,
          stopTimeout: 5,
          locationAuthorizationRequest: 'Always',
        },        
        app: {
          stopOnTerminate: false,
          startOnBoot: true,
          enableHeadless: true,
          heartbeatInterval: 60,
          backgroundPermissionRationale: {
            title: "Allow {applicationName} to access this device's location even when closed or not in use.",
            message: "This app collects location data to enable recording your trips to work and calculate distance-travelled.",
            positiveAction: 'Change to "{backgroundPermissionOptionLabel}"',
            negativeAction: 'Cancel',
          }
        },
        http: {
          autoSync: true,
        },
        persistence: {
          maxDaysToPersist: 3,
        },                
        logger: {
          debug: true,
          logLevel: BackgroundGeolocation.LogLevel.Verbose,
        }        
      });

      setOdometer(state.odometer ?? 0);
      setOdometerError((state as any).odometerError ?? 0);
      setIsEnabled(state.enabled === true);
      setIsMoving(state.isMoving === true);

setRegistrationVisible(false);
    } catch (error) {
      console.error('[BackgroundGeolocation] initialize ERROR', error);
      setIsInitialized(false);
      setRegistrationVisible(true);
    }
  };

  // BackgroundFetch init
  const initBackgroundFetch = () => {
    BackgroundFetch.configure({
      minimumFetchInterval: 15,
      stopOnTerminate: false,
      startOnBoot: true,
      enableHeadless: true,
      requiresCharging: false,
      requiresDeviceIdle: false,
      requiresBatteryNotLow: false,
      requiresStorageNotLow: false,
      requiredNetworkType: BackgroundFetch.NETWORK_TYPE_NONE,
    }, async (taskId) => {
      console.log('[BackgroundFetch] event:', taskId);
      try {
        await BackgroundGeolocation.getCurrentPosition({
          samples: 2, maximumAge: 10000, timeout: 30, desiredAccuracy: 40,
          extras: { event: 'background-fetch', headless: false },
        });
      } catch (_e) { /* ignore */ }
      BackgroundFetch.finish(taskId);
    }, (taskId) => {
      console.warn('[BackgroundFetch] TIMEOUT:', taskId);
      BackgroundFetch.finish(taskId);
    });
  };

  // Registration helpers
  const openRegistrationModal = useCallback(async () => {
    const { value: org } = await Preferences.get({ key: '@transistor_org' });
    const { value: username } = await Preferences.get({ key: '@transistor_username' });
    setSavedOrg(org ?? '');
    setSavedUsername(username ?? '');
    setRegistrationVisible(true);
  }, []);

  const handleRegistrationComplete = async (organization: string, username: string) => {
    await Preferences.set({ key: '@transistor_registered', value: '1' });
    await Preferences.set({ key: '@transistor_org', value: organization });
    await Preferences.set({ key: '@transistor_username', value: username });
    setRegistrationVisible(false);
    if (!isInitialized) {
      await initializeBackgroundGeolocation(organization, username);
    }
  };

  // Control handlers
  const onToggleEnabled = async () => {
    Haptics.impact({ style: ImpactStyle.Heavy });
    const enabled = !isEnabled;
    setIsEnabled(enabled);
    if (enabled) {
      try {
        await BackgroundGeolocation.start();
      } catch (error) {
        console.warn('Error starting BackgroundGeolocation:', error);
      }
    } else {
      setIsMoving(false);
      BackgroundGeolocation.stop();
    }
  };

  const onClickChangePace = () => {
    Haptics.impact({ style: ImpactStyle.Heavy });
    if (!isEnabled) {
      console.log('Ignoring changePace: BackgroundGeolocation is disabled');
      return;
    }
    const nowMoving = !isMoving;
    setIsMoving(nowMoving);
    BackgroundGeolocation.changePace(nowMoving);
  };

  const onClickGetCurrentPosition = async () => {
    Haptics.impact({ style: ImpactStyle.Medium });
    try {
      const location = await BackgroundGeolocation.getCurrentPosition({
        timeout: 30,
        maximumAge: 5000,
        desiredAccuracy: 40,
        samples: 3,
        extras: { getCurrentPosition: true },
      });
      console.log('[getCurrentPosition]', location);
      BackgroundGeolocation.logger.debug('getCurrentPosition received: ' + location.uuid);
    } catch (error) {
      console.warn('[getCurrentPosition] ERROR', error);
    }
  };

  const handleMenuItemPress = (action: string) => {
    if (action === 'config') {
      if (registrationVisible) {
        console.log('[App] Ignoring ConfigView while RegistrationModal is visible');
        return;
      }
      setConfigViewVisible(true);
    }
  };

  // Odometer display
  const renderOdometer = () => {
    const km = odometer / 1000;
    return `${km.toFixed(2)} km (± ${Math.round(odometerError)} m)`;
  };

  return (
    <IonApp>
      {/* Toast */}
      <IonToast
        isOpen={!!toastMsg}
        message={toastMsg}
        duration={3000}
        position="bottom"
        onDidDismiss={() => setToastMsg('')}
      />

      {/* Top Toolbar */}
      <IonHeader>
        <IonToolbar color="warning" style={{ '--background': '#FFD500', '--color': '#000' }}>
          <IonTitle>BG Geo Demo</IonTitle>
          <IonButtons slot="end">
            <IonToggle
              checked={isEnabled}
              onIonChange={() => onToggleEnabled()}
              style={{ '--track-background': '#E0E0E0', '--track-background-checked': '#34C759' }}
            />
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      {/* Map Content Area */}
      <div className="map-wrapper">
        <MapView
          onReady={() => {}}
          hideAddGeofencePrompt={configViewVisible}
        />
        <FABMenu onMenuItemPress={handleMenuItemPress} />
      </div>

      {/* Bottom Toolbar */}
      <IonFooter>
        <IonToolbar style={{ '--background': '#FFD500', '--color': '#000', '--padding-top': '10px', '--padding-bottom': '10px' }}>
          <IonButtons slot="start">
            <IonButton
              onClick={onClickGetCurrentPosition}
              shape="round"
              fill="solid"
              style={{
                '--background': 'rgba(0,0,0,0.15)',
                '--color': '#333',
                '--border-radius': '50%',
                '--padding-start': '0',
                '--padding-end': '0',
                width: '44px',
                height: '44px',
                marginLeft: '10px',
              }}
            >
              <IonIcon icon={navigate} style={{ fontSize: '20px' }} />
            </IonButton>
          </IonButtons>

          <div className="status-container">
            <span className="status-label">{isMoving ? 'MOVING' : 'STATIONARY'}</span>
            <span className="status-distance">{renderOdometer()}</span>
          </div>

          <IonButtons slot="end">
            <IonButton
              disabled={!isEnabled}
              onClick={onClickChangePace}
              shape="round"
              style={{
                '--background': isMoving ? '#FF3B30' : '#34C759',
                '--color': '#fff',
                '--border-radius': '24px',
                width: '48px',
                height: '48px',
                marginRight: '10px',
                opacity: isEnabled ? 1 : 0.4,
              }}
              fill="solid"
            >
              <IonIcon icon={isMoving ? pause : play} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonFooter>

      {/* ConfigView */}
      <ConfigView
        visible={configViewVisible}
        onClose={() => setConfigViewVisible(false)}
        onRequestRegistration={() => {
          console.log('[App] Showing RegistrationModal (requested by ConfigView)');
          setConfigViewVisible(false);
          openRegistrationModal();
        }}
      />

      {/* RegistrationModal */}
      <RegistrationModal
        visible={registrationVisible}
        savedOrg={savedOrg}
        savedUsername={savedUsername}
        onComplete={handleRegistrationComplete}
      />
    </IonApp>
  );
}
