//#region @backend
import { Morphi } from 'morphi';
import { USER } from '../../entities/core/USER';
import { tableNameFrom } from 'morphi/framework';

export interface USER_ALIASES {

  user: string;

}

@Morphi.Repository()
export class USER_REPOSITORY extends Morphi.Base.Repository<USER, USER_ALIASES> {


  globalAliases: (keyof USER_ALIASES)[] = ['user']


  byUsername(username: string) {

    return this
      .createQueryBuilder(tableNameFrom(USER))
      .innerJoinAndSelect(`${tableNameFrom(USER)}.emails`, 'emails')
      .where(`${tableNameFrom(USER)}.username = :username`)
      .setParameter('username', username)
      .getOne()

  }

  byId(id: number) {

    return this
      .createQueryBuilder(tableNameFrom(USER))
      .innerJoinAndSelect(`${tableNameFrom(USER)}.emails`, 'emails')
      .where(`${tableNameFrom(USER)}.id = :id`)
      .setParameter('id', id)
      .getOne()

  }

}
//#endregion
