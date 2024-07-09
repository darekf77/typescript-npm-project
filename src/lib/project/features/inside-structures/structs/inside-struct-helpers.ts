import { config } from 'tnp-config/src';

import {
  _,
  //#region @backend
  crossPlatformPath,
  path,
  //#endregion
} from 'tnp-core/src';

import { Helpers } from 'tnp-helpers/src';
import { EXPORT_TEMPLATE } from '../../../../templates';
import { Project } from '../../../abstract/project';
import { DEFAULT_PORT, PortUtils } from '../../../../constants';

export function resolveBrowserPathToAssetFrom(
  projectTargetOrStandalone: Project,
  absolutePath: string,
) {
  let resultBrowserPath = '';
  if (projectTargetOrStandalone.__isSmartContainerTarget) {
    // `tmp-src-${outFolder}${websql ? '-websql' : ''}/assets/assets-for/${project.name + '--' + project.parent.name}/`
    const relatievPath = absolutePath.replace(
      `${projectTargetOrStandalone?.__smartContainerTargetParentContainer.location}/`,
      '',
    );
    const smartContainerTargetChild = _.first(relatievPath.split('/'));
    resultBrowserPath = `/${relatievPath.split('/').slice(1).join('/')}`;
    resultBrowserPath = resultBrowserPath.replace(
      `/${config.folder.src}/${config.folder.assets}/`,
      `/${config.folder.assets}/${config.folder.assets}-for/${projectTargetOrStandalone.__smartContainerTargetParentContainer.name + '--' + smartContainerTargetChild}/`,
    );
  } else {
    // `tmp-src-${outFolder}${websql ? '-websql' : ''}/assets/assets-for/${project.name}/`
    const relatievPath = absolutePath.replace(
      `${crossPlatformPath(projectTargetOrStandalone.location)}/`,
      '',
    );
    resultBrowserPath = `/${relatievPath}`;
    resultBrowserPath = resultBrowserPath.replace(
      `/${config.folder.src}/${config.folder.assets}/`,
      `/${config.folder.assets}/${config.folder.assets}-for/${projectTargetOrStandalone.name}/`,
    );
  }

  return resultBrowserPath;
}

/**
 * return ex.
 * my-path-to/asdasd
 * test
 */
export function resolvePathToAsset(
  project: Project,
  relativePathToLoader: string,
) {
  const loaderRelativePath = relativePathToLoader
    .replace(/^\.\//, '')
    .replace(/^\//, '');
  let absPathToAsset = '';
  let browserPath = '';

  if (project.__isSmartContainerTarget) {
    // stratego for smart container target project
    absPathToAsset = crossPlatformPath([
      project.__smartContainerTargetParentContainer.location,
      loaderRelativePath,
    ]);
    if (!Helpers.exists(absPathToAsset)) {
      absPathToAsset = absPathToAsset.replace(
        loaderRelativePath,
        `${project.name}/${loaderRelativePath}`,
      );
    }
  } else {
    // stratego for normal standalone project
    absPathToAsset = crossPlatformPath([project.location, loaderRelativePath]);
    if (!Helpers.exists(absPathToAsset)) {
      absPathToAsset = absPathToAsset.replace(
        `${project.name}/${loaderRelativePath}`,
        loaderRelativePath,
      );
    }
  }
  browserPath = resolveBrowserPathToAssetFrom(project, absPathToAsset);

  return browserPath;
}

export function recreateIndex(project: Project) {
  (() => {
    const indexInSrcFile = crossPlatformPath(
      path.join(project.location, config.folder.src, config.file.index_ts),
    );

    if (project.__isSmartContainerTarget) {
      const container = project.__smartContainerTargetParentContainer;
      if (!Helpers.exists(indexInSrcFile)) {
        const exportsContainer = container.children
          .filter(
            c =>
              c.typeIs('isomorphic-lib') && c.__frameworkVersionAtLeast('v3'),
          )
          .map(c => {
            return `export * from './libs/${c.name}';`;
          })
          .join('\n');
        Helpers.writeFile(
          indexInSrcFile,
          `
${exportsContainer}
        `,
        );
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
  // console.log('TRYING ', project.location)

  if (project.__isSmartContainerTarget) {
    project = project.__smartContainerTargetParentContainer?.children.find(
      c => c.name === project.name,
    );
    if (!project) {
      return;
    }
  }
  // console.log('RECREAT TO ', project.location)

  const appFile = crossPlatformPath(
    path.join(project.location, config.folder.src, 'app.ts'),
  );

  const appElectornFile = crossPlatformPath(
    path.join(project.location, config.folder.src, 'app.electron.ts'),
  );

  const appHostsFile = crossPlatformPath(
    path.join(project.location, config.folder.src, 'app.hosts.ts'),
  );

  const appFolderWithIndex = crossPlatformPath(
    path.join(project.location, config.folder.src, 'app', 'index.ts'),
  );

  if (
    !Helpers.exists(appFile)
    // && !Helpers.exists(appFolderWithIndex)
  ) {
    Helpers.writeFile(appFile, appfileTemplate(project));
  }

  if (
    !Helpers.exists(appHostsFile)
    // && !Helpers.exists(appFolderWithIndex) // TODO @QUESTION why not to remove this
  ) {
    project.writePortsToFile();
  }

  if (
    !Helpers.exists(appElectornFile)
    // && !Helpers.exists(appFolderWithIndex) // TODO @QUESTION why not to remove this
  ) {
    Helpers.writeFile(appElectornFile, appElectronTemplate(project));
  }

  //#endregion
  //#endregion
}

export function appfileTemplate(project: Project) {
  const componentName = `${_.upperFirst(_.camelCase(project.name))}Component`;
  const moduleName = `${_.upperFirst(_.camelCase(project.name))}Module`;

  // TODO quick fix for @ browser remover
  return `
${'//#reg' + 'ion'} imports
import { Firedev, BaseContext } from 'firedev/src';
import { Observable, map } from 'rxjs';
import { HOST_BACKEND_PORT } from './app.hosts';
${'//#reg' + 'ion'} @${'bro' + 'wser'}
import { NgModule, inject, Injectable } from '@angular/core';
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
${'//#end' + 'region'}
${'//#end' + 'region'}

console.log('hello world');
console.log('Your server will start on port '+ HOST_BACKEND_PORT);
const host = 'http://localhost:' + HOST_BACKEND_PORT;

${'//#reg' + 'ion'} ${project.name} component
${'//#reg' + 'ion'} @${'bro' + 'wser'}
@Component({
  selector: 'app-${project.name}',
  template: \`hello from ${project.name}<br>
    <br>
    users from backend
    <ul>
      <li *ngFor="let user of (users$ | async)"> {{ user | json }} </li>
    </ul>
  \`,
  styles: [\` body { margin: 0px !important; } \`],
})
export class ${componentName} {
  userApiService = inject(UserApiService);
  readonly users$: Observable<User[]> = this.userApiService.getAll();
}
${'//#end' + 'region'}
${'//#end' + 'region'}

${'//#reg' + 'ion'}  ${project.name} api service
${'//#reg' + 'ion'} @${'bro' + 'wser'}
@Injectable({
  providedIn:'root'
})
export class UserApiService {
  userControlller = Firedev.inject(()=> MainContext.getClass(UserController))
  getAll() {
    return this.userControlller.getAll()
      .received
      .observable
      .pipe(map(r => r.body.json));
  }
}
${'//#end' + 'region'}
${'//#end' + 'region'}

${'//#reg' + 'ion'}  ${project.name} module
${'//#reg' + 'ion'} @${'bro' + 'wser'}
@NgModule({
  exports: [${componentName}],
  imports: [CommonModule],
  declarations: [${componentName}],
})
export class ${moduleName} { }
${'//#end' + 'region'}
${'//#end' + 'region'}

${'//#reg' + 'ion'}  ${project.name} entity
@Firedev.Entity({ className: 'User' })
class User extends Firedev.Base.AbstractEntity {
  public static ctrl?: UserController;
  ${'//#reg' + 'ion'} @${'web' + 'sql'}
  @Firedev.Orm.Column.String()
  ${'//#end' + 'region'}
  name?: string;
}
${'//#end' + 'region'}

${'//#reg' + 'ion'}  ${project.name} controller
@Firedev.Controller({ className: 'UserController' })
class UserController extends Firedev.Base.CrudController<User> {
  entityClassResolveFn = ()=> User;
  ${'//#reg' + 'ion'} @${'web' + 'sql'}
  async initExampleDbData(): Promise<void> {
    const superAdmin = new User();
    superAdmin.name = 'super-admin';
    await this.db.save(superAdmin);
  }
  ${'//#end' + 'region'}
}
${'//#end' + 'region'}

${'//#reg' + 'ion'}  ${project.name} context
const MainContext = Firedev.createContext(()=>({
  host,
  contextName: 'MainContext',
  contexts:{ BaseContext },
  controllers: {
    UserController,
    // PUT FIREDEV CONTORLLERS HERE
  },
  entities: {
    User,
    // PUT FIREDEV ENTITIES HERE
  },
  database: true,
  // disabledRealtime: true,
}));
${'//#end' + 'region'}

async function start() {

  await MainContext.initialize();

  if (Firedev.isBrowser) {
    const users = (await MainContext.getClassInstance(UserController).getAll().received)
      .body?.json;
    console.log({
      'users from backend': users,
    });
  }
}

export default start;






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
import start from './app';

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
  width: size.width * (3/4),
  height: size.height * (3/4),
  webPreferences: {
    nodeIntegration: true,
    allowRunningInsecureContent: (serve),
    contextIsolation: false,
  },
});

if (serve) {
  const debug = require('electron-debug');
  debug();
  win.webContents.openDevTools();

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
  await start();
  try {
    // This method will be called when Electron has finished
    // initialization and is ready to create browser windows.
    // Some APIs can only be used after this event occurs.
    // Added 400 ms to fix the black background issue while using transparent window. More detais at https://github.com/electron/electron/issues/15947
    // app.on('ready', () => setTimeout(createWindow, 400));
    setTimeout(createWindow, 400)

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
    throw e;
  }
}

startElectron();
${'//#end' + 'region'}  `;
}
