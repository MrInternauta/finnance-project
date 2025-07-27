import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';

import { AngularSvgIconModule } from 'angular-svg-icon';
import { TabsPageRoutingModule } from './tabs-routing.module';

import { RouterModule } from '@angular/router';
import { ErrorPageComponent } from './error-page/error-page.component';
import { TabsPage } from './tabs.page';

@NgModule({
  imports: [
    RouterModule,
    IonicModule,
    CommonModule,
    FormsModule,
    TabsPageRoutingModule,
    AngularSvgIconModule.forRoot(),
  ],
  declarations: [TabsPage, ErrorPageComponent],
})
export class TabsPageModule {}
