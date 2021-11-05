import { Redirect, Route } from 'react-router-dom';
import { IonApp, IonRouterOutlet } from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import { Storage } from '@capacitor/storage';
import React from "react";

import { useIonAlert, useIonToast } from '@ionic/react';

import Home from './pages/home/Home';
import HelloWorld from './pages/hello-world/HelloWorld';
import AdvancedApp from './pages/advanced/AdvancedApp';
import SettingsService from "./pages/advanced/lib/SettingsService";

import "./App.css"

/* Core CSS required for Ionic components to work properly */
import '@ionic/react/css/core.css';

/* Basic CSS for apps built with Ionic */
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';

/* Optional CSS utils that can be commented out */
import '@ionic/react/css/padding.css';
import '@ionic/react/css/float-elements.css';
import '@ionic/react/css/text-alignment.css';
import '@ionic/react/css/text-transformation.css';
import '@ionic/react/css/flex-utils.css';
import '@ionic/react/css/display.css';

/* Theme variables */
import './theme/variables.css';

/// Ugly old Google Javascript Maps SDK ref.
declare var google:any;

const App: React.FC = () => {
  /// Provide some UI assets to SettingsService so it can use its methods.
  /// WARNING:  I found I had to disable animations due to timing issues showing
  /// alerts simultaneously, where the second would get hidden from the first's
  /// final teardown after hide animation some between 10-99ms laster.
  ///
  /// - prompt()
  /// - yesNo()
  /// - alert()
  /// - confirm()
  /// - toast()
  const [alert] = useIonAlert();
  const [toast] = useIonToast();
  const [ready, setReady] = React.useState(false);

  /// SettingsService is just a handy helper class in support of the demo app.
  /// It has nothing to do with BackgroundGeolocation.
  SettingsService.getInstance().configure({
    alert: alert,
    toast: toast
  });

  React.useEffect(() => {
    loadGoogleMaps().then(() => setReady(true))
  }, []);

  /// Before rendering the App, first load the Google Maps Javascript SDK
  /// This is a bit of a hack using the old Javascript Maps SDK.  Would be much better
  /// to use a native Maps implementation.
  const loadGoogleMaps = ():Promise<void> => {
    return new Promise((resolve, reject) => {
      if (typeof(google) === 'object') {
        // Already loaded?  Good to go!
        return resolve();
      }
      // Append Google Maps <script> tag directly to the dom and wait for the onload signal to resolve()
      const script = document.createElement('script');
      script.src = "http://maps.google.com/maps/api/js?libraries=geometry&key=AIzaSyDXTDr2C3iU9jgwpNVpZjeWzOc-DyCgkt8";
      script.async = true;
      script.onload = () => resolve()
      document.body.appendChild(script);
    });
  }

  return (
    <IonApp> {ready ?
      <IonReactRouter>
        <IonRouterOutlet>
          <Route exact path="/home">
            <Home />
          </Route>
          <Route exact path="/hello-world">
            <HelloWorld />
          </Route>
          <Route exact path="/advanced">
            <AdvancedApp />
          </Route>
          <Route exact path="/">
            <Redirect to="/home" />
          </Route>
        </IonRouterOutlet>
      </IonReactRouter>
    : <div />}
    </IonApp>
  );
};

export default App;
