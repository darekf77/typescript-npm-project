// angular
import { RouterModule, Route, PreloadAllModules } from "@angular/router";
import { HttpModule } from '@angular/http';
import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
// thrid part
import * as _ from 'lodash';
import { Morphi } from 'morphi/browser';
// my modules
// import { MyLibModule } from 'angular-lib';
import { AuthController } from 'ss-common-logic/browser-for-ss-webapp/controllers/core/AuthController';
import { CategoryController } from 'ss-common-logic/browser-for-ss-webapp/controllers/CategoryController';
import { DialogsController } from 'ss-common-logic/browser-for-ss-webapp/controllers/DialogsController';
import { ConfigController } from 'ss-common-logic/browser-for-ss-webapp/controllers/ConfigController';
import { GroupsController } from 'ss-common-logic/browser-for-ss-webapp/controllers/GroupsController';
import { USER } from 'ss-common-logic/browser-for-ss-webapp/entities/core/USER';
import { EMAIL } from 'ss-common-logic/browser-for-ss-webapp/entities/core/EMAIL';
import { EMAIL_TYPE } from 'ss-common-logic/browser-for-ss-webapp/entities/core/EMAIL_TYPE';
import { SESSION } from 'ss-common-logic/browser-for-ss-webapp/entities/core/SESSION';
import { CATEGORY } from 'ss-common-logic/browser-for-ss-webapp/entities/CATEGORY';
import { DIALOG } from 'ss-common-logic/browser-for-ss-webapp/entities/DIALOG';
import { GROUP } from 'ss-common-logic/browser-for-ss-webapp/entities/GROUP';
import { CONFIG } from 'ss-common-logic/browser-for-ss-webapp/entities/CONFIG';
// local
import { AppComponent } from './app.component';
import { LoginComponent } from './login/login.component';
import { routes } from "./app.routes";


Morphi.init({
  host: ENV.workspace.projects.find(({ name }) => name === 'ss-common-logic').host,
  hostSocket: ENV.workspace.projects.find(({ name }) => name === 'ss-common-logic').hostSocket,
  controllers: [
    AuthController,
    CategoryController,
    DialogsController,
    ConfigController,
    GroupsController
  ],
  entities: [
    USER, EMAIL, EMAIL_TYPE, SESSION, CATEGORY, DIALOG, GROUP, CONFIG]
})

@NgModule({
  declarations: [
    AppComponent,

  ],
  imports: [
    BrowserModule,
    FormsModule,
    HttpModule,
    // MyLibModule.forRoot(),
    RouterModule.forRoot(routes, { useHash: true, preloadingStrategy: PreloadAllModules })
  ],
  providers: [
    Morphi.Providers
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
