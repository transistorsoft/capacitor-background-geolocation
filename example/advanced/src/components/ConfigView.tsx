import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonButton,
  IonIcon,
  IonItemGroup,
  IonItemDivider,
  IonLabel,
  IonActionSheet,
} from '@ionic/react';
import {
  ellipsisVertical,
  closeOutline,
  navigateOutline,
  phonePortraitOutline,
  walkOutline,
  cloudUploadOutline,
  serverOutline,
  terminalOutline,
  mapOutline,
  triangleOutline,
  funnelOutline,
} from 'ionicons/icons';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

import BackgroundGeolocation, { State } from '@transistorsoft/capacitor-background-geolocation';
import { PLUGIN_SETTINGS, SettingOption } from '../config/PluginSettings';
import TSDialog from '../lib/Dialog';
import StepperField from './StepperField';
import ToggleField from './ToggleField';
import TextField from './TextField';
import DropdownField from './DropdownField';
import SegmentedField from './SegmentedField';

interface ConfigViewProps {
  visible: boolean;
  onClose: () => void;
  onRequestRegistration?: () => void;
}

const getNestedValue = (obj: any, path: string[]): any =>
  path.reduce((acc, key) => acc?.[key], obj);

const buildNestedConfig = (path: string[], value: any): any => {
  const result: any = {};
  let current = result;
  for (let i = 0; i < path.length - 1; i++) {
    current[path[i]] = {};
    current = current[path[i]];
  }
  current[path[path.length - 1]] = value;
  return result;
};

const ConfigView: React.FC<ConfigViewProps> = ({ visible, onClose, onRequestRegistration }) => {
  const dialog = TSDialog.getInstance();

  const [settings, setSettings] = useState<Record<string, any>>({});
  const [pluginState, setPluginState] = useState<State | null>(null);
  const [menuVisible, setMenuVisible] = useState(false);
  const [platform, setPlatform] = useState('');
  const fieldChangeBufferRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Initialize settings
  useEffect(() => {
    BackgroundGeolocation.getDeviceInfo().then((info: any) => {
      setPlatform(info.platform.toLowerCase());
    });
  }, []);

  useEffect(() => {
    if (!platform) return;

    const initialSettings: Record<string, any> = {};

    const platformSettings = platform === 'ios'
      ? [...PLUGIN_SETTINGS.common, ...PLUGIN_SETTINGS.ios]
      : [...PLUGIN_SETTINGS.common, ...PLUGIN_SETTINGS.android];

    platformSettings.forEach(setting => {
      initialSettings[setting.name] = setting.defaultValue;
    });

    setSettings(initialSettings);

    // Load current plugin state
    BackgroundGeolocation.getState().then((state: State) => {
      setPluginState(state);
      const currentSettings: Record<string, any> = {};
      platformSettings.forEach(setting => {
        currentSettings[setting.name] = setting.configPath
          ? getNestedValue(state, setting.configPath) ?? setting.defaultValue
          : (state as any)[setting.name] ?? setting.defaultValue;
      });
      setSettings(currentSettings);
    });
  }, [platform]);

  const onPressMenu = () => {
    Haptics.impact({ style: ImpactStyle.Heavy });
    setMenuVisible(true);
  };

  const onContextMenu = async (option: string) => {
    setMenuVisible(false);
    Haptics.impact({ style: ImpactStyle.Heavy });
    switch (option) {
      case 'tracker-authorization':
        console.log('[ConfigView] Tracker Authorization');
        onRequestRegistration?.();
        break;
      case 'remove-geofences':
        try {
          console.log('[ConfigView] Removing all geofences');
          await BackgroundGeolocation.removeGeofences();
        } catch (e) {
          console.warn('[ConfigView] removeGeofences ERROR', e);
        }
        break;
      case 'show-battery-optimizations':
        try {
          const request = await (BackgroundGeolocation as any).deviceSettings.showIgnoreBatteryOptimizations();
          console.log('showIgnoreBatteryOptimizations request:', request);
          (BackgroundGeolocation as any).deviceSettings.show(request);
        } catch (error) {
          console.warn('Error showing Ignore Battery Optimizations:', error);
        }
        break;
    }
  };

  const doSetConfig = async (config: any) => {
    console.log('[doSetConfig]', config);
    const state = await BackgroundGeolocation.setConfig(config);
    setPluginState(state);
  };

  const handleSettingChange = (setting: SettingOption, value: any) => {
    if (settings[setting.name] === value) return;

    setSettings(prev => ({
      ...prev,
      [setting.name]: value,
    }));

    const config: any = {};

    // Special case: trackingMode uses .start() / .startGeofences()
    if (setting.name === 'trackingMode') {
      console.log(`[onFieldChange] trackingMode: ${value}`);
      if (value === 1) {
        BackgroundGeolocation.start();
      } else {
        BackgroundGeolocation.startGeofences();
      }
      return;
    }

    // Special case: notificationPriority — nested under app.notification
    if (setting.name === 'notificationPriority') {
      config['app'] = {
        notification: { priority: value },
      };
    } else if (setting.configPath) {
      // Nested config path (e.g. locationFilter settings: geolocation.filter.*)
      const nested = buildNestedConfig(setting.configPath, value);
      Object.assign(config, nested);
    } else {
      // Compound config style: { [group]: { [name]: value } }
      config[setting.group] = { [setting.name]: value };
    }

    // Handle buffering for text inputs
    if (setting.inputType === 'text') {
      if (fieldChangeBufferRef.current) {
        clearTimeout(fieldChangeBufferRef.current);
      }
      fieldChangeBufferRef.current = setTimeout(() => {
        doSetConfig(config);
      }, 1000);
    } else {
      dialog.playSound('TEST_MODE_CLICK');
      doSetConfig(config);
    }
  };

  const renderField = (setting: SettingOption) => {
    const value = settings[setting.name];

    switch (setting.inputType) {
      case 'toggle':
        return (
          <ToggleField
            key={setting.name}
            label={setting.name}
            value={value ?? setting.defaultValue}
            onValueChange={(newValue) => handleSettingChange(setting, newValue)}
          />
        );

      case 'text':
        return (
          <TextField
            key={setting.name}
            label={setting.name}
            value={value ?? setting.defaultValue}
            onValueChange={(newValue) => handleSettingChange(setting, newValue)}
          />
        );

      case 'select':
        const items = setting.values?.map(v => {
          if (typeof v === 'object' && 'label' in v && 'value' in v) {
            return { label: v.label, value: v.value };
          }
          return { label: String(v), value: v };
        }) || [];

        return (
          <DropdownField
            key={setting.name}
            label={setting.name}
            value={value ?? setting.defaultValue}
            items={items}
            onValueChange={(newValue) => handleSettingChange(setting, newValue)}
          />
        );

      case 'stepper':
        return (
          <StepperField
            key={setting.name}
            label={setting.name}
            value={value ?? setting.defaultValue}
            values={setting.values as number[]}
            onValueChange={(newValue) => handleSettingChange(setting, newValue)}
          />
        );

      case 'segmented':
        const segItems = setting.values?.map(v => {
          if (typeof v === 'object' && 'label' in v && 'value' in v) {
            return { label: v.label, value: v.value };
          }
          return { label: String(v), value: v };
        }) || [];

        return (
          <SegmentedField
            key={setting.name}
            label={setting.name}
            value={value ?? setting.defaultValue}
            items={segItems}
            onValueChange={(newValue) => handleSettingChange(setting, newValue)}
          />
        );

      default:
        return null;
    }
  };

  const GROUP_ICONS: Record<string, string> = {
    geolocation:    navigateOutline,
    app:            phonePortraitOutline,
    activity:       walkOutline,
    http:           cloudUploadOutline,
    persistence:    serverOutline,
    logger:         terminalOutline,
    map:            mapOutline,
    geofence:       triangleOutline,
    locationFilter: funnelOutline,
  };

  const groupedSettings = useMemo(() => {
    if (!platform) return {};

    const platformSettings = platform === 'ios'
      ? [...PLUGIN_SETTINGS.common, ...PLUGIN_SETTINGS.ios]
      : [...PLUGIN_SETTINGS.common, ...PLUGIN_SETTINGS.android];

    const groups: Record<string, SettingOption[]> = {};

    platformSettings.forEach(setting => {
      if (!groups[setting.group]) {
        groups[setting.group] = [];
      }
      groups[setting.group].push(setting);
    });

    return groups;
  }, [platform]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (fieldChangeBufferRef.current) {
        clearTimeout(fieldChangeBufferRef.current);
      }
    };
  }, []);

  return (
    <>
      <IonModal
        isOpen={visible}
        onDidDismiss={onClose}
        className="config-view-modal"
        initialBreakpoint={0.92}
        breakpoints={[0, 0.92]}
        handleBehavior="cycle"
        handle={true}
        expandToScroll={false}
      >
        <IonHeader style={{ borderRadius: '16px 16px 0 0', overflow: 'hidden', paddingTop: 12, backgroundColor: '#F5F5F5' }}>
          <IonToolbar style={{ '--background': '#F5F5F5', '--color': '#000' }}>
            <IonTitle style={{ color: '#000' }}>Configuration</IonTitle>
            <IonButtons slot="end">
              <IonButton onClick={onPressMenu} style={{ '--color': '#000' }}>
                <IonIcon icon={ellipsisVertical} />
              </IonButton>
            </IonButtons>
          </IonToolbar>
        </IonHeader>

        <IonContent style={{ '--background': '#F5F5F5' }}>
          <p style={{
            fontSize: 12,
            color: '#8E8E93',
            paddingLeft: 20,
            paddingTop: 8,
            paddingBottom: 4,
          }}>
            Config-changes are applied immediately, in real-time
          </p>

          {Object.entries(groupedSettings).map(([groupName, groupSettings]) => (
            <div key={groupName} style={{ marginTop: 16, marginLeft: 16, marginRight: 16 }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                fontSize: 13,
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                color: '#444',
                paddingLeft: 4,
                paddingBottom: 8,
              }}>
                {GROUP_ICONS[groupName] && (
                  <IonIcon icon={GROUP_ICONS[groupName]} style={{ fontSize: 15 }} />
                )}
                {groupName}
              </div>
              <div style={{
                backgroundColor: '#FFFFFF',
                borderRadius: 12,
                overflow: 'hidden',
              }}>
                {groupSettings.map((setting, index) => (
                  <div key={setting.name}>
                    {renderField(setting)}
                    {index < groupSettings.length - 1 && (
                      <div style={{ height: 1, backgroundColor: '#E6E6E6', marginLeft: 16 }} />
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
          <div style={{ height: 32 }} />
        </IonContent>
      </IonModal>

      <IonActionSheet
        isOpen={menuVisible}
        header="Options"
        onDidDismiss={() => setMenuVisible(false)}
        buttons={[
          {
            text: 'Tracker Authorization',
            handler: () => onContextMenu('tracker-authorization'),
          },
          {
            text: 'Remove Geofences',
            handler: () => onContextMenu('remove-geofences'),
          },
          {
            text: 'Show Battery Optimizations',
            handler: () => onContextMenu('show-battery-optimizations'),
          },
          {
            text: 'Cancel',
            role: 'cancel',
          },
        ]}
      />
    </>
  );
};

export default ConfigView;
