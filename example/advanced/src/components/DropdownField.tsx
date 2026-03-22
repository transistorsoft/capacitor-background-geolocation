import React from 'react';
import { IonItem, IonLabel, IonSelect, IonSelectOption } from '@ionic/react';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

interface DropdownFieldProps {
  label: string;
  value: any;
  items: { label: string; value: any }[];
  onValueChange: (value: any) => void;
}

const DropdownField: React.FC<DropdownFieldProps> = ({
  label,
  value,
  items,
  onValueChange,
}) => {
  return (
    <IonItem lines="none">
      <IonLabel>{label}</IonLabel>
      <IonSelect
        slot="end"
        value={value}
        interface="action-sheet"
        onIonChange={e => {
          Haptics.impact({ style: ImpactStyle.Light });
          onValueChange(e.detail.value);
        }}
      >
        {items.map((item, idx) => (
          <IonSelectOption key={`${label}:${idx}:${String(item.value)}`} value={item.value}>
            {item.label}
          </IonSelectOption>
        ))}
      </IonSelect>
    </IonItem>
  );
};

export default DropdownField;
