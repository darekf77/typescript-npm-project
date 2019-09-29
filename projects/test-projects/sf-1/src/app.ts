import { Morphi } from 'morphi'

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

const host = 'http://localhost:3000'
const controllers: Morphi.Base.Controller<any>[] = [UserController as any];
const entities: Morphi.Base.Entity<any>[] = [USER as any];


const start = async () => {

  //#region @backend
  const config = {
    type: "sqlite",
    database: 'tmp-db.sqlite',
    synchronize: true,
    dropSchema: true,
    logging: false
  } as any;
  //#endregion

  Morphi.init({
    host,
    controllers,
    entities,
    //#region @backend
    config
    //#endregion
  })

  if (Morphi.IsBrowser) {
    const users = await USER.getUsers()
    console.log(users);
  }

}


if (Morphi.IsBrowser) {
  start()
}

export default function() {
  return start();
};
