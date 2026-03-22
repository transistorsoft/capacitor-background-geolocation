import React from 'react';
import { IonSegment, IonSegmentButton, IonLabel } from '@ionic/react';

interface SegmentedFieldProps {
  label: string;
  value: any;
  items: { label: string; value: any }[];
  onValueChange: (value: any) => void;
}

const SegmentedField: React.FC<SegmentedFieldProps> = ({ label, value, items, onValueChange }) => {
  return (
    <div style={{ padding: '10px 16px' }}>
      <div style={{ fontSize: 13, color: '#555', marginBottom: 8 }}>{label}</div>
      <IonSegment
        value={String(value)}
        onIonChange={e => {
          const selected = items.find(item => String(item.value) === e.detail.value);
          if (selected !== undefined) onValueChange(selected.value);
        }}
      >
        {items.map(item => (
          <IonSegmentButton
            key={String(item.value)}
            value={String(item.value)}
            style={{ '--color-checked': '#000', '--indicator-color': '#fff' }}
          >
            <IonLabel style={{ fontSize: 11 }}>{item.label}</IonLabel>
          </IonSegmentButton>
        ))}
      </IonSegment>
    </div>
  );
};

export default SegmentedField;
