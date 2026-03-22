import React from 'react';
import { IonItem, IonLabel, IonIcon } from '@ionic/react';
import { remove, add } from 'ionicons/icons';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

const stepperBtn: React.CSSProperties = {
  width: 36,
  height: 36,
  borderRadius: 8,
  backgroundColor: '#E8E8ED',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  border: 'none',
  cursor: 'pointer',
  WebkitTapHighlightColor: 'transparent',
};

const stepperBtnDisabled: React.CSSProperties = {
  ...stepperBtn,
  backgroundColor: '#F4F4F5',
  opacity: 0.5,
  cursor: 'default',
};

interface StepperFieldProps {
  label: string;
  value: number;
  unit?: string;
  onValueChange: (value: number) => void;
  values?: number[];
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
}

const StepperField: React.FC<StepperFieldProps> = ({
  label,
  value,
  unit = '',
  onValueChange,
  values,
  min,
  max,
  step = 1,
  disabled = false,
}) => {
  if (values) {
    const currentIndex = values.indexOf(value);

    const handleDecrement = () => {
      if (disabled || currentIndex <= 0) return;
      Haptics.impact({ style: ImpactStyle.Light });
      onValueChange(values[currentIndex - 1]);
    };

    const handleIncrement = () => {
      if (disabled || currentIndex >= values.length - 1) return;
      Haptics.impact({ style: ImpactStyle.Light });
      onValueChange(values[currentIndex + 1]);
    };

    const canDecrement = !disabled && currentIndex > 0;
    const canIncrement = !disabled && currentIndex < values.length - 1;

    return (
      <IonItem lines="none" style={{ opacity: disabled ? 0.5 : 1 }}>
        <IonLabel>{label}: {value} {unit}</IonLabel>
        <div style={{ display: 'flex', gap: 8 }} slot="end">
          <button
            style={canDecrement ? stepperBtn : stepperBtnDisabled}
            disabled={!canDecrement}
            onClick={handleDecrement}
          >
            <IonIcon icon={remove} style={{ fontSize: 18, color: canDecrement ? '#000' : '#ccc' }} />
          </button>
          <button
            style={canIncrement ? stepperBtn : stepperBtnDisabled}
            disabled={!canIncrement}
            onClick={handleIncrement}
          >
            <IonIcon icon={add} style={{ fontSize: 18, color: canIncrement ? '#000' : '#ccc' }} />
          </button>
        </div>
      </IonItem>
    );
  }

  // Step-based increment/decrement
  const handleDecrement = () => {
    const newValue = value - step;
    if (min === undefined || newValue >= min) {
      onValueChange(newValue);
    }
  };

  const handleIncrement = () => {
    const newValue = value + step;
    if (max === undefined || newValue <= max) {
      onValueChange(newValue);
    }
  };

  const canDecrement = !disabled && (min === undefined || value > min);
  const canIncrement = !disabled && (max === undefined || value < max);

  return (
    <IonItem lines="none" style={{ opacity: disabled ? 0.5 : 1 }}>
      <IonLabel>{label}: {value} {unit}</IonLabel>
      <div style={{ display: 'flex', gap: 8 }} slot="end">
        <button
          style={canDecrement ? stepperBtn : stepperBtnDisabled}
          disabled={!canDecrement}
          onClick={handleDecrement}
        >
          <IonIcon icon={remove} style={{ fontSize: 18, color: canDecrement ? '#000' : '#ccc' }} />
        </button>
        <button
          style={canIncrement ? stepperBtn : stepperBtnDisabled}
          disabled={!canIncrement}
          onClick={handleIncrement}
        >
          <IonIcon icon={add} style={{ fontSize: 18, color: canIncrement ? '#000' : '#ccc' }} />
        </button>
      </div>
    </IonItem>
  );
};

export default StepperField;
