import * as _ from 'lodash';
import { BaseFiredevFileTemplate } from './base-firedev-file-template.backend';
import { FileTmpForSave } from './file-tmp-for-save.backend';


export class FiredevLogicUiModuleTemplate extends BaseFiredevFileTemplate {

  get entity() {
    return new FileTmpForSave(`
    ${this.baseImports}
import { ${this.FramweorkName}, ModelDataConfig } from '${_.kebabCase(this.FramweorkName)}';
import { I${this.ENTITYName} } from 'I${this.ENTITYName}';

@${this.FramweorkName}.Entity<${this.ENTITYName}>({
  className: '${this.ENTITYName}',
  mapping: { },
  defaultModelValues: { },
  additionalMapping: { },
  //#region @backend
  browserTransformFn: (entity) => {
    // transform entity
    return entity;
  }
  //#endregion
})
export class ${this.ENTITYName}<PARAMS = any> extends Morphi.Base.Entity<${
      this.ENTITYName}, I${this.ENTITYName}, I${this.ControllerName}> {

  //#region @backend
  @${this.FramweorkName}.Orm.Column.Generated()
  //#endregion
  id: number = undefined;

  public browser: I${this.ENTITYName} = {} as any;

}
`, this.location, `${this.ModuleName.toUpperCase()}.ts`);
  }


  get entityInterface() {
    return new FileTmpForSave(`
import { ${this.ENTITYName} } from '${this.ENTITYName}';
export interface I${this.ENTITYName} extends ${this.ENTITYName} {

}
    `, this.location, `I${this.ENTITYName}.ts`)
  }



  get controller() {
    return new FileTmpForSave(`
//#region @backend
import { authenticate } from 'passport'
//#endregion
import { I${this.ControllerName} } from 'I${this.ControllerName}';

@Morphi.Controller({
  className: '${this.ControllerName}',
  entity: entities.${this.ENTITYName},
  //#region @backend
  // auth: () => {
  //   return authenticate('bearer', { session: false });
  // }
  //#endregion
})
export class ${this.ControllerName} extends ${this.FramweorkName}.Base.Controller<entities.${this.ENTITYName}> {

  @${this.FramweorkName}.Http.GET()
  helloWorld(): ${this.FramweorkName}.Response<any> {
    //#region @backendFunc
    return async ()=> {
      return 'hello world';
    }
    //#endregion
  }

}
    `, this.location, `${this.ControllerName}.ts`);
  }

  get controllerInterface() {
    return new FileTmpForSave(`
import { ${this.ControllerName} } from '${this.ControllerName}';
export interface I${this.ControllerName} extends ${this.ControllerName} {

}
    `, this.location, `I${this.ControllerName}.ts`)
  }




  files() {
    return [
      this.entity,
      this.entityInterface,
      this.controller,
      this.controllerInterface,
    ];

  }


}
