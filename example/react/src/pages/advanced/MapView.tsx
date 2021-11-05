// TODO css:  import './ExploreContainer.css';
import React from "react";

import {useIonModal} from '@ionic/react';
import { useHistory } from 'react-router-dom';

import BackgroundGeolocation, {
  State,
  Subscription,
  Location,
  Geofence,
  GeofenceEvent,
  GeofencesChangeEvent,
  MotionChangeEvent,
} from "@transistorsoft/capacitor-background-geolocation";

import SettingsService from "./lib/SettingsService";
import {LongPress} from './lib/LongPress';
import {COLORS} from "../../config/Colors";
import GeofenceView from "./GeofenceView";

declare var google:any;

interface ContainerProps { }

const SUBSCRIPTIONS:Subscription[] = [];

let lastLocation:Location|null = null;
let currentLocationMarker:any = null;
let lastDirectionChangeLocation:Location|null = null;
let locationAccuracyCircle:any = null;
let stationaryRadiusCircle:any = null;
let polyline:any = null;
let geofenceCursor:any = null;
let map:any = null;

const locationMarkers:any = [];
let geofenceMarkers:any = [];
let geofenceHitMarkers:any = [];
let geofenceHits:any = {};

const subscribe = (subscription:Subscription) => {
  SUBSCRIPTIONS.push(subscription);
}
const unsubscribe = () => {
  SUBSCRIPTIONS.forEach((subscription:Subscription) => subscription.remove() )
  SUBSCRIPTIONS.splice(0, SUBSCRIPTIONS.length);
}

const MapView: React.FC<ContainerProps> = () => {
  const settingsService = SettingsService.getInstance();
  const history = useHistory();

  const [enabled, setEnabled] = React.useState(false);
  const [location, setLocation] = React.useState<Location|null>(null);
  const [motionChangeEvent, setMotionChangeEvent] = React.useState<MotionChangeEvent|null>(null);
  const [geofenceEvent, setGeofenceEvent] = React.useState<GeofenceEvent|null>(null);
  const [geofencesChangeEvent, setGeofencesChangeEvent] = React.useState<GeofencesChangeEvent|null>(null);
  const [state, setState] = React.useState<State|null>(null);
  const [geofenceCoordinate, setGeofenceCoordinate] = React.useState<any>();

  /// "Add Geofence" modal.  Initiated from long-pressing on map.
  const [presentGeofenceView, dismissGeofenceView] = useIonModal(GeofenceView, {
    coordinate: geofenceCoordinate,
    onDismiss: () => {
      dismissGeofenceView();
    }
  });

  React.useEffect(() => {
    createGoogleMap();

    /// Subscribe to BackgroundGeolocation events.
    subscribe(BackgroundGeolocation.onLocation(setLocation, (error) => {
      console.warn('[onLocation] ERROR: ', error);
    }));
    subscribe(BackgroundGeolocation.onMotionChange(setMotionChangeEvent));
    subscribe(BackgroundGeolocation.onGeofence(setGeofenceEvent));
    subscribe(BackgroundGeolocation.onGeofencesChange(setGeofencesChangeEvent));
    subscribe(BackgroundGeolocation.onEnabledChange(setEnabled));

    return () => {
      // Cleanup when view is destroyed or refreshed.
      clearMarkers();
      unsubscribe();
    }
  }, []);

  /// onLocation Effect.
  React.useEffect(() => {
    if (location === null) { return; }
    if (map === null) { return; }

    setCenter(location);

    setTimeout(function() {
      map.setCenter(new google.maps.LatLng(location.coords.latitude, location.coords.longitude));
    });

  }, [location]);

  /// onEnabledChange Effect
  React.useEffect(() => {
    BackgroundGeolocation.getState((state:State) => {
      setState(state);
    });
    if (!enabled) {
      clearMarkers();
    }
  }, [enabled]);

  /// onMotionChange Effect.
  React.useEffect(() => {
    if (motionChangeEvent === null) { return; }
    if (motionChangeEvent.isMoving) {
      hideStationaryCircle();
    } else {
      showStationaryCircle(motionChangeEvent.location);
    }
  }, [motionChangeEvent]);

  /// onGeofence Effect.
  React.useEffect(() => {
    if (geofenceEvent === null) { return; }

    const circle = geofenceMarkers.find((marker:any) => {
      return marker.identifier === geofenceEvent.identifier;
    });

    if (!circle) { return; }

    const location = geofenceEvent.location;
    let geofenceMarker = geofenceHits[geofenceEvent.identifier];
    if (!geofenceMarker) {
      geofenceMarker = {
        circle: new google.maps.Circle({
          zIndex: 100,
          fillOpacity: 0,
          strokeColor: COLORS.black,
          strokeWeight: 1,
          strokeOpacity: 1,
          radius: circle.getRadius()+1,
          center: circle.getCenter(),
          map: map
        }),
        events: []
      };
      geofenceHits[geofenceEvent.identifier] = geofenceMarker;
      geofenceHitMarkers.push(geofenceMarker.circle);
    }

    let color;
    if (geofenceEvent.action === 'ENTER') {
      color = COLORS.green;
    } else if (geofenceEvent.action === 'DWELL') {
      color = COLORS.gold;
    } else {
      color = COLORS.red;
    }

    const circleLatLng = geofenceMarker.circle.getCenter();
    const locationLatLng = new google.maps.LatLng(location.coords.latitude, location.coords.longitude);
    const distance = google.maps.geometry.spherical.computeDistanceBetween (circleLatLng, locationLatLng);

    // Push event
    geofenceMarker.events.push({
      action: geofenceEvent.action,
      location: geofenceEvent.location,
      distance: distance
    });

    const heading = google.maps.geometry.spherical.computeHeading(circleLatLng, locationLatLng);
    const circleEdgeLatLng = google.maps.geometry.spherical.computeOffset(circleLatLng, geofenceMarker.circle.getRadius(), heading);

    geofenceMarker.events.push({
      location: geofenceEvent.location,
      action: geofenceEvent.action,
      distance: distance
    });

    const geofenceEdgeMarker = new google.maps.Marker({
      zIndex: 1000,
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 5,
        fillColor: color,
        fillOpacity: 0.7,
        strokeColor: COLORS.black,
        strokeWeight: 1,
        strokeOpacity: 1
      },
      map: map,
      position: circleEdgeLatLng
    });
    geofenceHitMarkers.push(geofenceEdgeMarker);

    const locationMarker = buildLocationMarker(location, {
      showHeading: true
    });
    locationMarker.setMap(map);
    geofenceHitMarkers.push(locationMarker);

    const polyline = new google.maps.Polyline({
      map: map,
      zIndex: 1000,
      geodesic: true,
      strokeColor: COLORS.black,
      strokeOpacity: 1,
      strokeWeight: 1,
      path: [circleEdgeLatLng, locationMarker.getPosition()]
    });
    geofenceHitMarkers.push(polyline);

    // Change the color of activated geofence to light-grey.
    circle.activated = true;
    circle.setOptions({
      fillColor: COLORS.grey,
      fillOpacity: 0.2,
      strokeColor: COLORS.grey,
      strokeOpacity: 0.4
    });

  }, [geofenceEvent]);

  /// onGeofencesChange Effect.
  React.useEffect(() => {
    if (geofencesChangeEvent === null) { return; }

    // All geofences off
    if (!geofencesChangeEvent.on.length && !geofencesChangeEvent.off.length) {
      geofenceMarkers.forEach((circle:any) => {
        circle.setMap(null);
      });
      geofenceMarkers.splice(0, geofenceMarkers.length);
      return;
    }

    // Filter out all "off" geofences.
    geofenceMarkers = geofenceMarkers.filter((circle:any) => {
      if (geofencesChangeEvent.off.indexOf(circle.identifier) < 0) {
        return true;
      } else {
        circle.setMap(null);
        return false;
      }
    });

    // Add new "on" geofences.
    geofencesChangeEvent.on.forEach((geofence:Geofence) => {
      const circle = geofenceMarkers.find((marker:any) => { return marker.identifier === geofence.identifier;});
      // Already added?
      if (circle) { return; }
      geofenceMarkers.push(buildGeofenceMarker(geofence));
    });
  }, [geofencesChangeEvent]);

  /// Creates the Google Maps instance and all its assets.
  const createGoogleMap = () => {
    // If we don't have a map element here, we cannot continue.
    if (typeof(google) !== 'object') {
      settingsService.alert('Fatal Error', 'Failed to load Google Maps Javascript SDK');
      return history.goBack();
    }

    const latLng = new google.maps.LatLng(-34.9290, 138.6010);
    const mapOptions = {
      center: latLng,
      zoom: 15,
      mapTypeId: google.maps.MapTypeId.ROADMAP,
      zoomControl: false,
      mapTypeControl: false,
      panControl: false,
      rotateControl: false,
      scaleControl: false,
      streetViewControl: false,
      disableDefaultUI: true
    };

    const el = document.getElementById('map');
    map = new google.maps.Map(el, mapOptions);

    // LongPress component for adding geofences.
    new LongPress(map, 500);
    // Tap&hold detected.  Play a sound a draw a circular cursor.
    google.maps.event.addListener(map, 'longpresshold', onLongPressStart);
    // Longpress cancelled.  Get rid of the circle cursor.
    google.maps.event.addListener(map, 'longpresscancel', onLongPressCancel);
    // Longpress initiated, add the geofence
    google.maps.event.addListener(map, 'longpress', onLongPress);

    // Blue current location marker
    currentLocationMarker = new google.maps.Marker({
      zIndex: 10,
      map: map,
      title: 'Current Location',
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 12,
        fillColor: COLORS.blue,
        fillOpacity: 1,
        strokeColor: COLORS.white,
        strokeOpacity: 1,
        strokeWeight: 6
      }
    });
    // Light blue location accuracy circle
    locationAccuracyCircle = new google.maps.Circle({
      map: map,
      zIndex: 9,
      fillColor: COLORS.light_blue,
      fillOpacity: 0.4,
      strokeOpacity: 0
    });
    // Stationary Geofence

    stationaryRadiusCircle = new google.maps.Circle({
      zIndex: 0,
      fillColor: COLORS.red,
      strokeColor: COLORS.red,
      strokeWeight: 1,
      fillOpacity: 0.3,
      strokeOpacity: 0.7,
      map: map
    });
    // Route polyline
    let seq = {
      repeat: '30px',
      icon: {
        path: google.maps.SymbolPath.FORWARD_OPEN_ARROW,
        scale: 1,
        fillOpacity: 0,
        strokeColor: COLORS.white,
        strokeWeight: 1,
        strokeOpacity: 1
      }
    };
    polyline = new google.maps.Polyline({
      map: map,
      zIndex: 1,
      geodesic: true,
      strokeColor: COLORS.polyline_color,
      strokeOpacity: 0.7,
      strokeWeight: 7,
      icons: [seq]
    });
    // Popup geofence cursor for adding geofences via LongPress
    geofenceCursor = new google.maps.Marker({
      clickable: false,
      zIndex: 100,
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 100,
        fillColor: COLORS.green,
        fillOpacity: 0.2,
        strokeColor: COLORS.green,
        strokeWeight: 1,
        strokeOpacity: 0.7
      }
    });
  }
  /// LongPress events
  const onLongPressStart = (e:any) => {
    settingsService.playSound('LONG_PRESS_ACTIVATE');
    geofenceCursor.setPosition(e.latLng);
    geofenceCursor.setMap(map);
  }

  const onLongPressCancel = (e:any) => {
    settingsService.playSound('LONG_PRESS_CANCEL');
    geofenceCursor.setMap(null);
  }

  const onLongPress = (e:any) => {
    const latlng = e.latLng;
    geofenceCursor.setMap(null);
    setGeofenceCoordinate(latlng);
    presentGeofenceView();
  }

  /// Re-center the map with provided Location.
  const setCenter = (location:Location) => {
    updateCurrentLocationMarker(location);
    setTimeout(() => {
      map.setCenter(new google.maps.LatLng(location.coords.latitude, location.coords.longitude));
    });
  }

  /// Update current-location Map Marker.
  const updateCurrentLocationMarker = (location:Location) => {
    var latlng = new google.maps.LatLng(location.coords.latitude, location.coords.longitude);
    currentLocationMarker.setPosition(latlng);
    locationAccuracyCircle.setCenter(latlng);
    locationAccuracyCircle.setRadius(location.coords.accuracy);

    if (location.sample === true) {
      return;
    }
    if (lastLocation !== null) {
      locationMarkers.push(buildLocationMarker(location));
    }
    // Add breadcrumb to current Polyline path.
    polyline.getPath().push(latlng);
    polyline.setMap(map);
    lastLocation = location;
  }

  /// Build a bread-crumb location marker.
  const buildLocationMarker = (location:Location, options?:any) => {
    options = options || {};
    let icon = google.maps.SymbolPath.CIRCLE;
    let scale = 3;
    let zIndex = 1;
    let anchor;
    let strokeWeight = 1;

    if (lastDirectionChangeLocation === null) {
      lastDirectionChangeLocation = location;
    }

    // Render an arrow marker if heading changes by 10 degrees or every 5 points.
    var deltaHeading = Math.abs(location.coords.heading! - lastDirectionChangeLocation.coords.heading!);
    if ((deltaHeading >= 15) || !(locationMarkers.length % 5) || options.showHeading) {
      icon = google.maps.SymbolPath.FORWARD_CLOSED_ARROW;
      scale = 2;
      strokeWeight = 1;
      anchor = new google.maps.Point(0, 2.6);
      lastDirectionChangeLocation = location;
    }

    return new google.maps.Marker({
      zIndex: zIndex,
      icon: {
        path: icon,
        rotation: location.coords.heading,
        scale: scale,
        anchor: anchor,
        fillColor: COLORS.polyline_color,
        fillOpacity: 1,
        strokeColor: COLORS.black,
        strokeWeight: strokeWeight,
        strokeOpacity: 1
      },
      map: map,
      position: new google.maps.LatLng(location.coords.latitude, location.coords.longitude)
    });
  }

  /// Build a Geofence Map Marker.
  const buildGeofenceMarker = (geofence:Geofence) => {
    // Add longpress event for adding GeoFence of hard-coded radius 200m.
    const circle = new google.maps.Circle({
      identifier: geofence.identifier,
      zIndex: 100,
      fillColor: COLORS.green,
      fillOpacity: 0.2,
      strokeColor: COLORS.green,
      strokeWeight: 1,
      strokeOpacity: 0.7,
      params: geofence,
      radius: geofence.radius,
      center: new google.maps.LatLng(geofence.latitude, geofence.longitude),
      map: map
    });
    // Add 'click' listener to geofence so we can edit it.
    google.maps.event.addListener(geofence, 'click', () => {
      console.log('Geofence click handler: NO IMPLEMENTATION', geofence);
    });
    return circle;
  }

  /// Build a stop-zone Map Marker.
  const buildStopZoneMarker = (latlng:any) => {
    return new google.maps.Marker({
      zIndex: 1,
      map: map,
      position: latlng,
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 12,
        fillColor: COLORS.red,
        fillOpacity: 0.3,
        strokeColor: COLORS.red,
        strokeWeight: 1,
        strokeOpacity: 0.7
      }
    });
  }

  /// Build red stationary geofence marker.
  const showStationaryCircle = async (location:Location) => {
    const state = await BackgroundGeolocation.getState();
    const coords = location.coords;
    const radius = (state.trackingMode == 1) ? 200 : (state.geofenceProximityRadius! / 2);
    const center = new google.maps.LatLng(coords.latitude, coords.longitude);

    stationaryRadiusCircle.setRadius(radius);
    stationaryRadiusCircle.setCenter(center);
    stationaryRadiusCircle.setMap(map);
    map.setCenter(center);
  }

  /// Hide the stationary geofence Map Marker.
  const hideStationaryCircle = () => {
    // Create a little red breadcrumb circle of our last stop-position
    const latlng = stationaryRadiusCircle.getCenter();
    const stopZone = buildStopZoneMarker(latlng);
    const lastMarker:any = locationMarkers.pop();
    if (lastMarker) {
      lastMarker.setMap(null);
    }
    locationMarkers.push(stopZone);
    stationaryRadiusCircle.setMap(null);
  }

  /// Reset Map Markers
  const resetMarkers = () => {
    // Clear location-markers.
    locationMarkers.forEach((marker:any) => {
      marker.setMap(null);
    });
    locationMarkers.splice(0, locationMarkers.length);

    // Clear geofence hit markers
    geofenceHitMarkers.forEach((marker:any) => {
      marker.setMap(null);
    })

    polyline.setPath([]);
  }

  /// Clear all Map Markers.
  const clearMarkers = () => {
    if (map === null) { return; }

    resetMarkers();

    geofenceMarkers.forEach((marker:any) => {
      marker.setMap(null);
    });
    geofenceMarkers.splice(0, geofenceMarkers.length);

    // Clear red stationaryRadius marker
    stationaryRadiusCircle.setMap(null);

    // Clear blue route PolyLine
    polyline.setMap(null);
    polyline.setPath([]);
  }

  return (
    <div id="map" className="MapView" style={{height:'100%', width:'100%'}}></div>
  );
};

export default MapView;
