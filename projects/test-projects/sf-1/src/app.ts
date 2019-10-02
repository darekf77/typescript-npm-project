import * as _ from 'lodash';
import * as $ from 'jquery';
import { Morphi } from 'morphi';
//#region @backend
import * as path from 'path';
import { Connection } from 'typeorm/connection/Connection';
import { IncCompiler } from 'incremental-compiler';
//#endregion
const database = 'tmp-db.sqlite';

@Morphi.Entity()
export class USER extends Morphi.Base.Entity<any, any, IUserController> {

  public static ctrl: UserController;

  //#region @backend
  @Morphi.Orm.Column.Generated()
  //#endregion
  id: number;

  //#region @backend
  @Morphi.Orm.Column.Custom('varchar')
  //#endregion
  name: string;

  public static async getUsers() {
    const data = await this.ctrl.getAll().received;
    return data.body.json;
  }

  public static db(users: USER[]) {
    return {
      find(id: number): USER {
        return users.find(u => u.id == id);
      }
    }
  }


}

export type IUserController = UserController;

@Morphi.Controller({
  entity: USER
})
export class UserController extends Morphi.Base.Controller<USER> {

  //#region @backend
  async initExampleDbData() {
    const repo = await this.connection.getRepository(USER);

    const user1 = new USER()
    user1.name = 'Dariusz F'
    await repo.save(user1)

    const user2 = new USER()
    user2.name = 'Peter Parker'
    await repo.save(user2);
  }
  //#endregion

}

//#region @backend
const absoluteDatabasePath = path.resolve(path.join(__dirname, '..', database));
console.log(`absoluteDatabasePath: ${absoluteDatabasePath}`)
@IncCompiler.Class({
  className: 'IncCompiler'
})
export class DBWatcher extends IncCompiler.Base {

  constructor(public connection: Connection) {
    super({
      folderPath: [absoluteDatabasePath]
    });
  }

  users: USER[];

  @IncCompiler.methods.AsyncAction()
  async asyncAction() {
    // console.log(`Db changed: ${event.fileAbsolutePath}`);
    const newUsers = await (await this.connection.getRepository(USER)).find();
    if (_.isUndefined(this.users)) {
      this.users = newUsers;
      console.log('first time users', newUsers)
    } else {
      if (!_.isEqual(this.users, newUsers)) {
        this.users.forEach(u => {
          const inNew = USER.db(newUsers).find(u.id);
          if (!_.isEqual(u, inNew)) {
            Morphi.Realtime.Server.TrigggerEntityChanges(u);
          }
        });
        this.users = newUsers;
      }
    }
  }

}
//#endregion

const host = 'http://localhost:3000'
const controllers: Morphi.Base.Controller<any>[] = [UserController as any];
const entities: Morphi.Base.Entity<any>[] = [USER as any];


const start = async () => {

  //#region @backend
  const config = {
    type: 'sqlite',
    database,
    synchronize: true,
    dropSchema: true,
    logging: false
  } as any;
  //#endregion

  const connection = await Morphi.init({
    host,
    controllers,
    entities,
    //#region @backend
    config
    //#endregion
  });

  // @LAST
  if (Morphi.IsBrowser) {
    document.body.innerHTML = `<div id="app" ></div>`;
    const appDiv: HTMLElement = document.getElementById('app');

    const updateView = (users: USER[]) => {
      appDiv.innerHTML = `
      <h1>TypeScript Starter</h1>

      <button id="subscribe"> subscribe </button>
      <button id="unsubsubscribe"> unsubsubscribe </button>
      <br>
      ${users ? JSON.stringify(users) : ' - '}
      `;
    }

    const usersFromDb = await USER.getUsers();
    const [first, second] = usersFromDb;
    first.subscribeRealtimeUpdates({
      callback: (r) => {
        console.log(`realtime update for first user ${first.id}, ${first.name}`, r);
        _.merge(first, r.body.json);
        updateView(usersFromDb)
      }
    });
    second.subscribeRealtimeUpdates({
      callback: (r) => {
        console.log(`realtime update for second user ${second.id}, ${second.name}`, r);
        _.merge(second, r.body.json);
        updateView(usersFromDb)
      }
    });
    updateView(usersFromDb);

    $('#subscribe').click(e => {
      console.log('sub')
    })
    $('#unsubsubscribe').click(e => {
      console.log('unsub')
    })
  }

  if (Morphi.IsNode) {
    //#region @backend
    const w = new DBWatcher(connection);
    await w.asyncAction()
    await w.startAndWatch();
    //#endregion
  }

}


if (Morphi.IsBrowser) {
  start();
}

export default function () {
  return start();
}

