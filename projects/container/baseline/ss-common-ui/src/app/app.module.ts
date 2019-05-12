// angular
import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpModule } from '@angular/http';
import { RouterModule, PreloadAllModules } from '@angular/router';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatTabsModule } from '@angular/material/tabs';
import { MatSidenavModule } from '@angular/material/sidenav';
// local
import { AppComponent } from './app.component';
import { routes } from './app.routes';
import { AppPreviewPopupContentService } from './app-popup-content.service';
// third part
import { StaticColumnsModule } from 'static-columns';
import {
  StandalonePopupModule
} from 'ss-common-ui/module/ui-elements/standalone-popup';


const angularModules = [
  NoopAnimationsModule,
  BrowserModule,
  FormsModule,
  HttpModule,
  RouterModule.forRoot(routes, {
    useHash: true,
    preloadingStrategy: PreloadAllModules,
    enableTracing: false
  }),
];

const modulesMaterial = [
  MatTabsModule,
  MatSidenavModule
];

const otherModules = [
  StaticColumnsModule,
  StandalonePopupModule
];

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    ...angularModules,
    ...modulesMaterial,
    ...otherModules
  ],
  exports: [
    ...otherModules,
    ...modulesMaterial,

  ],
  providers: [
    AppPreviewPopupContentService
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
