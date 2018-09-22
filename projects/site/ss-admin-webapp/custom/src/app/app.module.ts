// angular
import { RouterModule, Route, PreloadAllModules } from "@angular/router";
import { HttpModule } from '@angular/http';
import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
// thrid part
import * as _ from 'lodash';
import { init, AngularProviders } from 'morphi/browser';
import { LoadingBarHttpModule } from '@ngx-loading-bar/http';
import { LoadingBarRouterModule } from '@ngx-loading-bar/router';
import { LoadingBarModule } from '@ngx-loading-bar/core';

const loadingBar = [
  LoadingBarHttpModule,
  LoadingBarRouterModule,
  LoadingBarModule
]

// my modules
// import { MyLibModule } from 'angular-lib';
import { AuthController } from 'ss-common-logic/browser/controllers/core/AuthController';
import { CategoryController } from 'ss-common-logic/browser/controllers/CategoryController';
import { ExamplesController } from 'ss-common-logic/browser/controllers/ExamplesController';
import { GroupsController } from 'ss-common-logic/browser/controllers/GroupsController';
import { DialogsController } from 'ss-common-logic/browser/controllers/DialogsController';
import { ConfigController } from 'ss-common-logic/browser/controllers/ConfigController';
import { MultimediaController } from 'ss-common-logic/browser/controllers/core/MultimediaController';
import { BuildController } from 'ss-common-logic/browser/controllers/BuildController';
import { DomainsController } from 'ss-common-logic/browser/controllers/DomainsController';


// entities
import { USER } from 'ss-common-logic/browser/entities/core/USER';
import { EMAIL } from 'ss-common-logic/browser/entities/core/EMAIL';
import { EMAIL_TYPE } from 'ss-common-logic/browser/entities/core/EMAIL_TYPE';
import { SESSION } from 'ss-common-logic/browser/entities/core/SESSION';
import { CATEGORY } from 'ss-common-logic/browser/entities/CATEGORY';
import { DIALOG } from 'ss-common-logic/browser/entities/DIALOG';
import { GROUP } from 'ss-common-logic/browser/entities/GROUP';
import { EXAMPLE } from 'ss-common-logic/browser/entities/EXAMPLE';
import { CONFIG } from 'ss-common-logic/browser/entities/CONFIG';
import { BUILD } from 'ss-common-logic/browser/entities/BUILD';
import { DOMAIN } from 'ss-common-logic/browser/entities/DOMAIN';
import { TNP_PROJECT } from 'ss-common-logic/browser/entities/TNP_PROJECT';

// local
import { AppComponent } from './app.component';
import { LoginComponent } from './login/login.component';
import { routes } from "./app.routes";

import { LoginModule } from './login/login.module';



const host = ENV.workspace.projects.find(({ name }) => name === 'ss-common-logic').host;
init({
  host,
  hostSocket: ENV.workspace.projects.find(({ name }) => name === 'ss-common-logic').hostSocket,
  controllers: [
    AuthController,
    GroupsController,
    CategoryController,
    ExamplesController,
    DialogsController,
    ConfigController,
    MultimediaController,
    BuildController,
    DomainsController
  ],
  entities: [
    USER, EMAIL, EMAIL_TYPE, SESSION, CATEGORY,
    DIALOG, GROUP, EXAMPLE, CONFIG, BUILD, DOMAIN, TNP_PROJECT
  ]
})
  .angularProviders()

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
    RouterModule.forRoot(routes, {
      useHash: true,
      preloadingStrategy: PreloadAllModules,
      enableTracing: false
    }),
    ...loadingBar
  ],
  providers: [
    AngularProviders,
    AuthController
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
