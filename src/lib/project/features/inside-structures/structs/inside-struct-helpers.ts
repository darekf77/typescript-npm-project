import { config } from 'tnp-config';

import {
  _,
  //#region @backend
  crossPlatformPath, path
  //#endregion
} from 'tnp-core';

import { Helpers } from 'tnp-helpers';
import type { Project } from '../../../abstract/project/project';

export function recreateApp(project: Project) {
  //#region @backend
  //#region when app.ts or app is not available is not
  (() => {
    const appFile = crossPlatformPath(path.join(
      project.location,
      config.folder.src,
      'app.ts'
    ));

    const appFolder = crossPlatformPath(path.join(
      project.location,
      config.folder.src,
      'app'
    ));

    if (!Helpers.exists(appFile) && !Helpers.exists(appFolder)) {
      const componentName = `${_.upperFirst(_.camelCase(project.name))}Component`;
      const moduleName = `${_.upperFirst(_.camelCase(project.name))}Module`;

      Helpers.writeFile(appFile, `

//#region @notForNpm
//#region @browser
import { NgModule } from '@angular/core';
import { Component, OnInit } from '@angular/core';

@Component({
selector: 'app-${project.name}',
template: 'hello from ${project.name}'
})
export class ${componentName} implements OnInit {
constructor() { }

ngOnInit() { }
}

@NgModule({
imports: [],
exports: [${componentName}],
declarations: [${componentName}],
providers: [],
})
export class ${moduleName} { }
//#endregion

//#region @backend
async function start(port: number)  {

}

export default start;

//#endregion

//#endregion



      `.trim());
    }



  })();
  //#endregion
  //#endregion
}