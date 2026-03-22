import React from 'react';
import { IonItem, IonLabel, IonToggle } from '@ionic/react';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

interface ToggleFieldProps {
  label: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
}

const ToggleField: React.FC<ToggleFieldProps> = ({
  label,
  value,
  onValueChange,
}) => {
  const onToggle = (checked: boolean) => {
    Haptics.impact({ style: ImpactStyle.Light });
    onValueChange(checked);
  };

  return (
    <IonItem lines="none">
      <IonLabel>{label}</IonLabel>
      <IonToggle
        slot="end"
        checked={value}
        onIonChange={e => onToggle(e.detail.checked)}
      />
    </IonItem>
  );
};

export default ToggleField;
