import {
  Component,
  ViewChild,
  ElementRef,
  OnInit,
  OnDestroy,
  EventEmitter,
  Output,
  Input,
  NgZone
} from '@angular/core';

import { GoogleMap } from '@capacitor/google-maps';
import { ActionSheet, ActionSheetButtonStyle } from '@capacitor/action-sheet';

import { Haptics, ImpactStyle } from '@capacitor/haptics';

import BackgroundGeolocation, {
	Subscription,
	Geofence,
	Location
} from "@transistorsoft/capacitor-background-geolocation";

import {COLORS} from '../lib/colors';
import {BGService} from "./lib/BGService";

import {
  toRad,
  toDeg,
  getBearing,
  computeOffsetCoordinate
} from "./lib/GeoMath"

/// Polyline points
const POLYLINE_PATH = [];
/// @capacitor/google-maps Marker refs (Circle, Polygon, Marker, Polyline)
const MARKERS = {
  currentLocation: null,
  locationMarkers: [],
  stationaryCircle: null,
  polyline: null,
  activeGeofences: null,
  activePolygons: null,
  geofenceEventMarkers: [],
  geofenceEventPolylines: [],
  addGeofenceCursor: [],
  addGeofencePolygonCursor: null,
  motionChangeCircles: [],
  motionChangePolylines: []
}

/// Active Geofence Map, keyed by Geofence.identifier
const ACTIVE_GEOFENCES = new Map<string, Geofence>();

let POLYGON_GEOFENCE_VERTICES = [];

@Component({
	selector: 'map-view',
  template: `
  	<div id="MapView-container">	 
  		<ion-toolbar [hidden]="!isCreatingPolygon" mode="ios" color="secondary" className="polygon-geofence-menu">
        <ion-title color="light" size="small">Click map to add points</ion-title>
        <ion-buttons slot="start">
          <ion-button (click)="onClickCancelPolygon()" color="danger">Cancel</ion-button>
          <ion-button (click)="onClickUndoPolygon()" color="primary"><ion-icon name="arrow-undo-outline"/></ion-button>
        </ion-buttons>
        <ion-buttons slot="end">
          <ion-button (click)="onClickAddPolygon()" color="primary">Continue</ion-button>
        </ion-buttons>                        
      </ion-toolbar>
      <div id="geofence-prompt" [hidden]="isCreatingPolygon">Click map to add a Geofence</div>
    	<capacitor-google-map id="map"></capacitor-google-map>
    </div>
  `,
  styles: [
  	`  		
      capacitor-google-map {
        display: inline-block;
        height: 1px;
        width: 1px;
      }
      #geofence-prompt {
      	color: #000; 	
      	
        background-color: #fff1a5;
        color: #000000;
        border-bottom-width: 1;
        border-bottom-color: #ccc;

      	font-size: 16px;
      	text-align: center;        
      }
      ion-toolbar {
        background-color: var(--ion-color-secondary);
      }      
      ion-toolbar ion-title {
        color: #000;
      }
    `
  ]
})

export class MapView implements OnInit, OnDestroy {  
  // Fired to container component (eg: AdvancedPage) to inform map is ready.
  @Output() onReady: EventEmitter<any> = new EventEmitter();
  // Fired to container component when the user has selected a coord/vertices on map.
  @Output() onAddGeofence: EventEmitter<any> = new EventEmitter<any>();
  // I hate Ionic and Angular
  @Input() zone: NgZone;
  // BGGeo event subscriptions.
  subscriptions: Array<Subscription>;
  // GoogleMap instance from @capacitor/google-maps 
  map: GoogleMap;
  // Ref to stationaryLocation provided by onMotionChange
  stationaryLocation:Location;
  // Flag when user is creating a polygon on map.
  isCreatingPolygon:boolean;
  // from BackgroundGeolocation.getState().enabled.
  enabled: boolean;

  constructor(private bgService: BGService) {
  	this.subscriptions = [];
  	this.enabled = false;
  	this.isCreatingPolygon = false;
    this.stationaryLocation = null;
  }

	ngOnInit() {
		this.configureBackgroundGeolocation();
		this.createMap();
	}
	  
	ngOnDestroy() {
    this.unsubscribe();
    this.map.destroy()
  }

  subscribe(subscription:Subscription) {
    this.subscriptions.push(subscription);
  }

  unsubscribe() {
    this.subscriptions.forEach((subscription) => subscription.remove() );
    this.subscriptions = [];
  }

  /// Setup BackgroundGeolocation event-listeners.
  async configureBackgroundGeolocation() {  
		const state = await BackgroundGeolocation.getState();
		this.enabled = state.enabled;

		BackgroundGeolocation.onEnabledChange(this.onEnabledChange.bind(this));
		BackgroundGeolocation.onLocation(this.onLocation.bind(this));
		BackgroundGeolocation.onMotionChange(this.onMotionChange.bind(this));
		BackgroundGeolocation.onGeofence(this.onGeofence.bind(this));
		BackgroundGeolocation.onGeofencesChange(this.onGeofencesChange.bind(this));		
  }

  /// Create the map using ion-content element.
  async createMap() {
  	// Ref to @Output callback.
  	const onReady = this.onReady;

  	const ionContent:HTMLElement = document.querySelector('app-advanced ion-content'); 
    const geofencePrompt:HTMLElement = document.querySelector('#geofence-prompt');

    if (ionContent != null) {      
      const mapEl:HTMLElement = document.querySelector('capacitor-google-map'); 

      console.log('- createmap', this.map);

    	this.map = await GoogleMap.create({
	      id: 'google-map',
	      element: mapEl,	// <-- render map onto <ion-content/> element for auto full-screen.
	      apiKey: 'AIzaSyDXTDr2C3iU9jgwpNVpZjeWzOc-DyCgkt8',//environment.apiKey,
	      config: {
	        center: {
	          lat: 45.508888,
	          lng: -73.561668
	        },
	        zoom: 11,
	      }
			});              
      mapEl.style.height = (ionContent.clientHeight - geofencePrompt.clientHeight) + 'px';
      mapEl.style.width = ionContent.clientWidth + 'px';
      
			// listen to mapclicks.  Shame this piece of junk GoogleMap doesn't include a long-press listener...
			this.map.setOnMapClickListener(this.onMapClick.bind(this));  
			// Let the outside world know that the map is ready to rock.
			onReady.emit();
    }        
  }

  /// @event 
  onEnabledChange(enabled) {
    this.enabled = enabled;
  	if (!enabled) {
  		this.clearMarkers();
  	}
  }

  /// @event
  async onLocation(location) {
  	await this.updateCurrentLocationMarker(location);    
  }
  /// @event
  async onMotionChange(event) {
  	if (event.isMoving) {
      if (!this.stationaryLocation) this.stationaryLocation = event.location;
      MARKERS.motionChangeCircles = MARKERS.motionChangeCircles.concat(await this.map.addCircles([this.buildMotionChangeCircle(this.stationaryLocation)]));
      MARKERS.motionChangePolylines = MARKERS.motionChangePolylines.concat(await this.map.addPolylines([this.buildMotionChangePolyline(this.stationaryLocation, event.location)]));
      this.hideStationaryCircle();
    } else {
      this.stationaryLocation = event.location;
      this.showStationaryCircle(event.location);
    }
    this.map.setCamera({      
      zoom: 16
    });    
  }
  /// @event
  async onGeofence(event) {
    const geofence = await BackgroundGeolocation.getGeofence(event.identifier);
    const location = event.location;
    const center = {
      latitude: geofence.latitude,
      longitude: geofence.longitude
    };
    const radius = geofence.radius;

    POLYLINE_PATH.push({
      lat: location.coords.latitude,
      lng: location.coords.longitude
    });        
    

    let color, iconColor;
    if (event.action === 'ENTER') {
      color = COLORS.green;
      iconColor = 'green';
    } else if (event.action === 'DWELL') {
      color = COLORS.gold;
      iconColor = 'amber';
    } else {
      color = COLORS.red
      iconColor = 'red';
    }

    let iconIndex = (location.coords.heading >= 0) ? Math.round(location.coords.heading / 10) : 0;
    if (iconIndex > 36) iconIndex = 0;

    MARKERS.geofenceEventMarkers.push(await this.map.addMarker({
      zIndex: 100,
      coordinate: {
        lat: location.coords.latitude,
        lng: location.coords.longitude
      },
      iconUrl: `assets/imgs/markers/location-arrow-${iconColor}-${iconIndex}.png`,
      iconSize: {
        width: 20,
        height: 20
      },
      iconAnchor: {
        x: 10,
        y: 10
      }      
    }));
    
    const bearing = getBearing(center, location.coords);
    const edgeCoordinate = computeOffsetCoordinate(center, radius, bearing);

    MARKERS.geofenceEventMarkers.push(await this.map.addMarker({
      zIndex: 500,
      coordinate: {
        lat: edgeCoordinate.latitude,
        lng: edgeCoordinate.longitude
      },
      isFlat: true,
      iconUrl: `assets/imgs/markers/geofence-event-edge-circle-${event.action.toLowerCase()}.png`,
      iconSize: {
        width: 10,
        height: 10
      },
      iconAnchor: {
        x: 5,
        y: 5
      }
    }));
    MARKERS.geofenceEventPolylines = MARKERS.geofenceEventPolylines.concat(await this.map.addPolylines([{
      geodesic: true,
      zIndex: 99,
      strokeColor: COLORS.black,
      strokeOpacity: 1.0,
      strokeWeight: 2,
      path: [{
        lat: location.coords.latitude,
        lng: location.coords.longitude
      }, {
        lat: edgeCoordinate.latitude,
        lng: edgeCoordinate.longitude
      }]
    }]));        
  }
  /// @event
  async onGeofencesChange(event) {
  	if (MARKERS.activeGeofences) {      
      await this.map.removeCircles(MARKERS.activeGeofences);
    }
    if (MARKERS.activePolygons) {
      await this.map.removePolygons(MARKERS.activePolygons);
    }
    if ((event.on.length === 0) && (event.off.length === 0)) {
      MARKERS.activeGeofences = null;
      MARKERS.activePolygons = null;
      return;
    }
    event.off.forEach((identifier) => {
      delete ACTIVE_GEOFENCES[identifier];
    });

    event.on.forEach((geofence) => {      
      ACTIVE_GEOFENCES[geofence.identifier] = geofence;
    });

    const circles = [];
    const polygons = [];
    for (const [identifier, geofence] of Object.entries(ACTIVE_GEOFENCES)) {
      circles.push(this.buildGeofenceCircle(geofence));
      if (geofence.vertices.length > 0) {
        polygons.push(this.buildGeofencePolygon(geofence));
      } 
    }
    if (circles.length > 0) {
      this.map.addCircles(circles).then((result) => {
      	MARKERS.activeGeofences = result;
      })
    }
    if (polygons.length > 0) {
      this.map.addPolygons(polygons).then((result) => {
      	MARKERS.activePolygons = result;
      })
    }    
  }

  /// Build red stationary geofence marker.
  async showStationaryCircle(location:Location) {
    await this.hideStationaryCircle();
    
    const state = await BackgroundGeolocation.getState();
    const radius = (state.trackingMode == 1) ? 200 : (state.geofenceProximityRadius! / 2);

    MARKERS.stationaryCircle = await this.map.addCircles([{
      center: {
        lat: location.coords.latitude,
        lng: location.coords.longitude
      },
      fillColor: COLORS.red,
      strokeColor: COLORS.red,
      strokeWeight: 1,
      fillOpacity: 0.3,
      strokeOpacity: 0.7,
      radius: radius
    }]);
  }

  buildMotionChangePolyline(from:Location, to:Location) {
    return {
      zIndex: 8,
      geodesic: true,
      strokeColor: '#00ff00',
      strokeOpacity: 0.7,
      strokeWeight: 10,
      path: [{
        lat: from.coords.latitude,
        lng: from.coords.longitude
      }, {
        lat: to.coords.latitude,
        lng: to.coords.longitude
      }]
    };
  }

  buildMotionChangeCircle(location:Location) {
    return {
      center: {
        lat: location.coords.latitude,
        lng: location.coords.longitude
      },
      fillColor: COLORS.red,
      strokeColor: COLORS.red,
      zIndex: 8,
      fillOpacity: 0.3,
      strokeOpacity: 0.7,
      radius: 25
    };
  }

  /// Hide the red stationary geofence Map Marker.
  async hideStationaryCircle() {
    if (MARKERS.stationaryCircle) {
      this.map.removeCircles(MARKERS.stationaryCircle);
      MARKERS.stationaryCircle = null;
    }    
  }

  /// Build a Geofence Circle Marker
  buildGeofenceCircle(geofence:Geofence) {
    return {
      identifier: geofence.identifier,
      zIndex: 1,
      fillColor: COLORS.green,
      fillOpacity: 0.2,
      strokeColor: COLORS.green,
      strokeWeight: 2,
      strokeOpacity: 0.7,
      params: geofence,
      radius: geofence.radius,
      center: {
        lat: geofence.latitude, 
        lng: geofence.longitude
      }
    };    
  }

  /// Build a Polygon Geofence Marker.
  buildGeofencePolygon(geofence) {
    return {
      zIndex: 2,
      strokeColor: COLORS.blue,
      strokeWeight: 5,
      strokeOpacity: 0.6,
      fillColor: COLORS.polygon_fill_color,
      fillOpacity: 0.4,
      geodesic: true,
      clickable: false,
      title: geofence.identifier,
      paths: geofence.vertices.map((vertex) => {
        return {lat: vertex[0], lng: vertex[1]}
      })
    };
  }

  /// Re-center the map with provided Location.
  async setCenter(location:Location) {    
    if (location.sample) { return; }
              
    this.map.setCamera({
      coordinate: {
        lat: location.coords.latitude,
        lng: location.coords.longitude
      }
    });    
  }

  /// Update current-location Map Marker.
  async updateCurrentLocationMarker(location:Location) {
    return new Promise(async (resolve, reject) => {
      this.setCenter(location);

      if (MARKERS.currentLocation) {
        try {
          await this.map.removeMarker(MARKERS.currentLocation);
        } catch(e) {
          console.warn(e);
        }
        MARKERS.currentLocation = null;
      }
      // Current location "bluedot"
      MARKERS.currentLocation = await this.map.addMarker({
        coordinate: {
          lat: location.coords.latitude,
          lng: location.coords.longitude
        },
        zIndex: 100,
        isFlat: true,
        iconUrl: 'assets/imgs/markers/bluedot.png',
        iconSize: {        
          height: 24,
          width: 24
        },      
        iconAnchor: {
          x: 12,
          y: 12
        }
      });

      // Add a breadcrumb.
      let iconIndex = (location.coords.heading >= 0) ? Math.round(location.coords.heading / 10) : 0;
      if (iconIndex > 36) iconIndex = 0;

      MARKERS.locationMarkers.push(await this.map.addMarker({
        coordinate: {
          lat: location.coords.latitude,
          lng: location.coords.longitude
        },
        isFlat: true,
        zIndex: 10,
        iconUrl: `assets/imgs/markers/location-arrow-${iconIndex}.png`,
        iconSize: {        
          height: 16,
          width: 16
        },
        iconAnchor: {
          x: 8,
          y: 8
        }
      }));

      if (!this.enabled) return;
      
      // Push a new point onto our Polygon path List.    
      POLYLINE_PATH.push({
        lat: location.coords.latitude,
        lng: location.coords.longitude
      });

      // Polyline.
      if (MARKERS.polyline) {
        try {
          this.map.removePolylines(MARKERS.polyline);
        } catch(e) {
          console.warn(e);
        }          
      }
      
      MARKERS.polyline = await this.map.addPolylines([{
        zIndex: 9,
        geodesic: true,
        strokeColor: COLORS.polyline_color,
        strokeOpacity: 0.6,
        strokeWeight: 10,
        path: POLYLINE_PATH
      }]);
      resolve(true);
    })
  }

  /// Clear all Map Markers.
  async clearMarkers() {
    if (!this.map) return;    
    if (MARKERS.stationaryCircle) {
      this.map.removeCircles(MARKERS.stationaryCircle);
      MARKERS.stationaryCircle = null;
    }    
    if (MARKERS.locationMarkers.length > 0) {      
      this.map.removeMarkers(MARKERS.locationMarkers);
      MARKERS.locationMarkers = [];
    }    
    if (MARKERS.polyline) {
      this.map.removePolylines(MARKERS.polyline);
      MARKERS.polyline = null;
      POLYLINE_PATH.splice(0, POLYLINE_PATH.length);
    }
    if (MARKERS.activeGeofences) {
      this.map.removeCircles(MARKERS.activeGeofences);
      MARKERS.activeGeofences = null;
    }
    if (MARKERS.activePolygons) {
      this.map.removePolygons(MARKERS.activePolygons);
      MARKERS.activePolygons = null;
    }
    if (MARKERS.geofenceEventMarkers.length > 0) {
      this.map.removeMarkers(MARKERS.geofenceEventMarkers);
      MARKERS.geofenceEventMarkers = [];
    }    
    if (MARKERS.geofenceEventPolylines.length > 0) {      
      this.map.removePolylines(MARKERS.geofenceEventPolylines);
      MARKERS.geofenceEventPolylines = [];
    }
    if (MARKERS.motionChangePolylines.length > 0) {
      this.map.removePolylines(MARKERS.motionChangePolylines);
      MARKERS.motionChangePolylines = [];
    }
    if (MARKERS.motionChangeCircles.length > 0) {
      this.map.removeCircles(MARKERS.motionChangeCircles);
      MARKERS.motionChangeCircles = [];
    }
  }

  async onMapClick(coords) {    
  	if (this.isCreatingPolygon) {
      this.bgService.playSound('TEST_MODE_CLICK');
      Haptics.impact({ style: ImpactStyle.Heavy });
      POLYGON_GEOFENCE_VERTICES.push([coords.latitude, coords.longitude]); 
      this.renderPolygonGeofenceCursor()
    } else {
      if (MARKERS.addGeofenceCursor.length > 0) {
        this.map.removeMarkers(MARKERS.addGeofenceCursor);
        if (MARKERS.addGeofencePolygonCursor) {
          this.map.removePolygons(MARKERS.addGeofencePolygonCursor);
        }
      }
      // Fire processing off to the containing component (eg: AdvancedApp)
      this.onClickAddGeofence({
        latitude: coords.latitude,
        longitude: coords.longitude
      });
    }
    MARKERS.addGeofenceCursor.push(await this.map.addMarker({      
      coordinate: {
        lat: coords.latitude,
        lng: coords.longitude
      }
    }));
  }

  async onClickAddGeofence(coords) {
    this.bgService.playSound('LONG_PRESS_ACTIVATE');
    Haptics.impact({ style: ImpactStyle.Heavy });

  	const result = await ActionSheet.showActions({
      title: 'Add Geofence',
      message: 'Circular or Polygon',
      options: [
        {
          title: 'Circular',
        },
        {
          title: 'Polygon',
        },
        {
          title: 'Cancel',          
          style: ActionSheetButtonStyle.Destructive,
        },
      ]
    });

    this.isCreatingPolygon = false;
    // Play sound and haptics.
    this.bgService.playSound('TEST_MODE_CLICK');
    Haptics.impact({ style: ImpactStyle.Heavy });

    switch (result.index) {
      case 0:        
        this.onAddGeofence.emit(coords);
        break;
      case 1:
        // polygon
        POLYGON_GEOFENCE_VERTICES.push([coords.latitude, coords.longitude]);
        this.zone.run(() => {
        	this.isCreatingPolygon = true;	
        })        
        break;
      case 2:
        // cancel
      	this.zone.run(() => {
      		this.isCreatingPolygon = false;
      	})
        this.stopCreatingPolygonGeofence();
        break;
    }    
  }

  async stopCreatingPolygonGeofence() {
  	this.zone.run(() => {
  		this.isCreatingPolygon = false;	
  	})
		
    if (MARKERS.addGeofenceCursor.length > 0) {
      this.map.removeMarkers(MARKERS.addGeofenceCursor);
    }
    if (MARKERS.addGeofencePolygonCursor) {
      this.map.removePolygons(MARKERS.addGeofencePolygonCursor);
      MARKERS.addGeofencePolygonCursor = null;
    }      
    POLYGON_GEOFENCE_VERTICES = [];  	
  }

  async renderPolygonGeofenceCursor() {
    // Play sound and haptics.
  	if (MARKERS.addGeofencePolygonCursor) {
      await this.map.removePolygons(MARKERS.addGeofencePolygonCursor);
    }
    if (POLYGON_GEOFENCE_VERTICES.length == 0) {
      return;
    }
    MARKERS.addGeofencePolygonCursor = await this.map.addPolygons([{
      strokeColor: COLORS.blue,
      strokeWeight: 5,
      fillColor: COLORS.polygon_fill_color,
      fillOpacity: 0.4,
      geodesic: true,
      clickable: false,
      paths: POLYGON_GEOFENCE_VERTICES.map((vertex => {
        return {lat: vertex[0], lng: vertex[1]}
      }))
    }])
  }

  /// User clicks [Continue] button to create this Polygon Geofence.
  async onClickAddPolygon() {
    const vertices = POLYGON_GEOFENCE_VERTICES.map((coord) => { return coord; });
    //setGeofenceVertices(vertices);

    // Play sound and haptics.
    this.bgService.playSound('TEST_MODE_CLICK');
    Haptics.impact({ style: ImpactStyle.Heavy });      

    this.zone.run(() => {
    	this.isCreatingPolygon = false;
  	});
    this.onAddGeofence.emit(vertices);

    this.stopCreatingPolygonGeofence();    
  }


  /// User clicks [Cancel] Polygon Geofence.
  async onClickCancelPolygon() {
    this.bgService.playSound('TEST_MODE_CLICK');
    Haptics.impact({ style: ImpactStyle.Heavy });
  	this.stopCreatingPolygonGeofence();    
  }

  /// User clicks [UNDO] button to delete a Polygon vertex
  async onClickUndoPolygon() {
    this.bgService.playSound('TEST_MODE_CLICK');
    Haptics.impact({ style: ImpactStyle.Heavy });

    POLYGON_GEOFENCE_VERTICES.pop();
    const markerId = MARKERS.addGeofenceCursor.pop();
    if (markerId) {
      this.map.removeMarker(markerId);
    }    
    this.renderPolygonGeofenceCursor();    
  }
}