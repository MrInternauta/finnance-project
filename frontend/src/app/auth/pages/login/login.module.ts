import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';

import { ComponentsModule } from '../../../core/components/components.module';
import { LoginPageRoutingModule } from './login-routing.module';
import { LoginPage } from './login.page';

const antdModule = [
  // NzFormModule,
  // NzInputModule,
  // NzButtonModule,
  // NzCardModule,
  // NzIconModule,
  // NzCheckboxModule,
  // AngularSvgIconModule.forRoot(),
];

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    ReactiveFormsModule,
    LoginPageRoutingModule,
    ComponentsModule,
    // ...antdModule,
  ],
  declarations: [LoginPage],
  providers: [
    // ModalInfoService
  ],
})
export class LoginPageModule {}
