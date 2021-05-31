import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes, Router, NavigationEnd } from '@angular/router';

const localStorage = (<any>window).localStorage;
let orgname = localStorage.getItem('orgname');
let username = localStorage.getItem('username');
let isRegistered = (orgname && username);
let root = (isRegistered) ? localStorage.getItem('page') : 'home'

if (!root) { root = 'home'; }

const routes: Routes = [
  {
    path: 'home',
    loadChildren: () => import('./home/home.module').then( m => m.HomePageModule)
  },
  {
    path: '',
    redirectTo: root,
    pathMatch: 'full'
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
    // [Demo Hack]  Set the default route when navigation is detected.
    // Determines which app to render as the root page:
    // - Hello World
    // - Simple Map
    // - Advanced.
    router.events.subscribe((event) => {
      if (!(event instanceof NavigationEnd)) return;
      let root = event.url.substring(1, event.url.length);
      if (root.length > 0) {
        localStorage.setItem('page', root);
      }
    });
  }
}
