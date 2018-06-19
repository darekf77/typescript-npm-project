
import {
  ENDPOINT, GET, POST, PUT, DELETE, isNode, Connection,
  PathParam, QueryParam, CookieParam, HeaderParam, BodyParam,
  Response, OrmConnection, Errors, isBrowser, BaseCRUDEntity,
  CLASS_NAME, getClassName
} from 'morphi';
import { get } from "lodash";

//#region @backend
import { authenticate, use } from 'passport';
import { Strategy, IStrategyOptions } from 'passport-http-bearer';
import { isEmail, isLowercase, isLength } from 'validator';
import * as q from 'q';
import { Handler } from 'express';
export { Handler } from 'express';
import * as bcrypt from 'bcrypt';
import * as graph from 'fbgraph';
import * as path from 'path';
import * as fse from 'fs-extra';
import { UploadedFile } from "express-fileupload";
//#endregion

import { META } from '../../helpers';

import * as entities from '../../entities';
import * as controllers from '../../controllers';

@CLASS_NAME('MultimediaController')
@ENDPOINT({
  auth: (method) => {
    //#region @backendFunc
    return authenticate('bearer', { session: false });
    //#endregion
  }
})
export class MultimediaController extends META.BASE_CONTROLLER<entities.MULTIMEDIA> {

  constructor() {
    super()
    entities.MULTIMEDIA.recreateFolder()
  }

  @POST('/upload')
  upload(): Response<boolean> {
    //#region @backendFunc
    return async (req, res) => {
      const file: UploadedFile = get(req, 'files.file');


      if (!file) {
        throw 'No files were uploaded.';
      }
      if (entities.MULTIMEDIA.mimetype.picture.includes(file.mimetype)) {
        let m = new entities.MULTIMEDIA()
        m.name = file.name;
        m.type = 'picture';
        m = await this.db.MULTIMEDIA.save(m)
        const p = m.path;
        await file.mv(m.path, undefined) as any;
        console.log('uploaded file', file)
      }

      return true;
    }
    //#endregion
  }


  //#region @backend
  @OrmConnection connection: Connection;
  @BaseCRUDEntity(entities.SESSION) entity: entities.MULTIMEDIA;

  get db() {
    return entities.entities(this.connection as any);
  }

  get ctrl() {
    return controllers.controllers()
  }


  async initExampleDbData() {

    let m1 = new entities.MULTIMEDIA()
    m1.type = 'picture';


    m1 = await this.db.MULTIMEDIA.save(m1)

    console.log(m1.path)

  }
  //#endregion




}
