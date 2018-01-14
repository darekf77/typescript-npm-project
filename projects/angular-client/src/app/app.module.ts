import * as _ from 'lodash';
import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { init, replay } from 'isomorphic-rest';
import { Controllers, Entities, HelloController } from 'isomorphic-lib';
import { MyLibModule } from 'angular-lib';

import { AppComponent } from './app.component';


@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    MyLibModule
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
