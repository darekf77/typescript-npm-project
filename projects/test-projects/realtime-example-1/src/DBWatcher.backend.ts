import * as _ from 'lodash';
import * as path from 'path';
import { USER } from './USER';
import { IncCompiler } from 'incremental-compiler';
import { Connection } from 'typeorm/connection/Connection';
import { Morphi } from 'morphi';
import { database } from './config';

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
