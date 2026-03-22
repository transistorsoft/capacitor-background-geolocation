import React from 'react';
import { IonInput } from '@ionic/react';

interface TextFieldProps {
  label: string;
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
}

const TextField: React.FC<TextFieldProps> = ({
  label,
  value,
  onValueChange,
  placeholder,
}) => {
  return (
    <div style={{ padding: '12px 16px 14px' }}>
      <div style={{ fontSize: 16, color: '#000', marginBottom: 8 }}>{label}</div>
      <IonInput
        value={value}
        placeholder={placeholder}
        onIonInput={e => onValueChange(e.detail.value ?? '')}
        style={{
          '--background': '#E8E8ED',
          '--border-radius': '8px',
          '--padding-start': '10px',
          '--padding-end': '10px',
          '--padding-top': '8px',
          '--padding-bottom': '8px',
          fontSize: '14px',
        }}
      />
    </div>
  );
};

export default TextField;
