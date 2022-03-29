import { config } from 'tnp-config';

import {
  _,
  //#region @backend
  crossPlatformPath, path
  //#endregion
} from 'tnp-core';

import { Helpers } from 'tnp-helpers';
import { Project } from '../../../abstract/project/project';

export function recreateIndex(project: Project) {
  (() => {
    const indexInSrcFile = crossPlatformPath(path.join(
      project.location,
      config.folder.src,
      'index.ts'
    ));

    if (project.isSmartContainerTarget) {
      const container = Project.From(project.smartContainerTargetParentContainerPath) as Project;
      if (!Helpers.exists(indexInSrcFile)) {
        const exportsContainer = container.children.map(c => {
          return `export * from './libs/${c.name}';`
        }).join('\n');
        Helpers.writeFile(indexInSrcFile, `
${exportsContainer}
        `);
      }

    } else {
      if (!Helpers.exists(indexInSrcFile)) {
        Helpers.writeFile(indexInSrcFile, `export * from './lib';
        `);
      }
    }

  })();
}

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

      // TODO quick fix for @ browser remover
      Helpers.writeFile(appFile, `

${'//#region'} @notForNpm
${'//#region'} @${'bro' + 'wser'}
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
    async function start(port: number) {

    }

    export default start;

${'//#endregion'}

${'//#endregion'}



    `.trim());
    }



  })();
  //#endregion
  //#endregion
}
