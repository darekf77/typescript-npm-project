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

import {
  StandalonePopupModule
} from 'components';

const modules = [
  MatTabsModule,
  MatSidenavModule
];



@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    NoopAnimationsModule,
    BrowserModule,
    FormsModule,
    HttpModule,
    RouterModule.forRoot(routes, {
      useHash: true,
      preloadingStrategy: PreloadAllModules,
      enableTracing: false
    }),
    StandalonePopupModule,
    ...modules
  ],
  exports: [
    ...modules,

  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
