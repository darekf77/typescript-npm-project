// angular
import { RouterModule, Route, PreloadAllModules } from "@angular/router";
import { HttpModule } from '@angular/http';
import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
// thrid part
import * as _ from 'lodash';
import { init, replay, AngularProviders } from 'morphi/browser';
// my modules

// local
import { AuthController } from 'ss-common-logic/browser/controllers/core/AuthController';
import { AppComponent } from './app.component';
import { LoginComponent } from './login/login.component';
import { routes } from "./app.routes";
import { LoginModule } from './login/login.module';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    LoginModule,
    BrowserAnimationsModule,
    BrowserModule,
    FormsModule,
    HttpModule,
    // MyLibModule.forRoot(),
    RouterModule.forRoot(routes, { useHash: false, preloadingStrategy: PreloadAllModules })
  ],
  providers: [
    AngularProviders,
    AuthController
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
