
//#region @backend
import { Morphi } from 'morphi';
import { EMAIL } from '../../entities/core/EMAIL';
import { tableNameFrom } from 'morphi/framework';

export interface EMAIL_ALIASES {

  email: string;
  emails: string;

}


@Morphi.Repository()
export class EMAIL_REPOSITORY extends Morphi.Base.Repository<EMAIL, EMAIL_ALIASES> {


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
      .createQueryBuilder(tableNameFrom(EMAIL))
      .innerJoinAndSelect(`${tableNameFrom(EMAIL)}.user`, 'user')
      .where(`${tableNameFrom(EMAIL)}.address = :email`)
      .setParameter('email', address)
      .getOne();

  }

}

//#endregion
