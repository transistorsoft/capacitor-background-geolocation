import React, { useState } from 'react';
import {
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonButton,
  IonItem,
  IonLabel,
  IonInput,
  IonToggle,
  IonText,
} from '@ionic/react';

import BackgroundGeolocation from '@transistorsoft/capacitor-background-geolocation';
import TSDialog from '../lib/Dialog';
import StepperField from './StepperField';

export type AddGeofenceCoordinate = {
  latitude: number;
  longitude: number;
};

interface Props {
  visible: boolean;
  coordinate: AddGeofenceCoordinate | null;
  vertices?: AddGeofenceCoordinate[];
  onClose: () => void;
  onAdded?: () => void;
}

const IDENTIFIER_ERROR = 'Please enter a unique identifier';
const LOITERING_DELAY_ERROR = 'Please enter a valid number (milliseconds)';

const generateId = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = 'geofence-';
  for (let i = 0; i < 10; i++) result += chars.charAt(Math.floor(Math.random() * chars.length));
  return result;
};

const AddGeofenceSheet: React.FC<Props> = ({
  visible,
  coordinate,
  vertices,
  onClose,
  onAdded,
}) => {
  const dialog = TSDialog.getInstance();
  const isPolygon = !!(vertices && vertices.length > 0);

  const [identifier, setIdentifier] = useState(generateId);
  const [identifierError, setIdentifierError] = useState('');

  const [radius, setRadius] = useState<number>(200);
  const [radiusError, setRadiusError] = useState('');

  const [notifyOnEntry, setNotifyOnEntry] = useState(true);
  const [notifyOnExit, setNotifyOnExit] = useState(true);
  const [notifyOnDwell, setNotifyOnDwell] = useState(false);

  const [loiteringDelay, setLoiteringDelay] = useState<number>(10000);
  const [loiteringDelayError, setLoiteringDelayError] = useState('');

  const validateIdentifier = (value: string) => value.trim().length > 0;
  const validateRadius = (value: number) => Number.isFinite(value) && value > 0;
  const validateLoiteringDelay = (value: number) => Number.isFinite(value) && value >= 0;

  const resetForm = () => {
    setIdentifier(generateId());
    setIdentifierError('');
    setNotifyOnEntry(true);
    setNotifyOnExit(true);
    setNotifyOnDwell(false);
    setLoiteringDelay(10000);
    setLoiteringDelayError('');
    setRadius(200);
    setRadiusError('');
  };

  const onPressAdd = async () => {
    const okId = validateIdentifier(identifier);
    const okDelay = validateLoiteringDelay(loiteringDelay);

    setIdentifierError(okId ? '' : IDENTIFIER_ERROR);
    setLoiteringDelayError(okDelay ? '' : LOITERING_DELAY_ERROR);

    if (!okId || !okDelay) return;

    if (!isPolygon && !coordinate) {
      setIdentifierError('No coordinate selected (click the map first).');
      return;
    }

    try {
      const geofence: any = {
        identifier: identifier.trim(),
        notifyOnEntry,
        notifyOnExit,
        notifyOnDwell,
        loiteringDelay,
      };

      if (isPolygon) {
        setRadiusError('');
        geofence.vertices = (vertices || []).map(v => [v.latitude, v.longitude]);
      } else {
        if (!coordinate) {
          setIdentifierError('No coordinate selected (click the map first).');
          return;
        }
        if (!validateRadius(radius)) {
          setRadiusError('Please enter a valid radius (meters)');
          return;
        }
        geofence.radius = radius;
        geofence.latitude = coordinate.latitude;
        geofence.longitude = coordinate.longitude;
      }

      await BackgroundGeolocation.addGeofence(geofence);
      dialog.playSound('ADD_GEOFENCE');
      resetForm();
      onClose();
      onAdded?.();
    } catch (e: any) {
      console.warn('[AddGeofenceSheet] addGeofence ERROR', e);
      setIdentifierError(String(e?.message || e));
    }
  };

  return (
    <IonModal
      isOpen={visible}
      onDidDismiss={() => {
        resetForm();
        onClose();
      }}
      initialBreakpoint={0.65}
      breakpoints={[0, 0.65]}
      handle={true}
    >
      <IonHeader>
        <IonToolbar>
          <IonTitle>Add Geofence</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={onPressAdd} strong>Add</IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding" style={{ '--background': '#F5F5F5' }}>
        {/* Identifier */}
        <div style={{ backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 16 }}>
          <IonLabel style={{ fontSize: 14, fontWeight: 600 }}>Identifier</IonLabel>
          <IonInput
            placeholder="Geofence identifier"
            value={identifier}
            onIonInput={e => {
              const v = e.detail.value ?? '';
              setIdentifier(v);
              setIdentifierError(validateIdentifier(v) ? '' : IDENTIFIER_ERROR);
            }}
            style={{ marginTop: 8 }}
          />
          {identifierError ? (
            <IonText color="danger"><p style={{ fontSize: 12, marginTop: 4 }}>{identifierError}</p></IonText>
          ) : null}
        </div>

        {/* Radius (circular only) */}
        {!isPolygon ? (
          <div style={{ backgroundColor: '#fff', borderRadius: 12, marginBottom: 16 }}>
            <StepperField
              label="Radius"
              unit="m"
              value={radius}
              values={[150, 200, 300, 500, 1000, 2000, 5000, 10000]}
              onValueChange={(v) => {
                setRadius(v);
                setRadiusError(validateRadius(v) ? '' : 'Please enter a valid radius (meters)');
              }}
            />
            {radiusError ? (
              <IonText color="danger"><p style={{ fontSize: 12, padding: '0 16px 8px' }}>{radiusError}</p></IonText>
            ) : null}
          </div>
        ) : null}

        {/* Notification toggles */}
        <div style={{ backgroundColor: '#fff', borderRadius: 12, marginBottom: 16 }}>
          <IonItem lines="inset">
            <IonLabel>notifyOnEntry</IonLabel>
            <IonToggle checked={notifyOnEntry} onIonChange={e => setNotifyOnEntry(e.detail.checked)} />
          </IonItem>
          <IonItem lines="inset">
            <IonLabel>notifyOnExit</IonLabel>
            <IonToggle checked={notifyOnExit} onIonChange={e => setNotifyOnExit(e.detail.checked)} />
          </IonItem>
          <IonItem lines="inset">
            <IonLabel>notifyOnDwell</IonLabel>
            <IonToggle checked={notifyOnDwell} onIonChange={e => setNotifyOnDwell(e.detail.checked)} />
          </IonItem>
          <StepperField
            label="Loitering Delay"
            unit="ms"
            value={loiteringDelay}
            values={[1000, 5000, 10000, 30000, 60000]}
            disabled={!notifyOnDwell}
            onValueChange={(v) => {
              setLoiteringDelay(v);
              setLoiteringDelayError(validateLoiteringDelay(v) ? '' : LOITERING_DELAY_ERROR);
            }}
          />
          {loiteringDelayError ? (
            <IonText color="danger"><p style={{ fontSize: 12, padding: '0 16px 8px' }}>{loiteringDelayError}</p></IonText>
          ) : null}
        </div>

        {/* Target coordinate hint */}
        {coordinate ? (
          <IonText color="medium">
            <p style={{ fontSize: 12, padding: '0 4px' }}>
              Target: {coordinate.latitude.toFixed(6)}, {coordinate.longitude.toFixed(6)}
            </p>
          </IonText>
        ) : null}
      </IonContent>
    </IonModal>
  );
};

export default AddGeofenceSheet;
