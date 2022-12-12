import {
  IonPage,
  IonHeader,
  IonContent,
  IonIcon,
  IonTitle,
  IonToolbar,
  IonButtons,
  IonButton,
  IonItem,
  IonInput,
  IonLabel,
  IonCard,
  useIonToast,
} from '@ionic/react';

import React from "react";
import { personAddOutline } from "ionicons/icons";
import { Preferences } from '@capacitor/preferences';

import BackgroundGeolocation, {
  Subscription,
  DeviceInfo
} from "@transistorsoft/capacitor-background-geolocation";

import {ENV} from "../../config/ENV"

// Only allow alpha-numeric usernames with '-' and '_'
const USERNAME_VALIDATOR =  /^[a-zA-Z0-9_-]*$/;

const isValid = (value:string) => {
  if (!value || (value.length == 0)) return false;
  value = value.replace(/s+/, '');
  return USERNAME_VALIDATOR.test(value);
}

const Registration: React.FC = (props:any) => {
  const [orgname, setOrgname] = React.useState(props.org || '');
  const [username, setUsername] = React.useState(props.username || '');
  const [present, dismiss] = useIonToast();

  const [deviceName, setDeviceName] = React.useState('');

  /// Render the device info.
  React.useEffect(() => {
    BackgroundGeolocation.getDeviceInfo().then((deviceInfo:DeviceInfo) => {
      setDeviceName(`${deviceInfo.manufacturer} ${deviceInfo.model}`);
    });
  }, []);

  const onClickCancel = () => {
    props.onDismiss();
  }

  const onClickRegister = async () => {
    const errors = [];

    if (!isValid(orgname)) errors.push('Organization name');
    if (!isValid(username)) errors.push('Username');

    if (errors.length > 0) {
      const msg = "Invalid " + errors.join(', ');
      present(msg, 3000);
      return false;
    }
    // Destroy existing cached token.
    await BackgroundGeolocation.destroyTransistorAuthorizationToken(ENV.TRACKER_HOST);
    // Register device with tracker.transistorsoft.com to receive a JSON Web Token (JWT).
    const token = await BackgroundGeolocation.findOrCreateTransistorAuthorizationToken(orgname, username, ENV.TRACKER_HOST);

    // Provide newly acquired auth token to the plugin.
    BackgroundGeolocation.setConfig({
      transistorAuthorizationToken: token
    });

    // Persist our credentials.
    Preferences.set({key: 'orgname', value: orgname});
    Preferences.set({key: 'username', value: username});

    // Back to /home
    props.onRegister({
      orgname: orgname,
      username: username
    });
  }

  return (
    <IonPage className="Registration">
      <IonHeader>
        <IonToolbar color="tertiary">
          <IonButtons slot="start">
            <IonButton onClick={onClickCancel}><IonIcon name="close" /></IonButton>
          </IonButtons>
          <IonTitle>Registration</IonTitle>

          <IonButtons slot="end">
            <IonButton color="primary" fill="solid" onClick={onClickRegister}>
              <IonIcon icon={personAddOutline} />&nbsp;Register</IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent>
        <IonItem lines="none" style={{marginBottom: 10}}>
          <IonLabel style={{textAlign:'center', fontSize: 20, fontWeight: 'bold', fontStyle:'italic'}}>{deviceName}</IonLabel>
        </IonItem>

        <IonItem>
          <IonLabel position="stacked" color="primary">Organization Name:</IonLabel>
          <IonInput value={orgname} onIonChange={(e) => { setOrgname(e.detail.value!)}} placeholder="Eg. company-name"/>
        </IonItem>

        <IonItem>
          <IonLabel position="stacked" color="primary">Username:</IonLabel>
          <IonInput value={username} onIonChange={(e) => { setUsername(e.detail.value!)}} placeholder="eg: Github username or initials" />
        </IonItem>

        <IonCard>
          <IonItem lines="none">
            <IonLabel className="ion-text-wrap">Please provide an Organization identifier and Username to register your device with the Demo Server.</IonLabel>
          </IonItem>
          <IonItem lines="none">
            <IonLabel> You will access your tracking results at the url:</IonLabel>
          </IonItem>
          <IonItem lines="none">
            <IonLabel color="primary" style={{textAlign: 'center', fontWeight: 'bold', fontSize:12}}>https://tracker.transistorsoft.com/{orgname}</IonLabel>
          </IonItem>
        </IonCard>
      </IonContent>
    </IonPage>
  );
}

export default Registration;