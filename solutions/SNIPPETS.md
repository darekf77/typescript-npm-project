# git - remove submodule without deleting it
```
git rm --cached path_to_submodule (no trailing slash).
```

# ip of interface from cmd linke
```
 ipconfig getifaddr en0
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
import { Firedev } from 'firedev';
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

  if (Firedev.isBrowser) {
    if (document.readyState === 'complete') {
      main();
    } else {
      document.addEventListener('DOMContentLoaded', main);
    }
  }
}

if (Firedev.isBrowser) {
  start();
}

export default start;


//#endregion


```



# backend and angular material

```ts
import { Firedev } from 'firedev';
// import 'core-js/client/shim';
// import 'reflect-metadata';
if (Firedev.isBrowser) {
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



@Firedev.Entity({ className: 'Book' })
class Book extends Firedev.Base.Entity<any> {
  static from(name: string) {
    const b = new Book();
    b.name = name;
    return b;
  }

  //#region @backend
  @Firedev.Orm.Column.Custom('varchar')
  //#endregion
  public name: string

  //#region @backend
  @Firedev.Orm.Column.Generated()
  //#endregion
  public id: number

}



@Firedev.Controller({ className: 'BookCtrl', entity: Book })
class BookCtrl extends Firedev.Base.Controller<any> {
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

  const context = await Firedev.init({
    host,
    controllers: [BookCtrl],
    entities: [Book],
    //#region @backend
    config: config as any
    //#endregion
  });
  console.log(context);

  if (Firedev.isBrowser) {
    const body: HTMLElement = document.getElementsByTagName('body')[0];
    body.innerHTML = `<my-app>Loading...</my-app>`;
    if (document.readyState === 'complete') {
      main();
    } else {
      document.addEventListener('DOMContentLoaded', main);
    }
  }
}

if (Firedev.isBrowser) {
  start();
}

export default start;

```


# canvasd drawing

```ts
$(document).ready(function() {
  var flag, dot_flag = false,
	prevX, prevY, currX, currY = 0,
	color = 'black', thickness = 2;
  var $canvas = $('#canvas');
  var ctx = $canvas[0].getContext('2d');

  $canvas.on('mousemove mousedown mouseup mouseout', function(e) {
    prevX = currX;
    prevY = currY;
    currX = e.clientX - $canvas.offset().left;
    currY = e.clientY - $canvas.offset().top;
    if (e.type == 'mousedown') {
      flag = true;
    }
    if (e.type == 'mouseup' || e.type == 'mouseout') {
      flag = false;
    }
    if (e.type == 'mousemove') {
      if (flag) {
        ctx.beginPath();
        ctx.moveTo(prevX, prevY);
        ctx.lineTo(currX, currY);
        ctx.strokeStyle = color;
        ctx.lineWidth = thickness;
        ctx.stroke();
        ctx.closePath();
      }
    }
  });

  $('.canvas-clear').on('click', function(e) {
    c_width = $canvas.width();
    c_height = $canvas.height();
    ctx.clearRect(0, 0, c_width, c_height);
    $('#canvasimg').hide();
  });
});
```

```html
<html>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/jquery/3.3.0/jquery.min.js"></script>
  <body>
    <canvas id="canvas" width="400" height="400" style="position:absolute;top:10%;left:10%;border:2px solid;"></canvas>
    <input type="button" value="Clear" class="canvas-clear" />
  </body>
</html>
```


```
"preinstall": " chalk red bold ERROR: && echo Use: && chalk red bold \"firedev install\" && echo instead && chalk gray bold \"npm install\" && exit 1",
"preinstall": "echo \"ERROR:  Use \"firedev install\" instead \"npm install\" \" && exit 1",
```
