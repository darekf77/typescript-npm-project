import { FeatureForProject } from '../../abstract';
import * as fse from 'fs-extra';
import * as path from 'path';
import * as _ from 'lodash';
import { Helpers } from '../../../index';


export class FilesFactory extends FeatureForProject {


  createFile(pathToFile: string, content?: string | JSON) {
    const destPath = path.isAbsolute(pathToFile) ? pathToFile : path.join(this.project.location, pathToFile)
    // log(`CREATE FILE: ${destPath}`)
    if (_.isUndefined(content)) {
      content = '';
    }
    if (!fse.existsSync(path.dirname(destPath))) {
      fse.mkdirpSync(path.dirname(destPath))
    }
    if (_.isObject(content)) {
      fse.writeJSONSync(destPath, content, { encoding: 'utf8', spaces: 2 })
    } else {
      Helpers.writeFile(destPath, content);
    }
  }

  create(...pathes: string[]) {
    const self = this;
    return {
      file(content: string) {
        self.createFile(path.join(pathes.join('/')), content);
      }
    }
  }


  createModel(relativePath: string, name: string) {

    this.createEntity(relativePath, name);
    this.createController(relativePath, name);
  }



  private createEntity(relativePath: string, name: string) {
    const kebebCaseName = _.kebabCase(name);
    const fileNameWithoutExt = _.upperCase(_.kebabCase(name).replace(/\-/g, '_')).replace(/\s/g, '_');
    this.create(relativePath, kebebCaseName, `${fileNameWithoutExt}.ts`)
      .file(
      `
import { Morphi } from 'morphi';

export interface I${fileNameWithoutExt} {
  id?: number;
  exampleProperty?: string;
}

@Morphi.Entity<${fileNameWithoutExt}>({
  className: '${fileNameWithoutExt}',
  mapping: {

  }
})
export class ${fileNameWithoutExt} extends Morphi.Base.Entity<${fileNameWithoutExt}, I${fileNameWithoutExt}> implements I${fileNameWithoutExt} {

  //#region @backend
  @Morphi.Orm.Column.Generated()
  //#endregion
  id: number

  //#region @backend
  @Morphi.Orm.Column.Custom()
  //#endregion
  exampleProperty: string

}
`)
  }



  private createController(relativePath: string, name: string) {
    const camelCaseUpperFirst = _.upperFirst(_.camelCase(name));
    const kebebCaseName = _.kebabCase(name);
    const fileNameWithoutExt = _.upperCase(_.kebabCase(name).replace(/\-/g, '_')).replace(/\s/g, '_');
    const NameController = `${camelCaseUpperFirst}Controller`;
    this.create(relativePath, kebebCaseName, `${NameController}.ts`)
      .file(
      `
import { Morphi } from 'morphi';
import { ${fileNameWithoutExt} } from './${fileNameWithoutExt}';

@Morphi.Controller({
  className: '${NameController}',
  entity: ${fileNameWithoutExt},
  //#region @backend
  // auth: () => {
  //   return authenticate('bearer', { session: false });
  // }
  //#endregion
})
export class ${NameController} extends Morphi.Base.Controller<${fileNameWithoutExt}> {

  //#region @backend
  async initExampleDbData() {

  }
  //#endregion

}
`);

  }

}
