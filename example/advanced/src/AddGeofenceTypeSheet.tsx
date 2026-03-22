import React from 'react';
import { IonActionSheet } from '@ionic/react';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

export type AddGeofenceType = 'circular' | 'polygon' | 'cancel';

interface Props {
  visible: boolean;
  onClose: () => void;
  onSelect: (type: AddGeofenceType) => void;
}

const AddGeofenceTypeSheet: React.FC<Props> = ({ visible, onClose, onSelect }) => {
  const handleSelect = (type: AddGeofenceType) => {
    Haptics.impact({ style: ImpactStyle.Medium });
    onSelect(type);
  };

  return (
    <IonActionSheet
      isOpen={visible}
      header="Add Geofence"
      onDidDismiss={onClose}
      buttons={[
        {
          text: 'Circular',
          handler: () => handleSelect('circular'),
        },
        {
          text: 'Polygon',
          handler: () => handleSelect('polygon'),
        },
        {
          text: 'Cancel',
          role: 'cancel',
          handler: () => handleSelect('cancel'),
        },
      ]}
    />
  );
};

export default AddGeofenceTypeSheet;
