import { config } from 'tnp-config';

import {
  _,
  //#region @backend
  crossPlatformPath, path
  //#endregion
} from 'tnp-core';

import { Helpers } from 'tnp-helpers';
import { EXPORT_TEMPLATE } from '../../../../templates';
import { Project } from '../../../abstract/project/project';

export function recreateIndex(project: Project) {
  (() => {
    const indexInSrcFile = crossPlatformPath(path.join(
      project.location,
      config.folder.src,
      config.file.index_ts,
    ));

    if (project.isSmartContainerTarget) {
      const container = project.smartContainerTargetParentContainer;
      if (!Helpers.exists(indexInSrcFile)) {
        const exportsContainer = container.children
          .filter(c => c.typeIs('isomorphic-lib') && c.frameworkVersionAtLeast('v3'))
          .map(c => {
            return `export * from './libs/${c.name}';`
          }).join('\n');
        Helpers.writeFile(indexInSrcFile, `
${exportsContainer}
        `);
      }

    } else {
      if (!Helpers.exists(indexInSrcFile)) {
        Helpers.writeFile(indexInSrcFile, EXPORT_TEMPLATE('lib'));
      }
    }

  })();
}

export function recreateApp(project: Project) {
  //#region @backend
  //#region when app.ts or app is not available is not

  const appFile = crossPlatformPath(path.join(
    project.location,
    config.folder.src,
    'app.ts'
  ));

  const appFolderWithIndex = crossPlatformPath(path.join(
    project.location,
    config.folder.src,
    'app',
    'index.ts',
  ));

  project.quickFixes.removeAppFolder();

  if (!Helpers.exists(appFile) && !Helpers.exists(appFolderWithIndex)) {

    const componentName = `${_.upperFirst(_.camelCase(project.name))}Component`;
    const moduleName = `${_.upperFirst(_.camelCase(project.name))}Module`;

    // TODO quick fix for @ browser remover
    Helpers.writeFile(appFile, `

${'//#reg' + 'ion'} ${'@not' + 'ForNpm'}

${'//#reg' + 'ion'} @${'bro' + 'wser'}
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

    //${'#reg' + 'ion'} ${'@bac' + 'kend'}
    async function start(port: number) {
      console.log('hello world from backend');
    }

    export default start;

${'//#end' + 'region'}

${'//#end' + 'region'}



    `.trim());
  }



  //#endregion
  //#endregion
}
