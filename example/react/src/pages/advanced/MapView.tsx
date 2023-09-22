
import React from "react";

import {
  useIonModal, 
  IonTitle,
  IonToolbar,
  IonButtons,
  IonIcon,
  IonButton} from '@ionic/react';
import { useHistory } from 'react-router-dom';
import { findDOMNode } from 'react-dom';

import { 
  arrowUndoOutline as iconUndo
} from "ionicons/icons";

import { ActionSheet, ActionSheetButtonStyle } from '@capacitor/action-sheet';

import BackgroundGeolocation, {
  State,
  Subscription,
  Location,
  Geofence,
  GeofenceEvent,
  GeofencesChangeEvent,
  MotionChangeEvent,
} from "@transistorsoft/capacitor-background-geolocation";

import { GoogleMap, Marker } from '@capacitor/google-maps';
import { useRef } from 'react';

import SettingsService from "./lib/SettingsService";
import {COLORS} from "../../config/Colors";
import GeofenceView from "./GeofenceView";
import {ENV} from "../../config/ENV";

import {
  toRad,
  toDeg,
  getBearing,
  computeOffsetCoordinate
} from "./lib/GeoMath"

interface ContainerProps { }

const SUBSCRIPTIONS:Subscription[] = [];


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
let IS_CREATING_POLYGON = false;
let POLYGON_GEOFENCE_VERTICES = [];

const subscribe = (subscription:Subscription) => {
  SUBSCRIPTIONS.push(subscription);
}
const unsubscribe = () => {
  SUBSCRIPTIONS.forEach((subscription:Subscription) => subscription.remove() )
  SUBSCRIPTIONS.splice(0, SUBSCRIPTIONS.length);
}

// Global GoogleMap reference.
let map: GoogleMap = null;

interface MapViewProps extends ContainerProps {
  // Callback fired back to containing Component when google-map is rendered
  onReady: Function
}

const MapView: React.FC<MapViewProps> = (props) => {  
  const settingsService = SettingsService.getInstance();
  const history = useHistory();
  
  const [enabled, setEnabled] = React.useState(false);
  const [location, setLocation] = React.useState<Location|null>(null);
  const [motionChangeEvent, setMotionChangeEvent] = React.useState<MotionChangeEvent|null>(null);
  const [geofenceEvent, setGeofenceEvent] = React.useState<GeofenceEvent|null>(null);
  const [geofencesChangeEvent, setGeofencesChangeEvent] = React.useState<GeofencesChangeEvent|null>(null);
  const [state, setState] = React.useState<State|null>(null);
  const [geofenceCoordinate, setGeofenceCoordinate] = React.useState<any>();
  const [geofenceVertices, setGeofenceVertices] = React.useState<any>([]);
  const [mapWidth, setMapWidth] = React.useState(100);
  const [mapHeight, setMapHeight] = React.useState(100);
  const [mapReady, setMapReady] = React.useState<boolean>(false);
  const [isCreatingPolygon, setIsCreatingPolygon] = React.useState(false);

  /// The Main effect.
  React.useEffect(() => {
    /// Subscribe to BackgroundGeolocation events.
    subscribe(BackgroundGeolocation.onLocation(setLocation, (error) => {
      console.warn('[onLocation] ERROR: ', error);
    }));
    subscribe(BackgroundGeolocation.onMotionChange(setMotionChangeEvent));
    subscribe(BackgroundGeolocation.onGeofence(setGeofenceEvent));
    subscribe(BackgroundGeolocation.onGeofencesChange(setGeofencesChangeEvent));
    subscribe(BackgroundGeolocation.onEnabledChange(setEnabled));

    BackgroundGeolocation.getState().then((state) => {
      setEnabled(state.enabled);
    })
    createMap();

    return () => {
      // Cleanup when view is destroyed or refreshed.
      clearMarkers();
      unsubscribe();
    }
  }, []);
   
  /// mapReady 
  React.useEffect(() => {    
    if (!mapReady || !map) return;
    props.onReady(mapReady);    
  }, [mapReady]);

  /// onLocation Effect.
  React.useEffect(() => {
    if (location === null) { return; }
    setCenter(location);
    
  }, [location]);

  /// onEnabledChange Effect
  React.useEffect(() => {
    BackgroundGeolocation.getState((state:State) => {
      setState(state);
    });
    if (map === null) { return; }

    if (!enabled) {
      clearMarkers();
    }
  }, [enabled]);

  /// onMotionChange Effect.
  React.useEffect(() => {
    if (motionChangeEvent === null) { return; }
    if (map === null) { return; }

    if (motionChangeEvent.isMoving) {
      hideStationaryCircle();
    } else {
      showStationaryCircle(motionChangeEvent.location);
    }
    map.setCamera({      
      zoom: 16
    });
  }, [motionChangeEvent]);

  /// isCreatingPolygon
  React.useEffect(() => {
    // Something is messed up with scope of map.setOnMapClickListener and React state.  Have to use GLOBALs.
    IS_CREATING_POLYGON = isCreatingPolygon;    
    if (!isCreatingPolygon) {
      if (MARKERS.addGeofenceCursor.length > 0) {
        map.removeMarkers(MARKERS.addGeofenceCursor);
      }
      if (MARKERS.addGeofencePolygonCursor) {
        map.removePolygons(MARKERS.addGeofencePolygonCursor);
        MARKERS.addGeofencePolygonCursor = null;
      }      
      POLYGON_GEOFENCE_VERTICES = [];
    }
  }, [isCreatingPolygon]);

  /// onGeofence Effect.
  React.useEffect(() => {    
    if (geofenceEvent == null) { return }    
    if (map === null) { return; }
    handleGeofenceEvent(geofenceEvent);    
  }, [geofenceEvent]);

  /// onGeofencesChange Effect.
  React.useEffect(() => {  
    if (!geofencesChangeEvent || !map) return;
    updateGeofences(geofencesChangeEvent);
  }, [geofencesChangeEvent]);

  /// Re-render active Geofence map Circle / Polygon.
  const updateGeofences = async (event) => {
    if (MARKERS.activeGeofences) {      
      await map.removeCircles(MARKERS.activeGeofences);
    }
    if (MARKERS.activePolygons) {
      await map.removePolygons(MARKERS.activePolygons);
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
      circles.push(buildGeofenceCircle(geofence));
      if (geofence.vertices.length > 0) {
        polygons.push(buildGeofencePolygon(geofence));
      } 
    }

    if (circles.length > 0) {
      MARKERS.activeGeofences = await map.addCircles(circles);
    }
    if (polygons.length > 0) {
      MARKERS.activePolygons = await map.addPolygons(polygons);
    }    
  }
  
  /// Re-center the map with provided Location.
  const setCenter = async (location:Location) => {
    if (!map || location.sample) { return; }
          
    updateCurrentLocationMarker(location);

    await map.setCamera({
      coordinate: {
        lat: location.coords.latitude,
        lng: location.coords.longitude
      }
    });    
  }

  /// Update current-location Map Marker.
  const updateCurrentLocationMarker = async (location:Location) => {
    // Push a new point onto our Polygon path List.
    POLYLINE_PATH.push({
      lat: location.coords.latitude,
      lng: location.coords.longitude
    });

    if (MARKERS.currentLocation) {
      await map.removeMarker(MARKERS.currentLocation);
    }
    // Current location "bluedot"
    MARKERS.currentLocation = await map.addMarker({
      coordinate: {
        lat: location.coords.latitude,
        lng: location.coords.longitude
      },
      zIndex: 1000,
      iconUrl: 'bluedot.png',
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
    MARKERS.locationMarkers.push(await map.addMarker({
      coordinate: {
        lat: location.coords.latitude,
        lng: location.coords.longitude
      },
      zIndex: 999,
      iconUrl: 'bluedot.png',
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
      map.removePolylines(MARKERS.polyline);
    }
    
    MARKERS.polyline = await map.addPolylines([{
      zIndex: 1,
      geodesic: true,
      strokeColor: COLORS.polyline_color,
      strokeOpacity: 0.7,
      strokeWeight: 7,
      path: POLYLINE_PATH
    }]);    
  }

  /// Build a bread-crumb location marker.
  const buildLocationMarker = (location:Location, options?:any) => {
    
  }

  /// Build a Geofence Map Circle Marker
  const buildGeofenceCircle = (geofence:Geofence) => {
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
  const buildGeofencePolygon = (geofence) => {
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

  /// Build red stationary geofence marker.
  const showStationaryCircle = async (location:Location) => {
    await hideStationaryCircle();
    await setCenter(location);

    const state = await BackgroundGeolocation.getState();
    const radius = (state.trackingMode == 1) ? 200 : (state.geofenceProximityRadius! / 2);

    MARKERS.stationaryCircle = await map.addCircles([{
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
  const hideStationaryCircle = async () => {
    if (MARKERS.stationaryCircle) {
      await map.removeCircles(MARKERS.stationaryCircle);
      MARKERS.stationaryCircle = null;
    }    
  }
  
  /// Clear all Map Markers.
  const clearMarkers = async () => {
    if (!map) return;
        
    if (MARKERS.stationaryCircle) {
      map.removeCircles(MARKERS.stationaryCircle);
      MARKERS.stationaryCircle = null;
    }    
    if (MARKERS.locationMarkers.length > 0) {      
      map.removeMarkers(MARKERS.locationMarkers);
      MARKERS.locationMarkers = [];
    }    
    if (MARKERS.polyline) {
      map.removePolylines(MARKERS.polyline);
      MARKERS.polyline = null;
      POLYLINE_PATH.splice(0, POLYLINE_PATH.length);
    }
    if (MARKERS.activeGeofences) {
      map.removeCircles(MARKERS.activeGeofences);
      MARKERS.activeGeofences = null;
    }
    if (MARKERS.activePolygons) {
      map.removePolygons(MARKERS.activePolygons);
      MARKERS.activePolygons = null;
    }
    if (MARKERS.geofenceEventMarkers.length > 0) {
      map.removeMarkers(MARKERS.geofenceEventMarkers);
      MARKERS.geofenceEventMarkers = [];
    }
    if (MARKERS.geofenceEventCircles.length > 0) {
      map.removeCircles(MARKERS.geofenceEventCircles);
      MARKERS.geofenceEventCircles = [];
    }
    if (MARKERS.geofenceEventPolylines.length > 0) {      
      map.removePolylines(MARKERS.geofenceEventPolylines);
      MARKERS.geofenceEventPolylines = [];
    }    
  }

  /// Render markers when an onGeofence event fires.
  const handleGeofenceEvent = async (event) => {
    const isEnter = event.action == 'ENTER';

    const geofence = await BackgroundGeolocation.getGeofence(event.identifier);
    const location = event.location;
    const center = {
      latitude: geofence.latitude,
      longitude: geofence.longitude
    };
    const radius = geofence.radius;

    MARKERS.geofenceEventMarkers.push(await map.addMarker({
      coordinate: {
        lat: location.coords.latitude,
        lng: location.coords.longitude
      },
      iconSize: {
        width: 32,
        height: 32
      },
      iconUrl: (event.action === 'ENTER') ? 'geofence-enter.png' : 'geofence-exit.png'
    }));
    
    const bearing = getBearing(center, location.coords);
    const edgeCoordinate = computeOffsetCoordinate(center, radius, bearing);

    MARKERS.geofenceEventMarkers.push(await map.addMarker({
      coordinate: {
        lat: edgeCoordinate.latitude,
        lng: edgeCoordinate.longitude
      },
      iconSize: {
        width: 32,
        height: 48
      },
      iconUrl: (isEnter) ? 'geofence-enter.png' : 'geofence-exit.png'
    }));
    MARKERS.geofenceEventPolylines = MARKERS.geofenceEventPolylines.concat(await map.addPolylines([{
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
    MARKERS.geofenceEventCircles = MARKERS.geofenceEventCircles.concat(await map.addCircles([{
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
    
  /// Create the @capacitor/google-maps instance.
  const mapRef = useRef<HTMLElement>();

  const createMap = async () => {
    if (!mapRef.current) return;
    if (map) return;

    map = await GoogleMap.create({
      id: 'map',
      element: mapRef.current,
      apiKey: ENV.GOOGLE_MAPS_API_KEY,
      config: {
        center: {
          lat: 45.508888,
          lng: -73.561668
        },
        zoom: 11,
      }
    });

    map.setOnMapClickListener(onMapClick);  

    const ionContent:HTMLElement = document.querySelector('.AdvancedApp ion-content');  
    if (ionContent != null) {      
      setMapHeight(ionContent.offsetHeight);
      setMapWidth(ionContent.offsetWidth);
    }    
    setMapReady(true);
  };

  /// @capacitor/google-maps Map-click listener.
  const onMapClick = React.useCallback(async (coords) => {            
    if (IS_CREATING_POLYGON) {
      POLYGON_GEOFENCE_VERTICES.push([coords.latitude, coords.longitude]); 
      renderPolygonGeofenceCursor()
    } else {
      if (MARKERS.addGeofenceCursor.length > 0) {
        map.removeMarkers(MARKERS.addGeofenceCursor);
        if (MARKERS.addGeofencePolygonCursor) {
          map.removePolygons(MARKERS.addGeofencePolygonCursor);
        }
      }
      onClickAddGeofence({
        latitude: coords.latitude,
        longitude: coords.longitude
      });
    }
    MARKERS.addGeofenceCursor.push(await map.addMarker({      
      coordinate: {
        lat: coords.latitude,
        lng: coords.longitude
      }
    }));
  }, [geofenceCoordinate]);

  /// "Add Geofence" modal.  Initiated from long-pressing on map.
  const [presentGeofenceView, dismissGeofenceView] = useIonModal(GeofenceView, {        
    coordinate: geofenceCoordinate,
    vertices: geofenceVertices,
    onDismiss: () => {
      dismissGeofenceView();
    }
  });

  const onClickAddGeofence = async (coords) => {
    setGeofenceCoordinate(coords);
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
    switch (result.index) {
      case 0:
        IS_CREATING_POLYGON = false;
        POLYGON_GEOFENCE_VERTICES = [];
        setGeofenceVertices(POLYGON_GEOFENCE_VERTICES);
        presentGeofenceView();        
        break;
      case 1:
        // polygon
        POLYGON_GEOFENCE_VERTICES.push([coords.latitude, coords.longitude]);
        IS_CREATING_POLYGON = true;
        setIsCreatingPolygon(true);
        break;
      case 2:
        // cancel
        setIsCreatingPolygon(false);
        break;
    }    
  }

  /// When user clicks the map, a "Create Geofence" menu appears.  When they select "Polygon", this menu appears.
  const polygonGeofenceMenu = () => {
    return (isCreatingPolygon) ?  (<IonToolbar mode="ios" color="dark" className="polygon-geofence-menu">
        <IonTitle color="light" size="small">Create Polygon</IonTitle>
        <IonButtons slot="start">
          <IonButton onClick={() => {onClickCancelPolygon()}}>Cancel</IonButton>
          <IonButton onClick={() => {onClickUndoPolygon()}}><IonIcon icon={iconUndo}/></IonButton>
        </IonButtons>
        <IonButtons slot="end">
          <IonButton onClick={() => {onClickAddPolygon()}}>Continue</IonButton>
        </IonButtons>                        
      </IonToolbar>
    ) : null;  
  }

  /// Renders the current Polygon Geofence under construction.
  const renderPolygonGeofenceCursor = async () => {
    if (MARKERS.addGeofencePolygonCursor) {
      await map.removePolygons(MARKERS.addGeofencePolygonCursor);
    }
    if (POLYGON_GEOFENCE_VERTICES.length == 0) {
      return;
    }
    MARKERS.addGeofencePolygonCursor = await map.addPolygons([{
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
  const onClickAddPolygon = () => {
    const vertices = POLYGON_GEOFENCE_VERTICES.map((coord) => { return coord; });
    setGeofenceVertices(vertices);
    setIsCreatingPolygon(false);
    presentGeofenceView();
  }
  /// User clicks [Cancel] Polygon Geofence.
  const onClickCancelPolygon = () => {
    setIsCreatingPolygon(false);    
  }
  /// User clicks [UNDO] button to delete a Polygon vertex
  const onClickUndoPolygon = () => {
    POLYGON_GEOFENCE_VERTICES.pop();    
    const markerId = MARKERS.addGeofenceCursor.pop();
    if (markerId) {
      map.removeMarker(markerId);
    }    
    renderPolygonGeofenceCursor();    
  }
  /// Render the view.
  return (
    <div id="MapView-container">
      {polygonGeofenceMenu()}
      <capacitor-google-map ref={mapRef} style={{
        display: 'inline-block',
        width: mapWidth,
        height: mapHeight
      }}></capacitor-google-map>
    </div>
  )
};

export default MapView;
