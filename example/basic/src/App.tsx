import { useCallback, useEffect, useRef, useState } from 'react';
import { SplashScreen } from '@capacitor/splash-screen';
import { Preferences } from '@capacitor/preferences';
import BackgroundGeolocation, {
  Location,
  MotionChangeEvent,
  MotionActivityEvent,
  ProviderChangeEvent,
  GeofenceEvent,
  MotionActivityType,
} from '@transistorsoft/capacitor-background-geolocation';

import RegistrationModal from './components/RegistrationModal';
import EmailDialog from './components/EmailDialog';
import Drawer from './components/Drawer';

// ── Types ─────────────────────────────────────────────────────────────────────

interface AppState {
  initialized: boolean;
  tracking: boolean;
  isMoving: boolean;
  activity: MotionActivityType;
  providerEnabled: boolean;
  odometer: number;
  odometerError: number | null;
  lastLocation: Location | null;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function activityIcon(activity: MotionActivityType): string {
  const icons: Record<MotionActivityType, string> = {
    still:       '🧍',
    on_foot:     '🚶',
    walking:     '🚶',
    running:     '🏃',
    on_bicycle:  '🚴',
    in_vehicle:  '🚗',
    unknown:     '❓',
  };
  return icons[activity] ?? '❓';
}

// ── App ───────────────────────────────────────────────────────────────────────

export default function App() {
  const [showRegistration, setShowRegistration] = useState(false);
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const [savedOrg, setSavedOrg] = useState('');
  const [savedUsername, setSavedUsername] = useState('');
  const [savedEmail, setSavedEmail] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false);

  const [state, setState] = useState<AppState>({
    initialized:     false,
    tracking:        false,
    isMoving:        false,
    activity:        'unknown' as MotionActivityType,
    providerEnabled: false,
    odometer:        0,
    odometerError:   null,
    lastLocation:    null,
  });

  // Guard against double-initialization (React StrictMode double-invoke, etc.)
  const initializedRef = useRef(false);
  const subscriptions  = useRef<Array<{ remove: () => void }>>([]);

  // ── BGGeo subscriptions ─────────────────────────────────────────────────────

  const setupSubscriptions = useCallback(() => {
    subscriptions.current.push(
      BackgroundGeolocation.onLocation(
        (loc: Location) => {
          console.log('[location]', loc);
          setState(s => ({
            ...s,
            lastLocation:  loc,
            odometer:      loc.odometer      ?? s.odometer,
            odometerError: loc.odometer_error !== undefined
              ? loc.odometer_error
              : s.odometerError,
          }));
        },
        (err: number) => console.warn('[location] error', err),
      ),

      BackgroundGeolocation.onMotionChange((evt: MotionChangeEvent) => {
        console.log('[motionchange]', evt.isMoving);
        setState(s => ({
          ...s,
          isMoving:     evt.isMoving,
          lastLocation: evt.location ?? s.lastLocation,
          odometer:     evt.location?.odometer ?? s.odometer,
        }));
      }),

      BackgroundGeolocation.onActivityChange((evt: MotionActivityEvent) => {
        console.log('[activitychange]', evt.activity);
        setState(s => ({ ...s, activity: evt.activity }));
      }),

      BackgroundGeolocation.onProviderChange((evt: ProviderChangeEvent) => {
        console.log('[providerchange]', evt.enabled);
        setState(s => ({ ...s, providerEnabled: evt.enabled }));
      }),

      BackgroundGeolocation.onGeofence((evt: GeofenceEvent) => {
        console.log('[geofence]', evt);
        alert(`Geofence: ${evt.identifier} — ${evt.action}`);
      }),
    );
  }, []);

  // ── BGGeo init ──────────────────────────────────────────────────────────────

  const initializeBGGeo = useCallback(async (org: string, username: string) => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    BackgroundGeolocation.logger.debug('INITIALIZING BACKGROUND GEOLOCATION');

    try {
      setupSubscriptions();

      // NOTE: findOrCreateTransistorAuthorizationToken is used here only to sync data with the
      // Transistor Software demo server (https://tracker.transistorsoft.com) so you can see your
      // tracking data on a live map.  It is NOT a required part of the core SDK.  In your own app
      // you would simply configure { http: {url: 'https://your.server.com/locations' }} instead.
      const token = await BackgroundGeolocation.findOrCreateTransistorAuthorizationToken(
        org, username,
      );
        
      const pluginState = await BackgroundGeolocation.ready({
        reset: true,
        transistorAuthorizationToken: token,
        logger: {
          debug: true,
          logLevel: BackgroundGeolocation.LogLevel.Verbose,
        },
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
          maxDaysToPersist: 14,
        }        
      });

      setState(s => ({
        ...s,
        initialized: true,
        tracking:    pluginState.enabled  === true,
        isMoving:    pluginState.isMoving === true,
        odometer:    pluginState.odometer ?? s.odometer,
      }));
    } catch (e) {
      console.error('BGGeo init failed:', e);
      initializedRef.current = false;   // allow retry
      alert('Failed to initialize tracking. Please try again.');
    }
  }, [setupSubscriptions]);

  // ── Registration ────────────────────────────────────────────────────────────

  const saveRegistration = async (org: string, username: string) => {
    await Preferences.set({ key: '@transistor_registered', value: '1' });
    await Preferences.set({ key: '@transistor_org',        value: org });
    await Preferences.set({ key: '@transistor_username',   value: username });
  };

  const openRegistrationModal = useCallback(async () => {
    const { value: org }      = await Preferences.get({ key: '@transistor_org' });
    const { value: username } = await Preferences.get({ key: '@transistor_username' });
    setSavedOrg(org ?? '');
    setSavedUsername(username ?? '');
    setShowRegistration(true);
  }, []);

  const checkRegistrationAndInit = useCallback(async () => {
    try {
      const { value: registered } = await Preferences.get({ key: '@transistor_registered' });
      if (!registered) { openRegistrationModal(); return; }

      const { value: org }      = await Preferences.get({ key: '@transistor_org' });
      const { value: username } = await Preferences.get({ key: '@transistor_username' });

      if (org && username) {
        await initializeBGGeo(org, username);
      } else {
        openRegistrationModal();
      }
    } catch (e) {
      console.error('Registration check failed:', e);
      openRegistrationModal();
    }
  }, [initializeBGGeo, openRegistrationModal]);

  const handleRegistrationComplete = async (org: string, username: string) => {
    await saveRegistration(org, username);
    setShowRegistration(false);
    await initializeBGGeo(org, username);
  };

  // ── Mount / unmount ─────────────────────────────────────────────────────────

  useEffect(() => {
    SplashScreen.hide();
    checkRegistrationAndInit();

    return () => {
      subscriptions.current.forEach(sub => sub.remove());
      subscriptions.current = [];
    };
  }, [checkRegistrationAndInit]);

  // ── Control handlers ────────────────────────────────────────────────────────

  const handleToggleTracking = async (value: boolean) => {
    if (!state.initialized) { alert('Please complete registration first'); return; }
    setState(s => ({ ...s, tracking: value }));
    try {
      if (value) {
        await BackgroundGeolocation.start();
      } else {
        await BackgroundGeolocation.stop();
        setState(s => ({ ...s, isMoving: false }));
      }
    } catch (e) {
      console.warn('toggle tracking error', e);
      setState(s => ({ ...s, tracking: !value }));   // revert on error
    }
  };

  const handleChangePace = async () => {
    if (!state.tracking) { alert('Please enable tracking first'); return; }
    try {
      await BackgroundGeolocation.changePace(!state.isMoving);
    } catch (e) {
      console.warn('changePace error', e);
    }
  };

  const handleGetCurrentPosition = async () => {
    if (!state.initialized) { alert('Please complete registration first'); return; }
    try {
      const loc = await BackgroundGeolocation.getCurrentPosition({
        timeout:         30,
        maximumAge:      5000,
        desiredAccuracy: 0,
        samples:         3,
      });
      console.log('[getCurrentPosition]', loc);
      setState(s => ({ ...s, lastLocation: loc as Location }));
    } catch (e) {
      console.error('getCurrentPosition error', e);
      alert('Failed to get current position');
    }
  };

  // ── Menu actions ────────────────────────────────────────────────────────────

  const handleMenuAction = async (action: string) => {
    setDrawerOpen(false);

    switch (action) {
      case 'registration':
        openRegistrationModal();
        break;

      case 'permission':
        try {
          const status = await BackgroundGeolocation.requestPermission();
          alert(`Permission status: ${status}`);
        } catch (e) { alert('Failed to request permission'); }
        break;

      case 'reset-odometer':
        if (!state.initialized) { alert('Please complete registration first'); return; }
        try {
          await BackgroundGeolocation.resetOdometer();
          setState(s => ({ ...s, odometer: 0, odometerError: null }));
        } catch (e) { alert('Failed to reset odometer'); }
        break;

      case 'sync':
        if (!state.initialized) { alert('Please complete registration first'); return; }
        try {
          const count = await BackgroundGeolocation.getCount();
          if (count === 0) { alert('Database is empty. No locations to sync.'); return; }
          if (!confirm(`Upload ${count} locations?`)) return;
          const locs = await BackgroundGeolocation.sync();
          alert(`Synced ${locs.length} locations`);
        } catch (e) { alert('Failed to sync'); }
        break;

      case 'get-state':
        if (!state.initialized) { alert('Please complete registration first'); return; }
        try {
          const pluginState = await BackgroundGeolocation.getState();
          alert(JSON.stringify(pluginState, null, 2));
        } catch (e) { alert('Failed to get state'); }
        break;

      case 'email-log': {
        const { value: email } = await Preferences.get({ key: '@transistor_email' });
        setSavedEmail(email ?? '');
        setShowEmailDialog(true);
        break;
      }

      case 'destroy-log':
        try {
          await BackgroundGeolocation.logger.destroyLog();
          alert('Log file destroyed');
        } catch (e) { alert('Failed to destroy log'); }
        break;

      case 'destroy-locations':
        if (!state.initialized) { alert('Please complete registration first'); return; }
        try {
          const count = await BackgroundGeolocation.getCount();
          if (count === 0) { alert('Database is empty.'); return; }
          if (!confirm(`Destroy ${count} locations? This cannot be undone.`)) return;
          await BackgroundGeolocation.destroyLocations();
          alert('All locations destroyed');
        } catch (e) { alert('Failed to destroy locations'); }
        break;
    }
  };

  const handleSendEmailLog = async (email: string) => {
    try {
      await BackgroundGeolocation.logger.emailLog(email);
      await Preferences.set({ key: '@transistor_email', value: email });
      setShowEmailDialog(false);
      alert('Log emailed successfully');
    } catch (e) {
      console.warn('emailLog error', e);
      alert('Failed to email log');
    }
  };

  // ── Render ──────────────────────────────────────────────────────────────────

  const { initialized, tracking, isMoving, activity, providerEnabled, odometer, lastLocation } = state;

  return (
    <div className="app">

      {/* Registration modal */}
      {showRegistration && (
        <RegistrationModal
          savedOrg={savedOrg}
          savedUsername={savedUsername}
          onComplete={handleRegistrationComplete}
        />
      )}

      {/* Email dialog */}
      {showEmailDialog && (
        <EmailDialog
          savedEmail={savedEmail}
          onClose={() => setShowEmailDialog(false)}
          onSend={handleSendEmailLog}
        />
      )}

      {/* Menu drawer */}
      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onAction={handleMenuAction}
      />

      {/* ── Header ── */}
      <div className="header">
        <div>
          <div className="header-title">Background Geolocation</div>
          <div className="header-subtitle">Demo Application</div>
        </div>
        <button className="menu-btn" onClick={() => setDrawerOpen(true)}>⋮</button>
      </div>

      {/* ── Status chips ── */}
      <div className="status-row">
        <div className="status-chip">
          <span className="chip-label">GPS</span>
          <div className={`dot${providerEnabled ? ' on' : ''}`} />
          <span className="chip-value">{providerEnabled ? 'Enabled' : 'Disabled'}</span>
        </div>
        <div className="status-chip">
          <span className="chip-label">Activity</span>
          <span className="chip-icon">{activityIcon(activity)}</span>
          <span className="chip-value">{activity}</span>
        </div>
        <div className="status-chip">
          <span className="chip-label">Odometer</span>
          <span className="chip-odometer">{(odometer / 1000).toFixed(1)}</span>
          <span className="chip-odometer-unit">km</span>
        </div>
      </div>

      {/* ── Controls card ── */}
      <div className="card">
        {/* Tracking toggle row */}
        <div className="tracking-row">
          <div>
            <div className="tracking-label">Tracking</div>
            <div className="tracking-desc">
              {tracking ? 'Location updates active' : 'Location updates paused'}
            </div>
          </div>
          <label
            className={`toggle${tracking ? ' checked' : ''}${!initialized ? ' disabled' : ''}`}
          >
            <input
              type="checkbox"
              checked={tracking}
              disabled={!initialized}
              onChange={e => handleToggleTracking(e.target.checked)}
            />
            <span className="toggle-slider">
              {/* knob rendered via ::before pseudo-element in CSS */}
            </span>
          </label>
        </div>

        {/* Motion state / pace button */}
        <div className="pace-section">
          <div className="card-title">Motion State</div>
          <button
            className={`pace-btn${isMoving ? ' moving' : ''}`}
            disabled={!tracking || !initialized}
            onClick={handleChangePace}
          >
            {isMoving ? '❚❚' : '▶'}
          </button>
          <span className="pace-state">{isMoving ? 'Moving' : 'Stationary'}</span>
        </div>
      </div>

      {/* ── Last location card ── */}
      {lastLocation && (
        <div className="card">
          <div className="card-title">Last Location</div>
          <div className="loc-row">
            <span className="loc-key">Latitude</span>
            <span className="loc-val">{lastLocation.coords.latitude.toFixed(6)}</span>
          </div>
          <div className="loc-row">
            <span className="loc-key">Longitude</span>
            <span className="loc-val">{lastLocation.coords.longitude.toFixed(6)}</span>
          </div>
          <div className="loc-row">
            <span className="loc-key">Speed</span>
            <span className="loc-val">{(lastLocation.coords.speed || 0).toFixed(1)} m/s</span>
          </div>
          <div className="loc-row">
            <span className="loc-key">Accuracy</span>
            <span className="loc-val">{lastLocation.coords.accuracy.toFixed(0)} m</span>
          </div>
        </div>
      )}

      {/* ── Get Current Position button ── */}
      <button
        className="action-btn"
        disabled={!initialized}
        onClick={handleGetCurrentPosition}
      >
        📍 Get Current Position
      </button>

    </div>
  );
}
