import * as fse from 'fs-extra';
import * as path from 'path';
import * as _ from 'lodash';
import chalk from 'chalk';
import * as json5 from 'json5';

import { Project } from './project';
import { Helpers } from 'tnp-helpers';
import { Morphi } from 'morphi';
import { Models } from 'tnp-models';
import { config } from '../../../config';

export abstract class VscodeProject {

  //#region @backend
  public recreateCodeWorkspace(this: Project) {
    if (!this.isWorkspace) {
      return;
    }
    const configSettings = {};

    try {
      const settings = json5.parse(Helpers.readFile(path.join(this.location, '.vscode', 'settings.json')));
      // console.log(settings)
      Object.keys(settings)
        .filter(key => {
          const start = key.startsWith('workbench');
          // console.log(`${key} ${start}`)
          return start;
        })
        .forEach(key => {
          configSettings[key] = settings[key];
        });
    } catch (err) {
      // console.log(err)
    }

    const bundledChildrensFolder = path.join(this.location, config.folder.bundle);
    if (!fse.existsSync(bundledChildrensFolder)) {
      Helpers.mkdirp(bundledChildrensFolder);
    }
    configSettings['terminal.integrated.cwd'] = '.';

    const codeWorkspace = {
      folders: [
        { path: '.' },
        ...this.children
          .map(c => {
            return { path: c.name }
          }),
        { path: 'bundle' },
        { path: 'dist' }
      ],
      settings: configSettings
    };
    fse.writeJSONSync(path.join(this.location,
      this.nameOfCodeWorkspace), codeWorkspace, {
      encoding: 'utf8',
      spaces: 2
    });

  }

  get nameOfCodeWorkspace(this: Project) {
    return `tmp.code-workspace`;
  }

  openInVscode(this: Project) {
    this.recreateCodeWorkspace()
    if (this.isStandaloneProject || this.isUnknowNpmProject) {
      this.run(`code ${this.location}`).sync()
    } else {
      const isomorphicServers: Project[] = this.children.filter(c => c.typeIs('isomorphic-lib'));
      this.run(`code ${this.location}/${this.nameOfCodeWorkspace}`).sync();
      isomorphicServers.forEach(s => {
        s.run(`code ${s.location}`).sync()
      });
    }
  }

  temlateOfLaunchJSON(this: Project, currentWorkspaceConfig: Models.env.EnvConfig) {
    let configurations = [];

    const startServerTemplate = {
      "type": "node",
      "request": "launch",
      "name": "Launch Server",
      "program": "${workspaceFolder}/run.js",
      "cwd": void 0,
      "args": [],
      "runtimeArgs": [
        "--experimental-worker"
      ]
    };

    const templateFor = (serverChild: Project, clientProject: Project) => {
      const t = _.cloneDeep(startServerTemplate);
      if (serverChild.name !== clientProject.name) {
        const cwd = '${workspaceFolder}' + `/../${serverChild.name}`;
        t.program = cwd + '/run.js';
        t.cwd = cwd;
      }
      t.args.push(`--ENVoverride=${encodeURIComponent(JSON.stringify({
        clientProjectName: clientProject.name
      } as Models.env.EnvConfig, null, 4))}`);
      return t;
    };

    if (this.typeIs('angular-lib')) {
      const servePort = getPort(this, currentWorkspaceConfig);
      configurations = [{
        "name": "ng serve",
        "type": "chrome",
        "request": "launch",
        // "userDataDir": false,
        "preLaunchTask": "ngserve",
        "postDebugTask": "terminateall",
        "sourceMaps": true,
        "url": `http://localhost:${!isNaN(servePort) ? servePort : 4200}/#`,
        "webRoot": "${workspaceFolder}",
        "sourceMapPathOverrides": {
          "webpack:/*": "${webRoot}/*",
          "/./*": "${webRoot}/*",
          "/tmp-src/*": "${webRoot}/*",
          "/*": "*",
          "/./~/*": "${webRoot}/node_modules/*"
        }
      }];

      if (this.isWorkspaceChildProject) {

        this.parent.children
          .filter(c => c.typeIs('isomorphic-lib'))
          .forEach(c => {
            configurations.push(templateFor(c, this));
          })

      }

    }
    if (this.typeIs('isomorphic-lib')) {
      configurations = [
        {
          "type": "node",
          "request": "attach",
          "name": "Attach to global cli tool",
          "port": 9229,
          "skipFiles": [
            "<node_internals>/**"
          ]
        },
        templateFor(this, this)
        // {
        //   "type": "node",
        //   "request": "launch",
        //   "remoteRoot": "${workspaceRoot}",
        //   "localRoot": "${workspaceRoot}",
        //   "name": "Launch Nodemon server",
        //   "runtimeExecutable": "nodemon",
        //   "program": "${workspaceFolder}/run.js",
        //   "restart": true,
        //   "sourceMaps": true,
        //   "console": "internalConsole",
        //   "internalConsoleOptions": "neverOpen",
        //   "runtimeArgs": [
        //     "--experimental-worker"
        //   ]
        // },
      ]

    }
    return JSON.stringify(configurations);
  }
  // export interface VscodeProject extends Partial<Project> { }
}

function getPort(project: Project, workspaceConfig: Models.env.EnvConfig) {
  let env: Models.env.EnvConfigProject;
  if (project.isWorkspace) {
    env = workspaceConfig.workspace?.workspace;
  } else {
    env = workspaceConfig.workspace?.projects?.find(p => p.name === project.name);
  }
  const envPort = env?.port;
  return _.isNumber(envPort) ? envPort : project.getDefaultPort();
}
