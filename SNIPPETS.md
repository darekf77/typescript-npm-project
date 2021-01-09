# git - remove submodule without deleting it
```
git rm --cached path_to_submodule (no trailing slash).
```



# dynamic getter 
```ts
if (isUndefined(Object.getOwnPropertyDescriptor(model, 'locationOidView'))) {
  Object.defineProperty(model, 'locationOidView', {
    get() {
      return location.retailerId;
    }
  });
}

```

# display json
```ts
jsonstring = JSON.stringify(o, null, 2)
html = `<h6  style=" white-space: pre;"  ng-bind-html="jsonstring'> </h6>`
```

# make sure view value is positive integer
```ts
// make sure $viewValue is positive interger
const parsed = parseInt($viewValue);
if (isNaN(parsed)) {
  if (isString($viewValue)) {
    model.noOfTellersToCreate = $viewValue.replace(/\D+/g, '');
  }
} else {
  if (parsed === 0) {
    model.noOfTellersToCreate = void 0;
    $viewValue = void 0;
  }
  if (parsed < 0) {
    model.noOfTellersToCreate = Math.abs(parsed);
    $viewValue == Math.abs(parsed);
  }
  if (parsed > MAX_CLERKS_TO_ADD) {
    model.noOfTellersToCreate = MAX_CLERKS_TO_ADD;
  }
}
```


# simplest angular app.ts

```ts

//#region @notForNpm
import { Morphi } from 'morphi';
// import 'core-js/client/shim';
// import 'reflect-metadata';
require('zone.js/dist/zone');
import { Component, NgModule, ApplicationRef } from '@angular/core';
import { enableProdMode } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpModule } from '@angular/http';
import { FormsModule } from '@angular/forms';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import '@angular/material/prebuilt-themes/indigo-pink.cs'

@Component({
  selector: 'my-app', // <my-app></my-app>
  template: `
  <h1> Hello from component! </h1>
  `,
})
export class AppComponent { }

@NgModule({
  imports: [
    BrowserModule,
    HttpModule,
    FormsModule,
  ],
  declarations: [
    AppComponent,
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

  const body: HTMLElement = document.getElementsByTagName('body')[0];
  body.innerHTML = `<my-app>Loading...</my-app>`;

  if (Morphi.isBrowser) {
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


//#endregion


```



# backend and angular material

```ts
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



@Morphi.Entity({ className: 'Book' })
class Book extends Morphi.Base.Entity<any> {
  static from(name: string) {
    const b = new Book();
    b.name = name;
    return b;
  }

  //#region @backend
  @Morphi.Orm.Column.Custom('varchar')
  //#endregion
  public name: string

  //#region @backend
  @Morphi.Orm.Column.Generated()
  //#endregion
  public id: number

}



@Morphi.Controller({ className: 'BookCtrl', entity: Book })
class BookCtrl extends Morphi.Base.Controller<any> {
  //#region @backend
  async initExampleDbData() {
    const db = await this.connection.getRepository(Book);
    await db.save(Book.from('alice in wonderland'));
    await db.save(Book.from('cryptography'));
  }
  //#endregion
}

@Component({
  selector: 'my-app', // <my-app></my-app>
  template: `
  <h1> Hello from component! </h1>
  <mat-card>Simple card</mat-card>
  `,
})
export class AppComponent {
  constructor(
    public ctrl: BookCtrl
  ) {

  }
  async ngOnInit() {
    const data = (await this.ctrl.getAll().received).body.json as Book[];
    console.log(data);
  }
}

@NgModule({
  imports: [
    BrowserModule,
    HttpModule,
    FormsModule,
    ...[
      MatCardModule,
    ]
  ],
  declarations: [
    AppComponent,
  ],
  providers: [
    BookCtrl
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
    controllers: [BookCtrl],
    entities: [Book],
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

```
