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

  get vscodeFileTemplates(this: Project) {
    return [
      '.vscode/launch.json.filetemplate',
      '.vscode/tasks.json.filetemplate',
    ]
  }

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

  temlateOfTasksJSON(this: Project, currentWorkspaceConfig: Models.env.EnvConfig) {
    let tasks = [];
    let inputs = [{
      "id": "terminate",
      "type": "command",
      "command": "workbench.action.tasks.terminate",
      "args": "terminateAll"
    }];

    const terminate = {
      "label": "terminateall",
      "command": "echo ${input:terminate}",
      "type": "shell",
      "problemMatcher": []
    };

    const ngServeTask = {
      "label": "ngserve",
      "type": "shell",
      "command": "tnp baw",
      "isBackground": true,
      "presentation": {
        "reveal": "always"
      },
      "group": {
        "kind": "build",
        "isDefault": true
      },
      "problemMatcher": {
        "owner": "typescript",
        "source": "ts",
        "applyTo": "closedDocuments",
        "fileLocation": [
          "relative",
          "${cwd}"
        ],
        "pattern": "$tsc",
        "background": {
          "activeOnStart": true,
          "beginsPattern": {
            "regexp": "(.*?)"
          },
          "endsPattern": {
            "regexp": "Compiled |Failed to compile."
          }
        }
      }
    };

    tasks.push(terminate);

    if (this.typeIs('angular-lib')) {
      tasks.push(ngServeTask);
    }

    // {
    //   "label": "postdebugkill",
    //   "command": [
    //     "${command:workbench.action.tasks.terminate}",
    //     "${command:workbench.action.acceptSelectedQuickOpenItem}"
    //   ],
    //   "type": "process"
    // },

    return JSON.stringify({
      "version": "2.0.0",
      tasks,
      inputs
    })
  }


  temlateOfLaunchJSON(this: Project, currentWorkspaceConfig: Models.env.EnvConfig) {
    let configurations = [];



    const templateFor = (serverChild: Project, clientProject: Project) => {
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
      if (serverChild.name !== clientProject.name) {
        const cwd = '${workspaceFolder}' + `/../${serverChild.name}`;
        startServerTemplate.program = cwd + '/run.js';
        startServerTemplate.cwd = cwd;
        startServerTemplate.name = startServerTemplate.name + ` for ${clientProject.name}`
      }
      startServerTemplate.args.push(`--ENVoverride=${encodeURIComponent(JSON.stringify({
        clientProjectName: clientProject.name
      } as Models.env.EnvConfig, null, 4))}`);
      return startServerTemplate;
    };

    function startNgServeTemplate(servePort: number, workspaceChild?: Project) {
      const result = {
        "name": "ng serve",
        "type": "chrome",
        "request": "launch",
        cwd: void 0,
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
      }
      if (workspaceChild) {
        result.cwd = "${workspaceFolder}" + `/${workspaceChild.name}`;
        result.webRoot = "${workspaceFolder}" + `/${workspaceChild.name}`;
        result.name = `${result.name} for ${workspaceChild.name}`
      }
      return result;
    };

    if (this.isWorkspace) {
      configurations = this.children
        .filter(c => c.typeIs('angular-lib'))
        .map(c => {
          const servePort = getPort(c, currentWorkspaceConfig);
          return startNgServeTemplate(servePort, c);
        })
    } else {
      if (this.typeIs('angular-lib')) {
        const servePort = getPort(this, currentWorkspaceConfig);
        configurations = [
          startNgServeTemplate(servePort)
        ];

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

        if (this.isWorkspaceChildProject) {

          this.parent.children
            .filter(c => c.typeIs('angular-lib'))
            .forEach(c => {
              configurations.push(templateFor(this, c));
            })

        }
      }

    }
    return JSON.stringify({
      version: "0.2.0",
      configurations
    });
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
