import React, { useState, useEffect, useCallback } from 'react';
import {
  IonModal,
  IonContent,
  IonItem,
  IonLabel,
  IonInput,
  IonButton,
  IonText,
} from '@ionic/react';
import { Preferences } from '@capacitor/preferences';
import { Clipboard } from '@capacitor/clipboard';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import BackgroundGeolocation from '@transistorsoft/capacitor-background-geolocation';
import { ENV } from './config/ENV';

interface Props {
  visible: boolean;
  savedOrg?: string;
  savedUsername?: string;
  onComplete: (org: string, username: string) => void;
}

const RegistrationModal: React.FC<Props> = ({ visible, savedOrg = '', savedUsername = '', onComplete }) => {
  const [organization, setOrganization] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const usernameInputRef = React.useRef<HTMLIonInputElement>(null);

  const loadDefaultsFromStorage = useCallback(async () => {
    try {
      const [{ value: storedOrg }, { value: storedUser }] = await Promise.all([
        Preferences.get({ key: '@transistor_org' }),
        Preferences.get({ key: '@transistor_username' }),
      ]);
      if (storedOrg) setOrganization(storedOrg);
      if (storedUser) setUsername(storedUser);
    } catch (e) {
      console.warn('[RegistrationModal] Failed to load defaults from Preferences:', e);
    }
  }, []);

  useEffect(() => {
    if (visible) {
      if (savedOrg) setOrganization(savedOrg);
      if (savedUsername) setUsername(savedUsername);
      loadDefaultsFromStorage();
    }
  }, [visible, savedOrg, savedUsername, loadDefaultsFromStorage]);

  const handleRegister = async () => {
    setLoading(true);

    try {
      // Ensure any current cached token is destroyed.
      await BackgroundGeolocation.destroyTransistorAuthorizationToken(ENV.TRACKER_HOST);

      // NOTE: findOrCreateTransistorAuthorizationToken is used here only to sync data with the
      // Transistor Software demo server (https://tracker.transistorsoft.com) so you can see your
      // tracking data on a live map.  It is NOT a required part of the core SDK.  In your own app
      // you would simply configure { url: 'https://your.server.com/locations' } instead.
      const token = await BackgroundGeolocation.findOrCreateTransistorAuthorizationToken(
        organization,
        username,
        ENV.TRACKER_HOST,
      );

      await Promise.all([
        Preferences.set({ key: '@transistor_registered', value: 'true' }),
        Preferences.set({ key: '@transistor_org', value: organization }),
        Preferences.set({ key: '@transistor_username', value: username }),
      ]);

      await BackgroundGeolocation.setConfig({
        transistorAuthorizationToken: token,
      });

      setLoading(false);
      onComplete(organization, username);
    } catch (e) {
      console.warn('[RegistrationModal] Registration error:', e);
      setLoading(false);
    }
  };

  return (
    <IonModal isOpen={visible} backdropDismiss={false} className="registration-modal">
      <IonContent>
        <div className="reg-header">
          <img src="/transistor-logo.svg" alt="Transistor Software" className="reg-logo" />
          <IonText>
            <p className="reg-subtitle">Register to view live tracking results</p>
          </IonText>
        </div>

        <div className="reg-info-box">
          <IonText>
            <p className="reg-info-text">
              This demo app posts data to Transistor Software's demo server so you can view live tracking results:
            </p>
            <p className="reg-info-url" onClick={async () => {
              const url = `${ENV.TRACKER_HOST}/${organization || 'organization'}`;
              await Clipboard.write({ string: url });
              Haptics.impact({ style: ImpactStyle.Light });
            }}>
              {ENV.TRACKER_HOST}/{organization || 'organization'}
            </p>
          </IonText>
        </div>

        <IonItem>
          <IonLabel position="stacked">
            Organization
          </IonLabel>
          <IonInput
            value={organization}
            placeholder="Enter organization name"
            onIonInput={e => setOrganization(e.detail.value ?? '')}
            autocapitalize="words"
            enterkeyhint="next"
            onKeyDown={e => {
              if (e.key === 'Enter') {
                e.preventDefault();
                usernameInputRef.current?.setFocus();
              }
            }}
          />
        </IonItem>

        <IonItem>
          <IonLabel position="stacked">
            Username
          </IonLabel>
          <IonInput
            ref={usernameInputRef}
            value={username}
            placeholder="Enter username"
            onIonInput={e => setUsername(e.detail.value ?? '')}
            autocapitalize="off"
            enterkeyhint="done"
            onKeyDown={e => {
              if (e.key === 'Enter') {
                e.preventDefault();
                (document.activeElement as HTMLElement)?.blur();
              }
            }}
          />
        </IonItem>

        <IonButton
          expand="block"
          onClick={handleRegister}
          disabled={!organization || !username || loading}
        >
          {loading ? 'Registering...' : 'Register'}
        </IonButton>
      </IonContent>
    </IonModal>
  );
};

export default RegistrationModal;
