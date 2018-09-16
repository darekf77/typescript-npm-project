//#region @backend
import * as _ from 'lodash';
import chalk from 'chalk';
import * as path from 'path';
import * as fse from 'fs-extra';
// local
import globalConfig, { allowedEnvironments } from '../config';
import { EnvConfig, EnvironmentName } from '../models';
import { error, warn } from '../messages';
import { ProjectFrom } from './index';
import { ProxyRouter } from './proxy-router';
import { Project } from './base-project';
import { HelpersLinks } from '../helpers-links';
import { walkObject } from '../helpers';

const tmpEnvironmentFileNameBE = 'tmp-environment-be.json';
const tmpEnvironmentFileNameFE = 'tmp-environment-fe.json';
export const tmpEnvironmentFileName = 'tmp-environment.json';

const environmentWithGeneratedIps: EnvironmentName[] = ['prod', 'stage'];

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

export async function overrideWorksapceRouterPort(workspaceProjectLocation: string, workspaceConfig: EnvConfig, allIpsGeneratedDynamicly: boolean = false) {
  if (workspaceConfig.workspace && workspaceConfig.workspace.workspace) {
    const p = ProjectFrom(workspaceProjectLocation)
    if (p) {
      if (allIpsGeneratedDynamicly) {
        const port = await ProxyRouter.getFreePort();
        console.log(`Overrided/Generated port from ${p.getDefaultPort()} to ${port} in project: ${p.name}`)
        p.setDefaultPort(port);
        workspaceConfig.workspace.workspace.port = port;
      } else {
        const port = Number(workspaceConfig.workspace.workspace.port);
        if (!isNaN(port)) {
          console.log(`Overrided port from ${p.getDefaultPort()} to ${port} in project: ${p.name}`)
          p.setDefaultPort(port)
        }
      }
    }
  } else {
    warn(`Router (worksapce) port is not defined in your environment.js `);
  }

}


export async function overrideDefaultPortsAndWorkspaceConfig(
  workspaceProjectLocation: string,
  workspaceConfig: EnvConfig,
  args: string
) {


  let allIpsGeneratedDynamicly = false;
  if (_.isString(args)) {
    let { env, generateIps }: { env: EnvironmentName, generateIps: boolean } = require('minimist')(args.split(' '));

    if (allowedEnvironments.includes(env)) {
      workspaceConfig.name = env;
    }
    console.log(`typeof generateIps`, typeof generateIps)
    allIpsGeneratedDynamicly = (environmentWithGeneratedIps.includes(env)) || generateIps;
  }


  await overrideWorksapceRouterPort(workspaceProjectLocation, workspaceConfig, allIpsGeneratedDynamicly)

  const overridedProjectsName: string[] = []
  workspaceConfig.workspace.workspace.port

  for (let i = 0; i < workspaceConfig.workspace.projects.length; i++) {
    const d = workspaceConfig.workspace.projects[i];
    let port = Number(d.port);
    if (!_.isNaN(port)) {
      const p = ProjectFrom(path.join(workspaceProjectLocation, d.name))
      if (p === undefined) {
        error(`Undefined project: ${d.name} inside environment.js workpace.projects`);
      } else {
        overridedProjectsName.push(d.name)
        if (allIpsGeneratedDynamicly) {
          port = await ProxyRouter.getFreePort();
          console.log(`Overrided/Generated port from ${p.getDefaultPort()} to ${port} in project: ${p.name}`)
          p.setDefaultPort(port);
          d.port = port;
        } else {
          console.log(`Overrided port from ${p.getDefaultPort()} to ${port} in project: ${p.name}`)
          p.setDefaultPort(port);
        }

      }
    }
  }

  const workspace = ProjectFrom(workspaceProjectLocation)
  workspace.children.forEach(childProject => {
    if (!overridedProjectsName.includes(childProject.name)) {
      childProject.setDefaultPortByType()
    }
  })
}


function removeIfExist(file: string) {
  if (fse.existsSync(file)) {
    fse.unlinkSync(file)
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

export function saveConfigFor(project: Project, workspaceConfig: EnvConfig) {

  if (project.isWorkspace) {
    const tmpEnvironmentPathBE = path.join(project.location, tmpEnvironmentFileNameBE)

    removeIfExist(tmpEnvironmentPathBE)
    fse.writeFileSync(tmpEnvironmentPathBE, JSON.stringify(workspaceConfig, null, 4), {
      encoding: 'utf8'
    })
    const tmpEnvironmentPathFE = path.join(project.location, tmpEnvironmentFileNameFE)
    removeIfExist(tmpEnvironmentPathFE);
    fse.writeFileSync(tmpEnvironmentPathFE, JSON.stringify(frontendCuttedVersion(workspaceConfig), null, 4), {
      encoding: 'utf8'
    })

  } else if (project.isWorkspaceChildProject) {

    const tmpEnvironmentParentPathBE = path.join(project.parent.location, tmpEnvironmentFileNameBE)
    const tmpEnvironmentParentPathFE = path.join(project.parent.location, tmpEnvironmentFileNameFE)

    if (!fse.existsSync(tmpEnvironmentParentPathBE) || !fse.existsSync(tmpEnvironmentParentPathFE)) {
      saveConfigFor(project.parent, workspaceConfig);
    }

    const tmpEnvironmentPath = path.join(project.location, tmpEnvironmentFileName)
    removeIfExist(tmpEnvironmentPath);

    if (project.type === 'angular-client' || project.type === 'angular-lib') {
      HelpersLinks.createLink(tmpEnvironmentPath, tmpEnvironmentParentPathFE);
    } else if (project.type === 'isomorphic-lib') {
      HelpersLinks.createLink(tmpEnvironmentPath, tmpEnvironmentParentPathBE);
    }
  }
}



//#endregion
