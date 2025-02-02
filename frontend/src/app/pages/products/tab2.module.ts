import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';

import { ComponentsModule } from '../../core/components/components.module';
import { DetailComponent } from '../dashboard/detail/detail.component';
import { Tab2PageRoutingModule } from './tab2-routing.module';
import { Tab2Page } from './tab2.page';

@NgModule({
  imports: [IonicModule, CommonModule, FormsModule, Tab2PageRoutingModule, ComponentsModule],
  declarations: [Tab2Page],
  exports: [Tab2Page],
})
export class Tab2PageModule {}
