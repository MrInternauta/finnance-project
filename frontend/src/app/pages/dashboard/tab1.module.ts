import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { NgChartsModule } from 'ng2-charts';

import { ComponentsModule } from '../../core/components/components.module';
import { Tab1PageRoutingModule } from './tab1-routing.module';
import { Tab1Page } from './tab1.page';
import { DetailComponent } from './detail/detail.component';

@NgModule({
  imports: [IonicModule, CommonModule, FormsModule, Tab1PageRoutingModule, NgChartsModule, ComponentsModule],
  declarations: [Tab1Page, DetailComponent,]

})
export class Tab1PageModule {}
