import { Morphi } from 'morphi';
// import 'core-js/client/shim';
// import 'reflect-metadata';
if (Morphi.isBrowser) {
  require('zone.js/dist/zone');
}

import { Component, NgModule, ApplicationRef } from '@angular/core';
import { enableProdMode } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpModule } from '@angular/http';
import { FormsModule } from '@angular/forms';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { MatCardModule } from '@angular/material/card';

const host = 'http://localhost:3333';
import { PROCESS, ProcessModule } from './apps/process';
import { PROJECT, ProjectModule } from './apps/project';


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
  }
}

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
    controllers: [
      ...Morphi.Providers
    ],
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
