import BackgroundGeolocation from '@transistorsoft/capacitor-background-geolocation';

export interface SettingOption {
  name: string;
  group: string;
  dataType: 'string' | 'integer' | 'boolean';
  inputType: 'text' | 'select' | 'toggle' | 'stepper' | 'segmented';
  defaultValue: any;
  values?: (number | string | boolean | { label: string; value: any })[];
  /** Dot-path into the BGGeo state/config for nested settings (e.g. locationFilter) */
  configPath?: string[];
}

export interface PluginSettings {
  common: SettingOption[];
  ios: SettingOption[];
  android: SettingOption[];
}

export const GEOFENCE_RADIUS_OPTIONS: Record<string, number> = {
  "100": 100,
  "150": 150,
  "200": 200,
  "300": 300,
  "500": 500,
  "1000": 1000
};

export const GEOFENCE_LOITERING_DELAY_OPTIONS: Record<string, number> = {
  "0": 0,
  "10000": 10000,
  "30000": 30000,
  "60000": 60000
};

export const APP_SETTINGS: SettingOption[] = [
  {name: 'radius', group: 'geofence', dataType: 'integer', inputType: 'select', defaultValue: 200, values: [100, 150, 200, 500, 1000]},
  {name: 'email', group: 'application', dataType: 'string', inputType: 'text', defaultValue: ''},
  {name: 'notifyOnEntry', group: 'geofence', dataType: 'boolean', inputType: 'toggle', defaultValue: true},
  {name: 'notifyOnExit', group: 'geofence', dataType: 'boolean', inputType: 'toggle', defaultValue: false},
  {name: 'notifyOnDwell', group: 'geofence', dataType: 'boolean', inputType: 'toggle', defaultValue: false},
  {name: 'loiteringDelay', group: 'geofence', dataType: 'integer', inputType: 'select', defaultValue: 0, values: [0, 1000, 5000, 10000, 30000, 60000, 300000]},
  {name: 'hideMarkers', group: 'map', dataType: 'boolean', inputType: 'toggle', defaultValue: false},
  {name: 'hidePolyline', group: 'map', dataType: 'boolean', inputType: 'toggle', defaultValue: false},
  {name: 'hideGeofenceHits', group: 'map', dataType: 'boolean', inputType: 'toggle', defaultValue: false},
  {name: 'followsUserLocation', group: 'map', dataType: 'boolean', inputType: 'toggle', defaultValue: true},
];

export const PLUGIN_SETTINGS: PluginSettings = {
  common: [
    // Geolocation
    {name: 'trackingMode', group: 'geolocation', dataType: 'integer', inputType: 'select', defaultValue: 1, values: [{label: 'Geofences only', value: 0}, {label: 'Location + Geofences', value: 1}]},
    {name: 'desiredAccuracy', group: 'geolocation', dataType: 'integer', inputType: 'select', values: [
      {label: 'Navigation', value: BackgroundGeolocation.DESIRED_ACCURACY_NAVIGATION},
      {label: 'High', value: BackgroundGeolocation.DESIRED_ACCURACY_HIGH},
      {label: 'Medium', value: BackgroundGeolocation.DESIRED_ACCURACY_MEDIUM},
      {label: 'Low', value: BackgroundGeolocation.DESIRED_ACCURACY_LOW},
      {label: 'VeryLow', value: BackgroundGeolocation.DESIRED_ACCURACY_VERY_LOW},
      {label: 'Lowest', value: BackgroundGeolocation.DESIRED_ACCURACY_LOWEST}
    ], defaultValue: BackgroundGeolocation.DESIRED_ACCURACY_NAVIGATION },
    {name: 'distanceFilter', group: 'geolocation', dataType: 'integer', inputType: 'stepper', values: [0, 10, 20, 50, 100, 500], defaultValue: 20 },
    {name: 'disableElasticity', group: 'geolocation', dataType: 'boolean', inputType: 'toggle', values: [true, false], defaultValue: false},
    {name: 'elasticityMultiplier', group: 'geolocation', dataType: 'integer', inputType: 'stepper', values: [0, 1, 2, 3, 5, 10], defaultValue: 1},
    {name: 'geofenceProximityRadius', group: 'geolocation', dataType: 'integer', inputType: 'stepper', values: [1000, 1500, 2000, 5000, 10000, 100000], defaultValue: 1000 },
    {name: 'stopAfterElapsedMinutes', group: 'geolocation', dataType: 'integer', inputType: 'stepper', values: [-1, 0, 1, 2, 5, 10, 15], defaultValue: 0},
    {name: 'desiredOdometerAccuracy', group: 'geolocation', dataType: 'integer', inputType: 'stepper', values: [10, 20, 50, 100, 500], defaultValue: 100},
    {name: 'useSignificantChangesOnly', group: 'geolocation', dataType: 'boolean', inputType: 'toggle', values: [true, false], defaultValue: false},
    {name: 'stopTimeout', group: 'geolocation', dataType: 'integer', inputType: 'stepper', values: [0, 1, 5, 10, 15], defaultValue: 1},
    // Location Filter (Kalman)
    {name: 'filterPolicy', group: 'locationFilter', dataType: 'integer', inputType: 'segmented',
      configPath: ['geolocation', 'filter', 'policy'],
      values: [{label: 'Pass-Through', value: 0}, {label: 'Adjust', value: 1}, {label: 'Conservative', value: 2}],
      defaultValue: 2},
    {name: 'filterUseKalman', group: 'locationFilter', dataType: 'boolean', inputType: 'toggle',
      configPath: ['geolocation', 'filter', 'useKalman'],
      defaultValue: true},
    {name: 'kalmanProfile', group: 'locationFilter', dataType: 'integer', inputType: 'select',
      configPath: ['geolocation', 'filter', 'kalmanProfile'],
      values: [{label: 'Default', value: 0}, {label: 'Aggressive', value: 1}, {label: 'Conservative', value: 2}],
      defaultValue: 0},
    {name: 'maxImpliedSpeed', group: 'locationFilter', dataType: 'integer', inputType: 'stepper',
      configPath: ['geolocation', 'filter', 'maxImpliedSpeed'],
      values: [10, 20, 30, 50, 60, 100, 150, 200], defaultValue: 60},
    {name: 'maxBurstDistance', group: 'locationFilter', dataType: 'integer', inputType: 'stepper',
      configPath: ['geolocation', 'filter', 'maxBurstDistance'],
      values: [50, 100, 200, 300, 500, 1000, 2000], defaultValue: 300},
    {name: 'burstWindow', group: 'locationFilter', dataType: 'integer', inputType: 'stepper',
      configPath: ['geolocation', 'filter', 'burstWindow'],
      values: [1, 5, 10, 20, 30, 60, 120], defaultValue: 10},
    {name: 'rollingWindow', group: 'locationFilter', dataType: 'integer', inputType: 'stepper',
      configPath: ['geolocation', 'filter', 'rollingWindow'],
      values: [3, 4, 5, 7, 10, 15, 20], defaultValue: 5},
    {name: 'odometerUseKalman', group: 'locationFilter', dataType: 'boolean', inputType: 'toggle',
      configPath: ['geolocation', 'filter', 'odometerUseKalmanFilter'],
      defaultValue: true},
    {name: 'filterDebug', group: 'locationFilter', dataType: 'boolean', inputType: 'toggle',
      configPath: ['geolocation', 'filter', 'filterDebug'],
      defaultValue: false},
    {name: 'kalmanDebug', group: 'locationFilter', dataType: 'boolean', inputType: 'toggle',
      configPath: ['geolocation', 'filter', 'kalmanDebug'],
      defaultValue: false},
    // Activity Recognition
    {name: 'disableMotionActivityUpdates', group: 'activity', dataType: 'boolean', inputType: 'toggle', values: [true, false], defaultValue: false},
    {name: 'disableStopDetection', group: 'activity', dataType: 'boolean', inputType: 'toggle', values: [true, false], defaultValue: false},
    // HTTP & Persistence
    {name: 'url', group: 'http', inputType: 'text', dataType: 'string', defaultValue: 'http://your.server.com/endpoint'},
    {name: 'autoSync', group: 'http', dataType: 'boolean', inputType: 'toggle', values: [true, false], defaultValue: true},
    {name: 'disableAutoSyncOnCellular', group: 'http', dataType: 'boolean', inputType: 'toggle', values: [true, false], defaultValue: false},
    {name: 'autoSyncThreshold', group: 'http', dataType: 'integer', inputType: 'stepper', values: [0, 5, 10, 25, 50, 100], defaultValue: 0},
    {name: 'batchSync', group: 'http', dataType: 'boolean', inputType: 'toggle', values: [true, false], defaultValue: false},
    {name: 'maxBatchSize', group: 'http', dataType: 'integer', inputType: 'stepper', values: [-1, 50, 100, 250, 500], defaultValue: 250},
    {name: 'maxRecordsToPersist', group: 'persistence', dataType: 'integer', inputType: 'stepper', values: [-1, 0, 1, 10, 100, 1000], defaultValue: -1},
    {name: 'maxDaysToPersist', group: 'persistence', dataType: 'integer', inputType: 'stepper', values: [-1, 1, 2, 3, 5, 7, 14], defaultValue: 2},
    {name: 'persistMode', group: 'persistence', dataType: 'integer', inputType: 'select', values: [
      {label: 'All', value: 2},
      {label: 'Location', value: 1},
      {label: 'Geofence', value: -1},
      {label: 'None', value: 0},
    ], defaultValue: 2},
    // Application
    {name: 'disableLocationAuthorizationAlert', group: 'app', dataType: 'boolean', inputType: 'toggle', values: ['true', 'false'], defaultValue: 'false'},
    {name: 'showsBackgroundLocationIndicator', group: 'app', dataType: 'boolean', inputType: 'toggle', values: [true, false], defaultValue: false},
    {name: 'stopOnTerminate', group: 'app', dataType: 'boolean', inputType: 'toggle', values: [true, false], defaultValue: true},
    {name: 'startOnBoot', group: 'app', dataType: 'boolean', inputType: 'toggle', values: [true, false], defaultValue: false},
    {name: 'heartbeatInterval', group: 'app', dataType: 'integer', inputType: 'stepper', values: [-1, 60, (2*60), (5*60), (15*60)], defaultValue: 60},
    // Logging & Debug
    {name: 'debug', group: 'logger', dataType: 'boolean', inputType: 'toggle', values: [true, false], defaultValue: true},
    {name: 'logLevel', group: 'logger', dataType: 'string', inputType: 'select', values:[
      {label: 'Off', value: 0},
      {label: 'Error', value: 1},
      {label: 'Warn', value: 2},
      {label: 'Info', value: 3},
      {label: 'Debug', value: 4},
      {label: 'Verbose', value: 5}
    ], defaultValue: 5},
    {name: 'logMaxDays', group: 'logger', dataType: 'integer', inputType: 'stepper', values: [1, 2, 3, 4, 5, 6, 7], defaultValue: 3},
  ],
  ios: [
    // Geolocation
    {name: 'stationaryRadius', group: 'geolocation', dataType: 'integer', inputType: 'stepper', values: [0, 25, 50, 100, 500, 1000, 5000], defaultValue: 25 },
    {name: 'activityType', group: 'geolocation', dataType: 'string', inputType: 'select', values: [
      {label: 'OTHER', value: BackgroundGeolocation.ACTIVITY_TYPE_OTHER},
      {label: 'AUTOMOTIVE_NAVIGATION', value: BackgroundGeolocation.ACTIVITY_TYPE_AUTOMOTIVE_NAVIGATION},
      {label: 'FITNESS', value: BackgroundGeolocation.ACTIVITY_TYPE_FITNESS},
      {label: 'OTHER_NAVIGATION', value: BackgroundGeolocation.ACTIVITY_TYPE_OTHER_NAVIGATION}
    ], defaultValue: BackgroundGeolocation.ACTIVITY_TYPE_OTHER_NAVIGATION},
    // Application
    {name: 'preventSuspend', group: 'app', dataType: 'boolean', inputType: 'toggle', values: [true, false], defaultValue: false},
    // Activity Recognition
    {name: 'stopDetectionDelay', group: 'activity', dataType: 'integer', inputType: 'stepper', values: [0, 1, 5, 10, 15], defaultValue: 0},
  ],
  android: [
    // Geolocation
    {name: 'locationUpdateInterval', group: 'geolocation', dataType: 'integer', inputType: 'stepper', values: [0, 1000, 5000, 10000, 30000, 60000], defaultValue: 5000},
    {name: 'fastestLocationUpdateInterval', group: 'geolocation', dataType: 'integer', inputType: 'stepper', values: [-1, 0, 1000, 5000, 10000, 30000, 60000], defaultValue: 1000},
    {name: 'deferTime', group: 'geolocation', dataType: 'integer', inputType: 'stepper', values: [0, (10*1000), (30*1000), (60*1000), (5*60*1000)], defaultValue: 0},
    {name: 'geofenceModeHighAccuracy', group: 'geolocation', dataType: 'boolean', inputType: 'toggle', values: [true, false], defaultValue: false},
    // Activity Recognition
    {name: 'motionTriggerDelay', group: 'activity', dataType: 'integer', inputType: 'stepper', values: [0, 10000, 30000, 60000], defaultValue: 0},
    // Application
    {name: 'enableHeadless', group: 'app', dataType: 'boolean', inputType: 'toggle', values: [true, false], defaultValue: true},
  ]
};

export const getSelectLabel = (option: any): string => {
  if (typeof option === 'object' && option.label) {
    return option.label;
  }
  return String(option);
};

export const getSelectValue = (option: any): any => {
  if (typeof option === 'object' && 'value' in option) {
    return option.value;
  }
  return option;
};
