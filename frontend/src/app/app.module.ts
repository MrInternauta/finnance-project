import { en_US, NZ_I18N } from 'ng-zorro-antd/i18n';

import { LocationStrategy, PathLocationStrategy, registerLocaleData } from '@angular/common';
import en from '@angular/common/locales/en';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouteReuseStrategy } from '@angular/router';
import { AuthModule } from '@gymTrack/auth';
import { CoreModule } from '@gymTrack/core';
import { IonicModule, IonicRouteStrategy } from '@ionic/angular';
import { EffectsModule } from '@ngrx/effects';

import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { Network } from '@awesome-cordova-plugins/network/ngx';
import { AngularSvgIconModule } from 'angular-svg-icon';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { PermissionsEffects } from './auth/state/permissions.effects';
import { ExercisesEffects } from './pages/dashboard/state/workout.effects';

registerLocaleData(en);

@NgModule({
  declarations: [
    AppComponent,
    // CommonLayoutComponent
  ],
  bootstrap: [AppComponent],
  imports: [
    BrowserModule,
    IonicModule.forRoot(),
    AppRoutingModule,
    CoreModule,
    AuthModule,
    EffectsModule.forRoot([ExercisesEffects, PermissionsEffects]),
    FormsModule,
    AngularSvgIconModule.forRoot(),
  ],
  providers: [
    Network,
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    { provide: NZ_I18N, useValue: en_US },
    {
      provide: LocationStrategy,
      useClass: PathLocationStrategy,
    },
    provideHttpClient(withInterceptorsFromDi()),
  ],
})
export class AppModule {}
