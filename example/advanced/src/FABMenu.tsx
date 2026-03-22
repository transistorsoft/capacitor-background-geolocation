import React, { useRef, useState, useEffect } from 'react';
import {
  IonFab,
  IonFabButton,
  IonFabList,
  IonIcon,
} from '@ionic/react';
import {
  add,
  close,
  trashOutline,
  cloudUploadOutline,
  refreshOutline,
  locationOutline,
  shieldCheckmarkOutline,
  mailOutline,
  settingsOutline,
} from 'ionicons/icons';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { Preferences } from '@capacitor/preferences';
import { Dialog } from '@capacitor/dialog';

import BackgroundGeolocation from '@transistorsoft/capacitor-background-geolocation';
import TSDialog from './lib/Dialog';

const EMAIL_LOG_STORAGE_KEY = '@transistor:email_log_address';

interface FABMenuProps {
  onMenuItemPress?: (action: string) => void;
}

const FABMenu: React.FC<FABMenuProps> = ({ onMenuItemPress }) => {
  const dialog = TSDialog.getInstance();
  const fabRef = useRef<HTMLIonFabElement>(null);

  const [isSyncing, setIsSyncing] = useState(false);
  const watchSubscriptionRef = useRef<{ remove: () => void } | null>(null);
  const [isWatchingPosition, setIsWatchingPosition] = useState(false);

  const [emailLogSending, setEmailLogSending] = useState(false);

  useEffect(() => {
    return () => {
      if (watchSubscriptionRef.current !== null) {
        watchSubscriptionRef.current.remove();
        watchSubscriptionRef.current = null;
      }
    };
  }, []);

  const handleMenuItemPress = async (action: string) => {
    console.log(`[FABMenu] handleMenuItemPress: ${action}`);
    Haptics.impact({ style: ImpactStyle.Heavy });
    // Close the FAB list before dispatching action
    fabRef.current?.close();

    if (onMenuItemPress) {
      onMenuItemPress(action);
    }

    switch (action) {
      case 'destroyLocations':
        destroyLocations();
        break;
      case 'sync':
        sync();
        break;
      case 'resetOdometer':
        resetOdometer();
        break;
      case 'watchPosition':
        toggleWatchPosition();
        break;
      case 'requestPermission':
        const providerState = await BackgroundGeolocation.getProviderState();
        dialog.alert(
          'Request Location Permission',
          `Current authorization status: ${providerState.status}`,
          [
            { text: 'When in Use', handler: () => requestPermission('WhenInUse') },
            { text: 'Always', handler: () => requestPermission('Always') },
          ]
        );
        break;
      case 'emailLog':
        openEmailLogDialog();
        break;
      case 'config':
        console.log('[FABMenu] Config');
        break;
    }
  };

  // BackgroundGeolocation.destroyLocations()
  const destroyLocations = async () => {
    try {
      const count = await BackgroundGeolocation.getCount();
      if (!count) {
        dialog.toast('Locations database is empty');
        return;
      }
      const confirmed = await dialog.confirm('Confirm Destroy Locations', `Destroy ${count} records?`);
      if (!confirmed) return;
      try {
        await BackgroundGeolocation.destroyLocations();
        console.log('[FABMenu] Destroy locations complete');
      } catch (e) {
        console.warn('[FABMenu] Destroy locations error:', e);
        dialog.toast('Destroy locations error: ' + String(e));
      }
    } catch (e) {
      console.warn('[FABMenu] getCount error:', e);
      dialog.toast('Destroy locations error: ' + String(e));
    }
  };

  // BackgroundGeolocation.sync()
  const sync = async () => {
    try {
      if (isSyncing) {
        console.log('[FABMenu] Sync already in progress (ignored)');
        return;
      }
      const count = await BackgroundGeolocation.getCount();
      if (!count) {
        dialog.toast('Locations database is empty');
        return;
      }
      const confirmed = await dialog.confirm('Confirm Sync', `Sync ${count} records?`);
      if (!confirmed) return;
      try {
        setIsSyncing(true);
        await BackgroundGeolocation.sync();
        console.log('[FABMenu] Sync complete');
      } catch (e) {
        console.warn('[FABMenu] Sync error:', e);
        dialog.toast('Sync error: ' + String(e));
      } finally {
        setIsSyncing(false);
      }
    } catch (e) {
      console.warn('[FABMenu] getCount/sync error:', e);
      dialog.toast('Sync error: ' + String(e));
    }
  };

  // BackgroundGeolocation.resetOdometer()
  const resetOdometer = async () => {
    try {
      await BackgroundGeolocation.setOdometer(0);
      dialog.toast('Reset odometer success');
    } catch (error) {
      console.warn('[FABMenu] Reset Odometer error:', error);
    }
  };

  // BackgroundGeolocation.watchPosition()
  const toggleWatchPosition = () => {
    if (watchSubscriptionRef.current !== null) {
      console.log('[FABMenu] stop watchPosition');
      watchSubscriptionRef.current.remove();
      watchSubscriptionRef.current = null;
      setIsWatchingPosition(false);
      return;
    }
    console.log('[FABMenu] start watchPosition');
    watchSubscriptionRef.current = BackgroundGeolocation.watchPosition(
      { timeout: 30000, interval: 1000, persist: false },
      (location) => {
        console.log('[watchPosition]', location.coords.latitude, location.coords.longitude);
      },
      (error) => {
        console.warn('[watchPosition] ERROR:', error);
      }
    );
    setIsWatchingPosition(true);
  };

  // BackgroundGeolocation.requestPermission()
  const requestPermission = async (request: 'WhenInUse' | 'Always') => {
    await BackgroundGeolocation.setConfig({
      locationAuthorizationRequest: request,
    });
    try {
      const status = await BackgroundGeolocation.requestPermission();
      console.log(`[requestPermission] status: ${status}`);
      dialog.alert('Request Permission Result', `Authorization status: ${status}`);
    } catch (error) {
      console.warn('[FABMenu] requestPermission error:', error);
    }
  };

  // Email log — uses native Dialog.prompt to avoid transparency issues with map overlay
  const openEmailLogDialog = async () => {
    let defaultEmail = '';
    try {
      const { value: cached } = await Preferences.get({ key: EMAIL_LOG_STORAGE_KEY });
      if (cached) defaultEmail = cached;
    } catch (e) {
      console.warn('[FABMenu] Failed to load cached emailLog address:', e);
    }

    const { value: email, cancelled } = await Dialog.prompt({
      title: 'Email Log',
      message: 'Enter an email address to receive the debug log.',
      inputPlaceholder: 'you@example.com',
      inputText: defaultEmail,
      okButtonTitle: 'Send',
      cancelButtonTitle: 'Cancel',
    });

    if (cancelled || !email?.trim()) return;

    setEmailLogSending(true);
    try {
      try {
        await Preferences.set({ key: EMAIL_LOG_STORAGE_KEY, value: email.trim() });
      } catch (e) {
        console.warn('[FABMenu] Failed to cache emailLog address:', e);
      }
      await BackgroundGeolocation.logger.emailLog(email.trim());
    } catch (e) {
      console.warn('[FABMenu] Email Log error:', e);
      dialog.toast('Email Log error: ' + String(e));
    } finally {
      setEmailLogSending(false);
    }
  };

  return (
    <>
      <IonFab ref={fabRef} vertical="bottom" horizontal="end" slot="fixed" style={{ bottom: 16, right: 16 }}>
        <IonFabButton
          color="warning"
          style={{ '--background': '#FFD500', '--color': '#000' }}
          onClick={() => Haptics.impact({ style: ImpactStyle.Heavy })}
        >
          <IonIcon icon={add} />
        </IonFabButton>
        <IonFabList side="top">
          <IonFabButton
            onClick={() => handleMenuItemPress('config')}
            style={{ '--background': '#FFD500', '--color': '#000' }}
          >
            <IonIcon icon={settingsOutline} />
          </IonFabButton>
          <IonFabButton
            onClick={() => handleMenuItemPress('emailLog')}
            style={{ '--background': '#FFD500', '--color': '#000' }}
          >
            <IonIcon icon={mailOutline} />
          </IonFabButton>
          <IonFabButton
            onClick={() => handleMenuItemPress('requestPermission')}
            style={{ '--background': '#FFD500', '--color': '#000' }}
          >
            <IonIcon icon={shieldCheckmarkOutline} />
          </IonFabButton>
          <IonFabButton
            onClick={() => handleMenuItemPress('watchPosition')}
            style={{ '--background': '#FFD500', '--color': '#000' }}
          >
            <IonIcon icon={locationOutline} />
          </IonFabButton>
          <IonFabButton
            onClick={() => handleMenuItemPress('resetOdometer')}
            style={{ '--background': '#FFD500', '--color': '#000' }}
          >
            <IonIcon icon={refreshOutline} />
          </IonFabButton>
          <IonFabButton
            onClick={() => handleMenuItemPress('sync')}
            style={{ '--background': '#FFD500', '--color': '#000' }}
          >
            <IonIcon icon={cloudUploadOutline} />
          </IonFabButton>
          <IonFabButton
            onClick={() => handleMenuItemPress('destroyLocations')}
            style={{ '--background': '#FF6B6B' }}
          >
            <IonIcon icon={trashOutline} color="light" />
          </IonFabButton>
        </IonFabList>
      </IonFab>

    </>
  );
};

export default FABMenu;
