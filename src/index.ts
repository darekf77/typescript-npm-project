//#region @backend
export { start } from './start.backend';
import { Ora } from 'ora';
//#endregion
import { Models } from 'tnp-models';

export * from './global-typings';
export type EnvConfig = Models.env.EnvConfig;
export type EnvironmentName = Models.env.EnvironmentName;
export type IProject = Models.other.IProject;

export * from './config';
export * from 'tnp-helpers'
export * from 'tnp-models';
export * from './project';
//#region @backend
export * from 'tnp-db';
export * from './project/compilers/build-isomorphic-lib';

//#endregion
export * from './progress-output';

//#region @backend
import { config } from './environment-config';
export default { config };
//#endregion
