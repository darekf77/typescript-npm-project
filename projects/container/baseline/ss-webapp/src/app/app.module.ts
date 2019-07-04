// angular
import { RouterModule, Route, PreloadAllModules } from '@angular/router';
import { HttpModule } from '@angular/http';
import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
// thrid part
import * as _ from 'lodash';
import { Morphi } from 'morphi';
// my modules
// import { MyLibModule } from 'angular-lib';
import { AuthController } from 'ss-common-logic/src/apps/auth/AuthController';
import { CategoryController } from 'ss-common-logic/src/apps/category/CategoryController';
import { DialogsController } from 'ss-common-logic/src/apps/dialog/DialogsController';
import { ConfigController } from 'ss-common-logic/src/apps/config/ConfigController';
import { GroupsController } from 'ss-common-logic/src/apps/group/GroupsController';
import { USER } from 'ss-common-logic/src/apps/user/USER';
import { EMAIL } from 'ss-common-logic/src/apps/email/EMAIL';
import { EMAIL_TYPE } from 'ss-common-logic/src/apps/email/EMAIL_TYPE';
import { SESSION } from 'ss-common-logic/src/apps/auth/SESSION';
import { CATEGORY } from 'ss-common-logic/src/apps/category/CATEGORY';
import { DIALOG } from 'ss-common-logic/src/apps/dialog/DIALOG';
import { GROUP } from 'ss-common-logic/src/apps/group/GROUP';
import { CONFIG } from 'ss-common-logic/src/apps/config/CONFIG';
import { ModalModule  } from 'ss-components/components';
// local
import { AppComponent } from './app.component';
import { LoginComponent } from './login/login.component';
import { routes } from './app.routes';


Morphi.init({
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

@NgModule({
  declarations: [
    AppComponent,

  ],
  imports: [
    ModalModule,
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
