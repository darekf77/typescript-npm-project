# Advantages of Isomorphic Code & Taon Framework

Isomorphic code in TypeScript offers a range of advantages for web developers. 
By enabling code reuse on both client and server sides,
 it enhances efficiency and maintains consistency

### 1. No separation between backend and frontend code 
- use BE entity as FE dto!
- this is a dream situation for many developers!
- perfect solution for all kinds of projects ( hobbyst / freelancers / enterprise )
- CRAZY FAST business changes across database tables and frontend 
Angular templates - CHECK!
- frontend/backend/database code refactor at the same time!

<b>example.ts</b>

```ts
import { Taon } from 'taon';

@Taon.Entity()
class User {
  //#region @backend
  @Taon.Orm.Column.Generated()
  //#endregion
  id: string;
}

```

your browser will get code below:
```ts
import { Taon } from 'taon/browser';

@Taon.Entity()
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
import { Taon } from 'taon';
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
import { Taon } from 'taon';
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

### 2. Additional "Websql Mode" for writing backend in browser!
- Instead running local server - run everything (db,backend) in browser thanks to sql.js/typeorm !
- This is possible ONLY in taon with highest possible abstraction concepts

<b>example.ts</b>

```ts
import { Taon } from 'taon';

@Taon.Entity()
class User {
  //#region @websql
  @Taon.Orm.Column.Generated()
  //#endregion
  id: string;
}

```

your browser will get code below:
```ts
import { Taon } from 'taon/websql';


@Taon.Entity()
class User {
 //#region @websql
  @Taon.Orm.Column.Generated()
  //#endregion
  id: string;
}

```
Database columns can be created in browser/frontend with sql.js !

<p style="text-align: center;"><img src="../assets/images/admin-mode.png" ></p>

\+ also you can set in *Taon Admin Mode* if you prefere to 
 clear database after each page refresh.


### 3. Smooth REST api
- define host only once for backend and frontend!
- no more of ugly acces to server... taon takes it to next level !
- in Angular/RxJS environemtn => it more than pefect solution !

user.controller.ts
```ts
@Taon.Controller({
  entity: User
})
class UserController {
                      
                      // name 'helloAmazingWorld' 
                      // from this class function 
                      // is being use for creating
  @Taon.Http.GET() // expressjs server routes 
  helloAmazingWorld():Taon.Response<string> {  
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
@Taon.Entity()
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

const context = await Taon.init({
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
### 4. CRUD api in 60 seconds or less...
- use observable or promises .. .whatever you like
```ts
@Taon.Entity()
class Task {
  ctrl: TaskController; // injected automatically
  //#region @backend
  @Taon.Orm.Column.Generated()
  //#endregion
  id: number;

  //#region @backend
  @Taon.Orm.Column.Column({ type: 'varchar', length: 100 })
  //#endregion
  content: string;
}

@Taon.Controlle({ entity: Task })
export class TaskController extends Taon.Base.Controller<Task>{ } 

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

### 5. Super easy realtime / sockets communication
- realtime communication as simple as possible!

task.ts
```ts
@Taon.Entity()
class Task {
  static ctrl: TaskController; // automatically injected
  //#region @backend
  @Taon.Orm.Column.Generated()
  //#endregion
  id: number;
}
```

task.controller.ts
```ts
@Taon.Controlle({ entity: Task })
export class TaskController extends Taon.Base.Controller<Task>{ }
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
    Taon.Realtime.Browser.listenChangesEntityObj(this.task).pipe(
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

