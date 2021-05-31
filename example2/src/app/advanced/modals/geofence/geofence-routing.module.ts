import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { GeofencePage } from './geofence.page';

const routes: Routes = [
  {
    path: '',
    component: GeofencePage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class GeofencePageRoutingModule {}
