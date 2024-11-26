# git - remove submodule without deleting it
```
git rm --cached path_to_submodule (no trailing slash).
```

# ip of interface from cmd linke
```
 ipconfig getifaddr en0
```

# trackable array
```ts
class TrackedArray<T> extends Array<T> {
    constructor(...args: any[]) {
        super(...args);

        // Create a Proxy for the instance
        return new Proxy(this, {
            get(target, prop) {
                // Intercept access to the 'push' method
                if (prop === 'push') {
                    return function (...args: any[]) {
                        console.log('Array push called with:', args);
                        debugger; // Add a debugger statement here for detailed inspection
                        return Array.prototype.push.apply(target, args);
                    };
                }

                // Default behavior for other properties
                return target[prop];
            }
        });
    }
}

function createTrackedArray<T>(existingArray: T[]): TrackedArray<T> {
    const trackedArray = new TrackedArray<T>();

    // Copy elements from the existing array to the tracked array
    trackedArray.push(...existingArray);

    return trackedArray;
}

const normalArray = [];
const trackableArr = createTrackedArray(normalArray)

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
import { Taon } from 'firedev';
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

  if (Taon.isBrowser) {
    if (document.readyState === 'complete') {
      main();
    } else {
      document.addEventListener('DOMContentLoaded', main);
    }
  }
}

if (Taon.isBrowser) {
  start();
}

export default start;


//#endregion


```



# backend and angular material

```ts
import { Taon } from 'firedev';
// import 'core-js/client/shim';
// import 'reflect-metadata';
if (Taon.isBrowser) {
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



@Taon.Entity({ className: 'Book' })
class Book extends Taon.Base.Entity<any> {
  static from(name: string) {
    const b = new Book();
    b.name = name;
    return b;
  }

  //#region @backend
  @Taon.Orm.Column.Custom('varchar')
  //#endregion
  public name: string

  //#region @backend
  @Taon.Orm.Column.Generated()
  //#endregion
  public id: number

}



@Taon.Controller({ className: 'BookCtrl', entity: Book })
class BookCtrl extends Taon.Base.Controller<any> {
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

  const context = await Taon.init({
    host,
    controllers: [BookCtrl],
    entities: [Book],
    //#region @backend
    config: config as any
    //#endregion
  });
  console.log(context);

  if (Taon.isBrowser) {
    const body: HTMLElement = document.getElementsByTagName('body')[0];
    body.innerHTML = `<my-app>Loading...</my-app>`;
    if (document.readyState === 'complete') {
      main();
    } else {
      document.addEventListener('DOMContentLoaded', main);
    }
  }
}

if (Taon.isBrowser) {
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

# decorator that is modyfying methods
```ts
import { ClassHelpers } from '../../helpers/class-helpers';
import { Symbols } from '../../symbols';
import { Models } from '../../models';
import { _ } from 'tnp-core/src';
import type { BaseSubscriberForEntity } from '../../base-classes/base-subscriber-for-entity';
import type { EndpointContext } from '../../endpoint-context';

export class TaonSubscriberOptions<
  T = any,
> extends Models.DecoratorAbstractOpt {
  allowedEvents?: (keyof T)[];
}

export function TaonSubscriber(options: TaonSubscriberOptions) {
  return function <T extends { new (...args: any[]): {} }>(constructor: T) {
    Reflect.defineMetadata(
      Symbols.metadata.options.repository,
      options,
      constructor,
    );
    Reflect.defineMetadata(
      Symbols.metadata.className,
      options?.className || constructor.name,
      constructor,
    );
    ClassHelpers.setName(constructor, options?.className);
    return class extends constructor {
      constructor(...args: any[]) {
        super(...args);

        //#region @websql
        // Get all method names of the class
        const methodNamesAll = ClassHelpers.getMethodsNames(
          constructor.prototype,
        );

        const methodNames = methodNamesAll.filter(m => {
          return (
            !(
              [
                '__trigger_event__',
                'clone',
                'listenTo',
              ] as (keyof BaseSubscriberForEntity)[]
            ).includes(m as any) &&
            !m.startsWith('_') &&
            !m.startsWith('inject')
          );
        });

        // Wrap each method
        methodNames.forEach(methodName => {
          const originalMethod = (this as any)[methodName];

          (this as any)[methodName] = async (...methodArgs: any[]) => {
            const result = originalMethod.apply(this, methodArgs);
            const self = this as any as BaseSubscriberForEntity<any>;
            // If the result is a promise, wait for it to resolve
            if (result instanceof Promise) {
              await result;
            }

            // Check if we need to trigger the manual event
            if (
              options.allowedEvents === undefined ||
              options.allowedEvents.includes(methodName)
            ) {
              self.__trigger_event__(methodName as any);
            }

            return result;
          };
        });
        //#endregion
      }
    } as any;
  } as any;
}
```


# png in terminal

```ts
protected async header(): Promise<void> {
  //#region @backendFunc
  const logoLight = this.ins
    .by('container', config.defaultFrameworkVersion)
    .pathFor('../../__images/logo/logo-console-light.png');

  const logoDark = this.ins
    .by('container', config.defaultFrameworkVersion)
    .pathFor('../../__images/logo/logo-console-dark.png');

  // console.log({ logoLight });
  const pngStringify = require('console-png');
  // consolePng.attachTo(console);
  const image = fse.readFileSync(logoDark);
  return new Promise((resolve, reject) => {
    pngStringify(image, function (err, string) {
      if (err) {
        throw err;
      }
      console.log(string);
      resolve();
    });
  });
  //#endregion
}
```
