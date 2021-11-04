import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes, Router, NavigationEnd } from '@angular/router';
import { Storage } from '@capacitor/storage';

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
  constructor(router:Router) {
    this.init(router);

    router.events.subscribe(async (event) => {
      if (!(event instanceof NavigationEnd)) return;
      const root = event.url.substring(1, event.url.length);
      if (root.length > 0) {
        await Storage.set({key: 'page', value: root});
      }
    });
  }

  async init(router:Router) {
    // Navigate to current App (or /home).
    const page = (await Storage.get({key: 'page'})).value;
    const orgname = (await Storage.get({key: 'orgname'})).value;
    const username = (await Storage.get({key: 'username'})).value;
    const isRegistered = ((orgname !== null) && (username !== null));

    if (page && isRegistered) {
      router.navigate(['/' + page]);
    } else {
      router.navigate(['/home']);
    }
  }
}
