import { config } from 'tnp-config';

import {
  _,
  //#region @backend
  crossPlatformPath, path
  //#endregion
} from 'tnp-core';

import { Helpers } from 'tnp-helpers';
import { Models } from 'tnp-models';
import { EXPORT_TEMPLATE } from '../../../../templates';
import { Project } from '../../../abstract/project/project';

export function resolveBrowserPathToAssetFrom(projectTargetOrStandalone: Project, absolutePath: string, outFolder: Models.dev.BuildDir, websql: boolean) {
  let resultBrowserPath = '';
  if (projectTargetOrStandalone.isSmartContainerTarget) {
    // `tmp-src-${outFolder}${websql ? '-websql' : ''}/assets/assets-for/${projectTargetOrStandalone.name + '--' + projectTargetOrStandalone.parent.name}/`
    const relatievPath = absolutePath.replace(
      `${projectTargetOrStandalone?.smartContainerTargetParentContainer.location}/`,
      ''
    );
    const client = _.first(relatievPath.split('/'));
    resultBrowserPath = `/${relatievPath.split('/').slice(1).join('/')}`;
    resultBrowserPath = resultBrowserPath.replace(
      `/${config.folder.src}/${config.folder.assets}/`,
      `/${config.folder.assets}/${config.folder.assets}-for/${projectTargetOrStandalone.smartContainerTargetParentContainer.name + '--' + client}/`,
    );
  } else {
    // `tmp-src-${outFolder}${websql ? '-websql' : ''}/assets/assets-for/${projectTargetOrStandalone.name}/`
    const relatievPath = absolutePath.replace(
      `${crossPlatformPath(projectTargetOrStandalone.location)}/`,
      ''
    );
    resultBrowserPath = `/${relatievPath}`;
    resultBrowserPath = resultBrowserPath.replace(
      `/${config.folder.src}/${config.folder.assets}/`,
      `/${config.folder.assets}/${config.folder.assets}-for/${projectTargetOrStandalone.name}/`
    );
  }

  return resultBrowserPath;
}

export function resolvePathToAsset(projectTargetOrStandalone: Project, relativePath: string, outFolder: Models.dev.BuildDir, websql: boolean) {
  const loaderRelativePath = relativePath.replace(/^\.\//, '').replace(/^\//, '');
  let absPathToAsset = '';
  let browserPath = ''

  if (projectTargetOrStandalone.isSmartContainerTarget) { // stratego for smart container target project
    absPathToAsset = crossPlatformPath([projectTargetOrStandalone.smartContainerTargetParentContainer.location, loaderRelativePath]);
    if (!Helpers.exists(absPathToAsset)) {
      absPathToAsset = absPathToAsset.replace(
        loaderRelativePath,
        `${projectTargetOrStandalone.name}/${loaderRelativePath}`
      )
    }
  } else { // stratego for normal standalone project
    absPathToAsset = crossPlatformPath([projectTargetOrStandalone.location, loaderRelativePath]);
    if (!Helpers.exists(absPathToAsset)) {
      absPathToAsset = absPathToAsset.replace(
        `${projectTargetOrStandalone.name}/${loaderRelativePath}`,
        loaderRelativePath,
      )
    }
  }
  browserPath = resolveBrowserPathToAssetFrom(projectTargetOrStandalone, absPathToAsset, outFolder, websql);

  // console.log({
  //   pathToAsset: absPathToAsset,
  //   browserPath,
  // })
  return browserPath;
}

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
  template: 'hello from ${project.name}',
  styles: [\` body { margin: 0px !important; } \`],
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


async function start(port: number) {
  console.log('hello world from backend');
}

export default start;



${'//#end' + 'region'}



    `.trim());
  }



  //#endregion
  //#endregion
}
