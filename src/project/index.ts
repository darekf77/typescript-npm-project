import * as fs from 'fs';
import * as path from 'path';
import { Project } from './base-project';
import { PackageJSON } from './package-json';
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
import { run } from '../process';

export * from './base-project';
export * from './base-project-lib';
export * from './project-angular-client';
export * from './project-angular-client-cli';
export * from './project-angular-lib';
export * from './project-docker';
export * from './project-ionic-client';
export * from './project-isomorphic-lib';
export * from './project-server-lib';
export * from './project-workspace';

function typeFrom(location: string): LibType {
    const packageJson = PackageJSON.from(location);
    let type = packageJson.type;
    return type;
}

export function ProjectFrom(location: string, parent?: Project): Project {
    // console.log('PROJECT FROM', location)
    const alreadyExist = Project.projects.find(l => l.location.trim() === location.trim());
    if (alreadyExist) return alreadyExist;
    if (!fs.existsSync(location)) return;
    if (!PackageJSON.from(location)) return;
    const type = typeFrom(location);
    // console.log('type', type)
    // console.log('location', location)
    // process.exit(1)
    let resultProject: Project;
    if (type === 'isomorphic-lib') resultProject = new ProjectIsomorphicLib(location);
    if (type === 'angular-lib') resultProject = new ProjectAngularLib(location);
    if (type === 'angular-client') resultProject = new ProjectAngularClient(location);
    if (type === 'workspace') resultProject = new ProjectWorkspace(location);
    if (type === 'docker') resultProject = new ProjectDocker(location);
    if (type === 'server-lib') resultProject = new ProjectServerLib(location);
    if (type === 'angular-cli') resultProject = new ProjectAngularCliClient(location);
    if (type === 'ionic-client') resultProject = new ProjectIonicClient(location);
    // console.log(resultProject ? (`PROJECT ${resultProject.type} in ${location}`)
    //     : ('NO PROJECT FROM LOCATION ' + location))
    
    return resultProject;
}


