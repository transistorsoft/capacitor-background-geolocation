import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';

import { AdvancedPageRoutingModule } from './advanced-routing.module';

import { AdvancedPage } from './advanced.page';

import {BGService} from './lib/BGService';
import {SettingsService} from './lib/SettingsService';
import {TestService} from './lib/TestService';

import {MapViewModule} from './map-view.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    MapViewModule,
    AdvancedPageRoutingModule
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  declarations: [AdvancedPage],
  providers: [
  	BGService, SettingsService, TestService
  ]
})
export class AdvancedPageModule {}
