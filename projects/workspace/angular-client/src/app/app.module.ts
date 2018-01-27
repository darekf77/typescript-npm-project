import * as _ from 'lodash';
import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MyLibModule } from 'angular-lib';
import { init, replay } from 'isomorphic-rest';
import { Controllers, Entities, HelloController } from 'isomorphic-lib';

import { RouterModule, Route, PreloadAllModules } from "@angular/router";

import { HttpModule } from '@angular/http';
import { AppComponent } from './app.component';

const routes: Route[] = [
  {
    path: '',
    loadChildren: './main-page/main-page.module#AppMainPageModule',
    pathMatch: 'prefix',
  },
  {
    path: 'test',
    loadChildren: './app-test/app-test.module#AppTestModule',
    pathMatch: 'prefix',
  },
  // {
  //   path: '',
  //   pathMatch: 'full' ,
  //   redirectTo: 'test'
  // }
];

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    HttpModule,
    MyLibModule.forRoot(),
    RouterModule.forRoot(routes, { useHash: false, preloadingStrategy: PreloadAllModules })
  ],
  providers: [
    init('http://localhost:4000')
      .angularProviders({
        controllers: _.values(Controllers),
        entities: _.values(Entities)
      }) as any
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
