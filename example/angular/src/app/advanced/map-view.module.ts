import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

import {MapView} from "./map-view.component";

@NgModule({
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  exports: [MapView],
  imports: [CommonModule, FormsModule, IonicModule.forRoot()],
  declarations: [MapView]
})

export class MapViewModule {}

