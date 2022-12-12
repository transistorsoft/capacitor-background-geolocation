import { NgModule } from '@angular/core';
import { LoadingController } from '@ionic/angular';
import { PreloadAllModules, RouterModule, Routes, Router, NavigationEnd } from '@angular/router';
import { Preferences } from '@capacitor/preferences';

import {environment} from "../environments/environment";

/// Ugly old Google Javascript Maps SDK ref.
declare var google:any;

const routes: Routes = [
  {
    path: 'home',
    loadChildren: () => import('./home/home.module').then( m => m.HomePageModule)
  },
  {
    path: 'hello-world',
    loadChildren: () => import('./hello-world/hello-world.module').then( m => m.HelloWorldPageModule)
  },
  {
    path: 'advanced',
    loadChildren: () => import('./advanced/advanced.module').then( m => m.AdvancedPageModule)
  },
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule {
  constructor(router:Router, loadingCtrl: LoadingController) {
    this.init(router, loadingCtrl);

    router.events.subscribe(async (event) => {
      if (!(event instanceof NavigationEnd)) return;
      const root = event.url.substring(1, event.url.length);
      if (root.length > 0) {
        await Preferences.set({key: 'page', value: root});
      }
    });
  }

  async init(router:Router, loadingCtrl:LoadingController) {
    await this.loadGoogleMaps(loadingCtrl);
    // Navigate to current App (or /home).
    const page = (await Preferences.get({key: 'page'})).value;
    const orgname = (await Preferences.get({key: 'orgname'})).value;
    const username = (await Preferences.get({key: 'username'})).value;
    const isRegistered = ((orgname !== null) && (username !== null));
    if (page && isRegistered) {
      router.navigate(['/' + page]);
    } else {
      router.navigate(['/home']);
    }
  }

  /// Before rendering the App, first load the Google Maps Javascript SDK
  /// This is a bit of a hack using the old Javascript Maps SDK.  Would be much better
  /// to use a native Maps implementation.
  async loadGoogleMaps(loadingCtrl:LoadingController):Promise<void> {
    return new Promise(async (resolve, reject) => {
      if (typeof(google) === 'object') {
        // Already loaded?  Good to go!
        return resolve();
      }
      const loading = await loadingCtrl.create({
        cssClass: 'my-custom-class',
        message: 'Loading...',
        duration: 10000
      });
      await loading.present();

      // Allow up to 10s to load Google Maps Javascript SDK before bailing out and letting
      // the react app render itself.
      const timeout = setTimeout(() => {
        console.warn('Failed to load Google Maps Javascript SDK within 10s');
        loading.dismiss();
        resolve();
      }, 10000);

      // Append Google Maps <script> tag directly to the dom and wait for the onload signal
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?libraries=geometry&key=${environment.GOOGLE_MAP_API_KEY}`;
      script.async = true;
      script.onload = () => {
        loading.dismiss();
        clearTimeout(timeout);
        console.log('Loaded Google Maps Javascript SDK');
        resolve();
      }
      document.body.appendChild(script);
    });
  }

}
