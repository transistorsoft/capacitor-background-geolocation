/// View for adding a custom Geofence.
/// This view is activated by long-pressing on the Map.
///

import {
  IonPage,
  IonHeader,
  IonContent,
  IonIcon,
  IonTitle,
  IonToolbar,
  IonButtons,
  IonButton,
  IonSelect,
  IonSelectOption,
  IonItem,
  IonInput,
  IonToggle,
  IonLabel,
} from '@ionic/react';

import React from "react";

import { 
  add as iconAdd,
  close as iconClose
} from "ionicons/icons";

import BackgroundGeolocation from "@transistorsoft/capacitor-background-geolocation";
import SettingsService from "./lib/SettingsService";
import './styles.css';

const validate = (value:string) => {
  return (value !== null) && (value.length > 0);
}

const GeofenceView: React.FC = (props:any) => {
  const settingsService = SettingsService.getInstance();

  /// State
  const [identifier, setIdentifier] = React.useState('');
  const [radius, setRadius] = React.useState(200);
  const [notifyOnEntry, setNotifyOnEntry] = React.useState(true);
  const [notifyOnExit, setNotifyOnExit] = React.useState(true);
  const [notifyOnDwell, setNotifyOnDwell] = React.useState(false);
  const [loiteringDelay, setLoiteringDelay] = React.useState('10000');
  const [isPolygon, setIsPolygon] = React.useState(false);

  React.useEffect(() => {
    console.log('- props: ', props);
    setIsPolygon(props.vertices.length > 0);
  }, []);
  

  /// [Add Geofence] button-handler.
  const onClickAdd = () => {
    if (!validate(identifier)) {
      settingsService.toast('Identifier is required');
      return;
    } else if (!notifyOnEntry && !notifyOnExit && !notifyOnDwell) {
      settingsService.toast('You must select at least one geofence transition');
      return;
    }

    if (isPolygon) {
      // 1.  Polygon Geofence
      BackgroundGeolocation.addGeofence({
        identifier: identifier,
        vertices: props.vertices,
        notifyOnEntry: notifyOnEntry,
        notifyOnExit: notifyOnExit,
        notifyOnDwell: notifyOnDwell,
        loiteringDelay: parseInt(loiteringDelay, 10)
      }).then((result) => {
        settingsService.playSound('ADD_GEOFENCE');
        props.onDismiss();
      }).catch((error) => {
        settingsService.alert('Add Geofence Error', error);
      })
    } else {
      // 2. Circular Geofence.
      BackgroundGeolocation.addGeofence({
        identifier: identifier,
        latitude: props.coordinate.latitude,
        longitude: props.coordinate.longitude,
        radius: radius,
        notifyOnEntry: notifyOnEntry,
        notifyOnExit: notifyOnExit,
        notifyOnDwell: notifyOnDwell,
        loiteringDelay: parseInt(loiteringDelay, 10)
      }).then((result) => {
        settingsService.playSound('ADD_GEOFENCE');
        props.onDismiss();
      }).catch((error) => {
        settingsService.alert('Add Geofence Error', error);
      })  
    }    
  }

  const renderRadiusField = () => {
    return (!isPolygon) ? (<IonItem>
      <IonLabel position="stacked" color="primary">Radius:</IonLabel>
      <IonSelect value={radius} onIonChange={(e) => setRadius(e.detail.value)}>
        <IonSelectOption value={150}>150</IonSelectOption>
        <IonSelectOption value={200}>200</IonSelectOption>
        <IonSelectOption value={500}>500</IonSelectOption>
        <IonSelectOption value={1000}>1000</IonSelectOption>
        <IonSelectOption value={2000}>2000</IonSelectOption>
        <IonSelectOption value={5000}>5000</IonSelectOption>
        <IonSelectOption value={10000}>10000</IonSelectOption>
      </IonSelect>
    </IonItem>) : null;
  }

  return (
    <IonPage className="GeofenceView">
      <IonHeader>
        <IonToolbar color="tertiary">
          <IonButtons slot="start">
            <IonButton onClick={props.onDismiss}><IonIcon icon={iconClose} /></IonButton>
          </IonButtons>
          <IonTitle>Add Geofence</IonTitle>

          <IonButtons slot="end">
            <IonButton color="primary" fill="solid" onClick={onClickAdd}>Save</IonButton>                    
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent>
        <IonItem>
          <IonLabel position="stacked" color="primary">Identifier:</IonLabel>
          <IonInput value={identifier} placeholder="Unique geofence identifier" onIonChange={(e:any) => setIdentifier(e.detail.value)}/>
        </IonItem>

        {renderRadiusField()}

        <IonItem>
          <IonLabel color="primary">notifyOnEntry:</IonLabel>
          <IonToggle checked={notifyOnEntry} onIonChange={(e:any) => setNotifyOnEntry(e.detail.checked)} />
        </IonItem>

        <IonItem>
          <IonLabel color="primary">notifyOnExit:</IonLabel>
          <IonToggle checked={notifyOnExit} onIonChange={(e:any) => setNotifyOnExit(e.detail.checked)} />
        </IonItem>

        <IonItem>
          <IonLabel color="primary">notifyOnDwell:</IonLabel>
          <IonToggle checked={notifyOnDwell} onIonChange={(e:any) => setNotifyOnDwell(e.detail.checked)} />
        </IonItem>

        <IonItem>
          <IonLabel position="stacked" color="primary">loiteringDelay:</IonLabel>
          <IonInput value={loiteringDelay} placeholder="Time in milliseconds before notifyOnDwell transition fires." onIonChange={(e:any) => setIdentifier(e.detail.value)}/>
        </IonItem>

      </IonContent>
    </IonPage>
  )
};

export default GeofenceView;
