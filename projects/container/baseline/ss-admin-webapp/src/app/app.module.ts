import { NgModule } from '@angular/core';
import { Morphi } from 'morphi/browser';
import { AppComponent } from './app.component';

import { moprhi, modules } from './app.imports';
import { AuthController } from 'ss-common-logic/browser-for-ss-admin-webapp/apps/auth/AuthController';
import { MultimediaController } from 'ss-common-logic/browser-for-ss-admin-webapp/apps/multimedia/MultimediaController';


const host = ENV.workspace.projects.find(({ name }) => name === 'ss-common-logic').host;
Morphi.init({
  host,
  controllers: moprhi.controllers,
  entities: moprhi.entities
})

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: modules.import.angular,
  providers: [
    Morphi.Providers,
    AuthController,
    MultimediaController
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
