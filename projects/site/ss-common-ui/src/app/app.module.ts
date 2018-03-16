// angular
import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpModule } from '@angular/http';
import { RouterModule, PreloadAllModules } from '@angular/router';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
// third part
import { MyLibModule } from 'components';
// local
import { AppComponent } from './app.component';
import { PopupComponent } from './popup/popup.component';
import { PopupDemo } from "app/list/popup-list.component";


@NgModule({
  entryComponents: [PopupComponent, PopupDemo],
  declarations: [
    AppComponent,
    PopupComponent,
    PopupDemo
  ],
  imports: [
    NoopAnimationsModule,
    BrowserModule,
    FormsModule,
    HttpModule,
    MyLibModule.forRoot(),
    RouterModule.forRoot([
      { path: '', redirectTo: 'layout-slider-vertical', pathMatch: 'full' },
      {
        path: 'layout-slider-vertical',
        loadChildren: './list/layouts/slider-vertical/slider-vertical.module#SliderVerticalModulePreview'
      }
    ], { useHash: true, preloadingStrategy: PreloadAllModules })
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
