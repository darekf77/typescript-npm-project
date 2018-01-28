// angular
import { RouterModule, Route, PreloadAllModules } from "@angular/router";
import { HttpModule } from '@angular/http';
import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
// thrid part
import * as _ from 'lodash';
import { init, replay } from 'isomorphic-rest';
// my modules
import { MyLibModule } from 'angular-lib';
import { Controllers, Entities } from 'isomorphic-lib';
// local
import { AppComponent } from './app.component';
import { LoginComponent } from './login/login.component';
import { routes } from "./app.routes";

@NgModule({
  declarations: [
    AppComponent,
    LoginComponent
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
