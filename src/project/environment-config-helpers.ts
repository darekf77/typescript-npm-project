//#region @backend
import * as _ from 'lodash';
import chalk from 'chalk';
import * as path from 'path';
import * as fse from 'fs-extra';
// local
import globalConfig, { allowedEnvironments } from '../config';
import { EnvConfig, EnvironmentName, EnvConfigProject } from '../models';
import { error, warn } from '../messages';
import { ProjectFrom } from './index';
import { ProxyRouter } from './proxy-router';
import { Project } from './base-project';
import { HelpersLinks } from '../helpers-links';
import { walkObject } from '../helpers';


export const tmpEnvironmentFileName = 'tmp-environment.json';



export const schema: EnvConfig = {
  workspace: {
    workspace: {
      baseUrl: '/info',
      name: 'workspace-name',
      port: 5000
    },
    projects: [
      {
        baseUrl: '/some-api-endpoint',
        name: 'project-name-in-workspace',
        port: 3000
      },
      {
        baseUrl: '/',
        name: 'other-example-projet-name',
        port: 4000
      }
    ]
  }
}

export function err(workspaceConfig: EnvConfig) {
  error(`Please follow worksapce schema:\n${chalk.bold(JSON.stringify(schema, null, 4))}
  \n
  \n your config\n : ${JSON.stringify(workspaceConfig, null, 4)}
      `)
}

export function validateWorkspaceConfig(workspaceConfig: EnvConfig) {

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
  walkObject(c, (lodashPath, isPrefixed) => {
    if (isPrefixed) {
      _.set(c, lodashPath, null)
    }
  })
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
  }
}





export const existedConfigs = {} as { [workspacePath in string]: EnvConfig; }


export function workspaceConfigBy(workspace: Project, environment: EnvironmentName): EnvConfig {
  let config: EnvConfig;

  const alreadyExistProject = (workspace && workspace.isWorkspace) ? existedConfigs[workspace.location] : null;

  // console.log('alreadyExistedWorksapceConfig', alreadyExistedWorksapceConfig)


  if (!workspace.isWorkspace) {
    error(`Funciton only accessible from workspace type project`);
  }

  if (_.isObject(alreadyExistProject) && alreadyExistProject !== null) {
    config = alreadyExistProject;
    // console.log('Already exist workspaceconfig ', EnvironmentConfig.woksapaceConfigs)
  } else {
    const envSurfix = (environment === 'local') ? '' : `.${environment}`;
    let pathToProjectEnvironment = path.join(workspace.location, `environment${envSurfix}`);

    if (!fse.existsSync(`${pathToProjectEnvironment}.js`)) {
      error(`Workspace ${workspace.location}
        ...without environment${envSurfix}.js config.`);
    }

    try {
      config = require(pathToProjectEnvironment) as any;
    } catch (error) {
      if (workspace.isSite) { // QUICK_FIX to get in site child last worksapce changes
        console.log('INIT WORKSPACE , BUT RECREATE IT FIRST')
        workspace.join.init() // fix for recreating site
      }
      config = require(pathToProjectEnvironment) as any;
    }

  }
  validateWorkspaceConfig(config);
  existedConfigs[workspace.location] = config;


  return config;
}


//#endregion
