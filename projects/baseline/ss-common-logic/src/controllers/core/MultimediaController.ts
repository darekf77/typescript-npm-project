
import {
  ENDPOINT, GET, POST, PUT, DELETE, isNode, Connection,
  PathParam, QueryParam, CookieParam, HeaderParam, BodyParam,
  Response, OrmConnection, Errors, isBrowser, BaseCRUDEntity,
  CLASSNAME
} from 'morphi';
import { get } from "lodash";

//#region @backend
import * as fs from 'fs';
import * as fse from 'fs-extra';
import { authenticate, use } from 'passport';
import { Strategy, IStrategyOptions } from 'passport-http-bearer';
import { isEmail, isLowercase, isLength } from 'validator';
import * as q from 'q';
import { Handler } from 'express';
export { Handler } from 'express';
import * as bcrypt from 'bcrypt';
import * as graph from 'fbgraph';
import * as path from 'path';
import { UploadedFile } from "express-fileupload";
import { getRecrusiveFilesFrom } from 'morphi';
//#endregion
import * as _ from 'lodash';

import { META } from 'morphi';

import * as entities from '../../entities';
import * as controllers from '../../controllers';
import { MULTIMEDIA, MultimediaType } from '../../entities/core/MULTIMEDIA';


@ENDPOINT({
  auth: (method) => {
    //#region @backendFunc
    return authenticate('bearer', { session: false });
    //#endregion
  }
})
@CLASSNAME('MultimediaController')
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
  @BaseCRUDEntity(entities.MULTIMEDIA) entity: entities.MULTIMEDIA;

  get db() {
    return entities.entities(this.connection as any);
  }

  get ctrl() {
    return controllers.controllers()
  }




  private discover(folderName, type: MultimediaType) {
    const res: MULTIMEDIA[] = []
    const files: string[] = getRecrusiveFilesFrom(folderName);
    files.forEach(name => {
      let m = this.db.MULTIMEDIA.create({
        name,
        type
      });
      res.push(m)
    })

    return res.map(r => {
      r.name = r.name.replace(folderName, '')
      return r;
    }).filter(r => {
      // console.log(`r.name ${r.name}`)
      return r.name && r.name.trim() !== '' && !r.name.startsWith('/.')
    })
  }

  async initExampleDbData() {

    const assets = [
      ...this.discover(ENV.pathes.backup.picture, 'picture'),
      ...this.discover(ENV.pathes.backup.audio, 'audio'),
      ...this.discover(ENV.pathes.backup.video, 'video')
    ].map(m => {
      return this.db.MULTIMEDIA.save(m);
    });

    await Promise.all(assets);

  }
  //#endregion


}
