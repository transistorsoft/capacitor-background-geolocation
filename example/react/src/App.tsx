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

  /// SettingsService is just a handy helper class in support of the demo app.
  /// It has nothing to do with BackgroundGeolocation.
  SettingsService.getInstance().configure({
    alert: alert,
    toast: toast
  });

  return (
    <IonApp>
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
    </IonApp>
  );
};

export default App;
