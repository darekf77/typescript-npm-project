//#region @backend
import { EntityRepository, META } from 'morphi';
import { USER } from '../../entities/core/USER';

export interface USER_ALIASES {

  user: string;

}

@EntityRepository(USER)
export class USER_REPOSITORY extends META.BASE_REPOSITORY<USER, USER_ALIASES> {


  globalAliases: (keyof USER_ALIASES)[] = ['user']


  byUsername(username: string) {

    return this
      .createQueryBuilder(META.tableNameFrom(USER))
      .innerJoinAndSelect(`${META.tableNameFrom(USER)}.emails`, 'emails')
      .where(`${META.tableNameFrom(USER)}.username = :username`)
      .setParameter('username', username)
      .getOne()

  }

  byId(id: number) {

    return this
      .createQueryBuilder(META.tableNameFrom(USER))
      .innerJoinAndSelect(`${META.tableNameFrom(USER)}.emails`, 'emails')
      .where(`${META.tableNameFrom(USER)}.id = :id`)
      .setParameter('id', id)
      .getOne()

  }

}
//#endregion
