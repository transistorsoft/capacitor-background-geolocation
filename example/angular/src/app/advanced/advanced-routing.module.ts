import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { AdvancedPage } from './advanced.page';

const routes: Routes = [
  {
    path: '',
    component: AdvancedPage
  },
  {
    path: 'settings',
    loadChildren: () => import('./modals/settings/settings.module').then( m => m.SettingsPageModule)
  },
  {
    path: 'geofence',
    loadChildren: () => import('./modals/geofence/geofence.module').then( m => m.GeofencePageModule)
  },
  {
    path: 'about',
    loadChildren: () => import('./modals/about/about.module').then( m => m.AboutPageModule)
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AdvancedPageRoutingModule {}
