import {
  IonPage,
  IonHeader,
  IonContent,
  IonIcon,
  IonTitle,
  IonToolbar,
  IonButtons,
  IonButton,
  IonRow,
  IonCol,
  IonList,
  IonListHeader,
  IonItem,
  IonItemDivider,
  IonInput,
  IonSelect,
  IonToggle,
  IonSelectOption,
  IonLabel,
  IonSpinner
} from '@ionic/react';

import React from "react";
import {
  navigate,
  close,
  walk,
  cloudUpload,
  cog,
  bug,
  radioButtonOn
} from "ionicons/icons";

import { Preferences } from '@capacitor/preferences';

import BackgroundGeolocation, {
  State,
  Subscription
} from "@transistorsoft/capacitor-background-geolocation";

import './styles.css';
import {ENV} from "../../config/ENV"
import SettingsService from "./lib/SettingsService";

/// Local cache of plugin State.
let pluginState:any = {
  enabled: false,
  isMoving: false,
  schedulerEnabled: false,
  trackingMode: 1,
  odometer: 0,
  didDeviceReboot: false,
  didLaunchInBackground: false
};

const addGeofencesConfig:any = {
  notifyOnEntry: true,
  notifyOnExit: false,
  notifyOnDwell: false,
  loiteringDelay: 10000
};

const SettingsView: React.FC = (props:any) => {

  const settingsService = SettingsService.getInstance();

  /// Geofence Testing State.

  const [isDestroyingLog, setIsDestroyingLog] = React.useState(false);
  const [isAddingGeofences, setIsAddingGeofences] = React.useState(false);
  const [isRemovingGeofences, setIsRemovingGeofences] = React.useState(false);

  const [state, setState] = React.useState(() => {  // <-- callback form for initalState
    // Build default state.
    const settings = settingsService.getPluginSettings();

    let defaultState:any = {};

    const initSettingState = (setting:any) => {
      defaultState[setting.name] = setting.defaultValue;
    }

    // First collect all the BGGeo settings and initialize default state object without values.
    settings.forEach(initSettingState);
    // Now initialize demo app settings state.
    settingsService.getApplicationSettings().forEach(initSettingState);

    // [TRICKY BUSINESS] getState fetches the current plugin values for all settings.
    // This is ASYNCHRONOUS and will complete only AFTER the initial defaultState has already
    // been returned to React.useState and the view already rendered the first time.
    BackgroundGeolocation.getState().then((state:any) => {
      pluginState = state;

      settings.forEach((setting:any) => {
        switch (setting.name) {
          case 'notificationPriority':
            defaultState[setting.name] = state.notification!.priority;
            break;
          case 'desiredAccuracy':
            defaultState[setting.name] = (state.desiredAccuracy === 0) ? BackgroundGeolocation.DESIRED_ACCURACY_HIGH : state.desiredAccuracy;
            break;
          default:
            defaultState[setting.name] = state[setting.name];
        }
      });
      // Now update the React State with current plugin State.
      setState((prevState:any) => ({...prevState, defaultState}));
    });

    return defaultState;
  });

  const onClickClose = () => {
    props.onDismiss();
  }

  const onFieldChange = (setting:any, value:any) => {
    if (setting.dataType === 'integer') {
      value = parseInt(value, 10);
    }

    if (state[setting.name] === value) { return; }

    // Update state.
    state[setting.name] = value;

    /* TODO We should be updating state like this but if we do, we get 3 onFieldChange calls
    *  on IonSelect fields.  Don't know why.
    *
    setState((prevState:any) => ({
      ...prevState, [setting.name]: value
    }));
    *
    *
    */

    const config:any = {};

    switch(setting.name) {
      case 'notificationPriority':
        const notification:any = pluginState['notification'];
        notification.priority = value;
        config['notification'] = notification;
        break;
      default:
        config[setting.name] = value;
    }

    if (setting.name === 'trackingMode') {
      // Special case for trackingMode which is toggled via .start() / .startGeofences()
      // Does not use setConfig.
      if (value === 1) {
        BackgroundGeolocation.start();
      } else {
        BackgroundGeolocation.startGeofences();
      }
    } else {
      settingsService.playSound('TEST_MODE_CLICK');
      BackgroundGeolocation.setConfig(config).then((state:State) => {
        pluginState = state;
      });
    }
  }

  const renderSettingsGroup = (group:string) => {
    return settingsService.getPluginSettings(group).map((setting:any, i:number) => {
      return buildField(setting, i, onFieldChange);
    });
  }

  const onChangeGeofence = (setting:any, value:any) => {
    if (setting.dataType === 'integer') {
      value = parseInt(value, 10);
    }
    addGeofencesConfig[setting.name] = value;
  }

  const getGeofenceTestSettings = () => {
    return settingsService.getApplicationSettings('geofence').map((setting:any, i:number) => {
      return buildField(setting, i, onChangeGeofence);
    });
  }

  const buildField = (setting:any, i:number, callback:Function) => {
    switch (setting.inputType) {
      case 'select':
        return buildSelectField(setting, i, callback);
        break;
      case 'toggle':
        return buildSwitchField(setting, i, callback);
        break;
      case 'text':
        return buildInputField(setting, i, callback);
        break;
    }
  }
  /// Render <IonInput /> Field
  const buildInputField = (setting:any, i:number, onChangeCallback:Function) => {
    return (
      <IonItem key={setting.name}>
        <IonLabel color="primary" position="stacked" mode="md">{setting.name}</IonLabel>
        <IonInput value={state[setting.name]} debounce={2000} onIonChange={(e) => onChangeCallback(setting, e.detail.value)}/>
      </IonItem>
    );
  }

  /// Render <IonToggle /> Field
  const buildSwitchField = (setting:any, i:number, onChangeCallback:Function) => {
    return (
      <IonItem key={setting.name}>
        <IonCol style={{paddingLeft:0}}>
          <IonLabel color="primary" mode="md">{setting.name}</IonLabel>
        </IonCol>
        <IonCol size="2">
          <IonToggle checked={state[setting.name]} onIonChange={(e) => onChangeCallback(setting, e.detail.checked)}/>
        </IonCol>
      </IonItem>
    );
  }

  /// Render <IonSelect /> field.
  const buildSelectField = (setting:any, i:number, onChangeCallback:Function) => {
    /// Some values take the form [{label: "My Label", value: 1}, ...]
    /// Others take the the form [1, 2, 3, ...];
    if (typeof(setting.values[0]) === 'object') {
      return (
        <IonItem key={setting.name}>
          <IonLabel color="primary" position="stacked" mode="md">{setting.name}</IonLabel>
          <IonSelect value={state[setting.name]} onIonChange={(e) => onChangeCallback(setting, e.detail.value)}>
            {setting.values.map((value:any, i:number) => (
              <IonSelectOption value={value.value}>{value.label}</IonSelectOption>
            ))}
          </IonSelect>
        </IonItem>
      );
    } else {
      return (
        <IonItem key={setting.name}>
          <IonLabel color="primary" position="stacked" mode="md">{setting.name}</IonLabel>
          <IonSelect value={state[setting.name]} onIonChange={(e) => onChangeCallback(setting, e.detail.value)}>
            {setting.values.map((value:any, i:number) => (
              <IonSelectOption value={value}>{value}</IonSelectOption>
            ))}
          </IonSelect>
        </IonItem>
      );
    }
  }

  const onClickDestroyLogs = () => {
    settingsService.confirm('Confirm', 'Destroy logs?').then((yes:boolean) => {
      if (!yes) { return; }
      setIsDestroyingLog(true);
      BackgroundGeolocation.logger.destroyLog().then(() => {
        setIsDestroyingLog(false);
        settingsService.playSound("MESSAGE_SENT");
      }).catch((error) => {
        settingsService.alert('Error', error);
        setIsDestroyingLog(false);
      });
    });
  }

  const onClickRemoveGeofences = () => {
    settingsService.confirm('Confirm', 'Remove geofences?').then((yes:boolean) => {
      if (!yes) { return; }
      setIsRemovingGeofences(true);
      BackgroundGeolocation.removeGeofences().then(() => {
        setIsRemovingGeofences(false);
        settingsService.playSound('MESSAGE_SENT');
      }).catch((error) => {
        settingsService.alert('Remove Geofences Error', error);
        setIsRemovingGeofences(false);
      })
    })
  }

  const onClickAddGeofences = () => {
    setIsAddingGeofences(true);
    const geofences = settingsService.getTestGeofences('freeway_drive', addGeofencesConfig);
    console.log(geofences);
    BackgroundGeolocation.addGeofences(geofences).then(() => {
      settingsService.playSound('ADD_GEOFENCE');
      setIsAddingGeofences(false);
    }).catch((error) => {
      setIsAddingGeofences(false);
      settingsService.alert('Add Geofences Error', error);
    })
  }

  return (
    <IonPage className="SettingsView">
      <IonHeader>
        <IonToolbar color="tertiary">
          <IonButtons slot="start">
            <IonButton onClick={onClickClose}><IonIcon icon={close} /></IonButton>
          </IonButtons>
          <IonTitle>Settings</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>
        <IonList>
          <IonListHeader mode="md" color="dark"><IonIcon icon={navigate} />&nbsp;Geolocation</IonListHeader>
          {renderSettingsGroup('geolocation')}
          <IonItemDivider />

          <IonListHeader mode="md" color="dark"><IonIcon icon={walk} />&nbsp;Activity Recognition</IonListHeader>
          {renderSettingsGroup('activity recognition')}
          <IonItemDivider />

          <IonListHeader mode="md" color="dark"><IonIcon icon={cloudUpload} />&nbsp;HTTP &amp; Persistence</IonListHeader>
          {renderSettingsGroup('http')}
          <IonItemDivider />

          <IonListHeader mode="md" color="dark"><IonIcon icon={cog} />&nbsp;Application</IonListHeader>
          {renderSettingsGroup('application')}
          <IonItemDivider />

          <IonListHeader mode="md" color="dark"><IonIcon icon={bug} />&nbsp;Logging &amp; Debug</IonListHeader>
          {renderSettingsGroup('debug')}
          <IonButton onClick={onClickDestroyLogs} color="danger" expand="full" shape="round">
            {(isDestroyingLog) ? <IonSpinner name="dots" /> : 'Destroy Logs'}
          </IonButton>
          <IonItemDivider />

          <IonListHeader mode="md" color="dark"><IonIcon icon={radioButtonOn} />&nbsp;Geofence Testing (Freeway Drive)</IonListHeader>
          <IonRow>
            <IonCol>
              <IonButton onClick={onClickRemoveGeofences} expand="full" color="danger">
                {(isRemovingGeofences) ? <IonSpinner name="dots" /> : 'Remove geofences'}
              </IonButton>
            </IonCol>
            <IonCol>
              <IonButton onClick={onClickAddGeofences} expand="full" color="primary">
              {(isAddingGeofences) ? <IonSpinner name="dots" /> : 'Add Geofences'}
              </IonButton>
            </IonCol>
          </IonRow>
          {getGeofenceTestSettings()}
        </IonList>
      </IonContent>
    </IonPage>
  )
};

export default SettingsView;
