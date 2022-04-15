//#region imports
import { fse } from 'tnp-core'
import { path } from 'tnp-core'
import { _ } from 'tnp-core';
import chalk from 'chalk';
import * as json5 from 'json5';

import { Project } from './project';
import { Helpers } from 'tnp-helpers';
import { Morphi } from 'morphi';
import { Models } from 'tnp-models';
import { config } from 'tnp-config';
//#endregion

const runtimeArgs = [
  "--nolazy",
  "-r",
  "ts-node/register",
  "--experimental-worker"
];

export abstract class VscodeProject {

  //#region getters
  //#region getters / vscode *.filetemplae
  // @ts-ignore
  get vscodeFileTemplates(this: Project) {
    if (this.frameworkVersionAtLeast('v2')) {
      return [
        '.vscode/launch.json.filetemplate',
        '.vscode/tasks.json.filetemplate',
      ];
    }
    return [];
  }
  //#endregion

  //#region getters / name of workspace
  // @ts-ignore
  private get nameOfCodeWorkspace(this: Project) {
    return `tmp.code-workspace`;
  }
  //#endregion

  //#endregion

  //#region public api

  //#region public api / recreate settings worksapce
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

  }

  //#endregion

  //#region public api / open in vscode
  public openInVscode(this: Project) {
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
  }
  //#endregion

  //#region public api /  get template pf tasls json
  getTemlateOfTasksJSON(this: Project, currentWorkspaceConfig: Models.env.EnvConfig) {
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
      'id': 'terminate',
      'type': 'command',
      'command': 'workbench.action.tasks.terminate',
      'args': 'terminateAll'
    };
    inputs.push(templateTerminalAllTasks);

    const terminate = {
      'label': 'terminateall',
      'command': 'echo ${input:terminate}',
      'type': 'shell',
      'problemMatcher': []
    };
    tasks.push(terminate);
    //#endregion

    //#region ng serve task
    const templateNgServeTask = (project?: Project) => {
      const ngServeTask = {
        'label': 'Ng Serve',
        'type': 'shell',
        'command': config.frameworkName + ' build', // TODO how to decide when to user firedev
        'isBackground': true,
        'presentation': {
          'reveal': 'always'
        },
        'group': {
          'kind': 'build',
          'isDefault': true
        },
        'problemMatcher': {
          'owner': 'typescript',
          'source': 'ts',
          'applyTo': 'closedDocuments',
          'fileLocation': [
            'relative',
            '${cwd}'
          ],
          'pattern': '$tsc',
          'background': {
            'activeOnStart': true,
            'beginsPattern': {
              'regexp': '(.*?)'
            },
            'endsPattern': {
              'regexp': 'Compiled |Failed to compile.'
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
      'version': '2.0.0',
      tasks,
      inputs
    })
  }
  //#endregion

  public static launchFroSmartContaienr(container: Project) {
    if (!container.isSmartContainer) {
      return;
    }

    const configurations = container.children.filter(f => {
      return f.frameworkVersionAtLeast('v3') && f.typeIs('isomorphic-lib');
    }).map(c => {
      return {
        "type": "node",
        "request": "launch",
        "name": `Launch Server @${container.name}/${c.name}`,
        "cwd": "${workspaceFolder}" + `/dist/${container.name}/${c.name}`,
        "program": "${workspaceFolder}" + `/dist/${container.name}/${c.name}/run.js`,
        "args": [
        ],
        "outFiles": [
          "${workspaceFolder}" + `/dist/${container.name}/${c.name}/dist/**/*.js`
        ],
        runtimeArgs,
        "presentation": {
          "group": "workspaceServers"
        }
      }
    })

    const temlateSmartContine = {
      "version": "0.2.0",
      configurations,
      // "compounds": []
    };
    const launchJSOnFilePath = path.join(container.location, '.vscode/launch.json')
    Helpers.writeFile(launchJSOnFilePath, temlateSmartContine);
  }

  //#region public api / get template of launch.json
  getTemlateOfLaunchJSON(this: Project, currentWorkspaceConfig: Models.env.EnvConfig) {
    let configurations = [];
    let compounds: { name: string; configurations: any[] }[] = [];

    //#region template attach process
    const temlateAttachProcess = {
      'type': 'node',
      'request': 'attach',
      'name': 'Attach to global cli tool',
      'port': 9229,
      'skipFiles': [
        '<node_internals>/**'
      ],
      "outFiles": ["${workspaceFolder}/dist/**/*.js"]
    };
    //#endregion

    //#region tempalte start normal nodejs server
    const templateForServer = (serverChild: Project, clientProject: Project, workspaceLevel: boolean) => {
      const startServerTemplate = {
        'type': 'node',
        'request': 'launch',
        'name': 'Launch Server',
        'program': '${workspaceFolder}/run.js',
        'cwd': void 0,
        'args': [],
        "outFiles": ["${workspaceFolder}/dist/**/*.js"],
        runtimeArgs
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
        'type': 'node',
        'request': 'launch',
        'remoteRoot': '${workspaceRoot}',
        'localRoot': '${workspaceRoot}',
        'name': 'Launch Nodemon server',
        'runtimeExecutable': 'nodemon',
        'program': '${workspaceFolder}/run.js',
        'restart': true,
        'sourceMaps': true,
        'console': 'internalConsole',
        'internalConsoleOptions': 'neverOpen',
        runtimeArgs
      };
      return result;
    }
    //#endregion

    //#region  tempalte start ng serve
    function startNgServeTemplate(servePort: number, workspaceChild: Project, workspaceLevel: boolean) {
      const result = {
        'name': 'Debugger with ng serve',
        'type': 'chrome',
        'request': 'launch',
        cwd: void 0,
        // "userDataDir": false,
        'preLaunchTask': 'Ng Serve',
        'postDebugTask': 'terminateall',
        'sourceMaps': true,
        // "url": `http://localhost:${!isNaN(servePort) ? servePort : 4200}/#`,
        'webRoot': '${workspaceFolder}',
        'sourceMapPathOverrides': {
          'webpack:/*': '${webRoot}/*',
          '/./*': '${webRoot}/*',
          '/tmp-src/*': '${webRoot}/*',
          '/*': '*',
          '/./~/*': '${webRoot}/node_modules/*'
        }
      }
      if (workspaceChild) {
        result.cwd = '${workspaceFolder}' + `/${workspaceChild.name}`;
        result.webRoot = '${workspaceFolder}' + `/${workspaceChild.name}`;
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
              'group': 'configs'
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
      version: '0.2.0',
      configurations,
      compounds
    });
  }
  //#endregion

  //#endregion
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
