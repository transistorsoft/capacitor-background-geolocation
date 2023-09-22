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

import BackgroundGeolocation, {
	Subscription,
	Geofence,
	Location
} from "@transistorsoft/capacitor-background-geolocation";

import {COLORS} from '../lib/colors';

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
  geofenceEventCircles: [],
  addGeofenceCursor: [],
  addGeofencePolygonCursor: null
}

/// Active Geofence Map, keyed by Geofence.identifier
const ACTIVE_GEOFENCES = new Map<string, Geofence>();

let POLYGON_GEOFENCE_VERTICES = [];

@Component({
	selector: 'map-view',
  template: `
  	<div id="MapView-container">	 
  		<ion-toolbar [hidden]="!isCreatingPolygon" mode="ios" color="danger" className="polygon-geofence-menu">
        <ion-title color="light" size="small">Click map to add points</ion-title>
        <ion-buttons slot="start">
          <ion-button (click)="onClickCancelPolygon()">Cancel</ion-button>
          <ion-button (click)="onClickUndoPolygon()"><ion-icon name="arrow-undo-outline"/></ion-button>
        </ion-buttons>
        <ion-buttons slot="end">
          <ion-button (click)="onClickAddPolygon()">Continue</ion-button>
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
        height: 300px;
        width: 300px;
      }
      #geofence-prompt {
      	color: #000; 	
      	background-color: #efefef;
      	font-size: 16px;
      	text-align: center;        
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
  // Flag when user is creating a polygon on map.
  isCreatingPolygon:boolean;
  // from BackgroundGeolocation.getState().enabled.
  enabled: boolean;

  constructor() {
  	this.subscriptions = [];
  	this.enabled = false;
  	this.isCreatingPolygon = false;
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
  	if (!enabled) {
  		this.clearMarkers();
  	}
  }

  /// @event
  onLocation(location) {
  	this.setCenter(location);
  }
  /// @event
  onMotionChange(event) {
  	if (event.isMoving) {
      this.hideStationaryCircle();
    } else {
      this.showStationaryCircle(event.location);
    }
    this.map.setCamera({      
      zoom: 16
    });    
  }
  /// @event
  async onGeofence(event) {
  	const isEnter = event.action == 'ENTER';

    const geofence = await BackgroundGeolocation.getGeofence(event.identifier);
    const location = event.location;
    const center = {
      latitude: geofence.latitude,
      longitude: geofence.longitude
    };
    const radius = geofence.radius;

    MARKERS.geofenceEventMarkers.push(await this.map.addMarker({
      coordinate: {
        lat: location.coords.latitude,
        lng: location.coords.longitude
      },
      iconSize: {
        width: 32,
        height: 32
      },
      iconUrl: (event.action === 'ENTER') ? 'assets/imgs/geofence-enter.png' : 'assets/imgs/geofence-exit.png'
    }));
    
    const bearing = getBearing(center, location.coords);
    const edgeCoordinate = computeOffsetCoordinate(center, radius, bearing);

    MARKERS.geofenceEventMarkers.push(await this.map.addMarker({
      coordinate: {
        lat: edgeCoordinate.latitude,
        lng: edgeCoordinate.longitude
      },
      iconSize: {
        width: 32,
        height: 48
      },
      iconUrl: (isEnter) ? 'assets/imgs/geofence-enter.png' : 'assets/imgs/geofence-exit.png'
    }));
    MARKERS.geofenceEventPolylines = MARKERS.geofenceEventPolylines.concat(await this.map.addPolylines([{
      geodesic: true,
      zIndex: 500,
      strokeColor: (isEnter) ? COLORS.green : COLORS.geofence_red,//'#000000',
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
    MARKERS.geofenceEventCircles = MARKERS.geofenceEventCircles.concat(await this.map.addCircles([{
      zIndex: 100,
      fillColor: '#ffffff',
      fillOpacity: 0,
      strokeColor: (isEnter) ? COLORS.green : COLORS.geofence_red,//'#000000',
      strokeWeight: 3,      
      radius: radius,
      center: {
        lat: center.latitude, 
        lng: center.longitude
      }
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
    await this.setCenter(location);

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
      zIndex: 100,
      fillColor: COLORS.green,
      fillOpacity: 0.2,
      strokeColor: COLORS.green,
      strokeWeight: 1,
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
      strokeColor: COLORS.blue,
      strokeWeight: 5,
      fillColor: COLORS.green,
      fillOpacity: 0.2,
      geodesic: true,
      clickable: false,
      title: geofence.identifier,
      paths: geofence.vertices.map((vertex) => {
        return {lat: vertex[0], lng: vertex[1]}
      })
    };
  }

  /// Re-center the map with provided Location.
  setCenter(location:Location) {
    console.log('- setCenter: ', location);

    if (location.sample) { return; }
          
    this.updateCurrentLocationMarker(location);    

    this.map.setCamera({
      coordinate: {
        lat: location.coords.latitude,
        lng: location.coords.longitude
      }
    });    
  }

  /// Update current-location Map Marker.
  async updateCurrentLocationMarker(location:Location) {
    // Push a new point onto our Polygon path List.
    POLYLINE_PATH.push({
      lat: location.coords.latitude,
      lng: location.coords.longitude
    });

    console.log('* MARKERS: ', MARKERS);
    if (MARKERS.currentLocation) {
      this.map.removeMarker(MARKERS.currentLocation);
    }
    // Current location "bluedot"
    MARKERS.currentLocation = await this.map.addMarker({
      coordinate: {
        lat: location.coords.latitude,
        lng: location.coords.longitude
      },
      zIndex: 1000,
      iconUrl: 'assets/imgs/bluedot.png',
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
    MARKERS.locationMarkers.push(await this.map.addMarker({
      coordinate: {
        lat: location.coords.latitude,
        lng: location.coords.longitude
      },
      zIndex: 999,
      iconUrl: 'assets/imgs/bluedot.png',
      iconSize: {        
        height: 16,
        width: 16
      },
      iconAnchor: {
        x: 8,
        y: 8
      }
    }));

    // Polyline.
    if (MARKERS.polyline) {
      this.map.removePolylines(MARKERS.polyline);
    }
    
    MARKERS.polyline = await this.map.addPolylines([{
      zIndex: 1,
      geodesic: true,
      strokeColor: COLORS.polyline_color,
      strokeOpacity: 0.7,
      strokeWeight: 7,
      path: POLYLINE_PATH
    }]);    
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
    if (MARKERS.geofenceEventCircles.length > 0) {
      this.map.removeCircles(MARKERS.geofenceEventCircles);
      MARKERS.geofenceEventCircles = [];
    }
    if (MARKERS.geofenceEventPolylines.length > 0) {      
      this.map.removePolylines(MARKERS.geofenceEventPolylines);
      MARKERS.geofenceEventPolylines = [];
    }    
  }

  async onMapClick(coords) {
  	if (this.isCreatingPolygon) {
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
  	if (MARKERS.addGeofencePolygonCursor) {
      await this.map.removePolygons(MARKERS.addGeofencePolygonCursor);
    }
    if (POLYGON_GEOFENCE_VERTICES.length == 0) {
      return;
    }
    MARKERS.addGeofencePolygonCursor = await this.map.addPolygons([{
      strokeColor: COLORS.blue,
      strokeWeight: 10,
      fillColor: COLORS.green,
      fillOpacity: 0.2,
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

    this.zone.run(() => {
    	this.isCreatingPolygon = false;
  	});
    this.onAddGeofence.emit(vertices);

    this.stopCreatingPolygonGeofence();    
  }


  /// User clicks [Cancel] Polygon Geofence.
  async onClickCancelPolygon() {
  	this.stopCreatingPolygonGeofence();
    
  }

  /// User clicks [UNDO] button to delete a Polygon vertex
  async onClickUndoPolygon() {
    POLYGON_GEOFENCE_VERTICES.pop();    
    const markerId = MARKERS.addGeofenceCursor.pop();
    if (markerId) {
      this.map.removeMarker(markerId);
    }    
    this.renderPolygonGeofenceCursor();    
  }
}