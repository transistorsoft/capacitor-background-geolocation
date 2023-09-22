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
    //await this.loadGoogleMaps(loadingCtrl);
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
}
