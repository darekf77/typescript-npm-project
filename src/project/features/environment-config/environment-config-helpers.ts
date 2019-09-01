//#region @backend
import chalk from 'chalk';
import * as _ from 'lodash';
import * as path from 'path';
import * as fse from 'fs-extra';

import { config } from '../../../config';
import { Models } from '../../../models';
import { Helpers } from '../../../helpers';
import { ProxyRouter } from '../proxy-router';
import { Project } from '../../abstract';
import { config as schemaConfig } from './example-environment-config';




export const tmpEnvironmentFileName = config.file.tnpEnvironment_json;



export function err(workspaceConfig: Models.env.EnvConfig, fileContent?: string) {

  let configString = fileContent ? fileContent : `
  ...
${chalk.bold(JSON.stringify(workspaceConfig, null, 4))}
  ...
  `

  Helpers.error(`Please follow worksapce environment config schema:\n
${Helpers.terminalLine()}
  let { config } = require('tnp-bundle/environment-config')

  config = ${chalk.bold(JSON.stringify(schemaConfig, null, 4))}

  module.exports = exports = { config };
${Helpers.terminalLine()}

Your config:
${Helpers.terminalLine()}
${configString}
${Helpers.terminalLine()}
`)
}

export function validateWorkspaceConfig(workspaceConfig: Models.env.EnvConfig, filePath: string) {
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
  workspaceConfig: Models.env.EnvConfig;
}

async function handleProject(project: Project, configProject: Models.env.EnvConfigProject, generatePorts) {
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

  if (!workspaceConfig || !workspaceConfig.workspace || !workspaceConfig.workspace.workspace) {
    err(workspaceConfig);
  }

  const project = Project.From(workspaceProjectLocation)
  if (project === undefined) {
    Helpers.error(`Router (worksapce) port is not defined in your environment.js `);
  }

  const configProject = workspaceConfig.workspace.workspace;

  await handleProject(project, configProject, generatePorts && workspaceConfig.dynamicGenIps);

}



export async function overrideDefaultPortsAndWorkspaceConfig(options: OverridePortType, generatePorts = true) {

  const { workspaceProjectLocation, workspaceConfig } = options;

  workspaceConfig.workspace.workspace.port

  for (let i = 0; i < workspaceConfig.workspace.projects.length; i++) {
    const configProject = workspaceConfig.workspace.projects[i];
    const project = Project.From(path.join(workspaceProjectLocation, configProject.name))
    if (project === undefined) {
      Helpers.error(`Undefined project "${configProject.name}" inside environment.js workpace.projects`, false, true);
    }
    await handleProject(project, configProject, generatePorts && workspaceConfig.dynamicGenIps)
  }
}


function frontendCuttedVersion(workspaceConfig: Models.env.EnvConfig) {
  const c = _.cloneDeep(workspaceConfig);
  // walk.Object(c, (lodashPath, isPrefixed) => { // TODO CUT PREFIXED!!!!
  //   if (isPrefixed) {
  //     _.set(c, lodashPath, null)
  //   }
  // })
  return c;
}

export function saveConfigWorkspca(project: Project, workspaceConfig: Models.env.EnvConfig) {
  workspaceConfig.currentProjectName = project.name;
  workspaceConfig.currentProjectType = project.type;
  workspaceConfig.currentProjectLocation = project.location;
  workspaceConfig.currentProjectIsSite = project.isSite;
  workspaceConfig.frameworks = project.frameworks;
  const tmpEnvironmentPath = path.join(project.location, tmpEnvironmentFileName)

  if (project.isWorkspace) {

    fse.writeJSONSync(tmpEnvironmentPath, workspaceConfig, {
      encoding: 'utf8',
      spaces: 2
    })
    Helpers.log(`config saved in worksapce ${tmpEnvironmentPath}`)

    project.children.forEach(p => {
      saveConfigWorkspca(p, workspaceConfig);
    })

  } else if (project.isWorkspaceChildProject) {

    if (project.type === 'angular-client' || project.type === 'angular-lib' || project.type === 'ionic-client') {
      fse.writeJSONSync(tmpEnvironmentPath, frontendCuttedVersion(workspaceConfig), {
        encoding: 'utf8',
        spaces: 2
      })
      Helpers.log(`config saved for child ${tmpEnvironmentPath}`)
    } else if (project.type === 'isomorphic-lib') {
      fse.writeJSONSync(tmpEnvironmentPath, workspaceConfig, {
        encoding: 'utf8',
        spaces: 2
      })
      Helpers.log(`config saved for child ${tmpEnvironmentPath}`)
    } else {
      Helpers.log(`config not needed for child ${tmpEnvironmentPath}`)
    }



  }
}





export const existedConfigs = {} as {[workspacePath in string]: Models.env.EnvConfig; }


export async function workspaceConfigBy(workspace: Project, environment: Models.env.EnvironmentName): Promise<Models.env.EnvConfig> {
  let configWorkspaceEnv: Models.env.EnvConfig;

  const alreadyExistProject = (workspace && workspace.isWorkspace) ? existedConfigs[workspace.location] : null;

  // console.log('alreadyExistedWorksapceConfig', alreadyExistedWorksapceConfig)


  if (!workspace.isWorkspace) {
    Helpers.error(`Funciton only accessible from workspace type project`);
  }

  if (_.isObject(alreadyExistProject) && alreadyExistProject !== null) {
    configWorkspaceEnv = alreadyExistProject;
    // console.log('Already exist workspaceconfig ', EnvironmentConfig.woksapaceConfigs)
  } else {
    const envSurfix = (environment === 'local') ? '' : `.${environment}`;
    var pathToProjectEnvironment = path.join(workspace.location, `${config.file.environment}${envSurfix}`);
    Helpers.log('pathToProjectEnvironment:' + pathToProjectEnvironment)

    if (workspace.isSite) {
      if (!fse.existsSync(`${pathToProjectEnvironment}.js`)) {
        Helpers.log(`[SITE QUICKFIX] File doesnt exist: ${pathToProjectEnvironment}.js`)
        try {
          if (workspace.isSite) { // QUICK_FIX to get in site child last worksapce changes
            Helpers.log('[SITE QUICKFIX] INIT WORKSPACE , BUT RECREATE IT FIRST')
            await workspace.join.start(`QuickFix basleine/site join for "${workspace.genericName}"`);
          }
        } catch (e) {
          Helpers.error(e)
        }
      }
    }

    if (!fse.existsSync(`${pathToProjectEnvironment}.js`)) {
      Helpers.error(`Workspace ${workspace.location}
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
