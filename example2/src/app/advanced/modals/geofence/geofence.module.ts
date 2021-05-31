import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { GeofencePageRoutingModule } from './geofence-routing.module';

import { GeofencePage } from './geofence.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    GeofencePageRoutingModule
  ],
  declarations: [GeofencePage]
})
export class GeofencePageModule {}
