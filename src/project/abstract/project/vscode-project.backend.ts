//#region imports
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
//#endregion

export abstract class VscodeProject {

  //#region vscode *.filetemplae
  get vscodeFileTemplates(this: Project) {
    return [
      '.vscode/launch.json.filetemplate',
      '.vscode/tasks.json.filetemplate',
    ]
  }
  //#endregion

  //#region @backend
  public recreateCodeWorkspace(this: Project) {
    //#region  recreate tmp.code-workspace
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
    configSettings['terminal.integrated.cwd'] = '${workspaceFolder}';

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
      settings: configSettings,
      // tasks: JSON.parse(this.temlateOfTasksJSON(this.env.config)),
      // launch: JSON.parse(this.temlateOfLaunchJSON(this.env.config))
    };
    const codeworkspacefilepath = path.join(this.location, this.nameOfCodeWorkspace);
    Helpers.removeFileIfExists(codeworkspacefilepath)
    // fse.writeJSONSync(codeworkspacefilepath, codeWorkspace, {
    //   encoding: 'utf8',
    //   spaces: 2
    // });
    //#endregion
  }

  private get nameOfCodeWorkspace(this: Project) {
    return `tmp.code-workspace`;
  }

  openInVscode(this: Project) {
    //#region open in vscode
    this.recreateCodeWorkspace()
    if (this.isStandaloneProject || this.isUnknowNpmProject) {
      this.run(`code ${this.location}`).sync()
    } else {
      const isomorphicServers: Project[] = this.children.filter(c => c.typeIs('isomorphic-lib'));
      // this.run(`code ${this.location}/${this.nameOfCodeWorkspace}`).sync();
      this.run(`code ${this.location}`).sync();
      isomorphicServers.forEach(s => {
        s.run(`code ${s.location}`).sync()
      });
    }
    //#endregion
  }

  temlateOfTasksJSON(this: Project, currentWorkspaceConfig: Models.env.EnvConfig) {
    let tasks = [];
    let inputs = [];

    //#region post debug kill task (not working now)
    // {
    //   "label": "postdebugkill",
    //   "command": [
    //     "${command:workbench.action.tasks.terminate}",
    //     "${command:workbench.action.acceptSelectedQuickOpenItem}"
    //   ],
    //   "type": "process"
    // },
    //#endregion

    //#region tasks, input for terminating all tasks
    const templateTerminalAllTasks = {
      "id": "terminate",
      "type": "command",
      "command": "workbench.action.tasks.terminate",
      "args": "terminateAll"
    };
    inputs.push(templateTerminalAllTasks);

    const terminate = {
      "label": "terminateall",
      "command": "echo ${input:terminate}",
      "type": "shell",
      "problemMatcher": []
    };
    tasks.push(terminate);
    //#endregion

    //#region ng serve task
    const templateNgServeTask = (project?: Project) => {
      const ngServeTask = {
        "label": "Ng Serve",
        "type": "shell",
        "command": "tnp build",
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
      if (project) {
        ngServeTask.label = `${ngServeTask.label} for ${project.name}`;
        ngServeTask.command = `${ngServeTask.command} ${project.name}`;
      }
      return ngServeTask;
    }
    //#endregion

    if (this.isWorkspace) {
      //#region handle worksapce
      this.children
        .filter(c => c.typeIs('angular-lib'))
        .forEach(c => {
          tasks.push(templateNgServeTask(c))
        })
      //#endregion
    } else {
      //#region handle standalone and workspace childs
      if (this.typeIs('angular-lib', 'isomorphic-lib')) {
        tasks.push(templateNgServeTask());
      }
      //#endregion
    }

    return JSON.stringify({
      "version": "2.0.0",
      tasks,
      inputs
    })
  }


  temlateOfLaunchJSON(this: Project, currentWorkspaceConfig: Models.env.EnvConfig) {
    let configurations = [];
    let compounds: { name: string; configurations: any[] }[] = [];

    //#region template attach process
    const temlateAttachProcess = {
      "type": "node",
      "request": "attach",
      "name": "Attach to global cli tool",
      "port": 9229,
      "skipFiles": [
        "<node_internals>/**"
      ]
    };
    //#endregion

    //#region tempalte start normal nodejs server
    const templateForServer = (serverChild: Project, clientProject: Project, workspaceLevel: boolean) => {
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
        let cwd = '${workspaceFolder}' + `/../${serverChild.name}`;
        if (workspaceLevel) {
          cwd = '${workspaceFolder}' + `/${serverChild.name}`;
        }
        startServerTemplate.program = cwd + '/run.js';
        startServerTemplate.cwd = cwd;
      }
      if ((serverChild.location === clientProject.location) && serverChild.isStandaloneProject) {
        startServerTemplate.name = `${startServerTemplate.name} standalone`
      } else {
        startServerTemplate.name = `${startServerTemplate.name} ${serverChild.name} for ${clientProject.name}`
      }
      startServerTemplate.args.push(`--ENVoverride=${encodeURIComponent(JSON.stringify({
        clientProjectName: clientProject.name
      } as Models.env.EnvConfig, null, 4))}`);
      return startServerTemplate;
    };
    //#endregion

    //#region tempalte start nodemon nodejs server
    function startNodemonServer() {
      const result = {
        "type": "node",
        "request": "launch",
        "remoteRoot": "${workspaceRoot}",
        "localRoot": "${workspaceRoot}",
        "name": "Launch Nodemon server",
        "runtimeExecutable": "nodemon",
        "program": "${workspaceFolder}/run.js",
        "restart": true,
        "sourceMaps": true,
        "console": "internalConsole",
        "internalConsoleOptions": "neverOpen",
        "runtimeArgs": [
          "--experimental-worker"
        ]
      };
      return result;
    }
    //#endregion

    //#region  tempalte start ng serve
    function startNgServeTemplate(servePort: number, workspaceChild: Project, workspaceLevel: boolean) {
      const result = {
        "name": "Debugger with ng serve",
        "type": "chrome",
        "request": "launch",
        cwd: void 0,
        // "userDataDir": false,
        "preLaunchTask": "Ng Serve",
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
      if (workspaceLevel) {
        result.preLaunchTask = `${result.preLaunchTask} for ${workspaceChild.name}`;
      }
      return result;
    };
    //#endregion

    if (this.isWorkspace) {
      //#region handle workspace
      const servers = this.children
        .filter(c => c.typeIs('isomorphic-lib'));
      const clients = this.children
        .filter(c => c.typeIs('angular-lib'));

      const serverConfigs = [];
      servers.forEach(server => {
        clients.forEach(client => {
          serverConfigs.push(templateForServer(server, client, true))
        });
      });

      const clientConfigs = clients.map(c => {
        const servePort = getPort(c, currentWorkspaceConfig);
        return startNgServeTemplate(servePort, c, true);
      });

      configurations = [
        ...clientConfigs,
        ...serverConfigs,
      ];

      configurations.forEach(c => {
        c.presentation = {
          // "hidden": true
          // "order": 1,
          // "group": "configs"
        }
      });


      clients.forEach(c => {
        const requiredServersForClient = [
          ...c.workspaceDependencies,
          ...c.workspaceDependenciesServers,
        ].filter(s => s.typeIs('isomorphic-lib'))
          .map(s => s.name);

        const serversForClient = serverConfigs
          .filter(s => {
            return requiredServersForClient.filter(r => {
              return (s.name as string).endsWith(`${r} for ${c.name}`)
            }).length > 0;
          })
          .map(s => s.name)

        compounds.push({
          name: `Debug backend/frontend - ${c.name} ( ${[
            ...c.workspaceDependencies,
            ...c.workspaceDependenciesServers,
          ].map(d => d.name).join(', ')} )`,
          configurations: [
            `Debugger with ng serve for ${c.name}`,
            ...serversForClient,
          ]
        })
      });

      //#endregion
    } else {
      //#region handle standalone or worksapce child
      if (this.typeIs('angular-lib')) {
        const servePort = getPort(this, currentWorkspaceConfig);
        configurations = [
          startNgServeTemplate(servePort, void 0, false)
        ];

        if (this.isWorkspaceChildProject) {

          this.parent.children
            .filter(c => c.typeIs('isomorphic-lib'))
            .forEach(c => {
              configurations.push(templateForServer(c, this, false));
            })

          configurations.forEach(c => {
            c.presentation = {
              // "hidden": true
              // "order": 1,
              "group": "configs"
            }
          });

        }

        if (!(this.isStandaloneProject && this.typeIs('angular-lib'))) {
          compounds.push({
            name: 'Debug backend/frontend',
            configurations: [
              ...configurations.map(c => c.name)
            ]
          });
        };

      }
      if (this.typeIs('isomorphic-lib')) {
        configurations = [
          // startNodemonServer()
        ];
        if (this.isStandaloneProject) {
          configurations.push(templateForServer(this, this, false));
          configurations.push(startNgServeTemplate(9000, void 0, false));
          compounds.push({
            name: 'Debug backend/frontend',
            configurations: [
              ...configurations.map(c => c.name)
            ]
          });
          configurations.push(temlateAttachProcess);
        }
        //#region start serve for each agnular-lib ?
        if (this.isWorkspaceChildProject) {

          this.parent.children
            .filter(c => c.typeIs('angular-lib', 'isomorphic-lib'))
            .forEach(c => {
              const t = templateForServer(this, c, false);
              t['presentation'] = {
                group: 'workspaceServers'
              }
              configurations.push(t);
            })

        }
        //#endregion
      }
      //#endregion
    }
    return JSON.stringify({
      version: "0.2.0",
      configurations,
      compounds
    });
  }
  // export interface VscodeProject extends Partial<Project> { }
}

function getPort(project: Project, workspaceConfig: Models.env.EnvConfig) {
  if (!workspaceConfig) {
    console.log('not working !')
  }
  let env: Models.env.EnvConfigProject;
  if (project.isWorkspace) {
    env = workspaceConfig.workspace?.workspace;
  } else {
    env = workspaceConfig.workspace?.projects?.find(p => p.name === project.name);
  }
  const envPort = env?.port;
  return _.isNumber(envPort) ? envPort : project.getDefaultPort();
}
