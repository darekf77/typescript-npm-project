
//#region @backend
import { Morphi } from 'morphi';
import { EMAIL } from '../../entities/core/EMAIL';


export interface EMAIL_ALIASES {

  email: string;
  emails: string;

}


@Morphi.Repository(EMAIL)
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
      .createQueryBuilder( Morphi.Orm.TableNameFrom(EMAIL))
      .innerJoinAndSelect(`${Morphi.Orm.TableNameFrom(EMAIL)}.user`, 'user')
      .where(`${Morphi.Orm.TableNameFrom(EMAIL)}.address = :email`)
      .setParameter('email', address)
      .getOne();

  }

}

//#endregion
