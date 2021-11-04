// TODO css:  import './ExploreContainer.css';

import {
  IonFab,
  IonFabButton,
  IonFabList,
  IonIcon,
  IonSpinner,
  useIonModal
} from '@ionic/react';

import React from "react";

import { trash, add, cog, lockOpenOutline, lockOpen, speedometer, mail, cloudUpload } from "ionicons/icons";

import BackgroundGeolocation from "@transistorsoft/capacitor-background-geolocation";

import './styles.css';
import SettingsView from "./SettingsView";
import SettingsService from "./lib/SettingsService";

interface ContainerProps { }

const FABMenu: React.FC<ContainerProps> = (props:any) => {

  const settingsService = SettingsService.getInstance();

  const [open, setOpen] = React.useState(false);
  const [isResettingOdometer, setIsResettingOdometer] = React.useState(false);
  const [isSyncing, setIsSyncing] = React.useState(false);
  const [isDestroyingLocations, setIsDestroyingLocations] = React.useState(false);

  const [presentSettings, dismissSettings] = useIonModal(SettingsView, {
    onDismiss: () => {
      settingsService.playSound('CLOSE');
      dismissSettings();
    }
  });

  const onClickMainMenu = () => {
    if (!open) {
      settingsService.playSound('OPEN');
    } else {
      settingsService.playSound('CLOSE');
    }
    setOpen(!open);
  }

  const showSettings = () => {
    setOpen(false);
    settingsService.playSound('OPEN');
    presentSettings();
  }

  const requestPermission = async () => {
    setOpen(false);
    const providerState = await BackgroundGeolocation.getProviderState();
    settingsService.alert("Request Location Permission", `Current authorization status: ${providerState.status}`, [
      {text: 'When in Use', handler: () => {doRequestPermission('WhenInUse')}},
      {text: 'Always', handler: () => {doRequestPermission('Always')}},
    ]);
  }

  const doRequestPermission = async (request:any) => {
    await BackgroundGeolocation.setConfig({locationAuthorizationRequest: request});
    const status = await BackgroundGeolocation.requestPermission();
    console.log(`[requestPermission] status: ${status}`);
    settingsService.alert("Request Permission Result", `Authorization status: ${status}`);
  }

  const resetOdometer = () => {
    setOpen(false);
    setIsResettingOdometer(true);
    BackgroundGeolocation.setOdometer(0).then(location => {
      setIsResettingOdometer(false);
      if (props.onResetOdometer) {
        props.onResetOdometer(location);
      }
      settingsService.toast('Reset odometer success');
    }).catch(error => {
      setIsResettingOdometer(false);
      settingsService.toast('Reset odometer failure: ' + error);
    });
  }

  const emailLog = async () => {
    setOpen(false);
    try {
      let email = await settingsService.getEmail();
      const yes = await settingsService.yesNo('Confirm', `Use email ${email}?`);
      if (!yes) {
        settingsService.set('email', undefined);
        emailLog();

        return;
      }
      BackgroundGeolocation.logger.emailLog(email);
    } catch(error) {
      console.error(error);
    }
  }

  const sync = async () => {
    setOpen(false);
    const count = await BackgroundGeolocation.getCount();
    if (!count) {
      settingsService.toast('Locations database is empty', 1000);
      return;
    }

    settingsService.confirm('Confirm Upload', `Upload ${count} records?`).then((confirm:boolean) => {
      if (!confirm) { return; }
      setIsSyncing(true);
      BackgroundGeolocation.sync().then((rs) => {
        settingsService.playSound('MESSAGE_SENT');
        setIsSyncing(false);
      }).catch((error:string) => {
        settingsService.toast('Sync error: ' + error);
        setIsSyncing(false);
      });
    });
  }

  const destroyLocations = async () => {
    setOpen(false);
    const count = await BackgroundGeolocation.getCount();
    if (!count) {
      settingsService.toast('Locations database is empty', 1000);
      return;
    }

    settingsService.confirm('Confirm Delete', 'Destroy ' + count + ' records?').then((confirm:boolean) => {
      if (!confirm) { return; }
      setIsDestroyingLocations(true);
      BackgroundGeolocation.destroyLocations().then(() => {
        setIsDestroyingLocations(false);
        settingsService.playSound('MESSAGE_SENT');
        settingsService.toast('Destroyed ' + count + ' records');
      }).catch((error:string) => {
        setIsDestroyingLocations(false);
        settingsService.toast('Destroy locations error: ' + error, 'LONG');
      });
    });
  }

  return (
    <IonFab slot="fixed" vertical="bottom" horizontal="end">
      <IonFabButton color="tertiary" onClick={onClickMainMenu} activated={open}>
        <IonIcon icon={add} />
      </IonFabButton>
      <IonFabList side="top">
        <IonFabButton onClick={showSettings} color="tertiary">
          <IonIcon icon={cog} />
        </IonFabButton>
        <IonFabButton onClick={requestPermission} color="tertiary">
          <IonIcon icon={lockOpenOutline} />
        </IonFabButton>
        <IonFabButton onClick={resetOdometer} color="tertiary">
          {(isResettingOdometer) ? <IonSpinner name="dots" /> : <IonIcon icon={speedometer} />}
        </IonFabButton>
        <IonFabButton onClick={emailLog} color="tertiary">
          <IonIcon icon={mail} />
        </IonFabButton>
        <IonFabButton onClick={sync} color="tertiary">
          {(isSyncing) ? <IonSpinner name="dots" /> : <IonIcon icon={cloudUpload} />}
        </IonFabButton>
        <IonFabButton onClick={destroyLocations} color="tertiary">
          {(isDestroyingLocations) ? <IonSpinner name="dots" /> : <IonIcon icon={trash} />}
        </IonFabButton>

      </IonFabList>
    </IonFab>
  );
};

export default FABMenu;
