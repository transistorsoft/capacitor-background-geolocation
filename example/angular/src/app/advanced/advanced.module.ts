import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { AdvancedPageRoutingModule } from './advanced-routing.module';

import { AdvancedPage } from './advanced.page';

import {BGService} from './lib/BGService';
import {SettingsService} from './lib/SettingsService';
import {TestService} from './lib/TestService';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    AdvancedPageRoutingModule
  ],
  declarations: [AdvancedPage],
  providers: [
  	BGService, SettingsService, TestService
  ]
})
export class AdvancedPageModule {}
