
import { App } from '@capacitor/app';

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

import { Haptics, ImpactStyle } from '@capacitor/haptics';

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
  addGeofenceCursor: [],
  addGeofencePolygonCursor: null,
  motionChangeCircles: [],
  motionChangePolylines: []
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

let stationaryLocation:Location = null;

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
  const [appIsActive, setAppIsActive] = React.useState(false);

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
    
    App.getState().then((appState) => {
      setAppIsActive(appState.isActive);      
      // @capacitor/google-maps sucks!  It can't render if the app is launched in the background!
      // Use react-native or Flutter instead!
      if (appState.isActive) {
        createMap();
      } else {        
        props.onReady(true);
      }
    })
    const appStateChangeListener = App.addListener('appStateChange', ({ isActive }) => {
      // @capacitor/google-maps has a bug when launched in the background.
      if (isActive && (map == null)) {        
        createMap();
      }
      setAppIsActive(isActive);
    });

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
    BackgroundGeolocation.logger.debug("👍👍👍 [onLocation] " + JSON.stringify(location));
    updateCurrentLocationMarker(location);
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

    const location = motionChangeEvent.location;

    if (motionChangeEvent.isMoving) {
      if (!stationaryLocation) stationaryLocation = location;
      map.addCircles([buildMotionChangeCircle(stationaryLocation)]).then((result) => {
        MARKERS.motionChangeCircles = MARKERS.motionChangeCircles.concat(result);
      });
      map.addPolylines([buildMotionChangePolyline(stationaryLocation, location)]).then((result) => {
        MARKERS.motionChangePolylines = MARKERS.motionChangePolylines.concat(result);
      });
      hideStationaryCircle();
    } else {
      stationaryLocation = location;
      showStationaryCircle(location);
    }
    
    if (map) {      
      map.setCamera({      
        zoom: 16
      });
    }
    
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
    
    if (map) {      
      map.setCamera({
        coordinate: {
          lat: location.coords.latitude,
          lng: location.coords.longitude
        }
      });    
    }
    
  }

  /// Update current-location Map Marker.
  const updateCurrentLocationMarker = async (location:Location) => {
    if (!map) { return }

    setCenter(location);  
    if (MARKERS.currentLocation) {
      try {
        await map.removeMarker(MARKERS.currentLocation);
      } catch(e) {
        console.warn(e);
      }        
    }
    // Current location "bluedot"
    MARKERS.currentLocation = await map.addMarker({
      coordinate: {
        lat: location.coords.latitude,
        lng: location.coords.longitude
      },
      zIndex: 100,
      isFlat: true,
      iconUrl: 'markers/bluedot.png',
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
    
    MARKERS.locationMarkers.push(await map.addMarker({
      coordinate: {
        lat: location.coords.latitude,
        lng: location.coords.longitude
      },
      isFlat: true,
      zIndex: 10,
      iconUrl: `markers/location-arrow-${iconIndex}.png`,
      iconSize: {        
        height: 16,
        width: 16
      },
      iconAnchor: {
        x: 8,
        y: 8
      }      
    }));

    if (!enabled) return;
    
    // Push a new point onto our Polygon path List.
    POLYLINE_PATH.push({
      lat: location.coords.latitude,
      lng: location.coords.longitude
    });

    if (MARKERS.polyline) {
      try {
        map.removePolylines(MARKERS.polyline);
      } catch(e) {
        console.warn(e);
      }
    }

    MARKERS.polyline = await map.addPolylines([{
      zIndex: 9,
      geodesic: true,
      strokeColor: COLORS.polyline_color,
      strokeOpacity: 0.6,
      strokeWeight: 10,
      path: POLYLINE_PATH
    }]);    
  }

  /// Build a bread-crumb location marker.
  const buildLocationMarker = (location:Location, options?:any) => {
    
  }

  const buildMotionChangeCircle = (location:Location) => {
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

  const buildMotionChangePolyline = (from:Location, to:Location) => {
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

  /// Build a Geofence Map Circle Marker
  const buildGeofenceCircle = (geofence:Geofence) => {
    return {
      identifier: geofence.identifier,
      zIndex: 1,
      fillColor: COLORS.green,
      fillOpacity: 0.2,
      strokeColor: COLORS.green,
      strokeWeight: 2,
      strokeOpacity: 1.0,
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
      zIndex: 2,
      strokeColor: COLORS.blue,
      strokeWeight: 5,
      strokeOpacity: 0.7,
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

  /// Build red stationary geofence marker.
  const showStationaryCircle = async (location:Location) => {
    await hideStationaryCircle();
    
    const state = await BackgroundGeolocation.getState();
    const radius = (state.trackingMode == 1) ? 200 : (state.geofenceProximityRadius! / 2);

    MARKERS.stationaryCircle = await map.addCircles([{
      zIndex: 1,
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
    if (MARKERS.geofenceEventPolylines.length > 0) {      
      map.removePolylines(MARKERS.geofenceEventPolylines);
      MARKERS.geofenceEventPolylines = [];
    }
    if (MARKERS.motionChangePolylines.length > 0) {
      map.removePolylines(MARKERS.motionChangePolylines);
      MARKERS.motionChangePolylines = [];
    }
    if (MARKERS.motionChangeCircles.length > 0) {
      map.removeCircles(MARKERS.motionChangeCircles);
      MARKERS.motionChangeCircles = [];
    }
  }

  /// Render markers when an onGeofence event fires.
  const handleGeofenceEvent = async (event) => {
    if (!map) { return }

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
      color = COLORS.red;
      iconColor = 'red';
    }

    let iconIndex = (location.coords.heading >= 0) ? Math.round(location.coords.heading / 10) : 0;
    if (iconIndex > 36) iconIndex = 0;
        
    MARKERS.geofenceEventMarkers.push(await map.addMarker({
      zIndex: 100,
      coordinate: {
        lat: location.coords.latitude,
        lng: location.coords.longitude
      },
      iconUrl: `markers/location-arrow-${iconColor}-${iconIndex}.png`,
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

    MARKERS.geofenceEventMarkers.push(await map.addMarker({
      zIndex: 500,
      coordinate: {
        lat: edgeCoordinate.latitude,
        lng: edgeCoordinate.longitude
      },
      iconUrl: `markers/geofence-event-edge-circle-${event.action.toLowerCase()}.png`,
      iconSize: {
        width: 10,
        height: 10
      },
      iconAnchor: {
        x: 5,
        y: 5
      }
    }));
    
    MARKERS.geofenceEventPolylines = MARKERS.geofenceEventPolylines.concat(await map.addPolylines([{
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
    
  /// Create the @capacitor/google-maps instance.
  const mapRef = useRef<HTMLElement>();

  const createMap = async () => {        
    if (!mapRef.current) return;
    if (map) return;

    map = await GoogleMap.create({
      id: 'map',
      element: mapRef.current,
      apiKey: ENV.GOOGLE_MAPS_API_KEY,
      forceCreate: true,
      config: {
        center: {
          lat: 45.508888,
          lng: -73.561668
        },
        zoom: 16,
      }
    });

    map.setOnMapClickListener(onMapClick);  
    map.setCamera({      
      zoom: 16
    });
    const ionContent:HTMLElement = document.querySelector('.AdvancedApp ion-content');    
    if (ionContent != null) {
      const geofencePrompt:HTMLElement = document.querySelector('#geofence-prompt');
      setMapHeight(ionContent.offsetHeight - geofencePrompt.offsetHeight);
      setMapWidth(ionContent.offsetWidth);
    }    
    setMapReady(true);
  };

  /// @capacitor/google-maps Map-click listener.
  const onMapClick = React.useCallback(async (coords) => {
    
    if (IS_CREATING_POLYGON) {
      SettingsService.getInstance().playSound('TEST_MODE_CLICK');
      Haptics.impact({ style: ImpactStyle.Heavy });
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
    // Play sound and haptics.
    SettingsService.getInstance().playSound('LONG_PRESS_ACTIVATE');
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
    SettingsService.getInstance().playSound('TEST_MODE_CLICK');
    Haptics.impact({ style: ImpactStyle.Heavy });      
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
    return (isCreatingPolygon) ?  (
      <IonToolbar mode="ios" color="secondary" className="polygon-geofence-menu">
        <IonTitle color="dark" size="small">Click map to add polygon points</IonTitle>
        <IonButtons slot="start">
          <IonButton onClick={() => {onClickCancelPolygon()}} color="primary">Cancel</IonButton>
          <IonButton onClick={() => {onClickUndoPolygon()}} color="primary"><IonIcon icon={iconUndo}/></IonButton>
        </IonButtons>
        <IonButtons slot="end">
          <IonButton onClick={() => {onClickAddPolygon()}} color="primary">Continue</IonButton>
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
      strokeWeight: 5,
      strokeOpacity: 0.6,
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
  const onClickAddPolygon = () => {
    const vertices = POLYGON_GEOFENCE_VERTICES.map((coord) => { return coord; });
    setGeofenceVertices(vertices);
    setIsCreatingPolygon(false);
    presentGeofenceView();
    // Play sound and haptics.
    SettingsService.getInstance().playSound('TEST_MODE_CLICK');
    Haptics.impact({ style: ImpactStyle.Heavy });      
  }
  /// User clicks [Cancel] Polygon Geofence.
  const onClickCancelPolygon = () => {
    setIsCreatingPolygon(false);
    // Play sound and haptics.
    SettingsService.getInstance().playSound('TEST_MODE_CLICK');
    Haptics.impact({ style: ImpactStyle.Heavy });      
  }
  /// User clicks [UNDO] button to delete a Polygon vertex
  const onClickUndoPolygon = () => {
    POLYGON_GEOFENCE_VERTICES.pop();    
    const markerId = MARKERS.addGeofenceCursor.pop();
    if (markerId) {
      map.removeMarker(markerId);
    }    
    renderPolygonGeofenceCursor();
    // Play sound and haptics.
    SettingsService.getInstance().playSound('TEST_MODE_CLICK');
    Haptics.impact({ style: ImpactStyle.Heavy });          
  }

  const clickMapToAddGeofencesPrompt = () => {
    return (!isCreatingPolygon) ? <div id="geofence-prompt">Click map to add geofences</div> : null;
  }
  /// Render the view.
  return (
    <div id="MapView-container">
      {polygonGeofenceMenu()}
      {clickMapToAddGeofencesPrompt()}
      <capacitor-google-map ref={mapRef} style={{
        display: 'inline-block',
        width: mapWidth,
        height: mapHeight
      }}></capacitor-google-map>
    </div>
  )
};

export default MapView;
