//#region @backend

import { Repository, Connection } from 'typeorm';
import { authenticate, use } from 'passport';
import { Strategy, IStrategyOptions } from 'passport-http-bearer';

import {
  Controllers, Entities
} from '../index';

import { META } from "../helpers";
import * as entities from '../entities';
import * as controllers from '../controllers';


export class InitMockData extends META.BASE_MOCK_DATA {

  get db() {
    return entities.entities(this.connection as any);
  }

  get ctrl() {
    return controllers.controllers()
  }

  constructor(connection: Connection) {
    super(connection)
  }

  async init() {
    //#region @backendFunc

    const types = await this.db.EMAIL_TYPE.init();

    const strategy = async (token, cb) => {
      let user: entities.USER = null;
      const Session = await this.db.SESSION.getByToken(token);

      if (Session) {
        if (Session.isExpired()) {
          await this.db.SESSION.remove(Session);
          return cb(null, user);
        }
        user = Session.user;
        user.password = undefined;
      }
      return cb(null, user);
    };
    use(new Strategy(strategy));

    await this.ctrl.AuthController.__mocks();
    //#endregion
  }


}
//#endregion
