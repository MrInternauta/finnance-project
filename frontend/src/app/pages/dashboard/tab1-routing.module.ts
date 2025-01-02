import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { Tab1Page } from './tab1.page';
import { DetailComponent } from './detail/detail.component';

const routes: Routes = [
  {
    path: '',
    component: Tab1Page,
  },
  {
    path: 'detail',
    component: DetailComponent
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class Tab1PageRoutingModule {}
