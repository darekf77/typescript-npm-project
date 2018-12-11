//#region @backend
import { Morphi } from 'morphi';
import { USER } from '../../entities/core/USER';
import { SESSION } from '../../entities/core/SESSION';
import { SESSION_CONFIG } from '../../entities/core/SESSION';
import { tableNameFrom } from 'morphi/framework';

export interface SESSION_ALIASES {

  sesssion: string;

}


@Morphi.Repository()
export class SESSION_REPOSITORY extends Morphi.Base.Repository<SESSION, SESSION_ALIASES> {


  globalAliases: (keyof SESSION_ALIASES)[] = ['sesssion'];


  CONFIG = SESSION_CONFIG;

  async getByUser(user: USER, ip: string) {

    // TODO QUICK_FIX localhost
    if (ip === '::ffff:127.0.0.1') {
      ip = '::1'
    }

    const Session = await this.createQueryBuilder(tableNameFrom(SESSION))
      .innerJoinAndSelect(`${tableNameFrom(SESSION)}.user`, tableNameFrom(USER))
      .where(`${tableNameFrom(SESSION)}.user = :id`)
      .andWhere(`${tableNameFrom(SESSION)}.ip = :ip`)
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

    const Session = await this.createQueryBuilder(tableNameFrom(SESSION))
      .innerJoinAndSelect(`${tableNameFrom(SESSION)}.user`, tableNameFrom(USER))
      .where(`${tableNameFrom(SESSION)}.token = :token`)
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
