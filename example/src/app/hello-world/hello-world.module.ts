import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { HelloWorldPageRoutingModule } from './hello-world-routing.module';

import { HelloWorldPage } from './hello-world.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    HelloWorldPageRoutingModule
  ],
  declarations: [HelloWorldPage]
})
export class HelloWorldPageModule {}
