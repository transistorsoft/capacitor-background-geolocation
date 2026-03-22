/// Google Maps view for the Advanced demo.
/// Uses @capacitor/google-maps native overlay with Ionic components for geofence UX.

import { App } from '@capacitor/app';
import React, { useRef } from 'react';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { GoogleMap } from '@capacitor/google-maps';
import { IonButton } from '@ionic/react';

import BackgroundGeolocation, {
  State,
  Subscription,
  Location,
  Geofence,
  GeofenceEvent,
  GeofencesChangeEvent,
  MotionChangeEvent,
} from '@transistorsoft/capacitor-background-geolocation';

import TSDialog from '../lib/Dialog';
import { COLORS } from '../config/Colors';
import AddGeofenceTypeSheet, { AddGeofenceType } from './AddGeofenceTypeSheet';
import AddGeofenceSheet from './AddGeofenceSheet';
import { ENV } from '../config/ENV';
import { getBearing, computeOffsetCoordinate } from '../lib/GeoMath';

// Module-level globals (survive React re-renders)
const SUBSCRIPTIONS: Subscription[] = [];
const POLYLINE_PATH: any[] = [];

const MARKERS: any = {
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
  motionChangePolylines: [],
};

const EVENT_QUEUE: any = {
  location: [],
  geofence: [],
  geofencesChange: [],
  motionChange: [],
};

const ACTIVE_GEOFENCES = new Map<string, Geofence>();
let IS_CREATING_POLYGON = false;
let POLYGON_GEOFENCE_VERTICES: number[][] = [];

let map: GoogleMap | null = null;
let stationaryLocation: Location | null = null;
let lastClickTime = 0; // debounce guard for double-firing click listener
let updatingCurrentLocation = false; // mutex for bluedot marker updates

const subscribe = (sub: Subscription) => SUBSCRIPTIONS.push(sub);
const unsubscribe = () => {
  SUBSCRIPTIONS.forEach(sub => sub.remove());
  SUBSCRIPTIONS.splice(0, SUBSCRIPTIONS.length);
};

// Component
interface MapViewProps {
  onReady: (ready: boolean) => void;
  hideAddGeofencePrompt?: boolean;
}

const MapView: React.FC<MapViewProps> = (props) => {
  const dialog = TSDialog.getInstance();
  const mapRef = useRef<HTMLElement>(null as any);

  const [enabled, setEnabled] = React.useState(false);
  const [location, setLocation] = React.useState<Location | null>(null);
  const [motionChangeEvent, setMotionChangeEvent] = React.useState<MotionChangeEvent | null>(null);
  const [geofenceEvent, setGeofenceEvent] = React.useState<GeofenceEvent | null>(null);
  const [geofencesChangeEvent, setGeofencesChangeEvent] = React.useState<GeofencesChangeEvent | null>(null);
  const [mapReady, setMapReady] = React.useState(false);
  const [isCreatingPolygon, setIsCreatingPolygon] = React.useState(false);
  const [mapWidth, setMapWidth] = React.useState(window.innerWidth);
  const [mapHeight, setMapHeight] = React.useState(window.innerHeight - 104);

  // New sheet visibility states (mirroring RN)
  const [isAddGeofenceTypeSheetVisible, setIsAddGeofenceTypeSheetVisible] = React.useState(false);
  const [isAddGeofenceSheetVisible, setIsAddGeofenceSheetVisible] = React.useState(false);
  const [pendingGeofenceCoordinate, setPendingGeofenceCoordinate] = React.useState<{ latitude: number; longitude: number } | null>(null);
  const [pendingPolygonVertices, setPendingPolygonVertices] = React.useState<{ latitude: number; longitude: number }[]>([]);
  const [createPolygonGeofenceCoordinates, setCreatePolygonGeofenceCoordinates] = React.useState<any[]>([]);

  // Main effect
  React.useEffect(() => {
    subscribe(BackgroundGeolocation.onLocation(setLocation, err => {
      console.warn('[onLocation] ERROR:', err);
    }));
    subscribe(BackgroundGeolocation.onMotionChange(setMotionChangeEvent));
    subscribe(BackgroundGeolocation.onGeofence(setGeofenceEvent));
    subscribe(BackgroundGeolocation.onGeofencesChange(setGeofencesChangeEvent));
    subscribe(BackgroundGeolocation.onEnabledChange(setEnabled));

    BackgroundGeolocation.getState().then((s: State) => setEnabled(s.enabled));

    App.getState().then((appState) => {
      if (appState.isActive) {
        createMap();
      } else {
        props.onReady(true);
      }
    });

    const appStateListener = App.addListener('appStateChange', ({ isActive }) => {
      if (isActive && map == null) createMap();
    });

    const handleResize = () => {
      setMapWidth(window.innerWidth);
      setMapHeight(window.innerHeight - 104);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      clearMarkers();
      unsubscribe();
      appStateListener.then(l => l.remove());
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Effects
  React.useEffect(() => {
    if (!mapReady || !map) return;
    props.onReady(mapReady);
  }, [mapReady]);

  React.useEffect(() => {
    if (location === null) return;
    if (map === null) { EVENT_QUEUE.location.push(location); return; }
    updateCurrentLocationMarker(location);
  }, [location]);

  React.useEffect(() => {
    if (!map) return;
    if (!enabled) clearMarkers();
  }, [enabled]);

  React.useEffect(() => {
    if (!motionChangeEvent) return;
    if (!map) { EVENT_QUEUE.motionChange.push(motionChangeEvent); return; }
    handleMotionChangeEvent(motionChangeEvent);
  }, [motionChangeEvent]);

  React.useEffect(() => {
    IS_CREATING_POLYGON = isCreatingPolygon;
    if (!isCreatingPolygon) {
      if (MARKERS.addGeofenceCursor.length > 0) map?.removeMarkers(MARKERS.addGeofenceCursor);
      if (MARKERS.addGeofencePolygonCursor) {
        map?.removePolygons(MARKERS.addGeofencePolygonCursor);
        MARKERS.addGeofencePolygonCursor = null;
      }
      POLYGON_GEOFENCE_VERTICES = [];
    }
  }, [isCreatingPolygon]);

  React.useEffect(() => {
    if (!geofenceEvent) return;
    if (!map) {
      EVENT_QUEUE.geofence.push(geofenceEvent);
      EVENT_QUEUE.location.push(geofenceEvent.location);
      return;
    }
    handleGeofenceEvent(geofenceEvent);
    updateCurrentLocationMarker(geofenceEvent.location);
  }, [geofenceEvent]);

  React.useEffect(() => {
    if (!geofencesChangeEvent) return;
    if (!map) { EVENT_QUEUE.geofencesChange.push(geofencesChangeEvent); return; }
    updateGeofences(geofencesChangeEvent);
  }, [geofencesChangeEvent]);

  // Map creation
  const createMap = async () => {
    if (!mapRef.current || map) return;

    map = await GoogleMap.create({
      id: 'map',
      element: mapRef.current,
      apiKey: ENV.GOOGLE_MAPS_API_KEY,
      forceCreate: true,
      config: { center: { lat: 45.508888, lng: -73.561668 }, zoom: 16 },
    });

    map.setOnMapClickListener(onMapClick);
    map.setCamera({ zoom: 16 });

    setMapWidth(window.innerWidth);
    setMapHeight(window.innerHeight - 104);
    setMapReady(true);

    // Flush queued events
    if (EVENT_QUEUE.location.length > 0) {
      const lastLoc = EVENT_QUEUE.location[EVENT_QUEUE.location.length - 1];
      await updateCurrentLocationMarker(lastLoc);
    }
    EVENT_QUEUE.location.forEach(async (loc: Location) => {
      MARKERS.locationMarkers.push(await map!.addMarker(buildLocationMarker(loc)));
      POLYLINE_PATH.push({ lat: loc.coords.latitude, lng: loc.coords.longitude });
    });
    if (POLYLINE_PATH.length > 0) {
      MARKERS.polyline = await map.addPolylines([{
        zIndex: 9, geodesic: true,
        strokeColor: COLORS.polyline_color, strokeOpacity: 0.6, strokeWeight: 10,
        path: POLYLINE_PATH,
      }]);
    }
    EVENT_QUEUE.geofence.forEach(async (e: any) => { await handleGeofenceEvent(e); });
    EVENT_QUEUE.motionChange.forEach(async (e: any) => { await handleMotionChangeEvent(e); });
    EVENT_QUEUE.geofencesChange.forEach(async (e: any) => { await updateGeofences(e); });

    if (EVENT_QUEUE.location.length > 0) setCenter(EVENT_QUEUE.location.pop());

    EVENT_QUEUE.location = [];
    EVENT_QUEUE.geofence = [];
    EVENT_QUEUE.motionChange = [];
    EVENT_QUEUE.geofencesChange = [];
  };

  // Map-click listener
  const onMapClick = React.useCallback(async (coords: any) => {
    // Guard against double-fire (StrictMode / duplicate listener registration)
    const now = Date.now();
    if (now - lastClickTime < 300) return;
    lastClickTime = now;

    if (IS_CREATING_POLYGON) {
      dialog.playSound('TEST_MODE_CLICK');
      Haptics.impact({ style: ImpactStyle.Heavy });
      POLYGON_GEOFENCE_VERTICES.push([coords.latitude, coords.longitude]);
      setCreatePolygonGeofenceCoordinates(prev => [
        ...prev,
        { latitude: coords.latitude, longitude: coords.longitude },
      ]);
      renderPolygonGeofenceCursor();
      // Add numbered vertex marker (static PNGs: polygon-vertex-1.png .. polygon-vertex-20.png)
      const vertexIndex = POLYGON_GEOFENCE_VERTICES.length;
      const markerId = await map?.addMarker({
        coordinate: { lat: coords.latitude, lng: coords.longitude },
        iconUrl: `markers/polygon-vertex-${vertexIndex}.png`,
        iconSize: { width: 24, height: 24 },
        iconAnchor: { x: 12, y: 12 },
        isFlat: true,
        zIndex: 200,
      });
      if (markerId !== undefined) MARKERS.addGeofenceCursor.push(markerId);
    } else {
      if (MARKERS.addGeofenceCursor.length > 0) {
        map?.removeMarkers(MARKERS.addGeofenceCursor);
        if (MARKERS.addGeofencePolygonCursor) map?.removePolygons(MARKERS.addGeofencePolygonCursor);
        MARKERS.addGeofenceCursor = [];
      }
      // Show geofence type action sheet — no marker on initial click
      setPendingGeofenceCoordinate({ latitude: coords.latitude, longitude: coords.longitude });
      dialog.playSound('LONG_PRESS_ACTIVATE');
      Haptics.impact({ style: ImpactStyle.Heavy });
      setIsAddGeofenceTypeSheetVisible(true);
    }
  }, []);

  // Geofence type selection handler
  const onSelectAddGeofenceType = React.useCallback((type: AddGeofenceType) => {
    switch (type) {
      case 'circular':
        if (!pendingGeofenceCoordinate) {
          console.log('[MapView] No pendingGeofenceCoordinate yet.');
          setIsAddGeofenceTypeSheetVisible(false);
          return;
        }
        setIsAddGeofenceTypeSheetVisible(false);
        setIsAddGeofenceSheetVisible(true);
        break;
      case 'polygon':
        IS_CREATING_POLYGON = true;
        POLYGON_GEOFENCE_VERTICES = [];
        setCreatePolygonGeofenceCoordinates([]);
        setIsCreatingPolygon(true);
        setIsAddGeofenceTypeSheetVisible(false);
        break;
      case 'cancel':
      default:
        setIsCreatingPolygon(false);
        setCreatePolygonGeofenceCoordinates([]);
        setPendingPolygonVertices([]);
        setIsAddGeofenceTypeSheetVisible(false);
        break;
    }
  }, [pendingGeofenceCoordinate]);

  // Polygon geofence UX
  const renderPolygonGeofenceCursor = async () => {
    if (MARKERS.addGeofencePolygonCursor) await map?.removePolygons(MARKERS.addGeofencePolygonCursor);
    if (POLYGON_GEOFENCE_VERTICES.length === 0) return;
    MARKERS.addGeofencePolygonCursor = await map?.addPolygons([{
      strokeColor: COLORS.blue, strokeWeight: 5, strokeOpacity: 0.6,
      fillColor: COLORS.polygon_fill_color, fillOpacity: 0.4,
      geodesic: true, clickable: false,
      paths: POLYGON_GEOFENCE_VERTICES.map(v => ({ lat: v[0], lng: v[1] })),
    }]);
  };

  const onClickAddPolygon = () => {
    if (createPolygonGeofenceCoordinates.length < 3) {
      console.log('[MapView] polygon next ignored (need >= 3 vertices)');
      return;
    }
    setPendingPolygonVertices(createPolygonGeofenceCoordinates);
    setIsCreatingPolygon(false);
    setIsAddGeofenceSheetVisible(true);
    dialog.playSound('TEST_MODE_CLICK');
    Haptics.impact({ style: ImpactStyle.Heavy });
  };

  const onClickCancelPolygon = () => {
    setIsCreatingPolygon(false);
    setCreatePolygonGeofenceCoordinates([]);
    setPendingGeofenceCoordinate(null);
    dialog.playSound('TEST_MODE_CLICK');
    Haptics.impact({ style: ImpactStyle.Heavy });
  };

  const onClickUndoPolygon = () => {
    POLYGON_GEOFENCE_VERTICES.pop();
    setCreatePolygonGeofenceCoordinates(prev => prev.slice(0, -1));
    const markerId = MARKERS.addGeofenceCursor.pop();
    if (markerId) map?.removeMarker(markerId);
    renderPolygonGeofenceCursor();
    dialog.playSound('TEST_MODE_CLICK');
    Haptics.impact({ style: ImpactStyle.Heavy });
  };

  // Location marker helpers
  const updateCurrentLocationMarker = async (loc: Location) => {
    if (!map) return;
    // Serialize updates to prevent duplicate bluedot markers from async races
    if (updatingCurrentLocation) return;
    updatingCurrentLocation = true;
    try {
      const oldMarker = MARKERS.currentLocation;
      MARKERS.currentLocation = null;
      if (oldMarker) {
        try { await map.removeMarker(oldMarker); } catch (_e) {}
      }
      MARKERS.currentLocation = await map.addMarker({
        coordinate: { lat: loc.coords.latitude, lng: loc.coords.longitude },
        zIndex: 100, isFlat: true,
        iconUrl: 'markers/bluedot.png',
        iconSize: { height: 24, width: 24 },
        iconAnchor: { x: 12, y: 12 },
      });
    } finally {
      updatingCurrentLocation = false;
    }

    MARKERS.locationMarkers.push(await map.addMarker(buildLocationMarker(loc)));

    if (!enabled) return;

    POLYLINE_PATH.push({ lat: loc.coords.latitude, lng: loc.coords.longitude });
    if (MARKERS.polyline) {
      try { map.removePolylines(MARKERS.polyline); } catch (_e) {}
    }
    MARKERS.polyline = await map.addPolylines([{
      zIndex: 9, geodesic: true,
      strokeColor: COLORS.polyline_color, strokeOpacity: 0.6, strokeWeight: 10,
      path: POLYLINE_PATH,
    }]);
    setCenter(loc);
  };

  const buildLocationMarker = (loc: Location) => {
    let iconIndex = (loc.coords.heading >= 0) ? Math.round(loc.coords.heading / 10) : 0;
    if (iconIndex > 36) iconIndex = 0;
    return {
      coordinate: { lat: loc.coords.latitude, lng: loc.coords.longitude },
      isFlat: true, zIndex: 10,
      iconUrl: `markers/location-arrow-${iconIndex}.png`,
      iconSize: { height: 16, width: 16 },
      iconAnchor: { x: 8, y: 8 },
    };
  };

  const setCenter = async (loc: Location) => {
    if (!map || loc.sample) return;
    map.setCamera({ coordinate: { lat: loc.coords.latitude, lng: loc.coords.longitude } });
  };

  // Motion-change helpers
  const handleMotionChangeEvent = async (evt: MotionChangeEvent) => {
    const loc = evt.location;
    if (evt.isMoving) {
      if (!stationaryLocation) stationaryLocation = loc;
      map?.addCircles([buildMotionChangeCircle(stationaryLocation!)]).then(r => {
        MARKERS.motionChangeCircles = MARKERS.motionChangeCircles.concat(r);
      });
      map?.addPolylines([buildMotionChangePolyline(stationaryLocation!, loc)]).then(r => {
        MARKERS.motionChangePolylines = MARKERS.motionChangePolylines.concat(r);
      });
      hideStationaryCircle();
    } else {
      stationaryLocation = loc;
      showStationaryCircle(loc);
    }
    map?.setCamera({ zoom: 16 });
  };

  const buildMotionChangeCircle = (loc: Location) => ({
    center: { lat: loc.coords.latitude, lng: loc.coords.longitude },
    fillColor: COLORS.red, strokeColor: COLORS.red,
    zIndex: 8, fillOpacity: 0.3, strokeOpacity: 0.7, radius: 25,
  });

  const buildMotionChangePolyline = (from: Location, to: Location) => ({
    zIndex: 8, geodesic: true,
    strokeColor: '#00ff00', strokeOpacity: 0.7, strokeWeight: 10,
    path: [
      { lat: from.coords.latitude, lng: from.coords.longitude },
      { lat: to.coords.latitude, lng: to.coords.longitude },
    ],
  });

  const showStationaryCircle = async (loc: Location) => {
    await hideStationaryCircle();
    const s = await BackgroundGeolocation.getState();
    const radius = (s.trackingMode === 1) ? 200 : ((s.geofenceProximityRadius ?? 1000) / 2);
    MARKERS.stationaryCircle = await map?.addCircles([{
      zIndex: 1,
      center: { lat: loc.coords.latitude, lng: loc.coords.longitude },
      fillColor: COLORS.red, strokeColor: COLORS.red,
      strokeWeight: 1, fillOpacity: 0.3, strokeOpacity: 0.7, radius,
    }]);
  };

  const hideStationaryCircle = async () => {
    if (MARKERS.stationaryCircle) {
      await map?.removeCircles(MARKERS.stationaryCircle);
      MARKERS.stationaryCircle = null;
    }
  };

  const clearMarkers = async () => {
    if (!map) return;
    if (MARKERS.stationaryCircle) { map.removeCircles(MARKERS.stationaryCircle); MARKERS.stationaryCircle = null; }
    if (MARKERS.locationMarkers.length) { map.removeMarkers(MARKERS.locationMarkers); MARKERS.locationMarkers = []; }
    if (MARKERS.polyline) { map.removePolylines(MARKERS.polyline); MARKERS.polyline = null; POLYLINE_PATH.splice(0); }
    if (MARKERS.activeGeofences) { map.removeCircles(MARKERS.activeGeofences); MARKERS.activeGeofences = null; }
    if (MARKERS.activePolygons) { map.removePolygons(MARKERS.activePolygons); MARKERS.activePolygons = null; }
    if (MARKERS.geofenceEventMarkers.length) { map.removeMarkers(MARKERS.geofenceEventMarkers); MARKERS.geofenceEventMarkers = []; }
    if (MARKERS.geofenceEventPolylines.length) { map.removePolylines(MARKERS.geofenceEventPolylines); MARKERS.geofenceEventPolylines = []; }
    if (MARKERS.motionChangePolylines.length) { map.removePolylines(MARKERS.motionChangePolylines); MARKERS.motionChangePolylines = []; }
    if (MARKERS.motionChangeCircles.length) { map.removeCircles(MARKERS.motionChangeCircles); MARKERS.motionChangeCircles = []; }
  };

  // Geofence helpers
  const updateGeofences = async (event: GeofencesChangeEvent) => {
    if (MARKERS.activeGeofences) await map?.removeCircles(MARKERS.activeGeofences);
    if (MARKERS.activePolygons) await map?.removePolygons(MARKERS.activePolygons);

    if (event.on.length === 0 && event.off.length === 0) {
      MARKERS.activeGeofences = null;
      MARKERS.activePolygons = null;
      return;
    }

    event.off.forEach((id: string) => ACTIVE_GEOFENCES.delete(id));
    event.on.forEach((gf: Geofence) => ACTIVE_GEOFENCES.set(gf.identifier, gf));

    const circles: any[] = [];
    const polygons: any[] = [];
    ACTIVE_GEOFENCES.forEach(gf => {
      circles.push(buildGeofenceCircle(gf));
      if (gf.vertices && gf.vertices.length > 0) polygons.push(buildGeofencePolygon(gf));
    });

    if (circles.length > 0) MARKERS.activeGeofences = await map?.addCircles(circles);
    if (polygons.length > 0) MARKERS.activePolygons = await map?.addPolygons(polygons);
  };

  const buildGeofenceCircle = (gf: Geofence) => ({
    identifier: gf.identifier,
    zIndex: 1,
    fillColor: COLORS.green, fillOpacity: 0.2,
    strokeColor: COLORS.green, strokeWeight: 2, strokeOpacity: 1.0,
    params: gf,
    radius: gf.radius,
    center: { lat: gf.latitude, lng: gf.longitude },
  });

  const buildGeofencePolygon = (gf: Geofence) => ({
    zIndex: 2,
    strokeColor: COLORS.blue, strokeWeight: 5, strokeOpacity: 0.7,
    fillColor: COLORS.polygon_fill_color, fillOpacity: 0.4,
    geodesic: true, clickable: false,
    title: gf.identifier,
    paths: (gf.vertices || []).map((v: any) => ({ lat: v[0], lng: v[1] })),
  });

  const handleGeofenceEvent = async (event: GeofenceEvent) => {
    if (!map) return;
    const gf = await BackgroundGeolocation.getGeofence(event.identifier);
    const loc = event.location;

    const center = { latitude: gf.latitude, longitude: gf.longitude };

    let iconColor: string;
    if (event.action === 'ENTER') { iconColor = 'green'; }
    else if (event.action === 'DWELL') { iconColor = 'amber'; }
    else { iconColor = 'red'; }

    let iconIndex = (loc.coords.heading >= 0) ? Math.round(loc.coords.heading / 10) : 0;
    if (iconIndex > 36) iconIndex = 0;

    MARKERS.geofenceEventMarkers.push(await map.addMarker({
      zIndex: 100,
      coordinate: { lat: loc.coords.latitude, lng: loc.coords.longitude },
      iconUrl: `markers/location-arrow-${iconColor}-${iconIndex}.png`,
      iconSize: { width: 24, height: 24 },
      iconAnchor: { x: 10, y: 10 },
    }));

    const bearing = getBearing(center, loc.coords);
    const edgeCoord = computeOffsetCoordinate(center, gf.radius, bearing);
    if (!edgeCoord) return;

    MARKERS.geofenceEventMarkers.push(await map.addMarker({
      zIndex: 500,
      coordinate: { lat: edgeCoord.latitude, lng: edgeCoord.longitude },
      iconUrl: `markers/geofence-event-edge-circle-${event.action.toLowerCase()}.png`,
      iconSize: { width: 10, height: 10 },
      iconAnchor: { x: 5, y: 5 },
    }));

    MARKERS.geofenceEventPolylines = MARKERS.geofenceEventPolylines.concat(await map.addPolylines([{
      geodesic: true, zIndex: 99,
      strokeColor: COLORS.black, strokeOpacity: 1.0, strokeWeight: 2,
      path: [
        { lat: loc.coords.latitude, lng: loc.coords.longitude },
        { lat: edgeCoord.latitude, lng: edgeCoord.longitude },
      ],
    }]));
  };

  // Render
  return (
    <div id="MapView-container" style={{ position: 'relative', flex: 1, overflow: 'hidden' }}>
      {/* Polygon creation toolbar */}
      {isCreatingPolygon && (
        <div className="polygon-toolbar">
          <div className="polygon-toolbar-left">
            <IonButton size="small" fill="clear" onClick={onClickCancelPolygon}>Cancel</IonButton>
            <IonButton
              size="small"
              fill="clear"
              onClick={onClickUndoPolygon}
              disabled={createPolygonGeofenceCoordinates.length === 0}
            >
              Undo
            </IonButton>
          </div>
          <span className="polygon-toolbar-title">Click map to add points</span>
          <IonButton
            size="small"
            fill="solid"
            onClick={onClickAddPolygon}
            disabled={createPolygonGeofenceCoordinates.length < 3}
          >
            Next
          </IonButton>
        </div>
      )}

      {/* Geofence-click hint */}
      {!isCreatingPolygon && !props.hideAddGeofencePrompt && (
        <div id="geofence-prompt">Click map to add geofences</div>
      )}

      {/* Google Map element */}
      <capacitor-google-map
        ref={mapRef}
        style={{
          display: 'inline-block',
          width: `${mapWidth}px`,
          height: `${mapHeight}px`,
        } as React.CSSProperties}
      />

      {/* Add Geofence Type Sheet */}
      <AddGeofenceTypeSheet
        visible={isAddGeofenceTypeSheetVisible}
        onClose={() => setIsAddGeofenceTypeSheetVisible(false)}
        onSelect={onSelectAddGeofenceType}
      />

      {/* Add Geofence Sheet */}
      <AddGeofenceSheet
        visible={isAddGeofenceSheetVisible}
        coordinate={pendingGeofenceCoordinate}
        vertices={pendingPolygonVertices.length ? pendingPolygonVertices : undefined}
        onClose={() => {
          setIsAddGeofenceSheetVisible(false);
          setPendingGeofenceCoordinate(null);
          setPendingPolygonVertices([]);
          setCreatePolygonGeofenceCoordinates([]);
        }}
        onAdded={() => {
          setIsAddGeofenceSheetVisible(false);
          setPendingGeofenceCoordinate(null);
          setPendingPolygonVertices([]);
          setCreatePolygonGeofenceCoordinates([]);
        }}
      />
    </div>
  );
};

export default MapView;
