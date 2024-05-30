//#region imports
import { Firedev } from 'firedev/src';
import {
  Observable,
  map,
  BehaviorSubject,
  combineLatest,
  switchMap,
} from 'rxjs';
import {
  FiredevFileController,
  FiredevBinaryFileController,
  FiredevFile,
  FiredevFileCss,
  FiredevBinaryFile,
} from 'firedev-ui'; // TODO LAST WHY CLASS NAME DOES NOT WORK
import { HOST_BACKEND_PORT } from './app.hosts';
import { _ } from 'tnp-core';
//#region @browser
import { NgModule } from '@angular/core';
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
//#endregion
//#endregion

//#region @browser
@Component({
  selector: 'app-tnp',
  template: `hello from tnp<br />
    <br />
    from backend
    <ul>
      <li *ngFor="let user of users$ | async">{{ user | json }}</li>
    </ul>
    <button (click)="add()">add and refresh</button> `,
  styles: [
    `
      body {
        margin: 0px !important;
      }
    `,
  ],
})
export class TnpComponent implements OnInit {
  trigger = new BehaviorSubject<void>(void 0);
  users$: Observable<User[]> = this.trigger.asObservable().pipe(
    switchMap(() => User.ctrl.getAll().received.observable),
    map(data => data.body.json),
  );

  async add() {
    await User.ctrl.create(
      User.from({ name: 'franek' + new Date().getTime() }),
    );
    await this.trigger.next();
  }

  constructor() {}
  // eslint-disable-next-line @angular-eslint/no-empty-lifecycle-method
  ngOnInit() {}
}

@NgModule({
  imports: [CommonModule],
  exports: [TnpComponent],
  declarations: [TnpComponent],
  providers: [],
})
export class TnpModule {}
//#endregion

@Firedev.Entity({ className: 'User' })
class User extends Firedev.Base.Entity {
  public static ctrl?: UserController;
  public static from(user: Partial<User>) {
    return _.merge(new User(), _.cloneDeep(user));
  }
  //#region @websql
  @Firedev.Orm.Column.Generated()
  //#endregion
  id?: string | number;

  //#region @websql
  @Firedev.Orm.Column.Custom({ type: 'varchar', length: '100', nullable: true })
  //#endregion
  name?: string | number;
}

@Firedev.Controller({ className: 'UserController' })
class UserController extends Firedev.Base.CrudController<User> {
  entity = () => User;

  //#region @websql
  async initExampleDbData(): Promise<void> {
    //#region @backendFunc
    // @ts-ignore
    await this.repository.save(new User());
    //#endregion
  }
  //#endregion
}

async function start() {
  console.log('hello world');
  console.log('Your server will start on port ' + HOST_BACKEND_PORT);
  const host = 'http://localhost:' + HOST_BACKEND_PORT;

  // const context = await Firedev.init({
  //   host,
  //   controllers: [
  //     UserController,
  //     FiredevFileController,
  //     FiredevBinaryFileController,
  //     // PUT FIREDEV CONTORLLERS HERE
  //   ],
  //   entities: [
  //     User,
  //     FiredevFile,
  //     FiredevFileCss,
  //     FiredevBinaryFile,
  //     // PUT FIREDEV ENTITIES HERE
  //   ],
  //   //#region @websql
  //   config: {
  //     type: 'better-sqlite3',
  //     database: 'tmp-db.sqlite',
  //     logging: false,
  //   }
  //   //#endregion
  // });

  // if (Firedev.isBrowser) {
  //#region @browser
  // const users = (await User.ctrl.getAll().received).body.json;
  // console.log({
  //   'users from backend': users
  // });
  //#endregion
  // }
}

export default start;
