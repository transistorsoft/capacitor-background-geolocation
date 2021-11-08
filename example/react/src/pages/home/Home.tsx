/// This is the root view of the demo app.  It acts as the application switcher and
/// registration system for demo server at tracker.transistorsoft.com
///
/// This is really just boiler-plate stuff in support of the demo app.  There's nothing
/// special to see here with-respect-to BackgroundGeolocation implementation.
///
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonButtons,
  IonButton,
  IonGrid,
  IonItem,
  IonInput,
  IonLabel,
  IonRow,
  IonCol,
  IonToggle,
  IonFooter,
  useIonModal,
  useIonAlert,
  isPlatform
} from '@ionic/react';

import React from "react";
import { useHistory, useLocation } from 'react-router-dom';

import { Storage } from '@capacitor/storage';

import BackgroundGeolocation from "@transistorsoft/capacitor-background-geolocation";

import {ENV} from "../../config/ENV";

import './Home.css';
import Registration from "./Registration";

const Home: React.FC = () => {
  const history = useHistory();

  /// State
  const [enabled, setEnabled] = React.useState(false);
  const [org, setOrg] = React.useState("");
  const [username, setUsername] = React.useState("");
  const [deviceModel, setDeviceModel] = React.useState("");
  const [hidden, setHidden] = React.useState<boolean>(true);
  const [defaultRoute, setDefaultRoute] = React.useState<string|undefined>(undefined);
  /// One-time disclosure Alert
  const [alert] = useIonAlert();
  /// Registration Modal
  const [presentRegistration, dismissRegistration] = useIonModal(Registration, {
    org,
    username,
    onDismiss: () => {
      dismissRegistration();
    },
    onRegister: (result:any) => {
      setOrg(result.orgname);
      setUsername(result.username);
      dismissRegistration();
    }
  });

  /// Shields up
  React.useEffect(() => {
    init();
  }, []);

  /// Listen to Router location changes.
  let location = useLocation();
  React.useEffect(() => {
    if (defaultRoute === undefined) { return; }

    if (defaultRoute !== location.pathname) {
      // Our route has changed.  Update state.
      setDefaultRoute(location.pathname);
    }
  }, [location]);

  /// defaultRoute listener.
  React.useEffect(() => {
    if (defaultRoute === undefined) { return; }

    Storage.set({key: 'page', value: defaultRoute});

    if (defaultRoute !== '/home') {
      // Navigating somewhere else...
      history.push(defaultRoute);
    } else {
      // If we're already here at home, no need to mess with history.
      // Just un-hide the view and reset BackgroundGeolocation.
      setHidden(false);
      BackgroundGeolocation.removeListeners();
      BackgroundGeolocation.stop();
    }
  }, [defaultRoute]);

  /// Load Auth credentials orgname and username.
  /// Load default route (eg: /hello-world, /advanced) and update state.
  const init = async () => {
    BackgroundGeolocation.getDeviceInfo().then((deviceInfo) => {
      setDeviceModel(deviceInfo.model);
    });
    const org = await Storage.get({key: 'orgname'});
    if (org.value !== null) {
      setOrg(org.value);
    }

    const username = await Storage.get({key: 'username'});
    if (username.value !== null) {
      setUsername(username.value);
    }

    if ((org.value === null) && (username.value === null)) {
      presentRegistration();
    }

    /// On app launch, we always arrive first at /home before re-directing to the
    /// currently seleted app (/hello-world or /advanced).  The Home page is "hidden"
    /// by default so we don't see a brief flash of the Home view render before
    /// re-directing to the current app.
    const page = await Storage.get({key: 'page'});
    if (page.value !== null) {
      setDefaultRoute(page.value);
    } else {
      setDefaultRoute('/home');
    }
  }

  const onClickRegister = async () => {
    presentRegistration();
  }

  const onClickNavigate = async (page:string) => {
    if (!isRegistered()) {
      return presentRegistration();
    }
    if (await willDiscloseBackgroundPermission(page)) {
      return;
    }
    setDefaultRoute(page);
  }

  const isRegistered = () => {
    return ((org !== null) && (username !== null) && (org.length > 0) && (username.length >0));
  }

  /// New Google Play Console requirements for BACKGROUND_LOCATION permission require a one-time
  /// "disclosure for background location access", just a simple Alert with only an [OK] button where
  /// you declare something "this app tracks your location in the background for these reasons X, Y and Z".
  ///
  /// See Transistor Blog for more information:
  ///   https://transistorsoft.medium.com/new-google-play-console-guidelines-for-sensitive-app-permissions-d9d2f4911353
  ///
  const willDiscloseBackgroundPermission = (page:string):Promise<boolean> => {
    return new Promise(async (resolve, reject) => {
      if (!isPlatform('android')) {
        // Will disclose for iOS devices?  NO!
        return resolve(false);
      }
      const hasDisclosedBackgroundPermission = (await Storage.get({key: 'hasDisclosedBackgroundPermission'})).value === 'true';
      resolve(!hasDisclosedBackgroundPermission);
      // If we've already disclosed, we're done here.
      if (hasDisclosedBackgroundPermission) { return; }
      // Show the one-time disclosure Alert
      alert({
        header: 'Background Location Access',
        message: 'BG Geo collects location data to enable tracking your trips to work and calculate distance travelled even when the app is closed or not in use.\n\nThis data will be uploaded to tracker.transistorsoft.com where you may view and/or delete your location history.',
        buttons: [{
          text: 'Close',
          handler: (e) => {
            // Now set a flag that we've disclosed to the user so this alert never gets shown again.
            Storage.set({key: 'hasDisclosedBackgroundPermission', value: 'true'});
            // And continue along with routing to the desired Page...
            setDefaultRoute(page);
          }
        }],
        backdropDismiss: false,  // <-- Important for Play Console review that this alert is not easily dismissed.
        cssClass: 'background-location-disclosure'
      })
    });
  }

  return (
    <IonPage className="Home">
      <IonHeader hidden={hidden}>
        <IonToolbar color="tertiary">
          <IonTitle color="dark">Background Geolocation</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent hidden={hidden} color="dark" fullscreen>
        <IonGrid>
          <IonRow>
            <IonCol>
              <h1 style={{textAlign:'center'}}>Example Applications</h1>
            </IonCol>
          </IonRow>
          <IonRow>
            <IonCol>
              <IonButton expand="full" shape="round" color="tertiary" onClick={() => onClickNavigate('/hello-world')}>Hello World</IonButton>
            </IonCol>
          </IonRow>
          <IonRow>
            <IonCol>
              <IonButton expand="full" shape="round" color="tertiary" onClick={() => onClickNavigate('/advanced')}>Advanced App</IonButton>
            </IonCol>
          </IonRow>
        </IonGrid>
      </IonContent>

      <IonFooter hidden={hidden} style={{backgroundColor: '#fff', padding:10}}>
        <p>
          These apps will post locations to Transistor Software's demo server.  You can view your tracking in the browser by visiting:
        </p>
        <p style={{textAlign: 'center', fontWeight: 'bold', fontSize:14}}>{`${ENV.TRACKER_HOST}/${org}`}</p>
        <IonItem>
          <IonLabel color="primary" style={{width:75, textAlign:'right'}}>Org: </IonLabel>
          <IonInput readonly={true} value={org} />
        </IonItem>
        <IonItem>
          <IonLabel color="primary" style={{width:75, textAlign: 'right'}} >Device ID</IonLabel>
          <IonInput readonly={true} value={deviceModel + '-' + username} />
        </IonItem>
        <IonRow style={{justifyContent: 'center'}}>
            <IonButton color="danger" size="default" onClick={onClickRegister} style={{width:150}}>Edit</IonButton>
            <IonButton size="default" style={{width:150}}><a href={`${ENV.TRACKER_HOST}/${org}`} style={{textDecoration:'none', color: '#fff'}}>View Tracking</a></IonButton>
        </IonRow>
      </IonFooter>
    </IonPage>
  );
};

export default Home;
