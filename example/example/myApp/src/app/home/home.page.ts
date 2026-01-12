import { Component, OnDestroy, OnInit } from '@angular/core';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonList, IonItem, IonLabel } from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';

import BackgroundGeolocation, {
  Location,
  Subscription,
  State,
  ProviderChangeEvent,
  MotionChangeEvent,
  GeofenceEvent,
  HeartbeatEvent,
  HttpEvent,
  ConnectivityChangeEvent
} from "@transistorsoft/capacitor-background-geolocation";

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: true,
  imports: [CommonModule, IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonList, IonItem, IonLabel],
})
export class HomePage implements OnInit, OnDestroy {
  enabled = false;
  locations: Location[] = [];
  subscriptions: Subscription[] = [];

  constructor() {}

  async ngOnInit() {
    // Configure BackgroundGeolocation
    const state = await BackgroundGeolocation.ready({
      // Geolocation Config
      desiredAccuracy: BackgroundGeolocation.DESIRED_ACCURACY_HIGH,
      distanceFilter: 10,
      stopOnTerminate: false,
      startOnBoot: true,
      debug: true,  // Enable debug sounds & notifications
      logLevel: BackgroundGeolocation.LOG_LEVEL_VERBOSE,

      // Activity Recognition
      stopTimeout: 5,
      isMoving: true,

      // HTTP / Persistence
      //url: 'http://your-server.com/locations',
      autoSync: true,
      maxDaysToPersist: 7,

      // Application config
      backgroundPermissionRationale: {
        title: "Allow {applicationName} to access this device's location even when closed or not in use?",
        message: "This app collects location data for FEATURE X and FEATURE Y.",
        positiveAction: "Change to '{backgroundPermissionOptionLabel}'",
        negativeAction: "Cancel"
      }
    });

    console.log('[BackgroundGeolocation] Ready with state: ', state);
    this.enabled = state.enabled;

    // Subscribe to events
    this.subscriptions.push(
      // Location updates
      BackgroundGeolocation.onLocation(this.onLocation.bind(this)),

      // Motion changes
      BackgroundGeolocation.onMotionChange(this.onMotionChange.bind(this)),

      // Provider changes
      BackgroundGeolocation.onProviderChange(this.onProviderChange.bind(this)),

      // Geofence events
      BackgroundGeolocation.onGeofence(this.onGeofence.bind(this)),

      // Heartbeat
      BackgroundGeolocation.onHeartbeat(this.onHeartbeat.bind(this)),

      // HTTP events
      BackgroundGeolocation.onHttp(this.onHttp.bind(this)),

      // Connectivity changes
      BackgroundGeolocation.onConnectivityChange(this.onConnectivityChange.bind(this))
    );
  }

  // Event handlers
  onLocation(location: Location) {
    console.log('[onLocation]', location);
    this.locations.unshift(location);
    if (this.locations.length > 50) {
      this.locations.pop();
    }
  }

  onMotionChange(event: MotionChangeEvent) {
    console.log('[onMotionChange]', event.isMoving, event.location);
  }

  onProviderChange(event: ProviderChangeEvent) {
    console.log('[onProviderChange]', event);
  }

  onGeofence(event: GeofenceEvent) {
    console.log('[onGeofence]', event);
  }

  onHeartbeat(event: HeartbeatEvent) {
    console.log('[onHeartbeat]', event);
  }

  onHttp(event: HttpEvent) {
    console.log('[onHttp]', event);
  }

  onConnectivityChange(event: ConnectivityChangeEvent) {
    console.log('[onConnectivityChange]', event);
  }

  // Control methods
  async toggleEnabled() {
    if (this.enabled) {
      await BackgroundGeolocation.stop();
      this.enabled = false;
    } else {
      const state = await BackgroundGeolocation.start();
      this.enabled = state.enabled;
    }
  }

  async getCurrentPosition() {
    try {
      const location = await BackgroundGeolocation.getCurrentPosition({
        samples: 1,
        persist: true
      });
      console.log('[getCurrentPosition]', location);
      this.locations.unshift(location);
    } catch (error) {
      console.error('[getCurrentPosition] Error:', error);
    }
  }

  async changePace() {
    const state = await BackgroundGeolocation.getState();
    await BackgroundGeolocation.changePace(!state.isMoving);
    console.log(`[changePace] ${!state.isMoving ? 'Moving' : 'Stationary'}`);
  }

  ngOnDestroy() {
    // Clean up subscriptions
    this.subscriptions.forEach(sub => sub.remove());
  }
}