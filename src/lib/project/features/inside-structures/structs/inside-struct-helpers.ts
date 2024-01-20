import { config } from 'tnp-config/src';

import {
  _,
  //#region @backend
  crossPlatformPath, path
  //#endregion
} from 'tnp-core/src';

import { Helpers } from 'tnp-helpers/src';
import { Models } from 'tnp-models/src';
import { EXPORT_TEMPLATE } from '../../../../templates';
import { Project } from '../../../abstract/project/project';
import { DEFAULT_PORT, PortUtils } from '../../../../constants';

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

  if (project.isSmartContainerTarget) {
    return;
  }

  const appFile = crossPlatformPath(path.join(
    project.location,
    config.folder.src,
    'app.ts'
  ));

  const appElectornFile = crossPlatformPath(path.join(
    project.location,
    config.folder.src,
    'app.electron.ts'
  ));

  const appHostsFile = crossPlatformPath(path.join(
    project.location,
    config.folder.src,
    'app.hosts.ts'
  ));

  const appFolderWithIndex = crossPlatformPath(path.join(
    project.location,
    config.folder.src,
    'app',
    'index.ts',
  ));

  if (!Helpers.exists(appFile) && !Helpers.exists(appFolderWithIndex)) {
    Helpers.writeFile(appHostsFile, PortUtils(DEFAULT_PORT.SERVER_LOCALHOST).appHostTemplateFor(
      DEFAULT_PORT.SERVER_LOCALHOST + 400, project));
  }

  if (!Helpers.exists(appFile) && !Helpers.exists(appFolderWithIndex)) {
    Helpers.writeFile(appFile, appfileTemplate(project))
  }

  if (!Helpers.exists(appElectornFile)
    // && !Helpers.exists(appFolderWithIndex) // TODO @LAST why not to remove this
  ) {
    Helpers.writeFile(appElectornFile, appElectronTemplate(project))
  }



  //#endregion
  //#endregion
}


export function appfileTemplate(project: Project) {

  const componentName = `${_.upperFirst(_.camelCase(project.name))}Component`;
  const moduleName = `${_.upperFirst(_.camelCase(project.name))}Module`;

  // TODO quick fix for @ browser remover
  return `

${'//#reg' + 'ion'} ${'@not' + 'ForNpm'}
import { HOST_BACKEND_PORT } from './app.hosts';
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


async function start() {
console.log('hello world');
console.log('Please start your server on port: '+ HOST_BACKEND_PORT);
}

export default start;



${'//#end' + 'region'}



`.trim();
}


export function appElectronTemplate(project: Project) {
  return `
import { CLIENT_DEV_NORMAL_APP_PORT, CLIENT_DEV_WEBSQL_APP_PORT } from './app.hosts';
import {
path,
${'//#reg' + 'ion'} @${'back' + 'end'}
fse
${'//#end' + 'region'}
} from 'tnp-core';
${'//#reg' + 'ion'} @${'back' + 'end'}
import { app, BrowserWindow, screen } from 'electron';

let win: BrowserWindow | null = null;
const args = process.argv.slice(1);
const serve = args.some(val => val === '--serve');
const websql = args.some(val => val === '--websql');

function createWindow(): BrowserWindow {

const size = screen.getPrimaryDisplay().workAreaSize;

// Create the browser window.
win = new BrowserWindow({
  x: 0,
  y: 0,
  autoHideMenuBar: true,
  width: size.width / 2,
  height: size.height / 2,
  webPreferences: {
    nodeIntegration: true,
    allowRunningInsecureContent: (serve),
    contextIsolation: false,
  },
});

if (serve) {
  const debug = require('electron-debug');
  debug();

  require('electron-reloader')(module);
  win.loadURL('http://localhost:' + (websql ? CLIENT_DEV_WEBSQL_APP_PORT : CLIENT_DEV_NORMAL_APP_PORT));
} else {
  // Path when running electron executable
  let pathIndex = './index.html';

  if (fse.existsSync(path.join(__dirname, '../dist/index.html'))) {
    // Path when running electron in local folder
    pathIndex = '../dist/index.html';
  }

  const url = new URL(path.join('file:', __dirname, pathIndex));
  win.loadURL(url.href);
}

// Emitted when the window is closed.
win.on('closed', () => {
  // Dereference the window object, usually you would store window
  // in an array if your app supports multi windows, this is the time
  // when you should delete the corresponding element.
  win = null;
});

return win;
}

async function startElectron() {
try {
  // This method will be called when Electron has finished
  // initialization and is ready to create browser windows.
  // Some APIs can only be used after this event occurs.
  // Added 400 ms to fix the black background issue while using transparent window. More detais at https://github.com/electron/electron/issues/15947
  app.on('ready', () => setTimeout(createWindow, 400));

  // Quit when all windows are closed.
  app.on('window-all-closed', () => {
    // On OS X it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });

  app.on('activate', () => {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (win === null) {
      createWindow();
    }
  });

} catch (e) {
  // Catch Error
  // throw e;
}
}

export default startElectron;
${'//#end' + 'region'}  `
}
