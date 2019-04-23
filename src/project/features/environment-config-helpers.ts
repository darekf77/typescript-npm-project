//#region @backend
import * as _ from 'lodash';
import chalk from 'chalk';
import * as path from 'path';
import * as fse from 'fs-extra';
// local
import { config } from '../../config';
import { EnvConfig, EnvironmentName, EnvConfigProject } from '../../models';
import { error, warn } from '../../helpers';
import { ProjectFrom } from '../index';
import { ProxyRouter } from './proxy-router';
import { Project } from '../base-project';
import { walk } from 'lodash-walk-object';
import { config as schemaConfig } from '../../environment-config';
import { terminalLine } from '../../helpers';



export const tmpEnvironmentFileName = config.file.tnpEnvironment_json;



export function err(workspaceConfig: EnvConfig, fileContent?: string) {

  let configString = fileContent ? fileContent : `
  ...
${chalk.bold(JSON.stringify(workspaceConfig, null, 4))}
  ...
  `

  error(`Please follow worksapce environment config schema:\n
${terminalLine()}
  let { config } = require('tnp-bundle/environment-config')

  config = ${chalk.bold(JSON.stringify(schemaConfig, null, 4))}

  module.exports = exports = { config };
${terminalLine()}

Your config:
${terminalLine()}
${configString}
${terminalLine()}
`)
}

export function validateWorkspaceConfig(workspaceConfig: EnvConfig, filePath: string) {
  if (!_.isObject(workspaceConfig)) {
    err(undefined, fse.readFileSync(filePath, 'utf8'));
  }
  if (!_.isObject(_.get(workspaceConfig, 'workspace'))) err(workspaceConfig);
  if (!_.isArray(_.get(workspaceConfig, 'workspace.projects'))) err(workspaceConfig)
  workspaceConfig.workspace.projects.forEach(p => {
    if (_.isUndefined(p.name)) err(workspaceConfig)
    if (_.isUndefined(p.port)) err(workspaceConfig)
    if (_.isUndefined(p.baseUrl)) err(workspaceConfig)
  });

  if (_.isUndefined(_.get(workspaceConfig, 'workspace.build'))) {
    workspaceConfig.workspace.build = {
      browser: {
        aot: false,
        minify: false,
        production: false
      },
      server: {
        minify: false,
        production: false
      }
    }
  }
  if (!_.isObject(_.get(workspaceConfig, 'workspace.build'))) {
    err(workspaceConfig)
  }

}

export interface OverridePortType {
  workspaceProjectLocation: string;
  workspaceConfig: EnvConfig;
}

async function handleProject(project: Project, configProject: EnvConfigProject, generatePorts) {
  if (generatePorts) {
    const port = await ProxyRouter.getFreePort();
    // console.log(`Overrided/Generated port from ${project.getDefaultPort()} to ${port} in project: ${project.name}`)
    project.setDefaultPort(port);
    configProject.port = port;
  } else {
    const port = Number(configProject.port);
    if (!isNaN(port)) {
      if (port != project.getDefaultPort()) {
        // console.log(`Overrided port from ${project.getDefaultPort()} to ${port} in project: ${project.name}`)
      }
      project.setDefaultPort(port)
    } else {
      project.setDefaultPortByType()
      // console.log(`Default port ${project.getDefaultPort()} is set to project: ${project.name}`)
    }
  }
}

export async function overrideWorksapceRouterPort(options: OverridePortType, generatePorts = true) {
  const { workspaceProjectLocation, workspaceConfig } = options;

  if (!workspaceConfig.workspace || !workspaceConfig.workspace.workspace) {
    err(workspaceConfig);
  }

  const project = ProjectFrom(workspaceProjectLocation)
  if (project === undefined) {
    error(`Router (worksapce) port is not defined in your environment.js `);
  }

  const configProject = workspaceConfig.workspace.workspace;

  await handleProject(project, configProject, generatePorts && workspaceConfig.dynamicGenIps);

}



export async function overrideDefaultPortsAndWorkspaceConfig(options: OverridePortType, generatePorts = true) {

  const { workspaceProjectLocation, workspaceConfig } = options;

  workspaceConfig.workspace.workspace.port

  for (let i = 0; i < workspaceConfig.workspace.projects.length; i++) {
    const configProject = workspaceConfig.workspace.projects[i];
    const project = ProjectFrom(path.join(workspaceProjectLocation, configProject.name))
    if (project === undefined) {
      error(`Undefined project: ${configProject.name} inside environment.js workpace.projects`);
    }
    await handleProject(project, configProject, generatePorts && workspaceConfig.dynamicGenIps)
  }
}


function frontendCuttedVersion(workspaceConfig: EnvConfig) {
  const c = _.cloneDeep(workspaceConfig);
  // walk.Object(c, (lodashPath, isPrefixed) => { // TODO CUT PREFIXED!!!!
  //   if (isPrefixed) {
  //     _.set(c, lodashPath, null)
  //   }
  // })
  return c;
}

export function saveConfigWorkspca(project: Project, workspaceConfig: EnvConfig) {
  workspaceConfig.currentProjectName = project.name;
  const tmpEnvironmentPath = path.join(project.location, tmpEnvironmentFileName)

  if (project.isWorkspace) {

    fse.writeJSONSync(tmpEnvironmentPath, workspaceConfig, {
      encoding: 'utf8',
      spaces: 2
    })
    console.log('config saved in worksapce', tmpEnvironmentPath)

    project.children.forEach(p => {
      saveConfigWorkspca(p, workspaceConfig);
    })

  } else if (project.isWorkspaceChildProject) {

    if (project.type === 'angular-client' || project.type === 'angular-lib') {
      fse.writeJSONSync(tmpEnvironmentPath, frontendCuttedVersion(workspaceConfig), {
        encoding: 'utf8',
        spaces: 2
      })
    } else if (project.type === 'isomorphic-lib' || project.type === 'server-lib') {
      fse.writeJSONSync(tmpEnvironmentPath, workspaceConfig, {
        encoding: 'utf8',
        spaces: 2
      })
    }

    console.log('config saved in child', tmpEnvironmentPath)

  }
}





export const existedConfigs = {} as { [workspacePath in string]: EnvConfig; }


export async function workspaceConfigBy(workspace: Project, environment: EnvironmentName): Promise<EnvConfig> {
  let configWorkspaceEnv: EnvConfig;

  const alreadyExistProject = (workspace && workspace.isWorkspace) ? existedConfigs[workspace.location] : null;

  // console.log('alreadyExistedWorksapceConfig', alreadyExistedWorksapceConfig)


  if (!workspace.isWorkspace) {
    error(`Funciton only accessible from workspace type project`);
  }

  if (_.isObject(alreadyExistProject) && alreadyExistProject !== null) {
    configWorkspaceEnv = alreadyExistProject;
    // console.log('Already exist workspaceconfig ', EnvironmentConfig.woksapaceConfigs)
  } else {
    const envSurfix = (environment === 'local') ? '' : `.${environment}`;
    var pathToProjectEnvironment = path.join(workspace.location, `${config.file.environment}${envSurfix}`);
    console.log('pathToProjectEnvironment:', pathToProjectEnvironment)

    if (workspace.isSite) {
      if (!fse.existsSync(`${pathToProjectEnvironment}.js`)) {
        console.log(`[SITE QUICKFIX] File doesnt exist: ${pathToProjectEnvironment}.js`)
        try {
          if (workspace.isSite) { // QUICK_FIX to get in site child last worksapce changes
            console.log('[SITE QUICKFIX] INIT WORKSPACE , BUT RECREATE IT FIRST')
            const w = workspace.join.joinNotAllowed
            workspace.join.joinNotAllowed = false;
            await workspace.join.init()
            workspace.join.joinNotAllowed = w;
          }
        } catch (e) {
          error(e)
        }
      }
    }

    if (!fse.existsSync(`${pathToProjectEnvironment}.js`)) {
      error(`Workspace ${workspace.location}
        ...without environment${envSurfix}.js config.`);
    }

    // try {
    configWorkspaceEnv = require(pathToProjectEnvironment).config as any;
    // console.log('configWorkspaceEnv', configWorkspaceEnv)
    // } catch (error) {
    //   if (workspace.isSite) { // QUICK_FIX to get in site child last worksapce changes
    //     console.log('INIT WORKSPACE , BUT RECREATE IT FIRST')
    //     workspace.join.init() // fix for recreating site
    //   }
    //   config = require(pathToProjectEnvironment).config as any;
    // }

  }
  validateWorkspaceConfig(configWorkspaceEnv, `${pathToProjectEnvironment}.js`);
  existedConfigs[workspace.location] = configWorkspaceEnv;


  return configWorkspaceEnv;
}


//#endregion
