//#region @backend
import { Morphi } from 'morphi';
import { USER } from '../../entities/core/USER';
import { SESSION } from '../../entities/core/SESSION';
import { SESSION_CONFIG } from '../../entities/core/SESSION';


export interface SESSION_ALIASES {

  sesssion: string;

}


@Morphi.Repository(SESSION)
export class SESSION_REPOSITORY extends Morphi.Base.Repository<SESSION, SESSION_ALIASES> {


  globalAliases: (keyof SESSION_ALIASES)[] = ['sesssion'];


  CONFIG = SESSION_CONFIG;

  async getByUser(user: USER, ip: string) {

    // TODO QUICK_FIX localhost
    if (ip === '::ffff:127.0.0.1') {
      ip = '::1'
    }

    const Session = await this.createQueryBuilder(Morphi.Orm.TableNameFrom(SESSION))
      .innerJoinAndSelect(`${Morphi.Orm.TableNameFrom(SESSION)}.user`, Morphi.Orm.TableNameFrom(USER))
      .where(`${Morphi.Orm.TableNameFrom(SESSION)}.user = :id`)
      .andWhere(`${Morphi.Orm.TableNameFrom(SESSION)}.ip = :ip`)
      .setParameters({
        id: user.id,
        ip
      })
      .getOne()
    if (Session) {
      Session.expireInSeconds = Session.calculateExpirationTime();
    }
    return Session;

  }

  async getByToken(token: string) {

    const Session = await this.createQueryBuilder(Morphi.Orm.TableNameFrom(SESSION))
      .innerJoinAndSelect(`${Morphi.Orm.TableNameFrom(SESSION)}.user`, Morphi.Orm.TableNameFrom(USER))
      .where(`${Morphi.Orm.TableNameFrom(SESSION)}.token = :token`)
      .setParameter('token', token)
      .getOne();
    if (Session) {
      Session.expireInSeconds = Session.calculateExpirationTime();
    }
    return Session;

  }

  async getFrom(user: USER, ip: string) {


    let Session = this.create();
    Session.user = user;
    Session.ip = ip;

    if (!ENV.workspace.build.server.production && user.username == 'postman') {
      Session.createToken('postman');
    } else if (user.username == 'admin') {
      Session.createToken('admin');
    } else {
      Session.createToken();
    }


    Session = await this.save(Session);
    if (Session) {
      Session.expireInSeconds = Session.calculateExpirationTime();
    }
    return Session;

  }


}

//#endregion
