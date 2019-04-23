//#region @backend
import * as fs from 'fs';
import * as _ from 'lodash';
import * as path from 'path';
import { Project } from './base-project';
import { PackageJSON } from './features/package-json';
import { ProjectIsomorphicLib } from './project-isomorphic-lib';
import { ProjectAngularLib } from './project-angular-lib';
import { ProjectAngularClient } from './project-angular-client';
import { ProjectWorkspace } from './project-workspace';
import { ProjectDocker } from './project-docker';
import { ProjectServerLib } from './project-server-lib';
import { ProjectAngularCliClient } from './project-angular-client-cli';
import { ProjectIonicClient } from './project-ionic-client';
import { LibType } from '../models';
import config from '../config';

import { error } from '../helpers';
import { UnknowNpmProject } from './project-unknow-npm';
import { ProjectContainer } from './project-container';
//#endregion
export * from './base-project';
export * from './base-project-lib';
export * from './project-isomorphic-lib';
export * from './features/package-json';

//#region @backend
export * from './features/baseline-site-join';
export * from './project-angular-client';
export * from './project-angular-client-cli';
export * from './project-angular-lib';
export * from './project-docker';
export * from './project-ionic-client';
export * from './project-server-lib';
export * from './project-workspace';
export * from './project-container';

function typeFrom(location: string): LibType {
  const packageJson = PackageJSON.fromLocation(location);
  let type = packageJson.type;
  return type;
}

export function ProjectFrom(location: string, warnings = false): Project {

  if (!_.isString(location)) {
    return
    // error(`ProjectFrom: Value is not a string: ${location}`)
  }

  location = path.resolve(location);


  const alreadyExist = Project.projects.find(l => l.location.trim() === location.trim());
  if (alreadyExist) return alreadyExist;
  if (!fs.existsSync(location)) {
    warnings && console.warn(`ProjectFrom: Cannot find project in location: ${location}`)
    return;
  }
  if (!PackageJSON.fromLocation(location)) {
    warnings && console.warn(`ProjectFrom: Cannot find package.json in location: ${location}`)
    return
  };
  const type = typeFrom(location);
  // console.log('type', type)
  // console.log('location', location)

  let resultProject: Project;
  if (type === 'isomorphic-lib') resultProject = new ProjectIsomorphicLib(location);
  if (type === 'angular-lib') resultProject = new ProjectAngularLib(location);
  if (type === 'angular-client') resultProject = new ProjectAngularClient(location);
  if (type === 'workspace') resultProject = new ProjectWorkspace(location);
  if (type === 'docker') resultProject = new ProjectDocker(location);
  if (type === 'server-lib') resultProject = new ProjectServerLib(location);
  if (type === 'angular-cli') resultProject = new ProjectAngularCliClient(location);
  if (type === 'ionic-client') resultProject = new ProjectIonicClient(location);
  if (type === 'unknow-npm-project') resultProject = new UnknowNpmProject(location);
  if (type === 'container') resultProject = new ProjectContainer(location);
  // console.log(resultProject ? (`PROJECT ${resultProject.type} in ${location}`)
  //     : ('NO PROJECT FROM LOCATION ' + location))

  warnings && console.log(`Result project: ${resultProject.name}`)
  return resultProject;
}


export function nearestProjectTo(location: string) {
  // console.log('nearestPorjectLocaiont', location)
  const project = ProjectFrom(location);
  if (project) {
    return project;
  }
  location = path.join(location, '..');
  if (!fs.existsSync(location)) return undefined;
  return ProjectFrom(path.resolve(location));
}

//#endregion
