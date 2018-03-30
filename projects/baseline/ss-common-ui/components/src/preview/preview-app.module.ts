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
import { AppComponent } from './preview-app.component';
import { StandalonePopupModule } from '../ui-elements/standalone-popup';
import { previewRoutes } from './preview-app.routes';
import { SliderVerticalComponent } from './preview-slider-vertical/preview-slider-vertical.component';
import { SliderVerticalModule } from '../layouts';

const modules = [
  MatTabsModule,
  MatSidenavModule,
  SliderVerticalModule
];


@NgModule({
  declarations: [
    AppComponent,
    SliderVerticalComponent
  ],
  imports: [
    NoopAnimationsModule,
    BrowserModule,
    FormsModule,
    HttpModule,
    RouterModule.forRoot(previewRoutes, { useHash: true, preloadingStrategy: PreloadAllModules }),
    StandalonePopupModule,
    ...modules
  ],
  exports: [
    ...modules
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
