// angular
import { RouterModule, Route, PreloadAllModules } from "@angular/router";
import { HttpModule } from '@angular/http';
import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
// thrid part
import * as _ from 'lodash';
import { init, AngularProviders } from 'morphi/browser';
// my modules
// import { MyLibModule } from 'angular-lib';
import { AuthController } from 'ss-common-logic/browser/controllers/core/AuthController';
import { CategoryController } from 'ss-common-logic/browser/controllers/CategoryController';
import { DialogsController } from 'ss-common-logic/browser/controllers/DialogsController';
import { ConfigController } from 'ss-common-logic/browser/controllers/ConfigController';
import { GroupsController } from 'ss-common-logic/browser/controllers/GroupsController';
import { USER } from 'ss-common-logic/browser/entities/core/USER';
import { EMAIL } from 'ss-common-logic/browser/entities/core/EMAIL';
import { EMAIL_TYPE } from 'ss-common-logic/browser/entities/core/EMAIL_TYPE';
import { SESSION } from 'ss-common-logic/browser/entities/core/SESSION';
import { CATEGORY } from 'ss-common-logic/browser/entities/CATEGORY';
import { DIALOG } from 'ss-common-logic/browser/entities/DIALOG';
import { GROUP } from 'ss-common-logic/browser/entities/GROUP';
import { CONFIG } from 'ss-common-logic/browser/entities/CONFIG';
// local
import { AppComponent } from './app.component';
import { LoginComponent } from './login/login.component';
import { routes } from "./app.routes";


init({
  host: ENV.workspace.projects.find(({ name }) => name === 'ss-common-logic').host,
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
  .angularProviders()

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
    AngularProviders
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
