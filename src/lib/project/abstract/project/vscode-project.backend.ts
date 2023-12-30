//#region imports
import { fse } from 'tnp-core/src'
import { path } from 'tnp-core/src'
import { _ } from 'tnp-core/src';
import chalk from 'chalk';
import * as json5 from 'json5';

import { Project } from './project';
import { Helpers } from 'tnp-helpers/src';

import { Models } from 'tnp-models/src';
import { config } from 'tnp-config/src';
import { PortUtils } from '../../../constants';
//#endregion

const runtimeArgs = [
  "--nolazy",
  "-r",
  "ts-node/register",
  // "--preserve-symlinks", NOT WORKING
  // "--preserve-symlinks-main",NOT WORKING
  "--experimental-worker"
];

export abstract class VscodeProject {

  //#region getters
  //#region getters / vscode *.filetemplae
  // @ts-ignore
  get vscodeFileTemplates(this: Project) {
    if (this.frameworkVersionAtLeast('v2')) {
      return [
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


    //#region handle standalone and workspace childs
    if (this.typeIs('isomorphic-lib')) {
      tasks.push(templateNgServeTask());
    }
    //#endregion


    return JSON.stringify({
      'version': '2.0.0',
      tasks,
      inputs
    })
  }
  //#endregion

  //#region save launch json
  public saveLaunchJson(this: Project, basePort: number) {
    // console.log('WRITING HOSTS ')


    if (this.isSmartContainer) {
      //#region container save
      const container = this;
      const configurations = container.children.filter(f => {
        return f.frameworkVersionAtLeast('v3') && f.typeIs('isomorphic-lib');
      }).map((c, index) => {
        const backendPort = PortUtils(basePort).calculateFor.containerServer(index);
        c.writeFile('src/app.hosts.ts', PortUtils(basePort).tempalteFor(backendPort))
        return {
          "type": "node",
          "request": "launch",
          "name": `Launch Server @${container.name}/${c.name}`,
          "cwd": "${workspaceFolder}" + `/dist/${container.name}/${c.name}`,
          "program": "${workspaceFolder}" + `/dist/${container.name}/${c.name}/run-org.js`,
          "args": [
            `--child=${c.name}`,
            `--port=${backendPort}`
          ],
          // "sourceMaps": true,
          // "outFiles": [ // TODOD this is causing unbound breakpoing in thir party modules
          //   "${workspaceFolder}" + ` / dist / ${ container.name } / ${ c.name } / dist/**/ *.js`
          // ],
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
      //#endregion

    } else if (this.isStandaloneProject && !this.isSmartContainerTarget) {
      //#region standalone save

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
        // "outFiles": ["${workspaceFolder}/dist/**/*.js"] // not wokring for copy manager
      };
      //#endregion

      //#region tempalte start normal nodejs server
      const templateForServer = (serverChild: Project, clientProject: Project, workspaceLevel: boolean) => {
        const backendPort = PortUtils(basePort).calculateFor.standaloneServer;
        clientProject.writeFile('src/app.hosts.ts', PortUtils(basePort).tempalteFor(backendPort))
        const startServerTemplate = {
          'type': 'node',
          'request': 'launch',
          'name': 'Launch Server',
          'program': '${workspaceFolder}/run.js',
          'cwd': void 0,
          'args': [`port=${backendPort}`],
          // "outFiles": ["${workspaceFolder}/dist/**/*.js"], becouse of this debugging inside node_moudles
          // with compy manager created moduels does not work..
          runtimeArgs
        };
        if (serverChild.name !== clientProject.name) {
          let cwd = '${workspaceFolder}' + `/../ ${serverChild.name}`;
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
        } as Models.env.EnvConfig, null, 4))
          } `);
        return startServerTemplate;
      };
      //#endregion

      //#region tempalte start nodemon nodejs server
      const startNodemonServer = () => {
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

      const startNgServeTemplate = (servePort: number, workspaceChild: Project, workspaceLevel: boolean) => {
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

      //#region handle standalone or worksapce child
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
      }
      //#endregion

      const launchJSOnFilePath = path.join(this.location, '.vscode/launch.json');

      Helpers.writeJson(launchJSOnFilePath, {
        version: '0.2.0',
        configurations,
        compounds
      });
      //#endregion
    }

    // console.log('WRITING HOSTS DONE ');
    // Helpers.pressKeyAndContinue()
  }
  //#endregion
}
