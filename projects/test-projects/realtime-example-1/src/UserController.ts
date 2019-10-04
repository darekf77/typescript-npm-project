import { Morphi } from 'morphi';
import { USER } from './USER';

export type IUserController = UserController;

@Morphi.Controller({
  entity: USER
})
export class UserController extends Morphi.Base.Controller<USER> {

  //#region @backend
  async initExampleDbData() {
    const repo = await this.connection.getRepository(USER);

    const user1 = new USER()
    user1.name = 'Dariusz F';
    await repo.save(user1)

    const user2 = new USER()
    user2.name = 'Peter Parker';
    await repo.save(user2);
  }
  //#endregion

}
