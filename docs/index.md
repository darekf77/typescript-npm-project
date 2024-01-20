# Introduction

<img src="./__images/logo-header-bold.png" >

**Firedev** 🔥🔥🔥 is a solution for

\+
[typescript](https://www.typescriptlang.org/)  

\+
[angular](https://angular.io/) 

\+
[rxjs](https://rxjs.dev/)  / [ngrx](https://ngrx.io/) (optional) 

\+
[nodejs](https://nodejs.org/en/)

\+ [typeorm](https://typeorm.io/)
- [sqlite](https://github.com/WiseLibs/better-sqlite3) - SUPPORTED
- [sql.js](https://sql.js.org) - SUPPORTED IN WEBSQL MODE
- [mysql](https://www.mysql.com/) - support in progress
- [postgress](https://www.postgresql.org) - support in progress
- [mongo](https://www.postgresql.org) - support in progress


backend/frontend [*isomorphic](https://en.wikipedia.org/wiki/Isomorphic_JavaScript)  apps .


## Required version of NodeJS** 
- Windows 10/11 (gitbash): >= v16 
- MacOS: >= v16
- Linux: >= v16

*lower versions of NodeJS are unofficialy 
support for MacOS/Linux

## How to

## How to install firedev
```
npm i -g firedev
```

## How to install firedev Visual Studio Code extension
Go to: https://marketplace.visualstudio.com/items?itemName=firedev.firedev-vscode-ext

(WARNING before using *firedev-vscode-ext*, please at lease once 
execute **any** command of **firedev** in your temrinal)

<p style="text-align: center;border: 1px solid black;"><img src="./__images/vscode-ext.png" ></p>

##  How to uninstall firedev from local machine
Firedev stores a big global container (in ~/.firedev) for npm packages that are being shared 
accros all firedev apps
```
npm uninstall -g firedev
rm -rf ~/.firedev  # firedev local packages repository
```

## Philosophy of Firedev
=> One language for browser/backend/database - **TypeScript**

=> Builded on top of rock solid frameworks

=> **Never** ever **repeat** single line of **code**

=> Everything automatically generated, strongly typed

=> Crazy fast / developer-friendly coding in <b>Visual Studio Code</b>

=> Shared <b>node_modules</b> for similar projects (from one big npm pacakges container)

=>**No need for local node_modules** => many projects takes megabytes instead gigabytes

=> Automation for releasing projects (standalone and organization) to github pages / npm repositories (github actions, dockers support comming soon)

=> Develop libraries and apps at the same time! (mixed NodeJs packages with proper Angular ivy packages)

=> Assets from project can be shared with npm package! (only those from **/src/assets/shared**)

=> Two development modes
  1. NORMAL - sqlite/mysql for database and normal NodeJS server
  ```
  firedev start # in any project
  ```
  2. WEBSQL - sql.js for database/server in browser development mode
  ```
  firedev start --websql  # in any project
  ```


=> WEBSQL mode is a perfect solution for:

*\+ github pages serverless demo apps with "almost" full functionality!* 

*\+ e2e/integration tests*

*\+ local NodeJS/database development without starting NodeJS server!*

# Advantages of Firedev
## 1. No separation between backend and frontend code 
- use BE entity as FE dto!
- this is a dream situation for any developer!
- perfect solution for any kind of projects ( hobbyst / freelancers / enterprise )
- CRAZY FAST business changes across database tables and frontend 
Angular templates - CHECK!
- frontend/backend/database code refactor at the same time!

<b>example.ts</b>

```ts
import { Firedev } from 'firedev';

@Firedev.Entity()
class User {
  //#region @backend
  @Firedev.Orm.Column.Generated()
  //#endregion
  id: string;
}

```

your browser will get code below:
```ts
import { Firedev } from 'firedev/browser';

@Firedev.Entity()
class User {
  /* */
  /* */
  /* */
  id: string;
}

```

*..same thing applies in reverse to browser code*

<b>common.service.ts</b>

```ts
import { Firedev } from 'firedev';
//@region @browser
import { Injectable } from '@angular/core';
//#endregion

//@region @browser
@Injectable()
//#endregion
class CommonService {
  helloWorld() { 
    console.log('Hello on backend and frontend')
  }
}

```

your backend will get code below:
```ts
import { Firedev } from 'firedev';
/* */
/* */
/* */

/* */
/* */
/* */
class CommonService {
  helloWorld() { 
    console.log('Hello on backend and frontend')
  }
}

```

## 2. Additional "Websql Mode" for writing backend in browser!
- Instead running local server - run everything (db,backend) in browser thanks to sql.js/typeorm !
- This is possible ONLY in firedev with highest possible abstraction concepts

<b>example.ts</b>

```ts
import { Firedev } from 'firedev';

@Firedev.Entity()
class User {
  //#region @websql
  @Firedev.Orm.Column.Generated()
  //#endregion
  id: string;
}

```

your browser will get code below:
```ts
import { Firedev } from 'firedev/websql';


@Firedev.Entity()
class User {
 //#region @websql
  @Firedev.Orm.Column.Generated()
  //#endregion
  id: string;
}

```
Database columns can be created in browser/frontend with sql.js !

<p style="text-align: center;"><img src="./__images/admin-mode.png" ></p>

\+ also you can set in *Firedev Admin Mode* if you prefere to 
 clear database after each page refresh.


## 3. Smooth REST api
- define host only once for backend and frontend!
- no more of ugly acces to server... firedev takes it to next level !
- in Angular/RxJS environemtn => it more than pefect solution !

user.controller.ts
```ts
@Firedev.Controller({
  entity: User
})
class UserController {
                      
                      // name 'helloAmazingWorld' 
                      // from this class function 
                      // is being use for creating
  @Firedev.Http.GET() // expressjs server routes 
  helloAmazingWorld():Firedev.Response<string> {  
    //region @backendFunc
    return async () => {
      return `hello world`;
    };
    //#endregion
  }

}
```

user.ts
```ts
@Firedev.Entity()
class User {
  static ctrl: UserController; // automatically injected
  static helloAmazingWorld() {
    return this.ctrl.helloAmazingWorld().received.observable;
  } 
}
```

user.component.ts
```ts
@Component({
  selector: 'app-user',
  template: `
  Message from user:  {{ userHello$ | async }}  
  `
  ...
})
export class UserComponent implements OnInit {
   userHello$ = User.helloAmazingWorld();
   ...
}
```


app.module.ts
```ts
const host = 'http://localhost:4444'; // host defined once!

const context = await Firedev.init({
    host,
    controllers: [UserController],
    entities: [User],
    //#region @backend
    config // for database configuration
    //#endregion
    ...
  });

context.host // -> available on backend and frontend !


```
## 4. CRUD api in 60 seconds or less...
- use observable or promises .. .whatever you like
```ts
@Firedev.Entity()
class Task {
  ctrl: TaskController; // injected automatically
  //#region @backend
  @Firedev.Orm.Column.Generated()
  //#endregion
  id: number;

  //#region @backend
  @Firedev.Orm.Column.Column({ type: 'varchar', length: 100 })
  //#endregion
  content: string;
}

@Firedev.Controlle({ entity: Task })
export class TaskController extends Firedev.Base.Controller<Task>{ } 

@Component({
  // ...
})
export class TasksComponent implements OnInit {

  // .getAll(), getBy(), deleteById(), create() etc.
  tasks$ = Task.ctrl.getAll().received.observable.pipe(
    map( response => response.body.json )
  );

  async ngOnInit() {
    const data = await Task.ctrl.create( //
      Task.from({  content: 'Hello' })
    );

    console.log(data); // http response with updated Task
  }
}

```

## 5. Super easy realtime / sockets communication
- realtime communication as simple as possible!
task.ts
```ts
@Firedev.Entity()
class Task {
  static ctrl: TaskController; // automatically injected
  //#region @backend
  @Firedev.Orm.Column.Generated()
  //#endregion
  id: number;
}
```
task.controller.ts
 ```ts
@Firedev.Controlle({ entity: Task })
export class TaskController extends Firedev.Base.Controller<Task>{ } 
```
task.component.ts
```ts
@Component({
  ...
})
export class TasksComponent implements OnInit, OnDestroy { 
  $destroyed = new Subject();

  @Input(); task: Task;
  ngOnInit() {
    Firedev.Realtime.Browser.listenChangesEntityObj(this.task).pipe(
      takeUntil(this.$destroyed)
      exhaustMap(()=> {
        return Tasks.ctrl.getBy(this.task.id).received.observable.pipe(
          map( response => {
            this.task = response.body.json;
          })
        )
      })
    );
  }
                  // it will automatically 
  ngOnDestroy() { //unsubscribe from socket communication
    this.$destroyed.next();
    this.$destroyed.unsubscribe();
  }

}
 ```
