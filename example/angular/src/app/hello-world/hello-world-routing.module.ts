import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { HelloWorldPage } from './hello-world.page';

const routes: Routes = [
  {
    path: '',
    component: HelloWorldPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class HelloWorldPageRoutingModule {}
