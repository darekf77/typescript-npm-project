
import { Morphi } from 'morphi';
import { UserController, IUserController } from './UserController';


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

  //#region @backend
  @Morphi.Orm.Column.Custom('bigint', {
    default: 0
  })
  //#endregion
  age: number;

  public static async getUsers() {
    const data = await this.ctrl.getAll().received;
    return data.body.json;
  }

  get fullName() {
    return `${this.name} age: ${this.age}`;
  }

  public static db(users: USER[]) {
    return {
      find(id: number): USER {
        return users.find(u => u.id == id);
      }
    };
  }

}

