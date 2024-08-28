import { BaseFeatureForProject } from 'tnp-helpers/src';
import { fse } from 'tnp-core/src';
import { path } from 'tnp-core/src';
import { _ } from 'tnp-core/src';
import { Helpers } from 'tnp-helpers/src';
import { Project } from '../../../project/abstract/project';

export class FilesFactory extends BaseFeatureForProject<Project> {
  createFile(pathToFile: string, content?: string | JSON) {
    const destPath = path.isAbsolute(pathToFile)
      ? pathToFile
      : path.join(this.project.location, pathToFile);
    // log(`CREATE FILE: ${destPath}`)
    if (_.isUndefined(content)) {
      content = '';
    }
    if (!fse.existsSync(path.dirname(destPath))) {
      Helpers.mkdirp(path.dirname(destPath));
    }
    if (_.isObject(content)) {
      fse.writeJSONSync(destPath, content, { encoding: 'utf8', spaces: 2 });
    } else {
      Helpers.writeFile(destPath, content);
    }
  }

  create(...pathes: string[]) {
    const self = this;
    return {
      file(content: string) {
        self.createFile(path.join(pathes.join('/')), content);
      },
    };
  }

  createModel(relativePath: string, name: string): void {
    this.createEntity(relativePath, name);
    this.createController(relativePath, name);
  }

  private createEntity(relativePath: string, name: string) {
    const kebebCaseName = _.kebabCase(name);
    const fileNameWithoutExt = _.upperCase(
      _.kebabCase(name).replace(/\-/g, '_'),
    ).replace(/\s/g, '_');
    this.create(relativePath, kebebCaseName, `${fileNameWithoutExt}.ts`).file(
      `
import { Taon } from 'taon/src';

export interface I${fileNameWithoutExt} {
  id?: number;
  exampleProperty?: string;
}

@Taon.Entity<${fileNameWithoutExt}>({
  className: '${fileNameWithoutExt}',
  mapping: {

  }
})
export class ${fileNameWithoutExt} extends Taon.Base.Entity<${fileNameWithoutExt}, I${fileNameWithoutExt}> implements I${fileNameWithoutExt} {

  //#region @backend
  @Taon.Orm.Column.Generated()
  //#endregion
  id: number

  //#region @backend
  @Taon.Orm.Column.Custom()
  //#endregion
  exampleProperty: string

}
`,
    );
  }

  private createController(relativePath: string, name: string) {
    const camelCaseUpperFirst = _.upperFirst(_.camelCase(name));
    const kebebCaseName = _.kebabCase(name);
    const fileNameWithoutExt = _.upperCase(
      _.kebabCase(name).replace(/\-/g, '_'),
    ).replace(/\s/g, '_');
    const NameController = `${camelCaseUpperFirst}Controller`;
    this.create(relativePath, kebebCaseName, `${NameController}.ts`).file(
      `
import { Taon } from 'morphi/src';
import { ${fileNameWithoutExt} } from './${fileNameWithoutExt}';

@Taon.Controller({
  className: '${NameController}',
  entity: ${fileNameWithoutExt},
  //#region @backend
  // auth: () => {
  //   return authenticate('bearer', { session: false });
  // }
  //#endregion
})
export class ${NameController} extends Taon.Base.Controller<${fileNameWithoutExt}> {

  //#region @backend
  async initExampleDbData() {

  }
  //#endregion

}
`,
    );
  }
}
