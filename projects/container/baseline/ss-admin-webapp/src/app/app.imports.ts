// angular
import { RouterModule, Route, PreloadAllModules } from '@angular/router';
import { HttpModule } from '@angular/http';
import { BrowserModule } from '@angular/platform-browser';

import { FormsModule } from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
// thrid part
import * as _ from 'lodash';
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
import { AuthController } from 'ss-common-logic/src/apps/auth/AuthController';
import { CategoryController } from 'ss-common-logic/src/apps/category/CategoryController';
import { ExamplesController } from 'ss-common-logic/src/apps/example/ExamplesController';
import { GroupsController } from 'ss-common-logic/src/apps/group/GroupsController';
import { DialogsController } from 'ss-common-logic/src/apps/dialog/DialogsController';
import { ConfigController } from 'ss-common-logic/src/apps/config/ConfigController';
import { MultimediaController } from 'ss-common-logic/src/apps/multimedia/MultimediaController';

// entities
import { USER } from 'ss-common-logic/src/apps/user/USER';
import { EMAIL } from 'ss-common-logic/src/apps/email/EMAIL';
import { EMAIL_TYPE } from 'ss-common-logic/src/apps/email/EMAIL_TYPE';
import { SESSION } from 'ss-common-logic/src/apps/auth/SESSION';
import { CATEGORY } from 'ss-common-logic/src/apps/category/CATEGORY';
import { DIALOG } from 'ss-common-logic/src/apps/dialog/DIALOG';
import { GROUP } from 'ss-common-logic/src/apps/group/GROUP';
import { EXAMPLE } from 'ss-common-logic/src/apps/example/EXAMPLE';
import { CONFIG } from 'ss-common-logic/src/apps/config/CONFIG';
// local

import { routes } from './app.routes';

import { LoginModule } from './login/login.module';

export const moprhi = {
  controllers: [
    AuthController,
    GroupsController,
    CategoryController,
    ExamplesController,
    DialogsController,
    ConfigController,
    MultimediaController
  ],
  entities: [
    USER,
    EMAIL,
    EMAIL_TYPE,
    SESSION,
    CATEGORY,
    DIALOG,
    GROUP,
    EXAMPLE,
    CONFIG
  ]
}

export const modules = {
  import: {
    angular: [
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
    ]
  }
}
