//#region @backend
import { Morphi } from 'morphi';
import { USER } from './USER';


export interface USER_ALIASES {

  user: string;

}

@Morphi.Repository(USER)
export class USER_REPOSITORY extends Morphi.Base.Repository<USER, USER_ALIASES> {


  globalAliases: (keyof USER_ALIASES)[] = ['user']


  byUsername(username: string) {

    return this
      .createQueryBuilder(Morphi.Orm.TableNameFrom(USER))
      .innerJoinAndSelect(`${Morphi.Orm.TableNameFrom(USER)}.emails`, 'emails')
      .where(`${Morphi.Orm.TableNameFrom(USER)}.username = :username`)
      .setParameter('username', username)
      .getOne()

  }

  byId(id: number) {

    return this
      .createQueryBuilder(Morphi.Orm.TableNameFrom(USER))
      .innerJoinAndSelect(`${Morphi.Orm.TableNameFrom(USER)}.emails`, 'emails')
      .where(`${Morphi.Orm.TableNameFrom(USER)}.id = :id`)
      .setParameter('id', id)
      .getOne()

  }

}
//#endregion
