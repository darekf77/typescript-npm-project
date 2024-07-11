import type { Project } from './project';
import { BaseLibraryBuild } from 'tnp-helpers/src';

/**
 * @ignore this is only for angular/typescript projects - not isomorphic projects
 */
export class LibraryBuild extends BaseLibraryBuild<Project> {}
