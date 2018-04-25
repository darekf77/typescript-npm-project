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

    await this.db.EMAIL_TYPE.init();

    await this.ctrl.AuthController.__createUser({
      username: 'admin',
      email: 'admin@admin.pl',
      password: 'admin'
    }, 'normal_auth');
    await this.ctrl.AuthController.__createUser({
      username: 'postman',
      email: 'postman@postman.pl',
      password: 'postman'
    }, 'normal_auth');
    //#endregion
  }


}
//#endregion
