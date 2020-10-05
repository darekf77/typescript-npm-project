//#region isomorphic imports
import { Morphi } from 'morphi';
import { Log, Logger } from 'ng2-logger';
const log = Log.create(`app`);
//#endregion

//#region browser imports
import 'core-js/client/shim';
import 'reflect-metadata';
if (Morphi.isBrowser) {
  require('zone.js/dist/zone');
}
//#endregion

//#region angular
import { Component, NgModule, ApplicationRef } from '@angular/core';
import { enableProdMode } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpModule } from '@angular/http';
import { FormsModule } from '@angular/forms';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { MatCardModule } from '@angular/material/card';
//#endregion

//#region local imports
import { PROCESS, ProcessModule, ProcessController } from './apps/process';
import { PROJECT, ProjectModule, ProjectController } from './apps/project';
//#endregion

const controllers = [
  ProjectController,
  ProcessController
];

const host = 'http://localhost:3333';

@Component({
  selector: 'my-app', // <my-app></my-app>
  template: `
  <h1> Hello from component! </h1>
  <mat-card>Simple card</mat-card>
  `,
})
export class AppComponent {

  async ngOnInit() {
    console.log('hell on init');
    const processes = await PROCESS.getAll();
    console.log(processes);
  }
}

//#region angular module
@NgModule({
  imports: [
    BrowserModule,
    HttpModule,
    FormsModule,
    ...[
      MatCardModule,
    ],
    ProjectModule,
    ProcessModule,
  ],
  declarations: [
    AppComponent,
  ],
  providers: [
    ...controllers
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }

// depending on the env mode, enable prod mode or add debugging modules
// if (ENV.isBUild === 'build') {
//   enableProdMode();
// }

export function main() {
  return platformBrowserDynamic().bootstrapModule(AppModule);
}

//#endregion


async function start() {
  console.log('hello')

  //#region @backend
  const config = {
    type: "sqlite",
    database: 'tmp-db.sqlite',
    synchronize: true,
    dropSchema: true,
    logging: false
  };
  //#endregion

  const context = await Morphi.init({
    host,
    controllers,
    entities: [
      PROJECT, PROCESS
    ],
    //#region @backend
    config: config as any
    //#endregion
  });
  console.log(context);

  if (Morphi.isBrowser) {
    const body: HTMLElement = document.getElementsByTagName('body')[0];
    body.innerHTML = `<my-app>Loading...</my-app>`;
    if (document.readyState === 'complete') {
      main();
    } else {
      document.addEventListener('DOMContentLoaded', main);
    }
  }
}

if (Morphi.isBrowser) {
  start();
}

export default start;
