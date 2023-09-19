import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';


const container = document.getElementById('root');
const root = createRoot(container!);

import ReactDOM from 'react-dom';

import {ENV} from "./config/ENV";

/// Ugly old Google Javascript Maps SDK ref.
declare var google:any;

/// Before rendering the App, first load the Google Maps Javascript SDK
/// This is a bit of a hack using the old Javascript Maps SDK.  Would be much better
/// to use a native Maps implementation.
const loadGoogleMaps = ():Promise<void> => {
  return new Promise((resolve, reject) => {
    if (typeof(google) === 'object') {
      // Already loaded?  Good to go!
      return resolve();
    }
    // Allow up to 10s to load Google Maps Javascript SDK before bailing out and letting
    // the react app render itself.
    const timeout = setTimeout(() => {
      console.warn('[index.tsx] Failed to load Google Maps Javascript SDK within 10s');
      resolve();
    }, 10000);

    // Append Google Maps <script> tag directly to the dom and wait for the onload signal
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?libraries=geometry&key=${ENV.GOOGLE_MAPS_API_KEY}`;
    script.async = true;
    script.onload = () => {
      clearTimeout(timeout);
      console.log('[index.tsx] Loaded Google Maps Javascript SDK');
      resolve();
    }
    document.getElementsByTagName('head')[0].appendChild(script);
  });
}

ReactDOM.render(
  <h1 style={{padding: 10}}>Loading...</h1>, document.getElementById('root')
);

loadGoogleMaps().then(() => {
  ReactDOM.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
    document.getElementById('root')
  );
});

