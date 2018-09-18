//#region @backend
import { EntityRepository, META } from 'morphi';
import { EMAIL } from '../../entities/core/EMAIL';

export interface EMAIL_ALIASES {

  email: string;
  emails: string;

}

@EntityRepository(EMAIL)
export class EMAIL_REPOSITORY extends META.BASE_REPOSITORY<EMAIL, EMAIL_ALIASES> {


  globalAliases: (keyof EMAIL_ALIASES)[] = ['email', 'emails']


  async getUserBy(address: string) {

    const Email = await this.findOne({
      where: {
        address
      }
    });
    if (Email) return Email.user;

  }

  async findBy(address: string) {

    return await this
      .createQueryBuilder(META.tableNameFrom(EMAIL))
      .innerJoinAndSelect(`${META.tableNameFrom(EMAIL)}.user`, 'user')
      .where(`${META.tableNameFrom(EMAIL)}.address = :email`)
      .setParameter('email', address)
      .getOne();

  }

}

//#endregion
