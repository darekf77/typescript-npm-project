import { NgModule } from '@angular/core';
import { init, AngularProviders } from 'morphi/browser';
import { AppComponent } from './app.component';

import { moprhi, modules } from './app.imports';
import { AuthController } from 'ss-common-logic/browser/controllers/core/AuthController';


const host = ENV.workspace.projects.find(({ name }) => name === 'ss-common-logic').host;
init({
  host,
  hostSocket: ENV.workspace.projects.find(({ name }) => name === 'ss-common-logic').hostSocket,
  controllers: moprhi.controllers,
  entities: moprhi.entities
})
  .angularProviders()

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: modules.import.angular,
  providers: [
    AngularProviders,
    AuthController
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
