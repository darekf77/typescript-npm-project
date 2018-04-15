//#region @backend

import { Repository, Connection } from 'typeorm';

import {
  Controllers, Entities, AuthController
} from '../index';

import { META } from "../helpers";


export class MockData extends META.BASE_MOCK_DATA {


  constructor(connection: Connection) {
    super(connection)
  }


}
//#endregion
